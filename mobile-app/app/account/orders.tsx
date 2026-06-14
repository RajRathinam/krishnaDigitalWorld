import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, ChevronRight, Calendar, Clock, Check, Truck, X, ChevronLeft } from 'lucide-react-native';
import Header from '@/components/Header';
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '@/services/api';
import { useRouter } from 'expo-router';
import { ListItemSkeleton } from '@/components/SkeletonLoader';
import Skeleton from '@/components/Skeleton';

const STATUS_CONFIG: any = {
    delivered: { label: 'Delivered', color: '#10B981', bg: '#ECFDF5', icon: Check },
    shipped: { label: 'Shipped', color: '#3B82F6', bg: '#EFF6FF', icon: Truck },
    confirmed: { label: 'Confirmed', color: '#6366F1', bg: '#EEF2FF', icon: Check },
    processing: { label: 'Processing', color: '#F59E0B', bg: '#FFFBEB', icon: Clock },
    pending: { label: 'Pending', color: '#F97316', bg: '#FFF7ED', icon: Clock },
    cancelled: { label: 'Cancelled', color: '#EF4444', bg: '#FEF2F2', icon: X },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    return (
        <View style={{ backgroundColor: cfg.bg }} className="flex-row items-center px-3 py-1 rounded-full border border-gray-100">
            <Icon size={12} color={cfg.color} />
            <Text style={{ color: cfg.color }} className="text-[10px] font-bold ml-1 uppercase">{cfg.label}</Text>
        </View>
    );
}

export default function OrdersScreen() {
    const router = useRouter();
    const { data: ordersResponse, isLoading } = useQuery({
        queryKey: ['orders'],
        queryFn: orderApi.getOrders,
    });

    const orders = ordersResponse?.data?.orders || ordersResponse?.data || ordersResponse || [];

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-white" edges={['left', 'right']}>
                <Header />
                <View className="flex-1 p-4">
                    <View className="flex-row items-center mb-6">
                        <Skeleton width={150} height={32} borderRadius={8} />
                    </View>
                    {[1, 2, 3, 4, 5].map(i => <ListItemSkeleton key={i} />)}
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['left', 'right']}>
            <Header />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <View className="p-4">
                    <View className="flex-row items-center mb-4">
                        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2 bg-white rounded-full shadow-sm">
                            <ChevronLeft size={20} color="#111827" />
                        </TouchableOpacity>
                        <Text className="text-xl font-bold text-gray-900">My Orders</Text>
                    </View>
                    {orders.length === 0 ? (
                        <View className="bg-white rounded-2xl p-8 items-center shadow-sm">
                            <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                                <Package size={32} color="#D1D5DB" />
                            </View>
                            <Text className="text-gray-900 font-bold text-lg mb-2">No orders yet</Text>
                            <Text className="text-gray-500 text-center mb-6">You haven't placed any orders yet. Start shopping to see your orders here!</Text>
                            <TouchableOpacity
                                className="bg-[#FFC107] px-6 py-3 rounded-xl"
                                onPress={() => router.push('/')}
                            >
                                <Text className="text-white font-bold">Start Shopping</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        orders.map((order: any, index: number) => (
                            <TouchableOpacity
                                key={order.id || index}
                                className="bg-white rounded-2xl p-4 shadow-sm mb-4 border border-gray-100"
                                onPress={() => router.push(`/account/orders/${order.orderNumber}`)}
                            >
                                <View className="flex-row justify-between items-center mb-3">
                                    <View>
                                        <Text className="text-gray-900 font-bold">Order <Text className='text-sm'>#{order.orderNumber || order.id?.toString().slice(-6).toUpperCase()}</Text></Text>
                                        <View className="flex-row items-center mt-1">
                                            <Calendar size={12} color="#9CA3AF" />
                                            <Text className="text-gray-500 text-xs ml-1">{new Date(order.created_at || order.createdAt).toLocaleDateString()}</Text>
                                        </View>
                                    </View>
                                    <StatusBadge status={order.orderStatus} />
                                </View>

                                <View className="h-px bg-gray-50 mb-3" />

                                <View className="flex-row items-center">
                                    <View className="w-12 h-12 bg-gray-50 rounded-lg border border-gray-100 items-center justify-center overflow-hidden">
                                        <Package size={24} color="#E5E7EB" />
                                    </View>
                                    <View className="ml-3 flex-1">
                                        <Text className="text-gray-900 text-sm font-medium" numberOfLines={1}>
                                            {order.orderItems?.length || 0} Items
                                        </Text>
                                        <Text className="text-[#FFC107] font-bold mt-0.5">₹{order.finalAmount || order.totalPrice}</Text>
                                    </View>
                                    <ChevronRight size={18} color="#D1D5DB" />
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
