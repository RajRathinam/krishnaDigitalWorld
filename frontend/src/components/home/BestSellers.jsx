/**
 * BestSellers Component
 * 
 * Displays best-selling products in a gallery layout.
 * 
 * @component
 * @returns {JSX.Element} Best sellers component
 */

import { Gallery4 } from "@/components/ui/gallery4";
import { SplitHeading } from "@/components/ui/split-heading";
import { TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { productApi } from '@/services/api';
import { getImageUrl } from "@/lib/utils";

// Helper function to parse product data
const parseProductData = (productData) => {
    if (!productData) return productData;
    
    const parsed = { ...productData };
    
    if (typeof parsed.colorsAndImages === 'string') {
        try {
            const cleanedData = parsed.colorsAndImages.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            parsed.colorsAndImages = JSON.parse(cleanedData);
        } catch (error) {
            parsed.colorsAndImages = {};
        }
    }
    
    if (typeof parsed.images === 'string') {
        try {
            const cleanedData = parsed.images.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            parsed.images = JSON.parse(cleanedData);
        } catch (error) {
            parsed.images = [];
        }
    }
    
    return parsed;
};

// Helper function to get product image
const getProductImage = (parsedProduct) => {
    let imageUrl = '/placeholder.svg';
    
    if (parsedProduct.colorsAndImages && typeof parsedProduct.colorsAndImages === 'object') {
        const colorKeys = Object.keys(parsedProduct.colorsAndImages);
        if (colorKeys.length > 0) {
            const firstColor = colorKeys[0];
            const colorImages = parsedProduct.colorsAndImages[firstColor];
            if (Array.isArray(colorImages) && colorImages.length > 0) {
                const firstImg = colorImages[0];
                if (firstImg) {
                    imageUrl = typeof firstImg === 'string' ? firstImg : (firstImg.url || firstImg);
                }
            }
        }
    }
    
    if (imageUrl === '/placeholder.svg' && Array.isArray(parsedProduct.images) && parsedProduct.images.length > 0) {
        const firstImg = parsedProduct.images[0];
        if (firstImg) {
            imageUrl = typeof firstImg === 'string' ? firstImg : (firstImg.url || firstImg);
        }
    }
    
    if (imageUrl === '/placeholder.svg' && parsedProduct.featuredImage) {
        imageUrl = parsedProduct.featuredImage;
    }
    
    if (imageUrl === '/placeholder.svg' && parsedProduct.image) {
        imageUrl = typeof parsedProduct.image === 'string' 
            ? parsedProduct.image 
            : (parsedProduct.image.url || '/placeholder.svg');
    }
    
    return getImageUrl(imageUrl);
};

/**
 * Fetch best sellers from API
 */
const fetchBestSellers = async () => {
    try {
        const response = await productApi.getBestSellers(8);
        
        let data = [];
        
        if (response.success && response.data) {
            data = response.data;
        } else if (response.products) {
            data = response.products;
        } else if (Array.isArray(response)) {
            data = response;
        } else if (response.data && Array.isArray(response.data)) {
            data = response.data;
        } else {
            return [];
        }
        
        const products = data.map((product, index) => {
            const parsedProduct = parseProductData(product);
            const productId = parsedProduct.id || parsedProduct._id || parsedProduct.productId || `product-${index}`;
            const title = parsedProduct.name || parsedProduct.title || parsedProduct.productName || "Product";
            
            // Get image using the same logic as ProductCard
            const image = getProductImage(parsedProduct);
            
            // Create slug from title or ID
            const slug = parsedProduct.slug || productId || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            
            // Return simplified product object with only image data
            return {
                id: productId,
                href: `/product/${slug}`,
                image: image
            };
        }).filter(product => product.id);
        
        return products;
        
    } catch (error) {
        console.error('Failed to fetch best sellers:', error);
        return [];
    }
};

export function BestSellers() {
    const [bestSellerItems, setBestSellerItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadBestSellers = async () => {
            setLoading(true);
            try {
                const items = await fetchBestSellers();
                setBestSellerItems(items);
            } catch (error) {
                console.error('Error loading best sellers:', error);
                setBestSellerItems([]);
            } finally {
                setLoading(false);
            }
        };
        
        loadBestSellers();
    }, []);

    return (
        <section className="py-6 md:py-20 relative overflow-hidden bg-muted/30">
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
                        <p className="text-xs md:text-md text-muted-foreground mt-1">
                            Our most popular products this week
                        </p>
                    </div>
                </div>

                {/* Products Gallery */}
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-3">
                                <Skeleton className="w-full aspect-square rounded-lg" />
                            </div>
                        ))}
                    </div>
                ) : bestSellerItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="p-4 bg-purple-100 dark:bg-purple-900/20 rounded-full mb-4">
                            <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            No Best Sellers Available
                        </h3>
                        <p className="text-muted-foreground text-center max-w-md">
                            Best selling products will appear here. Check back soon for our top-rated items!
                        </p>
                    </div>
                ) : (
                    <Gallery4
                        title=""
                        description=""
                        items={bestSellerItems}
                    />
                )}
            </div>
        </section>
    );
}