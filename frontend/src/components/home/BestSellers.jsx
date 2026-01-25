/**
 * BestSellers Component
 * 
 * Displays best-selling products in a gallery layout.
 * Shows trending products that are popular with customers.
 * 
 * Features:
 * - Gallery layout for products
 * - Trending indicator
 * - Product cards with ratings
 * - Responsive design
 * - Can fetch from API or use static data
 * 
 * @component
 * @returns {JSX.Element} Best sellers component
 */

import { Gallery4 } from "@/components/ui/gallery4";
import { SplitHeading } from "@/components/ui/split-heading";
import { TrendingUp, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { productApi } from '@/services/api';

// Static best seller items (can be replaced with API call)
const staticBestSellerItems = [
    {
        id: "ceiling-fan",
        title: "Bajaj 1200mm Ceiling Fan",
        description: "High-performance ceiling fan with energy-efficient motor and elegant design. Perfect for any room.",
        href: "/product/5",
        image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&h=400&fit=crop",
    },
    {
        id: "led-bulb",
        title: "Philips 9W LED Bulb Pack",
        description: "Energy-saving LED bulbs with bright white light. Pack of 4 for complete home lighting.",
        href: "/product/6",
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
    },
    {
        id: "induction",
        title: "Prestige Induction Cooktop",
        description: "Advanced induction cooking with precise temperature control and safety features.",
        href: "/product/7",
        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop",
    },
    {
        id: "otg",
        title: "Morphy Richards OTG 25L",
        description: "Versatile oven toaster griller for baking, grilling, and toasting. Perfect for modern kitchens.",
        href: "/product/8",
        image: "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=600&h=400&fit=crop",
    },
    {
        id: "mixer",
        title: "Butterfly Mixer Grinder 750W",
        description: "Powerful mixer grinder with multiple jars for all your blending and grinding needs.",
        href: "/product/9",
        image: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&h=400&fit=crop",
    },
    {
        id: "water-heater",
        title: "Havells Instant Water Heater",
        description: "3L instant water heater with advanced safety features and quick heating technology.",
        href: "/product/10",
        image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&h=400&fit=crop",
    },
    {
        id: "iron",
        title: "Philips Dry Iron",
        description: "Lightweight dry iron with non-stick coating and uniform heating.",
        href: "/product/11",
        image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&h=400&fit=crop",
    }
];

/**
 * Fetch best sellers from API
 */
const fetchBestSellers = async () => {
    try {
        const response = await productApi.getBestSellers(7);
        const data = response.data || response.products || response.data?.data || response;
        
        // Transform API data to match component format
        const products = Array.isArray(data) ? data : (data.data || data.products || []);
        return products.map(product => {
            // Get first image from colorsAndImages or images array
            let image = '/placeholder.svg';
            if (product.colorsAndImages && typeof product.colorsAndImages === 'object') {
                const firstColor = Object.keys(product.colorsAndImages)[0];
                if (firstColor && product.colorsAndImages[firstColor]?.[0]) {
                    const firstImg = product.colorsAndImages[firstColor][0];
                    image = typeof firstImg === 'string' ? firstImg : (firstImg.url || firstImg);
                }
            } else if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                const firstImg = product.images[0];
                image = typeof firstImg === 'string' ? firstImg : (firstImg.url || firstImg);
            }
            
            return {
                id: product.id || product._id,
                title: product.name || product.title,
                description: product.description || product.shortDescription,
                href: `/product/${product.slug || product.id}`,
                image: image
            };
        });
    } catch (error) {
        console.error('Failed to fetch best sellers:', error);
        return [];
    }
};

export function BestSellers() {
    const [bestSellerItems, setBestSellerItems] = useState(staticBestSellerItems);
    const [loading, setLoading] = useState(true);
    const [useApi, setUseApi] = useState(false); // Toggle to use API

    useEffect(() => {
        if (useApi) {
            const loadBestSellers = async () => {
                setLoading(true);
                const items = await fetchBestSellers();
                if (items.length > 0) {
                    setBestSellerItems(items);
                }
                setLoading(false);
            };
            loadBestSellers();
        } else {
            setLoading(false);
        }
    }, [useApi]);

    return (
        <section className="py-12 md:py-20 relative overflow-hidden bg-muted/30">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />

            <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="flex items-center gap-3 mb-8 md:mb-12">
                    {/* Trending Icon */}
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    
                    {/* Title */}
                    <div>
                        <SplitHeading 
                            text="Best Sellers" 
                            className="text-2xl md:text-3xl font-bold" 
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                            Our most popular products this week
                        </p>
                    </div>
                </div>

                {/* Products Gallery */}
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="space-y-3">
                                <Skeleton className="w-full aspect-[4/3] rounded-lg" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : bestSellerItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <p className="text-muted-foreground">No best sellers available at the moment.</p>
                    </div>
                ) : (
                    <Gallery4
                        title=""
                        description="Loved by thousands of happy customers."
                        items={bestSellerItems}
                    />
                )}
            </div>
        </section>
    );
}
