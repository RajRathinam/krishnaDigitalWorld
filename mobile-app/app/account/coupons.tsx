import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Clipboard, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ticket, Calendar, Copy, Check, ChevronLeft, AlertCircle } from 'lucide-react-native';
import Header from '@/components/Header';
import { useQuery } from '@tanstack/react-query';
import { couponApi } from '@/services/api';
import { useRouter } from 'expo-router';
import { ListItemSkeleton } from '@/components/SkeletonLoader';
import Skeleton from '@/components/Skeleton';

function CouponCard({ coupon, index }: { coupon: any, index: number }) {
    const couponData = coupon.coupon || coupon;
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        Clipboard.setString(couponData.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isExpired = new Date(couponData.validUntil) < new Date();
    const isUsed = coupon.isUsed;

    return (
        <View className={`bg-white rounded-2xl p-5 mb-4 border ${isUsed ? 'bg-gray-50 border-gray-100 opacity-60' : 'border-blue-50'} shadow-sm relative overflow-hidden`}>
            {isUsed && (
                <View className="absolute top-2 right-2 bg-orange-100 px-2 py-0.5 rounded-full">
                    <Text className="text-orange-600 text-[10px] font-bold">USED</Text>
                </View>
            )}
            {isExpired && !isUsed && (
                <View className="absolute top-2 right-2 bg-gray-100 px-2 py-0.5 rounded-full">
                    <Text className="text-gray-500 text-[10px] font-bold">EXPIRED</Text>
                </View>
            )}

            <View className="flex-row items-center mb-4">
                <View className={`w-12 h-12 rounded-xl flex items-center justify-center ${isUsed ? 'bg-gray-100' : 'bg-blue-50'}`}>
                    <Ticket size={24} color={isUsed ? '#9CA3AF' : '#3B82F6'} />
                </View>
                <View className="ml-3 flex-1">
                    <Text className="text-gray-900 font-bold text-sm" numberOfLines={1}>{couponData.description || 'Special Discount'}</Text>
                    <Text className="text-blue-600 font-bold mt-1 text-xs">
                        {couponData.discountType === 'percentage' ? `${couponData.discountValue}% Off` : `₹${couponData.discountValue} Off`}
                    </Text>
                </View>
            </View>

            <View className="bg-gray-50 p-3 rounded-xl flex-row justify-between items-center mb-4 border border-gray-100 border-dashed">
                <Text className="font-mono font-bold text-gray-900 tracking-widest">{couponData.code}</Text>
                <TouchableOpacity onPress={handleCopy} disabled={isExpired || isUsed}>
                    {copied ? <Check size={18} color="#10B981" /> : <Copy size={18} color="#9CA3AF" />}
                </TouchableOpacity>
            </View>

            <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                    <Calendar size={12} color="#9CA3AF" />
                    <Text className="text-gray-500 text-[10px] ml-1">Valid until: {new Date(couponData.validUntil).toLocaleDateString()}</Text>
                </View>
                {couponData.minOrderAmount > 0 && (
                    <Text className="text-gray-400 text-[10px]">Min. order: ₹{couponData.minOrderAmount}</Text>
                )}
            </View>
        </View>
    );
}

export default function CouponsScreen() {
    const router = useRouter();
    const { data: couponsResponse, isLoading } = useQuery({
        queryKey: ['my-coupons'],
        queryFn: couponApi.getMyCoupons,
    });

    const coupons = couponsResponse?.data || couponsResponse || [];

    const [activeTab, setActiveTab] = useState('available');

    const availableCoupons = coupons.filter((c: any) => !c.isUsed && new Date(c.coupon?.validUntil || c.validUntil) >= new Date());
    const usedCoupons = coupons.filter((c: any) => c.isUsed || (new Date(c.coupon?.validUntil || c.validUntil) < new Date()));

    const displayCoupons = activeTab === 'available' ? availableCoupons : usedCoupons;

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-white" edges={['left', 'right', 'bottom']}>
                <Header />
                <View className="flex-1 p-4">
                    <View className="flex-row items-center mb-6">
                        <Skeleton width={200} height={32} borderRadius={8} />
                    </View>
                    
                    <View className="flex-row mb-6 bg-gray-50 p-1 rounded-xl">
                        <View className="flex-1 mr-2 px-4 py-3"><Skeleton height={20} borderRadius={4} /></View>
                        <View className="flex-1 ml-2 px-4 py-3"><Skeleton height={20} borderRadius={4} /></View>
                    </View>
                    
                    {[1, 2, 3, 4].map(i => <ListItemSkeleton key={i} />)}
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['left', 'right', 'bottom']}>
            <Header />
            <ScrollView showsVerticalScrollIndicator={false}>
                <View className="p-4">
                    <View className="flex-row items-center mb-6">
                        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 bg-white rounded-full shadow-sm">
                            <ChevronLeft size={20} color="#111827" />
                        </TouchableOpacity>
                        <Text className="text-xl font-bold text-gray-900">Coupons & Offers</Text>
                    </View>

                    <View className="flex-row mb-6 bg-white p-1 rounded-xl shadow-sm">
                        <TouchableOpacity
                            onPress={() => setActiveTab('available')}
                            className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'available' ? 'bg-[#FFC107]' : ''}`}
                        >
                            <Text className={`font-bold text-xs ${activeTab === 'available' ? 'text-white' : 'text-gray-500'}`}>Available ({availableCoupons.length})</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab('used')}
                            className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'used' ? 'bg-[#FFC107]' : ''}`}
                        >
                            <Text className={`font-bold text-xs ${activeTab === 'used' ? 'text-white' : 'text-gray-500'}`}>History ({usedCoupons.length})</Text>
                        </TouchableOpacity>
                    </View>

                    {displayCoupons.length === 0 ? (
                        <View className="bg-white rounded-2xl p-12 items-center shadow-sm">
                            <Ticket size={48} color="#D1D5DB" />
                            <Text className="text-gray-900 font-bold text-lg mt-4">No coupons found</Text>
                            <Text className="text-gray-500 text-center mt-2">Check back later for exciting offers and discounts!</Text>
                        </View>
                    ) : (
                        displayCoupons.map((coupon: any, index: number) => (
                            <CouponCard key={coupon.id || index} coupon={coupon} index={index} />
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
