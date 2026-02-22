import express from 'express';
import {
  createOrder,
  getOrders,
  getOrder,
  cancelOrder,
  trackOrder,
  getOrderByNumber
} from '../controllers/orderController.js';
import { authenticate } from '../middleware/auth.js';
import { validateOrderData } from '../middleware/validation.js';

const router = express.Router();

// Public route
router.get('/track/:trackingId', trackOrder);

// Protected routes (any authenticated user)
router.use(authenticate);

router.post('/', validateOrderData, createOrder);
router.get('/', getOrders);
router.get('/number/:orderNumber', getOrderByNumber);
router.get('/:id', getOrder);
router.put('/:id/cancel', cancelOrder);

export default router;