/**
 * FeaturedProjects Component
 * 
 * Displays featured collections and customer project showcases.
 * Shows product categories with beautiful imagery and descriptions.
 * 
 * Features:
 * - Gallery layout
 * - Featured collections
 * - Product category showcases
 * - Responsive design
 * - Direct links to product categories
 * 
 * @component
 * @returns {JSX.Element} Featured projects component
 */

import { Gallery6 } from "@/components/ui/gallery6";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";

// Static featured items (can be replaced with API call)
const staticFeaturedItems = [
    {
        id: "item-1",
        title: "Premium Smart TVs",
        summary: "Experience cinematic quality with our 4K Ultra HD smart TVs featuring voice control and smart home integration.",
        url: "/products?category=electronics&sub=tvs",
        image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&q=80",
    },
    {
        id: "item-2",
        title: "Modern Kitchen Appliances",
        summary: "Transform your cooking experience with energy-efficient refrigerators, smart ovens, and innovative kitchen gadgets.",
        url: "/products?category=home-appliances&sub=kitchen",
        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    },
    {
        id: "item-3",
        title: "Elegant Furniture",
        summary: "Discover handcrafted solid wood furniture that combines timeless design with exceptional durability.",
        url: "/products?category=furnitures",
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
    },
    {
        id: "item-4",
        title: "Smart Home Devices",
        summary: "Automate your home with intelligent devices that learn your preferences and save energy.",
        url: "/products?category=electronics&sub=smart-home",
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    },
    {
        id: "item-5",
        title: "Laundry Solutions",
        summary: "High-efficiency washing machines and dryers with advanced fabric care technology for perfect results.",
        url: "/products?category=home-appliances&sub=washing",
        image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&q=80",
    },
];

/**
 * Fetch featured collections from API
 */
const fetchFeaturedCollections = async () => {
    try {
        const response = await api.get("/collections/featured", {
            params: { limit: 5 }
        });
        const data = response.data?.data || response.data || [];
        
        // Transform API data to match component format
        return Array.isArray(data) ? data.map(item => ({
            id: item.id || item._id,
            title: item.title || item.name,
            summary: item.summary || item.description,
            url: item.url || `/products?collection=${item.slug || item.id}`,
            image: item.image || item.thumbnail || item.coverImage
        })) : [];
    } catch (error) {
        console.error('Failed to fetch featured collections:', error);
        return [];
    }
};

export function FeaturedProjects() {
    const [featuredItems, setFeaturedItems] = useState(staticFeaturedItems);
    const [loading, setLoading] = useState(false);
    const [useApi, setUseApi] = useState(false); // Toggle to use API

    useEffect(() => {
        if (useApi) {
            const loadFeaturedCollections = async () => {
                setLoading(true);
                const items = await fetchFeaturedCollections();
                if (items.length > 0) {
                    setFeaturedItems(items);
                }
                setLoading(false);
            };
            loadFeaturedCollections();
        }
    }, [useApi]);

    if (loading) {
        return (
            <section className="py-12 md:py-16">
                <div className="container px-4 sm:px-6 lg:px-8">
                    <Skeleton className="h-8 w-64 mb-8 mx-auto" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-64 rounded-lg" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <Gallery6 
            heading="Featured Collections" 
            demoUrl="/products" 
            items={featuredItems}
        />
    );
}
