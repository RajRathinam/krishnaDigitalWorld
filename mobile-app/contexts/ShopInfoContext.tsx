import React, { createContext, useContext, useState, useEffect } from 'react';
import { shopInfoApi } from '@/services/api';

const ShopInfoContext = createContext<any>(undefined);

export const ShopInfoProvider = ({ children }: { children: React.ReactNode }) => {
  const [shopInfo, setShopInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShopInfo();
  }, []);

  const loadShopInfo = async () => {
    try {
      setLoading(true);
      const response = await shopInfoApi.getShopInfo();
      if (response.success && response.data) {
        setShopInfo({
          shopName: response.data.shopName,
          email: response.data.email,
          phone: response.data.phone,
          alternatePhone: response.data.alternatePhone,
          address: response.data.address,
          city: response.data.city,
          state: response.data.state,
          pincode: response.data.pincode,
          country: response.data.country,
          locations: response.data.locations || [],
          socialMedia: response.data.socialMedia || {},
          businessHours: response.data.businessHours || {},
          description: response.data.description,
          mapEmbedUrl: response.data.mapEmbedUrl,
          logoUrl: response.data.logoUrl,
          faviconUrl: response.data.faviconUrl,
          currency: response.data.currency,
          gstNumber: response.data.gstNumber,
          supportEmail: response.data.supportEmail,
          supportPhone: response.data.supportPhone,
          whatsappNumber: response.data.whatsappNumber,
          isActive: response.data.isActive,
          enable_add_to_cart_btn: response.data.enable_add_to_cart_btn !== undefined ? (response.data.enable_add_to_cart_btn === 1 || response.data.enable_add_to_cart_btn === true || response.data.enable_add_to_cart_btn === '1') : true,
          minAppVersionCode: response.data.minAppVersionCode ?? null,
          latestAppVersionCode: response.data.latestAppVersionCode ?? null,
          forceUpdateEnabled: response.data.forceUpdateEnabled === 1 || response.data.forceUpdateEnabled === true || response.data.forceUpdateEnabled === '1',
          playStoreUrl: response.data.playStoreUrl || null,
          appUpdateMessage: response.data.appUpdateMessage || null
        });
      } else {
        setShopInfo({
          shopName: 'Krishna Digital World',
          country: 'India',
          currency: 'INR',
          locations: [],
          enable_add_to_cart_btn: true
        });
      }
    } catch (error) {
      console.error('Failed to load shop info:', error);
      setShopInfo({
        shopName: 'Krishna Digital World',
        country: 'India',
        currency: 'INR',
        locations: [],
        enable_add_to_cart_btn: true
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
