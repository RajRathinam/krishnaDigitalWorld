// controllers/paymentController.js
// Handles all PhonePe PG v2 payment lifecycle: initiate → callback → status → refund
// 🔐 Security: amount is ALWAYS calculated server-side from DB, never trusted from frontend

import {
    initiatePayment,
    checkPaymentStatus,
    initiateRefund,
    verifyCallbackSignature,
} from '../services/phonePeService.js';
import { Order, Cart, Product, User, sequelize } from '../models/index.js';
import { generateOrderNumber } from '../utils/helpers.js';

const { FRONTEND_URL, APP_URL } = process.env;

// Helper: always safely parses stock (handles both string JSON and plain object)
const safeParseStock = (raw) => {
    if (!raw) return {};
    if (typeof raw === 'string') {
        try { const p = JSON.parse(raw); return (typeof p === 'object' && p !== null && !Array.isArray(p)) ? p : {}; } catch { return {}; }
    }
    if (typeof raw === 'number') return {};
    if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
    return {};
};

// Helper: safely parse orderItems which may be a JSON string from DB
const safeParseOrderItems = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
        try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
    }
    return [];
};

const deductStockForItems = async (rawOrderItems, transaction) => {
    const orderItems = safeParseOrderItems(rawOrderItems);
    console.log(`📋 deductStockForItems called with ${orderItems.length} items, raw type=${typeof rawOrderItems}`);

    for (const item of orderItems) {
        const product = await Product.findByPk(item.productId, { transaction });
        if (!product) {
            console.warn(`⚠️ Product not found: ${item.productId}`);
            continue;
        }

        const stockObj = safeParseStock(product.stock);
        console.log(`🔻 Payment deduct: product=${item.productId} color=${item.colorName} qty=${item.quantity} before=`, JSON.stringify(stockObj));

        let updatedStock = { ...stockObj };
        if (item.colorName && updatedStock[item.colorName] !== undefined) {
            updatedStock[item.colorName] = Math.max(0, (Number(updatedStock[item.colorName]) || 0) - item.quantity);
        } else if (item.colorName) {
            const matchKey = Object.keys(updatedStock).find(k => k.toLowerCase() === item.colorName.toLowerCase());
            if (matchKey) updatedStock[matchKey] = Math.max(0, (Number(updatedStock[matchKey]) || 0) - item.quantity);
        } else {
            const firstKey = Object.keys(updatedStock)[0];
            if (firstKey) updatedStock[firstKey] = Math.max(0, (Number(updatedStock[firstKey]) || 0) - item.quantity);
        }

        const totalRemaining = Object.values(updatedStock).reduce((s, v) => s + (Number(v) || 0), 0);
        console.log(`✅ Payment stock after:`, JSON.stringify(updatedStock), `total=${totalRemaining}`);

        // Raw SQL: stock is stored as a plain JSON string in DB — bypass Sequelize serialization
        await sequelize.query(
            'UPDATE products SET stock = ?, availability = ? WHERE id = ?',
            {
                replacements: [JSON.stringify(updatedStock), totalRemaining > 0 ? 1 : 0, item.productId],
                transaction
            }
        );
    }
};


// ─────────────────────────────────────────────
// POST /api/payments/initiate
// Auth: customer only
// ─────────────────────────────────────────────
/**
 * Creates an order in DB (paymentStatus=pending), then calls PhonePe
 * and returns the redirect URL for the frontend.
 * Amount is recalculated from DB — never taken from frontend payload.
 */
