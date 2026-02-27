const fs = require('fs');
const path = require('path');

const SERVICE_CONTENT = `// services/phonePeService.js
import axios from 'axios';
import crypto from 'crypto';

// 🚀 TRIPLE LOG TO ENSURE VISIBILITY
console.log('******************************************');
console.log('🚀 PHONEPE SERVICE V7.2 (FINAL) ACTIVE');
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

    console.log('[PhonePe] Requesting token...');
    const resp = await axios.post(OAUTH_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10_000,
    });
    const { access_token, expires_in, expires_at } = resp.data;
    _cachedToken = access_token;
    _tokenExpiresAt = expires_at ? expires_at * 1000 : now + (expires_in || 3600) * 1000;
    console.log('[PhonePe] Token OK');
    return _cachedToken;
  } catch (err) {
    console.error('[PhonePe] Auth Error:', err.message);
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
  const { currentEnv } = getEnvConfig();
  
  // V2 API payload: No merchantId inside JSON. Strict redirectUrl nesting.
  const payload = {
    merchantOrderId,
    amount: Math.round(amount),
    expireAfter: 1200,
    paymentFlow: {
      type: 'PG_CHECKOUT',
      message: 'Payment',
      merchantUrls: {
        redirectUrl,
        callbackUrl,
      },
    },
  };

  if (mobileNumber) {
    payload.metaInfo = { udf1: String(mobileNumber) };
  }

  console.log('--- PHONEPE INITIATE REQUEST ---');
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await phonePeRequest('post', '/checkout/v2/pay', payload);
    console.log('--- PHONEPE INITIATE SUCCESS ---');
    return response;
  } catch (error) {
    const details = error?.response?.data || error.message;
    console.error('--- PHONEPE INITIATE ERROR ---');
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

console.log('STARTING BROADCAST V7.2');
const cwd = process.cwd();
const services = findFiles(cwd, 'phonePeService.js');
console.log(\`Found \${services.length} files.\`);
services.forEach(s => {
  console.log(\`Writing V7.2 to: \${s}\`);
  fs.writeFileSync(s, SERVICE_CONTENT);
});

const envs = findFiles(cwd, '.env');
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
console.log('DONE.');
`;

const backendDir = 'c:\\Users\\MOHAMMED FARVEZ\\Downloads\\krishnaDigitalWorld-master (5)\\KrishnaDigitalWorld-master\\backend';
const broadcastPath = path.join(backendDir, 'final_broadcast.js');

try {
    fs.writeFileSync(broadcastPath, CodeContent);
    console.log('Broadcast script written.');
} catch (e) {
    console.error('Failed to write broadcast script:', e);
}
