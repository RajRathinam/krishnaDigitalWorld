// controllers/paymentController.js
// PhonePe PG v2 — SDK-only implementation
// Works on localhost (polling-based) and deployed (callback + polling).
//
// 🔐 Security: amount is ALWAYS calculated server-side from DB.
//              Frontend amount values are NEVER trusted.
// ─────────────────────────────────────────────────────────────────────────────

import {
  initiatePayment,
  checkPaymentStatus,
  initiateRefund,
  verifyCallbackSignature,
  checkPhonePeConfig,
} from '../services/phonePeService.js';
import { Order, Cart, Product, User, Coupon, UserCoupon, sequelize, Sequelize } from '../models/index.js';
import { generateOrderNumber } from '../utils/helpers.js';

const { FRONTEND_URL, APP_URL, NODE_ENV } = process.env;

// Prevent duplicate concurrent processing of the same order
const pendingVerifications = new Set();

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const safeParseStock = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      return typeof p === 'object' && p !== null && !Array.isArray(p) ? p : {};
    } catch { return {}; }
  }
  if (typeof raw === 'number') return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  return {};
};

const safeParseOrderItems = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch { return []; }
  }
  return [];
};

const deductStockForItems = async (rawOrderItems, transaction) => {
  const items = safeParseOrderItems(rawOrderItems);
  console.log(`📋 Deducting stock for ${items.length} item(s)`);

  for (const item of items) {
    const product = await Product.findByPk(item.productId, { transaction });
    if (!product) {
      console.warn(`⚠️  Product not found: ${item.productId}`);
      continue;
    }

    const stock = safeParseStock(product.stock);
    const updated = { ...stock };

    if (item.colorName) {
      const key =
        Object.keys(updated).find((k) => k === item.colorName) ||
        Object.keys(updated).find((k) => k.toLowerCase() === item.colorName.toLowerCase());
      if (key) {
        updated[key] = Math.max(0, (Number(updated[key]) || 0) - item.quantity);
      }
    } else {
      const first = Object.keys(updated)[0];
      if (first) {
        updated[first] = Math.max(0, (Number(updated[first]) || 0) - item.quantity);
      }
    }

    const totalRemaining = Object.values(updated).reduce((s, v) => s + (Number(v) || 0), 0);

    await sequelize.query(
      'UPDATE products SET stock = ?, availability = ? WHERE id = ?',
      {
        replacements: [JSON.stringify(updated), totalRemaining > 0 ? 1 : 0, item.productId],
        transaction,
      },
    );

    console.log(
      `✅ Stock updated — product=${item.productId} color=${item.colorName} ` +
      `remaining=${JSON.stringify(updated)}`
    );
  }
};

/**
 * Build the callback URL.
 *
 * Rules:
 *  - If PHONEPE_CALLBACK_URL is set in .env → use it (allows localhost dev to
 *    point at a deployed backend).
 *  - Else if APP_URL is public (not localhost) → derive from APP_URL.
 *  - Else → return null (no callback; rely on frontend status-polling instead).
 */
