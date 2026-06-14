import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Truck, Shield, Headphones, RefreshCw, CreditCard, Award, Clock, ThumbsUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    withSpring,
    useSharedValue,
    withTiming,
    interpolate,
    Extrapolate
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const badges = [
    {
        id: 1,
        icon: Truck,
        title: "Free Delivery",
        description: "Above ₹999",
        colors: ["#3B82F6", "#22D3EE"],
        gradientColors: ["#3B82F6", "#2563EB"],
        bgColor: "#EFF6FF",
        delay: 100
    },
    {
        id: 2,
        icon: Shield,
        title: "100% Genuine",
        description: "Brand warranty",
        colors: ["#10B981", "#34D399"],
        gradientColors: ["#10B981", "#059669"],
        bgColor: "#ECFDF5",
        delay: 200
    },
    {
        id: 3,
        icon: RefreshCw,
        title: "Easy Returns",
        description: "7-day policy",
        colors: ["#F59E0B", "#FBBF24"],
        gradientColors: ["#F59E0B", "#D97706"],
        bgColor: "#FFFBEB",
        delay: 300
    },
    {
        id: 4,
        icon: CreditCard,
        title: "Secure Payment",
        description: "Multiple options",
        colors: ["#8B5CF6", "#A78BFA"],
        gradientColors: ["#8B5CF6", "#7C3AED"],
        bgColor: "#F5F3FF",
        delay: 400
    },
    {
        id: 5,
        icon: Headphones,
        title: "24/7 Support",
        description: "Quick assistance",
        colors: ["#EC4899", "#FB7185"],
        gradientColors: ["#EC4899", "#DB2777"],
        bgColor: "#FDF4FF",
        delay: 500
    },
    {
        id: 6,
        icon: Award,
        title: "Trusted Store",
        description: "10+ years",
        colors: ["#FFC107", "#FFD54F"],
        gradientColors: ["#FFC107", "#F59E0B"],
        bgColor: "#FEFCE8",
        delay: 600
    }
];

export const TrustBadges = () => {
    const scaleValue = useSharedValue(1);

    const handlePressIn = () => {
        scaleValue.value = withTiming(0.95, { duration: 100 });
    };

    const handlePressOut = () => {
        scaleValue.value = withTiming(1, { duration: 100 });
    };

    return (
        <View className="px-5 py-4">
            {/* Section Header */}
            <Animated.View
                entering={FadeInDown.duration(600).springify()}
                className="mb-5"
            >
                <Text className="text-lg font-bold text-gray-800 text-center">
                    Why Shop With Us?
                </Text>
                <View className="flex-row justify-center mt-1">
                    <View className="w-12 h-1 bg-yellow-400 rounded-full" />
                </View>
            </Animated.View>

            <View className="bg-white rounded-3xl shadow-xl border border-gray-100/80 overflow-hidden">
                {/* Decorative top bar */}
                <LinearGradient
                    colors={['#FFC107', '#FFD54F']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="h-1.5"
                />

                <View className="p-5">
                    <View className="flex-row flex-wrap justify-between -mx-2">
                        {badges.map((badge, index) => {
                            const Icon = badge.icon;
                            const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
                            const animatedStyle = useAnimatedStyle(() => ({
                                transform: [{ scale: scaleValue.value }]
                            }));

                            return (
                                <Animated.View
                                    key={badge.id}
                                    entering={FadeInUp.duration(600).delay(badge.delay).springify()}
                                    style={{ width: '33.33%' }}
                                    className="items-center px-2 mb-5"
                                >
                                    <AnimatedTouchable
                                        activeOpacity={0.8}
                                        onPressIn={handlePressIn}
                                        onPressOut={handlePressOut}
                                        style={animatedStyle}
                                    >
                                        <View className="relative">
                                            {/* Glow effect */}
                                            <LinearGradient
                                                colors={[badge.colors[0] + '20', badge.colors[1] + '20']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                className="absolute -inset-2 rounded-full opacity-50"
                                            />

                                            {/* Icon container with gradient */}
                                            <LinearGradient
                                                colors={badge.gradientColors as [string, string, ...string[]]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                className="w-14 h-14 rounded-2xl items-center justify-center shadow-lg"
                                                style={{
                                                    shadowColor: badge.gradientColors[0],
                                                    shadowOffset: { width: 0, height: 4 },
                                                    shadowOpacity: 0.3,
                                                    shadowRadius: 8,
                                                    elevation: 6,
                                                }}
                                            >
                                                <Icon size={24} color="#FFF" strokeWidth={1.8} />
                                            </LinearGradient>
                                        </View>
                                    </AnimatedTouchable>

                                    <Text className="text-xs font-bold text-gray-800 text-center mt-2 tracking-tight">
                                        {badge.title}
                                    </Text>
                                    <Text className="text-[10px] text-gray-500 text-center leading-tight">
                                        {badge.description}
                                    </Text>
                                </Animated.View>
                            );
                        })}
                    </View>

                    {/* Trust message */}
                    <View className="mt-2 pt-3 border-t border-gray-100">
                        <View className="flex-row items-center justify-center gap-2">
                            <View className="w-1 h-1 bg-gray-300 rounded-full" />
                            <Text className="text-[10px] text-gray-500 text-center">
                                ⭐ 4.9/5 Rating • 10,000+ Happy Customers
                            </Text>
                            <View className="w-1 h-1 bg-gray-300 rounded-full" />
                        </View>
                    </View>
                </View>

                {/* Decorative bottom bar */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.02)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="h-1"
                />
            </View>
        </View>
    );
};

// Alternative: Carousel/Slider version for more compact display
export const CompactTrustBadges = () => {
    return (
        <View className="px-5 py-4">
            <View className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
                <View className="flex-row justify-between items-center">
                    {badges.slice(0, 4).map((badge, index) => {
                        const Icon = badge.icon;
                        return (
                            <View key={badge.id} className="items-center flex-1">
                                <LinearGradient
                                    colors={badge.gradientColors as [string, string, ...string[]]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    className="w-10 h-10 rounded-full items-center justify-center shadow-sm"
                                >
                                    <Icon size={16} color="#FFF" />
                                </LinearGradient>
                                <Text className="text-[9px] font-semibold text-gray-700 text-center mt-1">
                                    {badge.title}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
    );
};

// Alternative: Horizontal Scroll version
export const ScrollableTrustBadges = () => {
    return (
        <View className="py-4">
            <Text className="text-base font-bold text-gray-800 px-5 mb-3">
                Why Choose Us
            </Text>
            <Animated.FlatList
                data={badges}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item, index }) => {
                    const Icon = item.icon;
                    return (
                        <Animated.View
                            entering={FadeInUp.duration(500).delay(index * 100)}
                            className="bg-white rounded-2xl p-4 shadow-md border border-gray-100"
                            style={{ width: 110 }}
                        >
                            <LinearGradient
                                colors={item.gradientColors as [string, string, ...string[]]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                className="w-12 h-12 rounded-xl items-center justify-center mb-2 shadow-sm"
                            >
                                <Icon size={22} color="#FFF" />
                            </LinearGradient>
                            <Text className="text-sm font-bold text-gray-800">
                                {item.title}
                            </Text>
                            <Text className="text-xs text-gray-500 mt-0.5">
                                {item.description}
                            </Text>
                        </Animated.View>
                    );
                }}
            />
        </View>
    );
};

export default TrustBadges;