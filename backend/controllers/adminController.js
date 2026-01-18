import {
  User,
  Order,
  Product,
  Review,
  Coupon,
  Category,
  Brand,
  UserCoupon,
  sequelize
} from '../models/index.js';
import { Op } from 'sequelize';
import { format } from 'date-fns';
import { createObjectCsvStringifier } from 'csv-writer';

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Private (Admin)
 */
/**
 * @desc    Get dashboard statistics - only basic counts
 * @route   GET /api/admin/stats
 * @access  Private (Admin)
 */
export const getDashboardStats = async (req, res) => {
  try {
    console.log('=== Getting Dashboard Basic Stats ===');

    // Get basic counts with individual try-catch for each
    let totalUsers = 0;
    let totalProducts = 0;
    let totalOrders = 0;

    try {
      // Total active customers
      totalUsers = await User.count({
        where: {
          role: 'customer',
          isActive: true
        }
      });
      console.log('Total users count:', totalUsers);
    } catch (error) {
      console.error('Error counting users:', error.message);
      totalUsers = 0;
    }

    try {
      // Total active products
      totalProducts = await Product.count({
        where: {
          isActive: true
        }
      });
      console.log('Total products count:', totalProducts);
    } catch (error) {
      console.error('Error counting products:', error.message);
      totalProducts = 0;
    }

    try {
      // Total orders (all orders)
      totalOrders = await Order.count();
      console.log('Total orders count:', totalOrders);
    } catch (error) {
      console.error('Error counting orders:', error.message);
      totalOrders = 0;
    }

    // Fetch orders: Prioritize Pending, but also show Recent
    let recentOrders = [];
    try {
      // 1. Fetch top 10 Pending
      const pendingOrders = await Order.findAll({
        where: { orderStatus: 'pending' },
        limit: 10,
        order: [['id', 'DESC']],
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
      });

      // 2. Fetch top 5 Recent (any status)
      const latestOrders = await Order.findAll({
        limit: 5,
        order: [['id', 'DESC']],
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
      });

      // 3. Merge and Deduplicate
      const orderMap = new Map();
      pendingOrders.forEach(o => orderMap.set(o.id, o));
      latestOrders.forEach(o => orderMap.set(o.id, o));

      // Convert to array and sort by ID desc
      recentOrders = Array.from(orderMap.values())
        .sort((a, b) => b.id - a.id)
        .slice(0, 10); // Show max 10 cards

    } catch (err) {
      console.error("Dashboard Recent Orders Error:", err.message);
    }

    // Fetch popular products based on Sales Quantity
    let popularProducts = [];
    try {
      // 1. Fetch recent 200 orders to calculate popularity
      const ordersForStats = await Order.findAll({
        limit: 200,
        attributes: ['orderItems'],
        order: [['id', 'DESC']]
      });

      // 2. Aggregate quantities
      const productSales = {};
      ordersForStats.forEach(order => {
        let items = order.orderItems;
        // Parse if string
        if (typeof items === 'string') {
          try { items = JSON.parse(items); } catch (e) { items = []; }
        }
        if (Array.isArray(items)) {
          items.forEach(item => {
            // Handle various structures: item.id, item.productId, item.product.id
            const pId = item.productId || (item.product ? item.product.id : item.id);
            const qty = item.quantity || 0;
            if (pId && qty) {
              productSales[pId] = (productSales[pId] || 0) + parseInt(qty);
            }
          });
        }
      });

      // 3. Sort by sales
      const sortedIds = Object.keys(productSales).sort((a, b) => productSales[b] - productSales[a]).slice(0, 5);

      if (sortedIds.length > 0) {
        // 4. Fetch product details
        popularProducts = await Product.findAll({
          where: { id: sortedIds },
          attributes: ['id', 'name', 'price', 'rating', 'totalReviews', 'colorsAndImages']
        });

        // 5. Re-sort to match sales order (Product.findAll returns unsorted)
        popularProducts.sort((a, b) => {
          const salesA = productSales[a.id] || 0;
          const salesB = productSales[b.id] || 0;
          return salesB - salesA;
        });
      } else {
        // Fallback to rating if no sales
        popularProducts = await Product.findAll({
          where: { isActive: true },
          limit: 5,
          order: [['rating', 'DESC'], ['totalReviews', 'DESC']],
          attributes: ['id', 'name', 'price', 'rating', 'totalReviews', 'colorsAndImages']
        });
      }

    } catch (err) {
      console.error("Dashboard Popular Products Error:", err.message);
    }

    // Prepare response data
    const responseData = {
      counts: {
        totalUsers: totalUsers,
        totalProducts: totalProducts,
        totalOrders: totalOrders,
        totalRevenue: 0,
        monthlyRevenue: 0,
        yearlyRevenue: 0,
        newUsersThisMonth: 0,
        newOrdersThisMonth: 0
      },
      recentOrders: recentOrders,
      popularProducts: popularProducts
    };

    console.log('Sending response data:', responseData);

    res.status(200).json({
      success: true,
      message: 'Dashboard statistics fetched successfully',
      data: responseData
    });

  } catch (error) {
    console.error('=== Get dashboard stats CRITICAL ERROR ===');
    console.error('Error:', error.message);
    console.error('Error stack:', error.stack);

    // Return empty data structure on error
    res.status(200).json({
      success: true,
      message: 'Using minimal dashboard data',
      data: {
        counts: {
          totalUsers: 0,
          totalProducts: 0,
          totalOrders: 0,
          totalRevenue: 0,
          monthlyRevenue: 0,
          yearlyRevenue: 0,
          newUsersThisMonth: 0,
          newOrdersThisMonth: 0
        },
        recentOrders: [],
        popularProducts: []
      }
    });
  }
};

