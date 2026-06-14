import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, useWindowDimensions, Share, Alert, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { productApi, API_BASE_URL } from '@/services/api';
import { useCart } from '@/contexts/CartContext';
import { ChevronLeft, Share2, Heart, Star, ShoppingCart, Check, Package, ChevronUp, ChevronDown } from 'lucide-react-native';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import { ProductDetailSkeleton, ProductCardSkeleton } from '@/components/SkeletonLoader';

// Helpers
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

const getImageUrl = (path: string) => {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
};

const getStockForColor = (stock: any, colorName: string) => {
  if (!stock || !colorName) return 0;
  const s = typeof stock === 'string' ? parseJSONSafe(stock, {}) : stock;
  if (typeof s === 'number') return s;
  if (typeof s === 'object' && !Array.isArray(s)) {
    const v = s[colorName];
    if (v != null) {
      const n = typeof v === 'number' ? v : parseInt(String(v));
      return isNaN(n) ? 0 : n;
    }
  }
  return 0;
};

const formatKey = (key: string) =>
  String(key)
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

const formatValue = (val: any): string => {
  if (val === null || val === undefined || val === '') return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (Array.isArray(val)) {
    if (!val.length) return '—';
    if (typeof val[0] === 'object' && val[0] !== null)
      return val.map((item) => Object.entries(item).map(([k, v]) => `${formatKey(k)}: ${v}`).join(', ')).join(' | ');
    return val.join(', ');
  }
  return String(val);
};

const flattenToRows = (obj: any) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj))
    return [{ label: 'Value', value: formatValue(obj) }];
  const rows: any[] = [];
  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined || val === '') continue;
    const label = formatKey(key);
    if (Array.isArray(val)) {
      rows.push({ label, value: formatValue(val) });
    } else if (typeof val === 'object') {
      for (const [subKey, subVal] of Object.entries(val)) {
        if (subVal === null || subVal === undefined || subVal === '') continue;
        const subLabel = `${label} · ${formatKey(subKey)}`;
        rows.push({
          label: subLabel,
          value: typeof subVal === 'object' && !Array.isArray(subVal)
            ? JSON.stringify(subVal)
            : formatValue(subVal),
        });
      }
    } else {
      rows.push({ label, value: formatValue(val) });
    }
  }
  return rows;
};

const buildSpecSections = (attributes: any) => {
  if (!attributes || typeof attributes !== 'object' || !Object.keys(attributes).length) return [];
  const isFlat = Object.values(attributes).every((v) => v === null || typeof v !== 'object');
  if (isFlat) {
    const rows = Object.entries(attributes)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => ({ label: formatKey(k), value: formatValue(v) }));
    return rows.length ? [{ title: null, rows }] : [];
  }
  return Object.entries(attributes)
    .map(([k, v]) => ({ title: formatKey(k), rows: flattenToRows(v) }))
    .filter((s) => s.rows.length > 0);
};

const isLongValue = (val: any) => String(val).length > 20;

