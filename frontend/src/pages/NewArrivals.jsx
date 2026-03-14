/**
 * NewArrivals Page
 * 
 * Displays recently added products (newest first).
 * Shows the latest products added to the catalog.
 * 
 * @component
 * @returns {JSX.Element} New arrivals page
 */

import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { Sparkles, RefreshCw } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { toast } from '@/hooks/use-toast';
import { productApi } from '@/services/api';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function NewArrivals() {
    const [newProducts, setNewProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        AOS.init({ duration: 600, easing: "ease-out-cubic", once: true, offset: 50 });
    }, []);

    /**
     * Extract products array from various API response structures
     */
    const extractProductsArray = useCallback((response) => {
        if (!response) return [];
        
        console.log('Extracting products from:', response);

        // Direct array
        if (Array.isArray(response)) {
            return response;
        }

        // Response has data property
        if (response.data) {
            if (Array.isArray(response.data)) return response.data;
            if (response.data.products && Array.isArray(response.data.products)) {
                return response.data.products;
            }
            if (response.data.data && Array.isArray(response.data.data)) {
                return response.data.data;
            }
            if (response.data.items && Array.isArray(response.data.items)) {
                return response.data.items;
            }
            if (response.data.results && Array.isArray(response.data.results)) {
                return response.data.results;
            }
            if (typeof response.data === 'object' && !Array.isArray(response.data)) {
                const values = Object.values(response.data);
                if (values.length > 0 && values.every(v => typeof v === 'object')) {
                    return values;
                }
            }
        }

        // Response has direct properties
        if (response.products && Array.isArray(response.products)) {
            return response.products;
        }
        if (response.items && Array.isArray(response.items)) {
            return response.items;
        }
        if (response.results && Array.isArray(response.results)) {
            return response.results;
        }

        // Response is object with numeric keys
        if (typeof response === 'object' && !Array.isArray(response)) {
            const values = Object.values(response);
            if (values.length > 0 && values.every(v => typeof v === 'object')) {
                return values;
            }
        }

        return [];
    }, []);

    /**
     * Fetch with retry logic
     */
    const fetchWithRetry = useCallback(async (retries = 3) => {
        for (let i = 0; i < retries; i++) {
            try {
                const res = await productApi.getNewArrivals(50, {
                    params: { 
                        _t: Date.now(),
                        cache: 'no-cache'
                    },
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });
                
                console.log(`API Response (attempt ${i + 1}):`, res);
                return res;
            } catch (err) {
                console.error(`Attempt ${i + 1} failed:`, err);
                
                if (i === retries - 1) throw err;
                
                await new Promise(resolve => 
                    setTimeout(resolve, 1000 * Math.pow(2, i))
                );
            }
        }
    }, []);

    /**
     * Fetch new arrivals
     */
    const fetchNewArrivals = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const res = await fetchWithRetry(3);
            const products = extractProductsArray(res);
            
            console.log('Extracted products:', products);
            setNewProducts(products);
            
            if (products.length === 0) {
                toast({
                    title: "No Products Found",
                    description: "No new arrivals at the moment.",
                    variant: "default"
                });
            }
        } catch (err) {
            console.error('Failed to load new arrivals:', err);
            
            let errorMessage = 'Failed to load new arrivals';
            
            if (err.response) {
                errorMessage = err.response.data?.message || 
                              err.response.statusText || 
                              errorMessage;
            } else if (err.request) {
                errorMessage = 'Network error - please check your connection';
            } else {
                errorMessage = err.message || errorMessage;
            }
            
            setError(errorMessage);
            
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [fetchWithRetry, extractProductsArray]);

    /**
     * Initial fetch and retry on retryCount change
     */
    useEffect(() => {
        let cancelled = false;
        
        if (!cancelled) {
            fetchNewArrivals();
        }
        
        return () => { cancelled = true; };
    }, [fetchNewArrivals, retryCount]);

    /**
     * Handle retry button click
     */
    const handleRetry = () => {
        setRetryCount(prev => prev + 1);
    };

    /**
     * Render loading skeletons
     */
    const renderSkeletons = () => (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                    <Skeleton className="w-full aspect-[4/5] rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            ))}
        </div>
    );

    /**
     * Render error state
     */
    const renderError = () => (
        <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="bg-destructive/10 rounded-full p-4 mb-4">
                <Sparkles className="w-12 h-12 text-destructive" />
            </div>
            <p className="text-destructive text-center text-lg font-medium mb-2">
                Oops! Something went wrong
            </p>
            <p className="text-muted-foreground text-center text-sm mb-6">
                {error}
            </p>
            <Button 
                onClick={handleRetry}
                variant="default"
                className="flex items-center gap-2"
            >
                <RefreshCw className="w-4 h-4" />
                Try Again
            </Button>
        </div>
    );

    /**
     * Render empty state
     */
    const renderEmpty = () => (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-muted/30 rounded-full p-4 mb-4">
                <Sparkles className="w-12 h-12 text-muted-foreground opacity-50" />
            </div>
            <p className="text-muted-foreground text-center text-lg">
                No new arrivals at the moment.
            </p>
            <p className="text-muted-foreground text-center text-sm mt-2">
                Check back soon for new products!
            </p>
        </div>
    );

    return (
        <div className="min-h-screen bg-background overflow-x-hidden md:pb-0">
            <Header />
            
            {/* Breadcrumb */}
            <div className="bg-card border-b border-border">
                <div className="container py-2 px-3 md:px-4">
                    <nav className="text-xs md:text-sm text-muted-foreground">
                        <Link to="/" className="hover:text-accent">Home</Link>
                        <span className="mx-1.5 md:mx-2">›</span>
                        <span className="text-foreground font-medium">New Arrivals</span>
                    </nav>
                </div>
            </div>

            {/* Banner */}
            <div className="container px-3 md:px-4 py-4 md:py-6">
                <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-8 md:py-10 text-center">
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 mb-3">
                            <Sparkles className="w-5 h-5 text-primary-foreground"/>
                            <span className="text-primary-foreground/90 text-sm font-medium">Just Launched</span>
                        </div>
                        <h1 className="text-2xl md:text-4xl font-bold text-primary-foreground mb-2">
                            New Arrivals
                        </h1>
                        <p className="text-primary-foreground/80 text-sm md:text-base max-w-md mx-auto">
                            Discover the latest products • Up to 25% off on new launches
                        </p>
                    </div>
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/10 rounded-full -translate-y-1/2 translate-x-1/2"/>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-foreground/10 rounded-full translate-y-1/2 -translate-x-1/2"/>
                </div>
            </div>

            {/* Products Section */}
            <div className="container py-4 md:py-6 px-3 md:px-4">
                {loading ? (
                    renderSkeletons()
                ) : error ? (
                    renderError()
                ) : newProducts.length === 0 ? (
                    renderEmpty()
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                        {newProducts.map((product, index) => (
                            <Link 
                                key={product.id || product._id || `product-${index}`} 
                                to={`/product/${product.slug || product.id || product._id}`} 
                                className="block" 
                                data-aos="fade-up" 
                                data-aos-delay={Math.min(index * 50, 200)}
                            >
                                <ProductCard product={product} variant="compact"/>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}