import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, BackHandler, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react-native';
import { phonePeMobileService } from '../services/phonePeService';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useCart } from '../contexts/CartContext';

export default function PaymentReturnScreen() {
  const { merchantOrderId } = useLocalSearchParams<{ merchantOrderId: string }>();
  const router = useRouter();
  const { clearCart } = useCart();

  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Disable physical back button while verifying
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // Block back button
    });

    if (merchantOrderId) {
      verifyPayment();
    } else {
      setStatus('failed');
      setErrorMessage('Invalid return URL: No order ID found.');
    }

    return () => backHandler.remove();
  }, [merchantOrderId]);

  const verifyPayment = async () => {
    let finalStatus = 'PENDING';
    let data = null;

    try {
      // Poll backend up to 4 times with 3-second delay
      for (let i = 0; i < 4; i++) {
        const response = await phonePeMobileService.checkPaymentStatus(merchantOrderId!);
        if (response.data) {
          finalStatus = response.data.status || response.data.paymentStatus;
          data = response.data;
        }

        if (finalStatus === 'COMPLETED' || finalStatus === 'paid') {
          break; // Success!
        }
        
        // Wait before polling again
        await new Promise(res => setTimeout(res, 3000));
      }

      if (finalStatus === 'COMPLETED' || finalStatus === 'paid') {
        setOrderDetails(data);
        setStatus('success');
        clearCart();
      } else {
        setStatus('failed');
        setErrorMessage(`Payment verification failed. Status: ${finalStatus}. If money was deducted, it will be refunded automatically.`);
      }

    } catch (error: any) {
      console.error('Verification error:', error);
      setStatus('failed');
      setErrorMessage(error.message || 'An error occurred while verifying the payment.');
    }
  };

  const handleContinue = () => {
    if (status === 'success' && orderDetails?.orderId) {
      router.dismissAll();
      router.replace('/(tabs)');
      setTimeout(() => {
        router.push(`/account/orders/${orderDetails.orderId}`);
      }, 150);
    } else {
      router.dismissAll();
      router.replace('/(tabs)/checkout');
    }
  };

  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.content}>
          <ActivityIndicator size={60} color="#FFC107" style={{ marginBottom: 20 }} />
          <Text style={styles.title}>Verifying Payment</Text>
          <Text style={styles.subtitle}>Please do not close this screen or press back...</Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  if (status === 'success') {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View entering={ZoomIn.duration(600).springify()} style={styles.content}>
          <View style={styles.iconContainer}>
            <CheckCircle2 size={80} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.subtitle}>
            Your order <Text style={{ fontWeight: 'bold', color: '#111827' }}>#{orderDetails?.orderNumber}</Text> has been placed.
          </Text>
          
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount Paid</Text>
              <Text style={styles.detailValue}>₹{orderDetails?.amount}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction ID</Text>
              <Text style={styles.detailValue}>{merchantOrderId}</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500).duration(500)} style={{ width: '100%', marginTop: 20 }}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
              <Text style={styles.primaryButtonText}>View Order Details</Text>
              <ArrowRight size={20} color="#fff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.content}>
        <View style={styles.iconContainerFailed}>
          <XCircle size={80} color="#EF4444" />
        </View>
        <Text style={styles.failedTitle}>Payment Failed</Text>
        <Text style={styles.subtitle}>{errorMessage}</Text>
        
        <TouchableOpacity style={styles.outlineButton} onPress={handleContinue}>
          <Text style={styles.outlineButtonText}>Return to Checkout</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainerFailed: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 12,
  },
  failedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  primaryButton: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#111827',
    paddingVertical: 18,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  outlineButton: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingVertical: 18,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  outlineButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
