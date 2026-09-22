import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Modal, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Gift, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  BounceIn,
  ZoomIn,
  ZoomInEasyDown,
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { giftApi, API_BASE_URL } from '@/services/api';

const { width, height } = Dimensions.get('window');
const Y = '#ffc107';

// ─── Orbit Ring ───────────────────────────────────────────────────────────────
const OrbitRing = ({ radius, speed, delay, dotColor, reverse = false }: any) => {
  const rotation = useSharedValue(0);
  const scale    = useSharedValue(0.2);
  const opacity  = useSharedValue(0);

  useEffect(() => {
    rotation.value = withDelay(delay, withRepeat(withTiming(reverse ? -360 : 360, { duration: speed, easing: Easing.linear }), -1));
    scale.value    = withDelay(delay, withSpring(1));
    opacity.value  = withDelay(delay, withTiming(1, { duration: 600 }));
  }, []);

  const ringStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));
  const dotStyle  = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  return (
    <Animated.View style={[{ position: 'absolute', borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center', width: radius * 2, height: radius * 2, borderColor: `${dotColor}33` }, ringStyle]}>
      <Animated.View style={[{ width: '100%', height: '100%', position: 'relative' }, dotStyle]}>
        <View style={[{ position: 'absolute', top: -4, left: '50%', marginLeft: -4, width: 8, height: 8, borderRadius: 4, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6 }, { backgroundColor: dotColor, shadowColor: dotColor }]} />
      </Animated.View>
    </Animated.View>
  );
};

// ─── Confetti Particle ────────────────────────────────────────────────────────
const ConfettiParticle = ({ color, delay, startX, endX, endY }: any) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity    = useSharedValue(0);
  const rotate     = useSharedValue(0);
  const scale      = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(delay, withTiming(endX, { duration: 1200, easing: Easing.out(Easing.quad) }));
    translateY.value = withDelay(delay, withTiming(endY, { duration: 1200, easing: Easing.out(Easing.quad) }));
    opacity.value    = withDelay(delay, withSequence(withTiming(1, { duration: 200 }), withDelay(700, withTiming(0, { duration: 300 }))));
    rotate.value     = withDelay(delay, withRepeat(withTiming(360, { duration: 600, easing: Easing.linear }), 3));
    scale.value      = withDelay(delay, withSpring(1, { damping: 4, stiffness: 120 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{ position: 'absolute', width: 10, height: 10, borderRadius: 2, backgroundColor: color, left: startX, top: 0 }, style]} />
  );
};

// ─── Confetti Burst ───────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#FFC107', '#FF5252', '#00BCD4', '#4CAF50', '#9C27B0', '#FF9800', '#E91E63'];

const ConfettiBurst = () => {
  const particles = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: Math.random() * 400,
    startX: width / 2 - 14 + (Math.random() - 0.5) * 20,
    endX: (Math.random() - 0.5) * width * 0.9,
    endY: Math.random() * height * 0.6 + 80,
  }));

  return (
    <View style={{ position: 'absolute', top: 60, left: 0, right: 0, height: 0, zIndex: 100 }} pointerEvents="none">
      {particles.map(p => (
        <ConfettiParticle key={p.id} {...p} />
      ))}
    </View>
  );
};

// ─── Scanning Lottery Animation ───────────────────────────────────────────────
const ScanningAnimation = () => {
  const spin    = useSharedValue(0);
  const pulse   = useSharedValue(1);
  const glow    = useSharedValue(0.3);

  useEffect(() => {
    spin.value  = withRepeat(withTiming(360, { duration: 2000, easing: Easing.linear }), -1);
    pulse.value = withRepeat(withSequence(withTiming(1.12, { duration: 700 }), withTiming(1, { duration: 700 })), -1);
    glow.value  = withRepeat(withSequence(withTiming(1, { duration: 800 }), withTiming(0.3, { duration: 800 })), -1);
  }, []);

  const spinStyle  = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const glowStyle  = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <Animated.View entering={FadeIn.duration(300)} style={{ alignItems: 'center' }}>
      {/* Glow ring */}
      <Animated.View style={[{
        position: 'absolute',
        width: 180, height: 180,
        borderRadius: 90,
        backgroundColor: Y,
      }, glowStyle, { opacity: 0.15 }]} />

      {/* Orbit rings */}
      <OrbitRing radius={60}  speed={3000} delay={0}   dotColor={Y} />
      <OrbitRing radius={80}  speed={4500} delay={300} dotColor="#FF9800" reverse />
      <OrbitRing radius={100} speed={6000} delay={600} dotColor="#FFC107" />

      {/* Center gift box bouncing */}
      <Animated.View style={pulseStyle}>
        <Image
          source={require('@/assets/images/gift.png')}
          style={{ width: 90, height: 90 }}
          contentFit="contain"
        />
      </Animated.View>

      <Animated.Text entering={FadeInDown.delay(200)} style={{ color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 28, letterSpacing: 0.3 }}>
        🎲 Opening your gift...
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(400)} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 8 }}>
        Revealing your luck right now!
      </Animated.Text>

      {/* Loading dots */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 24 }}>
        {[0, 1, 2].map(i => <LoadingDot key={i} delay={i * 200} />)}
      </View>
    </Animated.View>
  );
};

