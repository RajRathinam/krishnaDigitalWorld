import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    FlatList,
    Linking,
    Animated,
    StyleSheet,
    ActivityIndicator
} from 'react-native';
import Skeleton from './Skeleton';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { WebView } from 'react-native-webview';
import { useQuery } from '@tanstack/react-query';
import { advertisementApi, API_BASE_URL } from '@/services/api';
import { ExternalLink, Megaphone, X, ChevronRight, Volume2, VolumeX, Play, Pause } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const getImageUrl = (url: string | undefined) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
};

interface AdProps {
    id: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    videoUrl?: string;
    externalVideoId?: string;
    link?: string;
    type: string;
    position: string;
}

const getVideoUrl = (url: string | undefined) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
};

export const AdvertisementCarousel = ({ position = 'homepage_middle' }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [dismissed, setDismissed] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const { data: adsData, isLoading } = useQuery({
        queryKey: ['advertisements', position],
        queryFn: () => advertisementApi.getActiveAds(position),
    });

    const ads: AdProps[] = adsData?.data || adsData || [];

    const handleAdClick = (ad: AdProps) => {
        if (ad.link) {
            Linking.openURL(ad.link);
            advertisementApi.trackClick(ad.id).catch(() => { });
        }
    };

    // Track views
    useEffect(() => {
        if (ads.length > 0 && ads[currentIndex]) {
            advertisementApi.trackView(ads[currentIndex].id!).catch(() => { });
        }
    }, [currentIndex, ads]);

    if (dismissed) return null;

    if (isLoading) {
        if (position === 'homepage_top') {
            return (
                <View className="bg-gray-900 px-4 py-2 h-[60px] justify-center">
                    <Skeleton height={20} width={200} borderRadius={4} baseColor="#1F2937" highlightColor="#374151" />
                </View>
            );
        }
        return (
            <View className="py-6 px-4">
                <Skeleton height={200} borderRadius={16} />
            </View>
        );
    }

    if (!ads.length) return null;

    const isTop = position === 'homepage_top';

    // ──────────────────────────────────────────────────────────────────────────
    // Homepage Top Version
    // ──────────────────────────────────────────────────────────────────────────
    if (isTop) {
        const currentAd = ads[currentIndex];
        return (
            <View className="bg-gray-900 border-b border-gray-800">
                <View className="flex-row items-center px-4 py-2 min-h-[60px]">
                    <View className="bg-yellow-500 rounded px-1.5 py-0.5 mr-2">
                        <Text className="text-[10px] font-bold text-black text-center">AD</Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-white text-xs font-bold" numberOfLines={1}>{currentAd.title}</Text>
                        {currentAd.description && (
                            <Text className="text-white/60 text-[10px]" numberOfLines={1}>{currentAd.description}</Text>
                        )}
                    </View>

                    <View className="flex-row items-center gap-3">
                        {currentAd.link && (
                            <TouchableOpacity
                                onPress={() => handleAdClick(currentAd)}
                                className="bg-yellow-500 rounded-full h-8 px-3 flex-row items-center"
                            >
                                <Text className="text-black text-[10px] font-bold mr-1">Visit</Text>
                                <ExternalLink size={10} color="#000" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => setDismissed(true)}>
                            <X size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                </View>
                {/* Slim progress bar */}
                {ads.length > 1 && (
                    <View className="h-[2px] bg-gray-800 w-full overflow-hidden">
                        <View
                            className="h-full bg-yellow-500"
                            style={{ width: `${((currentIndex + 1) / ads.length) * 100}%` }}
                        />
                    </View>
                )}
            </View>
        );
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Homepage Middle/Bottom Version (Cinematic)
    // ──────────────────────────────────────────────────────────────────────────
    const itemWidth = width - 32;
    const itemSpacing = 16;

    const renderMedia = ({ item, index }: { item: AdProps, index: number }) => {
        const isActive = index === currentIndex;

        const MediaContent = () => {
            if (item.type === 'video' && item.videoUrl) {
                return (
                    <Video
                        source={{ uri: getVideoUrl(item.videoUrl) }}
                        rate={1.0}
                        volume={1.0}
                        isMuted={isMuted}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={isActive && isPlaying}
                        isLooping
                        style={StyleSheet.absoluteFill}
                    />
                );
            }
            if (item.type === 'youtube' && item.externalVideoId) {
                return (
                    <WebView
                        style={StyleSheet.absoluteFill}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        startInLoadingState={true}
                        renderLoading={() => <Skeleton height="100%" width="100%" borderRadius={0} style={StyleSheet.absoluteFill} />}
                        source={{ uri: `https://www.youtube.com/embed/${item.externalVideoId}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1` }}
                    />
                );
            }
            if (item.type === 'vimeo' && item.externalVideoId) {
                return (
                    <WebView
                        style={StyleSheet.absoluteFill}
                        javaScriptEnabled={true}
                        startInLoadingState={true}
                        renderLoading={() => <Skeleton height="100%" width="100%" borderRadius={0} style={StyleSheet.absoluteFill} />}
                        source={{ uri: `https://player.vimeo.com/video/${item.externalVideoId}?autoplay=1&muted=1&loop=1&title=0&byline=0&portrait=0` }}
                    />
                );
            }
            return (
                <Image
                    source={{ uri: getImageUrl(item.thumbnailUrl) || 'https://via.placeholder.com/800x400' }}
                    className="w-full h-full"
                    resizeMode="cover"
                />
            );
        };

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleAdClick(item)}
                style={{ width: itemWidth, marginLeft: index === 0 ? 16 : 8, marginRight: index === ads.length - 1 ? 16 : 8 }}
                className="h-[200px] rounded-2xl overflow-hidden bg-gray-800 shadow-lg relative"
            >
                <MediaContent />

                {/* Gradient Overlay */}
                <View
                    style={StyleSheet.absoluteFill}
                    className="bg-black/30"
                    pointerEvents="none"
                />

                {/* Content */}
                <View className="absolute bottom-0 left-0 right-0 p-5" pointerEvents="none">
                    <View className="flex-row items-center mb-1">
                        <View className="bg-yellow-500/80 rounded px-1.5 py-0.5 mr-2">
                            <Text className="text-[10px] font-bold text-black">ADVERTISEMENT</Text>
                        </View>
                    </View>

                </View>

                {/* Audio and Play Controls - Styled for Mobile */}
                {item.type === 'video' && isActive && (
                    <View style={{ position: 'absolute', bottom: 15, right: 15, flexDirection: 'row', zIndex: 100 }}>
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                setIsPlaying(!isPlaying);
                            }}
                            style={{ marginRight: 10 }}
                            className="w-10 h-10 bg-black/60 rounded-full items-center justify-center border border-white/20"
                        >
                            {isPlaying ? <Pause size={18} color="#FFF" /> : <Play size={18} color="#FFF" />}
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                setIsMuted(!isMuted);
                            }}
                            className="w-10 h-10 bg-black/60 rounded-full items-center justify-center border border-white/20"
                        >
                            {isMuted ? <VolumeX size={18} color="#FFF" /> : <Volume2 size={18} color="#FFF" />}
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View className="py-6">
            <FlatList
                ref={flatListRef}
                data={ads}
                renderItem={renderMedia}
                initialNumToRender={3}
                windowSize={3}
                removeClippedSubviews={true}
                horizontal
                pagingEnabled={false}
                decelerationRate="fast"
                snapToInterval={itemWidth + 16}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / (itemWidth + 16));
                    if (index !== currentIndex) {
                        setCurrentIndex(index);
                        setIsPlaying(false);
                    }
                }}
            />

            {ads.length > 1 && (
                <View className="flex-row justify-center mt-4 gap-2">
                    {ads.map((_, i) => (
                        <View
                            key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-6 bg-yellow-500' : 'w-1.5 bg-gray-300'}`}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    absoluteFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    }
});

export default AdvertisementCarousel;
