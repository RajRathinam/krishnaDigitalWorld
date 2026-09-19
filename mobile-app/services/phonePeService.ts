import api from './api';

export interface MobilePaymentResponse {
  success: boolean;
  message: string;
  data: {
    orderId: string;
    orderNumber: string;
    merchantOrderId: string;
    amount: number;
    base64Payload: string;
    checksum: string;
    endpoint?: string;
    redirectUrl?: string;
    pollingMode: boolean;
  };
}

export const phonePeMobileService = {
  /**
   * Initialize payment and get payload from backend
   */
  initiateMobilePayment: async (data: {
    shippingAddress: any;
    billingAddress?: any;
    notes?: string;
    deliveryType?: string;
    couponCode?: string;
    returnUrl?: string;
  }): Promise<MobilePaymentResponse> => {
    try {
      // Use standard web flow for in-app browser, but tell backend it's a mobile app to get deep link redirectUrl
      const response = await api.post('/payments/initiate', {
        ...data,
        device: 'MOBILE'
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to initiate mobile payment', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Check final payment status from backend
   */
  checkPaymentStatus: async (merchantOrderId: string) => {
    try {
      const response = await api.get(`/payments/status/${merchantOrderId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to check payment status', error.response?.data || error.message);
      throw error;
    }
  },
};
