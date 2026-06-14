/**
 * HeroSlider — React Native
 * Cinematic editorial style matching the web app
 * - Animated slide transitions (translateX wipe)
 * - Staggered text reveal per slide
 * - Dot indicators with animated progress fill
 * - Floating accent pill
 * - Auto-play with pause on touch
 * - Slide counter top-right
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    Pressable,
    Animated,
    Dimensions,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { Image } from 'expo-image';
import { heroSliderApi, API_BASE_URL } from '@/services/api';
import { HeroSliderSkeleton } from './SkeletonLoader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AUTO_PLAY_INTERVAL = 5000;
const SLIDE_HEIGHT = 200;

const DEFAULT_SLIDES = [
    {
        id: 'def-1',
        title: 'Transform Your Living Space',
        subtitle: 'Premium furniture at unbeatable prices',
        cta: 'Shop Living Room',
        ctaLink: '/products?category=furniture',
        image: require('@/assets/images/sk.png'), // fallback to logo or your hero image
        accent: 'Up to 50% Off',
        isDefault: true,
        tag: 'Furniture',
    },
    {
        id: 'def-2',
        title: 'Smart Kitchen Essentials',
        subtitle: 'Modern appliances for the contemporary home chef',
        cta: 'Explore Kitchen',
        ctaLink: '/products?category=kitchen',
        image: require('@/assets/images/sk.png'),
        accent: 'New Arrivals',
        isDefault: true,
        tag: 'Electronics',
    },
    {
        id: 'def-3',
        title: 'Summer Cooling Solutions',
        subtitle: 'Beat the heat with energy-efficient ACs & coolers',
        cta: 'View Collection',
        ctaLink: '/products?category=home-appliances',
        image: require('@/assets/images/sk.png'),
        accent: 'Starting ₹15,999',
        isDefault: true,
        tag: 'Appliances',
    },
];

// ── Animated dot with progress fill ──
const SlideDot = ({
    active,
    progress,
    onPress,
}: {
    active: boolean;
    progress: Animated.Value;
    onPress: () => void;
}) => {
    const width = active ? 22 : 6;
    return (
        <Pressable onPress={onPress} style={{ marginHorizontal: 3 }}>
            <View
                style={[
                    styles.dot,
                    { width, backgroundColor: active ? '#F2E9EA' : 'rgba(255,255,255,0.4)' },
                ]}
            >
                {active && (
                    <Animated.View
                        style={[
                            styles.dotFill,
                            {
                                width: progress.interpolate({
                                    inputRange: [0, 100],
                                    outputRange: ['0%', '100%'],
                                }),
                            },
                        ]}
                    />
                )}
            </View>
        </Pressable>
    );
};

export default function HeroSlider() {
    const [slides, setSlides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [current, setCurrent] = useState(0);
    const progressAnim = useRef(new Animated.Value(0)).current;
    const progressAnimation = useRef<Animated.CompositeAnimation | null>(null);

    // Translate animations for each slide
    const translateXAnims = useRef<Animated.Value[]>([]);

    // Text stagger anims
    const tagAnim = useRef(new Animated.Value(0)).current;
    const titleAnim = useRef(new Animated.Value(0)).current;
    const subAnim = useRef(new Animated.Value(0)).current;
    const ctaAnim = useRef(new Animated.Value(0)).current;

    const isPaused = useRef(false);

    // Init translate anims when slides load
    useEffect(() => {
        if (!slides.length) return;
        translateXAnims.current = slides.map((_, i) =>
            new Animated.Value(i === 0 ? 0 : SCREEN_WIDTH)
        );
    }, [slides.length]);

    // Fetch slides
    useEffect(() => {
        (async () => {
            try {
                const res = await heroSliderApi.getSliders();
                setSlides(res.success && res.data?.length > 0 ? res.data : DEFAULT_SLIDES);
            } catch {
                setSlides(DEFAULT_SLIDES);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const animateTextIn = useCallback(() => {
        [tagAnim, titleAnim, subAnim, ctaAnim].forEach(a => a.setValue(0));
        Animated.stagger(90, [
            Animated.timing(tagAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
            Animated.timing(titleAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
            Animated.timing(subAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(ctaAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]).start();
    }, [tagAnim, titleAnim, subAnim, ctaAnim]);

    const goTo = useCallback(
        (next: number, dir: 'next' | 'prev' = 'next') => {
            if (!slides.length || !translateXAnims.current.length) return;

            const prev = current;
            const incoming = dir === 'next' ? SCREEN_WIDTH : -SCREEN_WIDTH;

            // Set incoming off-screen
            translateXAnims.current[next].setValue(incoming);

            // Animate both slides
            Animated.parallel([
                Animated.timing(translateXAnims.current[prev], {
                    toValue: dir === 'next' ? -SCREEN_WIDTH : SCREEN_WIDTH,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(translateXAnims.current[next], {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setCurrent(next);
                animateTextIn();
            });
        },
        [current, slides.length, animateTextIn]
    );

    const startProgress = useCallback(() => {
        progressAnim.setValue(0);
        progressAnimation.current?.stop();
        progressAnimation.current = Animated.timing(progressAnim, {
            toValue: 100,
            duration: AUTO_PLAY_INTERVAL,
            useNativeDriver: false,
        });
        progressAnimation.current.start(({ finished }) => {
            if (finished && !isPaused.current && slides.length > 1) {
                const next = (current + 1) % slides.length;
                goTo(next, 'next');
                // startProgress called via useEffect on current change
            }
        });
    }, [progressAnim, current, slides.length, goTo]);

    // Animate text + progress on mount and slide change
    useEffect(() => {
        if (!slides.length) return;
        animateTextIn();
        if (!isPaused.current) startProgress();
    }, [current, slides.length]);

    const handleDot = (i: number) => {
        if (i === current) return;
        goTo(i, i > current ? 'next' : 'prev');
        startProgress();
    };

    const handlePressIn = () => {
        isPaused.current = true;
        progressAnimation.current?.stop();
    };

    const handlePressOut = () => {
        isPaused.current = false;
        startProgress();
    };

    const makeTextStyle = (anim: Animated.Value, yOffset = 18) => ({
        opacity: anim,
        transform: [
            {
                translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [yOffset, 0],
                }),
            },
        ],
    });

    if (loading) {
        return (
            <View style={styles.wrapper}>
                <HeroSliderSkeleton />
            </View>
        );
    }

    if (!slides.length) return null;

    const slide = slides[current];
    const imageSource = slide.isDefault
        ? slide.image
        : { uri: `${API_BASE_URL}${slide.image}` };

    return (
        <View style={styles.wrapper}>
            {/* ── Slides stack ── */}
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={styles.container}
            >
                {slides.map((s, i) => {
                    const tx = translateXAnims.current[i];
                    if (!tx) return null;
                    const src = s.isDefault
                        ? s.image
                        : { uri: `${API_BASE_URL}${s.image}` };
                    return (
                        <Animated.View
                            key={s.id}
                            style={[
                                styles.slide,
                                { transform: [{ translateX: tx }] },
                            ]}
                        >
                            <Image source={src} style={styles.image} contentFit="fill" />
                            {/* Vignettes */}
                            <View style={styles.vignetteBottom} />
                            <View style={styles.vignetteLeft} />
                        </Animated.View>
                    );
                })}
                {/* Content Overlay */}
                <View style={styles.content}>
                    {/* Title */}
                    {/* <Animated.Text style={[styles.title, makeTextStyle(titleAnim, 16)]}>
                        {slide.title}
                    </Animated.Text> */}

                    {/* Subtitle */}
                    {/* {slide.subtitle && (
                        <Animated.Text style={[styles.subtitle, makeTextStyle(subAnim, 14)]}>
                            {slide.subtitle}
                        </Animated.Text>
                    )} */}

                    {/* CTA */}
                    {/* {slide.cta && (
                        <Animated.View style={[makeTextStyle(ctaAnim, 12)]}>
                            <Pressable style={styles.ctaBtn}>
                                <Text style={styles.ctaText}>{slide.cta}</Text>
                                <ArrowRight size={14} color="#000" />
                            </Pressable>
                        </Animated.View>
                    )} */}
                </View>
                {/* ── Mobile thin progress line ── */}
                <View style={styles.progressTrack}>
                    <Animated.View
                        style={[
                            styles.progressBar,
                            {
                                width: progressAnim.interpolate({
                                    inputRange: [0, 100],
                                    outputRange: ['0%', '100%'],
                                }),
                            },
                        ]}
                    />
                </View>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    container: {
        height: SLIDE_HEIGHT,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#1a1a2e',
        position: 'relative',
    },
    skeleton: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e5e7eb',
    },
    slide: {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    vignetteBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '70%',
        // linear-gradient from black/70 to transparent
        backgroundColor: 'transparent',
        // RN doesn't support gradient natively — use expo-linear-gradient or layered Views
        // Fallback: semi-transparent overlay
        // Simple approach:
        borderBottomLeftRadius: 18,
        borderBottomRightRadius: 18,
        // We simulate with opacity overlay below
    },
    vignetteLeft: {
        ...StyleSheet.absoluteFillObject,
    },
    pill: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: '#FFC107',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
        zIndex: 20,
    },
    pillText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#000',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    counter: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'baseline',
        zIndex: 20,
    },
    counterCurrent: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
        lineHeight: 20,
    },
    counterSep: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        marginHorizontal: 2,
    },
    counterTotal: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
    },
    content: {
        position: 'absolute',
        bottom: 22,
        left: 14,
        right: 60,
        zIndex: 20,
    },
    tag: {
        fontSize: 9,
        fontWeight: '700',
        color: '#FFC107',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    title: {
        fontSize: 17,
        fontWeight: '900',
        color: '#fff',
        lineHeight: 22,
        marginBottom: 4,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    subtitle: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 10,
        lineHeight: 15,
    },
    ctaBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFC107',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
    },
    ctaText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#000',
    },
    dotsRow: {
        position: 'absolute',
        bottom: 10,
        right: 14,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 20,
    },
    dot: {
        height: 6,
        borderRadius: 999,
        overflow: 'hidden',
    },
    dotFill: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 999,
    },
    progressTrack: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
        zIndex: 20,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#FFC107',
        borderRadius: 999,
    },
});