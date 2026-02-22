// services/phonePeService.js
// PhonePe PG v2 — OAuth token-based integration
// All PhonePe API communication lives here. Never called from frontend.

import axios from 'axios';
import crypto from 'crypto';

const {
  PHONEPE_CLIENT_ID,
  PHONEPE_CLIENT_SECRET,
  PHONEPE_CLIENT_VERSION,
  PHONEPE_BASE_URL,
  PHONEPE_OAUTH_URL,
} = process.env;

// ─────────────────────────────────────────────
// In-memory token cache (reuse until near expiry)
// ─────────────────────────────────────────────
let _cachedToken = null;
let _tokenExpiresAt = 0; // epoch ms

/**
 * Fetch a fresh OAuth access token from PhonePe.
 * Caches in memory and only refreshes when within 60 seconds of expiry.
 */
export const getAccessToken = async () => {
  const now = Date.now();

  // Return cached token if still valid (with 60 s buffer)
  if (_cachedToken && now < _tokenExpiresAt - 60_000) {
    return _cachedToken;
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: PHONEPE_CLIENT_ID,
      client_secret: PHONEPE_CLIENT_SECRET,
      client_version: PHONEPE_CLIENT_VERSION,
    });

    const response = await axios.post(PHONEPE_OAUTH_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10_000,
    });

    const { access_token, expires_in, expires_at } = response.data;

    _cachedToken = access_token;

    // expires_at is epoch seconds from PhonePe (fallback: now + expires_in seconds)
    _tokenExpiresAt = expires_at
      ? expires_at * 1000
      : now + (expires_in || 3600) * 1000;

    console.log('✅ PhonePe: obtained new access token');
    return _cachedToken;
  } catch (err) {
    const msg = err?.response?.data || err.message;
    console.error('❌ PhonePe: failed to get access token:', msg);
    throw new Error('PhonePe authentication failed');
  }
};

// ─────────────────────────────────────────────
// Authorised Axios helper
// ─────────────────────────────────────────────
const phonePeRequest = async (method, path, data = null) => {
  const token = await getAccessToken();

  const config = {
    method,
    url: `${PHONEPE_BASE_URL}${path}`,
    headers: {
      Authorization: `O-Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    timeout: 15_000,
  };

  if (data) config.data = data;

  try {
    const res = await phonePeRequest._axios(config);
    return res.data;
  } catch (err) {
    const errorData = err?.response?.data;
    console.error(`❌ PhonePe API ${method.toUpperCase()} ${path} failed:`, errorData || err.message);
    throw errorData || { message: err.message };
  }
};

// Attach real axios so it can be easily mocked in tests
phonePeRequest._axios = axios;

// ─────────────────────────────────────────────
// Payment Initiation
// ─────────────────────────────────────────────
/**
 * Initiate a payment on PhonePe.
 * @param {object} params
 * @param {string} params.merchantOrderId  Unique order ID (stored in DB)
 * @param {number} params.amount           Amount in paise (₹1 = 100)  
 * @param {string} params.redirectUrl      Frontend URL for post-payment redirect
 * @param {string} params.callbackUrl      Backend URL for PhonePe server-to-server callback
 * @param {string} [params.mobileNumber]   Customer mobile (optional, improves UPI autofill)
 */
export const initiatePayment = async ({ merchantOrderId, amount, redirectUrl, callbackUrl, mobileNumber }) => {
  const payload = {
    merchantOrderId,
    amount,           // in paise
    expireAfter: 1200, // seconds (20 minutes)
    paymentFlow: {
      type: 'PG_CHECKOUT',
      message: 'Payment for Krishna Digital World',
      merchantUrls: {
        redirectUrl,
        callbackUrl,
      },
    },
  };

  // Attach customer mobile if available (improves PhonePe UPI pre-fill)
  if (mobileNumber) {
    payload.metaInfo = { udf1: mobileNumber };
  }

  const response = await phonePeRequest('post', '/checkout/v2/pay', payload);
  return response; // { orderId, state, redirectUrl, ... }
};

// ─────────────────────────────────────────────
// Payment Status Check
// ─────────────────────────────────────────────
/**
 * Check payment status from PhonePe (always verify server-side, never trust frontend redirect).
 * @param {string} merchantOrderId
 */
export const checkPaymentStatus = async (merchantOrderId) => {
  const response = await phonePeRequest('get', `/checkout/v2/order/${merchantOrderId}/status`);
  return response; // { state, amount, paymentDetails, ... }
};

// ─────────────────────────────────────────────
// Refund
// ─────────────────────────────────────────────
/**
 * Initiate a refund for a paid order.
 * @param {object} params
 * @param {string} params.originalMerchantOrderId  Original order ID
 * @param {string} params.merchantRefundId         Unique refund ID you generate
 * @param {number} params.amount                   Refund amount in paise
 */
export const initiateRefund = async ({ originalMerchantOrderId, merchantRefundId, amount }) => {
  const payload = {
    merchantRefundId,
    originalMerchantOrderId,
    amount,
  };

  const response = await phonePeRequest('post', '/checkout/v2/refund', payload);
  return response;
};

// ─────────────────────────────────────────────
// Signature Verification (for callback)
// ─────────────────────────────────────────────
/**
 * Verify the x-verify signature header sent by PhonePe on callbacks.
 * @param {string} rawBody    Raw request body string (before JSON.parse)
 * @param {string} signature  Value of x-verify header from PhonePe
 * @returns {boolean}
 */
export const verifyCallbackSignature = (rawBody, signature) => {
  if (!rawBody || !signature) return false;
  const expected = crypto
    .createHmac('sha256', PHONEPE_CLIENT_SECRET)
    .update(rawBody)
    .digest('base64');
  return expected === signature;
};
