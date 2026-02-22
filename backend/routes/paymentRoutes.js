// routes/paymentRoutes.js
import express from 'express';
import {
    initiatePaymentHandler,
    handleCallback,
    checkStatusHandler,
    initiateRefundHandler,
} from '../controllers/paymentController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Any authenticated user — initiate a new PhonePe payment
router.post('/initiate', authenticate, initiatePaymentHandler);

// PhonePe server-to-server callback — no auth, signature-verified inside handler
router.post('/callback', handleCallback);

// Any authenticated user — poll payment status after returning from PhonePe page
router.get('/status/:merchantOrderId', authenticate, checkStatusHandler);

// Admin — initiate refund for a paid order
router.post('/refund/:orderId', authenticate, requireAdmin, initiateRefundHandler);

export default router;
