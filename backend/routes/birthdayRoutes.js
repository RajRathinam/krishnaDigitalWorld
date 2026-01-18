import express from 'express';
import { 
  getTodayBirthdays,
  sendBirthdayWish,
  sendBirthdayOffer
} from '../controllers/birthdayController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes (with authentication)
router.get('/today', authenticate, requireAdmin, getTodayBirthdays);
router.post('/:userId/wish', authenticate, requireAdmin, sendBirthdayWish);
router.post('/:userId/offer', authenticate, requireAdmin, sendBirthdayOffer);

export default router;