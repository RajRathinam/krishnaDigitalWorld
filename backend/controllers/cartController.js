import { Cart, Product, User, sequelize } from '../models/index.js';
import { getTotalStock } from '../utils/helpers.js';

// Add these helper functions at the top of the file:

const parseProductImages = (product) => {
  let images = [];
  
  if (!product || !product.images) return images;
  
  try {
    // If images is a string, parse it
    if (typeof product.images === 'string') {
      const parsed = JSON.parse(product.images);
      images = Array.isArray(parsed) ? parsed : [];
    } 
    // If it's already an array
    else if (Array.isArray(product.images)) {
      images = product.images;
    }
  } catch (error) {
    console.error('Error parsing product images:', error);
    images = [];
  }
  
  return images;
};

const parseColorsAndImages = (product) => {
  let colorsAndImages = {};
  
  if (!product || !product.colorsAndImages) return colorsAndImages;
  
  try {
    // If colorsAndImages is a string, parse it
    if (typeof product.colorsAndImages === 'string') {
      const parsed = JSON.parse(product.colorsAndImages);
      colorsAndImages = (typeof parsed === 'object' && parsed !== null) ? parsed : {};
    } 
    // If it's already an object
    else if (typeof product.colorsAndImages === 'object' && product.colorsAndImages !== null) {
      colorsAndImages = product.colorsAndImages;
    }
  } catch (error) {
    console.error('Error parsing colorsAndImages:', error);
    colorsAndImages = {};
  }
  
  return colorsAndImages;
};

/**
 * @desc    Get user's cart
 * @route   GET /api/cart
 * @access  Private (Customer)
 */
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cart = await Cart.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });
    
    if (!cart) {
      const newCart = await Cart.create({
        userId,
        items: [],
        totalAmount: 0
      });
      
      return res.status(200).json({
        success: true,
        data: newCart
      });
    }
    
    // Parse items if they're stored as JSON string
    let items = [];
    if (cart.items) {
      if (Array.isArray(cart.items)) {
        items = [...cart.items];
      } else if (typeof cart.items === 'string') {
        try {
          items = JSON.parse(cart.items);
          if (!Array.isArray(items)) items = [];
        } catch (error) {
          console.error('Error parsing cart items:', error);
          items = [];
        }
      }
    }
    
    // Enrich cart items with product details
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findByPk(item.productId, {
          attributes: [
            'id', 'name', 'slug', 'price', 'discountPrice', 
            'images', 'colorsAndImages', 'availability', 'stock', 'isActive'
          ]
        });
        
        if (!product) {
          return {
            ...item,
            product: null,
            totalPrice: 0
          };
        }
        
        // Parse product images and colors
        const productImages = parseProductImages(product);
        const colorsAndImages = parseColorsAndImages(product);
        
        // Prepare product data for response
        const productData = {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          discountPrice: product.discountPrice,
          isActive: product.isActive,
          images: productImages
        };
        
        // If item has an imageUrl already, use it
        // Otherwise, get image from product based on color
        let imageUrl = item.imageUrl;
        
        if (!imageUrl && colorsAndImages[item.colorName]) {
          const colorImages = colorsAndImages[item.colorName];
          if (Array.isArray(colorImages) && colorImages.length > 0) {
            // Get the main image (type: 'main') or first image
            const mainImage = colorImages.find(img => img.type === 'main');
            imageUrl = mainImage ? mainImage.url : colorImages[0].url;
          }
        }
        
        // If still no image, use first product image
        if (!imageUrl && productImages.length > 0) {
          const firstImage = productImages[0];
          imageUrl = typeof firstImage === 'object' && firstImage.url ? firstImage.url : firstImage;
        }
        
        return {
          ...item,
          product: productData,
          imageUrl: imageUrl, // Ensure imageUrl is included
          totalPrice: (product.discountPrice || product.price || 0) * (item.quantity || 1)
        };
      })
    );
    
    const totalAmount = enrichedItems.reduce((total, item) => {
      return total + (item.totalPrice || 0);
    }, 0);
    
    const enrichedCart = {
      ...cart.toJSON(),
      items: enrichedItems,
      totalAmount
    };
    
    res.status(200).json({
      success: true,
      data: enrichedCart
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching cart'
    });
  }
};

/**
 * @desc    Add item to cart
 * @route   POST /api/cart/items
 * @access  Private (Customer)
 */
