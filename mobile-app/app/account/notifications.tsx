import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Bell, Truck, PackageCheck, PackageSearch, Ticket } from 'lucide-react-native';
import Header from '@/components/Header';
import { useNavigation } from 'expo-router';
import { notificationApi } from '@/services/api';

const ICONS: Record<string, { icon: any; color: string; bg: string }> = {
  order_shipped: { icon: Truck, color: '#2563EB', bg: '#EFF6FF' },
  order_delivered: { icon: PackageCheck, color: '#16A34A', bg: '#F0FDF4' },
  order_status: { icon: PackageSearch, color: '#D97706', bg: '#FFFBEB' },
  coupon: { icon: Ticket, color: '#DB2777', bg: '#FDF2F8' },
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationApi.getMyNotifications();
      setNotifications(res.success ? res.data || [] : []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // non-critical
    }
  };

  const handlePress = async (notification: any) => {
    if (notification.isRead) return;
    try {
      await notificationApi.markRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
    } catch {
      // non-critical
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['left', 'right', 'bottom']}>
      <Header />
      <View className="flex-row items-center justify-between p-4 pb-0 mb-2">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 p-2 bg-white rounded-full shadow-sm">
            <ChevronLeft size={20} color="#111827" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Notifications</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text className="text-xs font-semibold text-yellow-700">Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FFC107" size="large" />
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Bell size={48} color="#D1D5DB" />
          <Text className="text-gray-900 font-semibold mt-3 mb-1">No notifications yet</Text>
          <Text className="text-gray-500 text-sm text-center">
            Order updates and coupon alerts will show up here.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 8 }}>
          {notifications.map((n) => {
            const meta = ICONS[n.type] || ICONS.order_status;
            const Icon = meta.icon;
            return (
              <TouchableOpacity
                key={n.id}
                onPress={() => handlePress(n)}
                className={`flex-row items-start gap-3 bg-white border rounded-xl p-3 ${
                  n.isRead ? 'border-gray-100' : 'border-yellow-300'
                }`}
              >
                <View
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={{ backgroundColor: meta.bg }}
                >
                  <Icon size={16} color={meta.color} />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="font-semibold text-sm text-gray-900 flex-1" numberOfLines={1}>
                      {n.title}
                    </Text>
                    {!n.isRead && <View className="w-2 h-2 rounded-full bg-yellow-500" />}
                  </View>
                  <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={2}>
                    {n.body}
                  </Text>
                  <Text className="text-[11px] text-gray-400 mt-1">
                    {formatDate(n.createdAt || n.created_at)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
