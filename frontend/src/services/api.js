import api from "@/lib/api";

// Response interceptor for error handling
api.interceptors.response.use((response) => {
    // Ensure consistent response format
    if (response.data && typeof response.data === 'object') {
        return {
            ...response,
            data: {
                success: response.data.success !== undefined ? response.data.success : true,
                data: response.data.data || response.data,
                message: response.data.message || '',
                errors: response.data.errors || [],
                pagination: response.data.pagination || undefined,
            }
        };
    }
    return response;
}, (error) => {
    const errorResponse = {
        success: false,
        message: error.response?.data?.message || 'An error occurred',
        errors: error.response?.data?.errors || [],
        status: error.response?.status || 500,
        data: null,
        retryAfter: error.response?.headers?.['retry-after'] || error.response?.headers?.['Retry-After'] || null,
    };
    return Promise.reject(errorResponse);
});
export default api;
// ============= Admin API Endpoints =============
export const adminApi = {
    // Dashboard
    getDashboardStats: async () => {
        const response = await api.get('/admin/stats');
        return response.data;
    },
    // User management
    getUserAnalytics: async () => {
        const response = await api.get('/admin/users/analytics');
        return response.data;
    },
    exportUsers: async () => {
        const response = await api.get('/admin/users/export', {
            responseType: 'blob'
        });
        return response.data;
    },
    searchUsers: async (params) => {
        const response = await api.get('/admin/users/search', { params });
        return response.data;
    },
    getUserDetails: async (id) => {
        const response = await api.get(`/admin/users/${id}`);
        return response.data;
    },
    updateUser: async (id, data) => {
        const response = await api.put(`/admin/users/${id}`, data);
        return response.data;
    },
    toggleUserStatus: async (id) => {
        const response = await api.put(`/admin/users/${id}/status`);
        return response.data;
    },
    deleteUser: async (id) => {
        const response = await api.delete(`/admin/users/${id}`);
        return response.data;
    },
    // Birthday management
    sendBirthdayWishes: async () => {
        const response = await api.post('/admin/send-birthday-wishes');
        return response.data;
    },
    broadcastCoupon: async (couponData) => {
        const response = await api.post('/admin/broadcast-coupon', couponData);
        return response.data;
    },
    getTodayBirthdays: async () => {
        const response = await api.get('/birthdays/today');
        return response.data;
    },
    sendBirthdayWishToUser: async (userId) => {
        const response = await api.post(`/birthdays/${userId}/wish`);
        return response.data;
    },
    triggerBirthdayOffer: async (userId) => {
        const response = await api.post(`/birthdays/${userId}/offer`);
        return response.data;
    },
    // Orders management
    getAllOrders: async (params) => {
        const response = await api.get('/orders', { params });
        return response.data;
    },
    updateOrderStatus: async (id, data) => {
        const response = await api.put(`/orders/${id}/status`, data);
        return response.data;
    },
    // Add this function to get customer analytics data
    getCustomerAnalytics: async () => {
        const response = await api.get('/admin/users/analytics/customers');
        return response.data;
    },
    // Products management
    getAllProducts: async (params) => {
        const response = await api.get('/products', { params });
        return response.data;
    },
    createProduct: async (data) => {
        const response = await api.post('/products', data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },
    updateProduct: async (id, data) => {
        const response = await api.put(`/products/${id}`, data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },
    deleteProduct: async (id) => {
        const response = await api.delete(`/products/${id}`);
        return response.data;
    },
    // Categories and Brands (Admin)
    getAllCategories: async (params) => {
        const response = await api.get('/categories', { params });
        return response.data;
    },
    createCategory: async (data) => {
        const response = await api.post('/categories', data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },
    updateCategory: async (id, data) => {
        const response = await api.put(`/categories/${id}`, data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },
    deleteCategory: async (id) => {
        const response = await api.delete(`/categories/${id}`);
        return response.data;
    },
    getAllBrands: async (params) => {
        const response = await api.get('/brands', { params });
        return response.data;
    },
    createBrand: async (data) => {
        const response = await api.post('/brands', data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },
    updateBrand: async (id, data) => {
        const response = await api.put(`/brands/${id}`, data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },
    deleteBrand: async (id) => {
        const response = await api.delete(`/brands/${id}`);
        return response.data;
    }
};
// ... rest of the file remains the same
// ============= Public Product API =============
export const productApi = {
    getProducts: async (params) => {
        const response = await api.get('/products', { params });
        return response.data;
    },
    getProduct: async (identifier) => {
        const response = await api.get(`/products/${identifier}`);
        return response.data;
    },
    getFeaturedProducts: async (limit) => {
        const response = await api.get('/products/featured', {
            params: { limit: limit || 10 }
        });
        return response.data;
    },
    getProductsByCategory: async (categorySlug, params) => {
        const response = await api.get(`/products/category/${categorySlug}`, { params });
        return response.data;
    },
    getProductsByBrand: async (brandSlug, params) => {
        const response = await api.get(`/products/brand/${brandSlug}`, { params });
        return response.data;
    },
    getRelatedProducts: async (productId, limit = 4) => {
        const response = await api.get(`/products/${productId}/related`, {
            params: { limit }
        });
        return response.data;
    },
    searchProducts: async (query, params) => {
        const response = await api.get('/products/search', {
            params: { query, ...params }
        });
        return response.data;
    }
};
// ============= Category & Brand APIs =============
export const categoryApi = {
    getCategories: async (params) => {
        const response = await api.get('/categories', { params });
        return response.data;
    },
    getCategory: async (id) => {
        const response = await api.get(`/categories/${id}`);
        return response.data;
    },
    getCategoryBySlug: async (slug) => {
        const response = await api.get(`/categories/slug/${slug}`);
        return response.data;
    }
};
export const brandApi = {
    getBrands: async (params) => {
        const response = await api.get('/brands', { params });
        return response.data;
    },
    getBrand: async (id) => {
        const response = await api.get(`/brands/${id}`);
        return response.data;
    },
    getBrandBySlug: async (slug) => {
        const response = await api.get(`/brands/slug/${slug}`);
        return response.data;
    }
};
// ============= Auth API Endpoints =============
export const authApi = {
    requestOtp: async (data) => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },
    verifyOtp: async (phone, otp, purpose = 'register') => {
        const response = await api.post('/auth/verify-otp', { phone, otp, purpose });
        return response.data;
    },
    login: async (data) => {
        const response = await api.post('/auth/login', data);
        return response.data;
    },
    verifyLogin: async (phone, otp) => {
        const response = await api.post('/auth/verify-login', { phone, otp, purpose: 'login' });
        return response.data;
    },
    resendOtp: async (phone, purpose = 'login') => {
        const response = await api.post('/auth/resend-otp', { phone, purpose });
        return response.data;
    },
    getMe: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },
    updateMe: async (data) => {
        const response = await api.put('/auth/me', data);
        return response.data;
    },
    register: async (data) => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },
    logout: async () => {
        try {
            const response = await api.post('/auth/logout');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            return response.data;
        }
        catch (error) {
            // Even if API call fails, clear local storage
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            return {
                success: true,
                message: 'Logged out successfully',
                data: null
            };
        }
    },
    // Address Management
    getAddresses: async () => {
        try {
            const response = await api.get('/auth/me');
            const userData = response.data.data;
            // Parse primary address
            let primaryAddress = null;
            if (userData?.address) {
                if (typeof userData.address === 'object') {
                    primaryAddress = {
                        id: 'primary',
                        name: userData.name || '',
                        phone: userData.phone || '',
                        street: userData.address.street || '',
                        city: userData.address.city || userData.address.district || '',
                        state: userData.address.state || '',
                        pincode: userData.address.pincode || '',
                        isDefault: true,
                        type: 'primary'
                    };
                }
                else {
                    // Parse string address
                    const addressString = userData.address;
                    const parts = addressString.split(', ');
                    primaryAddress = {
                        id: 'primary',
                        name: userData.name || '',
                        phone: userData.phone || '',
                        street: parts[0] || '',
                        city: parts.length > 1 ? parts.slice(1, -1).join(', ') : '',
                        state: '',
                        pincode: parts.length > 0 && /\d{6}/.test(parts[parts.length - 1]) ? parts[parts.length - 1] : '',
                        isDefault: true,
                        type: 'primary'
                    };
                }
            }
            // Parse additional addresses
            const additionalAddresses = [];
            if (userData?.additionalAddresses && Array.isArray(userData.additionalAddresses)) {
                userData.additionalAddresses.forEach((addr) => {
                    additionalAddresses.push({
                        id: addr.id || String(Math.random()),
                        name: addr.name || userData.name || '',
                        phone: addr.phone || userData.phone || '',
                        street: addr.street || '',
                        city: addr.city || '',
                        state: addr.state || '',
                        pincode: addr.pincode || '',
                        isDefault: addr.isDefault || false,
                        type: addr.type || 'other',
                        createdAt: addr.createdAt,
                        updatedAt: addr.updatedAt
                    });
                });
            }
            return {
                success: response.data.success,
                data: {
                    primaryAddress,
                    additionalAddresses
                }
            };
        }
        catch (err) {
            console.error('Error getting addresses:', err);
            return {
                success: false,
                message: err?.message || 'Failed to fetch addresses',
                data: { primaryAddress: null, additionalAddresses: [] }
            };
        }
    },
    addAddress: async (addressData) => {
        const response = await api.post('/auth/addresses', addressData);
        return response.data;
    },
    updateAddress: async (addressId, addressData) => {
        try {
            const response = await api.put(`/auth/addresses/${addressId}`, addressData);
            return response.data;
        }
        catch (err) {
            console.error('Update address API error:', err);
            return {
                success: false,
                message: err?.message || 'Failed to update address',
                data: null
            };
        }
    },
    deleteAddress: async (addressId) => {
        try {
            const response = await api.delete(`/auth/addresses/${addressId}`);
            return response.data;
        }
        catch (err) {
            console.error('Delete address API error:', err);
            return {
                success: false,
                message: err?.message || 'Failed to delete address',
                data: null
            };
        }
    },
    setDefaultAddress: async (addressId) => {
        const response = await api.put(`/auth/addresses/${addressId}/default`);
        return response.data;
    }
};
// ============= Cart & Order API Endpoints =============
export const cartApi = {
    getCart: async () => {
        const response = await api.get('/cart');
        return response.data;
    },
    addToCart: async (payload) => {
        const response = await api.post('/cart/items', payload);
        return response.data;
    },
    updateCartItem: async (productId, data) => {
        const response = await api.put(`/cart/items/${productId}`, data);
        return response.data;
    },
    removeFromCart: async (productId) => {
        const response = await api.delete(`/cart/items/${productId}`);
        return response.data;
    },
    clearCart: async () => {
        const response = await api.delete('/cart');
        return response.data;
    },
    getCartCount: async () => {
        const response = await api.get('/cart/count');
        return response.data;
    },
};
export const orderApi = {
    createOrder: async (data) => {
        const response = await api.post('/orders', data);
        return response.data;
    },
    getOrders: async (params) => {
        const response = await api.get('/orders', { params });
        return response.data;
    },
    getOrderDetails: async (id) => {
        const response = await api.get(`/orders/${id}`);
        return response.data;
    },
    cancelOrder: async (id, reason) => {
        const response = await api.post(`/orders/${id}/cancel`, { reason });
        return response.data;
    },
    trackOrder: async (trackingId) => {
        const response = await api.get(`/orders/track/${trackingId}`);
        return response.data;
    },
    updateOrderAddress: async (id, address) => {
        const response = await api.put(`/orders/${id}/address`, address);
        return response.data;
    }
};
// ============= Helper Functions =============
export const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};
export const formatDate = (dateString, includeTime = true) => {
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    };
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    return new Intl.DateTimeFormat('en-IN', options).format(date);
};
export const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};
