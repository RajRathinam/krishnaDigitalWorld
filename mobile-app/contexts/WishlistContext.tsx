import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WISHLIST_KEY = 'wishlist_items';

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  slug: string;
  addedAt: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  toggleWishlist: (product: any, imageUrl?: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  removeFromWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load wishlist on mount
  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      setIsLoading(true);
      const savedWishlist = await AsyncStorage.getItem(WISHLIST_KEY);
      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist));
      }
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveWishlist = async (items: WishlistItem[]) => {
    try {
      await AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save wishlist:', error);
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(item => String(item.id) === String(productId));
  };

  const toggleWishlist = async (product: any, imageUrl?: string) => {
    const productId = String(product.id || product.productId || product._id);
    
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      // Normalize product data for wishlist (matching web version logic)
      let finalImage = imageUrl || product.image || (Array.isArray(product.images) && product.images[0]) || '';
      
      const newItem: WishlistItem = {
        id: productId,
        name: product.name || product.shortName || 'Product',
        price: product.discountPrice ?? product.salePrice ?? product.price ?? 0,
        originalPrice: product.price ?? product.originalPrice ?? 0,
        image: finalImage,
        slug: product.slug || productId,
        addedAt: new Date().toISOString()
      };
      
      const updatedWishlist = [...wishlist, newItem];
      setWishlist(updatedWishlist);
      await saveWishlist(updatedWishlist);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    const updatedWishlist = wishlist.filter(item => String(item.id) !== String(productId));
    setWishlist(updatedWishlist);
    await saveWishlist(updatedWishlist);
  };

  const clearWishlist = async () => {
    setWishlist([]);
    await AsyncStorage.removeItem(WISHLIST_KEY);
  };

  return (
    <WishlistContext.Provider value={{ 
      wishlist, 
      toggleWishlist, 
      isInWishlist, 
      removeFromWishlist, 
      clearWishlist, 
      isLoading 
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
