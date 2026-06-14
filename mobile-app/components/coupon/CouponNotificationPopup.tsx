import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated as RNAnimated,
  PanResponder,
  Platform,
  Clipboard,
} from 'react-native';
import { Gift, ArrowRight, Check, Ticket, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { useAuth } from '../../contexts/AuthContext';
import { couponApi } from '../../services/api';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Honey Yellow Theme ───────────────────────────────────────────────────────
const Y  = "#ffc107";
const YL = "#fff9e6";
const YD = "#e6a800";

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

// ─── Burst Particle ───────────────────────────────────────────────────────────
const BurstParticle = ({ angle, distance, delay, size, isSquare, color }: any) => {
  const rad = (angle * Math.PI) / 180;
  const opacity = useSharedValue(0);
  const x      = useSharedValue(0);
  const y      = useSharedValue(0);
  const scale  = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay * 1000, withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(1, { duration: 800 }),
      withTiming(0, { duration: 400 }),
    ));
    x.value = withDelay(delay * 1000,
      withTiming(Math.cos(rad) * distance, { duration: 1200, easing: Easing.out(Easing.quad) }));
    y.value = withDelay(delay * 1000,
      withTiming(Math.sin(rad) * distance, { duration: 1200, easing: Easing.out(Easing.quad) }));
    scale.value = withDelay(delay * 1000, withSequence(
      withTiming(1.3, { duration: 300 }),
      withTiming(1,   { duration: 400 }),
      withTiming(0,   { duration: 500 }),
    ));
    rotate.value = withDelay(delay * 1000,
      withTiming(rand(-200, 200), { duration: 1200 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: isSquare ? 3 : size / 2,
        backgroundColor: color,
      }, animStyle]}
    />
  );
};

// ─── Streamer ─────────────────────────────────────────────────────────────────
const Streamer = ({ delay, xPos }: { delay: number; xPos: number }) => {
  const colors = [Y, YD, "#fff", "#e5e7eb", YL, "#d1d5db", "#ffd54f"];
  const color  = colors[Math.floor(rand(0, colors.length))];
  const size   = rand(3, 7);
  const height = rand(10, 24);

  const opacity = useSharedValue(0);
  const y       = useSharedValue(-20);
  const xOff    = useSharedValue(0);
  const rotate  = useSharedValue(rand(-25, 25));

  useEffect(() => {
    opacity.value = withDelay(delay * 1000, withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(1, { duration: 2000 }),
      withTiming(0, { duration: 500 }),
    ));
    y.value    = withDelay(delay * 1000,
      withTiming(SCREEN_HEIGHT * 0.8, { duration: 2500, easing: Easing.linear }));
    xOff.value = withDelay(delay * 1000,
      withRepeat(withTiming(rand(-20, 20), { duration: 800 }), -1, true));
    rotate.value = withDelay(delay * 1000,
      withTiming(rand(-200, 200), { duration: 2500 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: y.value },
      { translateX: xOff.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        left: `${xPos}%`,
        top: 0,
        width: size,
        height,
        borderRadius: 2,
        backgroundColor: color,
      }, animStyle]}
    />
  );
};