// ... rest of the adminController.js functions remain the same
// In adminController.js
export const testStats = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'API is working',
      data: {
        counts: {
          totalUsers: 1234,
          totalProducts: 567,
          totalOrders: 890,
          totalRevenue: 1234567,
          monthlyRevenue: 12345,
          yearlyRevenue: 123456,
          newUsersThisMonth: 45,
          newOrdersThisMonth: 67
        },
        recentOrders: [
          { id: "1", orderNumber: "ORD-001", totalPrice: 12500, orderStatus: "delivered", createdAt: new Date().toISOString() },
          { id: "2", orderNumber: "ORD-002", totalPrice: 8999, orderStatus: "shipped", createdAt: new Date().toISOString() }
        ],
        popularProducts: [
          { id: "1", name: "Test Product 1", price: 2999, rating: 4.5, totalReviews: 128 },
          { id: "2", name: "Test Product 2", price: 1999, rating: 4.2, totalReviews: 89 }
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
/**
 * @desc    Send birthday wishes manually
 * @route   POST /api/admin/send-birthday-wishes
 * @access  Private (Admin)
 */
export const sendBirthdayWishes = async (req, res) => {
  try {
    const result = await checkBirthdaysAndSendWishes();

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        count: result.count,
        users: result.users || []
      }
    });
  } catch (error) {
    console.error('Send birthday wishes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending birthday wishes'
    });
  }
};

// ... rest of your adminController.js functions remain the same ...
// Make sure ALL functions import { Op } and use it properly

/**
 * @desc    Broadcast coupon to all users
 * @route   POST /api/admin/broadcast-coupon
 * @access  Private (Admin)
 */
export const broadcastCoupon = async (req, res) => {
  try {
    const { couponData } = req.body;

    if (!couponData || !couponData.code || !couponData.discountValue) {
      return res.status(400).json({
        success: false,
        message: 'Coupon data is required'
      });
    }

    // Create coupon
    const coupon = await Coupon.create({
      ...couponData,
      validFrom: couponData.validFrom || new Date(),
      validUntil: couponData.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true
    });

    // Get all active users
    const users = await User.findAll({
      where: {
        role: 'customer',
        isActive: true,
        isVerified: true
      },
      attributes: ['id']
    });

    // Assign coupon to users (in batches for performance)
    const batchSize = 100;
    const batches = Math.ceil(users.length / batchSize);

    const userCouponsArray = [];

    for (let i = 0; i < batches; i++) {
      const batch = users.slice(i * batchSize, (i + 1) * batchSize);
      const userCoupons = batch.map(user => ({
        userId: user.id,
        couponId: coupon.id,
        isUsed: false
      }));

      userCouponsArray.push(...userCoupons);
    }

    // Bulk create all user coupons
    if (userCouponsArray.length > 0) {
      await UserCoupon.bulkCreate(userCouponsArray, {
        ignoreDuplicates: true,
        validate: true
      });
    }

    res.status(201).json({
      success: true,
      message: `Coupon broadcasted to ${users.length} users`,
      data: {
        coupon,
        usersCount: users.length
      }
    });
  } catch (error) {
    console.error('Broadcast coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while broadcasting coupon'
    });
  }
};