const renderSpecGrid = (rows: any[], isLastInSection: boolean) => {
  const items = [...rows];
  const renderedRows = [];
  
  while (items.length > 0) {
    const item1 = items.shift();
    if (!item1) break;
    
    if (isLongValue(item1.value) || items.length === 0) {
      renderedRows.push({ type: 'full', item1 });
    } else {
      const item2 = items.shift();
      if (!item2) break;
      
      if (isLongValue(item2.value)) {
        items.unshift(item2);
        renderedRows.push({ type: 'half-empty', item1 });
      } else {
        renderedRows.push({ type: 'half-half', item1, item2 });
      }
    }
  }

  return (
    <View className="w-full">
      {renderedRows.map((row, idx) => {
        const isLastRow = idx === renderedRows.length - 1;
        const borderB = (isLastRow && isLastInSection) ? '' : 'border-b border-gray-200';
        
        if (row.type === 'full') {
          return (
            <View key={idx} className={`w-full p-3 ${borderB}`}>
              <Text className="text-[11px] text-gray-500 mb-1" numberOfLines={1}>{row.item1.label}</Text>
              <Text className="text-[13px] font-medium text-gray-900 leading-tight">{row.item1.value}</Text>
            </View>
          );
        } else if (row.type === 'half-empty') {
          return (
            <View key={idx} className={`w-full flex-row ${borderB}`}>
               <View className="flex-1 p-3 border-r border-gray-200">
                  <Text className="text-[11px] text-gray-500 mb-1" numberOfLines={1}>{row.item1.label}</Text>
                  <Text className="text-[13px] font-medium text-gray-900 leading-tight">{row.item1.value}</Text>
               </View>
               <View className="flex-1" />
            </View>
          );
        } else {
          return (
            <View key={idx} className={`w-full flex-row ${borderB}`}>
               <View className="flex-1 p-3 border-r border-gray-200">
                  <Text className="text-[11px] text-gray-500 mb-1" numberOfLines={1}>{row.item1.label}</Text>
                  <Text className="text-[13px] font-medium text-gray-900 leading-tight">{row.item1.value}</Text>
               </View>
               <View className="flex-1 p-3">
                  <Text className="text-[11px] text-gray-500 mb-1" numberOfLines={1}>{row.item2!.label}</Text>
                  <Text className="text-[13px] font-medium text-gray-900 leading-tight">{row.item2!.value}</Text>
               </View>
            </View>
          );
        }
      })}
    </View>
  );
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await productApi.getProduct(id as string);
      const data = res.data || res;
      setProduct(data);
    } catch (error) {
      console.error('Failed to fetch product', error);
      Alert.alert('Error', 'Product not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (product) {
      const attributes = parseJSONSafe(product.attributes, {});
      const sections = buildSpecSections(attributes);
      const init: Record<string, boolean> = {};
      sections.forEach(s => { if (s.title) init[s.title] = true; });
      setOpenSections(init);
    }
  }, [product]);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!product?.id) return;
      setRelatedLoading(true);
      try {
        if (product.relatedProducts?.length > 0) {
          setRelatedProducts(product.relatedProducts.slice(0, 4));
        } else {
          const res = await productApi.getRelatedProducts(product.id);
          const d = res.data || res;
          let arr = d.success && d.data ? d.data : Array.isArray(d) ? d : d.relatedProducts || d.products || [];
          if (!Array.isArray(arr)) arr = [];
          setRelatedProducts(arr.filter((p: any) => p.id !== product.id).slice(0, 4));
        }
      } catch (error) {
        console.error('Failed to fetch related products', error);
      } finally {
        setRelatedLoading(false);
      }
    };
    if (product) fetchRelated();
  }, [product]);

  const handleShare = async () => {
    if (!product) return;
    try {
      const shareUrl = `${API_BASE_URL}/product/${product.slug || product.id}`;
      await Share.share({
        message: `Check out ${product.name} on Krishna Stores!\n${shareUrl}`,
      });
    } catch (error) {
      console.error('Share error', error);
    }
  };

  const handleAddToCart = async () => {
    const colorNames = Object.keys(parseJSONSafe(product?.colorsAndImages, {}));
    const selectedColorName = colorNames[selectedColor];
    if (selectedColorName && getStockForColor(product?.stock, selectedColorName) <= 0) {
      Alert.alert('Out of Stock', 'The selected color is currently out of stock.');
      return;
    }
    setIsAddingToCart(true);
    try {
      await addToCart(product.id, 1, selectedColorName);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    const colorNames = Object.keys(parseJSONSafe(product?.colorsAndImages, {}));
    const selectedColorName = colorNames[selectedColor];
    if (selectedColorName && getStockForColor(product?.stock, selectedColorName) <= 0) {
      Alert.alert('Out of Stock', 'The selected color is currently out of stock.');
      return;
    }
    setIsBuyingNow(true);
    try {
      await addToCart(product.id, 1, selectedColorName);
      router.push('/cart');
    } finally {
      setIsBuyingNow(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#FAF9F6]" edges={['bottom', 'left', 'right']}>
        <Header />
        <ProductDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-[#FAF9F6] justify-center items-center">
        <Package size={64} color="#D1D5DB" />
        <Text className="text-lg font-bold text-gray-900 mt-4 font-heading">Product Not Found</Text>
        <TouchableOpacity className="mt-6 bg-[#FFC107] px-6 py-3 rounded-lg" onPress={() => router.back()}>
          <Text className="font-bold text-gray-900 font-body">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Derived properties
  const price = product.discountPrice ?? product.price ?? 0;
  const originalPrice = product.price ?? price;
  const discount = product.discountPercentage ?? (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);
  const rating = product.rating || 0;
  const reviewsCount = product.totalReviews || 0;

  const colorsAndImages = parseJSONSafe(product.colorsAndImages, {});
  const colorNames = Object.keys(colorsAndImages);
  const selectedColorName = colorNames[selectedColor] || "";
  const selectedImages = colorNames.length > 0 && colorsAndImages[selectedColorName]
    ? colorsAndImages[selectedColorName]
    : (Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image]);

  const specSections = buildSpecSections(parseJSONSafe(product.attributes, {}));

  const onScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setCurrentImageIndex(Math.round(index));
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAF9F6]" edges={['bottom', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Image Slider */}
        <View className="bg-[#FFFFFF]">
          {discount > 0 && (
            <View className="absolute top-4 left-4 z-10 bg-green-100 px-2 py-1 rounded">
              <Text className="text-green-800 text-xs font-bold font-body">{Math.round(discount)}% OFF</Text>
            </View>
          )}

          <View className="absolute top-4 right-4 z-10 gap-3">
            <TouchableOpacity 
              onPress={handleShare}
              className="w-10 h-10 bg-white/90 rounded-full items-center justify-center shadow-sm"
            >
              <Share2 size={20} color="#111827" />
            </TouchableOpacity>
            <TouchableOpacity 
              className="w-10 h-10 bg-white/90 rounded-full items-center justify-center shadow-sm"
              onPress={() => {/* Wishlist logic */}}
            >
              <Heart size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            {selectedImages.map((img: any, i: number) => {
              const url = typeof img === 'string' ? img : (img?.url || img?.publicId);
              return (
                <View key={i} style={{ width, height: width }}>
                  {url ? (
                    <Image
                       source={{ uri: getImageUrl(url) }}
                       style={{ width: '100%', height: '100%' }}
                       resizeMode="contain"
                    />
                  ) : (
                    <View className="flex-1 bg-gray-50 items-center justify-center">
                      <Package size={64} color="#D1D5DB" />
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Dots */}
          {selectedImages.length > 1 && (
            <View className="flex-row justify-center py-4 gap-2">
              {selectedImages.map((_: any, i: number) => (
                <View
                  key={i}
                  className={`h-2 rounded-full ${i === currentImageIndex ? 'w-5 bg-[#FFC107]' : 'w-2 bg-gray-300'}`}
                />
              ))}
            </View>
          )}
        </View>

        <View className="p-4">
          {/* Brand */}
          <Text className="text-sm text-[#FFC107] font-medium mb-1 font-body">
            {product.brand?.name || product.brand || "Unknown Brand"}
          </Text>

          {/* Title & Rating */}
          <Text className="text-xl font-semibold text-gray-900 mb-2 leading-snug font-heading">
            {product.name}{product.variant ? ` - ${product.variant}` : ""}
          </Text>

          <View className="flex-row items-center gap-2 mb-4">
            <View className="flex-row items-center bg-yellow-50 px-2 py-1 rounded gap-1">
              <Text className="text-yellow-700 font-bold text-xs font-body">{rating}</Text>
              <Star size={12} color="#EAB308" fill="#EAB308" />
            </View>
          </View>

          {/* Price */}
          <View className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
            <View className="flex-row items-baseline gap-2 flex-wrap">
              <Text className="text-3xl font-bold text-gray-900 font-body">₹{Number(price).toLocaleString('en-IN')}</Text>
              {originalPrice > price && (
                <>
                  <Text className="text-lg text-gray-500 line-through font-body">₹{Number(originalPrice).toLocaleString('en-IN')}</Text>
                  <Text className="text-sm text-green-600 font-bold ml-1 font-body">Save ₹{Number(originalPrice - price).toLocaleString('en-IN')}</Text>
                </>
              )}
            </View>
            <Text className="text-gray-500 text-xs mt-1 font-body">Inclusive of all taxes</Text>
          </View>

          {/* Color Selection */}
          {colorNames.length > 0 && (
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-900 mb-3 font-heading">Color: <Text className="text-gray-500 font-medium font-body">{selectedColorName}</Text></Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {colorNames.map((colorName, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      setSelectedColor(i);
                      setCurrentImageIndex(0); // Reset image index
                    }}
                    className={`rounded-lg border-2 p-1 ${selectedColor === i ? 'border-[#FFC107]' : 'border-transparent'}`}
                  >
                    <View className="w-16 h-16 rounded overflow-hidden bg-white items-center justify-center border border-gray-200">
                      {/* Using the first image of the color as thumbnail */}
                      {(colorName as string) && colorsAndImages[colorName as string] && colorsAndImages[colorName as string][0] ? (
                        <Image
                          source={{ uri: getImageUrl(colorsAndImages[colorName][0]?.url || colorsAndImages[colorName][0]) }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="contain"
                        />
                      ) : (
                        <Package size={24} color="#D1D5DB" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Stock Status */}
          {selectedColorName ? (
            <View className={`mb-6 border p-4 rounded-xl ${
              getStockForColor(product?.stock, selectedColorName) > 0
                ? 'bg-green-50/50 border-green-200'
                : 'bg-red-50/50 border-red-200'
            }`}>
              <Text
                className={`text-sm font-bold font-body ${
                  getStockForColor(product?.stock, selectedColorName) > 0
                    ? 'text-green-700'
                    : 'text-red-700'
                }`}
              >
                {getStockForColor(product?.stock, selectedColorName) > 0
                  ? `In Stock: ${getStockForColor(
                      product?.stock,
                      selectedColorName
                    )} available`
                  : 'Out of Stock'}
              </Text>
            </View>
          ) : null}

          {/* Description */}
          {product.description && (
            <View className="mb-6">
              <Text className="text-base font-bold text-gray-900 mb-2 font-heading">Description</Text>
              <Text className="text-sm text-gray-600 leading-relaxed font-body">{product.description}</Text>
            </View>
          )}

          {/* Specifications */}
          {specSections.length > 0 && (
            <View className="mb-8">
              <Text className="text-base font-bold text-gray-900 mb-3 font-heading">Specifications</Text>
              
              {specSections.length === 1 && !specSections[0].title ? (
                 <View className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                   {renderSpecGrid(showAllSpecs ? specSections[0].rows : specSections[0].rows.slice(0, 6), true)}
                   {specSections[0].rows.length > 6 && (
                     <TouchableOpacity
                       onPress={() => setShowAllSpecs(!showAllSpecs)}
                       className="w-full py-3 flex-row items-center justify-center gap-2 border-t border-gray-200 bg-gray-50"
                     >
                       <Text className="text-[13px] text-gray-500 font-medium">
                         {showAllSpecs ? 'Show less' : `Show all specs (${specSections[0].rows.length})`}
                       </Text>
                       {showAllSpecs ? <ChevronUp size={16} color="#6B7280" /> : <ChevronDown size={16} color="#6B7280" />}
                     </TouchableOpacity>
                   )}
                 </View>
              ) : (
                <View className="space-y-3">
                  {specSections.map((section, si) => {
                    const sectionTitle = section.title || `section-${si}`;
                    const isOpen = openSections[sectionTitle] !== false;
                    return (
                      <View key={si} className="rounded-xl border border-gray-200 overflow-hidden bg-white mb-3">
                        <TouchableOpacity
                          onPress={() => setOpenSections(prev => ({ ...prev, [sectionTitle]: !prev[sectionTitle] }))}
                          className="w-full flex-row items-center justify-between px-4 py-3 bg-gray-50"
                        >
                          <View className="flex-row items-center gap-3">
                            <View className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                              <Text className="text-yellow-700 text-sm font-bold">{si + 1}</Text>
                            </View>
                            <View>
                              <Text className="text-sm font-bold text-gray-900 font-heading">{section.title}</Text>
                              <Text className="text-[11px] text-gray-500">{section.rows.length} specs</Text>
                            </View>
                          </View>
                          {isOpen ? <ChevronUp size={16} color="#6B7280" /> : <ChevronDown size={16} color="#6B7280" />}
                        </TouchableOpacity>
                        {isOpen && renderSpecGrid(section.rows, true)}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* Related Products */}
          {relatedLoading ? (
            <View className="mb-8 mt-4">
              <Text className="text-lg font-bold text-gray-900 mb-4 font-heading">You May Also Like</Text>
              <View className="flex-row flex-wrap justify-between">
                {[1, 2, 3, 4].map(i => <ProductCardSkeleton key={i} />)}
              </View>
            </View>
          ) : relatedProducts.length > 0 ? (
            <View className="mb-8 mt-4">
              <Text className="text-lg font-bold text-gray-900 mb-4 font-heading">You May Also Like</Text>
              <View className="flex-row flex-wrap justify-between">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="flex-row items-center p-4 bg-white border-t border-gray-200 shadow gap-4 pb-8">
        <TouchableOpacity
          onPress={handleAddToCart}
          disabled={isAddingToCart || isBuyingNow}
          className={`flex-1 flex-row items-center justify-center p-3 border-2 border-[#FFC107] rounded-xl gap-2 ${isAddingToCart ? 'opacity-70' : ''}`}
        >
          {isAddingToCart ? (
            <ActivityIndicator size="small" color="#FFC107" />
          ) : (
            <>
              <ShoppingCart size={20} color="#D97706" />
              <Text className="font-bold text-yellow-700 font-body">Add to Cart</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleBuyNow}
          disabled={isAddingToCart || isBuyingNow}
          className={`flex-1 items-center justify-center p-3 bg-[#111827] rounded-xl ${isBuyingNow ? 'opacity-70' : ''}`}
        >
          {isBuyingNow ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="font-bold text-white font-body">Buy Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
