import { Review, Product, User, Order, Sequelize } from '../models/index.js';

/**
 * @desc    Get reviews for a product
 * @route   GET /api/products/:productId/reviews
 * @access  Public
 */
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;
    const offset = (page - 1) * limit;

    const where = { productId: parseInt(productId), isApproved: true };
    if (rating) where.rating = parseInt(rating);

    const { count, rows: reviews } = await Review.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    // Calculate average rating
    const avgRating = await Review.findOne({
      where: { productId: parseInt(productId), isApproved: true },
      attributes: [[Sequelize.fn('AVG', Sequelize.col('rating')), 'averageRating']],
      raw: true
    });

    // Get rating distribution
    const ratingDistribution = await Review.findAll({
      where: { productId: parseInt(productId), isApproved: true },
      attributes: [
        'rating',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['rating'],
      order: [['rating', 'DESC']]
    });

    // Update product rating
    if (avgRating?.averageRating) {
      await Product.update(
        { rating: parseFloat(avgRating.averageRating), totalReviews: count },
        { where: { id: productId } }
      );
    }

    res.status(200).json({
      success: true,
      data: {
        reviews,
        statistics: {
          averageRating: parseFloat(avgRating?.averageRating || 0),
          totalReviews: count,
          ratingDistribution
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reviews'
    });
  }
};

/**
 * @desc    Create a review
 * @route   POST /api/reviews
 * @access  Private (Customer)
 */
export const createReview = async (req, res) => {
  try {
    const { productId, rating, comment, images } = req.body;

    // Validate required fields
    if (!productId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user has purchased this product
    const hasPurchased = await Order.findOne({
      where: {
        userId: req.user.id,
        orderStatus: 'delivered',
        orderItems: {
          [Sequelize.Op.contains]: [{ productId: parseInt(productId) }]
        }
      }
    });

    if (!hasPurchased && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You must purchase this product before reviewing it'
      });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      where: {
        productId,
        userId: req.user.id
      }
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Create review
    const review = await Review.create({
      productId,
      userId: req.user.id,
      rating,
      comment: comment || null,
      images: images || [],
      isApproved: req.user.role === 'admin' // Auto-approve for admin
    });

    // Update product rating
    await updateProductRating(productId);

    // Get created review with user details
    const createdReview = await Review.findByPk(review.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: createdReview
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating review'
    });
  }
};

/**
 * @desc    Update a review
 * @route   PUT /api/reviews/:id
 * @access  Private (Customer/Owner)
 */
export const updateReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check ownership
    if (review.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    // Update review
    await review.update({
      rating: req.body.rating || review.rating,
      comment: req.body.comment !== undefined ? req.body.comment : review.comment,
      images: req.body.images !== undefined ? req.body.images : review.images
    });

    // Update product rating
    await updateProductRating(review.productId);

    // Get updated review with user details
    const updatedReview = await Review.findByPk(review.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating review'
    });
  }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:id
 * @access  Private (Customer/Owner or Admin)
 */
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check ownership
    if (review.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    const productId = review.productId;

    // Delete review
    await review.destroy();

    // Update product rating
    await updateProductRating(productId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting review'
    });
  }
};

/**
 * @desc    Mark review as helpful
 * @route   POST /api/reviews/:id/helpful
 * @access  Private (Customer)
 */
export const markHelpful = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Increment helpful count
    await review.increment('helpfulCount');

    res.status(200).json({
      success: true,
      message: 'Review marked as helpful',
      data: {
        id: review.id,
        helpfulCount: review.helpfulCount + 1
      }
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking review as helpful'
    });
  }
};

/**
 * @desc    Get user's reviews
 * @route   GET /api/users/me/reviews
 * @access  Private (Customer)
 */
export const getMyReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: { userId: req.user.id },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
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
    console.error('Get my reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reviews'
    });
  }
};

/**
 * Helper function to update product rating
 */
const updateProductRating = async (productId) => {
  try {
    const stats = await Review.findOne({
      where: { productId, isApproved: true },
      attributes: [
        [Sequelize.fn('AVG', Sequelize.col('rating')), 'averageRating'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalReviews']
      ],
      raw: true
    });

    if (stats) {
      await Product.update(
        {
          rating: parseFloat(stats.averageRating || 0),
          totalReviews: parseInt(stats.totalReviews || 0)
        },
        { where: { id: productId } }
      );
    }
  } catch (error) {
    console.error('Update product rating error:', error);
  }
};