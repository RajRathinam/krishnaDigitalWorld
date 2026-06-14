import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.0.104:5000';
const API_URL = `${API_BASE_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Unauthenticated client — never attaches Bearer. Use for login/OTP and public GETs so a
 * stale JWT (e.g. from local dev) cannot be sent; axios may leave config.url unset in interceptors.
 */
export const publicApi = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  // HTTP→HTTPS 302 redirects can turn a POST into a GET follow-up → GET /auth/login 404.
  maxRedirects: 0,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Passwordless auth must use real POST. axios/RN + redirects can surface as GET; fetch + explicit POST avoids that.
 */
async function publicPostJson(path, body) {
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text || res.statusText };
  }
  if (!res.ok) {
    const err = new Error(data.message || res.statusText || 'Request failed');
    err.response = { status: res.status, data };
    throw err;
  }
  return data;
}

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error.response?.status;
    if (status === 401 && error.config) {
      const url = String(error.config.url || '');
      const isPublicAuth =
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/verify-otp') ||
        url.includes('/auth/verify-login') ||
        url.includes('/auth/resend-otp');
      if (!isPublicAuth) {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: async (data) => {
    return await publicPostJson('/auth/register', data);
  },
  verifyRegistrationOtp: async (phone, otp) => {
    const data = await publicPostJson('/auth/verify-otp', { phone, otp, purpose: 'register' });
    if (data.success && data.data) {
      await AsyncStorage.setItem('authToken', data.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
    }
    return data;
  },
  login: async (phone) => {
    return await publicPostJson('/auth/login', { phone });
  },
  verifyOtp: async (phone, otp) => {
    const data = await publicPostJson('/auth/verify-login', { phone, otp, purpose: 'login' });
    if (data.success && data.data) {
      await AsyncStorage.setItem('authToken', data.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
    }
    return data;
  },
  resendOtp: async (phone, purpose = 'login') => {
    return await publicPostJson('/auth/resend-otp', { phone, purpose });
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  updateMe: async (data, config = {}) => {
    const response = await api.put('/auth/me', data, config);
    return response.data;
  },
  addAddress: async (data) => {
    const response = await api.post('/auth/addresses', data);
    return response.data;
  },
  updateAddress: async (id, data) => {
    const response = await api.put(`/auth/addresses/${id}`, data);
    return response.data;
  },
  deleteAddress: async (id) => {
    const response = await api.delete(`/auth/addresses/${id}`);
    return response.data;
  },
  setDefaultAddress: async (id) => {
    const response = await api.put(`/auth/addresses/${id}/default`);
    return response.data;
  },
  logout: async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  },
};

export const productApi = {
  getProducts: async (params) => {
    const response = await api.get('/products', { params });
    return response.data;
  },
  getProduct: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  getFeaturedProducts: async (limit = 10) => {
    const response = await api.get('/products/featured', { params: { limit } });
    return response.data;
  },
  getRelatedProducts: async (id) => {
    const response = await api.get(`/products/${id}/related`);
    return response.data;
  },
  getBestSellers: async (limit = 10) => {
    const response = await api.get('/products/best-sellers', { params: { limit } });
    return response.data;
  },
  getDealOfTheDay: async (limit = 10) => {
    const response = await api.get('/products/deal-of-the-day', { params: { limit } });
    return response.data;
  },
  getNewArrivals: async (limit = 10) => {
    const response = await api.get('/products/new-arrivals', { params: { limit } });
    return response.data;
  },
};

export const categoryApi = {
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
};

export const cartApi = {
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },
  addItem: async (payload) => {
    const response = await api.post('/cart/items', payload);
    return response.data;
  },
  updateItem: async (productId, payload) => {
    const response = await api.put(`/cart/items/${productId}`, payload);
    return response.data;
  },
  removeItem: async (productId, params) => {
    const response = await api.delete(`/cart/items/${productId}`, { params });
    return response.data;
  },
  clearCart: async () => {
    const response = await api.delete('/cart');
    return response.data;
  },
};

// ============= Hero Slider API =============
export const heroSliderApi = {
  getSliders: async () => {
    const response = await api.get('/hero-slider', {
      params: { activeOnly: 'true' },
    });
    return response.data;
  },
};

export const orderApi = {
  getOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },
  getOrderDetails: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  createOrder: async (data) => {
    const response = await api.post('/orders', data);
    return response.data;
  },
};

export const couponApi = {
  getMyCoupons: async () => {
    const response = await api.get('/coupons/my-coupons');
    return response.data;
  },
  validateCoupon: async (couponCode, cartTotal) => {
    const response = await api.post('/coupons/validate', { couponCode, cartTotal });
    return response.data;
  },
  getUnnotified: async () => {
    const response = await api.get('/coupons/unnotified');
    return response.data;
  },
  markAsNotified: async (userCouponId) => {
    const response = await api.put(`/coupons/${userCouponId}/notify`);
    return response.data;
  },
};

export const paymentApi = {
  initiatePhonePe: async (data) => {
    const response = await api.post('/payments/initiate', data);
    return response.data;
  },
};

export const shopInfoApi = {
  getShopInfo: async () => {
    const response = await publicApi.get('/shop-info');
    return response.data;
  },
};

export const advertisementApi = {
  getActiveAds: async (position, limit = 5) => {
    const response = await api.get('/advertisements/active', { params: { position, limit } });
    return response.data;
  },
  trackView: async (id) => {
    const response = await api.patch(`/advertisements/${id}/views`);
    return response.data;
  },
  trackClick: async (id) => {
    const response = await api.patch(`/advertisements/${id}/clicks`);
    return response.data;
  },
};

export const brandApi = {
  getBrands: async () => {
    const response = await api.get('/brands');
    return response.data;
  },
};

export default api;