import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Zap, Clock } from 'lucide-react-native';
import { productApi } from '@/services/api';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import { ProductCardSkeleton } from '@/components/SkeletonLoader';

export default function DealsScreen() {
    const [dealProducts, setDealProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDealProducts = useCallback(async () => {
        try {
            setLoading(true);
            const res = await productApi.getDealOfTheDay(50);
            const data = res?.data || res?.products || res;
            if (Array.isArray(data)) {
                setDealProducts(data);
            } else if (data?.data && Array.isArray(data.data)) {
                setDealProducts(data.data);
            }
        } catch (err) {
            console.error('Failed to load deals:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDealProducts();
    }, [fetchDealProducts]);

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['bottom', 'left', 'right']}>
            <Header />
            <ScrollView showsVerticalScrollIndicator={false}>
                <View className="px-4 py-6">
                    <View className="flex-row items-center mb-6">
                        <View className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                            <Zap size={24} color="#FFC107" />
                        </View>
                        <View>
                            <Text className="text-2xl font-bold text-gray-900">Today's Deals</Text>
                            <View className="flex-row items-center mt-1">
                                <Clock size={16} color="#EF4444" />
                                <Text className="text-sm font-bold text-red-500 ml-1">Limited Time Only</Text>
                            </View>
                        </View>
                    </View>

                    {loading ? (
                        <View className="flex-row flex-wrap justify-between gap-y-4">
                            {[1, 2, 3, 4, 5, 6].map(i => <ProductCardSkeleton key={i} />)}
                        </View>
                    ) : (
                        <View className="flex-row flex-wrap justify-between gap-y-4">
                            {dealProducts.map((item: any, index: number) => (
                                <ProductCard key={item.id || item._id || index.toString()} product={item} />
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