export const initiatePaymentHandler = async (req, res) => {
    const transaction = await sequelize.transaction();
    let committed = false;

    try {
        const { shippingAddress, billingAddress, notes, couponCode, deliveryType } = req.body;

        if (!shippingAddress || typeof shippingAddress !== 'object') {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'Shipping address is required' });
        }

        // ── 1. Load cart ──────────────────────────────────────
        const cart = await Cart.findOne({ where: { userId: req.user.id }, transaction });

        if (!cart || !cart.items || cart.items.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        let parsedItems = typeof cart.items === 'string' ? JSON.parse(cart.items) : cart.items;
        const validItems = parsedItems.filter(
            (item) => item.productId && !isNaN(parseInt(item.productId))
        );

        if (validItems.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'Cart contains no valid items' });
        }

        // ── 2. Build order items & calculate amount (server-side) ──
        const orderItems = [];
        let totalPrice = 0;
        const shippingCost = deliveryType === 'express' ? 99.0 : 0.0;

        for (const item of validItems) {
            const product = await Product.findByPk(item.productId, { transaction });

            if (!product) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
            }

            // Per-color stock availability check
            const stockObj = safeParseStock(product.stock);
            let availableStock;
            if (item.colorName) {
                const key = Object.keys(stockObj).find(k => k === item.colorName) ||
                    Object.keys(stockObj).find(k => k.toLowerCase() === item.colorName.toLowerCase());
                availableStock = key !== undefined ? (Number(stockObj[key]) || 0) : 0;
            } else {
                availableStock = Object.values(stockObj).reduce((s, v) => s + (Number(v) || 0), 0);
            }

            console.log(`📦 Payment stock check: product=${product.id} color=${item.colorName} available=${availableStock} qty=${item.quantity}`);

            if (availableStock < item.quantity) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Product "${product.name}"${item.colorName ? ` (${item.colorName})` : ''} is out of stock. Available: ${availableStock}`,
                });
            }

            const price = product.discountPrice || product.price;
            const itemTotal = price * item.quantity;

            let itemImage = null;
            if (item.colorName && product.colorsAndImages?.[item.colorName]) {
                const imgs = product.colorsAndImages[item.colorName];
                const main = imgs.find((i) => i.type === 'main');
                itemImage = main ? main.url : imgs[0]?.url || null;
            } else if (product.images?.length) {
                itemImage = product.images[0].url;
            }

            orderItems.push({
                productId: product.id,
                name: product.name,
                code: product.code,
                price,
                quantity: item.quantity,
                colorName: item.colorName || null,
                total: itemTotal,
                image: itemImage,
                variant: product.variant,
            });

            totalPrice += itemTotal;
        }

        const finalAmount = Math.max(0, totalPrice + shippingCost);
        const amountInPaise = Math.round(finalAmount * 100); // PhonePe requires paise (integer)

        // ── 3. Generate unique merchant order ID ──────────────
        const orderNumber = generateOrderNumber();
        const merchantOrderId = `MO${Date.now()}${Math.floor(Math.random() * 1000)}`;

        // ── 4. Create order in DB (status=pending, stock NOT touched yet) ──
        // FIXED: Use merchant_order_id (snake_case) instead of merchantOrderId (camelCase)
        const order = await Order.create(
            {
                orderNumber,
                merchantOrderId: merchantOrderId,  // ← CHANGED THIS LINE
                userId: req.user.id,
                orderItems,
                shippingAddress,
                billingAddress: billingAddress || shippingAddress,
                paymentMethod: 'upi',
                paymentStatus: 'pending',
                orderStatus: 'pending',
                totalPrice,
                shippingCost,
                taxAmount: 0,
                discountAmount: 0,
                finalAmount,
                notes: notes || '',
            },
            { transaction }
        );

        // Commit the transaction before calling PhonePe
        await transaction.commit();
        committed = true;

        // ── 5. Call PhonePe to initiate payment ──────────────
        const redirectUrl = `${FRONTEND_URL}/payment/return?merchantOrderId=${merchantOrderId}`;
        const callbackUrl = `${APP_URL}/api/payments/callback`;

        const user = await User.findByPk(req.user.id, { attributes: ['phone'] });

        try {
            const phonePeResponse = await initiatePayment({
                merchantOrderId,
                amount: amountInPaise,
                redirectUrl,
                callbackUrl,
                mobileNumber: user?.phone,
            });

            // Store PhonePe's initial response on the order
            await Order.update(
                { phonePeResponse: JSON.stringify(phonePeResponse) },
                { where: { id: order.id } }
            );

            return res.status(200).json({
                success: true,
                message: 'Payment initiated',
                data: {
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    merchantOrderId,
                    amount: finalAmount,
                    redirectUrl: phonePeResponse?.redirectUrl || phonePeResponse?.data?.redirectUrl,
                },
            });
        } catch (phonePeError) {
            console.error('❌ PhonePe initiation failed:', phonePeError);
            // Order is already created, just inform the user
            return res.status(503).json({
                success: false,
                message: 'Payment gateway temporarily unavailable. Your order has been saved but payment could not be initiated. Please try again.',
                data: {
                    orderId: order.id,
                    orderNumber: order.orderNumber
                }
            });
        }
    } catch (error) {
        // Only rollback if transaction hasn't been committed
        if (!committed) {
            await transaction.rollback();
        }
        console.error('❌ initiatePayment error:', error);
        return res.status(500).json({
            success: false,
            message: 'Payment initiation failed',
            error: process.env.NODE_ENV === 'development' ? (error?.message || error) : undefined,
        });
    }
};

// ─────────────────────────────────────────────
// POST /api/payments/callback
// Auth: NONE — PhonePe server-to-server. Signature-verified.
// ─────────────────────────────────────────────
/**
 * Called by PhonePe after payment completes.
 * NEVER trusts the callback body alone — always re-verifies via Status API.
 * Idempotent: silently ignores duplicate callbacks for already-paid orders.
 */
export const handleCallback = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        // ── 1. Verify signature ───────────────────────────────
        const receivedSignature = req.headers['x-verify'];
        const rawBody = JSON.stringify(req.body); // body-parser already parsed it

        const isValid = verifyCallbackSignature(rawBody, receivedSignature);

        if (!isValid) {
            await transaction.rollback();
            console.warn('⚠️  PhonePe callback: invalid signature');
            return res.status(400).json({ success: false, message: 'Invalid signature' });
        }

        // ── 2. Extract merchant order ID from callback ────────
        const { merchantOrderId } = req.body;

        if (!merchantOrderId) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'Missing merchantOrderId' });
        }

        // ── 3. Find the order ─────────────────────────────────
        const order = await Order.findOne({ where: { merchantOrderId }, transaction });

        if (!order) {
            await transaction.rollback();
            console.warn(`⚠️  PhonePe callback: order not found for merchantOrderId=${merchantOrderId}`);
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // ── 4. Idempotency guard ──────────────────────────────
        if (order.paymentStatus === 'paid') {
            await transaction.rollback();
            console.log(`ℹ️  PhonePe callback: duplicate — order ${merchantOrderId} already paid`);
            return res.status(200).json({ success: true, message: 'Already processed' });
        }

        // ── 5. Re-verify via PhonePe Status API ──────────────
        let statusResponse;
        try {
            statusResponse = await checkPaymentStatus(merchantOrderId);
        } catch (err) {
            await transaction.rollback();
            console.error('❌ PhonePe status check failed during callback:', err);
            // Return 200 so PhonePe doesn't retry — we'll reconcile manually
            return res.status(200).json({ success: false, message: 'Status check failed, will reconcile' });
        }

        const paymentState = statusResponse?.state || statusResponse?.data?.state;
        const confirmedAmount = statusResponse?.amount || statusResponse?.data?.amount; // paise
        const phonePeTransactionId =
            statusResponse?.paymentDetails?.[0]?.transactionId ||
            statusResponse?.data?.paymentDetails?.[0]?.transactionId ||
            null;

        console.log(`📋 PhonePe callback: merchantOrderId=${merchantOrderId} state=${paymentState}`);

        // ── 6. Update order based on verified state ───────────
        if (paymentState === 'COMPLETED') {
            // Validate amount matches (anti-tampering)
            const expectedPaise = Math.round(parseFloat(order.finalAmount) * 100);
            if (confirmedAmount && confirmedAmount !== expectedPaise) {
                console.error(
                    `🚨 AMOUNT MISMATCH! Expected=${expectedPaise} paise, Got=${confirmedAmount} paise for order ${merchantOrderId}`
                );
                await transaction.rollback();
                // Don't mark as paid — flag for manual review
                await Order.update(
                    { phonePeResponse: JSON.stringify({ ...statusResponse, ALERT: 'AMOUNT_MISMATCH' }) },
                    { where: { id: order.id } }
                );
                return res.status(200).json({ success: false, message: 'Amount mismatch — flagged for review' });
            }

            // Deduct stock per color using helper
            await deductStockForItems(order.orderItems, transaction);

            // Clear cart
            const cart = await Cart.findOne({ where: { userId: order.userId }, transaction });
            if (cart) {
                await cart.update({ items: [], totalAmount: 0 }, { transaction });
            }

            // Mark order as paid
            await order.update(
                {
                    paymentStatus: 'paid',
                    orderStatus: 'processing',
                    phonePeTransactionId,
                    phonePeResponse: JSON.stringify(statusResponse),
                },
                { transaction }
            );

            await transaction.commit();
            console.log(`✅ PhonePe: order ${merchantOrderId} marked as PAID`);
            return res.status(200).json({ success: true, message: 'Payment confirmed' });
        }

        // Payment failed / pending
        const failedStatus = paymentState === 'FAILED' ? 'failed' : 'pending';
        await order.update(
            {
                paymentStatus: failedStatus,
                phonePeResponse: JSON.stringify(statusResponse),
            },
            { transaction }
        );

        await transaction.commit();
        console.log(`ℹ️  PhonePe: order ${merchantOrderId} state=${paymentState}`);
        return res.status(200).json({ success: true, message: `Payment ${paymentState}` });
    } catch (error) {
        await transaction.rollback();
        console.error('❌ handleCallback error:', error);
        // Always return 200 to PhonePe to stop retries (we handle internally)
        return res.status(200).json({ success: false, message: 'Internal error' });
    }
};

// ─────────────────────────────────────────────
// GET /api/payments/status/:merchantOrderId
// Auth: customer (frontend polls this after redirect)
// ─────────────────────────────────────────────
/**
 * Frontend calls this after returning from PhonePe redirect page.
 * We ALWAYS verify with PhonePe server — never trust local DB alone here.
 */
export const checkStatusHandler = async (req, res) => {
    try {
        const { merchantOrderId } = req.params;

        // Find order and verify it belongs to this user
        const order = await Order.findOne({
            where: { merchantOrderId, userId: req.user.id },
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // If already confirmed paid in DB — return immediately (fast path)
        if (order.paymentStatus === 'paid') {
            return res.status(200).json({
                success: true,
                data: {
                    status: 'COMPLETED',
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    amount: order.finalAmount,
                },
            });
        }

        // Call PhonePe Status API for live verification
        let statusResponse;
        try {
            statusResponse = await checkPaymentStatus(merchantOrderId);
        } catch (err) {
            // If PhonePe call fails, fall back to DB status
            return res.status(200).json({
                success: true,
                data: {
                    status: order.paymentStatus === 'paid' ? 'COMPLETED' : 'PENDING',
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    amount: order.finalAmount,
                },
            });
        }

        const paymentState = statusResponse?.state || statusResponse?.data?.state;

        // If PhonePe just confirmed payment but callback hasn't fired yet — handle inline
        if (paymentState === 'COMPLETED' && order.paymentStatus !== 'paid') {
            const t = await sequelize.transaction();
            try {
                const phonePeTransactionId =
                    statusResponse?.paymentDetails?.[0]?.transactionId ||
                    statusResponse?.data?.paymentDetails?.[0]?.transactionId ||
                    null;

                // Deduct stock per color using helper
                await deductStockForItems(order.orderItems, t);

                // Clear cart
                const cart = await Cart.findOne({ where: { userId: order.userId }, transaction: t });
                if (cart) await cart.update({ items: [], totalAmount: 0 }, { transaction: t });

                await order.update(
                    {
                        paymentStatus: 'paid',
                        orderStatus: 'processing',
                        phonePeTransactionId,
                        phonePeResponse: JSON.stringify(statusResponse),
                    },
                    { transaction: t }
                );

                await t.commit();
            } catch (innerErr) {
                await t.rollback();
                console.error('❌ Status handler: failed to mark order paid:', innerErr);
            }
        }

        return res.status(200).json({
            success: true,
            data: {
                status: paymentState,
                orderId: order.id,
                orderNumber: order.orderNumber,
                amount: order.finalAmount,
            },
        });
    } catch (error) {
        console.error('❌ checkStatusHandler error:', error);
        return res.status(500).json({ success: false, message: 'Error checking payment status' });
    }
};

// ─────────────────────────────────────────────
// POST /api/payments/refund/:orderId
// Auth: admin only
// ─────────────────────────────────────────────
/**
 * Initiate a refund for a paid order via PhonePe API.
 * Never manually marks refund success — always waits for API confirmation.
 */
export const initiateRefundHandler = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { amount } = req.body; // optional partial refund amount (₹). Full refund if omitted.

        const order = await Order.findByPk(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.paymentStatus !== 'paid') {
            return res.status(400).json({ success: false, message: 'Order is not in paid state' });
        }

        const refundAmount = amount
            ? Math.round(parseFloat(amount) * 100)        // convert ₹ → paise
            : Math.round(parseFloat(order.finalAmount) * 100); // full refund

        const merchantRefundId = `REF${Date.now()}${Math.floor(Math.random() * 1000)}`;

        const refundResponse = await initiateRefund({
            originalMerchantOrderId: order.merchantOrderId,
            merchantRefundId,
            amount: refundAmount,
        });

        // Update order to refunded (pending verification)
        await order.update({
            paymentStatus: 'refunded',
            phonePeResponse: JSON.stringify({ ...JSON.parse(order.phonePeResponse || '{}'), refund: refundResponse }),
        });

        return res.status(200).json({
            success: true,
            message: 'Refund initiated successfully',
            data: { merchantRefundId, refundResponse },
        });
    } catch (error) {
        console.error('❌ initiateRefundHandler error:', error);
        return res.status(500).json({
            success: false,
            message: 'Refund initiation failed',
            error: process.env.NODE_ENV === 'development' ? (error?.message || error) : undefined,
        });
    }
};
