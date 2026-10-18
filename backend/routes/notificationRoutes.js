import express from 'express';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getMyNotifications);
router.patch('/read-all', authenticate, markAllNotificationsRead);
router.patch('/:id/read', authenticate, markNotificationRead);

export default router;
