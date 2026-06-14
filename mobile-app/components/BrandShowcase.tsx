/**
 * BrandShowcase Component (React Native)
 *
 * Infinite scrolling two-row brand carousel.
 * Row 1 scrolls left, Row 2 scrolls right — mirrors the web version.
 *
 * Dependencies:
 *   - react-native-reanimated
 *   - @tanstack/react-query
 *   - expo-linear-gradient  ← for fade overlays (optional, see note below)
 */

import React, { useEffect } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import Skeleton from '@/components/Skeleton';
import { Image } from 'expo-image';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    FadeInDown,
} from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient'; // remove if not using expo
import { brandApi, API_BASE_URL } from '@/services/api';
const ITEM_SIZE = 80;   // width & height of each brand tile
const ITEM_GAP = 16;   // gap between tiles
const ITEM_STEP = ITEM_SIZE + ITEM_GAP;
const DURATION = 30_000; // ms for one full loop (matches web's 30s)

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getImageUrl = (url?: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
};

/** Double the array so the seam is invisible when we loop */
const doubled = <T,>(arr: T[]): T[] => [...arr, ...arr];

// ─── InfiniteScrollRow ────────────────────────────────────────────────────────

interface RowProps {
    brands: any[];
    direction: 'left' | 'right';
}

const InfiniteScrollRow = ({ brands, direction }: RowProps) => {
    // Total width of ONE copy of the brand list (the "loop unit")
    const loopWidth = brands.length * ITEM_STEP;

    // left  → 0 ➜ -loopWidth  (moves items leftward)
    // right → -loopWidth ➜ 0  (moves items rightward)
    const translateX = useSharedValue(direction === 'left' ? 0 : -loopWidth);

    useEffect(() => {
        const to = direction === 'left' ? -loopWidth : 0;
        translateX.value = direction === 'left' ? 0 : -loopWidth; // reset on brand change

        translateX.value = withRepeat(
            withTiming(to, { duration: DURATION, easing: Easing.linear }),
      /* iterations */ -1,   // infinite
      /* reverse    */ false  // jump-reset, not ping-pong
        );
    }, [loopWidth, direction]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    return (
        <Animated.View style={[styles.row, animatedStyle]}>
            {doubled(brands).map((brand: any, index: number) => (
                <View key={`${brand.id}-${index}`} style={styles.tile}>
                    <Image
                        source={{ uri: getImageUrl(brand.logo) }}
                        style={styles.logo}
                        contentFit="contain"
                    />
                </View>
            ))}
        </Animated.View>
    );
};

// ─── BrandShowcase ────────────────────────────────────────────────────────────

export const BrandShowcase = () => {
    const { data: brandsData, isLoading } = useQuery({
        queryKey: ['brands'],
        queryFn: () => brandApi.getBrands(),
    });

    const rawBrands: any[] = Array.isArray(brandsData?.data)
        ? brandsData.data
        : Array.isArray(brandsData)
            ? brandsData
            : [];

    const activeBrands = rawBrands.filter(
        (b) => b.isActive !== false && b.logo
    );

    if (isLoading) {
        return (
            <View style={styles.section}>
                <View style={styles.header}>
                    <Skeleton width={120} height={20} borderRadius={4} style={{ marginBottom: 8 }} />
                    <Skeleton width={180} height={12} borderRadius={4} />
                </View>
                <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 16 }}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} width={ITEM_SIZE} height={ITEM_SIZE} borderRadius={16} />
                    ))}
                </View>
            </View>
        );
    }

    if (!activeBrands.length) return null;

    // Split into two rows (same logic as web)
    const mid = Math.ceil(activeBrands.length / 2);
    const row1 = activeBrands.slice(0, mid);
    const row2 = activeBrands.slice(mid);

    return (
        <Animated.View entering={FadeInDown.duration(800)} style={styles.section}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={styles.titleBlack}>Shop by </Text>
                    <Text style={styles.titleYellow}>Brand</Text>
                </View>
                <Text style={styles.subtitle}>Trusted brands you love</Text>
            </View>

            {/* Carousel — clipped so rows don't overflow */}
            <View style={styles.carouselWrapper}>
                {row1.length > 0 && (
                    <View style={styles.rowWrapper}>
                        <InfiniteScrollRow brands={row1} direction="left" />
                    </View>
                )}

                {row2.length > 0 && (
                    <View style={styles.rowWrapper}>
                        <InfiniteScrollRow brands={row2} direction="right" />
                    </View>
                )}

                {/* ── Fade overlays (requires expo-linear-gradient) ── */}
                {/* If you don't have expo-linear-gradient, just delete these two Views */}
                <LinearGradient
                    colors={['#ffffff', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.fadeLeft}
                    pointerEvents="none"
                />
                <LinearGradient
                    colors={['transparent', '#ffffff']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.fadeRight}
                    pointerEvents="none"
                />
            </View>
        </Animated.View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    section: {
        paddingVertical: 32,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    loader: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    titleBlack: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    titleYellow: {
        fontSize: 20,
        fontWeight: '700',
        color: '#EAB308',
    },
    subtitle: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 4,
    },
    carouselWrapper: {
        overflow: 'hidden', // clips the infinite rows
        position: 'relative',
    },
    rowWrapper: {
        overflow: 'hidden',
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        gap: ITEM_GAP,
        paddingLeft: 20, // left padding for first item
        paddingVertical: 5
    },
    tile: {
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#f9fafb',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    fadeLeft: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 60,
        zIndex: 10,
    },
    fadeRight: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 60,
        zIndex: 10,
    },
});

export default BrandShowcase;