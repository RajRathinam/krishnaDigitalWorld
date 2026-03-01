// services/phonePeService.js
// SDK-only PhonePe integration — works on both localhost and deployed
// ─────────────────────────────────────────────────────────────────────────────
import crypto from 'crypto';

console.log('==========================================');
console.log('🚀 PHONEPE SERVICE v9.0 (SDK-ONLY MODE)');
console.log('==========================================');

// ── SDK Loader ────────────────────────────────────────────────────────────────
// pg-sdk-node is a CommonJS package; dynamic import handles ESM interop cleanly.
let PhonePeSDK = null;

async function loadSDK() {
  if (PhonePeSDK) return PhonePeSDK;
  try {
    const mod = await import('pg-sdk-node');
    PhonePeSDK = mod.default ?? mod;

    // Validate the SDK has the expected shape
    if (!PhonePeSDK?.StandardCheckoutClient || !PhonePeSDK?.Env) {
      throw new Error(
        'pg-sdk-node loaded but missing StandardCheckoutClient or Env. ' +
        'Check the package version.'
      );
    }

    console.log('✅ PhonePe SDK (pg-sdk-node) loaded');
    return PhonePeSDK;
  } catch (err) {
    console.error('❌ Failed to load PhonePe SDK:', err.message);
    console.error('   Run: npm install pg-sdk-node');
    throw new Error(`PhonePe SDK not available: ${err.message}`);
  }
}

// ── Config ────────────────────────────────────────────────────────────────────
const CFG = {
  get clientId()      { return process.env.PHONEPE_CLIENT_ID      || ''; },
  get clientSecret()  { return process.env.PHONEPE_CLIENT_SECRET  || ''; },
  get clientVersion() { return parseInt(process.env.PHONEPE_CLIENT_VERSION, 10) || 1; },
  get environment()   { return (process.env.PHONEPE_ENV || 'UAT').toUpperCase(); },
  get merchantId()    { return process.env.PHONEPE_MERCHANT_ID || process.env.PHONEPE_CLIENT_ID || ''; },
  get isProd()        { return ['PROD', 'PRODUCTION'].includes(this.environment); },
};

// ── Client Singleton ──────────────────────────────────────────────────────────
let _client = null;

async function getClient() {
  if (_client) return _client;

  const sdk = await loadSDK();

  if (!CFG.clientId || !CFG.clientSecret) {
    throw new Error(
      'PhonePe credentials missing. Set PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET in .env'
    );
  }

  const env = CFG.isProd ? sdk.Env.PRODUCTION : sdk.Env.UAT;

  try {
    _client = sdk.StandardCheckoutClient.getInstance(
      CFG.clientId,
      CFG.clientSecret,
      CFG.clientVersion,
      env,
    );
    console.log(`✅ PhonePe client initialised — env=${CFG.environment}`);
    return _client;
  } catch (err) {
    throw new Error(`PhonePe client init failed: ${err.message}`);
  }
}

// Reset client (useful when credentials change at runtime in tests)
export const resetClient = () => { _client = null; };

// ── Config Check ──────────────────────────────────────────────────────────────
export const checkPhonePeConfig = async () => {
  let sdkLoaded = false;
  try {
    await loadSDK();
    sdkLoaded = true;
  } catch (_) { /* already logged */ }

  return {
    sdkLoaded,
    clientId:      CFG.clientId      ? 'Configured' : '❌ MISSING',
    clientSecret:  CFG.clientSecret  ? 'Configured' : '❌ MISSING',
    environment:   CFG.environment,
    clientVersion: CFG.clientVersion,
    merchantId:    CFG.merchantId    ? CFG.merchantId : '❌ MISSING',
  };
};

// ── Initiate Payment (SDK) ─────────────────────────────────────────────────────
/**
 * @param {object} params
 * @param {string} params.merchantOrderId   - Unique order ID from your DB
 * @param {number} params.amount            - Amount in PAISE (₹1 = 100 paise)
 * @param {string} params.redirectUrl       - Browser redirect after payment (can be localhost)
 * @param {string} [params.callbackUrl]     - Server-to-server webhook (must be public URL)
 * @param {string} [params.mobileNumber]
 * @param {string} [params.customerName]
 * @param {string} [params.customerEmail]
 * @returns {{ success: true, redirectUrl: string, merchantOrderId: string, orderId: string }}
 */
