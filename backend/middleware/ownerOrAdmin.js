/**
 * Owner or Admin middleware
 * Checks if user owns the resource or is an admin
 */
export const ownerOrAdmin = (resourceGetter) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      // Get the resource
      const resource = await resourceGetter(req);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found.'
        });
      }

      // Check if user owns the resource
      let isOwner = false;
      
      if (resource.userId && resource.userId === req.user.id) {
        isOwner = true;
      } else if (resource.id && resource.id === req.user.id) {
        isOwner = true;
      } else if (resource.sellerId && resource.sellerId === req.user.id) {
        isOwner = true;
      }

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this resource.'
        });
      }

      next();
    } catch (error) {
      console.error('Error in ownerOrAdmin middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error in authorization check.'
      });
    }
  };
};

/**
 * Specific implementations for common resources
 */

// For user resources
export const userOwnerOrAdmin = ownerOrAdmin(async (req) => {
  const { User } = await import('../models/index.js');
  return await User.findByPk(req.params.id || req.params.userId);
});

// For product resources
export const productOwnerOrAdmin = ownerOrAdmin(async (req) => {
  const { Product } = await import('../models/index.js');
  return await Product.findByPk(req.params.id || req.params.productId);
});

// For order resources
export const orderOwnerOrAdmin = ownerOrAdmin(async (req) => {
  const { Order } = await import('../models/index.js');
  return await Order.findByPk(req.params.id || req.params.orderId);
});

// For review resources
export const reviewOwnerOrAdmin = ownerOrAdmin(async (req) => {
  const { Review } = await import('../models/index.js');
  return await Review.findByPk(req.params.id || req.params.reviewId);
});

// For cart resources
export const cartOwnerOrAdmin = ownerOrAdmin(async (req) => {
  const { Cart } = await import('../models/index.js');
  return await Cart.findOne({ where: { userId: req.params.userId || req.user.id } });
});