// ─── Orbit Ring ───────────────────────────────────────────────────────────────
const OrbitRing = ({ radius, speed, delay, dotColor }: any) => {
  const rotate  = useSharedValue(0);
  const scale   = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value   = withDelay(delay * 1000, withSpring(1));
    opacity.value = withDelay(delay * 1000, withTiming(1, { duration: 500 }));
    rotate.value  = withRepeat(
      withTiming(360, { duration: speed * 1000, easing: Easing.linear }), -1);
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    width: radius * 2,
    height: radius * 2,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: `${Y}44`,
    borderStyle: 'dashed',
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
    position: 'absolute',
    alignItems: 'center',
  }));

  const dotContainerStyle = useAnimatedStyle(() => ({
    width: radius * 2,
    height: radius * 2,
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  return (
    <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={ringStyle}>
        <Animated.View style={dotContainerStyle}>
          <View style={{
            position: 'absolute',
            top: -4,
            left: radius - 4,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: dotColor,
            shadowColor: dotColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 4,
            elevation: 4,
          }} />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

// ─── Scratch Card ─────────────────────────────────────────────────────────────
const GRID_ROWS = 6;
const GRID_COLS = 12;
const TOTAL_CELLS = GRID_ROWS * GRID_COLS;

const ScratchCard = ({ coupon }: { coupon: any }) => {
  const [revealed, setRevealed] = useState(false);
  const [copied,   setCopied]   = useState(false);

  const discountLabel = useMemo(() => {
    const c = coupon.coupon || coupon;
    return c.discountType === 'percentage'
      ? `${c.discountValue}% OFF`
      : `₹${c.discountValue} OFF`;
  }, [coupon]);

  const handleCopy = () => {
    const c = coupon.coupon || coupon;
    Clipboard.setString(c.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Scratch state tracking ─────────────────────────────────────────────────
  // Use a plain Set (not state) so the panResponder closure always sees latest
  const scratchedCells = useRef(new Set<number>()).current;
  const revealedRef    = useRef(false);
  const layoutRef      = useRef({ width: 0, height: 0 });

  // One RN Animated.Value per cell (1 = covered, 0 = scratched)
  const cellAnims = useRef(
    Array.from({ length: TOTAL_CELLS }, () => new RNAnimated.Value(1))
  ).current;

  const scratchAt = (lx: number, ly: number) => {
    const { width, height } = layoutRef.current;
    if (!width || !height) return;

    const cellW = width  / GRID_COLS;
    const cellH = height / GRID_ROWS;

    // Scratch a 3×3 brush around the touch point for a natural feel
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const col = Math.floor(lx / cellW) + dc;
        const row = Math.floor(ly / cellH) + dr;
        if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) continue;

        const idx = row * GRID_COLS + col;
        if (!scratchedCells.has(idx)) {
          scratchedCells.add(idx);
          RNAnimated.timing(cellAnims[idx], {
            toValue: 0,
            duration: 120,
            useNativeDriver: true,
          }).start();

          // Reveal once 35 % of cells are scratched
          if (!revealedRef.current && scratchedCells.size >= TOTAL_CELLS * 0.35) {
            revealedRef.current = true;
            // Fade out ALL remaining cells at once for a clean reveal
            RNAnimated.parallel(
              cellAnims.map(a =>
                RNAnimated.timing(a, { toValue: 0, duration: 350, useNativeDriver: true })
              )
            ).start(() => setRevealed(true));
          }
        }
      }
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:        () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder:         () => true,
      onMoveShouldSetPanResponderCapture:  () => true,
      onPanResponderGrant: (evt) =>
        scratchAt(evt.nativeEvent.locationX, evt.nativeEvent.locationY),
      onPanResponderMove: (evt) =>
        scratchAt(evt.nativeEvent.locationX, evt.nativeEvent.locationY),
    })
  ).current;

  const couponData = coupon.coupon || coupon;

  return (
    <View style={styles.cardContainer}>
      {/* ── Revealed layer (always rendered underneath) ── */}
      <LinearGradient
        colors={[Y, YD]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.revealedLayer}
      >
        <View style={styles.cardLeft}>
          <Text style={styles.rewardLabel}>YOUR REWARD</Text>
          <Text style={styles.discountText}>{discountLabel}</Text>
        </View>

        <View style={styles.cardRight}>
          <Text style={styles.codeLabel}>CODE</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{couponData.code}</Text>
          </View>
          <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
            {copied ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Check size={10} color="#1a6600" />
                <Text style={[styles.copyBtnText, { color: '#1a6600', marginLeft: 4 }]}>
                  Copied!
                </Text>
              </View>
            ) : (
              <Text style={styles.copyBtnText}>Copy code</Text>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ── Scratch surface (sits on top until fully revealed) ── */}
      {!revealed && (
        <View
          style={styles.scratchSurface}
          {...panResponder.panHandlers}
          onLayout={(e) => {
            layoutRef.current = {
              width:  e.nativeEvent.layout.width,
              height: e.nativeEvent.layout.height,
            };
          }}
        >
          {/* Grid of individual scratch cells */}
          <View style={styles.gridContainer} pointerEvents="none">
            {cellAnims.map((anim, i) => {
              const col = i % GRID_COLS;
              const row = Math.floor(i / GRID_COLS);
              return (
                <RNAnimated.View
                  key={i}
                  pointerEvents="none"
                  style={[
                    styles.gridCell,
                    { opacity: anim },
                  ]}
                >
                  <LinearGradient
                    colors={["#f5d060", "#e6a800"]}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.cellTexture} />
                </RNAnimated.View>
              );
            })}
          </View>

          {/* Hint label */}
          <View style={styles.scratchNotice} pointerEvents="none">
            <Text style={styles.scratchNoticeText}>✦ SCRATCH HERE ✦</Text>
          </View>
        </View>
      )}
    </View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const CouponNotificationPopup = () => {
  const [unnotifiedCoupons, setUnnotifiedCoupons] = useState<any[]>([]);
  const [visible, setVisible] = useState(false);
  const { user }  = useAuth();
  const router    = useRouter();

  useEffect(() => {
    if (user) fetchUnnotified();
  }, [user]);

  const fetchUnnotified = async () => {
    try {
      const res = await couponApi.getUnnotified();
      if (res.success && res.data.length > 0) {
        setUnnotifiedCoupons(res.data);
        setVisible(true);
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
    }
  };

  const markAllNotified = async () => {
    for (const c of unnotifiedCoupons) {
      try { await couponApi.markAsNotified(c.id); } catch (_) {}
    }
    setUnnotifiedCoupons([]);
  };

  const handleClose = async () => {
    await markAllNotified();
    setVisible(false);
  };

  const handleViewAll = async () => {
    await markAllNotified();
    setVisible(false);
    router.push('/account/coupons');
  };

  if (!visible) return null;

  const burstParticles = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    angle:    (360 / 30) * i + rand(-6, 6),
    distance: rand(50, 130),
    delay:    rand(0, 0.4),
    size:     rand(5, 12),
    isSquare: Math.random() > 0.5,
    color:    [Y, YD, YL, '#fff', '#ffd54f'][i % 5],
  }));

  const streamers = Array.from({ length: 15 }).map((_, i) => ({
    id:   i,
    delay: rand(0, 1.2),
    xPos:  rand(5, 95),
  }));

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#fff', '#fffdf5', YL]}
            style={styles.gradientBg}
          >
            {/* Top accent bar */}
            <LinearGradient
              colors={[Y, YD, Y]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.topBar}
            />

            {/* Orbit rings */}
            <View style={styles.orbitContainer}>
              <OrbitRing radius={70}  speed={8}  delay={0.2} dotColor={Y} />
              <OrbitRing radius={100} speed={12} delay={0.4} dotColor={YD} />
              <OrbitRing radius={130} speed={16} delay={0.6} dotColor="#d1d5db" />
            </View>

            {/* Streamers */}
            {streamers.map(s => <Streamer key={s.id} {...s} />)}

            {/* Main content */}
            <View style={styles.contentContainer}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  {burstParticles.map(p => <BurstParticle key={p.id} {...p} />)}
                  <View style={styles.ticketIconBox}>
                    <Ticket size={40} color={YD} />
                  </View>
                </View>

                <View style={styles.badge}>
                  <Star size={12} fill={Y} color={Y} />
                  <Text style={styles.badgeText}>GREAT NEWS</Text>
                  <Star size={12} fill={Y} color={Y} />
                </View>

                <Text style={styles.title}>
                  You earned{' '}
                  <Text style={{ color: YD }}>
                    {unnotifiedCoupons.length} coupon{unnotifiedCoupons.length !== 1 ? 's' : ''}
                  </Text>{' '}
                  <Gift size={22} color={Y} />
                </Text>

                <Text style={styles.subtitle}>
                  Scratch each card to reveal your discount code!
                </Text>
              </View>

              {/* Cards */}
              <View style={styles.cardsScroll}>
                {unnotifiedCoupons.slice(0, 2).map((c) => (
                  <ScratchCard key={c.id} coupon={c} />
                ))}
                {unnotifiedCoupons.length > 2 && (
                  <Text style={styles.extraCount}>
                    +{unnotifiedCoupons.length - 2} more coupons waiting
                  </Text>
                )}
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <TouchableOpacity onPress={handleClose} style={styles.laterBtn}>
                  <Text style={styles.laterBtnText}>Later</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleViewAll} style={styles.viewAllBtn}>
                  <LinearGradient
                    colors={[Y, YD]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.viewAllGradient}
                  >
                    <Text style={styles.viewAllText}>View All</Text>
                    <ArrowRight size={16} color="#1a1a1a" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH * 0.9,
    height: 520,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: `${Y}55`,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    zIndex: 100,
  },
  gradientBg: {
    flex: 1,
  },
  topBar: {
    height: 5,
    width: '100%',
  },
  orbitContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    top: -SCREEN_HEIGHT * 0.25,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  ticketIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: YL,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Y,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeText: {
    color: YD,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginHorizontal: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 30,
  },
  cardsScroll: {
    flexGrow: 1,
    marginVertical: 20,
    maxHeight: 300,
  },
  extraCount: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 5,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  laterBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  laterBtnText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  viewAllBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
  },
  viewAllGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  viewAllText: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '800',
  },
  // ── Scratch Card ─────────────────────────────────────────────────────────
  cardContainer: {
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 15,
    marginHorizontal: 4,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: Y,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    position: 'relative',
  },
  revealedLayer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  cardLeft: {
    flex: 1,
  },
  rewardLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7a5200cc',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  discountText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1a1a1a',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  codeLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#7a520099',
    letterSpacing: 2,
    marginBottom: 4,
  },
  codeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#7a520044',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#1a1a1a',
  },
  copyBtn: {
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7a520033',
  },
  copyBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#111827',
  },
  scratchSurface: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  gridContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCell: {
    width:  `${100 / GRID_COLS}%`,
    height: `${100 / GRID_ROWS}%`,
  },
  cellTexture: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  scratchNotice: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scratchNoticeText: {
    fontSize: 12,
    fontWeight: '900',
    color: 'rgba(120,80,0,0.6)',
    letterSpacing: 1,
  },
});

export default CouponNotificationPopup;