import express from 'express';
import { 
  getDashboardStats,
  sendBirthdayWishes,
  broadcastCoupon,
  getUserAnalytics,
  exportUsers,
  searchUsers,
  getUserDetails,
  updateUser,
  toggleUserStatus,
  deleteUser,
  getUserOrdersAdmin,
  getUserReviewsAdmin,
  getUserCartAdmin,
  getCustomerAnalytics,
  testStats // Add this
} from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { adminLimiter, exportLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply admin authentication and rate limiting to all routes
router.use(authenticate, requireAdmin, adminLimiter);

// Dashboard routes
router.get('/stats', getDashboardStats);
router.get('/stats/test', testStats); // Add test route
router.post('/send-birthday-wishes', sendBirthdayWishes);
router.post('/broadcast-coupon', broadcastCoupon);

// User management routes
// Add this route
router.get('/users/analytics/customers', getCustomerAnalytics);
router.get('/users/analytics', getUserAnalytics);
router.get('/users/export', exportLimiter, exportUsers);
router.get('/users/search', searchUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id', updateUser);
router.put('/users/:id/status', toggleUserStatus);
router.delete('/users/:id', deleteUser);
router.get('/users/:id/orders', getUserOrdersAdmin);
router.get('/users/:id/reviews', getUserReviewsAdmin);
router.get('/users/:id/cart', getUserCartAdmin);
// In adminRoutes.js
router.get('/test-stats', testStats);
export default router;