import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { View, Text, Alert, StyleSheet, Animated } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeNetworkStatus, notifyNetworkStatus, API_BASE_URL } from '@/services/api';

interface NetworkContextType {
  isOffline: boolean;
  setOffline: (offline: boolean) => void;
}

const NetworkContext = createContext<NetworkContextType>({
  isOffline: false,
  setOffline: () => {},
});

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOffline, setIsOffline] = useState(false);
  const lastAlertTime = useRef(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeNetworkStatus((isOnline: boolean) => {
      setIsOffline((prevOffline) => {
        const offline = !isOnline;
        if (prevOffline === offline) return prevOffline;

        if (offline) {
          const now = Date.now();
          if (now - lastAlertTime.current > 15000) {
            lastAlertTime.current = now;
            Alert.alert(
              'Internet Connection Lost',
              'Please check your network settings and try again.'
            );
          }
        } else {
          // ONLY refetch queries when recovering from an offline state!
          if (prevOffline) {
            queryClient.invalidateQueries();
          }
        }
        return offline;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  // When offline, periodically test if connection has been restored
  useEffect(() => {
    if (!isOffline) return;

    const interval = setInterval(async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(`${API_BASE_URL}/api/shop-info`, {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          notifyNetworkStatus(true);
        }
      } catch (e) {
        // Still offline
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isOffline]);

  return (
    <NetworkContext.Provider value={{ isOffline, setOffline: setIsOffline }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const NetworkBanner = () => {
  const { isOffline } = useNetwork();
  const slideAnim = useRef(new Animated.Value(-40)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOffline ? 0 : -40,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOffline]);

  if (!isOffline) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <WifiOff size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
      <Text style={styles.bannerText}>Internet connection lost</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#DC2626',
    paddingVertical: 7,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
