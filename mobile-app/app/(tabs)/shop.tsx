import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Modal,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import {
    Search,
    SlidersHorizontal,
    ChevronDown,
    ChevronUp,
    X,
    Grid3x3,
    List,
    Check
} from 'lucide-react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import { ProductCardSkeleton } from '@/components/SkeletonLoader';
import api, { productApi, categoryApi } from '@/services/api';

// Sort options
const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'name-asc', label: 'Name: A to Z' },
    { value: 'name-desc', label: 'Name: Z to A' },
    { value: 'discount', label: 'Best Discount' },
];

// Price ranges
const PRICE_RANGES = [
    { label: 'Any Price', min: null, max: null },
    { label: 'Under ₹500', min: null, max: 500 },
    { label: '₹500 – ₹1,000', min: 500, max: 1000 },
    { label: '₹1,000 – ₹2,500', min: 1000, max: 2500 },
    { label: '₹2,500 – ₹5,000', min: 2500, max: 5000 },
    { label: '₹5,000 – ₹10,000', min: 5000, max: 10000 },
    { label: '₹10,000 – ₹25,000', min: 10000, max: 25000 },
    { label: 'Above ₹25,000', min: 25000, max: null },
];

export default function ShopScreen() {
    const insets = useSafeAreaInsets();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState('newest');
    const params = useLocalSearchParams();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [showSortModal, setShowSortModal] = useState(false);
    const [brandSearch, setBrandSearch] = useState('');
    const [expandedFilters, setExpandedFilters] = useState({
        brand: true,
        price: true,
        sort: false,
        category: true,
    });

    const abortControllerRef = useRef<AbortController | null>(null);

    // ── Fetch products ────────────────────────────────────────────────────────
    const fetchProducts = useCallback(async (isRefresh = false) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        isRefresh ? setRefreshing(true) : setLoading(true);

        try {
            const queryParams: any = { page: 1, limit: 48 };

            if (selectedBrands.length) {
                queryParams.brandId = selectedBrands[0];
            }

            if (selectedPriceRange !== null) {
                const range = PRICE_RANGES[selectedPriceRange];
                if (range.min != null) queryParams.minPrice = range.min;
                if (range.max != null) queryParams.maxPrice = range.max;
            }

            switch (sortBy) {
                case 'newest':
                    queryParams.sortBy = 'created_at';
                    queryParams.sortOrder = 'desc';
                    break;
                case 'price-low':
                    queryParams.sortBy = 'price';
                    queryParams.sortOrder = 'asc';
                    break;
                case 'price-high':
                    queryParams.sortBy = 'price';
                    queryParams.sortOrder = 'desc';
                    break;
                case 'name-asc':
                    queryParams.sortBy = 'name';
                    queryParams.sortOrder = 'asc';
                    break;
                case 'name-desc':
                    queryParams.sortBy = 'name';
                    queryParams.sortOrder = 'desc';
                    break;
                case 'discount':
                    queryParams.sortBy = 'discountPercentage';
                    queryParams.sortOrder = 'desc';
                    break;
                default:
                    queryParams.sortBy = 'created_at';
                    queryParams.sortOrder = 'desc';
            }

            const response = await productApi.getProducts({
                ...queryParams,
                categorySlug: selectedCategory || undefined,
                subcategory: selectedSubcategory || undefined,
            });
            const data = response?.data || response;
            setProducts(data.products || []);
        } catch (err: any) {
            if (err.code !== 'ERR_CANCELED' && err.name !== 'AbortError') {
                console.error('Failed to load products', err);
            }
        } finally {
            isRefresh ? setRefreshing(false) : setLoading(false);
            abortControllerRef.current = null;
        }
    }, [selectedBrands, selectedPriceRange, sortBy, selectedCategory, selectedSubcategory]);

    // ── Fetch brands ──────────────────────────────────────────────────────────
    const fetchBrands = useCallback(async () => {
        try {
            const response = await api.get('/brands');
            const data = response.data?.data || response.data;
            setBrands(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load brands', err);
        }
    }, []);

    // ── Fetch categories ──────────────────────────────────────────────────────
    const fetchCategories = useCallback(async () => {
        try {
            const response = await categoryApi.getCategories();
            const data = response?.data || response;
            setCategories(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load categories', err);
        }
    }, []);

    useEffect(() => {
        fetchBrands();
        fetchCategories();

        if (params.category) setSelectedCategory(params.category as string);
        if (params.subcategory) setSelectedSubcategory(params.subcategory as string);

        return () => {
            if (abortControllerRef.current) abortControllerRef.current.abort();
        };
    }, [params.category, params.subcategory]);

    useEffect(() => {
        fetchProducts();
    }, [selectedBrands, selectedPriceRange, sortBy, selectedCategory, selectedSubcategory]);

    useFocusEffect(
        useCallback(() => {
            return () => {
                setSelectedBrands([]);
                setSelectedPriceRange(null);
                setSelectedCategory(null);
                setSelectedSubcategory(null);
                setSortBy('newest');
                setShowFilters(false);
            };
        }, [])
    );

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleSortChange = (newSortBy: string) => {
        setSortBy(newSortBy);
        setShowSortModal(false);
    };

    const toggleBrand = (brandId: string) => {
        setSelectedBrands(prev =>
            prev.includes(brandId) ? [] : [brandId]
        );
    };

    const handlePriceRangeSelect = (idx: number) => {
        setSelectedPriceRange(idx === 0 ? null : idx);
    };

    const clearAllFilters = () => {
        setSelectedBrands([]);
        setSelectedPriceRange(null);
        setSelectedCategory(null);
        setSelectedSubcategory(null);
        setSortBy('newest');
        setShowFilters(false);
    };

    const filteredBrands = brands.filter(brand =>
        brand.name?.toLowerCase().includes(brandSearch.toLowerCase())
    );

    // ── Derived state ─────────────────────────────────────────────────────────
    const hasActiveFilters =
        selectedBrands.length > 0 ||
        selectedPriceRange !== null ||
        selectedCategory !== null ||
        selectedSubcategory !== null;

    const activePriceLabel =
        selectedPriceRange !== null ? PRICE_RANGES[selectedPriceRange]?.label : null;
    const activeCategory = categories.find(c => c.slug === selectedCategory);
    const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Newest';

    const filterCount =
        selectedBrands.length +
        (selectedPriceRange !== null ? 1 : 0) +
        (selectedCategory ? 1 : 0) +
        (selectedSubcategory ? 1 : 0);

    // ── Badge animation ───────────────────────────────────────────────────────
    const badgeScale = useSharedValue(0);

    useEffect(() => {
        if (filterCount > 0) {
            badgeScale.value = withSequence(withSpring(1.2), withSpring(1));
        } else {
            badgeScale.value = withSpring(0);
        }
    }, [filterCount]);

    const animatedBadgeStyle = useAnimatedStyle(() => ({
        transform: [{ scale: badgeScale.value }],
        opacity: interpolate(badgeScale.value, [0, 0.5], [0, 1], Extrapolate.CLAMP),
    }));

    // ── Sub-components ────────────────────────────────────────────────────────
    const FilterSection = ({ title, expanded, onToggle, children }: any) => (
        <View style={styles.filterSection}>
            <TouchableOpacity onPress={onToggle} style={styles.filterHeader}>
                <Text style={styles.filterTitle}>{title}</Text>
                {expanded ? (
                    <ChevronUp size={16} color="#6B7280" />
                ) : (
                    <ChevronDown size={16} color="#6B7280" />
                )}
            </TouchableOpacity>
            {expanded && <View style={styles.filterContent}>{children}</View>}
        </View>
    );

    const FiltersContent = () => (
        <View>
            {/* Sort */}
            <FilterSection
                title="Sort By"
                expanded={expandedFilters.sort}
                onToggle={() =>
                    setExpandedFilters(prev => ({ ...prev, sort: !prev.sort }))
                }
            >
                {SORT_OPTIONS.map(option => (
                    <TouchableOpacity
                        key={option.value}
                        style={[
                            styles.optionItem,
                            sortBy === option.value && styles.optionItemActive,
                        ]}
                        onPress={() => handleSortChange(option.value)}
                    >
                        <View
                            style={[
                                styles.checkbox,
                                sortBy === option.value && styles.checkboxActive,
                            ]}
                        >
                            {sortBy === option.value && (
                                <Check size={12} color="#FFFFFF" />
                            )}
                        </View>
                        <Text
                            style={[
                                styles.optionText,
                                sortBy === option.value && styles.optionTextActive,
                            ]}
                        >
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </FilterSection>

            {/* Category */}
            <FilterSection
                title="Category"
                expanded={expandedFilters.category}
                onToggle={() =>
                    setExpandedFilters(prev => ({ ...prev, category: !prev.category }))
                }
            >
                <ScrollView style={styles.categoryList} nestedScrollEnabled>
                    <TouchableOpacity
                        style={[
                            styles.optionItem,
                            selectedCategory === null && styles.optionItemActive,
                        ]}
                        onPress={() => {
                            setSelectedCategory(null);
                            setSelectedSubcategory(null);
                        }}
                    >
                        <View
                            style={[
                                styles.checkbox,
                                selectedCategory === null && styles.checkboxActive,
                            ]}
                        >
                            {selectedCategory === null && (
                                <Check size={12} color="#FFFFFF" />
                            )}
                        </View>
                        <Text style={styles.optionText}>All Categories</Text>
                    </TouchableOpacity>

                    {categories.map(cat => (
                        <View key={cat.id || cat.slug}>
                            <TouchableOpacity
                                style={[
                                    styles.optionItem,
                                    selectedCategory === cat.slug && styles.optionItemActive,
                                ]}
                                onPress={() => {
                                    setSelectedCategory(cat.slug);
                                    setSelectedSubcategory(null);
                                }}
                            >
                                <View
                                    style={[
                                        styles.checkbox,
                                        selectedCategory === cat.slug && styles.checkboxActive,
                                    ]}
                                >
                                    {selectedCategory === cat.slug && (
                                        <Check size={12} color="#FFFFFF" />
                                    )}
                                </View>
                                <Text style={[styles.optionText, { textTransform: 'capitalize' }]}>{cat.name}</Text>
                            </TouchableOpacity>

                            {selectedCategory === cat.slug &&
                                Array.isArray(cat.subcategories) &&
                                cat.subcategories.length > 0 && (
                                    <View style={styles.subcategoryFilters}>
                                        {cat.subcategories.map((sub: string) => (
                                            <TouchableOpacity
                                                key={sub}
                                                style={[
                                                    styles.optionItem,
                                                    selectedSubcategory === sub &&
                                                    styles.optionItemActive,
                                                ]}
                                                onPress={() =>
                                                    setSelectedSubcategory(
                                                        selectedSubcategory === sub ? null : sub
                                                    )
                                                }
                                            >
                                                <View
                                                    style={[
                                                        styles.checkbox,
                                                        selectedSubcategory === sub &&
                                                        styles.checkboxActive,
                                                    ]}
                                                >
                                                    {selectedSubcategory === sub && (
                                                        <Check size={12} color="#FFFFFF" />
                                                    )}
                                                </View>
                                                <Text style={[styles.optionText, { textTransform: 'capitalize' }]}>{sub}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                        </View>
                    ))}
                </ScrollView>
            </FilterSection>

            {/* Brand */}
            <FilterSection
                title="Brand"
                expanded={expandedFilters.brand}
                onToggle={() =>
                    setExpandedFilters(prev => ({ ...prev, brand: !prev.brand }))
                }
            >
                <View style={styles.searchInputContainer}>
                    <Search size={16} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search brands..."
                        placeholderTextColor="#9CA3AF"
                        value={brandSearch}
                        onChangeText={setBrandSearch}
                    />
                </View>

                {selectedBrands.length > 0 && (
                    <View style={styles.selectedChips}>
                        {selectedBrands.map(brandId => {
                            const brand = brands.find(b => String(b.id) === brandId);
                            return brand ? (
                                <View key={brandId} style={styles.chip}>
                                    <Text style={styles.chipText}>{brand.name}</Text>
                                    <TouchableOpacity onPress={() => toggleBrand(brandId)}>
                                        <X size={12} color="#FFC107" />
                                    </TouchableOpacity>
                                </View>
                            ) : null;
                        })}
                    </View>
                )}

                <ScrollView style={styles.brandList} nestedScrollEnabled>
                    {filteredBrands.map(brand => (
                        <TouchableOpacity
                            key={brand.id}
                            style={[
                                styles.optionItem,
                                selectedBrands.includes(String(brand.id)) &&
                                styles.optionItemActive,
                            ]}
                            onPress={() => toggleBrand(String(brand.id))}
                        >
                            <View
                                style={[
                                    styles.checkbox,
                                    selectedBrands.includes(String(brand.id)) &&
                                    styles.checkboxActive,
                                ]}
                            >
                                {selectedBrands.includes(String(brand.id)) && (
                                    <Check size={12} color="#FFFFFF" />
                                )}
                            </View>
                            <Text style={styles.optionText}>{brand.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </FilterSection>

            {/* Price Range */}
            <FilterSection
                title="Price Range"
                expanded={expandedFilters.price}
                onToggle={() =>
                    setExpandedFilters(prev => ({ ...prev, price: !prev.price }))
                }
            >
                {PRICE_RANGES.map((range, idx) => {
                    const isSelected =
                        idx === 0 ? selectedPriceRange === null : selectedPriceRange === idx;
                    return (
                        <TouchableOpacity
                            key={idx}
                            style={[styles.optionItem, isSelected && styles.optionItemActive]}
                            onPress={() => handlePriceRangeSelect(idx)}
                        >
                            <View
                                style={[styles.checkbox, isSelected && styles.checkboxActive]}
                            >
                                {isSelected && <Check size={12} color="#FFFFFF" />}
                            </View>
                            <Text style={styles.optionText}>{range.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </FilterSection>
        </View>
    );

    const renderProduct = ({ item }: { item: any }) => {
        if (!item) return null;
        return <ProductCard product={item} />;
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView edges={['left', 'right']} style={styles.container}>
            <Header />

            {/* Filter Bar */}
            <View style={styles.filterBar}>
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setShowFilters(true)}
                >
                    <SlidersHorizontal size={18} color="#6B7280" />
                    <Text style={styles.filterButtonText}>Filters</Text>
                    <Animated.View style={[styles.badge, animatedBadgeStyle]}>
                        <Text style={styles.badgeText}>{filterCount}</Text>
                    </Animated.View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.sortButton}
                    onPress={() => setShowSortModal(true)}
                >
                    <Text style={styles.sortButtonText}>{currentSortLabel}</Text>
                    <ChevronDown size={16} color="#6B7280" />
                </TouchableOpacity>
            </View>



            {/* Products */}
            {loading ? (
                <View style={styles.productList}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                        {[1, 2, 3, 4, 5, 6].map(i => <ProductCardSkeleton key={i} />)}
                    </View>
                </View>
            ) : products.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.noProductsTitle}>No products found</Text>
                    <Text style={styles.noProductsSubtitle}>
                        Try adjusting your filters
                    </Text>
                    <TouchableOpacity
                        style={styles.browseButton}
                        onPress={clearAllFilters}
                    >
                        <Text style={styles.browseButtonText}>Browse All Products</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={products}
                    renderItem={renderProduct}
                    keyExtractor={item =>
                        item.id?.toString() ||
                        item._id?.toString() ||
                        Math.random().toString()
                    }
                    numColumns={2}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.productList}
                    columnWrapperStyle={styles.columnWrapper}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => fetchProducts(true)}
                            colors={['#FFC107']}
                        />
                    }
                    initialNumToRender={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                />
            )}

            {/* Filters Modal */}
            <Modal
                visible={showFilters}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowFilters(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowFilters(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Filters</Text>
                                    <TouchableOpacity onPress={() => setShowFilters(false)}>
                                        <X size={24} color="#111827" />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    style={styles.modalBody}
                                >
                                    <FiltersContent />
                                </ScrollView>
                                <TouchableOpacity
                                    style={[styles.applyButton, { marginBottom: Math.max(insets.bottom, 16) }]}
                                    onPress={() => setShowFilters(false)}
                                >
                                    <Text style={styles.applyButtonText}>Apply Filters</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Sort Modal */}
            <Modal
                visible={showSortModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSortModal(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowSortModal(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.sortModalContent}>
                            <Text style={styles.sortModalTitle}>Sort By</Text>
                            {SORT_OPTIONS.map(option => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.sortOption,
                                        sortBy === option.value && styles.sortOptionActive,
                                    ]}
                                    onPress={() => handleSortChange(option.value)}
                                >
                                    <Text
                                        style={[
                                            styles.sortOptionText,
                                            sortBy === option.value &&
                                            styles.sortOptionTextActive,
                                        ]}
                                    >
                                        {option.label}
                                    </Text>
                                    {sortBy === option.value && (
                                        <Check size={16} color="#FFC107" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAF9F6', // Premium luxury background color from web
    },
    filterBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        marginTop: 8,
    },
    filterButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 8,
        position: 'relative',
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        fontFamily: 'DMSans-Medium',
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 6,
    },
    sortButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        fontFamily: 'DMSans-Medium',
    },
    viewToggle: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 2,
    },
    viewButton: {
        padding: 6,
        borderRadius: 6,
    },
    viewButtonActive: {
        backgroundColor: '#FFFFFF',
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#FFC107',
        borderRadius: 12,
        height: 22,
        minWidth: 22,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#FFC107',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#FFFFFF',
        lineHeight: 14,
        fontFamily: 'DMSans-Bold',
    },

    // ── Chips ────────────────────────────────────────────────────────────────
    chipsContainer: {
        paddingVertical: 6,   // gives the ScrollView itself enough height
        marginBottom: 4,
    },
    chipsContentContainer: {
        paddingHorizontal: 16,
        alignItems: 'center', // vertically centres chip text + X icon
        flexDirection: 'row',
        gap: 8,
    },
    activeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8E1',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 7,
        gap: 6,
        borderWidth: 1,
        borderColor: '#FFC107',
    },
    activeChipText: {
        fontSize: 13,
        color: '#92610A',
        fontWeight: '600',
        fontFamily: 'DMSans-Medium',
    },
    clearAllButton: {
        alignSelf: 'center',
    },
    clearAllText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
        textDecorationLine: 'underline',
        fontFamily: 'DMSans-Medium',
    },

    // ── Products ─────────────────────────────────────────────────────────────
    productList: {
        padding: 12,
        paddingBottom: 140,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        gap: 12,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    noProductsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
        fontFamily: 'PlayfairDisplay-Bold',
    },
    noProductsSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 20,
        fontFamily: 'DMSans-Regular',
    },
    browseButton: {
        backgroundColor: '#FFC107',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    browseButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontFamily: 'DMSans-Bold',
    },

    // ── Modals ────────────────────────────────────────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        fontFamily: 'PlayfairDisplay-Bold',
    },
    modalBody: {
        padding: 16,
    },
    applyButton: {
        backgroundColor: '#FFC107',
        margin: 16,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    applyButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
        fontFamily: 'DMSans-Bold',
    },

    // ── Filter panel ──────────────────────────────────────────────────────────
    filterSection: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingVertical: 12,
    },
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    filterTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        fontFamily: 'DMSans-Medium',
    },
    filterContent: {
        marginTop: 12,
        gap: 8,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 8,
        gap: 10,
    },
    optionItemActive: {
        backgroundColor: 'rgba(255, 193, 7, 0.05)',
        borderRadius: 8,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: '#FFC107',
        borderColor: '#FFC107',
    },
    optionText: {
        fontSize: 14,
        color: '#374151',
        fontFamily: 'DMSans-Regular',
    },
    optionTextActive: {
        color: '#FFC107',
        fontWeight: '500',
        fontFamily: 'DMSans-Medium',
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 12,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#111827',
        fontFamily: 'DMSans-Regular',
    },
    selectedChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        gap: 6,
    },
    chipText: {
        fontSize: 12,
        color: '#FFC107',
        fontFamily: 'DMSans-Medium',
    },
    categoryList: {
        maxHeight: 300,
    },
    subcategoryFilters: {
        marginLeft: 24,
        borderLeftWidth: 1,
        borderLeftColor: '#F3F4F6',
        paddingLeft: 8,
    },
    brandList: {
        maxHeight: 200,
    },

    // ── Sort modal ────────────────────────────────────────────────────────────
    sortModalContent: {
        backgroundColor: '#FFFFFF',
        margin: 20,
        borderRadius: 12,
        padding: 16,
    },
    sortModalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
        fontFamily: 'PlayfairDisplay-Bold',
    },
    sortOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    sortOptionActive: {
        backgroundColor: 'rgba(255, 193, 7, 0.05)',
    },
    sortOptionText: {
        fontSize: 14,
        color: '#374151',
        fontFamily: 'DMSans-Regular',
    },
    sortOptionTextActive: {
        color: '#FFC107',
        fontWeight: '500',
        fontFamily: 'DMSans-Medium',
    },
});