import React from 'react';
import { View, Text, ScrollView, Pressable, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingBag, Laptop, Smartphone, Home as HomeIcon, Watch } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import CategoryIcon from '@/components/CategoryIcon';
import ProductCard from '@/components/ProductCard';
import HeroSlider from '@/components/HeroSlider';
import SubcategorySlider from '@/components/SubcategorySlider';
import { ProductShowcase } from '@/components/ProductShowcase';
import Header from '@/components/Header';
import { AdvertisementCarousel } from '@/components/AdvertisementCarousel';
import { TrustBadges } from '@/components/TrustBadges';
import { BrandShowcase } from '@/components/BrandShowcase';
import { CategoryItemSkeleton, ProductCardSkeleton } from '@/components/SkeletonLoader';
import { productApi, categoryApi, API_BASE_URL } from '@/services/api';

const AnimatedTodayDealsBanner = () => {
  const router = useRouter();
  const rotation = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={{ marginHorizontal: 16, marginVertical: 10, marginTop: 16 }}>
      {/* Outer wrapper: padding acts as border width, overflow hidden cuts off the animated background */}
      <View style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', backgroundColor: '#e5e7eb', padding: 3, height: 96 }}>
        
        {/* The rotating loader */}
        <Animated.View style={{
          position: 'absolute',
          width: '200%',
          height: 80,
          backgroundColor: '#FFC107',
          top: '50%',
          left: '-50%',
          marginTop: -40,
          transform: [{ rotate: spin }]
        }} />

        {/* Inner Card container covering the center, leaving only the "border" visible */}
        <View style={{ flex: 1, borderRadius: 15, backgroundColor: '#1a1a1a', overflow: 'hidden', position: 'relative' }}>
          {/* Gradient-like background layers for depth */}
          <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40%', backgroundColor: 'rgba(255,193,7,0.15)' }} />
          <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '20%', backgroundColor: 'rgba(255,255,255,0.05)' }} />

          {/* Text content */}
          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 18, paddingRight: 100 }}>
            <Text style={{ color: '#FFC107', fontSize: 16, fontWeight: '900', lineHeight: 20 }}>Today's Deals</Text>
            <Text style={{ color: '#a3a3a3', fontSize: 11, marginTop: 4 }}>Grab them before they're gone!</Text>
            <Pressable
              onPress={() => router.push('/deals')}
              style={{ backgroundColor: '#FFC107', alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, marginTop: 10 }}
            >
              <Text style={{ color: '#1a1a1a', fontSize: 10, fontWeight: '800' }}>Shop Deals →</Text>
            </Pressable>
          </View>
        </View>

        {/* Floating image or icon */}
        <Image
          source={require('../../assets/images/image_2.png')}
          style={{ width: 100, height: 100, position: 'absolute', bottom: 0, right: 10 }}
          contentFit="contain"
        />
      </View>
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.getCategories,
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['new-arrivals-products'],
    queryFn: () => productApi.getNewArrivals(6),
  });

  const { data: dealsData, isLoading: dealsLoading } = useQuery({
    queryKey: ['deal-of-the-day'],
    queryFn: () => productApi.getDealOfTheDay(6),
  });

  const categories = categoriesData?.data || [];
  const newArrivalsProducts = productsData?.data || [];
  const dealsProducts = dealsData?.data || [];

  const getCategoryIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('mobile')) return <Smartphone size={24} color="#212529" />;
    if (lowerName.includes('electronics')) return <Laptop size={24} color="#212529" />;
    if (lowerName.includes('appliance')) return <HomeIcon size={24} color="#212529" />;
    if (lowerName.includes('watch')) return <Watch size={24} color="#212529" />;
    return <ShoppingBag size={24} color="#212529" />;
  };

  const handleViewAllProducts = () => {
    router.push('/shop');
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['left', 'right']}>
      <Header />
      <AdvertisementCarousel position="homepage_top" />
      <ScrollView showsVerticalScrollIndicator={false} className="bg-gray-50/30 mt-2" contentContainerStyle={{ paddingBottom: 30 }}>
        <HeroSlider />

        {!categoriesLoading && categoriesData?.data && (
          <SubcategorySlider 
            categories={categoriesData.data} 
            onSubcategoryPress={(sub, parentCategory) => {
              router.push({
                pathname: '/category/products',
                params: {
                  category: parentCategory.slug || parentCategory.id,
                  categoryName: parentCategory.name,
                  subcategory: sub.name
                }
              });
            }}
          />
        )}

        <View className="py-3 bg-white">
          <View className="px-5 mb-4">
            <View className="flex-row items-baseline">
              <Text className="text-2xl font-black text-[#1a1a1a]">Shop by </Text>
              <Text className="text-2xl font-black text-[#FFC107]">Category</Text>
            </View>
            <Text className="text-[13px] text-[#666666] mt-1">Explore our wide range of collections</Text>
          </View>
          {categoriesLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
              {[1, 2, 3, 4, 5].map(i => <CategoryItemSkeleton key={i} />)}
            </ScrollView>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {categories.map((cat: any) => (
                <CategoryIcon
                  key={cat.id || cat._id}
                  name={cat.name}
                  icon={getCategoryIcon(cat.name)}
                  imageUrl={cat.image ? `${API_BASE_URL}${cat.image}` : undefined}
                  onPress={() => router.push({
                    pathname: '/category/products',
                    params: { 
                      category: cat.slug || cat.id,
                      categoryName: cat.name 
                    }
                  })}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── Home Appliances Promo Banner ── */}
        <View style={{ marginHorizontal: 16, marginVertical: 10, marginTop: 16 }}>
          {/* Outer wrapper: overflow visible so image can poke out */}
          <View style={{ position: 'relative' }}>
            {/* Card container */}
            <View style={{ borderRadius: 16, overflow: 'hidden', height: 90 }}>
              {/* Gradient background layers */}
              <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: '#FFC107' }} />
              <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '45%', backgroundColor: 'rgba(255,160,0,0.5)' }} />
              <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '25%', backgroundColor: 'rgba(255,255,255,0.1)' }} />

              {/* Text content */}
              <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 18, paddingRight: 130 }}>
                <Text style={{ color: '#1a1a1a', fontSize: 15, fontWeight: '900', lineHeight: 19 }}>Home Appliances</Text>
                <Text style={{ color: 'rgba(0,0,0,0.55)', fontSize: 10, marginTop: 3 }}>Best deals on top brands</Text>
                <Pressable
                  onPress={() => router.push({ pathname: '/shop', params: { category: 'home-appliances' } })}
                  style={{ backgroundColor: '#1a1a1a', alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 }}
                >
                  <Text style={{ color: '#FFC107', fontSize: 10, fontWeight: '800' }}>Shop Now →</Text>
                </Pressable>
              </View>
            </View>

            {/* Image overflowing top-right of the container */}
            <Image
              source={require('../../assets/images/washing Machine.png')}
              style={{ width: 90, height: 100, position: 'absolute', bottom: -4, right: 10, transform: [{ rotate: '15deg' }] }}
              contentFit="contain"
            />
          </View>
        </View>


        <View className="px-5 py-3">
          <View className="flex-row justify-between items-center mb-5">
            <View>
              <View className="flex-row items-baseline">
                <Text className="text-2xl font-black text-[#1a1a1a]">New </Text>
                <Text className="text-2xl font-black text-[#FFC107]">Arrivals</Text>
              </View>
              <Text className="text-[13px] text-[#666666] mt-1">Discover our latest additions</Text>
            </View>
            <Pressable onPress={handleViewAllProducts}>
              <Text className="text-[#FFC107] font-bold text-sm">View All</Text>
            </Pressable>
          </View>

          {productsLoading ? (
            <View className="flex-row flex-wrap justify-between">
              {[1, 2, 3, 4].map(i => <ProductCardSkeleton key={i} />)}
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {newArrivalsProducts.map((item: any) => (
                <ProductCard
                  key={item.id}
                  product={item}
                />
              ))}
            </View>
          )}
        </View>

        <ProductShowcase />

        <AdvertisementCarousel position="homepage_middle" />
        <BrandShowcase />
        <AnimatedTodayDealsBanner />
        
        <View className="px-5 pb-5">
          {dealsLoading ? (
            <View className="flex-row flex-wrap justify-between">
              {[1, 2, 3, 4, 5, 6].map(i => <ProductCardSkeleton key={i} />)}
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {dealsProducts.map((item: any) => (
                <ProductCard
                  key={item.id}
                  product={item}
                />
              ))}
            </View>
          )}
        </View>

        <TrustBadges />
      </ScrollView>
    </SafeAreaView>
  );
}