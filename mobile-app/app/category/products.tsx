import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ProductCard from '@/components/ProductCard';
import { productApi } from '@/services/api';
import { ProductCardSkeleton } from '@/components/SkeletonLoader';

export default function CategoryProductsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { category, subcategory, categoryName } = params;

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const queryParams: any = {
                page: 1,
                limit: 100, // Load enough for a simple list
                categorySlug: category,
            };
            if (subcategory) {
                queryParams.subcategory = subcategory;
            }

            const response = await productApi.getProducts(queryParams);
            const data = response?.data || response;
            setProducts(data.products || []);
        } catch (err) {
            console.error('Failed to load products', err);
        } finally {
            setLoading(false);
        }
    }, [category, subcategory]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const title = subcategory ? String(subcategory) : (categoryName ? String(categoryName) : String(category || 'Products'));
    const displayTitle = title.replace(/-/g, ' ');

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['left', 'right']}>
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{displayTitle}</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                {loading ? (
                    <FlatList
                        data={[1, 2, 3, 4, 5, 6]}
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
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        textTransform: 'capitalize',
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
