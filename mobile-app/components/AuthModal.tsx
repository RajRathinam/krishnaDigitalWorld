import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
  Animated as RNAnimated,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Phone, User, Sparkles, X, Gift, Check, ArrowRight, Star, ShoppingBag, Eye, EyeOff, PartyPopper, RefreshCcw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  interpolate,
  Easing,
  runOnJS,
  withDelay,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Theme colors - Updated to Yellow
const COLORS = {
  primary: '#eab308',      // Yellow primary
  primaryLight: 'rgba(234, 179, 8, 0.1)',  // Light yellow with opacity
  primaryDark: '#ca8a04',   // Darker yellow
  accent: '#f59e0b',        // Orange accent to complement yellow
  background: '#ffffff',
  card: '#fefce8',          // Light yellow tint for card
  foreground: '#0f172a',
  muted: '#64748b',
  mutedLight: '#94a3b8',
  border: '#e2e8f0',
  destructive: '#ef4444',
  success: '#22c55e',
};

// ─────────────────────────────────────────────────────────────────────────────
// Animation Helpers
// ─────────────────────────────────────────────────────────────────────────────

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

const BurstParticle = ({ angle, distance, delay, size, isSquare, color }: any) => {
  const rad = (angle * Math.PI) / 180;
  const tx = Math.cos(rad) * distance;
  const ty = Math.sin(rad) * distance;

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue('0deg');

  useEffect(() => {
    const timeout = setTimeout(() => {
      translateX.value = withTiming(tx, { duration: 1200, easing: Easing.out(Easing.exp) });
      translateY.value = withTiming(ty, { duration: 1200, easing: Easing.out(Easing.exp) });
      scale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1.3, { duration: 200 }),
        withTiming(1, { duration: 1000 }),
        withTiming(0, { duration: 300 })
      );
      opacity.value = withSequence(
        withTiming(0, { duration: 0 }),
        withDelay(delay, withTiming(1, { duration: 100 })),
        withTiming(1, { duration: 800 }),
        withTiming(0, { duration: 300 })
      );
      rotate.value = withDelay(delay, withTiming(`${rand(-200, 200)}deg`, { duration: 1500 }));
    }, delay);
    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: rotate.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          borderRadius: isSquare ? 3 : size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

const Streamer = ({ delay, x }: { delay: number; x: number }) => {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue('0deg');

  const colors = [COLORS.primary, `${COLORS.primary}99`, `${COLORS.primary}66`, COLORS.accent];
  const color = colors[Math.floor(rand(0, colors.length))];

  useEffect(() => {
    const timeout = setTimeout(() => {
      translateY.value = withTiming(height * 1.1, { duration: rand(2000, 3000), easing: Easing.in(Easing.exp) });
      opacity.value = withSequence(
        withTiming(0, { duration: 0 }),
        withDelay(delay, withTiming(1, { duration: 200 })),
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 500 })
      );
      rotate.value = withDelay(delay, withTiming(`${rand(-25, 25)}deg`, { duration: 500 }));
    }, delay);
    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { rotate: rotate.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.streamer,
        { left: `${x}%`, backgroundColor: color, width: rand(3, 7), height: rand(10, 24) },
        animatedStyle,
      ]}
    />
  );
};

const OrbitRing = ({ radius, speed, delay, color }: any) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0.2);
  const opacity = useSharedValue(0);

  useEffect(() => {
    rotation.value = withDelay(delay, withRepeat(withTiming(360, { duration: speed, easing: Easing.linear }), -1));
    scale.value = withDelay(delay, withSpring(1));
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.orbitRing, { width: radius * 2, height: radius * 2, borderColor: `${color}33` }, containerStyle]}>
      <Animated.View style={[{ width: '100%', height: '100%', position: 'relative' }, animatedStyle]}>
        <View style={[styles.orbitDot, { backgroundColor: color }]} />
      </Animated.View>
    </Animated.View>
  );
};

