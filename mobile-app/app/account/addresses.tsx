import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Plus, Home, Briefcase, User, X, Edit2, Trash2, CheckCircle2, ChevronLeft, MapPinned } from 'lucide-react-native';
import Header from '@/components/Header';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/services/api';
import { useRouter } from 'expo-router';
import { ListItemSkeleton } from '@/components/SkeletonLoader';
import Skeleton from '@/components/Skeleton';
import Animated, { FadeInUp, FadeInRight, FadeInDown, Layout, FadeIn, FadeOut, FadeOutDown } from 'react-native-reanimated';

const MAX_SAVED_ADDRESSES = 3;

const getAddressTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
        case 'home': return <Home size={18} color="#FFC107" />;
        case 'work': return <Briefcase size={18} color="#FFC107" />;
        default: return <MapPinned size={18} color="#FFC107" />;
    }
};

export default function AddressesScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const insets = useSafeAreaInsets();
    const [showForm, setShowForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState<any>(null);

    const [form, setForm] = useState({
        name: '', phone: '', street: '', city: '', state: '', pincode: '', type: 'home'
    });

    const { data: userResponse, isLoading } = useQuery({
        queryKey: ['me'],
        queryFn: authApi.getMe,
    });

    const userData = userResponse?.data || userResponse?.user;

    // Derived Addresses
    const primaryAddress = userData?.address ? (typeof userData.address === 'object' ? userData.address : JSON.parse(userData.address)) : null;
    const additionalAddresses = userData?.additionalAddresses || [];
    const isAtLimit = additionalAddresses.length >= MAX_SAVED_ADDRESSES;

    const addMutation = useMutation({
        mutationFn: (data: any) => authApi.addAddress(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['me'] });
            setShowForm(false);
            Alert.alert('Success', 'Address added successfully');
        },
        onError: (err: any) => Alert.alert('Error', err?.message || 'Failed to add address')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => authApi.updateAddress(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['me'] });
            setShowForm(false);
            Alert.alert('Success', 'Address updated successfully');
        },
        onError: (err: any) => Alert.alert('Error', err?.message || 'Failed to update address')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => authApi.deleteAddress(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['me'] });
            Alert.alert('Success', 'Address deleted successfully');
        },
        onError: (err: any) => Alert.alert('Error', err?.message || 'Failed to delete address')
    });

    const setDefaultMutation = useMutation({
        mutationFn: (id: string) => authApi.setDefaultAddress(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
        onError: (err: any) => Alert.alert('Error', err?.message || 'Failed to set default address')
    });

    const handleOpenAddForm = () => {
        setEditingAddress(null);
        setForm({
            name: userData?.name || '',
            phone: userData?.phone || '',
            street: '', city: '', state: '', pincode: '', type: 'home'
        });
        setShowForm(true);
    };

    const handleOpenEditForm = (addr: any) => {
        setEditingAddress(addr);
        setForm({
            name: addr.name || userData?.name,
            phone: addr.phone || userData?.phone,
            street: addr.street,
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode,
            type: addr.type || 'home'
        });
        setShowForm(true);
    };

    const handleSave = () => {
        if (!form.name || !form.street || !form.city || !form.pincode) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }
        if (editingAddress) {
            updateMutation.mutate({ id: editingAddress.id, data: form });
        } else {
            addMutation.mutate(form);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) }
        ]);
    };

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-white" edges={['bottom', 'left', 'right']}>
                <Header />
                <View className="flex-1 p-4">
                    <View className="flex-row items-center justify-between mb-8">
                        <Skeleton width={180} height={32} borderRadius={8} />
                        <Skeleton width={80} height={36} borderRadius={12} />
                    </View>
                    
                    <Skeleton width={120} height={12} borderRadius={4} style={{ marginBottom: 12 }} />
                    <Skeleton height={120} borderRadius={20} style={{ marginBottom: 32 }} />
                    
                    <Skeleton width={100} height={12} borderRadius={4} style={{ marginBottom: 12 }} />
                    {[1, 2].map(i => <ListItemSkeleton key={i} />)}
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom', 'left', 'right']}>
            <Header />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <View className="p-4">
                    {/* Header Row */}
                    <View className="flex-row items-center justify-between mb-6">
                        <View className="flex-row items-center">
                            <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2 bg-white rounded-full shadow-sm">
                                <ChevronLeft size={20} color="#111827" />
                            </TouchableOpacity>
                            <Text className="text-xl font-bold text-gray-900">My Addresses</Text>
                        </View>
                        {!isAtLimit && (
                            <TouchableOpacity
                                onPress={handleOpenAddForm}
                                className="bg-[#FFC107] px-4 py-2 rounded-xl flex-row items-center shadow-sm"
                            >
                                <Plus size={16} color="#FFFFFF" />
                                <Text className="text-white font-bold ml-1 text-xs">Add New</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Primary Address Section */}
                    <Text className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mb-3 ml-1">Primary Profile Address</Text>
                    <Animated.View entering={FadeInUp.delay(100)} className="bg-white rounded-2xl p-5 mb-6 border border-gray-100 shadow-sm">
                        <View className="flex-row items-center mb-3">
                            <View className="bg-blue-50 px-2 py-0.5 rounded-full mr-2">
                                <Text className="text-blue-600 text-[9px] font-bold uppercase">Primary</Text>
                            </View>
                            <Text className="text-gray-900 font-bold">{userData?.name}</Text>
                        </View>
                        {primaryAddress ? (
                            <>
                                <Text className="text-gray-600 text-sm leading-5">
                                    {primaryAddress.street}, {primaryAddress.city}, {primaryAddress.state} - {primaryAddress.pincode}
                                </Text>
                                <View className="flex-row items-center mt-3 pt-3 border-t border-gray-50">
                                    <Text className="text-gray-400 text-xs">Profile address can be updated in </Text>
                                    <TouchableOpacity onPress={() => router.push('/account/profile')}>
                                        <Text className="text-[#FFC107] text-xs font-bold underline">Edit Profile</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <Text className="text-gray-400 text-sm italic">No profile address set yet.</Text>
                        )}
                    </Animated.View>

                    {/* Saved Addresses Section */}
                    <View className="flex-row items-center justify-between mb-3 ml-1">
                        <Text className="text-gray-500 font-bold text-[10px] uppercase tracking-widest">Saved Addresses</Text>
                        <Text className="text-gray-400 text-[10px]">{additionalAddresses.length}/{MAX_SAVED_ADDRESSES} Used</Text>
                    </View>

                    {additionalAddresses.length === 0 ? (
                        <Animated.View entering={FadeInUp.delay(200)} className="bg-white rounded-2xl p-8 items-center border border-dashed border-gray-200">
                            <MapPin size={40} color="#D1D5DB" />
                            <Text className="text-gray-900 font-bold text-base mt-4 text-center">No saved addresses</Text>
                            <Text className="text-gray-500 text-xs text-center mt-2 mb-6">Add additional delivery addresses for faster checkouts!</Text>
                            <TouchableOpacity
                                onPress={handleOpenAddForm}
                                className="bg-gray-900 px-6 py-3 rounded-xl"
                            >
                                <Text className="text-white font-bold text-sm">Add First Address</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ) : (
                        additionalAddresses.map((addr: any, index: number) => (
                            <Animated.View 
                                key={addr.id || index} 
                                entering={FadeInRight.delay(index * 100)}
                                layout={Layout.springify()}
                                className={`bg-white rounded-2xl p-5 mb-4 border ${addr.isDefault ? 'border-[#FFC107]' : 'border-gray-100'} shadow-sm relative overflow-hidden`}
                            >
                                {addr.isDefault && (
                                    <View className="absolute top-0 right-0 bg-[#FFC107] px-3 py-1 rounded-bl-xl shadow-sm">
                                        <Text className="text-white text-[9px] font-bold uppercase">Default</Text>
                                    </View>
                                )}
                                
                                <View className="flex-row items-start mb-3">
                                    <View className="w-10 h-10 bg-yellow-50 rounded-xl items-center justify-center mr-3">
                                        {getAddressTypeIcon(addr.type)}
                                    </View>
                                    <View className="flex-1">
                                        <View className="flex-row items-center mb-1">
                                            <Text className="text-gray-400 text-[10px] font-bold uppercase mr-2">{addr.type || 'Home'}</Text>
                                            <Text className="text-gray-900 font-bold text-sm" numberOfLines={1}>{addr.name}</Text>
                                        </View>
                                        <Text className="text-gray-600 text-xs leading-5">
                                            {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                                        </Text>
                                        {addr.phone && (
                                            <Text className="text-gray-400 text-xs mt-1">Phone: {addr.phone}</Text>
                                        )}
                                    </View>
                                </View>

                                <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-gray-50">
                                    <View className="flex-row">
                                        {!addr.isDefault && (
                                            <TouchableOpacity 
                                                onPress={() => setDefaultMutation.mutate(addr.id)}
                                                disabled={setDefaultMutation.isPending}
                                                className="mr-4"
                                            >
                                                <Text className="text-blue-500 text-xs font-bold">Set as Default</Text>
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity onPress={() => handleOpenEditForm(addr)} className="mr-4">
                                            <Text className="text-gray-600 text-xs font-bold">Edit</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            onPress={() => handleDelete(addr.id)}
                                            disabled={deleteMutation.isPending}
                                        >
                                            <Text className="text-red-500 text-xs font-bold">Delete</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </Animated.View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Address Form Overlay */}
            {showForm && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]}>
                    {/* Backdrop */}
                    <Animated.View 
                        entering={FadeIn}
                        exiting={FadeOut}
                        style={StyleSheet.absoluteFill}
                    >
                        <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowForm(false)}>
                            <View className="flex-1 bg-black/50" />
                        </Pressable>
                    </Animated.View>

                    {/* Form Container */}
                    <KeyboardAvoidingView 
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        className="flex-1 justify-end" 
                        pointerEvents="box-none"
                    >
                        <Animated.View 
                            entering={FadeInDown}
                            exiting={FadeOutDown}
                            style={{ paddingBottom: Math.max(insets.bottom + 20, 40) }}
                            className="bg-white rounded-t-[32px] p-6 shadow-2xl"
                        >
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-xl font-bold text-gray-900">
                                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                                </Text>
                                <TouchableOpacity onPress={() => setShowForm(false)} className="p-2 bg-gray-100 rounded-full">
                                    <X size={20} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView 
                                showsVerticalScrollIndicator={false} 
                                className="max-h-[60vh]"
                                keyboardShouldPersistTaps="handled"
                            >
                                <View className="space-y-4">
                                    <View>
                                        <Text className="text-gray-500 text-xs font-bold mb-2 ml-1">Contact Name *</Text>
                                        <TextInput
                                            className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-gray-900"
                                            placeholder="Full name of receiver"
                                            value={form.name}
                                            onChangeText={val => setForm({ ...form, name: val })}
                                        />
                                    </View>

                                    <View>
                                        <Text className="text-gray-500 text-xs font-bold mb-2 ml-1">Street Address *</Text>
                                        <TextInput
                                            className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-gray-900"
                                            placeholder="Flat no., Street, Area"
                                            multiline
                                            numberOfLines={2}
                                            value={form.street}
                                            onChangeText={val => setForm({ ...form, street: val })}
                                        />
                                    </View>

                                    <View className="flex-row gap-x-4">
                                        <View className="flex-1">
                                            <Text className="text-gray-500 text-xs font-bold mb-2 ml-1">City *</Text>
                                            <TextInput
                                                className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-gray-900"
                                                placeholder="City"
                                                value={form.city}
                                                onChangeText={val => setForm({ ...form, city: val })}
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-gray-500 text-xs font-bold mb-2 ml-1">State *</Text>
                                            <TextInput
                                                className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-gray-900"
                                                placeholder="State"
                                                value={form.state}
                                                onChangeText={val => setForm({ ...form, state: val })}
                                            />
                                        </View>
                                    </View>

                                    <View>
                                        <Text className="text-gray-500 text-xs font-bold mb-2 ml-1">Pincode *</Text>
                                        <TextInput
                                            className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-gray-900"
                                            placeholder="6-digit pincode"
                                            keyboardType="number-pad"
                                            maxLength={6}
                                            value={form.pincode}
                                            onChangeText={val => setForm({ ...form, pincode: val.replace(/\D/g, '') })}
                                        />
                                    </View>
                                </View>
                            </ScrollView>

                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={addMutation.isPending || updateMutation.isPending}
                                className={`bg-gray-900 py-4 rounded-2xl mt-8 items-center ${(addMutation.isPending || updateMutation.isPending) ? 'opacity-70' : ''}`}
                            >
                                <Text className="text-white font-bold text-base">
                                    {editingAddress ? 'Update Address' : 'Save Address'}
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </KeyboardAvoidingView>
                </View>
            )}
        </SafeAreaView>
    );
}
