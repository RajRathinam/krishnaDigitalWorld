import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { baseUrl } from '@/config/baseUrl';
// Base API configuration
const API_BASE_URL = baseUrl;
// Create axios instance for cart operations
const createCartApi = () => {
    const api = axios.create({
        baseURL: process.env.NODE_ENV === 'production'
            ? API_BASE_URL
            : API_BASE_URL,
        headers: {
            'Content-Type': 'application/json',
        },
    });
    // Add auth token interceptor
    api.interceptors.request.use((config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });
    return api;
};
const CartContext = createContext(undefined);
export const CartProvider = ({ children }) => {
    const [cartCount, setCartCount] = useState(0);
    const [cartTotal, setCartTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const cartApi = createCartApi();
    const refreshCart = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            setCartCount(0);
            setCartTotal(0);
            return;
        }
        setIsLoading(true);
        try {
            console.log('Refreshing cart...');
            // Get cart data using direct Axios call
            const response = await cartApi.get('/cart');
            const cartRes = response.data;
            if (cartRes.success && cartRes.data) {
                // Calculate item count
                let count = 0;
                if (Array.isArray(cartRes.data.items)) {
                    count = cartRes.data.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
                }
                setCartCount(count);
                // Get total
                const total = cartRes.data.totalAmount || cartRes.data.total || cartRes.data.totalValue || 0;
                setCartTotal(total);
            }
            else {
                setCartCount(0);
                setCartTotal(0);
            }
        }
        catch (err) {
            console.error('Failed to refresh cart:', err);
            // Handle 401/403 differently (they're expected when user is not logged in)
            const status = err.response?.status;
            if (status !== 401 && status !== 403) {
                toast({
                    title: 'Error',
                    description: err.response?.data?.message || 'Failed to load cart information',
                    variant: 'destructive',
                });
            }
            setCartCount(0);
            setCartTotal(0);
        }
        finally {
            setIsLoading(false);
        }
    };
    const addToCart = async (productId, quantity = 1, colorName) => {
        try {
            const payload = { productId, quantity };
            if (colorName) {
                payload.colorName = colorName;
            }
            // Direct Axios call
            const response = await cartApi.post('/cart/items', payload);
            const result = response.data;
            if (result.success) {
                await refreshCart();
                return true;
            }
            else {
                toast({
                    title: 'Error',
                    description: result.message || 'Failed to add item to cart',
                    variant: 'destructive',
                });
                return false;
            }
        }
        catch (err) {
            console.error('Failed to add to cart:', err);
            if (err.response?.status === 401) {
                toast({
                    title: 'Sign in required',
                    description: 'Please sign in to add items to your cart',
                    variant: 'destructive',
                });
            }
            else {
                toast({
                    title: 'Error',
                    description: err.response?.data?.message || 'Failed to add item to cart',
                    variant: 'destructive',
                });
            }
            return false;
        }
    };
    const removeFromCart = async (productId, colorName) => {
        try {
            console.log('Removing item via CartContext:', { productId, colorName });
            const params = colorName ? { colorName } : {};
            const response = await cartApi.delete(`/cart/items/${String(productId)}`, { params });
            const result = response.data;
            if (result.success) {
                await refreshCart();
                toast({
                    title: 'Success',
                    description: 'Item removed from cart',
                });
                return true;
            }
            else {
                toast({
                    title: 'Error',
                    description: result.message || 'Failed to remove item',
                    variant: 'destructive',
                });
                return false;
            }
        }
        catch (err) {
            console.error('Failed to remove from cart:', err);
            if (err.response?.status === 401) {
                toast({
                    title: 'Error',
                    description: 'Session expired. Please sign in again.',
                    variant: 'destructive',
                });
            }
            else {
                toast({
                    title: 'Error',
                    description: err.response?.data?.message || 'Failed to remove item',
                    variant: 'destructive',
                });
            }
            return false;
        }
    };
    const updateCartItem = async (productId, data) => {
        try {
            console.log('Updating cart item via CartContext:', { productId, ...data });
            const response = await cartApi.put(`/cart/items/${String(productId)}`, data);
            const result = response.data;
            if (result.success) {
                await refreshCart();
                toast({
                    title: 'Success',
                    description: 'Cart updated',
                });
                return true;
            }
            else {
                toast({
                    title: 'Error',
                    description: result.message || 'Failed to update cart item',
                    variant: 'destructive',
                });
                return false;
            }
        }
        catch (err) {
            console.error('Failed to update cart item:', err);
            if (err.response?.status === 401) {
                toast({
                    title: 'Error',
                    description: 'Session expired. Please sign in again.',
                    variant: 'destructive',
                });
            }
            else {
                toast({
                    title: 'Error',
                    description: err.response?.data?.message || 'Failed to update cart item',
                    variant: 'destructive',
                });
            }
            return false;
        }
    };
    const clearCart = async () => {
        try {
            const response = await cartApi.delete('/cart');
            const result = response.data;
            if (result.success) {
                setCartCount(0);
                setCartTotal(0);
                toast({
                    title: 'Success',
                    description: 'Cart cleared',
                });
                return true;
            }
            else {
                toast({
                    title: 'Error',
                    description: result.message || 'Failed to clear cart',
                    variant: 'destructive',
                });
                return false;
            }
        }
        catch (err) {
            console.error('Failed to clear cart:', err);
            if (err.response?.status === 401) {
                toast({
                    title: 'Error',
                    description: 'Session expired. Please sign in again.',
                    variant: 'destructive',
                });
            }
            else {
                toast({
                    title: 'Error',
                    description: err.response?.data?.message || 'Failed to clear cart',
                    variant: 'destructive',
                });
            }
            return false;
        }
    };
    // Initial load
    useEffect(() => {
        refreshCart();
    }, []);
    // Listen for auth changes
    useEffect(() => {
        const handleAuthChange = () => {
            console.log('Auth changed, refreshing cart...');
            refreshCart();
        };
        window.addEventListener('storage', (e) => {
            if (e.key === 'authToken' || e.key === 'user') {
                handleAuthChange();
            }
        });
        // Listen for cart update events
        window.addEventListener('cartUpdated', handleAuthChange);
        return () => {
            window.removeEventListener('storage', handleAuthChange);
            window.removeEventListener('cartUpdated', handleAuthChange);
        };
    }, []);
    return (<CartContext.Provider value={{
            cartCount,
            cartTotal,
            isLoading,
            refreshCart,
            addToCart,
            removeFromCart,
            updateCartItem,
            clearCart
        }}>
      {children}
    </CartContext.Provider>);
};
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