const CouponCard = () => {
  const [flipped, setFlipped] = useState(false);
  const rotation = useSharedValue(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      rotation.value = withTiming(180, { duration: 750 });
      setFlipped(true);
    }, 1600);
    return () => clearTimeout(t);
  }, []);

  const handleFlip = () => {
    const nextVal = rotation.value >= 180 ? 0 : 180;
    rotation.value = withTiming(nextVal, { duration: 750 });
    setFlipped(nextVal >= 180);
  };

  const frontStyle = useAnimatedStyle(() => ({
    backfaceVisibility: 'hidden',
    transform: [{ rotateY: `${rotation.value}deg` }],
  }));

  const backStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    backfaceVisibility: 'hidden',
    transform: [{ rotateY: `${rotation.value + 180}deg` }],
  }));

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Alert.alert('Copied!', 'Coupon code WELCOME10 copied to clipboard');
  };

  return (
    <Pressable onPress={handleFlip} style={styles.couponContainer}>
      <Animated.View style={[styles.couponSide, styles.couponFront, frontStyle]}>
        <Gift size={28} color="#fff" />
        <View>
          <Text style={styles.couponBadgeText}>YOUR REWARD</Text>
          <Text style={styles.couponMainText}>10% OFF</Text>
        </View>
        <RefreshCcw size={14} color="rgba(255,255,255,0.5)" style={{ position: 'absolute', right: 12, top: '50%', marginTop: -7 }} />
      </Animated.View>

      <Animated.View style={[styles.couponSide, styles.couponBack, backStyle]}>
        <Text style={styles.couponBackLabel}>COUPON CODE</Text>
        <Text style={styles.couponCode}>WELCOME10</Text>
        <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {copied && <Check size={10} color={COLORS.primary} />}
            <Text style={styles.copyBtnText}>{copied ? 'Copied!' : 'Copy code'}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Pressable>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

interface AuthModalProps {
  visible: boolean;
  onClose?: () => void;
}

export default function AuthModal({ visible, onClose }: AuthModalProps) {
  const { login, verifyOtp, register, verifyRegistration, resendOtp, user } = useAuth();
  const [step, setStep] = useState<'info' | 'otp' | 'success'>('info');
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [isOtpFocused, setIsOtpFocused] = useState(false);

  useEffect(() => {
    if (!visible) {
      // Reset state when modal closes
      setTimeout(() => {
        setStep('info');
        setName('');
        setPhone('');
        setOtp('');
        setError('');
        setDevOtp(null);
        setAuthMode('register');
        setIsOtpFocused(false);
      }, 300);
    }
  }, [visible]);

  const handleTryToClose = () => {
    if (step !== 'success') {
      Alert.alert('Please complete signup', 'Complete the signup to access exclusive deals!');
      return;
    }
    onClose?.();
  };

  const handleGenerateOTP = async () => {
    if (authMode === 'register' && !name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setError('');
    setLoading(true);
    try {
      if (authMode === 'register') {
        const res = await register(name, phone);
        const otpCode = res?.data?.otp || res?.otp;
        if (otpCode) setDevOtp(otpCode);
        Alert.alert('OTP Sent', otpCode ? `OTP: ${otpCode}` : 'Check your phone for the OTP');
      } else {
        const res = await login(phone);
        const otpCode = res?.data?.otp || res?.otp;
        if (otpCode) setDevOtp(otpCode);
        Alert.alert('OTP Sent', otpCode ? `OTP: ${otpCode}` : 'Check your phone for the OTP');
      }
      setStep('otp');
    } catch (err: any) {
      const raw = err?.response?.data?.message || err?.message || 'Failed to send OTP';
      const errorMessage =
        typeof raw === 'string' && raw.length > 120
          ? 'Could not send OTP. Check your connection and API URL (use https:// with no redirect).'
          : raw;
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setError('');
    setLoading(true);
    try {
      if (authMode === 'register') {
        await verifyRegistration(phone, otp);
      } else {
        await verifyOtp(phone, otp);
      }
      setStep('success');
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'OTP verification failed';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const particles = Array.from({ length: 36 }).map((_, i) => ({
    id: i,
    angle: (360 / 36) * i + rand(-6, 6),
    distance: rand(55, 130),
    delay: rand(0, 400),
    size: rand(5, 13),
    isSquare: Math.random() > 0.6,
    color: [COLORS.primary, `${COLORS.primary}B3`, `${COLORS.primary}66`, COLORS.accent, `${COLORS.accent}B3`][i % 5]
  }));

  const streamers = Array.from({ length: 22 }).map((_, i) => ({
    id: i,
    delay: rand(0, 1200),
    x: rand(4, 96)
  }));

  const renderInfoStep = () => (
    <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={styles.card}>
      {/* Close button for non-success steps */}
      {step !== 'success' && (
        <TouchableOpacity onPress={handleTryToClose} style={styles.closeButton}>
          <X size={18} color={COLORS.muted} />
        </TouchableOpacity>
      )}

      <View style={styles.header}>
        <View style={[styles.mainIconContainer, { backgroundColor: COLORS.primaryLight }]}>
          <Sparkles size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>
          {authMode === 'register' ? 'Join Our Community!' : 'Welcome Back!'}
        </Text>

        <View style={styles.tabBar}>
          <TouchableOpacity
            onPress={() => { setAuthMode('register'); setDevOtp(null); }}
            style={[styles.tabItem, authMode === 'register' && styles.activeTabItem]}
          >
            <Text style={[styles.tabLabel, authMode === 'register' && styles.activeTabLabel]}>Sign up</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setAuthMode('login'); setDevOtp(null); }}
            style={[styles.tabItem, authMode === 'login' && styles.activeTabItem]}
          >
            <Text style={[styles.tabLabel, authMode === 'login' && styles.activeTabLabel]}>Sign in</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          {authMode === 'register'
            ? 'Get exclusive deals and updates on your favorite hardware'
            : 'Sign in with your phone number to continue'}
        </Text>
      </View>

      <View style={styles.inputSection}>
        {authMode === 'register' && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>YOUR NAME</Text>
            <View style={[styles.inputField, { borderColor: COLORS.border }]}>
              <User size={18} color={COLORS.mutedLight} />
              <TextInput
                placeholder="Enter your name"
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholderTextColor={COLORS.mutedLight}
              />
            </View>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>PHONE NUMBER</Text>
          <View style={[styles.inputField, { borderColor: COLORS.border }]}>
            <Phone size={18} color={COLORS.mutedLight} />
            <TextInput
              placeholder="Enter phone number"
              style={styles.textInput}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={(text) => setPhone(text.replace(/\D/g, '').slice(0, 10))}
              placeholderTextColor={COLORS.mutedLight}
            />
          </View>
        </View>

        {error ? <Text style={styles.errorMessage}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: COLORS.primary }]}
          onPress={handleGenerateOTP}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {authMode === 'register' ? 'Generate OTP' : 'Send OTP'}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footerText}>
          {authMode === 'register'
            ? 'By signing up, you agree to our Terms & Privacy Policy'
            : 'We will send a one-time password to your phone.'}
        </Text>

        {authMode === 'register' ? (
          <Text style={styles.switchModeText}>
            Already have an account?{' '}
            <Text onPress={() => { setAuthMode('login'); setDevOtp(null); }} style={styles.switchModeLink}>
              Sign in
            </Text>
          </Text>
        ) : (
          <Text style={styles.switchModeText}>
            New here?{' '}
            <Text onPress={() => { setAuthMode('register'); setDevOtp(null); }} style={styles.switchModeLink}>
              Sign up
            </Text>
          </Text>
        )}
      </View>
    </Animated.View>
  );

  const renderOtpStep = () => (
    <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={styles.card}>
      <TouchableOpacity onPress={handleTryToClose} style={styles.closeButton}>
        <X size={18} color={COLORS.muted} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={[styles.mainIconContainer, { backgroundColor: COLORS.primaryLight }]}>
          <Phone size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Verify Your Number</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to
          {'\n'}
          <Text style={{ fontWeight: '800', color: COLORS.foreground }}>+91 {phone}</Text>
        </Text>
      </View>

      {devOtp && /^\d{6}$/.test(devOtp) && (
        <View style={styles.devOtpContainer}>
          <Text style={styles.devOtpText}>
            Dev OTP: <Text style={styles.devOtpCode}>{devOtp}</Text>
          </Text>
        </View>
      )}

      <View style={styles.inputSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>ENTER OTP</Text>
          <View style={styles.otpWrapper}>
            <TextInput
              style={styles.hiddenOtpInput}
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              onFocus={() => setIsOtpFocused(true)}
              onBlur={() => setIsOtpFocused(false)}
            />
            <View style={styles.otpSlotsContainer} pointerEvents="none">
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const isActive = isOtpFocused && (otp.length === i || (otp.length === 6 && i === 5));
                return (
                  <View 
                    key={i} 
                    style={[
                      styles.otpSlot,
                      isActive && styles.otpSlotActive,
                      !!otp[i] && styles.otpSlotFilled
                    ]}
                  >
                    <Text style={styles.otpSlotText}>{otp[i] || ''}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {error ? <Text style={styles.errorMessage}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: COLORS.primary, opacity: otp.length === 6 ? 1 : 0.6 }]}
          onPress={handleVerifyOTP}
          disabled={loading || otp.length !== 6}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.primaryButtonText}>Verify OTP</Text>
              <ArrowRight size={18} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendContainer}
          onPress={() => {
            setStep('info');
            setDevOtp(null);
          }}
          disabled={loading}
        >
          <Text style={styles.resendText}>Didn't receive code? <Text style={styles.resendLink}>Resend OTP</Text></Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderSuccessStep = () => (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(400)} style={styles.fullScreenSuccess}>
      {/* Background radial gradient */}
      <View style={[styles.successRadialBg, { backgroundColor: `${COLORS.primary}0D` }]} />

      {streamers.map(s => <Streamer key={s.id} {...s} />)}

      <View style={styles.successAnimations}>
        <OrbitRing radius={70} speed={8000} delay={300} color={COLORS.primary} />
        <OrbitRing radius={100} speed={12000} delay={500} color={COLORS.primary} />
        <OrbitRing radius={130} speed={18000} delay={700} color={COLORS.accent} />

        <View style={styles.explosionCenter}>
          {particles.map(p => <BurstParticle key={p.id} {...p} />)}
          <View style={[styles.successIconBox, { backgroundColor: COLORS.primaryLight, borderColor: `${COLORS.primary}1A` }]}>
            <PartyPopper size={40} color={COLORS.primary} />
          </View>
        </View>
      </View>

      <View style={styles.successTextContent}>
        <View style={styles.successBadge}>
          <Star size={12} color={COLORS.primary} fill={COLORS.primary} />
          <Text style={styles.successBadgeLabel}>YOU'RE IN</Text>
          <Star size={12} color={COLORS.primary} fill={COLORS.primary} />
        </View>

        <Text style={styles.successMainTitle}>
          Welcome,{' '}
          <Text style={{ color: COLORS.primary }}>
            {name || user?.name || 'Friend'}
          </Text>
        </Text>

        <Text style={styles.successTagline}>
          {authMode === 'register'
            ? "You're now part of our community. Here's a little gift to get you started."
            : "You're now part of our community. Happy shopping!"}
        </Text>

        {authMode === 'register' && <CouponCard />}

        <TouchableOpacity
          style={[styles.getStartedBtn, { backgroundColor: COLORS.primary }]}
          onPress={() => onClose?.()}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ShoppingBag size={20} color="#fff" />
            <Text style={styles.getStartedBtnText}>Start Shopping</Text>
            <ArrowRight size={20} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <Modal
      transparent
      visible={visible && !user}
      animationType="fade"
      onRequestClose={handleTryToClose}
    >
      <Pressable style={styles.backdrop} onPress={handleTryToClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
            <LinearGradient
              colors={['#ffffff', '#fffef7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.modalContent}
            >
              {step === 'info' && renderInfoStep()}
              {step === 'otp' && renderOtpStep()}
              {step === 'success' && renderSuccessStep()}
            </LinearGradient>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.92,
    maxWidth: 400,
  },
  keyboardView: {
    width: '100%',
  },
  modalContent: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  card: {
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  mainIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.foreground,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 28,
    padding: 4,
    marginVertical: 16,
    width: 200,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 24,
  },
  activeTabItem: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.muted,
  },
  activeTabLabel: {
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  inputSection: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.mutedLight,
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.foreground,
    fontWeight: '600',
    marginLeft: 12,
  },
  otpWrapper: {
    position: 'relative',
    height: 54,
    justifyContent: 'center',
  },
  hiddenOtpInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
    zIndex: 10,
  },
  otpSlotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  otpSlot: {
    width: 46,
    height: 54,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  otpSlotActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  otpSlotFilled: {
    borderColor: COLORS.border,
  },
  otpSlotText: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.foreground,
  },
  errorMessage: {
    color: COLORS.destructive,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 16,
  },
  primaryButton: {
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  footerText: {
    fontSize: 10,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 16,
  },
  switchModeText: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 16,
  },
  switchModeLink: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  resendContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: COLORS.muted,
  },
  resendLink: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  devOtpContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  devOtpText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  devOtpCode: {
    color: COLORS.primary,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Success styles
  fullScreenSuccess: {
    padding: 32,
    alignItems: 'center',
    minHeight: 500,
    position: 'relative',
    overflow: 'hidden',
  },
  successRadialBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 32,
  },
  successAnimations: {
    height: 180,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  orbitRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'dashed',
    top: '50%',
    left: '50%',
    marginLeft: -70,
    marginTop: -70,
  },
  orbitDot: {
    position: 'absolute',
    top: -4,
    left: '50%',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  explosionCenter: {
    position: 'relative',
    width: 88,
    height: 88,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -6,
    marginLeft: -6,
  },
  successIconBox: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  streamer: {
    position: 'absolute',
    top: -50,
  },
  successTextContent: {
    alignItems: 'center',
    width: '100%',
    zIndex: 2,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  successBadgeLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 2.5,
  },
  successMainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.foreground,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 12,
  },
  successTagline: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  getStartedBtn: {
    paddingHorizontal: 32,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  getStartedBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },

  // Coupon styles
  couponContainer: {
    width: '100%',
    height: 80,
    borderRadius: 20,
    marginBottom: 24,
  },
  couponSide: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  couponFront: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  couponBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
  },
  couponMainText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  couponBack: {
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 4,
  },
  couponBackLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.mutedLight,
    letterSpacing: 2.5,
  },
  couponCode: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 5,
  },
  copyBtn: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: `${COLORS.primary}66`,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
  },
  copyBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
});