export const addToCart = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { productId, quantity = 1, colorName, imageUrl } = req.body;
    const userId = req.user.id;
    
    console.log('Add to cart request:', { productId, quantity, colorName, imageUrl, userId });
    
    // Validate productId
    if (!productId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }
    
    // Check if product exists
    const product = await Product.findByPk(productId, { transaction });
    
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    if (!product.isActive) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Product is not available'
      });
    }
    
    console.log('Product found:', { 
      id: product.id, 
      name: product.name
    });
    
    // Parse product images and colors
    const productImages = parseProductImages(product);
    const colorsAndImages = parseColorsAndImages(product);
    
    let finalColorName = colorName || null;
    let finalImageUrl = imageUrl || null;
    
    // Validate color if provided
    if (finalColorName && Object.keys(colorsAndImages).length > 0) {
      const availableColors = Object.keys(colorsAndImages);
      if (!availableColors.includes(finalColorName)) {
        console.log('Requested color not in available colors:', finalColorName);
        finalColorName = null;
      }
    }
    
    // If no imageUrl from request, try to get from product
    if (!finalImageUrl) {
      if (finalColorName && colorsAndImages[finalColorName]) {
        const colorImages = colorsAndImages[finalColorName];
        if (Array.isArray(colorImages) && colorImages.length > 0) {
          const mainImage = colorImages.find(img => img.type === 'main');
          finalImageUrl = mainImage ? mainImage.url : colorImages[0].url;
        }
      }
      
      // If still no image, use first product image
      if (!finalImageUrl && productImages.length > 0) {
        const firstImage = productImages[0];
        finalImageUrl = typeof firstImage === 'object' && firstImage.url ? firstImage.url : firstImage;
      }
    }
    
    console.log('Final values:', { 
      colorName: finalColorName, 
      imageUrl: finalImageUrl 
    });
    
    // Check stock
    const requestedQuantity = parseInt(quantity) || 1;
    const totalStock = getTotalStock(product.stock);
    
    if (requestedQuantity > totalStock) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Only ${totalStock} items available in stock`
      });
    }
    
    // Get or create cart
    let cart = await Cart.findOne({
      where: { userId },
      transaction,
      raw: false
    });
    
    if (!cart) {
      cart = await Cart.create({
        userId,
        items: [],
        totalAmount: 0
      }, { transaction, raw: false });
    }
    
    // Parse items
    let items = [];
    if (cart.items) {
      if (Array.isArray(cart.items)) {
        items = [...cart.items];
      } else if (typeof cart.items === 'string') {
        try {
          items = JSON.parse(cart.items);
          if (!Array.isArray(items)) items = [];
        } catch (error) {
          console.error('Error parsing cart items:', error);
          items = [];
        }
      }
    }
    
    // Check if item already exists
    const existingItemIndex = items.findIndex(item => {
      const itemProductId = String(item.productId);
      const reqProductId = String(productId);
      
      if (itemProductId !== reqProductId) return false;
      
      // Compare color
      const itemColor = item.colorName || null;
      const reqColor = finalColorName || null;
      
      return itemColor === reqColor;
    });
    
    const itemPrice = parseFloat(product.discountPrice || product.price) || 0;
    
    if (existingItemIndex > -1) {
      // Update existing item
      items[existingItemIndex].quantity += requestedQuantity;
      items[existingItemIndex].price = itemPrice;
      items[existingItemIndex].updatedAt = new Date();
      
      // Update imageUrl if provided
      if (finalImageUrl && !items[existingItemIndex].imageUrl) {
        items[existingItemIndex].imageUrl = finalImageUrl;
      }
    } else {
      // Add new item
      const newItem = {
        productId: String(productId),
        productName: product.name,
        quantity: requestedQuantity,
        colorName: finalColorName,
        price: itemPrice,
        imageUrl: finalImageUrl,
        addedAt: new Date(),
        updatedAt: new Date()
      };
      
      items.push(newItem);
    }
    
    // Calculate total amount
    const totalAmount = items.reduce((total, item) => {
      return total + ((item.price || 0) * (item.quantity || 1));
    }, 0);
    
    // Save cart
    await cart.update({
      items: items,
      totalAmount: totalAmount
    }, { transaction });
    
    await transaction.commit();
    
    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: {
        id: cart.id,
        userId: cart.userId,
        items: items,
        totalAmount: totalAmount
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding item to cart',
      error: error.message
    });
  }
};

export const updateCartItem = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { productId } = req.params;
    const { quantity, colorName = null, imageUrl } = req.body;
    const userId = req.user.id;
    
    console.log('Update cart item request:', { 
      productId, 
      quantity, 
      colorName, 
      imageUrl,
      userId
    });
    
    if (!quantity || isNaN(quantity) || quantity < 1) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Valid quantity (minimum 1) is required'
      });
    }
    
    // Get cart
    const cart = await Cart.findOne({
      where: { userId },
      transaction,
      raw: false
    });
    
    if (!cart) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    // Parse items
    let items = [];
    if (cart.items) {
      if (Array.isArray(cart.items)) {
        items = [...cart.items];
      } else if (typeof cart.items === 'string') {
        try {
          items = JSON.parse(cart.items);
          if (!Array.isArray(items)) items = [];
        } catch (error) {
          console.error('Error parsing cart items:', error);
          items = [];
        }
      }
    }
    
    // Find item in cart
    const itemIndex = items.findIndex(item => {
      const itemProductId = String(item.productId);
      const reqProductId = String(productId);
      
      if (itemProductId !== reqProductId) return false;
      
      const itemColor = item.colorName || null;
      const reqColor = colorName || null;
      
      return itemColor === reqColor;
    });
    
    if (itemIndex === -1) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }
    
    // Check product stock if needed
    const product = await Product.findByPk(productId, { transaction });
    if (product) {
      const totalStock = getTotalStock(product.stock);
      if (quantity > totalStock) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Only ${totalStock} items available in stock`
        });
      }
      
      items[itemIndex].price = product.discountPrice || product.price;
    }
    
    // Update item
    items[itemIndex].quantity = parseInt(quantity);
    items[itemIndex].updatedAt = new Date();
    
    // Update imageUrl if provided
    if (imageUrl !== undefined) {
      items[itemIndex].imageUrl = imageUrl;
    }
    
    // Calculate total amount
    const totalAmount = items.reduce((total, item) => {
      const itemTotal = (parseFloat(item.price) || 0) * (item.quantity || 1);
      return total + itemTotal;
    }, 0);
    
    // Update cart
    cart.setDataValue('items', items);
    cart.changed('items', true);
    cart.totalAmount = totalAmount;
    
    await cart.save({ transaction });
    
    await transaction.commit();
    
    res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      data: {
        id: cart.id,
        userId: cart.userId,
        items: items,
        totalAmount: totalAmount
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating cart item',
      error: error.message
    });
  }
};