const LoadingDot = ({ delay }: { delay: number }) => {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(delay, withRepeat(withSequence(withTiming(-10, { duration: 400 }), withTiming(0, { duration: 400 })), -1));
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: Y }, style]} />;
};

// ─── Won Screen ───────────────────────────────────────────────────────────────
const WonScreen = ({ giftResult, onClose }: any) => {
  const shimmer = useSharedValue(0);
  const float   = useSharedValue(0);
  const badge   = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.linear }), -1);
    float.value   = withRepeat(withSequence(withTiming(-10, { duration: 1200 }), withTiming(0, { duration: 1200 })), -1);
    badge.value   = withDelay(600, withSpring(1, { damping: 6, stiffness: 100 }));
  }, []);

  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: badge.value }], opacity: badge.value }));

  return (
    <>
      <ConfettiBurst />
      <Animated.View
        entering={ZoomInEasyDown.duration(500).springify()}
        style={styles.resultCard}
      >
        {/* Close */}
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <X size={18} color="#64748B" />
        </TouchableOpacity>

        {/* Background blobs */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={{ position: 'absolute', top: -60, left: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: '#FFF5F5', opacity: 0.9 }} />
          <View style={{ position: 'absolute', top: -40, right: -70, width: 260, height: 260, borderRadius: 130, backgroundColor: '#FFFBEB', opacity: 0.9 }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, backgroundColor: '#FFF7ED', opacity: 0.6 }} />
        </View>

        {/* Congrats label */}
        <Animated.Text entering={FadeInDown.delay(100)} style={styles.wonLabel}>🎉 CONGRATULATIONS! 🎉</Animated.Text>

        {/* Floating gift image */}
        <Animated.View style={[{ marginTop: 8, zIndex: 5 }, floatStyle]}>
          <Image
            source={giftResult.image
              ? { uri: `${API_BASE_URL}${giftResult.image.startsWith('/') ? '' : '/'}${giftResult.image}` }
              : require('@/assets/images/gift.png')}
            style={{ width: 160, height: 160 }}
            contentFit="contain"
          />
          {/* Badge */}
          <Animated.View style={[styles.freeBadge, badgeStyle]}>
            <Gift size={12} color="#fff" />
            <Text style={styles.freeBadgeText}>FREE</Text>
          </Animated.View>
        </Animated.View>

        {/* Cadre Badge */}
        {giftResult.cadre && (
          <Animated.View entering={FadeInUp.delay(250)} style={{ backgroundColor: '#FCE7F3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#FBCFE8', marginBottom: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#BE185D', textTransform: 'uppercase' }}>{giftResult.cadre} Tier</Text>
          </Animated.View>
        )}

        {/* Gift name */}
        <Animated.Text entering={FadeInUp.delay(300)} style={styles.giftName}>
          {giftResult.productName || 'Surprise Gift'}
        </Animated.Text>
        {giftResult.price && (
          <Animated.View entering={FadeInUp.delay(400)} style={styles.worthBadge}>
            <Text style={styles.worthText}>Worth ₹{parseFloat(giftResult.price).toLocaleString('en-IN')}</Text>
          </Animated.View>
        )}

        <Animated.Text entering={FadeInUp.delay(500)} style={styles.wonSubtext}>
          Show this screen to the shopkeeper to claim your gift!
        </Animated.Text>

        <Animated.View entering={FadeInUp.delay(600)} style={{ width: '100%' }}>
          <TouchableOpacity onPress={onClose} style={styles.wonBtn} activeOpacity={0.85}>
            <Text style={styles.wonBtnText}>🎁 Claim My Gift!</Text>
            <ArrowRight size={20} color="#fff" strokeWidth={3} />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </>
  );
};

// ─── Lost Screen ──────────────────────────────────────────────────────────────
const LostScreen = ({ onClose }: any) => {
  const shake = useSharedValue(0);
  useEffect(() => {
    shake.value = withDelay(200, withSequence(
      withTiming(10, { duration: 60 }), withTiming(-10, { duration: 60 }),
      withTiming(8,  { duration: 60 }), withTiming(-8,  { duration: 60 }),
      withTiming(5,  { duration: 60 }), withTiming(0,   { duration: 60 }),
    ));
  }, []);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  return (
    <Animated.View entering={ZoomIn.duration(400)} style={styles.resultCard}>
      <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
        <X size={18} color="#64748B" />
      </TouchableOpacity>

      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={{ position: 'absolute', top: -40, left: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: '#F8F9FA', opacity: 0.8 }} />
      </View>

      <Animated.View style={[{ marginTop: 16 }, shakeStyle]}>
        <Text style={{ fontSize: 72 }}>😔</Text>
      </Animated.View>

      <Animated.Text entering={FadeInDown.delay(200)} style={[styles.wonLabel, { color: '#4B5563' }]}>
        Oh no!
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(350)} style={{ fontSize: 15, color: '#6B7280', textAlign: 'center', paddingHorizontal: 30, marginTop: 8, marginBottom: 28, lineHeight: 22 }}>
        Better luck next time! You didn't win a gift today. Come back and try again tomorrow!
      </Animated.Text>

      <Animated.View entering={FadeInUp.delay(450)} style={{ width: '100%' }}>
        <TouchableOpacity onPress={onClose} style={[styles.wonBtn, { backgroundColor: '#4B5563' }]} activeOpacity={0.85}>
          <Text style={styles.wonBtnText}>Okay, Got It</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

// ─── Info Screen (already scanned / wrong QR / error) ────────────────────────
const InfoScreen = ({ icon: Icon, iconColor, title, message, btnText, onPress, btnColor = '#1F2937' }: any) => (
  <Animated.View entering={SlideInDown.duration(400).springify()} style={styles.resultCard}>
    <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
      <Animated.View entering={BounceIn.delay(200)}>
        <Icon size={56} color={iconColor} />
      </Animated.View>
    </View>
    <Animated.Text entering={FadeInDown.delay(300)} style={[styles.wonLabel, { color: '#111827', fontSize: 22 }]}>{title}</Animated.Text>
    <Animated.Text entering={FadeInDown.delay(400)} style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 24, marginTop: 8, marginBottom: 28, lineHeight: 21 }}>{message}</Animated.Text>
    <Animated.View entering={FadeInUp.delay(500)} style={{ width: '100%' }}>
      <TouchableOpacity onPress={onPress} style={[styles.wonBtn, { backgroundColor: btnColor }]} activeOpacity={0.85}>
        <Text style={styles.wonBtnText}>{btnText}</Text>
      </TouchableOpacity>
    </Animated.View>
  </Animated.View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function OfflineScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanningStatus, setScanningStatus] = useState<'idle' | 'scanning' | 'won' | 'lost' | 'error' | 'already_scanned' | 'wrong_qr'>('idle');
  const [giftResult, setGiftResult] = useState<any>(null);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) return <View style={styles.container}><ActivityIndicator color={Y} size="large" /></View>;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', color: '#1F2937', marginBottom: 16, fontSize: 15 }}>Camera permission is required to scan the QR code.</Text>
        <TouchableOpacity onPress={requestPermission} style={{ backgroundColor: Y, padding: 14, borderRadius: 12, marginBottom: 12, paddingHorizontal: 32 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#6B7280', marginTop: 8 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }: any) => {
    if (scanningStatus !== 'idle') return;
    setScanningStatus('scanning');
    
    try {
      // Run API call and 2-second timer simultaneously
      const [res] = await Promise.all([
        giftApi.scanOfflineGift(data),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
      
      if (res.success) {
        if (res.status === 'won') { setGiftResult(res.gift); setScanningStatus('won'); }
        else if (res.status === 'lost') setScanningStatus('lost');
      } else {
        if (res.message?.includes('already scanned')) setScanningStatus('already_scanned');
        else if (res.message?.includes('Invalid QR code')) setScanningStatus('wrong_qr');
        else setScanningStatus('error');
      }
    } catch (err: any) {
      // Even on error, wait out the remaining time if it failed too quickly
      // (Simple delay here as fallback)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const msg = err.response?.data?.message || err.message || '';
      if (msg.includes('already scanned')) setScanningStatus('already_scanned');
      else if (msg.includes('Invalid QR code')) setScanningStatus('wrong_qr');
      else setScanningStatus('error');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <X size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Unlock Your Gift 🎁</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.cameraContainer}>
        {scanningStatus === 'idle' && (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
        )}
        {scanningStatus === 'idle' && (
          <View style={styles.overlay}>
            {/* Dimmed areas around the scan box */}
            <View style={styles.scanTarget}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              {/* Animated scan line */}
              <ScanLine />
            </View>
            <Text style={styles.scanText}>Position the QR code within the frame</Text>
          </View>
        )}
      </View>

      <Modal visible={scanningStatus !== 'idle'} transparent animationType="none">
        <View style={styles.modalBg}>
          {scanningStatus === 'scanning'       && <ScanningAnimation />}
          {scanningStatus === 'won' && giftResult && <WonScreen giftResult={giftResult} onClose={() => router.back()} />}
          {scanningStatus === 'lost'            && <LostScreen onClose={() => router.back()} />}
          {scanningStatus === 'already_scanned' && (
            <InfoScreen
              icon={AlertCircle} iconColor="#F59E0B"
              title="Already Scanned"
              message="You have already scanned for a gift today. Come back tomorrow for another chance!"
              btnText="Got It"
              btnColor="#F59E0B"
              onPress={() => router.back()}
            />
          )}
          {scanningStatus === 'wrong_qr' && (
            <InfoScreen
              icon={AlertCircle} iconColor="#EF4444"
              title="Invalid QR Code"
              message="This is not a valid Sri Krishna Digital World gift QR. Please scan the official QR code at the shop!"
              btnText="Try Again"
              btnColor="#EF4444"
              onPress={() => setScanningStatus('idle')}
            />
          )}
          {scanningStatus === 'error' && (
            <InfoScreen
              icon={X} iconColor="#EF4444"
              title="Oops!"
              message="Something went wrong. Please try scanning again."
              btnText="Try Again"
              onPress={() => setScanningStatus('idle')}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Scan Line Animation ──────────────────────────────────────────────────────
const ScanLine = () => {
  const translateY = useSharedValue(0);
  const scanBoxSize = width * 0.7;
  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(scanBoxSize - 4, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.quad) })
      ), -1
    );
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  return (
    <Animated.View style={[{ position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: Y, shadowColor: Y, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8 }, style]} />
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#0a0a0a' },
  container:       { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 8, zIndex: 10 },
  backBtn:         { padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 },
  headerTitle:     { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0.3 },
  cameraContainer: { flex: 1, position: 'relative' },
  overlay:         { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  scanTarget:      { width: width * 0.7, height: width * 0.7, backgroundColor: 'transparent', overflow: 'hidden' },
  corner:          { position: 'absolute', width: 44, height: 44, borderColor: Y },
  topLeft:         { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 20 },
  topRight:        { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 20 },
  bottomLeft:      { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 20 },
  bottomRight:     { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 20 },
  scanText:        { color: '#fff', marginTop: 36, fontSize: 15, fontWeight: '600', letterSpacing: 0.2 },
  modalBg:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  resultCard:      { backgroundColor: '#fff', borderRadius: 32, alignItems: 'center', width: '100%', overflow: 'hidden', paddingHorizontal: 24, paddingBottom: 28, paddingTop: 16 },
  closeBtn:        { position: 'absolute', top: 16, right: 16, backgroundColor: '#F1F5F9', borderRadius: 20, padding: 8, zIndex: 10 },
  wonLabel:        { fontSize: 24, fontWeight: '900', color: '#EA580C', textAlign: 'center', marginTop: 12, letterSpacing: 0.3 },
  giftName:        { fontSize: 22, fontWeight: '900', color: '#111827', textAlign: 'center', marginTop: 14, marginBottom: 8, paddingHorizontal: 8 },
  worthBadge:      { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100, marginBottom: 8 },
  worthText:       { color: '#92400E', fontWeight: '800', fontSize: 14 },
  wonSubtext:      { fontSize: 13, color: '#6B7280', textAlign: 'center', paddingHorizontal: 24, marginBottom: 24, lineHeight: 20 },
  wonBtn:          { backgroundColor: '#EA580C', paddingVertical: 17, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, width: '100%' },
  wonBtnText:      { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.3 },
  freeBadge:       { position: 'absolute', top: 0, right: -8, backgroundColor: '#E11D48', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 4, elevation: 6, shadowColor: '#E11D48', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6 },
  freeBadgeText:   { color: '#fff', fontSize: 11, fontWeight: '900' },
});
