import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Gift, Store, ShoppingBag, X } from 'lucide-react-native';
import Header from '@/components/Header';
import { useNavigation } from 'expo-router';
import { giftApi, API_BASE_URL } from '@/services/api';

const getImageUrl = (url?: string) => {
  if (!url) return undefined;
  return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
};

function GiftDetailModal({ item, onClose }: { item: any; onClose: () => void }) {
  const gift = item.gift;
  const imageUri = getImageUrl(gift?.image);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} className="flex-1 bg-black/60 items-center justify-center px-5">
        <TouchableOpacity activeOpacity={1} onPress={() => {}} className="w-full bg-white rounded-3xl p-7 items-center relative overflow-hidden">
          <View className="absolute -top-14 -right-10 w-32 h-32 rounded-full bg-purple-50" />
          <View className="absolute -bottom-14 -left-10 w-36 h-36 rounded-full bg-orange-50" />

          <TouchableOpacity onPress={onClose} className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 z-10">
            <X size={16} color="#6B7280" />
          </TouchableOpacity>

          <Text className="text-lg font-black text-pink-600 tracking-wide mb-5 z-10">🎉 YOU WON THIS GIFT!</Text>

          <View className="w-32 h-32 mb-4 z-10">
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
            ) : (
              <View className="w-full h-full rounded-full bg-pink-50 border-4 border-pink-100 items-center justify-center">
                <Gift size={56} color="#F472B6" />
              </View>
            )}
            <View className="absolute -bottom-1 -right-1 bg-red-500 px-3 py-1 rounded-full border-2 border-white flex-row items-center gap-1">
              <Gift size={11} color="#fff" />
              <Text className="text-white text-[10px] font-black">FREE</Text>
            </View>
          </View>

          <Text className="text-2xl font-black text-gray-900 text-center mb-2 z-10">
            {gift?.productName || 'Surprise Gift'}
          </Text>

          {!!gift?.price && (
            <View className="bg-pink-100 px-3 py-1 rounded-lg mb-4 z-10">
              <Text className="text-pink-700 font-bold text-sm">
                Worth ₹{parseFloat(gift.price).toLocaleString('en-IN')}
              </Text>
            </View>
          )}

          <View className="flex-row items-center gap-1.5 mb-5 z-10">
            {item.source === 'online' ? (
              <ShoppingBag size={13} color="#6B7280" />
            ) : (
              <Store size={13} color="#6B7280" />
            )}
            <Text className="text-xs text-gray-500">
              {item.source === 'online'
                ? `Won with order ${item.orderNumber || `#${item.orderId}`}`
                : `Bill No. ${item.billNumber || 'N/A'}`}
            </Text>
          </View>

          <Text className="text-sm text-gray-600 text-center mb-6 z-10">
            {item.source === 'online'
              ? 'This gift will be delivered along with your order.'
              : 'Show this screen to the shopkeeper to claim your gift!'}
          </Text>

          <TouchableOpacity onPress={onClose} className="w-full bg-gray-900 py-3.5 rounded-xl items-center z-10">
            <Text className="text-white font-bold text-base">Awesome!</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export default function ClaimedGiftsScreen() {
  const navigation = useNavigation();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await giftApi.getMyClaimedGifts();
        setClaims(res.success ? res.data || [] : []);
      } catch (err) {
        console.error('Failed to load claimed gifts:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['left', 'right', 'bottom']}>
      <Header />
      <View className="flex-row items-center p-4 pb-0 mb-2">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 p-2 bg-white rounded-full shadow-sm">
          <ChevronLeft size={20} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Claimed Gifts</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FFC107" size="large" />
        </View>
      ) : claims.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Gift size={48} color="#D1D5DB" />
          <Text className="text-gray-900 font-semibold mt-3 mb-1">No gifts won yet</Text>
          <Text className="text-gray-500 text-sm text-center">
            Gifts you win from online orders or scanning the in-store QR code will show up here.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 10 }}>
          {claims.map((item) => {
            const imageUri = getImageUrl(item.gift?.image);
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setSelected(item)}
                className="flex-row items-center gap-3 bg-white border border-gray-100 rounded-xl p-3"
              >
                <View className="w-14 h-14 rounded-lg bg-pink-50 border border-pink-100 items-center justify-center overflow-hidden">
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
                  ) : (
                    <Gift size={22} color="#F472B6" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-sm text-gray-900" numberOfLines={1}>
                    {item.gift?.productName || 'Surprise Gift'}
                  </Text>
                  <View className="flex-row items-center gap-1 mt-0.5">
                    {item.source === 'online' ? (
                      <ShoppingBag size={11} color="#9CA3AF" />
                    ) : (
                      <Store size={11} color="#9CA3AF" />
                    )}
                    <Text className="text-xs text-gray-400">
                      {item.source === 'online' ? 'Online order' : 'In-store scan'}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#D1D5DB" />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {selected && <GiftDetailModal item={selected} onClose={() => setSelected(null)} />}
    </SafeAreaView>
  );
}
