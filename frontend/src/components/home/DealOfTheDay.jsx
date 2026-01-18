import { Clock, Zap, ArrowRight, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from '@/hooks/use-toast';
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
    },
    getProductsByCategory: async (categorySlug, params) => {
        const response = await api.get(`/products/category/${categorySlug}`, { params });
        return response.data;
    },
    getProductsByBrand: async (brandSlug, params) => {
        const response = await api.get(`/products/brand/${brandSlug}`, { params });
        return response.data;
    },
    getRelatedProducts: async (productId, limit = 4) => {
        const response = await api.get(`/products/${productId}/related`, {
            params: { limit }
        });
        return response.data;
    },
    searchProducts: async (query, params) => {
        const response = await api.get("/products/search", {
            params: { query, ...params }
        });
        return response.data;
    }
};
export function DealOfTheDay() {
    const [dealProducts, setDealProducts] = useState([]);
    useEffect(() => {
        let cancelled = false;
        const fetchDealProducts = async () => {
            try {
                const response = await productApi.getFeaturedProducts();
                const fetched = response.data || response.products || response.data?.data || response;
                if (!cancelled) {
                    setDealProducts(Array.isArray(fetched) ? fetched.slice(0, 4) : (fetched.data || fetched.products || []).slice(0, 4));
                }
            }
            catch (err) {
                console.error('Failed to load deal products', err);
                toast({
                    title: "Error",
                    description: err.response?.data?.message || err?.message || 'Failed to load deals',
                    variant: "destructive"
                });
            }
        };
        fetchDealProducts();
        return () => {
            cancelled = true;
        };
    }, []);
    return (<section className="py-8 md:py-12 relative overflow-hidden">
        {/* Colorful background accents */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-yellow-500/5 pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="container relative">
            {/* Header */}
            <div className="flex items-end justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent to-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-accent/30 animate-glow">
                        <Zap className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <SplitHeading text="Deal of the Day" className="text-2xl md:text-3xl font-bold" />
                            <Sparkles className="w-5 h-5 text-accent animate-color-wave" />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-4 h-4 text-destructive" />
                            <span className="text-sm text-destructive font-medium">Ends in 05:23:45</span>
                        </div>
                    </div>
                </div>
                <Link to="/products?deals=true" className="hidden sm:flex items-center gap-1 text-sm font-medium text-accent hover:gap-2 transition-all duration-300">
                    View all deals <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Mobile: Horizontal Scroll */}
            <div className="md:hidden">
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory">
                    {dealProducts.map((product) => (
                        <div key={product.id} className="flex-shrink-0 w-[240px] snap-center first:pl-2 last:pr-2">
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Desktop Grid */}
            <div className="hidden md:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {dealProducts.map((product, index) => (<div key={product.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                    <ProductCard product={product} />
                </div>))}
            </div>

            {/* Mobile view all */}
            <Link to="/products?deals=true" className="sm:hidden flex items-center justify-center gap-1 text-sm font-medium text-accent mt-4 py-3 border-t border-border">
                View all deals <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
    </section>);
}
