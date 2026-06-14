import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, Clock, TrendingUp } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { productApi, API_BASE_URL } from '@/services/api';
import ProductCard from '@/components/ProductCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProductCardSkeleton, ListItemSkeleton } from '@/components/SkeletonLoader';

// Helper to get image URL (same logic as ProductCard)
const getImageUrl = (product: any) => {
    // Check direct image field
    if (product.image) {
        return product.image.startsWith('http') ? product.image : `${API_BASE_URL}${product.image}`;
    }

    // Parse colorsAndImages
    const parseJSONSafe = (data: any, defaultValue: any = null) => {
        if (!data) return defaultValue;
        if (typeof data === 'object' && !Array.isArray(data)) return data;
        if (typeof data === 'string') {
            try {
                const cleanedData = data.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                return JSON.parse(cleanedData);
            } catch (e) {
                return defaultValue;
            }
        }
        return defaultValue;
    };

    const colorsAndImages = parseJSONSafe(product.colorsAndImages, {});
    const colorKeys = Object.keys(colorsAndImages);

    if (colorKeys.length > 0) {
        const firstColor = colorKeys[0];
        const colorImages = colorsAndImages[firstColor];

        if (Array.isArray(colorImages) && colorImages.length > 0) {
            const firstImg = colorImages[0];
            const imgPath = typeof firstImg === 'string' ? firstImg : (firstImg.url || firstImg.publicId);

            if (imgPath) {
                let url = imgPath.startsWith('http') ? imgPath : `${API_BASE_URL}${imgPath}`;
                if (url.includes('cloudinary.com') && url.includes('/upload/')) {
                    url = url.replace('/upload/', '/upload/w_400,q_auto,f_auto/');
                }
                return url;
            }
        }
    }

    if (Array.isArray(product.images) && product.images.length > 0) {
        const firstImg = product.images[0];
        const imgPath = typeof firstImg === 'string' ? firstImg : (firstImg.url || firstImg);
        if (imgPath) {
            let url = imgPath.startsWith('http') ? imgPath : `${API_BASE_URL}${imgPath}`;
            if (url.includes('cloudinary.com') && url.includes('/upload/')) {
                url = url.replace('/upload/', '/upload/w_400,q_auto,f_auto/');
            }
            return url;
        }
    }

    return null;
};

