import express from 'express';
import {
  getAllCoupons,
  createCoupon,
  getCouponDetails,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
  getCouponStats
} from '../controllers/couponController.js';
import {
  validateCouponForCart,
  getMyCoupons
} from '../controllers/couponController.js';
import { authenticate, requireAdmin, requireCustomer } from '../middleware/auth.js';
import { validateCouponData } from '../middleware/validation.js';

const router = express.Router();

// Admin routes
router.get('/admin', authenticate, requireAdmin, getAllCoupons);
router.post('/admin', authenticate, requireAdmin, validateCouponData, createCoupon);
router.get('/admin/stats', authenticate, requireAdmin, getCouponStats);
router.get('/admin/:id', authenticate, requireAdmin, getCouponDetails);
router.put('/admin/:id', authenticate, requireAdmin, updateCoupon);
router.put('/admin/:id/status', authenticate, requireAdmin, toggleCouponStatus);
router.delete('/admin/:id', authenticate, requireAdmin, deleteCoupon);

// Customer routes
router.post('/validate', authenticate, requireCustomer, validateCouponForCart);
router.get('/my-coupons', authenticate, requireCustomer, getMyCoupons);

export default router;