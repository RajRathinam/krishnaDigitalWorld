import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { productApi } from '@/services/api';
import ProductCard from './ProductCard';
import Skeleton from './Skeleton';
import { useQuery } from '@tanstack/react-query';
import { useNetwork } from '@/contexts/NetworkContext';
import { ArrowRight } from 'lucide-react-native';

const CARD_WIDTH = 180;
const SPACING = 16;
const ITEM_SIZE = CARD_WIDTH + SPACING;

export function ProductShowcase() {
    const router = useRouter();
    const { isOffline } = useNetwork();
    const scrollX = useRef(new Animated.Value(0)).current;
    const scrollViewRef = useRef<any>(null);
    const currentIndex = useRef(0);

    const { data: responseData, isLoading: loading, isError } = useQuery({
        queryKey: ['featured-products'],
        queryFn: () => productApi.getFeaturedProducts(8),
    });

    const products = (responseData?.data || responseData?.products || []).slice(0, 6);

    useEffect(() => {
        if (!products || products.length === 0) return;
        
        const timer = setInterval(() => {
            let nextIndex = currentIndex.current + 1;
            if (nextIndex >= products.length) {
                nextIndex = 0;
            }
            currentIndex.current = nextIndex;
            const node = scrollViewRef.current;
            if (node) {
                if (typeof node.scrollTo === 'function') {
                    node.scrollTo({ x: nextIndex * ITEM_SIZE, animated: true });
                } else if (typeof node.getNode === 'function' && node.getNode().scrollTo) {
                    node.getNode().scrollTo({ x: nextIndex * ITEM_SIZE, animated: true });
                }
            }
        }, 5000);
        
        return () => clearInterval(timer);
    }, [products.length]);

    // When loading or network is offline or query failed, show horizontal skeleton cards
    if (loading || isError || isOffline || products.length === 0) {
        return (
            <View style={{ backgroundColor: '#0a1929', paddingVertical: 24, marginVertical: 12, borderRadius: 16, marginHorizontal: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 20 }}>
                    <Text style={{ fontSize: 20, fontWeight: '900', color: '#ffffff' }}>
                        Top Picks For <Text style={{ color: '#F59E0B' }}>You</Text>
                    </Text>
                </View>

                <View style={{ flexDirection: 'row', paddingLeft: 16 }}>
                    {[1, 2, 3].map((i) => (
                        <View key={i} style={{ width: CARD_WIDTH, marginRight: SPACING, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 12 }}>
                            <Skeleton width="100%" height={120} borderRadius={8} baseColor="rgba(255,255,255,0.12)" highlightColor="rgba(255,255,255,0.22)" />
                            <Skeleton width="80%" height={14} borderRadius={4} style={{ marginTop: 12 }} baseColor="rgba(255,255,255,0.12)" highlightColor="rgba(255,255,255,0.22)" />
                            <Skeleton width="50%" height={14} borderRadius={4} style={{ marginTop: 8 }} baseColor="rgba(255,255,255,0.12)" highlightColor="rgba(255,255,255,0.22)" />
                        </View>
                    ))}
                </View>
            </View>
        );
    }

    return (
        <View style={{ backgroundColor: '#0a1929', paddingVertical: 24, marginVertical: 12, borderRadius: 16, marginHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#ffffff' }}>
                    Top Picks For <Text style={{ color: '#F59E0B' }}>You</Text>
                </Text>
                <Pressable onPress={() => router.push('/shop')} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: '#F59E0B', fontSize: 13, fontWeight: '600', marginRight: 4 }}>See all</Text>
                    <ArrowRight size={14} color="#F59E0B" />
                </Pressable>
            </View>

            <View>
                <Animated.ScrollView
                    ref={scrollViewRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={ITEM_SIZE}
                    decelerationRate="fast"
                    contentContainerStyle={{ paddingLeft: 16, paddingRight: 0 }}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                >
                    {products.map((product: any) => (
                        <ProductCard key={product.id || product._id} product={product} isCompact={true} />
                    ))}
                </Animated.ScrollView>

                {/* Indicators */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
                    {products.map((_: any, i: number) => {
                        const opacity = scrollX.interpolate({
                            inputRange: [(i - 1) * ITEM_SIZE, i * ITEM_SIZE, (i + 1) * ITEM_SIZE],
                            outputRange: [0.3, 1, 0.3],
                            extrapolate: 'clamp',
                        });
                        const width = scrollX.interpolate({
                            inputRange: [(i - 1) * ITEM_SIZE, i * ITEM_SIZE, (i + 1) * ITEM_SIZE],
                            outputRange: [8, 24, 8],
                            extrapolate: 'clamp',
                        });
                        const backgroundColor = '#FFFFFF';
                        return (
                            <Animated.View
                                key={`dot-${i}`}
                                style={{
                                    height: 4,
                                    width,
                                    backgroundColor,
                                    borderRadius: 2,
                                    marginHorizontal: 3,
                                    opacity,
                                }}
                            />
                        );
                    })}
                </View>
            </View>
        </View>
    );
}
