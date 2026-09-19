import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { phonePeMobileService, MobilePaymentResponse } from '../services/phonePeService';

interface PhonePePaymentButtonProps {
  shippingAddress: any;
  billingAddress?: any;
  notes?: string;
  deliveryType?: string;
  couponCode?: string;
  onPaymentSuccess: (orderId: string) => void;
  onPaymentFailure: (errorMsg: string) => void;
  buttonStyle?: any;
  textStyle?: any;
}

export default function PhonePePaymentButton({
  shippingAddress,
  billingAddress,
  notes,
  deliveryType,
  couponCode,
  onPaymentSuccess,
  onPaymentFailure,
  buttonStyle,
  textStyle,
}: PhonePePaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Generate deep link specifically for this app environment (Expo Go or Standalone)
      const returnUrl = Linking.createURL('payment-return');

      // 1. Get payload from backend
      const initResponse = await phonePeMobileService.initiateMobilePayment({
        shippingAddress,
        billingAddress,
        notes,
        deliveryType,
        couponCode,
        returnUrl,
      });

      if (!initResponse.success || !initResponse.data) {
        throw new Error(initResponse.message || 'Failed to initiate payment');
      }

      const { redirectUrl, endpoint, merchantOrderId } = initResponse.data;

      // Use redirectUrl (Standard Web Flow) or fallback to endpoint if mobile flow was forced
      const paymentUrl = redirectUrl || endpoint;

      if (!paymentUrl) {
        throw new Error('Payment URL not provided by server');
      }

      // 2. Open In-App Browser for Payment and listen for the deep link redirect
      try {
        await WebBrowser.openAuthSessionAsync(paymentUrl, returnUrl);
      } catch (browserError) {
        console.warn('WebBrowser not supported, falling back to Linking', browserError);
        // Fallback to standard OS browser
        await Linking.openURL(paymentUrl);
        
        // Pause execution until user manually confirms they are back
        await new Promise((resolve) => {
          Alert.alert(
            "Complete Payment",
            "We opened the payment page in your browser. Please complete the payment there, then return here and click Confirm.",
            [{ text: "Confirm", onPress: resolve }]
          );
        });
      }

      // 3. Navigate to the Payment Status screen to poll and verify
      router.push(`/payment-return?merchantOrderId=${merchantOrderId}`);

    } catch (error: any) {
      console.error('Payment Error:', error);
      onPaymentFailure(error.message || 'Payment processing error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[{ backgroundColor: '#FFC107', padding: 15, borderRadius: 8, alignItems: 'center', marginVertical: 10 }, buttonStyle]}
      onPress={handlePayment}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={[{ color: '#111827', fontWeight: 'bold', fontSize: 16 }, textStyle]}>
          Proceed to Pay
        </Text>
      )}
    </TouchableOpacity>
  );
}
