import express from 'express';
import { 
  getTodayBirthdays,
  sendBirthdayWish,
  sendBirthdayOffer
} from '../controllers/birthdayController.js';
import { authenticate, requireAdminOrSubadmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes (with authentication)
router.get('/today', authenticate, requireAdminOrSubadmin, getTodayBirthdays);
router.post('/:userId/wish', authenticate, requireAdminOrSubadmin, sendBirthdayWish);
router.post('/:userId/offer', authenticate, requireAdminOrSubadmin, sendBirthdayOffer);

export default router;