import express from 'express';
import {
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
  updatePaymentStatus,
  getOrderStats,
  searchOrders
} from '../controllers/adminOrderController.js';
import { authenticate, requireAdminOrSubadmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, requireAdminOrSubadmin);

router.get('/', getAllOrders);
router.get('/stats', getOrderStats);
router.get('/search', searchOrders);
router.get('/:id', getOrderDetails);
router.put('/:id/status', updateOrderStatus);
router.put('/:id/payment', updatePaymentStatus);

export default router;