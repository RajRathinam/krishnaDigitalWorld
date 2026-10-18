import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking, Platform, Dimensions, Image } from 'react-native';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { ArrowRight } from 'lucide-react-native';
import { useShopInfo } from '@/contexts/ShopInfoContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width - 40, 380);

const DEFAULT_PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.srikrishnadigital.app';

function PlayStoreIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Defs>
        <SvgLinearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#00C6FF" />
          <Stop offset="100%" stopColor="#0072FF" />
        </SvgLinearGradient>
        <SvgLinearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#43E97B" />
          <Stop offset="100%" stopColor="#38F9D7" />
        </SvgLinearGradient>
        <SvgLinearGradient id="yellowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFE259" />
          <Stop offset="100%" stopColor="#FFA751" />
        </SvgLinearGradient>
        <SvgLinearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FF5F6D" />
          <Stop offset="100%" stopColor="#FF2D55" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M48 36 L48 476 Q48 492 62 484 L312 256 L62 28 Q48 20 48 36 Z" fill="url(#blueGrad)" />
      <Path d="M312 256 L62 484 Q68 488 76 483 L372 316 L312 256 Z" fill="url(#greenGrad)" />
      <Path d="M312 256 L372 196 L76 29 Q68 24 62 28 L312 256 Z" fill="url(#redGrad)" />
      <Path d="M372 316 L452 271 Q468 262 468 256 Q468 250 452 241 L372 196 L312 256 Z" fill="url(#yellowGrad)" />
    </Svg>
  );
}

export default function ForceUpdateModal() {
  const { shopInfo } = useShopInfo();

  if (!shopInfo || Platform.OS !== 'android') return null;

  const currentVersionCode = Constants.expoConfig?.android?.versionCode ?? 0;
  const minVersionCode = shopInfo.minAppVersionCode;
  const shouldBlock =
    shopInfo.forceUpdateEnabled &&
    !!minVersionCode &&
    currentVersionCode > 0 &&
    currentVersionCode < minVersionCode;

  if (__DEV__) {
    console.log('[ForceUpdateModal]', { currentVersionCode, minVersionCode, forceUpdateEnabled: shopInfo.forceUpdateEnabled, shouldBlock });
  }

  if (!shouldBlock) return null;

  const handleUpdate = () => {
    const url = shopInfo.playStoreUrl || DEFAULT_PLAY_STORE_URL;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.cardShadow}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Image
              source={require('@/assets/images/app_update_popup_pic.png')}
              style={styles.headerImage}
              resizeMode="cover"
            />
          </View>

          <View style={styles.body}>
            <Text style={styles.title}>Update Required</Text>
            <Text style={styles.subtitle}>A new version is available!</Text>
            <Text style={styles.message}>
              {shopInfo.appUpdateMessage ||
                `Please update ${shopInfo.shopName || 'the app'} to continue using the latest features and improvements.`}
            </Text>

            <TouchableOpacity activeOpacity={0.88} onPress={handleUpdate} style={styles.buttonWrap}>
              <LinearGradient
                colors={['#4C1D95', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <PlayStoreIcon size={20} />
                <Text style={styles.buttonText}>Update Now</Text>
                <ArrowRight size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 5, 30, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  cardShadow: {
    width: CARD_WIDTH,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  card: {
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  header: {
    width: '100%',
    aspectRatio: 1604 / 900,
    backgroundColor: '#FFFFFF',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  body: {
    paddingHorizontal: 28,
    paddingTop: 4,
    paddingBottom: 28,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E1033',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7C3AED',
    marginBottom: 14,
  },
  message: {
    fontSize: 14.5,
    color: '#5B5568',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  buttonWrap: {
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
