import React, { useState, useEffect, useRef, memo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, ShoppingCart, Trash2, ChevronLeft } from 'lucide-react-native';
import Header from '@/components/Header';
import { useRouter, useNavigation } from 'expo-router';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { ProductCardSkeleton } from '@/components/SkeletonLoader';
import Skeleton from '@/components/Skeleton';
import { API_BASE_URL } from '@/services/api';

// Isolated and memoized WishlistItem to prevent CSS Interop / Navigation Context loss issues
const WishlistItem = memo(({ 
    item, 
    onRemove, 
    onMoveToCart, 
    isDeleting, 
    isMoving 
}: { 
    item: any; 
    onRemove: (id: string) => void; 
    onMoveToCart: (item: any) => void; 
    isDeleting: boolean; 
    isMoving: boolean;
}) => {
    const imageUrl = item.image?.startsWith('http') 
        ? item.image 
        : (item.image ? `${API_BASE_URL}${item.image}` : 'https://via.placeholder.com/150');

    return (
        <View className="w-[48%] bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <View className="relative">
                <Image 
                    source={{ uri: imageUrl }} 
                    className="w-full h-40 bg-white"
                    resizeMode="contain"
                />
                <TouchableOpacity 
                    className="absolute top-2 right-2 bg-white/80 p-2 rounded-full shadow-sm"
                    onPress={() => onRemove(item.id)}
                    disabled={isDeleting}
                >
                    {isDeleting ? (
                        <ActivityIndicator size={12} color="#EF4444" />
                    ) : (
                        <Trash2 size={14} color="#EF4444" />
                    )}
                </TouchableOpacity>
            </View>
            
            <View className="p-3">
                <Text className="text-gray-900 font-medium text-xs mb-1" numberOfLines={2}>{item.name}</Text>
                <Text className="text-[#FFC107] font-bold text-sm">₹{item.price.toLocaleString('en-IN')}</Text>
                
                <TouchableOpacity 
                    className={`mt-3 bg-gray-900 py-2.5 rounded-lg items-center flex-row justify-center ${isMoving ? 'opacity-70' : ''}`}
                    onPress={() => onMoveToCart(item)}
                    disabled={isMoving}
                >
                    {isMoving ? (
                        <ActivityIndicator size={12} color="#FFFFFF" />
                    ) : (
                        <ShoppingCart size={12} color="#FFFFFF" />
                    )}
                    <Text className="text-white text-[10px] font-bold ml-1.5">
                        {isMoving ? 'Moving...' : 'Move to Cart'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

// Isolated Empty State to prevent context issues during transitions
const EmptyWishlist = memo(({ onExplore }: { onExplore: () => void }) => (
    <View className="bg-white rounded-2xl p-8 items-center shadow-sm">
        <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-4">
            <Heart size={32} color="#EF4444" fill="#FEF2F2" />
        </View>
        <Text className="text-gray-900 font-bold text-lg mb-2">Your wishlist is empty</Text>
        <Text className="text-gray-500 text-center mb-6">Save items you like to see them here later!</Text>
        <TouchableOpacity 
            className="bg-[#FFC107] px-6 py-3 rounded-xl"
            onPress={onExplore}
        >
            <Text className="text-white font-bold">Explore Shop</Text>
        </TouchableOpacity>
    </View>
));

export default function WishlistScreen() {
    const navigation = useNavigation();
    const router = useRouter(); // Keeping for /shop navigation
    const { addToCart } = useCart();
    const { wishlist, removeFromWishlist, isLoading: loading } = useWishlist();
    const [isMoving, setIsMoving] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const handleRemoveFromWishlist = async (id: string) => {
        setIsDeleting(id);
        try {
            await removeFromWishlist(id);
        } catch (error) {
            if (isMounted.current) {
                Alert.alert('Error', 'Failed to remove from wishlist');
            }
        } finally {
            if (isMounted.current) {
                setIsDeleting(null);
            }
        }
    };

    const handleMoveToCart = async (item: any) => {
        setIsMoving(item.id);
        try {
            const success = await addToCart(item.id, 1, item.colorName, item.image);
            if (success) {
                await removeFromWishlist(item.id);
                // Alert removed to avoid interfering with context/re-renders
            }
        } catch (error: any) {
            if (isMounted.current) {
                Alert.alert('Error', error?.message || 'Failed to move to cart');
            }
        } finally {
            if (isMounted.current) {
                setIsMoving(null);
            }
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white" edges={['left', 'right', 'bottom']}>
                <Header />
                <View className="flex-1 p-4">
                    <View className="flex-row items-center mb-6">
                        <Skeleton width={180} height={32} borderRadius={8} />
                    </View>
                    <View className="flex-row flex-wrap justify-between">
                        {[1, 2, 3, 4, 5, 6].map(i => <ProductCardSkeleton key={i} />)}
                    </View>
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
                        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 p-2 bg-white rounded-full shadow-sm">
                            <ChevronLeft size={20} color="#111827" />
                        </TouchableOpacity>
                        <Text className="text-xl font-bold text-gray-900">My Wishlist</Text>
                        <View className="ml-2 bg-red-50 px-2 py-0.5 rounded-full">
                            <Text className="text-red-500 text-[10px] font-bold">{wishlist.length}</Text>
                        </View>
                    </View>

                    {wishlist.length === 0 ? (
                        <EmptyWishlist onExplore={() => router.push('/shop')} />
                    ) : (
                        <View className="flex-row flex-wrap justify-between gap-y-4">
                            {wishlist.map((item) => (
                                <WishlistItem 
                                    key={item.id}
                                    item={item}
                                    onRemove={handleRemoveFromWishlist}
                                    onMoveToCart={handleMoveToCart}
                                    isDeleting={isDeleting === item.id}
                                    isMoving={isMoving === item.id}
                                />
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
