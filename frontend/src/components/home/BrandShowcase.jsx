/**
 * BrandShowcase Component
 * 
 * Displays featured brands in an infinite scrolling carousel.
 * Shows brand logos with smooth animations.
 * 
 * Features:
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

import { Link } from "react-router-dom";
import { SplitHeading } from "@/components/ui/split-heading";

// Brand data - Can be moved to API/Config
const brands = [
    { 
        id: 1,
        name: "Samsung", 
        logo: "https://cdn-icons-png.flaticon.com/512/882/882747.png",
        slug: "samsung"
    },
    { 
        id: 2,
        name: "LG", 
        logo: "https://cdn-icons-png.flaticon.com/512/5969/5969267.png",
        slug: "lg"
    },
    { 
        id: 3,
        name: "Sony", 
        logo: "https://cdn-icons-png.flaticon.com/512/731/731935.png",
        slug: "sony"
    },
    { 
        id: 4,
        name: "Whirlpool", 
        logo: "https://cdn-icons-png.flaticon.com/512/5969/5969059.png",
        slug: "whirlpool"
    },
    { 
        id: 5,
        name: "Panasonic", 
        logo: "https://cdn-icons-png.flaticon.com/512/5969/5969183.png",
        slug: "panasonic"
    },
    { 
        id: 6,
        name: "Philips", 
        logo: "https://cdn-icons-png.flaticon.com/512/882/882726.png",
        slug: "philips"
    },
    { 
        id: 7,
        name: "Bosch", 
        logo: "https://cdn-icons-png.flaticon.com/512/5969/5969125.png",
        slug: "bosch"
    },
];

const brands2 = [
    { 
        id: 8,
        name: "Daikin", 
        logo: "https://cdn-icons-png.flaticon.com/512/5968/5968854.png",
        slug: "daikin"
    },
    { 
        id: 9,
        name: "Voltas", 
        logo: "https://cdn-icons-png.flaticon.com/512/732/732221.png",
        slug: "voltas"
    },
    { 
        id: 10,
        name: "Bajaj", 
        logo: "https://cdn-icons-png.flaticon.com/512/733/733609.png",
        slug: "bajaj"
    },
    { 
        id: 11,
        name: "Prestige", 
        logo: "https://cdn-icons-png.flaticon.com/512/732/732084.png",
        slug: "prestige"
    },
    { 
        id: 12,
        name: "Havells", 
        logo: "https://cdn-icons-png.flaticon.com/512/733/733585.png",
        slug: "havells"
    },
    { 
        id: 13,
        name: "Crompton", 
        logo: "https://cdn-icons-png.flaticon.com/512/281/281763.png",
        slug: "crompton"
    },
    { 
        id: 14,
        name: "Orient", 
        logo: "https://cdn-icons-png.flaticon.com/512/888/888879.png",
        slug: "orient"
    },
];

/**
 * Repeat array items for infinite scroll effect
 * @param {Array} items - Array of items to repeat
 * @param {number} repeat - Number of times to repeat
 * @returns {Array} Repeated array
 */
const repeatedBrands = (items, repeat = 4) => {
    return Array.from({ length: repeat }).flatMap(() => items);
};

export function BrandShowcase() {
    return (
        <section className="w-full py-12 md:py-16 bg-background overflow-hidden">
            <div className="mx-auto px-4 sm:px-6 lg:px-8">
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
                    <div className="mb-8 flex w-max animate-scroll-left gap-12 md:gap-16">
                        {repeatedBrands(brands, 4).map((brand, i) => (
                            <Link
                                key={`${brand.name}-${i}`}
                                to={`/products?brand=${brand.slug}`}
                                className="flex h-14 w-14 md:h-16 md:w-16 shrink-0 items-center justify-center transition-opacity duration-300 hover:opacity-70 hover:scale-110"
                                aria-label={`Browse ${brand.name} products`}
                            >
                                <img 
                                    src={brand.logo} 
                                    alt={brand.name} 
                                    className="h-full w-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                                    loading="lazy"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </Link>
                        ))}
                    </div>

                    {/* Row 2 - Scroll Right */}
                    <div className="flex w-max animate-scroll-right gap-12 md:gap-16">
                        {repeatedBrands(brands2, 4).map((brand, i) => (
                            <Link
                                key={`${brand.name}-${i}`}
                                to={`/products?brand=${brand.slug}`}
                                className="flex h-14 w-14 md:h-16 md:w-16 shrink-0 items-center justify-center transition-opacity duration-300 hover:opacity-70 hover:scale-110"
                                aria-label={`Browse ${brand.name} products`}
                            >
                                <img 
                                    src={brand.logo} 
                                    alt={brand.name} 
                                    className="h-full w-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                                    loading="lazy"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </Link>
                        ))}
                    </div>

                    {/* Fade Overlays */}
                    <div className="pointer-events-none absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-background to-transparent md:w-32 z-10" />
                    <div className="pointer-events-none absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-background to-transparent md:w-32 z-10" />
                </div>
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
                    animation: scroll-left 25s linear infinite;
                }
                .animate-scroll-right {
                    animation: scroll-right 25s linear infinite;
                }
            `}</style>
        </section>
    );
}
