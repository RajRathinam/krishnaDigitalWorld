import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';
import AnimatedSplashScreen from '@/components/AnimatedSplashScreen';
import "../global.css";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useColorScheme } from '@/components/useColorScheme';
import { ShopInfoProvider } from '@/contexts/ShopInfoContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import AuthModal from '@/components/AuthModal';
import CouponNotificationPopup from '@/components/coupon/CouponNotificationPopup';
import { registerForPushNotificationsAsync } from '@/services/notifications';
import api from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const queryClient = new QueryClient();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'PlayfairDisplay-Regular': 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZ2xE223kBvXODAfVQDQBu4Wv0dxNNKM4uo7.ttf',
    'PlayfairDisplay-Bold': 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuF5D-vYSZ2xE223kBvRP37sSyX4NGb0CVMNCA8Qbebqy7Y.ttf',
    'DMSans-Regular': 'https://fonts.gstatic.com/s/dmsans/v15/rP2Fp2ywgo0jOc9638n2.ttf',
    'DMSans-Medium': 'https://fonts.gstatic.com/s/dmsans/v15/rP2tP2ywgo0jOc9635nOWtPM.ttf',
    'DMSans-Bold': 'https://fonts.gstatic.com/s/dmsans/v15/rP2Cp2ywgo0jOc9635ucKV_F.ttf',
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [isSplashFinished, setIsSplashFinished] = useState(false);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) {
      console.warn('Failed to load fonts dynamically, falling back to system fonts:', error);
      // Hide the splash screen even if font loading fails so the app can render
      SplashScreen.hideAsync();
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <ShopInfoProvider>
              <View style={{ flex: 1 }}>
                <RootLayoutNav />
                <AuthWrapper isSplashFinished={isSplashFinished} />
                <CouponNotificationPopup />
                {!isSplashFinished && (
                  <AnimatedSplashScreen onFinish={() => setIsSplashFinished(true)} />
                )}
              </View>
            </ShopInfoProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AuthWrapper({ isSplashFinished }: { isSplashFinished: boolean }) {
  const { user, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // If splash screen is done and we have no user, show the mandatory auth modal
    if (isSplashFinished && !loading && !user) {
      setShowModal(true);
    }

    // Setup push notifications if we have a user
    if (user && isSplashFinished) {
      // Small delay to ensure AsyncStorage token is ready before the axios interceptor reads it
      const savePushToken = async () => {
        try {
          const token = await registerForPushNotificationsAsync();
          if (!token) return;
          // Read auth token directly from storage to avoid race condition
          const authToken = await AsyncStorage.getItem('authToken');
          if (!authToken) return;
          await api.post('/users/push-token', { pushToken: token }, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
          console.log('✅ Push token saved to backend successfully');
        } catch (err) {
          console.error('Failed to save push token to backend:', err);
        }
      };
      savePushToken();
    }
  }, [isSplashFinished, loading, !!user]);

  // Pass setShowModal(false) to onClose so the modal stays open through 
  // the celebration step until the user clicks "Start Shopping"
  return <AuthModal visible={showModal} onClose={() => setShowModal(false)} />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: true }} />
      </Stack>
    </ThemeProvider>
  );
}
