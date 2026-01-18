import express from 'express';
import { 
  getPublicProfile,
  getUserProfile,
  updateProfile,
  completeProfile,
  getUserCart,
  getUserOrders,
  getUserReviews
} from '../controllers/userController.js';
import { authenticate, requireCustomer } from '../middleware/auth.js';
import { validateUserUpdateData } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.get('/public/:slug', getPublicProfile);

// Protected routes (customer only)
router.get('/profile', authenticate, requireCustomer, getUserProfile);
router.put('/profile', authenticate, requireCustomer, validateUserUpdateData, updateProfile);
router.post('/complete-profile', authenticate, requireCustomer, completeProfile);
router.get('/cart', authenticate, requireCustomer, getUserCart);
router.get('/orders', authenticate, requireCustomer, getUserOrders);
router.get('/reviews', authenticate, requireCustomer, getUserReviews);

export default router;