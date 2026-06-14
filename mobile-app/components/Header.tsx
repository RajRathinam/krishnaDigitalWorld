import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Animated, Dimensions, Linking, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { ShoppingCart, Menu, X, ChevronRight, Home, LayoutGrid, Gift, Star, TrendingUp, User, Package, Ticket, Heart, LogOut, MapPin, Phone, ExternalLink, ChevronDown, Truck, Clock, Shield } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { authApi, categoryApi, API_BASE_URL } from '@/services/api';
import { useShopInfo } from '@/contexts/ShopInfoContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const Logo = require('../assets/images/sk.png');

// Helper function to ensure something is an array
const ensureArray = (value: any): any[] => {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined) return [];
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [value];
        } catch {
            const split = value.split(',').map(s => s.trim()).filter(Boolean);
            return split.length > 0 ? split : [value];
        }
    }
    return [];
};

// Sidebar Category Item Component
const CategorySidebarItem = ({ cat, openCategory, setOpenCategory, navigateTo }: any) => {
    const isOpen = openCategory === cat.id;
    const [expanded, setExpanded] = React.useState(false);

    // Randomize subcategories once when mounted or category changes
    const randomizedSubcategories = React.useMemo(() => {
        const subs = ensureArray(cat.subcategories);
        return [...subs].sort(() => 0.5 - Math.random());
    }, [cat.subcategories]);

    const displayedSubcategories = expanded ? randomizedSubcategories : randomizedSubcategories.slice(0, 6);

    return (
        <View>
            <TouchableOpacity
                onPress={() => setOpenCategory(isOpen ? null : cat.id)}
                className="flex-row items-center justify-between py-3 mb-1 px-2 rounded-xl active:bg-gray-100"
            >
                <View className="flex-row items-center flex-1">
                    <View className="w-8 h-8 rounded-lg items-center justify-center bg-blue-50/50 mr-3">
                        <LayoutGrid size={16} color="#3B82F6" />
                    </View>
                    <Text className="text-gray-700 font-medium text-sm" style={{ textTransform: 'capitalize' }}>{cat.name}</Text>
                </View>
                <ChevronDown size={14} color="#D1D5DB" style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }} />
            </TouchableOpacity>

            {isOpen && (
                <View className="ml-10 mb-2 border-l border-gray-100 pl-4 py-1">
                    {displayedSubcategories.map((sub: string, i: number) => (
                        <TouchableOpacity
                            key={`${cat.id}-${i}`}
                            onPress={() => navigateTo(`/category/products?category=${cat.slug || cat.id}&categoryName=${encodeURIComponent(cat.name)}&subcategory=${encodeURIComponent(sub)}`)}
                            className="py-2"
                        >
                            <Text className="text-gray-500 text-xs font-medium capitalize" style={{ textTransform: 'capitalize' }}>{sub}</Text>
                        </TouchableOpacity>
                    ))}
                    {!expanded && randomizedSubcategories.length > 6 && (
                        <TouchableOpacity
                            onPress={() => setExpanded(true)}
                            className="py-2"
                        >
                            <Text className="text-[#FFC107] text-xs font-bold">View All</Text>
                        </TouchableOpacity>
                    )}
                    {expanded && (
                        <TouchableOpacity
                            onPress={() => navigateTo(`/category/products?category=${cat.slug || cat.id}&categoryName=${encodeURIComponent(cat.name)}`)}
                            className="py-2 mt-1 border-t border-gray-100 pt-3"
                        >
                            <Text className="text-[#FFC107] text-xs font-bold">Explore All Products</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
};

const Header = () => {
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const sidebarAnim = useState(new Animated.Value(-width))[0];
    const insets = useSafeAreaInsets();
    const { shopInfo } = useShopInfo();
    const { cartCount } = useCart();
    const [openCategory, setOpenCategory] = useState<string | null>(null);

    const { data: categoriesResponse } = useQuery({
        queryKey: ['categories'],
        queryFn: categoryApi.getCategories,
    });

    const categories = categoriesResponse?.data || categoriesResponse || [];

    const { user, logout: authLogout } = useAuth();

    const toggleSidebar = () => {
        if (isSidebarOpen) {
            Animated.timing(sidebarAnim, {
                toValue: -width,
                duration: 300,
                useNativeDriver: true,
            }).start(() => setIsSidebarOpen(false));
        } else {
            setIsSidebarOpen(true);
            Animated.timing(sidebarAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    };

    const navigateTo = (path: any) => {
        toggleSidebar();
        router.push(path);
    };

    const openGoogleMaps = () => {
        toggleSidebar();
        const addressParts = shopInfo ? [shopInfo.address, shopInfo.city, shopInfo.state, shopInfo.pincode, shopInfo.country] : [];
        const filteredParts = addressParts.filter(part => part && String(part).trim() !== '');

        const query = filteredParts.length > 0
            ? filteredParts.join(', ')
            : 'Sri Krishna Digital World';

        const encodedQuery = encodeURIComponent(query);
        const url = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
        Linking.openURL(url);
    };

    const SidebarLink = ({ icon: Icon, label, onPress, color = "#4B5563", badge = null }: any) => (
        <TouchableOpacity
            onPress={onPress}
            className="flex-row items-center justify-between py-3 mb-1 px-2 rounded-xl active:bg-gray-100"
        >
            <View className="flex-row items-center flex-1">
                <View className="w-8 h-8 rounded-lg items-center justify-center bg-gray-50 mr-3">
                    <Icon size={18} color={color} />
                </View>
                <Text className="text-gray-700 font-medium text-sm">{label}</Text>
            </View>
            <View className="flex-row items-center">
                {badge && (
                    <View className="bg-[#FFC107] px-2 py-0.5 rounded-full mr-2">
                        <Text className="text-white text-[10px] font-bold">{badge}</Text>
                    </View>
                )}
                <ChevronRight size={16} color="#D1D5DB" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View
            style={{ paddingTop: Math.max(insets.top, 12) + 10 }}
            className="bg-white px-4 py-4 flex-row items-center justify-between border-b border-gray-100 shadow-sm"
        >
            <View className="flex-row items-center">
                <TouchableOpacity onPress={toggleSidebar} className="p-1 -ml-1">
                    <Menu size={24} color="#111827" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/')} className="ml-3 flex-row items-center">
                    <Image source={Logo} style={{ width: 32, height: 32, borderRadius: 8 }} contentFit="contain" />
                    <View className="ml-2">
                        <Text className="text-gray-900 font-heading text-lg tracking-tight"><Text className="text-[#FFC107]">Sri</Text> Krishna</Text>
                        <Text className="text-[9px] text-gray-400 font-sans font-bold uppercase tracking-widest mt-[-3]">Digital World</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <View className="flex-row items-center">
                <TouchableOpacity onPress={() => router.push('/cart')} className="p-2 relative">
                    <ShoppingCart size={22} color="#111827" />
                    <View className="absolute top-1 right-1 bg-[#FFC107] w-4 h-4 rounded-full items-center justify-center border-2 border-white">
                        <Text className="text-white text-[8px] font-bold">{cartCount}</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Sidebar Modal */}
            <Modal
                transparent={true}
                visible={isSidebarOpen}
                onRequestClose={toggleSidebar}
                animationType="none"
            >
                <View className="flex-1 flex-row">
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        className="bg-black/40"
                        activeOpacity={1}
                        onPress={toggleSidebar}
                    />
                    <Animated.View
                        style={{
                            transform: [{ translateX: sidebarAnim }],
                            width: width * 0.85,
                        }}
                        className="bg-white h-full shadow-2xl z-50"
                    >
                        <View className="flex-row items-center justify-between p-5 border-b border-gray-100">
                            <View className="flex-row items-center">
                                <Image source={Logo} style={{ width: 32, height: 32, borderRadius: 8 }} contentFit="contain" />
                                <View className="ml-2">
                                    <Text className="text-gray-900 font-heading text-lg tracking-tight"><Text className="text-[#FFC107]">Sri</Text> Krishna</Text>
                                    <Text className="text-[9px] text-gray-400 font-sans font-bold uppercase tracking-widest mt-[-3]">Digital World</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={toggleSidebar} className="bg-gray-50 p-2 rounded-full">
                                <X size={20} color="#111827" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4 py-4">
                            {/* User Profile Hook */}
                            {user && (
                                <View className="mb-6 p-4 bg-gray-50 rounded-2xl flex-row items-center">
                                    <View className="w-12 h-12 bg-[#FFC107] rounded-full items-center justify-center overflow-hidden">
                                        {user.profileImage ? (
                                            <Image 
                                                source={{ uri: user.profileImage.startsWith('http') ? user.profileImage : `${API_BASE_URL}${user.profileImage}` }} 
                                                style={{ width: '100%', height: '100%' }}
                                            />
                                        ) : (
                                            <Text className="text-white font-bold text-lg">{user.name?.charAt(0)}</Text>
                                        )}
                                    </View>
                                    <View className="ml-4 flex-1">
                                        <Text className="text-gray-900 font-bold text-base">{user.name}</Text>
                                        <Text className="text-gray-500 text-xs">{user.phone}</Text>
                                    </View>
                                    <ChevronRight size={20} color="#D1D5DB" />
                                </View>
                            )}

                            {/* Browse Section */}
                            <View className="mb-6">
                                <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-2">Browse</Text>
                                <SidebarLink icon={Home} label="Home" onPress={() => navigateTo('/')} />
                                <SidebarLink icon={LayoutGrid} label="All Products" onPress={() => navigateTo('/shop')} />
                            </View>

                            {/* Categories Section */}
                            <View className="mb-6">
                                <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-2">Shop by Category</Text>
                                {categories.map((cat: any) => (
                                    <CategorySidebarItem 
                                        key={cat.id || cat._id} 
                                        cat={cat} 
                                        openCategory={openCategory} 
                                        setOpenCategory={setOpenCategory} 
                                        navigateTo={navigateTo} 
                                    />
                                ))}
                            </View>

                            {/* Quick Links */}
                            <View className="mb-6">
                                <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-2">Quick Links</Text>
                                <SidebarLink icon={Gift} label="Today's Deals" color="#EF4444" onPress={() => navigateTo('/deals')} />
                                <SidebarLink icon={Star} label="New Arrivals" color="#F59E0B" onPress={() => navigateTo('/new-arrivals')} />
                                <SidebarLink icon={TrendingUp} label="Best Sellers" color="#10B981" onPress={() => navigateTo('/best-sellers')} />
                            </View>

                            {/* Account Section */}
                            <View className="mb-8">
                                <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-2">Account</Text>
                                <SidebarLink icon={User} label="My Account" onPress={() => navigateTo('/account')} />
                                <SidebarLink icon={ShoppingCart} label="Cart" badge={cartCount > 0 ? cartCount : null} onPress={() => navigateTo('/cart')} />
                                <SidebarLink icon={Package} label="Orders" onPress={() => navigateTo('/account/orders')} />
                                <SidebarLink icon={Ticket} label="Coupons" onPress={() => navigateTo('/account/coupons')} />
                                <SidebarLink icon={Heart} label="Wishlist" color="#EF4444" onPress={() => navigateTo('/account/wishlist')} />

                                <View className="h-[1px] bg-gray-100 my-4 px-2" />

                                {user ? (
                                    <TouchableOpacity
                                        onPress={() => {
                                            authLogout();
                                            toggleSidebar();
                                        }}
                                        className="flex-row items-center py-3 px-2 rounded-xl active:bg-red-50"
                                    >
                                        <View className="w-8 h-8 rounded-lg items-center justify-center bg-red-50 mr-3">
                                            <LogOut size={18} color="#EF4444" />
                                        </View>
                                        <Text className="text-red-500 font-bold text-sm">Logout</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        onPress={() => navigateTo('/login')}
                                        className="flex-row items-center py-3 px-2 rounded-xl active:bg-blue-50"
                                    >
                                        <View className="w-8 h-8 rounded-lg items-center justify-center bg-blue-50 mr-3">
                                            <User size={18} color="#3B82F6" />
                                        </View>
                                        <Text className="text-blue-500 font-bold text-sm">Sign In / Register</Text>
                                    </TouchableOpacity>
                                )}

                                <View className="mt-2">
                                    <SidebarLink icon={MapPin} label="Store Locator" color="#3B82F6" onPress={openGoogleMaps} />
                                </View>
                            </View>

                            {/* Footer Features */}
                            <View className="mb-4 p-4 border-t border-gray-100 bg-gray-50/50">
                                <View className="flex-row flex-wrap">
                                    <View className="w-1/2 flex-row items-center mb-4">
                                        <Truck size={14} color="#6B7280" />
                                        <Text className="text-gray-500 text-xs ml-2 font-medium">Free Shipping</Text>
                                    </View>
                                    <View className="w-1/2 flex-row items-center mb-4">
                                        <Clock size={14} color="#6B7280" />
                                        <Text className="text-gray-500 text-xs ml-2 font-medium">24/7 Support</Text>
                                    </View>
                                    <View className="w-1/2 flex-row items-center">
                                        <Shield size={14} color="#6B7280" />
                                        <Text className="text-gray-500 text-xs ml-2 font-medium">Secure</Text>
                                    </View>
                                    <View className="w-1/2 flex-row items-center">
                                        <Gift size={14} color="#6B7280" />
                                        <Text className="text-gray-500 text-xs ml-2 font-medium">Special Offers</Text>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
};

const styles = {
    absoluteFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    }
} as const;

export default Header;
