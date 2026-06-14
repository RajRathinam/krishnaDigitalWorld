import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Skeleton from './Skeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Product Card Skeleton ──────────────────────────────────────────────────
export const ProductCardSkeleton = () => (
    <View style={styles.productCard}>
        {/* Image Placeholder */}
        <Skeleton height={128} borderRadius={12} style={{ marginBottom: 12 }} />
        {/* Name Placeholder */}
        <Skeleton height={16} width="80%" borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton height={16} width="60%" borderRadius={4} style={{ marginBottom: 12 }} />
        {/* Rating/Price Placeholder */}
        <View style={styles.flexRowBetween}>
            <Skeleton height={18} width="40%" borderRadius={4} />
            <Skeleton height={14} width="20%" borderRadius={4} />
        </View>
        {/* Button Placeholder */}
        <Skeleton height={36} borderRadius={8} style={{ marginTop: 12 }} />
    </View>
);

// ─── Category Item Skeleton ────────────────────────────────────────────────
export const CategoryItemSkeleton = () => (
    <View style={styles.categoryItem}>
        <Skeleton width={64} height={64} borderRadius={32} style={{ marginBottom: 8 }} />
        <Skeleton width={50} height={12} borderRadius={4} />
    </View>
);

// ─── Hero Slider Skeleton ──────────────────────────────────────────────────
export const HeroSliderSkeleton = () => (
    <View style={styles.heroWrapper}>
        <Skeleton height={200} borderRadius={18} />
    </View>
);

// ─── List Item Skeleton (Orders, Wishlist, Addresses) ───────────────────────
export const ListItemSkeleton = () => (
    <View style={styles.listItem}>
        <Skeleton width={60} height={60} borderRadius={8} style={{ marginRight: 16 }} />
        <View style={{ flex: 1 }}>
            <Skeleton width="70%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
            <Skeleton width="40%" height={12} borderRadius={4} />
        </View>
    </View>
);

// ─── Product Detail Skeleton ───────────────────────────────────────────────
export const ProductDetailSkeleton = () => (
    <View style={styles.container}>
        <Skeleton height={350} borderRadius={0} />
        <View style={{ padding: 20 }}>
            <Skeleton width="90%" height={24} borderRadius={4} style={{ marginBottom: 12 }} />
            <Skeleton width="40%" height={18} borderRadius={4} style={{ marginBottom: 20 }} />
            
            <View style={styles.flexRowBetween}>
                <Skeleton width="30%" height={30} borderRadius={4} />
                <Skeleton width="20%" height={20} borderRadius={4} />
            </View>
            
            <View style={{ marginVertical: 30 }}>
                <Skeleton width="100%" height={100} borderRadius={12} />
            </View>
            
            <Skeleton width="100%" height={50} borderRadius={12} />
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    productCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6', // gray-100
    },
    categoryItem: {
        alignItems: 'center',
        marginHorizontal: 12,
    },
    heroWrapper: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    listItem: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    flexRowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});
