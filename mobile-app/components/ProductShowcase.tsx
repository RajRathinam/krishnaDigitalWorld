import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, Dimensions, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { productApi } from '@/services/api';
import ProductCard from './ProductCard';
import { ArrowRight, AlertCircle } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = 180;
const SPACING = 16;
const ITEM_SIZE = CARD_WIDTH + SPACING;

export function ProductShowcase() {
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const scrollX = useRef(new Animated.Value(0)).current;
    const scrollViewRef = useRef<any>(null);
    const currentIndex = useRef(0);

    useEffect(() => {
        let mounted = true;
        const fetchProducts = async () => {
            try {
                const response = await productApi.getFeaturedProducts(8);
                const data = response?.data || response?.products || [];
                if (mounted) setProducts(data.slice(0, 6));
            } catch (err) {
                if (mounted) setError('Failed to load products');
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchProducts();
        return () => { mounted = false; };
    }, []);

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
        }, 2000);
        
        return () => clearInterval(timer);
    }, [products.length]);

    if (loading || (!loading && products.length === 0 && !error)) return null;


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

            {error ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                    <AlertCircle color="#9CA3AF" size={40} style={{ marginBottom: 16 }} />
                    <Text style={{ color: '#9CA3AF' }}>{error}</Text>
                </View>
            ) : (
                <View>
                    <Animated.ScrollView
                        ref={scrollViewRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={ITEM_SIZE}
                        decelerationRate="fast"
                        contentContainerStyle={{ paddingLeft: 16, paddingRight: 0 }} // Right padding comes from last card's margin
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                            { useNativeDriver: false }
                        )}
                        scrollEventThrottle={16}
                    >
                        {products.map((product) => (
                            <ProductCard key={product.id || product._id} product={product} isCompact={true} />
                        ))}
                    </Animated.ScrollView>

                    {/* Indicators */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
                        {products.map((_, i) => {
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
                                    }}
                                />
                            );
                        })}
                    </View>
                </View>
            )}
        </View>
    );
}
