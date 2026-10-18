import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Truck } from 'lucide-react-native';

interface PriceHiddenBadgeProps {
  size?: 'sm' | 'md';
}

export default function PriceHiddenBadge({ size = 'sm' }: PriceHiddenBadgeProps) {
  const shimmer = useRef(new Animated.Value(0)).current;
  const isSmall = size === 'sm';

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.delay(400),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  return (
    <View
      style={[
        styles.pill,
        isSmall ? styles.pillSm : styles.pillMd,
      ]}
    >
      <View style={isSmall ? styles.iconBoxSm : styles.iconBoxMd}>
        <Truck size={isSmall ? 12 : 16} color="#9CA3AF" />
        <View
          style={[
            styles.strike,
            isSmall ? styles.strikeSm : styles.strikeMd,
          ]}
        />
      </View>
      <Text style={isSmall ? styles.textSm : styles.textMd}>Price hidden</Text>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.75)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: 60, height: '100%' }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    overflow: 'hidden',
  },
  pillSm: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
    gap: 5,
  },
  pillMd: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textSm: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  textMd: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  iconBoxSm: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxMd: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strike: {
    position: 'absolute',
    backgroundColor: '#9CA3AF',
    borderRadius: 1,
    transform: [{ rotate: '-45deg' }],
  },
  strikeSm: {
    width: 15,
    height: 1.4,
  },
  strikeMd: {
    width: 20,
    height: 1.6,
  },
});
