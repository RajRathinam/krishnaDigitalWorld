/**
 * BrandShowcase Component
 * 
 * Displays featured brands in an infinite scrolling carousel.
 * Shows brand logos with smooth animations.
 * 
 * Features:
 * - Fetches brands from backend API
 * - Infinite scrolling animation
 * - Two rows scrolling in opposite directions
 * - Brand logo display
 * - Clickable brand links
 * - Responsive design
 * - Fade overlays on edges
 * 
 * @component
 * @returns {JSX.Element} Brand showcase component
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { SplitHeading } from "@/components/ui/split-heading";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function BrandShowcase() {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get("/brands");
            
            // Handle different response structures
            const data = res.data?.data || res.data || [];
            const brandsData = Array.isArray(data) ? data : [];
            
            // Filter only active brands that have logos
            const activeBrands = brandsData.filter(brand => 
                brand.isActive !== false && brand.logo
            );
            
            setBrands(activeBrands);
        } catch (err) {
            console.error("Failed to fetch brands:", err);
            setError("Failed to load brands");
        } finally {
            setLoading(false);
        }
    };

    /**
     * Split brands into two arrays for the two rows
     */
    const splitBrandsIntoRows = (brandsArray) => {
        const midPoint = Math.ceil(brandsArray.length / 2);
        return {
            row1: brandsArray.slice(0, midPoint),
            row2: brandsArray.slice(midPoint)
        };
    };

    /**
     * Repeat array items for infinite scroll effect
     * @param {Array} items - Array of items to repeat
     * @param {number} repeat - Number of times to repeat
     * @returns {Array} Repeated array
     */
    const repeatedBrands = (items, repeat = 4) => {
        if (!items.length) return [];
        return Array.from({ length: repeat }).flatMap(() => items);
    };

    // Loading skeletons
    const renderSkeletons = (count = 8) => (
        <div className="flex gap-12 md:gap-16">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex h-20 w-20 md:h-24 md:w-24 shrink-0 items-center justify-center p-2 bg-white rounded-lg shadow-sm">
                    <Skeleton className="h-full w-full rounded-md" />
                </div>
            ))}
        </div>
    );

    // If no brands and not loading, don't render the section
    if (!loading && brands.length === 0) {
        return null;
    }

    const { row1, row2 } = splitBrandsIntoRows(brands);

    return (
        <section className="w-full py-6 md:py-16 bg-background overflow-hidden">
            <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                {/* Section Header */}
                <div className="text-center mb-10">
                    <SplitHeading 
                        text="Shop by Brand" 
                        className="text-2xl font-bold text-foreground md:text-3xl mb-2"
                    />
                    <p className="text-muted-foreground text-sm md:text-base">
                        Trusted brands you love
                    </p>
                </div>

                {/* Carousel Container */}
                <div className="relative w-full overflow-hidden">
                    {/* Row 1 - Scroll Left */}
                    <div className="mb-8">
                        {loading ? (
                            renderSkeletons(8)
                        ) : row1.length > 0 ? (
                            <div className="flex w-max animate-scroll-left gap-12 md:gap-16">
                                {repeatedBrands(row1, 4).map((brand, i) => (
                                    <Link
                                        key={`${brand.slug || brand.id}-${i}`}
                                        to={`/products?brand=${brand.name}`}
                                        className="flex h-20 w-20 md:h-24 md:w-24 shrink-0 items-center justify-center p-2 transition-all duration-300 hover:scale-110 bg-white rounded-lg shadow-sm hover:shadow-md"
                                        aria-label={`Browse ${brand.name} products`}
                                    >
                                        <img 
                                            src={getImageUrl(brand.logo)} 
                                            alt={brand.name} 
                                            className="h-full w-full object-contain transition-all duration-300 hover:opacity-100"
                                            loading="lazy"
                                            onError={(e) => {
                                                console.error(`Failed to load logo for ${brand.name}:`, brand.logo);
                                                e.target.onerror = null;
                                                e.target.style.display = 'none';
                                                // Optionally show fallback
                                                // e.target.parentElement.innerHTML = '<div class="text-xs text-center">Logo</div>';
                                            }}
                                        />
                                    </Link>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    {/* Row 2 - Scroll Right */}
                    <div>
                        {loading ? (
                            renderSkeletons(8)
                        ) : row2.length > 0 ? (
                            <div className="flex w-max animate-scroll-right gap-12 md:gap-16">
                                {repeatedBrands(row2, 4).map((brand, i) => (
                                    <Link
                                        key={`${brand.slug || brand.id}-${i}`}
                                        to={`/products?brand=${brand.name}`}
                                        className="flex h-20 w-20 md:h-24 md:w-24 shrink-0 items-center justify-center p-2 transition-all duration-300 hover:scale-110 bg-white rounded-lg shadow-sm hover:shadow-md"
                                        aria-label={`Browse ${brand.name} products`}
                                    >
                                        <img 
                                            src={getImageUrl(brand.logo)} 
                                            alt={brand.name} 
                                            className="h-full w-full object-contain transition-all duration-300 hover:opacity-100"
                                            loading="lazy"
                                            onError={(e) => {
                                                console.error(`Failed to load logo for ${brand.name}:`, brand.logo);
                                                e.target.onerror = null;
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    </Link>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    {/* Fade Overlays */}
                    <div className="pointer-events-none absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-background to-transparent md:w-32 z-10" />
                    <div className="pointer-events-none absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-background to-transparent md:w-32 z-10" />
                </div>

                {/* Error Message (optional) */}
                {error && !loading && (
                    <p className="text-center text-sm text-destructive mt-4">
                        {error}. Please try again later.
                    </p>
                )}
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes scroll-left {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                @keyframes scroll-right {
                    0% { transform: translateX(-50%); }
                    100% { transform: translateX(0); }
                }
                .animate-scroll-left {
                    animation: scroll-left 30s linear infinite;
                }
                .animate-scroll-right {
                    animation: scroll-right 30s linear infinite;
                }
                
                /* Pause animation on hover for better UX */
                .animate-scroll-left:hover,
                .animate-scroll-right:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </section>
    );
}