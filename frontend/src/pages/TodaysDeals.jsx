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
import { Clock, Zap } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { toast } from '@/hooks/use-toast';
import { productApi } from '@/services/api';
import { Skeleton } from "@/components/ui/skeleton";

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
    const [timeRemaining, setTimeRemaining] = useState(() => calculateTimeUntilMidnight());

    useEffect(() => {
        AOS.init({ duration: 600, easing: "ease-out-cubic", once: true, offset: 50 });
    }, []);

    /**
     * Extract products array from various API response structures
     */
    const extractProductsArray = useCallback((response) => {
        if (!response) return [];
        
        console.log('Full API Response:', JSON.stringify(response, null, 2));

        // Case 1: Response is an array
        if (Array.isArray(response)) {
            console.log('Response is direct array');
            return response;
        }

        // Case 2: Response has data.data structure (most common)
        if (response?.data?.data && Array.isArray(response.data.data)) {
            console.log('Found data.data array');
            return response.data.data;
        }

        // Case 3: Response has data.products
        if (response?.data?.products && Array.isArray(response.data.products)) {
            console.log('Found data.products array');
            return response.data.products;
        }

        // Case 4: Response.data is array
        if (response?.data && Array.isArray(response.data)) {
            console.log('Response.data is array');
            return response.data;
        }

        // Case 5: Response has products array
        if (response?.products && Array.isArray(response.products)) {
            console.log('Found products array');
            return response.products;
        }

        // Case 6: Response has items array
        if (response?.items && Array.isArray(response.items)) {
            console.log('Found items array');
            return response.items;
        }

        // Case 7: Response has results array
        if (response?.results && Array.isArray(response.results)) {
            console.log('Found results array');
            return response.results;
        }

        // Case 8: Response is an object with numeric keys (like {0: {...}, 1: {...}})
        if (response && typeof response === 'object') {
            const values = Object.values(response);
            if (values.length > 0 && values.every(v => v && typeof v === 'object')) {
                console.log('Extracted values from object with numeric keys');
                return values;
            }
        }

        console.warn('Could not extract products array from response:', response);
        return [];
    }, []);

    /**
     * Fetch deal products
     */
    const fetchDealProducts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('Fetching deal products...');
            const res = await productApi.getDealOfTheDay(50);
            
            console.log('Raw API Response:', res);
            
            const products = extractProductsArray(res);
            
            console.log('Extracted products count:', products.length);
            console.log('Extracted products:', products);
            
            setDealProducts(products);
            
        } catch (err) {
            console.error('Failed to load deals:', err);
            
            let errorMessage = 'Failed to load deals';
            
            if (err.response) {
                errorMessage = err.response.data?.message || 
                              err.response.statusText || 
                              errorMessage;
                console.log('Error response:', err.response.data);
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
    }, []);

    /**
     * Update the countdown timer
     */
    const updateTimer = useCallback(() => {
        setTimeRemaining(calculateTimeUntilMidnight());
    }, []);

    /**
     * Initial fetch
     */
    useEffect(() => {
        fetchDealProducts();
    }, [fetchDealProducts]);

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
                {error || "Failed to load deals"}
            </p>
            <p className="text-muted-foreground text-center text-sm">
                Please try again later
            </p>
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

    // Debug render
    console.log('Rendering with state:', { 
        loading, 
        error, 
        productCount: dealProducts.length,
        firstProduct: dealProducts[0] 
    });

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
                        {dealProducts.map((product, index) => {
                            const productId = product.id || product._id || `product-${index}`;
                            const productSlug = product.slug || product.id || product._id;
                            
                            return (
                                <Link 
                                    key={productId}
                                    to={`/product/${productSlug}`} 
                                    className="block" 
                                    data-aos="fade-up" 
                                    data-aos-delay={Math.min(index * 50, 200)}
                                >
                                    <ProductCard product={product} variant="compact"/>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}