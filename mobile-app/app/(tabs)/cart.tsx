import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingCart, Trash2, Plus, Minus, ChevronRight, ShieldCheck, Truck, ChevronLeft, ArrowRight } from 'lucide-react-native';
import Header from '@/components/Header';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeOut, Layout } from 'react-native-reanimated';
import Skeleton from '@/components/Skeleton';
import { API_BASE_URL } from '@/services/api';

const formatPrice = (price: number) =>
    `₹${Number(price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const getImageUrl = (path: string) => {
    if (!path) return '';
    return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
};

const parseJSONSafe = (data: any, fallback: any) => {
    if (!data) return fallback;
    if (typeof data === 'object') return data;
    try {
        return JSON.parse(data);
    } catch (e) {
        return fallback;
    }
};

export default function CartScreen() {
    const { cart, cartCount, isLoading, isUpdating, isRemoving, isClearing, updateQuantity, removeFromCart, clearCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();
    const [localUpdating, setLocalUpdating] = React.useState<Record<string, 'inc' | 'dec' | null>>({});

    const subtotal = cart?.totalAmount || 0;
    const originalTotal = cart?.items?.reduce((sum, item) => {
        const itemPrice = item.product?.price || item.price || 0;
        return sum + itemPrice * (item.quantity || 1);
    }, 0) || 0;
    const discount = Math.max(0, originalTotal - subtotal);
    const deliveryFee = subtotal > 500 ? 0 : 49;
    const total = subtotal + deliveryFee;

    const handleClearCart = () => {
        Alert.alert(
            'Clear Cart',
            'Are you sure you want to remove all items from your cart?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: clearCart }
            ]
        );
    };

    const onUpdateQuantity = async (productId: string, newQty: number, colorName: string | undefined, direction: 'inc' | 'dec') => {
        const key = `${productId}-${colorName || 'null'}`;
        setLocalUpdating(prev => ({ ...prev, [key]: direction }));
        try {
            await updateQuantity(productId, newQty, colorName);
        } finally {
            setLocalUpdating(prev => ({ ...prev, [key]: null }));
        }
    };

    // ── Not Authenticated ───────────────────────────────────────────────────
    if (!user) {
        return (
            <SafeAreaView className="flex-1 bg-[#FAF9F6]" edges={['bottom', 'left', 'right']}>
                <Header />
                <View className="flex-1 justify-center items-center p-8">
                    <View className="w-24 h-24 bg-gray-50 rounded-full items-center justify-center mb-6">
                        <ShoppingCart size={48} color="#D1D5DB" />
                    </View>
                    <Text className="text-2xl font-bold text-gray-900 mb-2 text-center font-heading">Please Sign In</Text>
                    <Text className="text-gray-500 text-center mb-8 font-body">You need to be signed in to view and manage your shopping cart.</Text>
                    <TouchableOpacity
                        onPress={() => router.push('/')}
                        className="bg-[#FFC107] w-full py-4 rounded-2xl items-center shadow-lg active:scale-95"
                    >
                        <Text className="text-white font-bold text-lg font-body">Sign In / Register</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => router.push('/')}
                        className="mt-4 p-4"
                    >
                        <Text className="text-gray-400 font-bold font-body">Continue Shopping</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ── Loading Skeleton ────────────────────────────────────────────────────
    if (isLoading && cart.items.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-[#FAF9F6]" edges={['bottom', 'left', 'right']}>
                <Header />
                <View className="flex-1 p-4">
                    <Skeleton height={32} width={200} borderRadius={8} style={{ marginBottom: 24 }} />
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} height={128} borderRadius={24} style={{ marginBottom: 16 }} />
                    ))}
                </View>
            </SafeAreaView>
        );
    }

    // ── Empty Cart ──────────────────────────────────────────────────────────
    if (cart.items.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-[#FAF9F6]" edges={['bottom', 'left', 'right']}>
                <Header />
                <View className="flex-1 justify-center items-center p-8">
                    <Animated.View entering={FadeInDown} className="items-center">
                        <View className="w-24 h-24 bg-yellow-50 rounded-full items-center justify-center mb-6">
                            <ShoppingCart size={48} color="#FFC107" />
                        </View>
                        <Text className="text-2xl font-bold text-gray-900 mb-2 font-heading">Your cart is empty</Text>
                        <Text className="text-gray-500 text-center mb-8 font-body">Looks like you haven't added anything to your cart yet.</Text>
                        <TouchableOpacity
                            onPress={() => router.push('/')}
                            className="bg-gray-900 px-10 py-4 rounded-2xl flex-row items-center gap-2 shadow-lg active:scale-95"
                        >
                            <Text className="text-white font-bold text-lg font-body">Start Shopping</Text>
                            <ArrowRight size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#FAF9F6]" edges={['bottom', 'left', 'right']}>
            <Header />
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <View className="p-4">
                    <View className="flex-row justify-between items-center mb-4">
                        <View className="flex-row items-center">
                            <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2 bg-white rounded-full shadow-sm">
                                <ChevronLeft size={20} color="#111827" />
                            </TouchableOpacity>
                            <Text className="text-xl font-bold text-gray-900 font-heading">Shopping Cart</Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleClearCart}
                            disabled={isClearing}
                            className="flex-row items-center gap-1.5"
                        >
                            {isClearing ? (
                                <ActivityIndicator size="small" color="#EF4444" />
                            ) : (
                                <Trash2 size={16} color="#EF4444" />
                            )}
                            <Text className="text-red-500 font-bold text-xs font-body">Clear Cart</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Cart Items */}
                    <View className="space-y-4">
                        {cart.items.map((item, index) => {
                            const key = `${item.productId}-${item.colorName || 'null'}`;
                            const updating = isUpdating[key];
                            const removing = isRemoving[key];

                            // Image logic - Matching ProductCard robust logic
                            let imageUrl = null;
                            const prod = item.product || {};

                            // 1. Color-specific image (Priority for Cart)
                            const colorsAndImages = parseJSONSafe(prod.colorsAndImages, {});
                            if (item.colorName && colorsAndImages[item.colorName]) {
                                const colorImages = colorsAndImages[item.colorName];
                                if (Array.isArray(colorImages) && colorImages.length > 0) {
                                    const img = colorImages[0];
                                    const imgUrl = typeof img === 'string' ? img : img.url;
                                    if (imgUrl) {
                                        imageUrl = imgUrl.startsWith('http') ? imgUrl : `${API_BASE_URL}${imgUrl}`;
                                    }
                                }
                            }

                            // 2. Direct product image or thumbnail
                            const prodImg = prod.image || prod.thumbnail || (prod as any).imageUrl;
                            if (!imageUrl && prodImg) {
                                imageUrl = prodImg.startsWith('http') ? prodImg : `${API_BASE_URL}${prodImg}`;
                            }

                            // 3. Item direct fields (flattened by backend)
                            if (!imageUrl && (item.image || (item as any).imageUrl)) {
                                const directPath = item.image || (item as any).imageUrl;
                                imageUrl = directPath.startsWith('http') ? directPath : `${API_BASE_URL}${directPath}`;
                            }

                            // 4. Fallback to first color images
                            if (!imageUrl) {
                                const colorNames = Object.keys(colorsAndImages);
                                if (colorNames.length > 0) {
                                    const firstColorImages = colorsAndImages[colorNames[0]];
                                    if (Array.isArray(firstColorImages) && firstColorImages.length > 0) {
                                        const img = firstColorImages[0];
                                        const imgUrl = typeof img === 'string' ? img : img.url;
                                        if (imgUrl) {
                                            imageUrl = imgUrl.startsWith('http') ? imgUrl : `${API_BASE_URL}${imgUrl}`;
                                        }
                                    }
                                }
                            }

                            // 5. Fallback to product images array
                            if (!imageUrl && Array.isArray(prod.images) && prod.images.length > 0) {
                                const firstImg = prod.images[0];
                                const imgUrl = typeof firstImg === 'string' ? firstImg : (firstImg.url || firstImg.publicId);
                                if (imgUrl) {
                                    imageUrl = imgUrl.startsWith('http') ? imgUrl : `${API_BASE_URL}${imgUrl}`;
                                }
                            }

                            const price = item.product?.discountPrice || item.product?.price || item.price || 0;
                            const original = item.product?.price || item.price || 0;

                            return (
                                <Animated.View
                                    key={key}
                                    entering={FadeInDown.delay(index * 100)}
                                    layout={Layout.springify()}
                                    className={`bg-white rounded-3xl p-4 flex-row gap-4 border border-gray-100 shadow-sm ${removing ? 'opacity-50' : ''}`}
                                >
                                    {/* Product Image */}
                                    <Pressable
                                        onPress={() => router.push(`/product/${item.product?.slug || item.productId}`)}
                                        className="w-24 h-24 bg-white border-2 border-gray-100 rounded-2xl items-center justify-center p-2 border border-gray-50"
                                    >
                                        <Image
                                            source={{ uri: imageUrl || 'https://via.placeholder.com/150' }}
                                            style={{ width: '100%', height: '100%' }}
                                            contentFit="contain"
                                        />
                                    </Pressable>

                                    {/* Details */}
                                    <View className="flex-1 justify-between">
                                        <View>
                                            <TouchableOpacity onPress={() => router.push(`/product/${item.product?.slug || item.productId}`)}>
                                                <Text className="text-gray-900 font-bold text-sm leading-tight pr-4 font-body" numberOfLines={2}>
                                                    {item.product?.name || item.name || `Product ${item.productId}`}
                                                </Text>
                                            </TouchableOpacity>
                                            {item.colorName && (
                                                <Text className="text-gray-400 text-xs font-bold mt-1 uppercase tracking-tighter font-body">Color: <Text className="text-gray-600 font-body">{item.colorName}</Text></Text>
                                            )}
                                        </View>

                                        <View className="flex-row items-center justify-between mt-2">
                                            <View className="flex-row items-baseline gap-1.5">
                                                <Text className="text-gray-900 font-black text-base font-body">{formatPrice(price)}</Text>
                                                {original > price && (
                                                    <Text className="text-gray-400 text-[10px] line-through font-bold font-body">{formatPrice(original)}</Text>
                                                )}
                                            </View>

                                            {/* Quantity Controls */}
                                            <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-100">
                                                <TouchableOpacity
                                                    onPress={() => onUpdateQuantity(item.productId, item.quantity - 1, item.colorName, 'dec')}
                                                    disabled={updating || removing || item.quantity <= 1}
                                                    className="p-2 w-8 h-8 items-center justify-center"
                                                >
                                                    {localUpdating[key] === 'dec' ? <ActivityIndicator size={14} color="#111827" /> : <Minus size={14} color="#111827" strokeWidth={3} />}
                                                </TouchableOpacity>
                                                <View className="px-1 min-w-[20px] items-center">
                                                    <Text className="text-gray-900 font-black text-xs font-body">{item.quantity}</Text>
                                                </View>
                                                <TouchableOpacity
                                                    onPress={() => onUpdateQuantity(item.productId, item.quantity + 1, item.colorName, 'inc')}
                                                    disabled={updating || removing}
                                                    className="p-2 w-8 h-8 items-center justify-center"
                                                >
                                                    {localUpdating[key] === 'inc' ? <ActivityIndicator size={14} color="#111827" /> : <Plus size={14} color="#111827" strokeWidth={3} />}
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                    {/* Remove absolute */}
                                    <TouchableOpacity
                                        onPress={() => removeFromCart(item.productId, item.colorName)}
                                        disabled={removing}
                                        className="absolute top-4 right-4 p-1"
                                    >
                                        {removing ? <ActivityIndicator size={16} color="#EF4444" /> : <Trash2 size={16} color="#EF4444" />}
                                    </TouchableOpacity>

                                </Animated.View>
                            );
                        })}
                    </View>

                    {/* Delivery Promo */}
                    <View className="mt-8 bg-blue-50 rounded-3xl p-4 flex-row items-center gap-4 border border-blue-100">
                        <View className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm">
                            <Truck size={20} color="#3B82F6" />
                        </View>
                        <View className="flex-1">
                            {subtotal > 500 ? (
                                <Text className="text-blue-700 font-bold text-sm font-body">You unlocked <Text className="text-blue-900 underline font-body">Free Delivery!</Text></Text>
                            ) : (
                                <Text className="text-blue-700 text-xs font-medium font-body">Add <Text className="text-blue-900 font-bold font-body">{formatPrice(501 - subtotal)}</Text> more for <Text className="text-blue-900 font-bold font-body">Free Delivery</Text></Text>
                            )}
                        </View>
                    </View>

                    {/* Order Summary */}
                    <View className="mt-6 bg-white rounded-3xl p-5 shadow-sm border border-gray-200">
                        <Text className="text-lg font-bold text-gray-900 mb-5 font-heading">Order Summary</Text>

                        <View className="flex-col gap-4">
                            <View className="flex-row justify-between items-center">
                                <Text className="text-gray-500 font-medium font-body">Subtotal ({cartCount} items)</Text>
                                <Text className="text-gray-900 font-semibold font-body text-base">{formatPrice(subtotal)}</Text>
                            </View>

                            {discount > 0 && (
                                <View className="flex-row justify-between items-center">
                                    <View className="flex-row items-center gap-2">
                                        <Text className="text-gray-500 font-medium font-body">Product Discount</Text>
                                        <View className="bg-emerald-100 px-2 py-0.5 rounded-full">
                                            <Text className="text-emerald-700 text-[10px] font-bold uppercase tracking-wider font-body">Savings</Text>
                                        </View>
                                    </View>
                                    <Text className="text-emerald-600 font-semibold font-body text-base">-{formatPrice(discount)}</Text>
                                </View>
                            )}

                            <View className="flex-row justify-between items-center">
                                <Text className="text-gray-500 font-medium font-body">Delivery Fee</Text>
                                <Text className={`font-semibold font-body text-base ${deliveryFee === 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                                    {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                                </Text>
                            </View>
                        </View>

                        {/* Divider */}
                        <View className="my-5 border-t border-dashed border-gray-300" />

                        {/* Total */}
                        <View className="flex-row justify-between items-end">
                            <View>
                                <Text className="text-xl font-bold text-gray-900 font-heading">Total Amount</Text>
                                <Text className="text-gray-400 text-xs font-medium mt-1 font-body">Inclusive of all taxes</Text>
                            </View>
                            <Text className="text-2xl font-black text-gray-900 font-body">{formatPrice(total)}</Text>
                        </View>

                        {discount > 0 && (
                            <View className="mt-5 bg-emerald-50 rounded-xl p-3 border border-emerald-100/50 flex-row items-center justify-center gap-2">
                                <Text className="text-emerald-600 font-bold font-body">🎉 You are saving {formatPrice(discount)}!</Text>
                            </View>
                        )}

                        <View className="mt-5 flex-row items-center justify-center gap-1.5">
                            <ShieldCheck size={14} color="#9CA3AF" />
                            <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest font-body">Safe & Secure Payments</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Sticky Checkout Button */}
            <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-2xl">
                <TouchableOpacity
                    onPress={() => router.push('/checkout')}
                    className="bg-gray-900 py-4 rounded-2xl flex-row items-center justify-center gap-3 active:scale-95"
                >
                    <Text className="text-white font-black text-lg font-body">Proceed to Checkout</Text>
                    <ChevronRight size={20} color="#FFFFFF" strokeWidth={3} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}