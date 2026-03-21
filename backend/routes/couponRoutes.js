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
  getMyCoupons,
  getUnnotifiedCoupons,
  markCouponAsNotified
} from '../controllers/couponController.js';
import { authenticate, requireAdmin, requireCustomer,requireAdminOrSubadmin } from '../middleware/auth.js';
import { validateCouponData } from '../middleware/validation.js';

const router = express.Router();

// ========== ADMIN ROUTES ==========
// IMPORTANT: Specific routes must come BEFORE parameterized routes

// 1. STATS ROUTE (most specific)
router.get('/admin/stats', authenticate, requireAdminOrSubadmin, getCouponStats);

// 2. USER COUPON MANAGEMENT ROUTES (specific)
router.get('/admin/user-coupons', authenticate, requireAdminOrSubadmin, getAllUserCoupons);
router.post('/admin/users/:userId/assign-coupon', authenticate, requireAdminOrSubadmin, assignCouponToUser);
router.get('/admin/users/:userId/coupons', authenticate, requireAdminOrSubadmin, getUserCoupons);
router.delete('/admin/users/:userId/coupons/:userCouponId', authenticate, requireAdminOrSubadmin, deleteUserCoupon);

// 3. COUPON CRUD ROUTES (parameterized - must come last)
router.get('/admin', authenticate, requireAdminOrSubadmin, getAllCoupons);
router.post('/admin', authenticate, requireAdminOrSubadmin, validateCouponData, createCoupon);
router.get('/admin/:id', authenticate, requireAdminOrSubadmin, getCouponDetails);
router.put('/admin/:id', authenticate, requireAdminOrSubadmin, updateCoupon);
router.put('/admin/:id/status', authenticate, requireAdminOrSubadmin, toggleCouponStatus);
router.delete('/admin/:id', authenticate, requireAdminOrSubadmin, deleteCoupon);

// ========== CUSTOMER ROUTES ==========
router.post('/validate', authenticate, requireCustomer, validateCouponForCart);
router.get('/my-coupons', authenticate, requireCustomer, getMyCoupons);
router.get('/unnotified', authenticate, requireCustomer, getUnnotifiedCoupons);
router.put('/:userCouponId/notify', authenticate, requireCustomer, markCouponAsNotified);

export default router;