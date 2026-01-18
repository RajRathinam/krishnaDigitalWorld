import { ProductCard } from "@/components/product/ProductCard";
import { Link } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { SplitHeading } from "@/components/ui/split-heading";
import api from "@/lib/api";

// Product API functions
const productApi = {
    getFeaturedProducts: async (limit) => {
        const response = await api.get("/products/featured", {
            params: { limit: limit || 10 }
        });
        return response.data;
    },
    getProducts: async (params) => {
        const response = await api.get("/products", { params });
        return response.data;
    },
    getProduct: async (identifier) => {
        const response = await api.get(`/products/${identifier}`);
        return response.data;
    }
};
export function ProductShowcase() {
    const scrollRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const totalDots = 4;
    const [featuredProducts, setFeaturedProducts] = useState([]);
    useEffect(() => {
        let cancelled = false;
        const fetchFeaturedProducts = async () => {
            try {
                const response = await productApi.getFeaturedProducts();
                const fetched = response.data || response.products || response.data?.data || response;
                if (!cancelled) {
                    setFeaturedProducts(Array.isArray(fetched) ? fetched : fetched.data || fetched.products || []);
                }
            }
            catch (err) {
                // silently fail; product showcase is optional
                console.error('Failed to load featured products', err);
            }
        };
        fetchFeaturedProducts();
        return () => {
            cancelled = true;
        };
    }, []);
    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer)
            return;
        const handleScroll = () => {
            const scrollLeft = scrollContainer.scrollLeft;
            const cardWidth = 220;
            const index = Math.round(scrollLeft / (cardWidth * 2));
            setActiveIndex(Math.min(index, totalDots - 1));
        };
        scrollContainer.addEventListener("scroll", handleScroll);
        return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }, []);
    const scrollToIndex = (index) => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer)
            return;
        const cardWidth = 220;
        scrollContainer.scrollTo({
            left: index * cardWidth * 2,
            behavior: "smooth",
        });
    };
    return (<section className="w-full mt-6 px-3 md:px-4 lg:px-8">
        <div className="bg-card rounded-xl p-4 md:p-5 border border-border/50 relative overflow-hidden">
            {/* Colorful accent */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-accent/10 to-transparent rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4 relative">
                <SplitHeading text="Top Picks For You" className="text-lg md:text-xl font-bold" />
                <Link to="/products" className="text-accent hover:underline text-sm font-medium flex items-center gap-1 group">
                    See all <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
            </div>

            {/* Mobile: Horizontal scroll with indicators */}
            <div className="md:hidden">
                <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-1 px-1 snap-x snap-mandatory">
                    {(featuredProducts.length ? featuredProducts.slice(0, 8) : []).map((product) => (<div key={product.id} className="flex-shrink-0 w-[240px] snap-center first:pl-2 last:pr-2">
                        <ProductCard product={product} variant="compact" />
                    </div>))}
                </div>

                {/* Swipe Indicators */}
                <div className="flex justify-center gap-2 mt-2">
                    {Array.from({ length: totalDots }).map((_, index) => (<button key={index} onClick={() => scrollToIndex(index)} className={`h-1.5 rounded-full transition-all duration-300 ${activeIndex === index
                        ? "w-8 bg-accent"
                        : "w-2 bg-muted-foreground/20"}`} aria-label={`Go to slide ${index + 1}`} />))}
                </div>
            </div>

            {/* Desktop Grid - 4 columns for better density */}
            <div className="hidden md:grid md:grid-cols-4 gap-4 md:gap-5 relative">
                {(featuredProducts.length ? featuredProducts.slice(0, 8) : []).map((product, index) => (<div key={product.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <ProductCard product={product} variant="default" />
                </div>))}
            </div>
        </div>
    </section>);
}
