import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ShoppingCart } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ProductCard from '@/components/ProductCard';
import { productApi } from '@/services/api';
import { ProductCardSkeleton } from '@/components/SkeletonLoader';
import { useCart } from '@/contexts/CartContext';

export default function CategoryProductsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { category, subcategory, categoryName, brandId, brandName } = params;
    const { cartCount } = useCart();

    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchProducts = useCallback(async (pageNum = 1, isRefresh = false) => {
        if (pageNum === 1) {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);
        } else {
            setLoadingMore(true);
        }
        try {
            const queryParams: any = {
                page: pageNum,
                limit: 16,
            };
            if (category) queryParams.categorySlug = category;
            if (brandId) queryParams.brandId = brandId;
            if (subcategory) {
                queryParams.subcategory = subcategory;
            }

            const response = await productApi.getProducts(queryParams);
            const data = response?.data || response;
            const fetchedProducts = data.products || [];
            
            if (pageNum === 1) {
                setProducts(fetchedProducts);
            } else {
                setProducts((prev: any) => [...prev, ...fetchedProducts]);
            }
            setHasMore(fetchedProducts.length === 16);
        } catch (err) {
            console.error('Failed to load products', err);
        } finally {
            if (pageNum === 1) {
                if (isRefresh) setRefreshing(false);
                else setLoading(false);
            } else {
                setLoadingMore(false);
            }
        }
    }, [category, subcategory, brandId]);

    useEffect(() => {
        setPage(1);
        fetchProducts(1, false);
    }, [fetchProducts]);

    const loadMoreProducts = () => {
        if (!loading && !loadingMore && hasMore && !refreshing) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchProducts(nextPage, false);
        }
    };

    const title = brandName ? String(brandName) : (subcategory ? String(subcategory) : (categoryName ? String(categoryName) : String(category || 'Products')));
    const displayTitle = title.replace(/-/g, ' ');

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['left', 'right']}>
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 10 }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>{displayTitle}</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/cart')} style={styles.cartButton}>
                    <ShoppingCart size={24} color="#111827" />
                    {cartCount > 0 && (
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>{cartCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {loading ? (
                    <FlatList
                        data={[1, 2, 3, 4, 5, 6, 7, 8]}
                        numColumns={2}
                        columnWrapperStyle={styles.row}
                        renderItem={() => <ProductCardSkeleton />}
                        keyExtractor={item => item.toString()}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                ) : products.length > 0 ? (
                    <FlatList
                        data={products}
                        numColumns={2}
                        columnWrapperStyle={styles.row}
                        renderItem={({ item }) => (
                            <ProductCard product={item} />
                        )}
                        keyExtractor={(item: any) => item.id || item._id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        onEndReached={loadMoreProducts}
                        onEndReachedThreshold={0.5}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => {
                                    setPage(1);
                                    fetchProducts(1, true);
                                }}
                                colors={['#FFC107']}
                            />
                        }
                        ListFooterComponent={
                            loadingMore ? (
                                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                                    <ActivityIndicator size="small" color="#FFC107" />
                                </View>
                            ) : null
                        }
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No products found in this category.</Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 16,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        textTransform: 'capitalize',
        marginLeft: 4,
    },
    cartButton: {
        padding: 8,
        marginRight: -8,
        position: 'relative',
    },
    badgeContainer: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: '#FFC107',
        width: 16,
        height: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#ffffff',
    },
    badgeText: {
        color: '#ffffff',
        fontSize: 8,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    listContent: {
        padding: 12,
        paddingBottom: 40,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 12,
    },

    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
    },
});