// ... rest of the functions (removeFromCart, clearCart, getCartItemCount) remain the same
/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/items/:productId
 * @access  Private (Customer)
 */
export const removeFromCart = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { productId } = req.params;
    const { colorName } = req.query; // Optional: color name
    const userId = req.user.id;
    
    console.log('Remove from cart:', { productId, colorName, userId });
    
    // Get cart
    const cart = await Cart.findOne({
      where: { userId },
      transaction
    });
    
    if (!cart) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    // Parse items
    let items = [];
    if (cart.items) {
      if (Array.isArray(cart.items)) {
        items = [...cart.items];
      } else if (typeof cart.items === 'string') {
        try {
          items = JSON.parse(cart.items);
          if (!Array.isArray(items)) items = [];
        } catch (error) {
          console.error('Error parsing cart items:', error);
          items = [];
        }
      }
    }
    
    console.log('Current items before removal:', items);
    
    // Find item in cart
    const itemIndex = items.findIndex(item => {
      const itemProductId = String(item.productId);
      const reqProductId = String(productId);
      
      // Compare product ID
      if (itemProductId !== reqProductId) return false;
      
      // Compare color if specified
      if (colorName !== undefined) {
        const itemColor = item.colorName || null;
        const reqColor = colorName || null;
        return itemColor === reqColor;
      }
      
      // If no color specified, match any color
      return true;
    });
    
    console.log('Found item at index:', itemIndex);
    
    if (itemIndex === -1) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }
    
    // Remove item
    const removedItem = items.splice(itemIndex, 1);
    console.log('Removed item:', removedItem);
    console.log('Items after removal:', items);
    
    // Calculate total amount
    const totalAmount = items.reduce((total, item) => {
      return total + ((item.price || 0) * (item.quantity || 1));
    }, 0);
    
    // Update cart
    await cart.update({
      items: items,
      totalAmount: totalAmount
    }, { transaction });
    
    await transaction.commit();
    
    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      data: {
        id: cart.id,
        userId: cart.userId,
        items: items,
        totalAmount: totalAmount,
        removedItem: removedItem[0]
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing item from cart',
      error: error.message
    });
  }
};
/**
 * @desc    Clear cart
 * @route   DELETE /api/cart
 * @access  Private (Customer)
 */
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cart = await Cart.findOne({
      where: { userId }
    });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    await cart.update({
      items: [],
      totalAmount: 0
    });
    
    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: cart
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while clearing cart'
    });
  }
};

/**
 * @desc    Get cart item count
 * @route   GET /api/cart/count
 * @access  Private (Customer)
 */
export const getCartItemCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cart = await Cart.findOne({
      where: { userId }
    });
    
    if (!cart) {
      return res.status(200).json({
        success: true,
        data: { count: 0 }
      });
    }
    
    const itemCount = cart.items.reduce((total, item) => {
      return total + (item.quantity || 1);
    }, 0);
    
    res.status(200).json({
      success: true,
      data: {
        count: itemCount,
        uniqueItems: cart.items.length
      }
    });
  } catch (error) {
    console.error('Get cart count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching cart count'
    });
  }
};