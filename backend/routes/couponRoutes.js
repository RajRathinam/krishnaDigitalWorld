import express from 'express';
import {
  getAllCoupons,
  createCoupon,
  getCouponDetails,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
  getCouponStats,
  assignCouponToUser,
  getUserCoupons,
  deleteUserCoupon,
  getAllUserCoupons,
  validateCouponForCart,
  getMyCoupons
} from '../controllers/couponController.js';
import { authenticate, requireAdmin, requireCustomer } from '../middleware/auth.js';
import { validateCouponData } from '../middleware/validation.js';

const router = express.Router();

// ========== ADMIN ROUTES ==========
// IMPORTANT: Specific routes must come BEFORE parameterized routes

// 1. STATS ROUTE (most specific)
router.get('/admin/stats', authenticate, requireAdmin, getCouponStats);

// 2. USER COUPON MANAGEMENT ROUTES (specific)
router.get('/admin/user-coupons', authenticate, requireAdmin, getAllUserCoupons);
router.post('/admin/users/:userId/assign-coupon', authenticate, requireAdmin, assignCouponToUser);
router.get('/admin/users/:userId/coupons', authenticate, requireAdmin, getUserCoupons);
router.delete('/admin/users/:userId/coupons/:userCouponId', authenticate, requireAdmin, deleteUserCoupon);

// 3. COUPON CRUD ROUTES (parameterized - must come last)
router.get('/admin', authenticate, requireAdmin, getAllCoupons);
router.post('/admin', authenticate, requireAdmin, validateCouponData, createCoupon);
router.get('/admin/:id', authenticate, requireAdmin, getCouponDetails);
router.put('/admin/:id', authenticate, requireAdmin, updateCoupon);
router.put('/admin/:id/status', authenticate, requireAdmin, toggleCouponStatus);
router.delete('/admin/:id', authenticate, requireAdmin, deleteCoupon);

// ========== CUSTOMER ROUTES ==========
router.post('/validate', authenticate, requireCustomer, validateCouponForCart);
router.get('/my-coupons', authenticate, requireCustomer, getMyCoupons);

export default router;