export const initiatePayment = async ({
  merchantOrderId,
  amount,
  redirectUrl,
  callbackUrl,
  mobileNumber,
  customerName,
  customerEmail,
}) => {
  console.log('📤 initiatePayment:', {
    env: CFG.environment,
    merchantOrderId,
    amount,
    redirectUrl,
    callbackUrl: callbackUrl || '(none)',
  });

  const client = await getClient();
  const sdk    = await loadSDK();

  // Build optional meta info
  let metaInfo;
  try {
    const builder = sdk.MetaInfo.builder();
    if (customerName)  builder.udf1(String(customerName));
    if (mobileNumber)  builder.udf2(String(mobileNumber));
    if (customerEmail) builder.udf3(String(customerEmail));
    metaInfo = builder.build();
  } catch (_) {
    metaInfo = undefined; // MetaInfo is optional — continue without it
  }

  // Build the pay request
  let request;
  try {
    const builder = sdk.StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(amount)
      .redirectUrl(redirectUrl);

    // callbackUrl MUST be a public HTTPS URL; skip on localhost to avoid SDK errors
    if (callbackUrl && isPublicUrl(callbackUrl)) {
      builder.callbackUrl(callbackUrl);
    } else if (callbackUrl) {
      console.warn(
        '⚠️  callbackUrl is not a public URL — omitting from SDK request.',
        '\n   PhonePe cannot reach localhost. Status will be verified via polling.',
        '\n   callbackUrl:', callbackUrl,
      );
    }

    if (metaInfo) builder.metaInfo(metaInfo);
    request = builder.build();
  } catch (builderErr) {
    throw new Error(`Failed to build PhonePe pay request: ${builderErr.message}`);
  }

  const response = await client.pay(request);

  console.log('📥 PhonePe SDK response:', JSON.stringify(response, null, 2));

  // The SDK response should contain a redirectUrl pointing to PhonePe's payment page.
  // If it echoes back our redirectUrl that means the SDK is in mock/stub mode
  // (usually happens when credentials are invalid).
  const paymentPageUrl =
    response?.redirectUrl  ||
    response?.data?.redirectUrl ||
    response?.paymentUrl   ||
    response?.url;

  if (!paymentPageUrl) {
    throw new Error(
      'PhonePe did not return a payment URL. ' +
      `Full response: ${JSON.stringify(response)}`
    );
  }

  // Guard: SDK returned our own URL → credentials are invalid / SDK is in mock mode
  if (isSameHost(paymentPageUrl, redirectUrl)) {
    throw new Error(
      'PhonePe SDK returned your redirectUrl instead of a PhonePe payment page. ' +
      'This means your credentials (PHONEPE_CLIENT_ID / PHONEPE_CLIENT_SECRET) ' +
      'are invalid or the SDK is running in mock/stub mode. ' +
      'Please verify your UAT credentials on the PhonePe dashboard.'
    );
  }

  return {
    success:         true,
    redirectUrl:     paymentPageUrl,
    merchantOrderId: response?.merchantOrderId || merchantOrderId,
    orderId:         response?.orderId          || '',
    state:           response?.state            || 'PENDING',
    rawResponse:     response,
  };
};

// ── Check Payment Status ──────────────────────────────────────────────────────
export const checkPaymentStatus = async (merchantOrderId) => {
  console.log(`📊 checkPaymentStatus: ${merchantOrderId}`);
  const client = await getClient();
  const response = await client.getOrderStatus(merchantOrderId);
  console.log('📥 Status response:', JSON.stringify(response, null, 2));

  return {
    success:        true,
    state:          response.state,
    amount:         response.amount,
    paymentDetails: response.paymentDetails,
    rawResponse:    response,
  };
};

// ── Initiate Refund ───────────────────────────────────────────────────────────
export const initiateRefund = async ({
  originalMerchantOrderId,
  merchantRefundId,
  amount,
}) => {
  console.log(`💰 initiateRefund: ${originalMerchantOrderId} ₹${amount / 100}`);
  const client = await getClient();
  const sdk    = await loadSDK();

  const request = sdk.RefundRequest.builder()
    .originalMerchantOrderId(originalMerchantOrderId)
    .merchantRefundId(merchantRefundId)
    .amount(amount)
    .build();

  const response = await client.refund(request);
  console.log('📥 Refund response:', JSON.stringify(response, null, 2));

  return {
    success:    true,
    state:      response.state,
    refundId:   response.refundId,
    rawResponse: response,
  };
};

// ── Callback Signature Verification ──────────────────────────────────────────
export const verifyCallbackSignature = (rawBody, signature) => {
  if (!rawBody || !signature) return false;
  try {
    const expected = crypto
      .createHmac('sha256', CFG.clientSecret)
      .update(rawBody)
      .digest('base64');
    return expected === signature;
  } catch {
    return false;
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns true if the URL is publicly reachable (not localhost / 127.x / private IP).
 */
function isPublicUrl(urlStr) {
  try {
    const { hostname, protocol } = new URL(urlStr);
    if (!['http:', 'https:'].includes(protocol)) return false;
    if (hostname === 'localhost') return false;
    if (/^127\./.test(hostname)) return false;
    if (/^192\.168\./.test(hostname)) return false;
    if (/^10\./.test(hostname)) return false;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns true if two URLs share the same host (used to detect mock responses).
 */
function isSameHost(urlA, urlB) {
  try {
    return new URL(urlA).host === new URL(urlB).host;
  } catch {
    return false;
  }
}

// ── Default Export ─────────────────────────────────────────────────────────────
export default {
  initiatePayment,
  checkPaymentStatus,
  initiateRefund,
  verifyCallbackSignature,
  checkPhonePeConfig,
  resetClient,
};