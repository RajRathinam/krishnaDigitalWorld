/**
 * Admin middleware
 * Checks if user has admin role
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

/**
 * Admin or Subadmin middleware
 * Checks if user has admin or subadmin role
 */
export const requireAdminOrSubadmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'subadmin')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin or Subadmin privileges required.'
    });
  }
  next();
};

/**
 * Super admin middleware (if you have multiple admin levels)
 */
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super admin privileges required.'
    });
  }
  // Additional checks for super admin could go here
  next();
};