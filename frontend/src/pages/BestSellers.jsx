/**
 * BestSellers Page
 * 
 * Displays products marked as "Best Seller" by admin.
 * Shows popular products that are top-rated and best-selling.
 * 
 * @component
 * @returns {JSX.Element} Best sellers page
 */

import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { Trophy, RefreshCw } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { toast } from '@/hooks/use-toast';
import { productApi } from '@/services/api';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function BestSellers() {
    const [bestSellerProducts, setBestSellerProducts] = useState([]);
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
        // Handle null/undefined
        if (!response) return [];
        
        console.log('Extracting products from:', response);

        // Case 1: Direct array
        if (Array.isArray(response)) {
            console.log('Response is direct array');
            return response;
        }

        // Case 2: Response has data property
        if (response.data) {
            console.log('Response has data property:', response.data);
            
            // Data is array
            if (Array.isArray(response.data)) {
                console.log('Data is array');
                return response.data;
            }
            
            // Data has products array
            if (response.data.products && Array.isArray(response.data.products)) {
                console.log('Data has products array');
                return response.data.products;
            }
            
            // Data has data array (nested)
            if (response.data.data && Array.isArray(response.data.data)) {
                console.log('Data has nested data array');
                return response.data.data;
            }
            
            // Data has items array
            if (response.data.items && Array.isArray(response.data.items)) {
                console.log('Data has items array');
                return response.data.items;
            }
            
            // Data has results array
            if (response.data.results && Array.isArray(response.data.results)) {
                console.log('Data has results array');
                return response.data.results;
            }
            
            // Data is an object with numeric keys (like API returns)
            if (typeof response.data === 'object' && !Array.isArray(response.data)) {
                const values = Object.values(response.data);
                if (values.length > 0 && values.every(v => typeof v === 'object')) {
                    console.log('Data is object with numeric keys');
                    return values;
                }
            }
        }

        // Case 3: Response has products property
        if (response.products && Array.isArray(response.products)) {
            console.log('Response has products property');
            return response.products;
        }

        // Case 4: Response has items property
        if (response.items && Array.isArray(response.items)) {
            console.log('Response has items property');
            return response.items;
        }

        // Case 5: Response has results property
        if (response.results && Array.isArray(response.results)) {
            console.log('Response has results property');
            return response.results;
        }

        // Case 6: Response is an object with numeric keys
        if (typeof response === 'object' && !Array.isArray(response)) {
            const values = Object.values(response);
            if (values.length > 0 && values.every(v => typeof v === 'object')) {
                console.log('Response is object with numeric keys');
                return values;
            }
        }

        console.warn('Could not extract products array from response:', response);
        return [];
    }, []);

    /**
     * Fetch with retry logic
     */
    const fetchWithRetry = useCallback(async (retries = 3) => {
        for (let i = 0; i < retries; i++) {
            try {
                // Add cache-busting parameter
                const res = await productApi.getBestSellers(50, {
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
                
                // Exponential backoff
                await new Promise(resolve => 
                    setTimeout(resolve, 1000 * Math.pow(2, i))
                );
            }
        }
    }, []);

    /**
     * Fetch best sellers
     */
    const fetchBestSellers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const res = await fetchWithRetry(3);
            const products = extractProductsArray(res);
            
            console.log('Extracted products:', products);
            
            setBestSellerProducts(products);
            
            if (products.length === 0) {
                toast({
                    title: "No Products Found",
                    description: "No best sellers available at the moment.",
                    variant: "default"
                });
            }
        } catch (err) {
            console.error('Failed to load best sellers:', err);
            
            let errorMessage = 'Failed to load best sellers';
            
            if (err.response) {
                // Server responded with error
                errorMessage = err.response.data?.message || 
                              err.response.statusText || 
                              errorMessage;
            } else if (err.request) {
                // Request made but no response
                errorMessage = 'Network error - please check your connection';
            } else {
                // Something else happened
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
            fetchBestSellers();
        }
        
        return () => { cancelled = true; };
    }, [fetchBestSellers, retryCount]);

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
                <Trophy className="w-12 h-12 text-destructive" />
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
                <Trophy className="w-12 h-12 text-muted-foreground opacity-50" />
            </div>
            <p className="text-muted-foreground text-center text-lg">
                No best sellers available at the moment.
            </p>
            <p className="text-muted-foreground text-center text-sm mt-2">
                Check back later for top-rated products!
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
                        <span className="text-foreground font-medium">Best Sellers</span>
                    </nav>
                </div>
            </div>

            {/* Banner */}
            <div className="container px-3 md:px-4 py-4 md:py-6">
                <div className="relative overflow-hidden rounded-2xl bg-accent px-6 py-8 md:py-10 text-center">
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 mb-3">
                            <Trophy className="w-5 h-5 text-accent-foreground"/>
                            <span className="text-accent-foreground/90 text-sm font-medium">Top Rated</span>
                        </div>
                        <h1 className="text-2xl md:text-4xl font-bold text-accent-foreground mb-2">
                            Best Sellers
                        </h1>
                        <p className="text-accent-foreground/80 text-sm md:text-base max-w-md mx-auto">
                            Our most loved products • Trusted by thousands of customers
                        </p>
                    </div>
                    {/* Decorative circles */}
                    <div className="absolute top-0 left-0 w-32 h-32 bg-accent-foreground/10 rounded-full -translate-y-1/2 -translate-x-1/2"/>
                    <div className="absolute bottom-0 right-0 w-24 h-24 bg-accent-foreground/10 rounded-full translate-y-1/2 translate-x-1/2"/>
                </div>
            </div>

            {/* Products Section */}
            <div className="container py-4 md:py-6 px-3 md:px-4">
                {loading ? (
                    renderSkeletons()
                ) : error ? (
                    renderError()
                ) : bestSellerProducts.length === 0 ? (
                    renderEmpty()
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                        {bestSellerProducts.map((product, index) => (
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