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
        // Map the data to match your frontend naming convention
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
          map_embed_url: response.data.mapEmbedUrl, // Map from camelCase to snake_case
          mapEmbedUrl: response.data.mapEmbedUrl,   // Also keep camelCase for consistency
          logoUrl: response.data.logoUrl,
          faviconUrl: response.data.faviconUrl,
          currency: response.data.currency,
          gstNumber: response.data.gstNumber,
          supportEmail: response.data.supportEmail,
          supportPhone: response.data.supportPhone,
          whatsappNumber: response.data.whatsappNumber,
          isActive: response.data.isActive
        });
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
          businessHours: {},
          map_embed_url: null,  // Add this
          mapEmbedUrl: null,     // Add this
          description: null,
          logoUrl: null,
          faviconUrl: null,
          currency: 'INR',
          gstNumber: null,
          supportEmail: null,
          supportPhone: null,
          whatsappNumber: null
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
        businessHours: {},
        map_embed_url: null,  // Add this
        mapEmbedUrl: null,     // Add this
        description: null,
        logoUrl: null,
        faviconUrl: null,
        currency: 'INR',
        gstNumber: null,
        supportEmail: null,
        supportPhone: null,
        whatsappNumber: null
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