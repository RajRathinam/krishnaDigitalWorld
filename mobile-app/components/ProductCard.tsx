import React from 'react';
import { View, Text, Pressable, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { ShoppingCart, Heart, Star, Check } from 'lucide-react-native';
import { API_BASE_URL } from '@/services/api';

// Helper to safely parse JSON strings
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

interface ProductCardProps {
  product: any;
  onPress?: () => void;
  isCompact?: boolean;
}

export default function ProductCard({ product, onPress, isCompact }: ProductCardProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isAdding, setIsAdding] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);

  // Normalize fields based on the raw product object
  const name = product.name || product.shortName || product.productName || '';
  const price = product.discountPrice ?? product.salePrice ?? product.price ?? product.originalPrice ?? 0;
  const originalPrice = product.price ?? product.originalPrice ?? product._originalPrice ?? price;
  const discount = product.discountPercentage ??
    (originalPrice > price && originalPrice > 0 ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);
  const rating = product.rating ?? product.avgRating ?? 0;
  const badge = product.badge || (product.isFeatured ? 'Featured' : undefined);
  const wishlisted = isInWishlist(product.id || product._id);

  // Extract image
  let imageUrl = null;

  // Check direct image field
  if (product.image) {
    imageUrl = product.image.startsWith('http') ? product.image : `${API_BASE_URL}${product.image}`;
    if (imageUrl.includes('cloudinary.com') && imageUrl.includes('/upload/')) {
        imageUrl = imageUrl.replace('/upload/', '/upload/w_400,q_auto,f_auto/');
    }
  }
  // Parse colorsAndImages
  else {
    const colorsAndImages = parseJSONSafe(product.colorsAndImages, {});
    const colorKeys = Object.keys(colorsAndImages);

    if (colorKeys.length > 0) {
      const firstColor = colorKeys[0];
      const colorImages = colorsAndImages[firstColor];

      if (Array.isArray(colorImages) && colorImages.length > 0) {
        const firstImg = colorImages[0];
        const imgPath = typeof firstImg === 'string' ? firstImg : (firstImg.url || firstImg.publicId);

        if (imgPath) {
          imageUrl = imgPath.startsWith('http') ? imgPath : `${API_BASE_URL}${imgPath}`;
          if (imageUrl.includes('cloudinary.com') && imageUrl.includes('/upload/')) {
              imageUrl = imageUrl.replace('/upload/', '/upload/w_400,q_auto,f_auto/');
          }
        }
      }
    }
    // Fallback to images array
    else if (Array.isArray(product.images) && product.images.length > 0) {
      const firstImg = product.images[0];
      const imgPath = typeof firstImg === 'string' ? firstImg : (firstImg.url || firstImg);
      if (imgPath) {
        imageUrl = imgPath.startsWith('http') ? imgPath : `${API_BASE_URL}${imgPath}`;
        if (imageUrl.includes('cloudinary.com') && imageUrl.includes('/upload/')) {
            imageUrl = imageUrl.replace('/upload/', '/upload/w_400,q_auto,f_auto/');
        }
      }
    }
  }

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: '/product/[id]',
        params: { id: product.slug || product.id || product._id }
      });
    }
  };

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      const colorsAndImages = parseJSONSafe(product.colorsAndImages, {});
      const colorNames = Object.keys(colorsAndImages);
      const defaultColor = colorNames.length > 0 ? colorNames[0] : undefined;

      await addToCart(product.id || product._id, 1, defaultColor);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 1200);
    } finally {
      setIsAdding(false);
    }
  };

  const formatPrice = (p: number) => {
    return `₹${Number(p).toLocaleString('en-IN')}`;
  };

  return (
    <Pressable
      onPress={handlePress}
      className={`bg-white rounded-xl border border-gray-200 p-3 mb-4 shadow-sm active:scale-95 flex flex-col ${isCompact ? 'w-[180px] mr-4' : 'w-[48%]'}`}
    >
      {/* Wishlist Button (absolute top right) */}
      <TouchableOpacity 
        onPress={(e) => {
          e.stopPropagation();
          toggleWishlist(product, imageUrl || undefined);
        }}
        className="absolute top-2 right-2 z-10 p-2 bg-white/80 rounded-full shadow-sm"
      >
        <Heart 
          size={14} 
          color={wishlisted ? "#EF4444" : "#9CA3AF"} 
          fill={wishlisted ? "#EF4444" : "transparent"} 
        />
      </TouchableOpacity>

      {/* Badge (absolute top left) */}
      {badge && (
        <View className="absolute top-2 left-2 z-10 bg-accent px-2 py-1 rounded shadow-sm">
          <Text className="text-white text-[10px] font-bold">{badge}</Text>
        </View>
      )}

      {/* Image Container */}
      <View className="aspect-square w-full rounded-lg bg-white items-center justify-center mb-3 overflow-hidden relative">
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        ) : (
          <View className="w-full h-full items-center justify-center bg-gray-50">
            <Text className="text-gray-400 text-xs">No Image</Text>
          </View>
        )}
        
        {/* Discount Tag */}
        {discount > 0 && (
          <View className="absolute bottom-2 right-0 z-10 bg-green-600/90 px-2 py-1 rounded shadow-sm border border-green-500/20">
            <Text className="text-white text-[9px] font-bold">{Math.round(discount)}% OFF</Text>
          </View>
        )}
      </View>

      {/* Content Container */}
      <View className="flex-col flex-1">
        {/* Title */}
        <Text className="text-gray-900 font-medium text-sm leading-snug mb-2" numberOfLines={2} style={{ minHeight: 40 }}>
          {name}
        </Text>

        {/* Rating */}
        <View className="flex-row items-center mb-2 gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star 
              key={star} 
              size={12} 
              color={star <= Math.floor(rating) ? "#EAB308" : star <= rating ? "#EAB308" : "#E5E7EB"}
              fill={star <= Math.floor(rating) ? "#EAB308" : star <= rating ? "rgba(234,179,8,0.5)" : "#E5E7EB"}
            />
          ))}
        </View>

        {/* Price section */}
        <View className="mt-auto">
          <View className="flex-col gap-2 mb-4">
            <View className="flex-row items-center gap-2 flex-wrap">
              <Text className="text-gray-900 font-bold text-base leading-none">
                {formatPrice(price)}
              </Text>
              {originalPrice > price && (
                <Text className="text-red-500 text-xs line-through font-medium">
                  {formatPrice(originalPrice)}
                </Text>
              )}
            </View>
            
            {originalPrice > price && (
              <View className="self-start bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100/50">
                <Text className="text-emerald-600 text-[10px] font-bold">
                  SAVE {formatPrice(originalPrice - price)}
                </Text>
              </View>
            )}
          </View>

          {/* Add to Cart Button */}
          <TouchableOpacity
            onPress={handleAddToCart}
            disabled={isAdding}
            className={`w-full flex-row items-center justify-center gap-1.5 py-2.5 rounded-lg active:scale-95 ${
              showSuccess 
                ? 'bg-emerald-500 shadow-sm' 
                : 'bg-gray-900 shadow-sm'
            }`}
          >
            {showSuccess ? (
              <>
                <Check size={14} color="#FFFFFF" />
                <Text className="text-white text-xs font-medium">Added</Text>
              </>
            ) : isAdding ? (
              <>
                <ActivityIndicator size={14} color="#FFFFFF" />
                <Text className="text-white text-xs font-medium">Wait...</Text>
              </>
            ) : (
              <>
                <ShoppingCart size={14} color="#FFFFFF" />
                <Text className="text-white text-xs font-medium">Add to Cart</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
}
