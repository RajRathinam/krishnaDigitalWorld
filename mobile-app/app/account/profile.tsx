import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Mail, MapPin, Calendar, Phone, ChevronLeft, Camera } from 'lucide-react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '@/services/api';
import Header from '@/components/Header';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/services/api';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import Skeleton from '@/components/Skeleton';

export default function ProfileScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { refreshUser, updateUser } = useAuth();
    const { data: userResponse, isLoading } = useQuery({
        queryKey: ['me'],
        queryFn: authApi.getMe,
    });

    const user = userResponse?.data || userResponse?.user;

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('');
    const [pincode, setPincode] = useState('');
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [imageError, setImageError] = useState(false);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            if (user.address) {
                if (typeof user.address === 'object') {
                    setStreet(user.address.street || '');
                    setCity(user.address.city || '');
                    setState(user.address.state || '');
                    setPincode(user.address.pincode || '');
                } else if (typeof user.address === 'string') {
                    try {
                        const parsed = JSON.parse(user.address);
                        setStreet(parsed.street || '');
                        setCity(parsed.city || '');
                        setState(parsed.state || '');
                        setPincode(parsed.pincode || '');
                        setLat(parsed.lat || null);
                        setLng(parsed.lng || null);
                    } catch (e) {
                         setStreet(user.address);
                    }
                }
            }
        }
    }, [user]);

    const captureLocation = async () => {
        setIsFetchingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Location permission is required to capture current location.');
                setIsFetchingLocation(false);
                return;
            }
            
            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            
            // Reverse geocode
            const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (geocode && geocode.length > 0) {
                const p = geocode[0];
                setLat(latitude);
                setLng(longitude);
                setStreet(p.street || p.name || street);
                setCity(p.city || p.district || p.subregion || city);
                setState(p.region || state);
                setPincode(p.postalCode || pincode);
            } else {
                setLat(latitude);
                setLng(longitude);
            }
            Alert.alert('Location Captured', 'Your current location has been filled in.');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to get current location.');
        } finally {
            setIsFetchingLocation(false);
        }
    };

    const handleAddressChange = (field: string, value: string) => {
        if (lat && lng) {
            Alert.alert(
                'Remove Captured Location?',
                'Are you sure you want to remove the captured location and enter manually?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                        text: 'Yes', 
                        style: 'destructive',
                        onPress: () => {
                            setLat(null);
                            setLng(null);
                            setStreet('');
                            setCity('');
                            setState('');
                            setPincode('');
                        }
                    }
                ]
            );
        } else {
            if (field === 'street') setStreet(value);
            if (field === 'city') setCity(value);
            if (field === 'state') setState(value);
            if (field === 'pincode') setPincode(value);
        }
    };

    const [selectedImage, setSelectedImage] = useState<any>(null);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0]);
        }
    };

    const updateMutation = useMutation({
        mutationFn: (data: any) => authApi.updateMe(data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
        onSuccess: async (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['me'] });
            
            // Directly update the global AuthContext state with the returned user data
            // This ensures all screens (Header, Account Tab) reflect changes instantly
            // We use a robust extraction because the backend may return the user 
            // directly in 'data' or nested in 'data.user'
            const updatedUser = data.data?.id ? data.data : (data.data?.user || data.user);
            
            if (updatedUser && updatedUser.id) {
                updateUser(updatedUser);
            } else {
                // Fallback to re-fetching if the response format is unexpected
                await refreshUser();
            }

            Alert.alert('Success', 'Profile updated successfully');
            router.back();
        },
        onError: (error: any) => {
            Alert.alert('Error', error?.message || 'Failed to update profile');
        }
    });

    const handleSave = () => {
        const formData = new FormData();
        formData.append('name', name);
        if (email) formData.append('email', email);

        if (street || city || pincode) {
            formData.append('address', JSON.stringify({
                street,
                city,
                state,
                pincode,
                lat,
                lng,
            }));
        }

        if (selectedImage) {
            const uriParts = selectedImage.uri.split('.');
            const fileType = uriParts[uriParts.length - 1];
            
            // @ts-ignore
            formData.append('profileImage', {
                uri: selectedImage.uri,
                name: `profile.${fileType}`,
                type: `image/${fileType === 'png' ? 'png' : 'jpeg'}`,
            });
        }

        updateMutation.mutate(formData);
    };

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-white" edges={['bottom', 'left', 'right']}>
                <Header />
                <View className="flex-1 p-4">
                    <View className="flex-row items-center mb-8">
                        <Skeleton width={150} height={32} borderRadius={8} />
                    </View>
                    
                    <View className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-gray-100">
                        <Skeleton width={120} height={12} borderRadius={4} style={{ marginBottom: 24 }} />
                        {[1, 2, 3].map(i => (
                            <View key={i} style={{ marginBottom: 20 }}>
                                <Skeleton width={80} height={10} borderRadius={4} style={{ marginBottom: 8 }} />
                                <Skeleton height={48} borderRadius={12} />
                            </View>
                        ))}
                    </View>

                    <View className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-gray-100">
                        <Skeleton width={120} height={12} borderRadius={4} style={{ marginBottom: 24 }} />
                        <Skeleton width={80} height={10} borderRadius={4} style={{ marginBottom: 8 }} />
                        <Skeleton height={48} borderRadius={12} style={{ marginBottom: 20 }} />
                        <View className="flex-row gap-x-4">
                            <View className="flex-1"><Skeleton height={48} borderRadius={12} /></View>
                            <View className="flex-1"><Skeleton height={48} borderRadius={12} /></View>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['right', 'left']}>
            <Header />
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
                style={{ flex: 1 }}
            >
                <ScrollView 
                    showsVerticalScrollIndicator={false} 
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
                    keyboardShouldPersistTaps="handled"
                >
                <View className="p-4">
                    <View className="flex-row items-center mb-6">
                        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 bg-white rounded-full shadow-sm">
                            <ChevronLeft size={20} color="#111827" />
                        </TouchableOpacity>
                        <Text className="text-xl font-bold text-gray-900">Edit Profile</Text>
                    </View>

                    {/* Avatar Upload */}
                    <View className="items-center mb-8">
                        <TouchableOpacity onPress={pickImage} className="relative">
                            <View className="w-28 h-28 rounded-full bg-gray-200 items-center justify-center border-4 border-white shadow-sm overflow-hidden">
                                {selectedImage ? (
                                    <Image source={{ uri: selectedImage.uri }} className="w-full h-full" />
                                ) : (user?.profileImage && user.profileImage !== 'null' && !imageError) ? (
                                    <Image 
                                        source={{ uri: user.profileImage.startsWith('http') ? user.profileImage : `${API_BASE_URL}${user.profileImage.replace(/\\/g, '/').startsWith('/') ? '' : '/'}${user.profileImage.replace(/\\/g, '/')}` }} 
                                        className="w-full h-full" 
                                        onError={() => setImageError(true)}
                                    />
                                ) : (
                                    <Image 
                                        source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=F3F4F6&color=9CA3AF&size=200` }} 
                                        className="w-full h-full" 
                                    />
                                )}
                            </View>
                            <View className="absolute bottom-0 right-0 bg-[#FFC107] p-2 rounded-full border-2 border-white">
                                <Camera size={16} color="#FFFFFF" />
                            </View>
                        </TouchableOpacity>
                        <Text className="text-gray-400 text-xs mt-2 font-medium">Tap to change profile picture</Text>
                    </View>

                    <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                        <Text className="text-gray-900 font-bold mb-4 uppercase text-xs tracking-widest">Personal Information</Text>

                        <View className="mb-4">
                            <Text className="text-gray-500 text-sm mb-1 ml-1">Full Name</Text>
                            <View className="flex-row items-center border border-gray-200 rounded-xl px-4 bg-gray-50">
                                <User size={18} color="#9CA3AF" />
                                <TextInput
                                    className="flex-1 ml-3 text-gray-900"
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Enter your name"
                                />
                            </View>
                        </View>

                        <View className="mb-4">
                            <Text className="text-gray-500 text-sm mb-1 ml-1">Phone Number</Text>
                            <View className="flex-row items-center border border-gray-200 rounded-xl px-4 bg-gray-100">
                                <Phone size={18} color="#9CA3AF" />
                                <TextInput
                                    className="flex-1 ml-3 text-gray-500"
                                    value={user?.phone}
                                    editable={false}
                                />
                            </View>
                            <Text className="text-[10px] text-gray-400 mt-1 ml-1 font-medium">Phone number cannot be changed</Text>
                        </View>

                        <View className="mb-4">
                            <Text className="text-gray-500 text-sm mb-1 ml-1">Email Address</Text>
                            <View className="flex-row items-center border border-gray-200 rounded-xl px-4 bg-gray-50">
                                <Mail size={18} color="#9CA3AF" />
                                <TextInput
                                    className="flex-1 ml-3 text-gray-900"
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="Enter your email"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>
                    </View>

                    <View className="bg-white rounded-2xl p-6 shadow-sm mb-8">
                        <View className="flex-col gap-3 mb-4">
                            <Text className="text-gray-900 font-bold uppercase text-xs tracking-widest">Primary Address</Text>
                            <View className="flex-row items-center gap-2">
                                {lat && lng && (
                                    <TouchableOpacity 
                                        onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`)}
                                        className="bg-[#FFC107] border border-[#FFC107] py-1.5 px-3 rounded-lg flex-row items-center justify-center"
                                    >
                                        <Text className="text-gray-900 font-bold text-[10px]">View Map</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity 
                                    onPress={captureLocation} 
                                    disabled={isFetchingLocation}
                                    className="bg-[#FFF9E6] border border-[#FFC107] py-1.5 px-2 rounded-lg flex-row items-center justify-center"
                                >
                                    {isFetchingLocation ? (
                                        <ActivityIndicator size="small" color="#E6A800" className="mr-1" />
                                    ) : (
                                        <MapPin size={12} color="#E6A800" className="mr-1" />
                                    )}
                                    <Text className="text-[#E6A800] font-bold text-[10px]">
                                        {isFetchingLocation ? 'Getting location...' : 'Capture Location'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className="mb-4">
                            <Text className="text-gray-500 text-sm mb-1 ml-1">Street Address</Text>
                            <View className="flex-row items-center border border-gray-200 rounded-xl px-4 bg-gray-50">
                                <MapPin size={18} color="#9CA3AF" />
                                <TextInput
                                    className="flex-1 ml-3 text-gray-900"
                                    value={street}
                                    onChangeText={(val) => handleAddressChange('street', val)}
                                    placeholder="House no., Building, Street"
                                />
                            </View>
                        </View>

                        <View className="flex-row gap-x-4 mb-4">
                            <View className="flex-1">
                                <Text className="text-gray-500 text-sm mb-1 ml-1">City</Text>
                                <TextInput
                                    className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900"
                                    value={city}
                                    onChangeText={(val) => handleAddressChange('city', val)}
                                    placeholder="City"
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-500 text-sm mb-1 ml-1">State</Text>
                                <TextInput
                                    className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900"
                                    value={state}
                                    onChangeText={(val) => handleAddressChange('state', val)}
                                    placeholder="State"
                                />
                            </View>
                        </View>

                        <View className="mb-4">
                            <Text className="text-gray-500 text-sm mb-1 ml-1">Pincode</Text>
                            <TextInput
                                className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900"
                                value={pincode}
                                onChangeText={(val) => handleAddressChange('pincode', val)}
                                placeholder="6-digit pincode"
                                keyboardType="number-pad"
                                maxLength={6}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        className={`bg-[#FFC107] py-4 rounded-2xl items-center shadow-md ${updateMutation.isPending ? 'opacity-70' : ''}`}
                        onPress={handleSave}
                        disabled={updateMutation.isPending}
                    >
                        {updateMutation.isPending ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
