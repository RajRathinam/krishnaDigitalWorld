import React, { createContext, useContext, useState, useEffect } from 'react';
import { shopInfoApi } from '@/services/api';

const ShopInfoContext = createContext(undefined);

export const ShopInfoProvider = ({ children }) => {
  const [shopInfo, setShopInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShopInfo();
  }, []);

  const loadShopInfo = async () => {
    try {
      setLoading(true);
      const response = await shopInfoApi.getShopInfo();
      if (response.success && response.data) {
        setShopInfo(response.data);
      } else {
        // Set default values if API fails
        setShopInfo({
          shopName: 'Krishna Digital World',
          email: null,
          phone: null,
          address: null,
          city: null,
          state: null,
          pincode: null,
          country: 'India',
          locations: [],
          socialMedia: {},
          businessHours: {}
        });
      }
    } catch (error) {
      console.error('Failed to load shop info:', error);
      // Set default values on error
      setShopInfo({
        shopName: 'Krishna Digital World',
        email: null,
        phone: null,
        address: null,
        city: null,
        state: null,
        pincode: null,
        country: 'India',
        locations: [],
        socialMedia: {},
        businessHours: {}
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ShopInfoContext.Provider value={{ shopInfo, loading, refreshShopInfo: loadShopInfo }}>
      {children}
    </ShopInfoContext.Provider>
  );
};

export const useShopInfo = () => {
  const context = useContext(ShopInfoContext);
  if (context === undefined) {
    throw new Error('useShopInfo must be used within a ShopInfoProvider');
  }
  return context;
};