const buildCallbackUrl = () => {
  // Explicit override wins
  if (process.env.PHONEPE_CALLBACK_URL) {
    return process.env.PHONEPE_CALLBACK_URL.replace(/\/$/, '') + '/api/payments/callback';
  }

  // APP_URL must be a public host for PhonePe to reach it
  if (APP_URL) {
    try {
      const { hostname } = new URL(APP_URL);
      const isLocal =
        hostname === 'localhost' ||
        hostname.startsWith('127.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.');

      if (!isLocal) {
        return `${APP_URL.replace(/\/$/, '')}/api/payments/callback`;
      }
    } catch { /* invalid URL */ }
  }

  console.warn(
    '⚠️  No public callback URL available. ' +
    'Payment status will be verified via frontend polling only. ' +
    'Set PHONEPE_CALLBACK_URL in .env to point at a public server.'
  );
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/check-config
// ─────────────────────────────────────────────────────────────────────────────
export const checkPhonePeConfigHandler = async (req, res) => {
  try {
    const config      = await checkPhonePeConfig();
    const callbackUrl = buildCallbackUrl();

    return res.status(200).json({
      success: true,
      config,
      callbackUrl: callbackUrl || '(none — polling mode)',
      env: {
        APP_URL:               APP_URL        || '(not set)',
        FRONTEND_URL:          FRONTEND_URL   || '(not set)',
        PHONEPE_CALLBACK_URL:  process.env.PHONEPE_CALLBACK_URL || '(not set)',
        NODE_ENV:              NODE_ENV       || '(not set)',
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/initiate
// Auth: customer
// ─────────────────────────────────────────────────────────────────────────────
export const initiatePaymentHandler = async (req, res) => {
  const transaction = await sequelize.transaction();
  let committed = false;

  try {
    const { shippingAddress, billingAddress, notes, deliveryType, couponCode } = req.body;

    // ── Validate shipping address ────────────────────────────────────────────
    if (!shippingAddress || typeof shippingAddress !== 'object') {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Shipping address is required' });
    }

    // ── 1. Load cart ─────────────────────────────────────────────────────────
    const cart = await Cart.findOne({ where: { userId: req.user.id }, transaction });
    if (!cart?.items?.length) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const rawItems    = typeof cart.items === 'string' ? JSON.parse(cart.items) : cart.items;
    const validItems  = rawItems.filter((i) => i.productId && !isNaN(parseInt(i.productId)));

    if (!validItems.length) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Cart contains no valid items' });
    }

    // ── 2. Build order items & calculate server-side total ───────────────────
    const orderItems = [];
    let totalPrice   = 0;
    const shippingCost = deliveryType === 'express' ? 99.0 : 0.0;

    for (const item of validItems) {
      const product = await Product.findByPk(item.productId, { transaction });
      if (!product) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: `Product ${item.productId} not found`,
        });
      }

      // Per-colour stock check
      const stockObj = safeParseStock(product.stock);
      let available;

      if (item.colorName) {
        const key =
          Object.keys(stockObj).find((k) => k === item.colorName) ||
          Object.keys(stockObj).find((k) => k.toLowerCase() === item.colorName.toLowerCase());
        available = key !== undefined ? (Number(stockObj[key]) || 0) : 0;
      } else {
        available = Object.values(stockObj).reduce((s, v) => s + (Number(v) || 0), 0);
      }

      if (available < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `"${product.name}"${item.colorName ? ` (${item.colorName})` : ''} is out of stock. Available: ${available}`,
        });
      }

      const price     = product.discountPrice || product.price;
      const itemTotal = price * item.quantity;

      // Resolve image
      let itemImage = null;
      if (item.colorName && product.colorsAndImages?.[item.colorName]) {
        const imgs = product.colorsAndImages[item.colorName];
        const main = imgs.find((i) => i.type === 'main');
        itemImage = main?.url || imgs[0]?.url || null;
      } else if (product.images?.length) {
        itemImage = product.images[0].url;
      }

      orderItems.push({
        productId: product.id,
        name:      product.name,
        code:      product.code,
        price,
        quantity:  item.quantity,
        colorName: item.colorName || null,
        total:     itemTotal,
        image:     itemImage,
        variant:   product.variant,
      });

      totalPrice += itemTotal;
    }

    // ── Apply coupon (server-side authoritative) ───────────────────────────
    let discountAmount = 0;
    let couponId = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        where: {
          code: couponCode,
          isActive: true,
          validFrom: { [Sequelize.Op.lte]: new Date() },
          validUntil: { [Sequelize.Op.gte]: new Date() }
        },
        transaction,
      });

      if (coupon) {
        // Check usage limit
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          await transaction.rollback();
          return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
        }

        // Check minimum order amount
        if (coupon.minOrderAmount && totalPrice < coupon.minOrderAmount) {
          await transaction.rollback();
          return res.status(400).json({ success: false, message: `Minimum order amount of ${coupon.minOrderAmount} required for this coupon` });
        }

        // Check if user has already used this coupon (for single-use)
        if (coupon.isSingleUse) {
          const existingUsed = await UserCoupon.findOne({
            where: { userId: req.user.id, couponId: coupon.id, isUsed: true },
            transaction,
          });
          if (existingUsed) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'Coupon already used' });
          }
        }

        // Calculate discount
        let discount = 0;
        if (coupon.discountType === 'percentage') {
          discount = (totalPrice * coupon.discountValue) / 100;
          if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
        } else {
          discount = coupon.discountValue;
        }

        discountAmount = discount;
        couponId = coupon.id;

        // Mark or create a UserCoupon record (isUsed true, orderId null for now)
        const existingUserCoupon = await UserCoupon.findOne({ where: { userId: req.user.id, couponId: coupon.id }, transaction });
        if (existingUserCoupon) {
          await existingUserCoupon.update({ isUsed: true, usedAt: new Date(), orderId: null }, { transaction });
        } else {
          await UserCoupon.create({ userId: req.user.id, couponId: coupon.id, isUsed: true, usedAt: new Date(), orderId: null }, { transaction });
        }

        // Increment coupon usage
        await coupon.increment('usedCount', { transaction });
      }
    }

    const finalAmount   = Math.max(0, totalPrice + shippingCost - discountAmount);
    const amountInPaise = Math.round(finalAmount * 100);

    // ── 3. Generate IDs & create order (status=pending) ──────────────────────
    const orderNumber    = generateOrderNumber();
    const merchantOrderId = `MO${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const order = await Order.create(
      {
        orderNumber,
        merchantOrderId,
        userId:          req.user.id,
        orderItems,
        shippingAddress,
        billingAddress:  billingAddress || shippingAddress,
        paymentMethod:   'upi',
        paymentStatus:   'pending',
        orderStatus:     'pending',
        totalPrice,
        shippingCost,
        taxAmount:       0,
        discountAmount,
        finalAmount,
        couponId,
        notes:           notes || '',
      },
      { transaction },
    );

    // Update UserCoupon with orderId if coupon was applied
    if (couponId) {
      await UserCoupon.update(
        { orderId: order.id, isUsed: true, usedAt: new Date() },
        {
          where: {
            userId: req.user.id,
            couponId,
            orderId: null
          },
          transaction
        }
      );
    }

    await transaction.commit();
    committed = true;

    // ── 4. Fetch user details ────────────────────────────────────────────────
    const user = await User.findByPk(req.user.id, {
      attributes: ['name', 'phone', 'email'],
    });

    // ── 5. Build URLs ────────────────────────────────────────────────────────
    //   redirectUrl  — browser-based, can be localhost ✅
    //   callbackUrl  — server-to-server from PhonePe, must be public ⚠️
    const redirectUrl = `${FRONTEND_URL}/payment/return?merchantOrderId=${merchantOrderId}`;
    const callbackUrl = buildCallbackUrl();

    console.log('🔗 Payment URLs:', {
      redirectUrl,
      callbackUrl: callbackUrl || '(none — polling only)',
    });

    // ── 6. Call PhonePe SDK ──────────────────────────────────────────────────
    let phonePeResponse;
    try {
      phonePeResponse = await initiatePayment({
        merchantOrderId,
        amount:        amountInPaise,
        redirectUrl,
        callbackUrl,            // null is handled gracefully inside the service
        mobileNumber:  user?.phone,
        customerName:  user?.name,
        customerEmail: user?.email,
      });
    } catch (sdkErr) {
      // SDK call failed — do NOT fall back to a mock/localhost URL.
      // Surface the real error so the developer can fix the credentials.
      console.error('❌ PhonePe SDK call failed:', sdkErr.message);

      // Update order to record the failure
      await Order.update(
        { phonePeResponse: JSON.stringify({ error: sdkErr.message }) },
        { where: { id: order.id } },
      );

      return res.status(502).json({
        success: false,
        message: 'PhonePe payment gateway error. Please try again.',
        // Expose detail in non-production so developers can debug
        detail: NODE_ENV !== 'production' ? sdkErr.message : undefined,
        data: {
          orderId:       order.id,
          orderNumber:   order.orderNumber,
          merchantOrderId,
        },
      });
    }

    // ── 7. Persist PhonePe response & return redirect URL ────────────────────
    await Order.update(
      {
        phonePeResponse:     JSON.stringify(phonePeResponse.rawResponse || phonePeResponse),
        gatewayOrderId:      phonePeResponse.merchantOrderId || merchantOrderId,
        phonePeTransactionId: phonePeResponse.orderId || null,
      },
      { where: { id: order.id } },
    );

    console.log(`✅ Payment initiated — redirecting to: ${phonePeResponse.redirectUrl}`);

    const responsePayload = {
      success: true,
      message: 'Payment initiated successfully',
      data: {
        orderId:         order.id,
        orderNumber:     order.orderNumber,
        merchantOrderId,
        amount:          finalAmount,
        redirectUrl:     phonePeResponse.redirectUrl,  // ← always the real PhonePe URL
        pollingMode:     !callbackUrl, // inform frontend that callback won't fire
      },
    };

    // Add sandbox test hints in non-production
    if (!phonePeResponse.rawResponse?.isProd && NODE_ENV !== 'production') {
      responsePayload.data.testInfo = {
        note:    'UAT / sandbox — use test credentials below',
        phone:   '9999999999',
        otp:     '789456',
        cards:   [{ number: '4111 1111 1111 1111', expiry: '12/30', cvv: '123' }],
      };
    }

    return res.status(200).json(responsePayload);

  } catch (err) {
    if (!committed) await transaction.rollback();
    console.error('❌ initiatePaymentHandler error:', err);

    return res.status(500).json({
      success: false,
      message: 'Payment initiation failed',
      detail:  NODE_ENV !== 'production' ? err.message : undefined,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/callback
// Auth: NONE — PhonePe server-to-server. Always signature-verified.
// ─────────────────────────────────────────────────────────────────────────────
export const handleCallback = async (req, res) => {
  // Always respond 200 quickly; PhonePe retries on non-200
  const transaction = await sequelize.transaction();
  let verificationKey = null;

  try {
    // ── 1. Verify HMAC signature ─────────────────────────────────────────────
    const receivedSig = req.headers['x-verify'] || req.headers['x-signature'];
    const rawBody     = JSON.stringify(req.body);

    if (!verifyCallbackSignature(rawBody, receivedSig)) {
      await transaction.rollback();
      console.warn('⚠️  PhonePe callback: invalid signature');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    // ── 2. Extract IDs ───────────────────────────────────────────────────────
    const { merchantOrderId } = req.body;
    if (!merchantOrderId) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Missing merchantOrderId' });
    }

    verificationKey = merchantOrderId;

    if (pendingVerifications.has(verificationKey)) {
      await transaction.rollback();
      return res.status(200).json({ success: true, message: 'Already processing' });
    }
    pendingVerifications.add(verificationKey);

    // ── 3. Find order ────────────────────────────────────────────────────────
    const order = await Order.findOne({ where: { merchantOrderId }, transaction });
    if (!order) {
      await transaction.rollback();
      console.warn(`⚠️  Order not found: ${merchantOrderId}`);
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // ── 4. Idempotency guard ─────────────────────────────────────────────────
    if (order.paymentStatus === 'paid') {
      await transaction.rollback();
      return res.status(200).json({ success: true, message: 'Already processed' });
    }

    // ── 5. Re-verify via PhonePe Status API (never trust callback payload alone)
    let statusResponse;
    try {
      statusResponse = await checkPaymentStatus(merchantOrderId);
    } catch (err) {
      await transaction.rollback();
      console.error('❌ Status re-verify failed:', err.message);
      return res.status(200).json({ success: false, message: 'Status check failed' });
    }

    const { state, amount: confirmedAmount, paymentDetails } = statusResponse;
    const txnId = paymentDetails?.[0]?.transactionId || null;

    console.log(`📋 Callback verified — merchantOrderId=${merchantOrderId} state=${state}`);

    // ── 6. Handle COMPLETED ──────────────────────────────────────────────────
    if (state === 'COMPLETED') {
      // Amount integrity check
      const expectedPaise = Math.round(parseFloat(order.finalAmount) * 100);
      if (confirmedAmount && confirmedAmount !== expectedPaise) {
        console.error(
          `🚨 AMOUNT MISMATCH! expected=${expectedPaise} got=${confirmedAmount}`,
        );
        await transaction.rollback();
        await Order.update(
          { phonePeResponse: JSON.stringify({ ...statusResponse, ALERT: 'AMOUNT_MISMATCH' }) },
          { where: { id: order.id } },
        );
        return res.status(200).json({ success: false, message: 'Amount mismatch' });
      }

      await deductStockForItems(order.orderItems, transaction);

      const cart = await Cart.findOne({ where: { userId: order.userId }, transaction });
      if (cart) await cart.update({ items: [], totalAmount: 0 }, { transaction });

      await order.update(
        {
          paymentStatus:       'paid',
          orderStatus:         'processing',
          phonePeTransactionId: txnId,
          phonePeResponse:     JSON.stringify(statusResponse),
        },
        { transaction },
      );

      await transaction.commit();
      console.log(`✅ Order ${merchantOrderId} → PAID`);
      return res.status(200).json({ success: true, message: 'Payment confirmed' });
    }

    // ── 7. Handle FAILED / other ─────────────────────────────────────────────
    await order.update(
      {
        paymentStatus:   state === 'FAILED' ? 'failed' : 'pending',
        phonePeResponse: JSON.stringify(statusResponse),
      },
      { transaction },
    );

    await transaction.commit();
    console.log(`ℹ️  Order ${merchantOrderId} → ${state}`);
    return res.status(200).json({ success: true, message: `Payment ${state}` });

  } catch (err) {
    await transaction.rollback();
    console.error('❌ handleCallback error:', err);
    return res.status(200).json({ success: false, message: 'Internal error' });
  } finally {
    if (verificationKey) pendingVerifications.delete(verificationKey);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/status/:merchantOrderId
// Auth: customer (owns the order)
// Called by PaymentReturn.jsx via polling — primary verification on localhost.
// ─────────────────────────────────────────────────────────────────────────────
export const checkStatusHandler = async (req, res) => {
  const { merchantOrderId } = req.params;
  const lockKey = `status_${merchantOrderId}`;

  try {
    if (pendingVerifications.has(lockKey)) {
      return res.status(200).json({ success: true, inProgress: true });
    }
    pendingVerifications.add(lockKey);

    // Ownership check — no need to join User
    const order = await Order.findOne({
      where: { merchantOrderId, userId: req.user.id },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Already confirmed in DB
    if (order.paymentStatus === 'paid') {
      return res.status(200).json({
        success: true,
        data: {
          status:        'COMPLETED',
          orderId:       order.id,
          orderNumber:   order.orderNumber,
          amount:        order.finalAmount,
          paymentStatus: 'paid',
        },
      });
    }

    // ── Query PhonePe ────────────────────────────────────────────────────────
    let statusResponse;
    try {
      statusResponse = await checkPaymentStatus(merchantOrderId);
    } catch (apiErr) {
      console.error('❌ PhonePe status API error (falling back to DB):', apiErr.message);
      // Graceful degradation: return DB state so frontend can decide
      return res.status(200).json({
        success: true,
        data: {
          status:        order.paymentStatus === 'paid' ? 'COMPLETED' : 'PENDING',
          orderId:       order.id,
          orderNumber:   order.orderNumber,
          amount:        order.finalAmount,
          paymentStatus: order.paymentStatus,
          fallback:      true,
        },
      });
    }

    const { state, paymentDetails } = statusResponse;

    // ── If COMPLETED but callback missed (e.g. localhost) → settle now ───────
    if (state === 'COMPLETED' && order.paymentStatus !== 'paid') {
      const t = await sequelize.transaction();
      try {
        const txnId = paymentDetails?.[0]?.transactionId || null;

        await deductStockForItems(order.orderItems, t);

        const cart = await Cart.findOne({ where: { userId: order.userId }, transaction: t });
        if (cart) await cart.update({ items: [], totalAmount: 0 }, { transaction: t });

        await order.update(
          {
            paymentStatus:       'paid',
            orderStatus:         'processing',
            phonePeTransactionId: txnId,
            phonePeResponse:     JSON.stringify(statusResponse),
          },
          { transaction: t },
        );

        await t.commit();
        console.log(`✅ Status-poll settled order ${merchantOrderId} → PAID`);

        return res.status(200).json({
          success: true,
          data: {
            status:        'COMPLETED',
            orderId:       order.id,
            orderNumber:   order.orderNumber,
            amount:        order.finalAmount,
            paymentStatus: 'paid',
          },
        });
      } catch (innerErr) {
        await t.rollback();
        console.error('❌ Failed to settle via status poll:', innerErr);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        status:        state,
        orderId:       order.id,
        orderNumber:   order.orderNumber,
        amount:        order.finalAmount,
        paymentStatus: order.paymentStatus,
      },
    });

  } catch (err) {
    console.error('❌ checkStatusHandler error:', err);
    return res.status(500).json({ success: false, message: 'Error checking payment status' });
  } finally {
    pendingVerifications.delete(lockKey);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/refund/:orderId
// Auth: admin
// ─────────────────────────────────────────────────────────────────────────────
export const initiateRefundHandler = async (req, res) => {
  try {
    const { orderId }      = req.params;
    const { amount, reason } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({ success: false, message: 'Order is not paid' });
    }

    const refundAmount    = amount
      ? Math.round(parseFloat(amount) * 100)
      : Math.round(parseFloat(order.finalAmount) * 100);
    const merchantRefundId = `REF${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const refundResponse = await initiateRefund({
      originalMerchantOrderId: order.merchantOrderId,
      merchantRefundId,
      amount: refundAmount,
      reason,
    });

    await order.update({
      paymentStatus:   'refunded',
      phonePeResponse: JSON.stringify({
        ...(JSON.parse(order.phonePeResponse || '{}')),
        refund: refundResponse,
      }),
    });

    return res.status(200).json({
      success: true,
      message: 'Refund initiated',
      data: { merchantRefundId, refundResponse, amount: refundAmount / 100 },
    });
  } catch (err) {
    console.error('❌ initiateRefundHandler error:', err);
    return res.status(500).json({
      success: false,
      message: 'Refund failed',
      detail: NODE_ENV !== 'production' ? err.message : undefined,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/test   (non-production only)
// ─────────────────────────────────────────────────────────────────────────────
export const testPaymentHandler = async (req, res) => {
  const { merchantOrderId = `TEST_${Date.now()}` } = req.body;

  try {
    // Just check the SDK initialises and credentials resolve
    const config = await checkPhonePeConfig();
    return res.status(200).json({
      success: true,
      message: 'Config check passed',
      config,
      callbackUrl: buildCallbackUrl() || '(none — polling mode)',
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};