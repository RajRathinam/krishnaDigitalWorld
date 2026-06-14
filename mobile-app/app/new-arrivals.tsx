import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles } from 'lucide-react-native';
import { productApi } from '@/services/api';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import { ProductCardSkeleton } from '@/components/SkeletonLoader';

export default function NewArrivalsScreen() {
    const [newProducts, setNewProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNewArrivals = useCallback(async () => {
        try {
            setLoading(true);
            const res = await productApi.getNewArrivals(50);
            const data = res?.data || res?.products || res;
            if (Array.isArray(data)) {
                setNewProducts(data);
            } else if (data?.data && Array.isArray(data.data)) {
                setNewProducts(data.data);
            }
        } catch (err) {
            console.error('Failed to load new arrivals:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNewArrivals();
    }, [fetchNewArrivals]);

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['left', 'right', 'bottom']}>
            <Header />
            <ScrollView showsVerticalScrollIndicator={false}>
                <View className="px-4 py-6">
                    <View className="bg-gray-900 rounded-2xl p-6 items-center mb-6 relative overflow-hidden">
                        <View className="flex-row items-center mb-2 z-10">
                            <Sparkles size={20} color="#FFFFFF" />
                            <Text className="text-white text-sm font-medium ml-2">Just Launched</Text>
                        </View>
                        <Text className="text-3xl font-bold text-white mb-2 z-10">New Arrivals</Text>
                        <Text className="text-white/80 text-center text-sm z-10">Discover the latest products • Up to 25% off</Text>
                    </View>

                    {loading ? (
                        <View className="flex-row flex-wrap justify-between gap-y-4">
                            {[1, 2, 3, 4, 5, 6].map(i => <ProductCardSkeleton key={i} />)}
                        </View>
                    ) : (
                        <View className="flex-row flex-wrap justify-between gap-y-4">
                            {newProducts.map((item: any, index: number) => (
                                <ProductCard key={item.id || item._id || index.toString()} product={item} />
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
