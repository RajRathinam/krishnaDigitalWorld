// routes/paymentRoutes.js
import express from 'express';
import {
  initiatePaymentHandler,
  handleCallback,
  checkStatusHandler,
  initiateRefundHandler,
  checkPhonePeConfigHandler,
  testPaymentHandler,
} from '../controllers/paymentController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────

// Helpful for debugging credentials / SDK setup
router.get('/check-config', checkPhonePeConfigHandler);

// PhonePe server-to-server callback — no auth, HMAC-verified inside handler
router.post('/callback', handleCallback);

// ── Authenticated (any customer) ──────────────────────────────────────────────

// Initiate a new PhonePe payment session
router.post('/initiate', authenticate, initiatePaymentHandler);

// Poll payment status after returning from PhonePe page
// This is the PRIMARY verification path on localhost (callback won't fire)
router.get('/status/:merchantOrderId', authenticate, checkStatusHandler);

// ── Authenticated (admin only) ────────────────────────────────────────────────

router.post('/refund/:orderId', authenticate, requireAdmin, initiateRefundHandler);

// ── Dev / Staging only ────────────────────────────────────────────────────────

if (process.env.NODE_ENV !== 'production') {
  // Quick SDK + config sanity check (no real payment initiated)
  router.post('/test', authenticate, testPaymentHandler);

  // Live SDK smoke-test — actually calls PhonePe UAT
  router.get('/debug-sdk', async (req, res) => {
    try {
      const { initiatePayment, checkPhonePeConfig } = await import('../services/phonePeService.js');

      const config = await checkPhonePeConfig();
      console.log('🔧 SDK debug config:', config);

      const testOrderId = `SDKTEST_${Date.now()}`;
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';

      const response = await initiatePayment({
        merchantOrderId: testOrderId,
        amount:          10000, // ₹100
        redirectUrl:     `${frontendUrl}/payment/return?merchantOrderId=${testOrderId}`,
        callbackUrl:     null,  // intentionally null for local test
        customerName:    'SDK Test',
        mobileNumber:    '9999999999',
        customerEmail:   'test@example.com',
      });

      return res.json({
        success:    true,
        config,
        response,
        note: 'PhonePe UAT SDK test — redirectUrl should point to mercury-uat.phonepe.com',
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error:   err.message,
        note:    'If this fails with "credentials invalid" or "mock mode", your PHONEPE_CLIENT_ID / PHONEPE_CLIENT_SECRET are wrong.',
      });
    }
  });
}

export default router;