/**
 * @desc    Export user data as CSV
 * @route   GET /api/admin/users/export
 * @access  Private (Admin)
 */
export const exportUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: [
        'id', 'customerCode', 'name', 'slug', 'phone', 'email',
        'role', 'dateOfBirth', 'isVerified', 'isActive',
        'giftReceived', 'createdAt'
      ],
      order: [['createdAt', 'DESC']]
    });

    // Format data for CSV
    const csvData = users.map(user => ({
      id: user.id,
      customerCode: user.customerCode || '',
      name: user.name,
      slug: user.slug,
      phone: user.phone,
      email: user.email || '',
      role: user.role,
      dateOfBirth: user.dateOfBirth ? format(new Date(user.dateOfBirth), 'yyyy-MM-dd') : '',
      isVerified: user.isVerified ? 'Yes' : 'No',
      isActive: user.isActive ? 'Active' : 'Inactive',
      giftReceived: user.giftReceived ? 'Yes' : 'No',
      memberSince: format(new Date(user.createdAt), 'yyyy-MM-dd HH:mm:ss')
    }));

    // Create CSV stringifier
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'id', title: 'ID' },
        { id: 'customerCode', title: 'Customer Code' },
        { id: 'name', title: 'Name' },
        { id: 'slug', title: 'Slug' },
        { id: 'phone', title: 'Phone' },
        { id: 'email', title: 'Email' },
        { id: 'role', title: 'Role' },
        { id: 'dateOfBirth', title: 'Date of Birth' },
        { id: 'isVerified', title: 'Verified' },
        { id: 'isActive', title: 'Status' },
        { id: 'giftReceived', title: 'Gift Received' },
        { id: 'memberSince', title: 'Member Since' }
      ]
    });

    const csvString = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(csvData);

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=users_${format(new Date(), 'yyyy-MM-dd')}.csv`);

    res.status(200).send(csvString);
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting users'
    });
  }
};

/**
 * @desc    Search users with filters
 * @route   GET /api/admin/users/search
 * @access  Private (Admin)
 */
export const searchUsers = async (req, res) => {
  try {
    const {
      search = '',
      role,
      isVerified,
      isActive,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;

    // Build where clause
    const where = {};

    if (role) where.role = role;
    if (isVerified !== undefined) where.isVerified = isVerified === 'true';
    if (isActive !== undefined) where.isActive = isActive === 'true';

    if (search) {
      where[Op.or] = [ // Use Op instead of Sequelize.Op
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { slug: { [Op.like]: `%${search}%` } },
        { customerCode: { [Op.like]: `%${search}%` } }
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom); // Use Op
      if (dateTo) where.createdAt[Op.lte] = new Date(dateTo); // Use Op
    }

    // Validate sort field
    const allowedSortFields = ['id', 'name', 'phone', 'email', 'role', 'createdAt', 'updatedAt'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const validSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'desc';

    const { count, rows: users } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[validSortBy, validSortOrder]],
    });

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        },
        filters: {
          search,
          role,
          isVerified,
          isActive,
          dateFrom,
          dateTo
        }
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching users'
    });
  }
};

/**
 * @desc    Get user details (admin view - all data)
 * @route   GET /api/admin/users/:id
 * @access  Private (Admin)
 */
export const getUserDetails = async (req, res) => {
  try {
    // Get basic user info first
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get orders separately (simpler query)
    let orders = [];
    try {
      orders = await Order.findAll({
        where: { userId: user.id },
        limit: 10,
        order: [['created_at', 'DESC']]
      });
    } catch (orderError) {
      console.error('Error fetching orders:', orderError.message);
    }

    // Get reviews separately
    let reviews = [];
    try {
      reviews = await Review.findAll({
        where: { userId: user.id },
        limit: 10,
        order: [['created_at', 'DESC']]
      });
    } catch (reviewError) {
      console.error('Error fetching reviews:', reviewError.message);
    }

    // Calculate stats
    const orderCount = await Order.count({ where: { userId: user.id } });
    const totalSpent = await Order.sum('final_amount', {
      where: { userId: user.id }
    }) || 0;

    const userData = user.toJSON();
    userData.orders = orders.map(order => {
      const orderData = order.toJSON ? order.toJSON() : order;
      let items = orderData.orderItems;
      try {
        if (typeof items === 'string') items = JSON.parse(items);
      } catch (e) { items = []; }

      return {
        id: orderData.id,
        orderNumber: orderData.orderNumber || orderData.order_number,
        totalPrice: parseFloat(orderData.finalAmount || orderData.totalPrice || orderData.total_price || 0),
        orderStatus: orderData.orderStatus || orderData.order_status,
        createdAt: orderData.createdAt || orderData.created_at,
        products: Array.isArray(items) ? items : []
      };
    });

    userData.reviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.created_at
    }));

    userData.stats = {
      orderCount,
      totalSpent: parseFloat(totalSpent),
      avgOrderValue: orderCount > 0 ? parseFloat(totalSpent) / orderCount : 0
    };

    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Get user details error:', error);
    console.error('Full error details:', {
      name: error.name,
      message: error.message,
      sql: error.sql,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Server error while fetching user details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
/**
 * @desc    Update user (admin only)
 * @route   PUT /api/admin/users/:id
 * @access  Private (Admin)
 */
export const updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow changing own role or deactivating own account
    if (req.user.id === user.id && (req.body.role || req.body.isActive === false)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role or deactivate your own account'
      });
    }

    // Update user
    await user.update(req.body);

    const updatedUser = await User.findByPk(req.params.id, {
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0].path;
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating user'
    });
  }
};

/**
 * @desc    Toggle user active status
 * @route   PUT /api/admin/users/:id/status
 * @access  Private (Admin)
 */
export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deactivating own account
    if (req.user.id === user.id && user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    // Toggle status
    await user.update({ isActive: !user.isActive });

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: user.id,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling user status'
    });
  }
};

/**
 * @desc    Delete user (soft delete)
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin)
 */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deleting own account
    if (req.user.id === user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Soft delete (deactivate)
    await user.update({ isActive: false });

    // Optional: Archive user data
    // await user.destroy(); // For hard delete

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user'
    });
  }
};

/**
 * @desc    Get user's orders (admin view)
 * @route   GET /api/admin/users/:id/orders
 * @access  Private (Admin)
 */
export const getUserOrdersAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: orders } = await Order.findAndCountAll({
      where: { userId: req.params.id },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'phone']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user orders admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user orders'
    });
  }
};

/**
 * @desc    Get user's reviews (admin view)
 * @route   GET /api/admin/users/:id/reviews
 * @access  Private (Admin)
 */
export const getUserReviewsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: { userId: req.params.id },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'slug', 'images']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user reviews admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user reviews'
    });
  }
};

/**
 * @desc    Get user's cart (admin view)
 * @route   GET /api/admin/users/:id/cart
 * @access  Private (Admin)
 */
export const getUserCartAdmin = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      where: { userId: req.params.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Get user cart admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user cart'
    });
  }
};
// Add this function to adminController.js
/**
 * @desc    Get customer analytics data
 * @route   GET /api/admin/users/analytics/customers
 * @access  Private (Admin)
 */
export const getCustomerAnalytics = async (req, res) => {
  try {
    console.log('=== Getting Customer Analytics ===');

    // Get total active customers
    const totalCustomers = await User.count({
      where: {
        role: 'customer',
        isActive: true
      }
    }).catch(() => 0);

    // Get all customers with their order count
    const customers = await User.findAll({
      where: {
        role: 'customer',
        isActive: true
      },
      attributes: [
        'id',
        'customerCode',
        'name',
        'email',
        'phone',
        'dateOfBirth',
        'isVerified',
        'isActive',
        // Use literal with correct column names (snake_case)
        [
          sequelize.literal(`(
            SELECT COUNT(*) 
            FROM orders 
            WHERE orders.user_id = User.id 
            AND orders.order_status != 'cancelled'
          )`),
          'orderCount'
        ],
        [
          sequelize.literal(`(
            SELECT SUM(final_amount) 
            FROM orders 
            WHERE orders.user_id = User.id 
            AND orders.order_status != 'cancelled'
            AND orders.payment_status = 'paid'
          )`),
          'totalSpent'
        ]
      ],
      order: [['created_at', 'DESC']],
      limit: 50
    });

    // Calculate ordered vs signup-only customers
    let orderedCustomers = 0;
    let signupOnlyCustomers = 0;

    customers.forEach(customer => {
      const orderCount = customer.dataValues.orderCount || 0;
      if (orderCount > 0) {
        orderedCustomers++;
      } else {
        signupOnlyCustomers++;
      }
    });

    // Format customer data for frontend
    const formattedCustomers = customers.map(customer => {
      // Access the correct field names based on your model
      const userData = customer.get({ plain: true });

      return {
        id: userData.id?.toString() || '',
        customerCode: userData.customerCode || `CUST-${userData.id}`,
        name: userData.name || 'Unknown',
        email: userData.email || 'No email',
        phone: userData.phone || 'No phone',
        dateOfBirth: userData.dateOfBirth
          ? new Date(userData.dateOfBirth).toISOString().split('T')[0]
          : 'Not set',
        orders: userData.orderCount || 0,
        totalSpent: parseFloat(userData.totalSpent || 0).toFixed(2),
        status: (userData.orderCount || 0) > 0 ? 'ordered' : 'signup-only',
        joinDate: userData.createdAt
          ? new Date(userData.createdAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        isVerified: userData.isVerified || false,
        isActive: userData.isActive || true
      };
    });

    const responseData = {
      totalCustomers,
      orderedCustomers,
      signupOnlyCustomers,
      customers: formattedCustomers
    };

    console.log('Customer analytics data:', {
      totalCustomers,
      orderedCustomers,
      signupOnlyCustomers,
      customerCount: formattedCustomers.length
    });

    res.status(200).json({
      success: true,
      message: 'Customer analytics fetched successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Get customer analytics error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      sql: error.sql,
      parameters: error.parameters
    });

    res.status(500).json({
      success: false,
      message: 'Server error while fetching customer analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Also update the existing getUserAnalytics function if needed:
export const getUserAnalytics = async (req, res) => {
  try {
    // You can keep your existing analytics or redirect to the new function
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get user growth data
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        month: date.toLocaleString('default', { month: 'short' }),
        year: date.getFullYear()
      });
    }

    const userGrowth = await Promise.all(
      months.map(async ({ month, year }) => {
        const startDate = new Date(year, new Date(`${month} 1, ${year}`).getMonth(), 1);
        const endDate = new Date(year, startDate.getMonth() + 1, 0);

        const count = await User.count({
          where: {
            createdAt: {
              [Op.between]: [startDate, endDate]
            },
            role: 'customer'
          }
        }).catch(() => 0);

        return { month: `${month} ${year}`, count };
      })
    );

    // Get basic stats
    const totalCustomers = await User.count({
      where: { role: 'customer', isActive: true }
    }).catch(() => 0);

    const newCustomersThisMonth = await User.count({
      where: {
        createdAt: { [Op.gte]: startOfMonth },
        role: 'customer',
        isActive: true
      }
    }).catch(() => 0);

    // Get customers with orders
    const customersWithOrders = await User.count({
      where: {
        role: 'customer',
        isActive: true
      },
      include: [{
        model: Order,
        as: 'orders',
        required: true,
        where: {
          orderStatus: { [Op.ne]: 'cancelled' }
        }
      }]
    }).catch(() => 0);

    res.status(200).json({
      success: true,
      data: {
        userGrowth,
        totalCustomers,
        newCustomersThisMonth,
        customersWithOrders,
        customersWithoutOrders: totalCustomers - customersWithOrders
      }
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user analytics'
    });
  }
};