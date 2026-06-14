import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy } from 'lucide-react-native';
import { productApi } from '@/services/api';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import { ProductCardSkeleton } from '@/components/SkeletonLoader';

export default function BestSellersScreen() {
    const [bestSellers, setBestSellers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBestSellers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await productApi.getBestSellers(50);
            const data = res?.data || res?.products || res;
            if (Array.isArray(data)) {
                setBestSellers(data);
            } else if (data?.data && Array.isArray(data.data)) {
                setBestSellers(data.data);
            }
        } catch (err) {
            console.error('Failed to load best sellers:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBestSellers();
    }, [fetchBestSellers]);

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['left', 'right', 'bottom']}>
            <Header />
            <ScrollView showsVerticalScrollIndicator={false}>
                <View className="px-4 py-6">
                    <View className="bg-[#FFC107] rounded-2xl p-6 items-center mb-6 flex">
                        <View className="flex-row items-center mb-2">
                            <Trophy size={20} color="#111827" />
                            <Text className="text-gray-900 text-sm font-medium ml-2">Top Rated</Text>
                        </View>
                        <Text className="text-3xl font-bold text-gray-900 mb-2">Best Sellers</Text>
                        <Text className="text-gray-900/80 text-center text-sm">Our most loved products • Trusted by thousands</Text>
                    </View>

                    {loading ? (
                        <View className="flex-row flex-wrap justify-between gap-y-4">
                            {[1, 2, 3, 4, 5, 6].map(i => <ProductCardSkeleton key={i} />)}
                        </View>
                    ) : (
                        <View className="flex-row flex-wrap justify-between gap-y-4">
                            {bestSellers.map((item: any, index: number) => (
                                <ProductCard key={item.id || item._id || index.toString()} product={item} />
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
