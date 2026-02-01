import express from 'express';
import { 
  register, 
  verifyOTP, 
  login, 
  verifyLogin, 
  resendOTPController,
  logout,
  getMe,
  updateMe,
  completeProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddressController
} from '../controllers/authController.js';
import { 
  validateRegistrationData, 
  validateLoginData, 
  validateOTPData,
  validateResendOTPData
} from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes
router.post('/register', validateRegistrationData, register);
router.post('/verify-otp', validateOTPData, verifyOTP);
router.post('/login', validateLoginData, login);
router.post('/verify-login', validateOTPData, verifyLogin);
router.post('/resend-otp', otpLimiter, validateResendOTPData, resendOTPController);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMe);
router.post('/complete-profile', authenticate, completeProfile);

// Address management routes
router.post('/addresses', authenticate, addAddress);
router.put('/addresses/:addressId', authenticate, updateAddress);
router.delete('/addresses/:addressId', authenticate, deleteAddress);
router.put('/addresses/:addressId/default', authenticate, setDefaultAddressController);

export default router;