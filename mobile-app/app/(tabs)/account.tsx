import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Mail, ShoppingBag, Heart, Settings, LogOut, Ticket, ChevronRight, MapPin } from 'lucide-react-native';
import { API_BASE_URL } from '@/services/api';
import Header from '@/components/Header';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import Skeleton from '@/components/Skeleton';

export default function AccountScreen() {
    const router = useRouter();
    const { user, loading: isLoading, logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            // AuthModal will automatically show because user becomes null
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <Header />
                <View style={styles.content}>
                    {/* Profile Card Skeleton */}
                    <View style={styles.profileSection}>
                        <View style={{ alignItems: 'center' }}>
                            <Skeleton width={80} height={80} borderRadius={40} style={{ marginBottom: 16 }} />
                            <Skeleton width={150} height={20} borderRadius={4} style={{ marginBottom: 8 }} />
                            <Skeleton width={120} height={14} borderRadius={4} />
                        </View>
                    </View>

                    {/* Menu Section Skeleton */}
                    <View style={styles.menuSection}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <View key={i} style={[styles.menuItem, { borderBottomWidth: i === 5 ? 0 : 1 }]}>
                                <Skeleton width={20} height={20} borderRadius={4} />
                                <Skeleton width={140} height={16} borderRadius={4} style={{ marginLeft: 12 }} />
                                <View style={{ marginLeft: 'auto' }}>
                                    <Skeleton width={16} height={16} borderRadius={8} />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <Header />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={styles.content}>
                    <View style={styles.profileSection}>
                        <View style={styles.avatar}>
                            {user?.profileImage ? (
                                <Image
                                    source={{ uri: user.profileImage.startsWith('http') ? user.profileImage : `${API_BASE_URL}${user.profileImage}` }}
                                    style={{ width: '100%', height: '100%' }}
                                />
                            ) : (
                                <User size={40} color="#FFFFFF" />
                            )}
                        </View>
                        <Text style={styles.name}>{user?.name || 'Guest User'}</Text>
                        <Text style={styles.email}>{user?.phone || 'Sign in to access your account'}</Text>

                        {user && (
                            <TouchableOpacity
                                onPress={() => router.push('/account/profile')}
                                className="mt-4 bg-yellow-50 px-4 py-2 rounded-full border border-yellow-200"
                            >
                                <Text className="text-yellow-700 font-bold text-xs uppercase tracking-wider">Edit Profile</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.menuSection}>
                        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/account/orders')}>
                            <ShoppingBag size={20} color="#6B7280" />
                            <Text style={styles.menuText}>My Orders</Text>
                            <View className="ml-auto">
                                <ChevronRight size={16} color="#D1D5DB" />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/account/wishlist')}>
                            <Heart size={20} color="#6B7280" />
                            <Text style={styles.menuText}>Wishlist</Text>
                            <View className="ml-auto">
                                <ChevronRight size={16} color="#D1D5DB" />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/account/coupons')}>
                            <Ticket size={20} color="#6B7280" />
                            <Text style={styles.menuText}>Coupons & Offers</Text>
                            <View className="ml-auto">
                                <ChevronRight size={16} color="#D1D5DB" />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/account/addresses')}>
                            <MapPin size={20} color="#6B7280" />
                            <Text style={styles.menuText}>My Saved Addresses</Text>
                            <View className="ml-auto">
                                <ChevronRight size={16} color="#D1D5DB" />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
                            <LogOut size={20} color="#EF4444" />
                            <Text style={styles.logoutText}>{user ? 'Logout' : 'Sign In'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    content: {
        padding: 20,
    },
    profileSection: {
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFC107',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        overflow: 'hidden',
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: '#6B7280',
    },
    menuSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    menuText: {
        fontSize: 16,
        color: '#111827',
        marginLeft: 12,
    },
    logoutItem: {
        borderBottomWidth: 0,
    },
    logoutText: {
        fontSize: 16,
        color: '#EF4444',
        marginLeft: 12,
    },
});