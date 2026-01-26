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

// Brand data using local logos from public/logos/
const brands = [
    { 
        id: 1,
        name: "Samsung", 
        logo: "/logos/samsung logo.png",
        slug: "samsung"
    },
    { 
        id: 2,
        name: "LG", 
        logo: "/logos/LG-Logo-PNG-Clipart.png",
        slug: "lg"
    },
    { 
        id: 3,
        name: "Sony", 
        logo: "/logos/Sony-Logo.png",
        slug: "sony"
    },
    { 
        id: 4,
        name: "Whirlpool", 
        logo: "/logos/whirlpool.png",
        slug: "whirlpool"
    },
    { 
        id: 5,
        name: "Panasonic", 
        logo: "/logos/panasonic-logo-2.png",
        slug: "panasonic"
    },
    { 
        id: 6,
        name: "Daikin", 
        logo: "/logos/Daikin-Logo-1963.png",
        slug: "daikin"
    },
    { 
        id: 7,
        name: "Haier", 
        logo: "/logos/haier-logo.png",
        slug: "haier"
    },
];

const brands2 = [
    { 
        id: 8,
        name: "Voltas", 
        logo: "/logos/voltas-logo-scaled.png",
        slug: "voltas"
    },
    { 
        id: 9,
        name: "Crompton", 
        logo: "/logos/Crompton-Logo-Vector.svg-.png",
        slug: "crompton"
    },
    { 
        id: 10,
        name: "Havells", 
        logo: "/logos/Havells-Logo.png",
        slug: "havells"
    },
    { 
        id: 11,
        name: "IFB", 
        logo: "/logos/IFBIND.NS_BIG.png",
        slug: "ifb"
    },
    { 
        id: 12,
        name: "Intex", 
        logo: "/logos/Intex Technologies.png",
        slug: "intex"
    },
    { 
        id: 13,
        name: "Godrej", 
        logo: "/logos/godrej-logo-png-8-removebg-preview.png",
        slug: "godrej"
    },
    { 
        id: 14,
        name: "Blue Star", 
        logo: "/logos/BLUESTARCO.NS_BIG-4cacecc3.png",
        slug: "blue-star"
    },
    { 
        id: 15,
        name: "V-Guard", 
        logo: "/logos/vguard-logo.png",
        slug: "v-guard"
    },
    { 
        id: 16,
        name: "TCL", 
        logo: "/logos/tcl.png",
        slug: "tcl"
    },
    { 
        id: 17,
        name: "Cello", 
        logo: "/logos/cello-logo-png_seeklogo-305045.png",
        slug: "cello"
    },
    { 
        id: 18,
        name: "Preethi", 
        logo: "/logos/preethi.jpg",
        slug: "preethi"
    },
    { 
        id: 19,
        name: "Butterfly", 
        logo: "/logos/butterfly.png",
        slug: "butterfly"
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
                    <div className="mb-8 flex w-max animate-scroll-left gap-12 md:gap-16">
                        {repeatedBrands(brands, 4).map((brand, i) => (
                            <Link
                                key={`${brand.slug}-${i}`}
                                to={`/products?brand=${brand.slug}`}
                                className="flex h-20 w-20 md:h-24 md:w-24 shrink-0 items-center justify-center p-2 transition-all duration-300 hover:scale-110 bg-white rounded-lg shadow-sm hover:shadow-md"
                                aria-label={`Browse ${brand.name} products`}
                            >
                                <img 
                                    src={brand.logo} 
                                    alt={brand.name} 
                                    className="h-full w-full object-contain transition-all duration-300 hover:opacity-100"
                                    loading="lazy"
                                    onError={(e) => {
                                        console.error(`Failed to load logo for ${brand.name}: ${brand.logo}`);
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
                                key={`${brand.slug}-${i}`}
                                to={`/products?brand=${brand.slug}`}
                                className="flex h-20 w-20 md:h-24 md:w-24 shrink-0 items-center justify-center p-2 transition-all duration-300 hover:scale-110 bg-white rounded-lg shadow-sm hover:shadow-md"
                                aria-label={`Browse ${brand.name} products`}
                            >
                                <img 
                                    src={brand.logo} 
                                    alt={brand.name} 
                                    className="h-full w-full object-contain transition-all duration-300 hover:opacity-100"
                                    loading="lazy"
                                    onError={(e) => {
                                        console.error(`Failed to load logo for ${brand.name}: ${brand.logo}`);
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
                    animation: scroll-left 30s linear infinite;
                }
                .animate-scroll-right {
                    animation: scroll-right 30s linear infinite;
                }
            `}</style>
        </section>
    );
}