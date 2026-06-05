import express from 'express';
import { 
  getPublicProfile,
  getUserProfile,
  updateProfile,
  completeProfile,
  getUserCart,
  getUserOrders,
  getUserReviews,
  savePushToken
} from '../controllers/userController.js';
import { authenticate, requireCustomer } from '../middleware/auth.js';
import { validateUserUpdateData } from '../middleware/validation.js';
import { uploadSingleImage, processUploadedFiles } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/public/:slug', getPublicProfile);

// Protected routes (customer only)
router.get('/profile', authenticate, requireCustomer, getUserProfile);
router.put(
  '/profile', 
  authenticate, 
  requireCustomer, 
  uploadSingleImage('profileImage', 'users'),
  processUploadedFiles,
  validateUserUpdateData, 
  updateProfile
);
router.post('/complete-profile', authenticate, requireCustomer, completeProfile);
router.get('/cart', authenticate, requireCustomer, getUserCart);
router.get('/orders', authenticate, requireCustomer, getUserOrders);
router.get('/reviews', authenticate, requireCustomer, getUserReviews);
router.post('/push-token', authenticate, savePushToken);

export default router;