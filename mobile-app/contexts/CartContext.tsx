import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { cartApi } from '@/services/api';
import { useAuth } from './AuthContext';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  discountPrice?: number;
  quantity: number;
  image?: string;
  colorName?: string;
  product?: any;
}

interface CartData {
  items: CartItem[];
  totalAmount: number;
}

interface CartContextType {
  cart: CartData;
  cartCount: number;
  isLoading: boolean;
  isUpdating: Record<string, boolean>;
  isRemoving: Record<string, boolean>;
  isClearing: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number, colorName?: string, imageUrl?: string) => Promise<boolean>;
  removeFromCart: (productId: string, colorName?: string) => Promise<boolean>;
  updateQuantity: (productId: string, newQty: number, colorName?: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
}

const emptyCart: CartData = { items: [], totalAmount: 0 };

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const [cart, setCart] = useState<CartData>(emptyCart);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});
  const [isRemoving, setIsRemoving] = useState<Record<string, boolean>>({});
  const [isClearing, setIsClearing] = useState(false);

  const cartCount = useMemo(() => {
    return cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [cart.items]);

  const refreshCart = async () => {
    if (!user) {
      setCart(emptyCart);
      return;
    }

    setIsLoading(true);
    try {
      const res = await cartApi.getCart();
      if (res.success) {
        setCart(res.data || emptyCart);
      } else {
        setCart(emptyCart);
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        await logout();
      }
      console.error('Failed to fetch cart', err);
      setCart(emptyCart);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [user]);

  const addToCart = async (productId: string, quantity: number = 1, colorName?: string, imageUrl?: string) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to add items to your cart.');
      return false;
    }

    try {
      const payload: any = { productId, quantity };
      if (colorName) payload.colorName = colorName;
      if (imageUrl) payload.imageUrl = imageUrl;

      const res = await cartApi.addItem(payload);
      if (res.success) {
        await refreshCart();
        return true;
      } else {
        Alert.alert('Error', res.message || 'Failed to add item to cart');
        return false;
      }
    } catch (err: any) {
      if (err?.response?.status === 401) await logout();
      Alert.alert('Error', err.response?.data?.message || 'Failed to add item to cart');
      return false;
    }
  };

  const removeFromCart = async (productId: string, colorName?: string) => {
    const key = `${productId}-${colorName || 'null'}`;
    setIsRemoving(prev => ({ ...prev, [key]: true }));

    try {
      const params = colorName ? { colorName } : {};
      const res = await cartApi.removeItem(productId, params);
      if (res.success) {
        await refreshCart();
        return true;
      } else {
        Alert.alert('Error', res.message || 'Failed to remove item');
        return false;
      }
    } catch (err: any) {
      if (err?.response?.status === 401) await logout();
      Alert.alert('Error', err.response?.data?.message || 'Failed to remove item');
      return false;
    } finally {
      setIsRemoving(prev => ({ ...prev, [key]: false }));
    }
  };

  const updateQuantity = async (productId: string, newQty: number, colorName?: string) => {
    if (newQty < 1) return false;
    
    const key = `${productId}-${colorName || 'null'}`;
    setIsUpdating(prev => ({ ...prev, [key]: true }));

    try {
      const res = await cartApi.updateItem(productId, { quantity: newQty, colorName: colorName || null });
      if (res.success) {
        await refreshCart();
        return true;
      } else {
        Alert.alert('Error', res.message || 'Failed to update quantity');
        return false;
      }
    } catch (err: any) {
      if (err?.response?.status === 401) await logout();
      Alert.alert('Error', err.response?.data?.message || 'Failed to update quantity');
      return false;
    } finally {
      setIsUpdating(prev => ({ ...prev, [key]: false }));
    }
  };

  const clearCart = async () => {
    setIsClearing(true);
    try {
      const res = await cartApi.clearCart();
      if (res.success) {
        setCart(emptyCart);
        return true;
      } else {
        Alert.alert('Error', res.message || 'Failed to clear cart');
        return false;
      }
    } catch (err: any) {
      if (err?.response?.status === 401) await logout();
      Alert.alert('Error', err.response?.data?.message || 'Failed to clear cart');
      return false;
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <CartContext.Provider value={{
      cart,
      cartCount,
      isLoading,
      isUpdating,
      isRemoving,
      isClearing,
      refreshCart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
