/**
 * TodaysDeals Page
 * 
 * Displays products marked as "Deal of the Day" by admin.
 * Shows time-limited deals with countdown timer.
 * 
 * @component
 * @returns {JSX.Element} Today's deals page
 */

import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { Clock, Zap, RefreshCw } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { toast } from '@/hooks/use-toast';
import { productApi } from '@/services/api';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

/**
 * Calculate time remaining until end of day (midnight)
 * @returns {{hours: number, minutes: number, seconds: number}} Time remaining object
 */
const calculateTimeUntilMidnight = () => {
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const diffMs = endOfDay.getTime() - now.getTime();
    
    if (diffMs <= 0) {
        return { hours: 23, minutes: 59, seconds: 59 };
    }
    
    const diffSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;
    
    return { hours, minutes, seconds };
};

/**
 * Format time remaining for countdown display
 */
const formatTime = (hours, minutes, seconds) => {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export default function TodaysDeals() {
    const [dealProducts, setDealProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(() => calculateTimeUntilMidnight());

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
                const res = await productApi.getDealOfTheDay(50, {
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
     * Fetch deal products
     */
    const fetchDealProducts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const res = await fetchWithRetry(3);
            const products = extractProductsArray(res);
            
            console.log('Extracted products:', products);
            setDealProducts(products);
            
            if (products.length === 0) {
                toast({
                    title: "No Products Found",
                    description: "No deals available at the moment.",
                    variant: "default"
                });
            }
        } catch (err) {
            console.error('Failed to load deals:', err);
            
            let errorMessage = 'Failed to load deals';
            
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
     * Update the countdown timer
     */
    const updateTimer = useCallback(() => {
        setTimeRemaining(calculateTimeUntilMidnight());
    }, []);

    /**
     * Initial fetch and retry on retryCount change
     */
    useEffect(() => {
        let cancelled = false;
        
        if (!cancelled) {
            fetchDealProducts();
        }
        
        return () => { cancelled = true; };
    }, [fetchDealProducts, retryCount]);

    /**
     * Countdown timer effect
     */
    useEffect(() => {
        updateTimer();
        
        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                let { hours, minutes, seconds } = prev;
                
                if (seconds > 0) {
                    seconds--;
                } else if (minutes > 0) {
                    minutes--;
                    seconds = 59;
                } else if (hours > 0) {
                    hours--;
                    minutes = 59;
                    seconds = 59;
                } else {
                    // Reset at midnight
                    return calculateTimeUntilMidnight();
                }
                
                return { hours, minutes, seconds };
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [updateTimer]);

    /**
     * Sync timer periodically
     */
    useEffect(() => {
        const syncInterval = setInterval(() => {
            updateTimer();
        }, 60000);

        return () => clearInterval(syncInterval);
    }, [updateTimer]);

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
                <Zap className="w-12 h-12 text-destructive" />
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
                <Zap className="w-12 h-12 text-muted-foreground opacity-50" />
            </div>
            <p className="text-muted-foreground text-center text-lg">
                No deals available at the moment.
            </p>
            <p className="text-muted-foreground text-center text-sm mt-2">
                Check back later for exciting deals!
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
                        <span className="text-foreground font-medium">Today's Deals</span>
                    </nav>
                </div>
            </div>

            {/* Header with Countdown */}
            <div className="container py-6 md:py-8 px-3 md:px-4">
                <div className="flex items-center gap-4 mb-6" data-aos="fade-up">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                        <Zap className="w-6 h-6 text-accent"/>
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-display text-foreground">Today's Deals</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-4 h-4 text-destructive"/>
                            <span className="text-sm text-destructive font-medium font-mono">
                                Deals end in {formatTime(timeRemaining.hours, timeRemaining.minutes, timeRemaining.seconds)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Products Section */}
                {loading ? (
                    renderSkeletons()
                ) : error ? (
                    renderError()
                ) : dealProducts.length === 0 ? (
                    renderEmpty()
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                        {dealProducts.map((product, index) => (
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