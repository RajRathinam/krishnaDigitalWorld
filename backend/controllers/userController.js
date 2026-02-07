import { User, Order, Review, Cart } from '../models/index.js';
import { sanitizeUserForPublic } from '../utils/helpers.js';

/**
 * @desc    Get public user profile by slug
 * @route   GET /api/users/public/:slug
 * @access  Public
 */
export const getPublicProfile = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const user = await User.findOne({
      where: { slug, isActive: true },
      attributes: ['id', 'name', 'slug', 'role', 'isVerified', 'created_at']
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get additional public stats
    const orderCount = await Order.count({ where: { userId: user.id } });
    const reviewCount = await Review.count({ where: { userId: user.id } });
    
    const publicProfile = {
      ...user.toJSON(),
      totalOrders: orderCount,
      totalReviews: reviewCount,
      memberSince: user.createdAt
    };
    
    res.status(200).json({
      success: true,
      data: publicProfile
    });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching public profile'
    });
  }
};

/**
 * @desc    Get user's own profile
 * @route   GET /api/users/profile
 * @access  Private (Customer)
 */
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: Order,
          as: 'orders',
          attributes: ['id', 'orderNumber', 'totalPrice', 'orderStatus', 'createdAt'],
          limit: 5,
          order: [['createdAt', 'DESC']]
        }
      ]
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user profile'
    });
  }
};

/**
 * @desc    Update user's own profile
 * @route   PUT /api/users/profile
 * @access  Private (Customer)
 */
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Don't allow role or phone changes
    const { role, phone, ...updateData } = req.body;
    
    // Update user
    await user.update(updateData);
    
    // Get updated user
    const updatedUser = await User.findByPk(req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0].path;
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
};

/**
 * @desc    Complete user profile (add DOB and address)
 * @route   POST /api/users/complete-profile
 * @access  Private (Customer)
 */
export const completeProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const updateData = {};
    
    if (req.body.dateOfBirth) {
      updateData.dateOfBirth = req.body.dateOfBirth;
    }
    
    if (req.body.address) {
      updateData.address = req.body.address;
    }
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No data provided to complete profile'
      });
    }
    
    await user.update(updateData);
    
    const updatedUser = await User.findByPk(req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Profile completed successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while completing profile'
    });
  }
};

/**
 * @desc    Get user's cart
 * @route   GET /api/users/cart
 * @access  Private (Customer)
 */
export const getUserCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      where: { userId: req.user.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });
    
    if (!cart) {
      // Create empty cart if doesn't exist
      const newCart = await Cart.create({
        userId: req.user.id,
        items: [],
        totalAmount: 0
      });
      
      return res.status(200).json({
        success: true,
        data: newCart
      });
    }
    
    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Get user cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching cart'
    });
  }
};

/**
 * @desc    Get user's orders
 * @route   GET /api/users/orders
 * @access  Private (Customer)
 */
export const getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const orders = await Order.findAndCountAll({
      where: { userId: req.user.id },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: {
        orders: orders.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(orders.count / limit),
          totalItems: orders.count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
};

/**
 * @desc    Get user's reviews
 * @route   GET /api/users/reviews
 * @access  Private (Customer)
 */
export const getUserReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const reviews = await Review.findAndCountAll({
      where: { userId: req.user.id },
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
        reviews: reviews.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(reviews.count / limit),
          totalItems: reviews.count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reviews'
    });
  }
};