import { Order, Cart, Product, User, Coupon, UserCoupon, sequelize, Sequelize } from '../models/index.js';
import { generateOrderNumber } from '../utils/helpers.js';

/**
 * @desc    Create new order from cart
 * @route   POST /api/orders
 * @access  Private (Customer)
 */
export const createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      shippingAddress,
      billingAddress,
      paymentMethod,
      notes,
      couponCode,
      deliveryType // new field
    } = req.body;

    // Validate shipping address
    if (!shippingAddress || typeof shippingAddress !== 'object') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    // Get user's cart
    const cart = await Cart.findOne({
      where: { userId: req.user.id },
      transaction
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Verify all items are available and prepare order items
    const orderItems = [];
    let totalPrice = 0;

    // Calculate shipping cost based on delivery type
    let shippingCost = deliveryType === 'express' ? 99.00 : 0.00;

    let taxAmount = 0; // NO TAX

    // Parse cart items if necessary
    let parsedItems = [];
    try {
      if (typeof cart.items === 'string') {
        parsedItems = JSON.parse(cart.items);
      } else if (Array.isArray(cart.items)) {
        parsedItems = cart.items;
      } else {
        parsedItems = [];
      }
    } catch (e) {
      console.error("Error parsing cart items:", e);
      parsedItems = [];
    }

    // Filter out invalid items (self-healing for corrupted carts)
    const validItems = parsedItems.filter(item =>
      item.productId &&
      item.productId !== 'undefined' &&
      item.productId !== 'null' &&
      !isNaN(parseInt(item.productId))
    );

    if (validItems.length !== parsedItems.length) {
      console.log(`🧹 cleaned ${parsedItems.length - validItems.length} corrupted items from cart`);
      cart.items = validItems;
      // Update cart in DB to make it permanent
      await Cart.update({ items: validItems }, { where: { id: cart.id }, transaction });

      if (validItems.length === 0) {
        await transaction.commit(); // Commit the cleanup
        return res.status(400).json({
          success: false,
          message: 'Cart contained invalid items and has been cleared. Please add products again.'
        });
      }
    }

    for (const item of validItems) {
      const product = await Product.findByPk(item.productId, { transaction });

      if (!product) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: `Product ${item.productId} not found`
        });
      }

      // Check stock availability (simple numeric stock check)
      const availableStock = product.stock;

      if (!product.availability || availableStock < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Product "${product.name}"${item.colorName ? ` (${item.colorName})` : ''} is out of stock or insufficient quantity. Available: ${availableStock}`
        });
      }

      const price = product.discountPrice || product.price;
      const itemTotal = price * item.quantity;

      // Get image for the specific color if available
      let itemImage = null;
      if (item.colorName && product.colorsAndImages && product.colorsAndImages[item.colorName]) {
        const colorImages = product.colorsAndImages[item.colorName];
        const mainImage = colorImages.find(img => img.type === 'main');
        itemImage = mainImage ? mainImage.url : (colorImages[0] ? colorImages[0].url : null);
      } else if (product.images && product.images.length > 0) {
        itemImage = product.images[0].url;
      } else if (product.colorsAndImages) {
        // Get first available color's main image
        const firstColor = Object.keys(product.colorsAndImages)[0];
        if (firstColor && product.colorsAndImages[firstColor].length > 0) {
          const mainImage = product.colorsAndImages[firstColor].find(img => img.type === 'main');
          itemImage = mainImage ? mainImage.url : product.colorsAndImages[firstColor][0].url;
        }
      }

      orderItems.push({
        productId: product.id,
        name: product.name,
        code: product.code,
        price,
        quantity: item.quantity,
        colorName: item.colorName || null,
        total: itemTotal,
        image: itemImage,
        variant: product.variant
      });

      totalPrice += itemTotal;
      // taxAmount += itemTotal * (product.tax || 0) / 100; // REMOVED TAX
    }

    // Apply coupon if provided
    let discountAmount = 0;
    let couponId = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        where: {
          code: couponCode,
          isActive: true,
          validFrom: { [Sequelize.Op.lte]: new Date() },
          validUntil: { [Sequelize.Op.gte]: new Date() }
        },
        transaction
      });

      if (coupon) {
        // Check usage limit
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Coupon usage limit reached'
          });
        }

        // Check minimum order amount
        if (coupon.minOrderAmount && totalPrice < coupon.minOrderAmount) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `Minimum order amount of ${coupon.minOrderAmount} required for this coupon`
          });
        }

        // Check if user has already used this coupon
        if (coupon.isSingleUse) {
          const userCoupon = await UserCoupon.findOne({
            where: {
              userId: req.user.id,
              couponId: coupon.id,
              isUsed: true
            },
            transaction
          });

          if (userCoupon) {
            await transaction.rollback();
            return res.status(400).json({
              success: false,
              message: 'Coupon already used'
            });
          }
        }

        // Calculate discount
        let discount = 0;
        if (coupon.discountType === 'percentage') {
          discount = (totalPrice * coupon.discountValue) / 100;
          if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount;
          }
        } else {
          discount = coupon.discountValue;
        }

        discountAmount = discount;
        couponId = coupon.id;

        // Mark coupon as used
        await UserCoupon.create({
          userId: req.user.id,
          couponId: coupon.id,
          isUsed: true,
          usedAt: new Date(),
          orderId: null // Will be updated after order creation
        }, { transaction });

        // Increment coupon usage count
        await coupon.increment('usedCount', { transaction });
      }
    }

    // Calculate final amount
    // Ensure accurate float math
    const finalAmount = Math.max(0, totalPrice + shippingCost + taxAmount - discountAmount);

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Create order
    const order = await Order.create({
      orderNumber,
      userId: req.user.id,
      orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      totalPrice,
      shippingCost,
      taxAmount,
      discountAmount,
      finalAmount,
      notes,
      couponId
    }, { transaction });

    // Deduct stock for all products in order (SIMPLE NUMERIC STOCK)
    for (const item of cart.items) {
      const product = await Product.findByPk(item.productId, { transaction });

      if (product) {
        // Simple numeric stock decrement
        const newStock = Math.max(0, product.stock - item.quantity);

        await product.update({
          stock: newStock,
          availability: newStock > 0
        }, { transaction });
      }
    }

    // Update coupon with order ID if used
    if (couponId) {
      await UserCoupon.update(
        { orderId: order.id },
        {
          where: {
            userId: req.user.id,
            couponId,
            orderId: null
          },
          transaction
        }
      );
    }

    // Clear cart
    await cart.update({
      items: [],
      totalAmount: 0
    }, { transaction });

    await transaction.commit();

    const orderResponse = order.toJSON();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: orderResponse
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating order',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @desc    Get user's orders
 * @route   GET /api/orders
 * @access  Private (Customer)
 */
export const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const where = { userId: req.user.id };
    if (status) where.orderStatus = status;

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']], // Changed from 'createdAt' to 'created_at'
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'phone']
        }
      ]
    });

    // Parse orderItems if they are strings (robustness fix)
    const validOrders = orders.map(order => {
      const plainOrder = order.toJSON();
      try {
        if (typeof plainOrder.orderItems === 'string') {
          plainOrder.orderItems = JSON.parse(plainOrder.orderItems);
        }
      } catch (e) {
        console.error(`Error parsing orderItems for order ${order.id}:`, e);
        plainOrder.orderItems = [];
      }
      return plainOrder;
    });

    res.status(200).json({
      success: true,
      data: {
        orders: validOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
};
/**
 * @desc    Get single order
 * @route   GET /api/orders/:id
 * @access  Private (Customer)
 */
export const getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'phone', 'email']
        },
        {
          model: Coupon,
          as: 'coupon',
          attributes: ['id', 'code', 'discountType', 'discountValue']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Enrich order items with product details
    const enrichedItems = await Promise.all(
      order.orderItems.map(async (item) => {
        const product = await Product.findByPk(item.productId, {
          attributes: ['id', 'name', 'slug', 'images']
        });

        return {
          ...item,
          product: product || null
        };
      })
    );

    const enrichedOrder = {
      ...order.toJSON(),
      orderItems: enrichedItems
    };

    res.status(200).json({
      success: true,
      data: enrichedOrder
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order'
    });
  }
};

/**
 * @desc    Cancel order
 * @route   PUT /api/orders/:id/cancel
 * @access  Private (Customer)
 */
export const cancelOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const order = await Order.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      transaction
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order can be cancelled
    if (!['pending', 'processing'].includes(order.orderStatus)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled in "${order.orderStatus}" status`
      });
    }

    // Update order status
    await order.update({
      orderStatus: 'cancelled',
      paymentStatus: order.paymentStatus === 'paid' ? 'refunded' : 'failed'
    }, { transaction });

    // Restore product stock (SIMPLE NUMERIC STOCK)
    for (const item of order.orderItems) {
      const product = await Product.findByPk(item.productId, { transaction });

      if (product) {
        // Simple numeric stock increment
        const newStock = (product.stock || 0) + item.quantity;

        await product.update({
          stock: newStock,
          availability: newStock > 0
        }, { transaction });
      }
    }

    // Refund coupon if used
    if (order.couponId) {
      await UserCoupon.update(
        { isUsed: false, usedAt: null, orderId: null },
        {
          where: {
            userId: req.user.id,
            couponId: order.couponId,
            orderId: order.id
          },
          transaction
        }
      );

      await Coupon.decrement('usedCount', {
        where: { id: order.couponId },
        transaction
      });
    }

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling order'
    });
  }
};

/**
 * @desc    Track order by tracking ID
 * @route   GET /api/orders/track/:trackingId
 * @access  Public
 */
export const trackOrder = async (req, res) => {
  try {
    const { trackingId } = req.params;

    const order = await Order.findOne({
      where: { trackingId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Return limited info for public tracking
    const trackingInfo = {
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      shippingAddress: order.shippingAddress,
      estimatedDelivery: order.estimatedDelivery,
      lastUpdated: order.updatedAt
    };

    res.status(200).json({
      success: true,
      data: trackingInfo
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while tracking order'
    });
  }
};

/**
 * @desc    Get order by order number
 * @route   GET /api/orders/number/:orderNumber
 * @access  Private (Customer)
 */
export const getOrderByNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({
      where: {
        orderNumber,
        userId: req.user.id
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'phone', 'email']
        },
        {
          model: Coupon,
          as: 'coupon',
          attributes: ['id', 'code', 'discountType', 'discountValue']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order by number error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order'
    });
  }
};