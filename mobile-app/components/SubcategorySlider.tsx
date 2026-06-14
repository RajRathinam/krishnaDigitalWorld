import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { API_BASE_URL } from '@/services/api';

const ensureArray = (value: any) => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  if (typeof value === "string") {
    try { const p = JSON.parse(value); return Array.isArray(p) ? p : [value]; }
    catch { return [value]; }
  }
  if (typeof value === "object") return Object.values(value);
  return [];
};

const ensureObject = (value: any) => {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (!value) return {};
  try {
    const p = JSON.parse(value);
    return p && typeof p === "object" && !Array.isArray(p) ? p : {};
  } catch { return {}; }
};

interface SubcategorySliderProps {
  categories: any[];
  onSubcategoryPress?: (sub: any, parentCategory: any) => void;
}

export default function SubcategorySlider({ categories, onSubcategoryPress }: SubcategorySliderProps) {
  // Process and randomize subcategories
  const subcategories = useMemo(() => {
    if (!categories || !categories.length) return [];

    const processed = categories.flatMap((cat: any) => {
      const subsArr = ensureArray(cat.subcategories)
        .map((item: any) => String(item).trim())
        .filter((item: string) => item.length > 0);

      const images = ensureObject(cat.subcategoryImages);

      return subsArr.map((sub: string, idx: number) => {
        const imagePath = images[sub];
        if (!imagePath) return null;

        const imageUrl = imagePath.startsWith('http') ? imagePath : `${API_BASE_URL}${imagePath}`;

        return {
          id: `${cat.id || cat._id}-sub-${idx}`,
          name: sub,
          image: imageUrl,
          parentCategory: cat, // Store parent for navigation
        };
      }).filter(Boolean);
    });

    // Shuffle and pick top 5
    return processed.sort(() => Math.random() - 0.5).slice(0, 5);
  }, [categories]);

  if (!subcategories || subcategories.length === 0) return null;

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 15,
          paddingVertical: 10,
        }}
      >
        {subcategories.map((sub: any) => (
          <Pressable
            key={sub.id}
            onPress={() => onSubcategoryPress?.(sub, sub.parentCategory)}
            className="items-center mr-4 active:scale-95 transition-transform"
          >
            <View className="relative w-16 h-16 items-center justify-center">
              {/* Squircle background with #FFC107 yellow */}
              <View
                className="absolute w-14 h-14"
                style={{
                  borderRadius: 20,
                  backgroundColor: '#FFC107',
                  transform: [{ rotate: '45deg' }],
                }}
              />
              <Image
                source={{ uri: sub.image }}
                style={{ width: 48, height: 48, zIndex: 10 }}
                contentFit="contain"
              />
            </View>
            <Text
              className="mt-1 text-xs font-medium text-gray-700 text-center w-20 capitalize"
              numberOfLines={1}
            >
              {sub.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
