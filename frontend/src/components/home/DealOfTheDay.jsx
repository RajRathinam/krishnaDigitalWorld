import { Clock, Zap, ArrowRight, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from '@/hooks/use-toast';
import { SplitHeading } from "@/components/ui/split-heading";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";

// Product API functions
const productApi = {
    getFeaturedProducts: async (limit) => {
        const response = await api.get("/products/featured", {
            params: { limit: limit || 10 }
        });
        return response.data;
    }
};

export function DealOfTheDay() {
    const [dealProducts, setDealProducts] = useState([]);
    const [loading, setLoading] = useState(true);

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
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchDealProducts();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <section className="py-12 md:py-20 relative overflow-hidden">
            {/* Background Mesh */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-orange-500/5 pointer-events-none" />

            <div className="container relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-4">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-accent to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-accent/30 animate-pulse-slow">
                            <Zap className="w-7 h-7 md:w-8 md:h-8 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <SplitHeading text="Deal of the Day" className="text-3xl md:text-4xl font-bold tracking-tight" />
                                <Sparkles className="w-5 h-5 text-accent animate-bounce" />
                            </div>
                            <div className="flex items-center gap-2 mt-2 bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full w-max">
                                <Clock className="w-4 h-4 text-red-600 dark:text-red-400" />
                                <span className="text-sm text-red-600 dark:text-red-400 font-bold tracking-wide">Ends in 05:23:45</span>
                            </div>
                        </div>
                    </div>

                    <Link to="/deals" className="hidden md:flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent/80 transition-colors group bg-accent/10 px-4 py-2 rounded-full">
                        View All Deals <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-3">
                                <Skeleton className="w-full aspect-[4/5] rounded-2xl" />
                                <Skeleton className="h-4 w-3/4 rounded-full" />
                                <Skeleton className="h-4 w-1/2 rounded-full" />
                            </div>
                        ))
                    ) : (
                        dealProducts.map((product) => (
                            <div key={product.id} className="transform hover:-translate-y-2 transition-transform duration-300 h-full">
                                <ProductCard product={product} />
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-8 text-center md:hidden">
                    <Link to="/deals" className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent/80 transition-colors">
                        View All Deals <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
