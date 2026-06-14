import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';

interface CategoryIconProps {
  name: string;
  icon: React.ReactNode;
  imageUrl?: string;
  onPress?: () => void;
}

export default function CategoryIcon({ name, icon, imageUrl, onPress }: CategoryIconProps) {
  return (
    <Pressable
      onPress={onPress}
      className="items-center mr-6 active:opacity-70"
    >
      <View className="w-16 h-16 rounded-md bg-white border border-gray-100 items-center justify-center shadow-sm overflow-hidden">
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : (
          icon
        )}
      </View>
      <Text className="text-primary text-xs font-medium mt-2 text-center w-16" numberOfLines={1}>
        {name}
      </Text>
    </Pressable>
  );
}
