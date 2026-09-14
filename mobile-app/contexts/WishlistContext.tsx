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
  colorName?: string;
  addedAt: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  toggleWishlist: (product: any, imageUrl?: string) => void;
  isInWishlist: (productId: string) => boolean;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load wishlist from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(WISHLIST_KEY)
      .then(saved => {
        if (saved) setWishlist(JSON.parse(saved));
      })
      .catch(err => console.error('Failed to load wishlist:', err))
      .finally(() => setIsLoading(false));
  }, []);

  // Auto-save to AsyncStorage whenever wishlist changes (only after initial load)
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist)).catch(err =>
        console.error('Failed to save wishlist:', err)
      );
    }
  }, [wishlist, isLoading]);

  const isInWishlist = (productId: string): boolean => {
    return wishlist.some(item => String(item.id) === String(productId));
  };

  const toggleWishlist = (product: any, imageUrl?: string): void => {
    const productId = String(product.id || product.productId || product._id);

    if (isInWishlist(productId)) {
      // Remove from wishlist
      setWishlist(prev => prev.filter(item => String(item.id) !== productId));
    } else {
      // Add to wishlist with duplicate guard
      const finalImage = imageUrl || product.image || (Array.isArray(product.images) && product.images[0]) || '';

      const newItem: WishlistItem = {
        id: productId,
        name: product.name || product.shortName || 'Product',
        price: product.discountPrice ?? product.salePrice ?? product.price ?? 0,
        originalPrice: product.price ?? product.originalPrice ?? 0,
        image: finalImage,
        slug: product.slug || productId,
        colorName: product.colorName || undefined,
        addedAt: new Date().toISOString()
      };

      setWishlist(prev => {
        const alreadyExists = prev.some(item => String(item.id) === productId);
        if (alreadyExists) return prev;
        return [...prev, newItem];
      });
    }
  };

  const removeFromWishlist = (productId: string): void => {
    setWishlist(prev => prev.filter(item => String(item.id) !== String(productId)));
  };

  const clearWishlist = (): void => {
    setWishlist([]);
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