const RECENT_SEARCHES = [
  // Home appliances
  'refrigerator',
  'washing machine',
  'air conditioner',
  'vacuum cleaner',
  'water purifier',
  'room heater',
  'ceiling fan',
  'iron',
  'air purifier',
  'geyser',

  // Kitchen appliances
  'microwave oven',
  'air fryer',
  'mixer grinder',
  'induction cooktop',
  'dishwasher',

  // Furniture
  'sofa',
  'dining table',
  'study table',
  'bookshelf',
];
export default function SearchScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [allProducts, setAllProducts] = useState<any[]>([]); // Store all products
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [recentSearches, setRecentSearches] = useState(() => {
        return [...RECENT_SEARCHES].sort(() => 0.5 - Math.random()).slice(0, 4);
    });
    const [popularProducts, setPopularProducts] = useState<any[]>([]);
    const inputRef = useRef<TextInput>(null);

    // Filter products based on search query
    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return [];

        const query = searchQuery.toLowerCase().trim();
        return allProducts.filter(product => {
            const name = (product.name || '').toLowerCase();
            const category = (product.category?.name || product.category || '').toLowerCase();
            const brand = (product.brand?.name || product.brand || '').toLowerCase();

            return name.includes(query) ||
                category.includes(query) ||
                brand.includes(query);
        });
    }, [allProducts, searchQuery]);

    // Fetch all products on mount
    useEffect(() => {
        fetchAllProducts();
    }, []);

    const fetchAllProducts = async () => {
        setLoading(true);
        try {
            const response = await productApi.getProducts({ limit: 100 }); // Fetch up to 100 products
            const data = response?.data || response;
            setAllProducts(data.products || []);

            // Set popular products (first 5)
            setPopularProducts((data.products || []).slice(0, 5));
        } catch (err) {
            console.error('Failed to load products', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAllProducts();
        setRefreshing(false);
    };

    const handleSearch = (text: string) => {
        setSearchQuery(text);
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        inputRef.current?.focus();
    };

    const handleRecentSearchPress = (term: string) => {
        setSearchQuery(term);
    };

    const handleProductPress = (productId: string, slug: string) => {
        router.push(`/product/${slug || productId}` as any);
    };

    const handleViewAllProducts = () => {
        router.push('/shop');
    };

    const renderProduct = ({ item }: { item: any }) => (
        <ProductCard product={item} onPress={() => handleProductPress(item.id || item._id, item.slug)} />
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Search Header */}
            <View style={styles.header}>
                <View style={styles.searchContainer}>
                    <Search size={20} color="#9CA3AF" />
                    <TextInput
                        ref={inputRef}
                        style={styles.searchInput}
                        placeholder="Search products..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={handleSearch}
                        autoFocus
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={handleClearSearch}>
                            <X size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Results */}
            {loading && allProducts.length === 0 ? (
                <View style={styles.content}>
                    {[1, 2, 3, 4, 5, 6].map(i => <ListItemSkeleton key={i} />)}
                </View>
            ) : searchQuery.length > 0 ? (
                // Search Results
                filteredProducts.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <Search size={48} color="#D1D5DB" />
                        <Text style={styles.noResultsTitle}>No results found</Text>
                        <Text style={styles.noResultsSubtitle}>
                            Try searching for something else
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        key="search-results-list"
                        data={filteredProducts}
                        renderItem={renderProduct}
                        keyExtractor={(item, index) => (item.id || item._id || index).toString()}
                        numColumns={2}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[styles.productList]}
                        columnWrapperStyle={styles.columnWrapper}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                colors={['#FFC107']}
                            />
                        }
                        initialNumToRender={10}
                        windowSize={5}
                        removeClippedSubviews={true}
                    />
                )
            ) : (
                // Recent Searches & Popular Products
                <FlatList
                    key="recent-popular-list"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={['#FFC107']}
                        />
                    }
                    ListHeaderComponent={
                        <>
                            {/* Recent Searches */}
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Clock size={18} color="#6B7280" />
                                    <Text style={styles.sectionTitle}>Popular Searches</Text>
                                </View>
                                <View style={styles.recentChips}>
                                    {recentSearches.map((term, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.chip}
                                            onPress={() => handleRecentSearchPress(term)}
                                        >
                                            <Text style={styles.chipText}>{term}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Popular Products */}
                            {loading && popularProducts.length === 0 ? (
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <TrendingUp size={18} color="#6B7280" />
                                        <Text style={styles.sectionTitle}>Popular Products</Text>
                                    </View>
                                    {[1, 2, 3, 4, 5].map(i => <ListItemSkeleton key={i} />)}
                                </View>
                            ) : popularProducts.length > 0 && (
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <TrendingUp size={18} color="#6B7280" />
                                        <Text style={styles.sectionTitle}>Popular Products</Text>
                                        <TouchableOpacity onPress={handleViewAllProducts}>
                                            <Text style={styles.viewAllText}>View All</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {popularProducts.map((item, index) => (
                                        <TouchableOpacity
                                            key={item.id || item._id || index}
                                            style={styles.popularProductItem}
                                            onPress={() => handleProductPress(item.id || item._id, item.slug)}
                                            activeOpacity={0.7}
                                        >
                                            <Image
                                                source={{ uri: getImageUrl(item) || 'https://via.placeholder.com/60' }}
                                                style={styles.popularProductImage}
                                                resizeMode="contain"
                                            />
                                            <View style={styles.popularProductInfo}>
                                                <Text style={styles.popularProductName} numberOfLines={1}>
                                                    {item.name}
                                                </Text>
                                                <Text style={styles.popularProductPrice}>₹{item.price}</Text>
                                                {item.rating > 0 && (
                                                    <Text style={styles.popularProductRating}>
                                                        ★ {item.rating}
                                                    </Text>
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </>
                    }
                    data={[]}
                    renderItem={null}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAF9F6', // Premium luxury background color
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
        padding: 0,
        fontFamily: 'DMSans-Regular',
    },
    content: {
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        flex: 1,
        fontFamily: 'PlayfairDisplay-Bold',
    },
    viewAllText: {
        fontSize: 12,
        color: '#FFC107',
        fontWeight: '500',
        fontFamily: 'DMSans-Medium',
    },
    recentChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    chipText: {
        fontSize: 14,
        color: '#374151',
        fontFamily: 'DMSans-Regular',
    },
    popularProductItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    popularProductImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    popularProductInfo: {
        flex: 1,
    },
    popularProductName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 4,
        fontFamily: 'DMSans-Medium',
    },
    popularProductPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFC107',
        marginBottom: 2,
        fontFamily: 'DMSans-Bold',
    },
    popularProductRating: {
        fontSize: 12,
        color: '#6B7280',
        fontFamily: 'DMSans-Regular',
    },
    productList: {
        padding: 12,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    noResultsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginTop: 16,
        marginBottom: 8,
        fontFamily: 'PlayfairDisplay-Bold',
    },
    noResultsSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        fontFamily: 'DMSans-Regular',
    },
});