import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
    Linking,
    Dimensions,
    Image,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import {
    MapPin,
    Truck,
    CreditCard,
    Plus,
    ChevronLeft,
    Check,
    Lock,
    PartyPopper,
    Package,
    ArrowRight,
    AlertCircle,
    User as UserIcon,
    Briefcase,
    Tag,
    X,
} from 'lucide-react-native';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { authApi, orderApi, couponApi, paymentApi, API_BASE_URL } from '@/services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Skeleton from '@/components/Skeleton';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInRight,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    Easing,
    withDelay,
    withSpring,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// ─── Constants ──────────────────────────────────────────────────────────────
const ALLOWED_PINCODES = [
    "611001", "611003", "611002", "611111", "611108", "611104", "611105", "611106", 
    "611110", "614806", "614810", "614807", "614808", "614809", "614404", "610001", 
    "609701", "609702", "609307", "609309", "609313", "609001", "609801", "609117", "609110"
];

const STEPS = [
    { id: 'address', label: 'Address', icon: MapPin },
    { id: 'delivery', label: 'Delivery', icon: Truck },
    { id: 'payment', label: 'Payment', icon: CreditCard },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatPrice = (price: number) =>
    `₹${Number(price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const parseJSONSafe = (data: any, fallback: any) => {
    if (!data) return fallback;
    if (typeof data === 'object') return data;
    try {
        return JSON.parse(data);
    } catch (e) {
        return fallback;
    }
};

const getAddressTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
        case 'home': return <UserIcon size={14} color="#FFC107" />;
        case 'work': return <Briefcase size={14} color="#FFC107" />;
        default: return <MapPin size={14} color="#FFC107" />;
    }
};

const isProfileComplete = (userData: any) => {
    if (!userData) return false;
    if (!userData.name?.trim()) return false;
    if (!userData.phone?.trim()) return false;
    const parsed = parseJSONSafe(userData.address, null);
    if (!parsed) return false;
    if (!parsed.street?.trim() || !parsed.city?.trim() || !parsed.pincode?.trim()) return false;
    return true;
};

// ─── Orbit Ring Animation for Success ─────────────────────────────────────────
const OrbitRing = ({ radius, speed, delay, dotColor, reverse = false }: any) => {
    const rotation = useSharedValue(0);
    const scale = useSharedValue(0.2);
    const opacity = useSharedValue(0);

    useEffect(() => {
        rotation.value = withDelay(delay, withRepeat(withTiming(reverse ? -360 : 360, { duration: speed, easing: Easing.linear }), -1));
        scale.value = withDelay(delay, withSpring(1));
        opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    }, []);

    const ringStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    const dotStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    return (
        <Animated.View
            style={[
                styles.orbitRing,
                { width: radius * 2, height: radius * 2, borderColor: `${dotColor}22` },
                ringStyle,
            ]}
        >
            <Animated.View style={[{ width: '100%', height: '100%', position: 'relative' }, dotStyle]}>
                <View style={[styles.orbitDot, { backgroundColor: dotColor, shadowColor: dotColor }]} />
            </Animated.View>
        </Animated.View>
    );
};

// ─── Confetti Streaming Animation ────────────────────────────────────────────
const Streamer = ({ delay, x }: any) => {
    const yVal = useSharedValue(-20);
    const rotation = useSharedValue(0);

    useEffect(() => {
        yVal.value = withDelay(delay, withRepeat(withTiming(500, { duration: 2500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }), -1));
        rotation.value = withDelay(delay, withRepeat(withTiming(360, { duration: 3000, easing: Easing.linear }), -1));
    }, []);

    const style = useAnimatedStyle(() => ({
        top: yVal.value,
        transform: [{ rotate: `${rotation.value}deg` }],
        opacity: yVal.value > 450 ? 0 : 1,
    }));

    const colors = ['#FFC107', '#4ADE80', '#60A5FA', '#F87171', '#C084FC'];
    const randomColor = colors[Math.floor((x * 7) % colors.length)];

    return (
        <Animated.View
            style={[
                styles.streamer,
                { left: `${x}%`, backgroundColor: randomColor },
                style,
            ]}
        />
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CheckoutScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { cart, clearCart } = useCart();
    const { user } = useAuth();

    const [currentStep, setCurrentStep] = useState<'address' | 'delivery' | 'payment'>('address');
    const [selectedAddress, setSelectedAddress] = useState<string>('');
    const [deliveryOption, setDeliveryOption] = useState<'standard' | 'express'>('standard');
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'phonepe'>('cod');

    // Coupon states
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [applyingCoupon, setApplyingCoupon] = useState(false);

    // Checkout processing states
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [placedOrderData, setPlacedOrderData] = useState<any>(null);

    // Fetch user details to verify profile & addresses
    const { data: userResponse, isLoading: profileLoading } = useQuery({
        queryKey: ['me'],
        queryFn: authApi.getMe,
        enabled: !!user,
    });

    const userData = userResponse?.data || userResponse?.user;

    // derived addresses mapping
    const savedAddressesList: any[] = [];
    if (userData?.address) {
        const parsed = parseJSONSafe(userData.address, {});
        savedAddressesList.push({
            id: 'primary',
            name: userData.name || '',
            phone: userData.phone || '',
            street: parsed.street || '',
            city: parsed.city || '',
            state: parsed.state || '',
            pincode: parsed.pincode || '',
            isDefault: true,
            type: 'primary',
        });
    }

    const additionalAddresses = userData?.additionalAddresses || [];
    const parsedAdditional = typeof additionalAddresses === 'string' ? parseJSONSafe(additionalAddresses, []) : additionalAddresses;
    if (Array.isArray(parsedAdditional)) {
        parsedAdditional.forEach((addr: any) => {
            savedAddressesList.push({
                id: addr.id || String(Math.random()),
                name: addr.name || userData?.name || '',
                phone: addr.phone || userData?.phone || '',
                street: addr.street || '',
                city: addr.city || '',
                state: addr.state || '',
                pincode: addr.pincode || '',
                isDefault: addr.isDefault || false,
                type: addr.type || 'home',
            });
        });
    }

    // Set initial selected address
    useEffect(() => {
        if (savedAddressesList.length > 0 && !selectedAddress) {
            const def = savedAddressesList.find(a => a.isDefault);
            setSelectedAddress(def?.id || savedAddressesList[0].id);
        }
    }, [savedAddressesList]);

    // calculations
    const subtotal = cart?.totalAmount || 0;
    const deliveryFee = deliveryOption === 'express' ? 99 : (subtotal > 500 ? 0 : 49);
    const total = Math.max(0, subtotal - couponDiscount + deliveryFee);

    // Profile complete check
    const profileComplete = isProfileComplete(userData);

    const selectedAddressData = savedAddressesList.find(a => a.id === selectedAddress);

    // Pincode validation
    const isPincodeServiceable = selectedAddressData
        ? ALLOWED_PINCODES.includes(String(selectedAddressData.pincode).trim())
        : false;

    // ── Coupon Validation ────────────────────────────────────────────────────
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            Alert.alert('Error', 'Please enter a coupon code.');
            return;
        }
        setApplyingCoupon(true);
        try {
            const res = await couponApi.validateCoupon(couponCode.trim(), subtotal);
            if (res.success) {
                setAppliedCoupon(res.data?.coupon || { code: couponCode.trim() });
                setCouponDiscount(Number(res.data?.discount) || 0);
                Alert.alert('Coupon Applied!', res.message || 'Discount applied successfully.');
            } else {
                Alert.alert('Invalid Coupon', res.message || 'Coupon not valid.');
                setAppliedCoupon(null);
                setCouponDiscount(0);
            }
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to apply coupon.');
            setAppliedCoupon(null);
            setCouponDiscount(0);
        } finally {
            setApplyingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponCode('');
        Alert.alert('Success', 'Coupon removed successfully.');
    };

    // ── Order Placement ──────────────────────────────────────────────────────
    const handlePlaceOrder = async () => {
        if (!selectedAddressData) {
            Alert.alert('Error', 'Please select a delivery address.');
            return;
        }

        if (!isPincodeServiceable) {
            Alert.alert('Service Unavailable', 'We do not deliver to this pincode yet.');
            return;
        }

        setIsPlacingOrder(true);
        try {
            const shippingAddress = {
                name: selectedAddressData.name,
                phone: selectedAddressData.phone,
                street: selectedAddressData.street,
                city: selectedAddressData.city,
                state: selectedAddressData.state,
                zipCode: selectedAddressData.pincode,
                country: 'India',
            };

            const orderItems = cart.items.map((item: any) => ({
                productId: Number(item.productId),
                name: item.productName || item.product?.name || 'Product',
                quantity: parseInt(item.quantity) || 1,
                price: parseFloat(item.product?.discountPrice || item.product?.price || item.price) || 0,
                colorName: item.colorName || null,
                total: parseFloat(item.totalPrice) || 0,
            }));

            const notes = `Delivery: ${deliveryOption === 'express' ? 'Express (₹99)' : 'Standard (Free)'}${
                appliedCoupon ? ` • Coupon: ${appliedCoupon.code} (${formatPrice(couponDiscount)} off)` : ''
            }`;

            if (paymentMethod === 'cod') {
                const res = await orderApi.createOrder({
                    shippingAddress,
                    orderItems,
                    paymentMethod: 'cod',
                    notes,
                    billingAddress: shippingAddress,
                    deliveryType: deliveryOption,
                    couponCode: appliedCoupon?.code,
                    couponDiscount,
                });

                if (res.success) {
                    setPlacedOrderData(res.data || res.order);
                    setOrderPlaced(true);
                    queryClient.invalidateQueries({ queryKey: ['me'] });
                    await clearCart();
                } else {
                    Alert.alert('Order Failed', res.message || 'Failed to place order.');
                }
            } else {
                // PhonePe Payment Redirect flow
                const res = await paymentApi.initiatePhonePe({
                    shippingAddress,
                    billingAddress: shippingAddress,
                    deliveryType: deliveryOption,
                    notes,
                    couponCode: appliedCoupon?.code,
                    couponDiscount,
                });

                if (res.success) {
                    const { redirectUrl } = res.data || {};
                    if (redirectUrl) {
                        Alert.alert(
                            'Redirecting to PhonePe',
                            'You will be redirected to the secure PhonePe gateway to complete your payment.',
                            [
                                {
                                    text: 'Cancel',
                                    style: 'cancel',
                                },
                                {
                                    text: 'Pay Now',
                                    onPress: () => {
                                        Linking.openURL(redirectUrl).catch(() => {
                                            Alert.alert('Error', 'Failed to open payment gateway.');
                                        });
                                        // Empty cart & redirect back to account orders
                                        clearCart();
                                        router.replace('/account/orders');
                                    }
                                }
                            ]
                        );
                    } else {
                        Alert.alert('Error', 'Failed to generate online payment redirect URL.');
                    }
                } else {
                    Alert.alert('Payment Failed', res.message || 'Payment initiation failed.');
                }
            }
        } catch (err: any) {
            Alert.alert('Order Error', err?.response?.data?.message || 'Failed to place order.');
        } finally {
            setIsPlacingOrder(false);
        }
    };

    // ── Loader / Empty guards ────────────────────────────────────────────────
    if (profileLoading) {
        return (
            <SafeAreaView className="flex-1 bg-[#FAF9F6]" edges={['left', 'right']}>
                <Header />
                <View className="flex-1 justify-center items-center p-8">
                    <ActivityIndicator size="large" color="#FFC107" />
                    <Text className="text-gray-500 mt-4 font-semibold text-sm font-body">Preparing checkout flow...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Profile Gate
    if (!profileComplete) {
        return (
            <SafeAreaView className="flex-1 bg-[#FAF9F6]" edges={['left', 'right']}>
                <Header />
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
                    <Animated.View entering={FadeInDown} className="bg-white border border-gray-100 rounded-3xl p-6 items-center shadow-sm">
                        <View className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                            <AlertCircle size={32} color="#F59E0B" />
                        </View>
                        <Text className="text-xl font-bold text-gray-900 mb-2 font-heading">Profile Incomplete</Text>
                        <Text className="text-sm text-gray-500 text-center leading-relaxed mb-6 font-body">
                            To place an order we need your <Text className="font-bold">full name</Text>, <Text className="font-bold">phone number</Text>, and a <Text className="font-bold">primary address</Text> saved in your profile.
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push('/account/profile')}
                            className="bg-[#FFC107] w-full py-4 rounded-2xl items-center shadow-md active:scale-95"
                        >
                            <Text className="text-white font-bold text-base font-body">Complete Profile Now</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="mt-4 py-2"
                        >
                            <Text className="text-gray-400 font-bold text-sm font-body">← Back to Cart</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // ── Success Celebration Screen ───────────────────────────────────────────
    if (orderPlaced && placedOrderData) {
        const orderNumber = placedOrderData.orderNumber || placedOrderData.id;
        const streamers = Array.from({ length: 20 }, (_, i) => ({
            id: i, delay: (i * 80), x: 4 + (i * 4.8)
        }));

        return (
            <SafeAreaView className="flex-1 bg-[#FAF9F6]" edges={['left', 'right']}>
                <Stack.Screen options={{ headerShown: false }} />
                <View className="flex-1 items-center justify-center p-6 relative overflow-hidden">
                    {/* Radial glow background */}
                    <View className="absolute inset-0" style={{
                        backgroundColor: '#FAF9F6',
                    }} />
                    <View className="absolute" style={{
                        width: 400, height: 400, borderRadius: 200,
                        backgroundColor: 'rgba(255, 193, 7, 0.06)',
                        top: '25%', left: '50%', transform: [{ translateX: -200 }, { translateY: -200 }],
                    }} />
                    <View className="absolute" style={{
                        width: 280, height: 280, borderRadius: 140,
                        backgroundColor: 'rgba(16, 185, 129, 0.04)',
                        top: '25%', left: '50%', transform: [{ translateX: -140 }, { translateY: -140 }],
                    }} />

                    {/* Confetti streamers */}
                    {streamers.map(s => <Streamer key={s.id} delay={s.delay} x={s.x} />)}

                    {/* Orbit Ring Animations */}
                    <OrbitRing radius={72} speed={8000} delay={250} dotColor="#FFC107" />
                    <OrbitRing radius={100} speed={14000} delay={450} dotColor="#4ADE80" reverse />
                    <OrbitRing radius={128} speed={20000} delay={650} dotColor="#60A5FA" />

                    {/* Main Icon with double ring glow */}
                    <Animated.View entering={FadeIn.delay(150)} className="z-10 mb-6" style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{
                            width: 96, height: 96, borderRadius: 48,
                            backgroundColor: 'rgba(16, 185, 129, 0.08)',
                            alignItems: 'center', justifyContent: 'center',
                            borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.12)',
                            shadowColor: '#10B981', shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.15, shadowRadius: 20, elevation: 6,
                        }}>
                            <View style={{
                                width: 72, height: 72, borderRadius: 36,
                                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <PartyPopper size={40} color="#10B981" />
                            </View>
                        </View>
                    </Animated.View>

                    {/* Confirmed badge */}
                    <Animated.View entering={FadeInDown.delay(400)} className="z-10 flex-row items-center gap-1.5 mb-2">
                        <Check size={12} color="#10B981" strokeWidth={3} />
                        <Text className="text-emerald-600 font-black text-[11px] uppercase tracking-[3px] font-body">Order Confirmed</Text>
                        <Check size={12} color="#10B981" strokeWidth={3} />
                    </Animated.View>

                    {/* Main heading */}
                    <Animated.View entering={FadeInDown.delay(500)} className="z-10 mb-1">
                        <Text className="text-2xl font-black text-gray-900 text-center font-heading">
                            Order Placed{' '}
                            <Text className="text-[#FFC107]">Successfully!</Text>
                        </Text>
                    </Animated.View>

                    {/* Subtitle */}
                    <Animated.Text entering={FadeInDown.delay(600)} className="z-10 text-gray-400 text-center text-sm px-8 mb-6 leading-relaxed font-body" style={{ maxWidth: 280 }}>
                        Thank you! You'll receive a confirmation SMS or Phone Call shortly.
                    </Animated.Text>

                    {/* Order ID pill */}
                    {orderNumber && (
                        <Animated.View entering={FadeInDown.delay(750)} className="z-10 flex-row items-center gap-2 rounded-full px-5 py-2.5 mb-8" style={{
                            backgroundColor: 'rgba(255, 193, 7, 0.08)',
                            borderWidth: 1, borderColor: 'rgba(255, 193, 7, 0.2)',
                        }}>
                            <Package size={14} color="#D97706" />
                            <Text className="text-[11px] text-gray-500 font-medium font-body">Order ID:</Text>
                            <Text className="text-[11px] text-amber-700 font-black font-mono font-body tracking-wider">{orderNumber}</Text>
                        </Animated.View>
                    )}

                    {/* CTA Buttons */}
                    <Animated.View entering={FadeInDown.delay(900)} className="z-10 w-full flex-col gap-3" style={{ maxWidth: 300 }}>
                        <TouchableOpacity
                            onPress={() => router.replace('/account/orders')}
                            className="bg-gray-900 py-4 rounded-2xl items-center flex-row justify-center gap-2 shadow-lg active:scale-95"
                            style={{
                                shadowColor: '#111827', shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
                            }}
                        >
                            <Text className="text-white font-bold text-base font-body">View Order Details</Text>
                            <ArrowRight size={18} color="#FFFFFF" strokeWidth={3} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.replace('/')}
                            className="border-2 border-gray-200 py-4 rounded-2xl items-center active:scale-95"
                        >
                            <Text className="text-gray-600 font-bold text-base font-body">Continue Shopping</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#FAF9F6]" edges={['left', 'right']}>
            <Stack.Screen options={{ headerShown: false }} />
            <Header />

            {/* Stepper Header */}
            <View className="bg-white border-b border-gray-100 p-4">
                <View className="flex-row items-center mb-4">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2 bg-gray-50 rounded-full">
                        <ChevronLeft size={20} color="#111827" />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-gray-900 font-heading">Checkout</Text>
                </View>

                {/* Step indicator */}
                <View className="flex-row justify-center items-center py-2">
                    {STEPS.map((step, idx) => {
                        const isCurrent = currentStep === step.id;
                        const isDone = STEPS.findIndex(s => s.id === currentStep) > idx;
                        const Icon = step.icon;

                        return (
                            <React.Fragment key={step.id}>
                                <TouchableOpacity
                                    disabled={!isDone}
                                    onPress={() => setCurrentStep(step.id as any)}
                                    className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full ${
                                        isCurrent ? 'bg-amber-50 border border-amber-200' : (isDone ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-transparent')
                                    }`}
                                >
                                    {isDone ? (
                                        <Check size={14} color="#10B981" strokeWidth={3} />
                                    ) : (
                                        <Icon size={14} color={isCurrent ? '#D97706' : '#9CA3AF'} />
                                    )}
                                    <Text className={`text-xs font-bold font-body ${isCurrent ? 'text-yellow-700' : (isDone ? 'text-green-600' : 'text-gray-400')}`}>
                                        {step.label}
                                    </Text>
                                </TouchableOpacity>
                                {idx < STEPS.length - 1 && (
                                    <View className={`w-8 h-0.5 mx-1 ${isDone ? 'bg-green-300' : 'bg-gray-200'}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                {/* ── STEP 1: ADDRESS SELECTION ──────────────────────────────────────── */}
                {currentStep === 'address' && (
                    <Animated.View entering={FadeInRight} className="p-4 flex-col gap-4">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-gray-500 font-black text-[10px] uppercase tracking-widest font-body">Select Shipping Address</Text>
                            <TouchableOpacity onPress={() => router.push('/account/addresses')}>
                                <Text className="text-[#FFC107] font-bold text-xs underline font-body">Manage Addresses</Text>
                            </TouchableOpacity>
                        </View>

                        {savedAddressesList.map((addr) => {
                            const isSelected = selectedAddress === addr.id;
                            const serviceable = ALLOWED_PINCODES.includes(String(addr.pincode).trim());

                            return (
                                <TouchableOpacity
                                    key={addr.id}
                                    onPress={() => setSelectedAddress(addr.id)}
                                    className={`bg-white rounded-3xl p-5 border-2 ${
                                        isSelected ? 'border-[#FFC107]' : 'border-gray-100'
                                    } shadow-sm relative overflow-hidden`}
                                >
                                    <View className="flex-row items-start gap-3">
                                        <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mt-1 ${
                                            isSelected ? 'border-[#FFC107] bg-[#FFC107]' : 'border-gray-300'
                                        }`}>
                                            {isSelected && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                                        </View>

                                        <View className="flex-1">
                                            <View className="flex-row items-center flex-wrap gap-2 mb-1">
                                                <Text className="text-gray-900 font-bold text-sm font-heading">{addr.name}</Text>
                                                <View className="bg-gray-100 px-2 py-0.5 rounded-full flex-row items-center gap-1">
                                                    {getAddressTypeIcon(addr.type)}
                                                    <Text className="text-gray-500 text-[9px] font-black uppercase tracking-wider font-body">{addr.type}</Text>
                                                </View>
                                            </View>

                                            <Text className="text-gray-600 text-xs leading-relaxed mt-1 font-body">
                                                {addr.street}, {addr.city}, {addr.state} - <Text className="font-bold">{addr.pincode}</Text>
                                            </Text>

                                            {addr.phone && (
                                                <Text className="text-gray-400 text-[10px] font-bold mt-1 font-body">PHONE: {addr.phone}</Text>
                                            )}

                                            {/* Serviceability indicator */}
                                            <View className="mt-3 pt-2 border-t border-gray-50 flex-row items-center gap-1.5">
                                                <View className={`w-2 h-2 rounded-full ${serviceable ? 'bg-green-500' : 'bg-red-500'}`} />
                                                <Text className={`text-[10px] font-bold font-body ${serviceable ? 'text-green-600' : 'text-red-500'}`}>
                                                    {serviceable ? 'Serviceable Pincode' : 'Delivery Not Available'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}

                        {/* Continue Button */}
                        <TouchableOpacity
                            disabled={!selectedAddress || !isPincodeServiceable}
                            onPress={() => setCurrentStep('delivery')}
                            className={`w-full py-4 rounded-2xl flex-row items-center justify-center gap-2 shadow-lg mt-6 ${
                                (!selectedAddress || !isPincodeServiceable) ? 'bg-gray-300 opacity-60' : 'bg-gray-900'
                            }`}
                        >
                            <Text className="text-white font-bold text-base font-body">Select Delivery Option</Text>
                            <ArrowRight size={18} color="#FFFFFF" strokeWidth={3} />
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* ── STEP 2: DELIVERY SELECTION ─────────────────────────────────────── */}
                {currentStep === 'delivery' && (
                    <Animated.View entering={FadeInRight} className="p-4 flex-col gap-4">
                        <Text className="text-gray-500 font-black text-[10px] uppercase tracking-widest font-body">Select Delivery Speed</Text>

                        {/* Standard Delivery */}
                        <TouchableOpacity
                            onPress={() => setDeliveryOption('standard')}
                            className={`bg-white rounded-3xl p-5 border-2 ${
                                deliveryOption === 'standard' ? 'border-[#FFC107]' : 'border-gray-100'
                            } shadow-sm`}
                        >
                            <View className="flex-row items-start gap-4">
                                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mt-1 ${
                                    deliveryOption === 'standard' ? 'border-[#FFC107] bg-[#FFC107]' : 'border-gray-300'
                                }`}>
                                    {deliveryOption === 'standard' && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-900 font-bold text-sm font-heading">Standard Delivery</Text>
                                    <Text className="text-gray-400 text-xs mt-0.5 font-body">Delivered within 3-5 working days.</Text>
                                    <Text className="text-green-600 font-bold text-xs mt-2 font-body">{subtotal > 500 ? 'FREE' : '₹49'}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Express Delivery */}
                        <TouchableOpacity
                            onPress={() => setDeliveryOption('express')}
                            className={`bg-white rounded-3xl p-5 border-2 ${
                                deliveryOption === 'express' ? 'border-[#FFC107]' : 'border-gray-100'
                            } shadow-sm`}
                        >
                            <View className="flex-row items-start gap-4">
                                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mt-1 ${
                                    deliveryOption === 'express' ? 'border-[#FFC107] bg-[#FFC107]' : 'border-gray-300'
                                }`}>
                                    {deliveryOption === 'express' && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-900 font-bold text-sm font-heading">Express Delivery</Text>
                                    <Text className="text-gray-400 text-xs mt-0.5 font-body">Priority dispatch, delivered within 1-2 working days.</Text>
                                    <Text className="text-gray-900 font-bold text-xs mt-2 font-body">₹99</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Continue Button */}
                        <TouchableOpacity
                            onPress={() => setCurrentStep('payment')}
                            className="w-full py-4 rounded-2xl flex-row items-center justify-center gap-2 shadow-lg mt-6 bg-gray-900"
                        >
                            <Text className="text-white font-bold text-base font-body">Proceed to Payment</Text>
                            <ArrowRight size={18} color="#FFFFFF" strokeWidth={3} />
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* ── STEP 3: PAYMENT & SUMMARY ───────────────────────────────────────── */}
                {currentStep === 'payment' && (
                    <Animated.View entering={FadeInRight} className="p-4 flex-col gap-6">
                        {/* Payment Options */}
                        <View className="flex-col gap-3">
                            <Text className="text-gray-500 font-black text-[10px] uppercase tracking-widest ml-1 font-body">Payment Method</Text>

                            {/* Cash on Delivery */}
                            <TouchableOpacity
                                onPress={() => setPaymentMethod('cod')}
                                className={`bg-white rounded-3xl p-5 border-2 ${
                                    paymentMethod === 'cod' ? 'border-[#FFC107]' : 'border-gray-100'
                                } shadow-sm`}
                            >
                                <View className="flex-row items-start gap-4">
                                    <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mt-1 ${
                                        paymentMethod === 'cod' ? 'border-[#FFC107] bg-[#FFC107]' : 'border-gray-300'
                                    }`}>
                                        {paymentMethod === 'cod' && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-900 font-bold text-sm font-heading">Cash on Delivery (COD)</Text>
                                        <Text className="text-gray-400 text-xs mt-0.5 font-body">Pay at your doorstep using cash or UPI.</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            {/* Online via PhonePe */}
                            <TouchableOpacity
                                onPress={() => setPaymentMethod('phonepe')}
                                className={`bg-white rounded-3xl p-5 border-2 ${
                                    paymentMethod === 'phonepe' ? 'border-[#FFC107]' : 'border-gray-100'
                                } shadow-sm`}
                            >
                                <View className="flex-row items-start gap-4">
                                    <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mt-1 ${
                                        paymentMethod === 'phonepe' ? 'border-[#FFC107] bg-[#FFC107]' : 'border-gray-300'
                                    }`}>
                                        {paymentMethod === 'phonepe' && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-900 font-bold text-sm font-heading">Online Payment (PhonePe)</Text>
                                        <Text className="text-gray-400 text-xs mt-0.5 font-body">Secure payment via UPI, Credit/Debit cards or NetBanking.</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Coupons Section */}
                        <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
                            <View className="flex-row items-center gap-2 mb-1">
                                <Tag size={16} color="#FFC107" />
                                <Text className="text-gray-900 font-bold text-sm font-heading">Apply Coupon</Text>
                            </View>

                            {appliedCoupon ? (
                                <View className="flex-row items-center justify-between bg-green-50 border border-green-200 p-3 rounded-2xl">
                                    <View className="flex-row items-center gap-2">
                                        <View className="bg-green-500 rounded-full p-1">
                                            <Check size={10} color="#FFFFFF" strokeWidth={3} />
                                        </View>
                                        <Text className="text-green-800 font-bold text-xs uppercase font-mono font-body">{appliedCoupon.code}</Text>
                                    </View>
                                    <TouchableOpacity onPress={handleRemoveCoupon} className="p-1">
                                        <X size={14} color="#EF4444" strokeWidth={3} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View className="flex-row gap-2">
                                    <TextInput
                                        className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-xs text-gray-900 uppercase font-mono font-body"
                                        placeholder="ENTER COUPON CODE"
                                        placeholderTextColor="#9CA3AF"
                                        autoCapitalize="characters"
                                        value={couponCode}
                                        onChangeText={setCouponCode}
                                    />
                                    <TouchableOpacity
                                        onPress={handleApplyCoupon}
                                        disabled={applyingCoupon || !couponCode.trim()}
                                        className={`bg-gray-900 px-6 rounded-2xl justify-center ${
                                            (applyingCoupon || !couponCode.trim()) ? 'opacity-55' : ''
                                        }`}
                                    >
                                        {applyingCoupon ? (
                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                        ) : (
                                            <Text className="text-white font-bold text-xs font-body">Apply</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Order Summary Card */}
                        <View className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm">
                            <Text className="text-base font-bold text-gray-900 mb-4 font-heading">Order Summary</Text>

                            <View className="flex-col gap-3">
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-gray-500 font-medium text-sm font-body">Subtotal</Text>
                                    <Text className="text-gray-900 font-semibold text-sm font-body">{formatPrice(subtotal)}</Text>
                                </View>

                                {couponDiscount > 0 && (
                                    <View className="flex-row justify-between items-center">
                                        <View className="flex-row items-center gap-2">
                                            <Text className="text-gray-500 font-medium text-sm font-body">Coupon Discount</Text>
                                            <View className="bg-emerald-100 px-1.5 py-0.5 rounded-full">
                                                <Text className="text-emerald-700 text-[10px] font-bold uppercase tracking-wider font-body">Savings</Text>
                                            </View>
                                        </View>
                                        <Text className="text-emerald-600 font-semibold text-sm font-body">-{formatPrice(couponDiscount)}</Text>
                                    </View>
                                )}

                                <View className="flex-row justify-between items-center">
                                    <Text className="text-gray-500 font-medium text-sm font-body">Delivery Fee</Text>
                                    <Text className={`font-semibold text-sm font-body ${deliveryFee === 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                                        {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                                    </Text>
                                </View>
                            </View>

                            <View className="my-4 border-t border-dashed border-gray-300" />

                            <View className="flex-row justify-between items-end mb-4">
                                <View>
                                    <Text className="text-lg font-bold text-gray-900 font-heading">Total Amount</Text>
                                    <Text className="text-gray-400 text-[10px] font-medium mt-0.5 font-body">Inclusive of all taxes</Text>
                                </View>
                                <Text className="text-xl font-black text-gray-900 font-body">{formatPrice(total)}</Text>
                            </View>

                            <View className="pt-3 flex-row items-center justify-center gap-1.5 border-t border-gray-100">
                                <Lock size={12} color="#9CA3AF" />
                                <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest font-body">Secure Checkout</Text>
                            </View>
                        </View>
                    </Animated.View>
                )}
            </ScrollView>

            {/* Sticky Order Button for Step 3 */}
            {currentStep === 'payment' && (
                <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-2xl">
                    <TouchableOpacity
                        onPress={handlePlaceOrder}
                        disabled={isPlacingOrder}
                        className={`bg-gray-900 py-4 rounded-2xl flex-row items-center justify-center gap-3 active:scale-95 ${
                            isPlacingOrder ? 'opacity-70' : ''
                        }`}
                    >
                        {isPlacingOrder ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Text className="text-white font-black text-lg font-body">
                                    {paymentMethod === 'cod' ? 'Confirm COD Order' : 'Pay & Confirm Order'}
                                </Text>
                                <Check size={20} color="#FFFFFF" strokeWidth={3} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    orbitRing: {
        position: 'absolute',
        borderRadius: 999,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    orbitDot: {
        position: 'absolute',
        top: -4,
        left: '50%',
        marginLeft: -4,
        width: 8,
        height: 8,
        borderRadius: 4,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
        elevation: 4,
    },
    streamer: {
        position: 'absolute',
        width: 6,
        height: 16,
        borderRadius: 3,
    },
});
