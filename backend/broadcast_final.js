const fs = require('fs');
const path = require('path');

const SERVICE_CONTENT = `// services/phonePeService.js
import axios from 'axios';
import crypto from 'crypto';

console.log('******************************************');
console.log('🚀 PHONEPE SERVICE V7.5 (OMNI-PAYLOAD) ACTIVE');
console.log('******************************************');

const ENDPOINTS = {
  UAT: {
    base: 'https://api-preprod.phonepe.com/apis/pg-sandbox',
    oauth: 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token',
  },
  PROD: {
    base: 'https://api.phonepe.com/apis/pg',
    oauth: 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token',
  },
};

const getEnvConfig = () => {
  const env = (process.env.PHONEPE_ENV || 'UAT').toUpperCase();
  const currentEnv = env === 'PROD' ? 'PROD' : 'UAT';
  return {
    currentEnv,
    BASE_URL: ENDPOINTS[currentEnv].base,
    OAUTH_URL: ENDPOINTS[currentEnv].oauth,
    CLIENT_ID: process.env.PHONEPE_CLIENT_ID,
    CLIENT_SECRET: process.env.PHONEPE_CLIENT_SECRET,
    CLIENT_VERSION: String(process.env.PHONEPE_CLIENT_VERSION || '1'),
    MERCHANT_ID: process.env.PHONEPE_MERCHANT_ID || process.env.PHONEPE_CLIENT_ID,
  };
};

let _cachedToken = null;
let _tokenExpiresAt = 0;

export const getAccessToken = async () => {
  const { OAUTH_URL, CLIENT_ID, CLIENT_SECRET, CLIENT_VERSION, currentEnv } = getEnvConfig();
  const now = Date.now();
  if (_cachedToken && now < _tokenExpiresAt - 60_000) return _cachedToken;

  try {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });
    if (CLIENT_VERSION) params.append('client_version', CLIENT_VERSION);

    console.log('[PhonePe] 🔑 Fetching OAuth Token...');
    const resp = await axios.post(OAUTH_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10_000,
    });
    const { access_token, expires_in, expires_at } = resp.data;
    _cachedToken = access_token;
    _tokenExpiresAt = expires_at ? expires_at * 1000 : now + (expires_in || 3600) * 1000;
    console.log('[PhonePe] ✅ OAuth Token Ready');
    return _cachedToken;
  } catch (err) {
    console.error('[PhonePe] ❌ OAuth Error:', err.message);
    throw err;
  }
};

const phonePeRequest = async (method, path, data = null) => {
  const { BASE_URL } = getEnvConfig();
  const token = await getAccessToken();
  const config = {
    method, url: \`\${BASE_URL}\${path}\`,
    headers: { Authorization: \`O-Bearer \${token}\`, 'Content-Type': 'application/json', Accept: 'application/json' },
    timeout: 15_000,
  };
  if (data) config.data = data;
  const res = await axios(config);
  return res.data;
};

export const initiatePayment = async ({ merchantOrderId, amount, redirectUrl, callbackUrl, mobileNumber }) => {
  const { currentEnv, MERCHANT_ID } = getEnvConfig();
  
  if (amount < 1000) {
      console.warn('⚠️ WARNING: Amount is under 1000 paise (₹10.0). PhonePe Production often disables QR/UPI for low amounts.');
  }

  if (redirectUrl.includes('localhost') || callbackUrl.includes('localhost')) {
      console.warn('⚠️ WARNING: using "localhost" for URLs in Production. PhonePe may block instrument rendering.');
  }

  // OMNI-PAYLOAD: Include both root and nested fields for absolute compatibility
  const payload = {
    merchantId: MERCHANT_ID, 
    merchantOrderId,
    amount: Math.round(amount),
    expireAfter: 1200,
    redirectUrl, 
    callbackUrl, 
    paymentFlow: {
      type: 'PG_CHECKOUT',
      message: 'Payment for Krishna Digital World',
      merchantUrls: {
        redirectUrl, 
        callbackUrl, 
      },
    },
  };

  if (mobileNumber) {
    payload.metaInfo = { udf1: String(mobileNumber) };
  }

  console.log(\`--- [V7.5] PHONEPE REQ (\${currentEnv}) ---\`);
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await phonePeRequest('post', '/checkout/v2/pay', payload);
    console.log('--- [V7.5] PHONEPE SUCCESS ---');
    console.log(JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    const details = error?.response?.data || error.message;
    console.error('--- [V7.5] PHONEPE ERROR ---');
    console.error(JSON.stringify(details, null, 2));
    throw error;
  }
};

export const checkPaymentStatus = async (merchantOrderId) => {
  return await phonePeRequest('get', \`/checkout/v2/order/\${merchantOrderId}/status\`);
};

export const initiateRefund = async ({ originalMerchantOrderId, merchantRefundId, amount }) => {
  const payload = { merchantRefundId, originalMerchantOrderId, amount: Math.round(amount) };
  return await phonePeRequest('post', '/checkout/v2/refund', payload);
};

export const verifyCallbackSignature = (rawBody, signature) => {
  if (!rawBody || !signature) return false;
  const { CLIENT_SECRET } = getEnvConfig();
  const expected = crypto.createHmac('sha256', CLIENT_SECRET).update(rawBody).digest('base64');
  return expected === signature;
};
`;

function findFiles(dir, filename, results = []) {
    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            try {
                const stats = fs.statSync(fullPath);
                if (stats.isDirectory() && !fullPath.includes('node_modules')) {
                    findFiles(fullPath, filename, results);
                } else if (file.toLowerCase() === filename.toLowerCase()) {
                    results.push(fullPath);
                }
            } catch (e) { }
        }
    } catch (e) { }
    return results;
}

const root = 'c:\\\\Users\\\\MOHAMMED FARVEZ\\\\Downloads\\\\krishnaDigitalWorld-master (5)';
console.log('BROADCAST V7.5 STARTING...');
const services = findFiles(root, 'phonePeService.js');
services.forEach(s => {
    console.log(\`Updating: \${s}\`);
  fs.writeFileSync(s, SERVICE_CONTENT);
});

const envs = findFiles(root, '.env');
envs.forEach(e => {
  let content = fs.readFileSync(e, 'utf8');
  if (content.includes('PHONEPE_CLIENT_ID')) {
    content = content.replace(/PHONEPE_ENV=UAT/g, 'PHONEPE_ENV=PROD');
    if (!content.includes('PHONEPE_MERCHANT_ID')) {
        content += '\\nPHONEPE_MERCHANT_ID=M23KJRO3VGRIM\\n';
    }
    fs.writeFileSync(e, content);
  }
});
console.log('V7.5 BROADCAST DONE.');
process.exit(0);
