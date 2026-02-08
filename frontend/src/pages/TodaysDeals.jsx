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
    endOfDay.setHours(23, 59, 59, 999); // Set to 23:59:59.999
    
    const diffMs = endOfDay.getTime() - now.getTime();
    
    // If somehow we're past midnight (shouldn't happen), default to 24 hours
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
    const [timeRemaining, setTimeRemaining] = useState(() => calculateTimeUntilMidnight());

    /**
     * Update the countdown timer
     */
    const updateTimer = useCallback(() => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentSecond = now.getSeconds();
        
        // Check if it's exactly midnight (or a few seconds after to handle delays)
        if (currentHour === 0 && currentMinute === 0 && currentSecond <= 2) {
            // Reset to 24 hours
            setTimeRemaining({ hours: 23, minutes: 59, seconds: 59 });
        } else {
            // Calculate time until midnight
            setTimeRemaining(calculateTimeUntilMidnight());
        }
    }, []);

    useEffect(() => {
        AOS.init({ duration: 600, easing: "ease-out-cubic", once: true, offset: 50 });
    }, []);

    useEffect(() => {
        let cancelled = false;
        
        const fetchDealProducts = async () => {
            try {
                setLoading(true);
                const res = await productApi.getDealOfTheDay(50);
                const fetched = res.data || res.products || res.data?.data || res;
                
                if (!cancelled) {
                    setDealProducts(
                        Array.isArray(fetched) 
                            ? fetched 
                            : fetched.data || fetched.products || []
                    );
                }
            } catch (err) {
                console.error('Failed to load deals', err);
                if (!cancelled) {
                    toast({
                        title: "Error",
                        description: err?.message || 'Failed to load deals',
                        variant: "destructive"
                    });
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        
        fetchDealProducts();
        return () => { cancelled = true; };
    }, []);

    /**
     * Countdown timer effect - resets daily at midnight
     */
    useEffect(() => {
        // Initial calculation
        updateTimer();
        
        // Set up interval for countdown
        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                let { hours, minutes, seconds } = prev;
                
                // Decrement seconds
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
                    // When countdown reaches 0, it's midnight
                    // Force a recalculation to handle edge cases
                    clearInterval(timer);
                    setTimeout(() => {
                        updateTimer();
                        // Restart interval after reset
                        const newTimer = setInterval(() => {
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
                                }
                                
                                return { hours, minutes, seconds };
                            });
                        }, 1000);
                        
                        // Store timer reference if needed
                        // This approach uses closure, so we don't need to store it
                    }, 100);
                    
                    // Return 0 for now, will be updated by the setTimeout
                    return { hours: 0, minutes: 0, seconds: 0 };
                }
                
                return { hours, minutes, seconds };
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [updateTimer]);

    /**
     * Additional check every minute to ensure timer stays accurate
     */
    useEffect(() => {
        const syncInterval = setInterval(() => {
            updateTimer();
        }, 60000); // Sync every minute to prevent drift

        return () => clearInterval(syncInterval);
    }, [updateTimer]);

    /**
     * Check for midnight reset on component mount and date changes
     */
    useEffect(() => {
        // Check current date to handle page refresh scenarios
        updateTimer();
        
        // Set up a check for midnight
        const now = new Date();
        const msUntilMidnight = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1, // Next day
            0, 0, 0, 0 // Midnight
        ).getTime() - now.getTime();
        
        // Set timeout for midnight reset
        const midnightTimeout = setTimeout(() => {
            updateTimer();
        }, msUntilMidnight);
        
        return () => clearTimeout(midnightTimeout);
    }, [updateTimer]);

    return (
        <div className="min-h-screen bg-background overflow-x-hidden md:pb-0">
            <Header />
            
            <div className="bg-card border-b border-border">
                <div className="container py-2 px-3 md:px-4">
                    <nav className="text-xs md:text-sm text-muted-foreground">
                        <Link to="/" className="hover:text-accent">Home</Link>
                        <span className="mx-1.5 md:mx-2">›</span>
                        <span className="text-foreground font-medium">Today's Deals</span>
                    </nav>
                </div>
            </div>

            <div className="container py-6 md:py-8 px-3 md:px-4">
                {/* Header */}
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

                {/* Products Grid */}
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="space-y-3">
                                <Skeleton className="w-full aspect-[4/5] rounded-lg" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : dealProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Zap className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
                        <p className="text-muted-foreground text-center text-lg">
                            No deals available at the moment.
                        </p>
                        <p className="text-muted-foreground text-center text-sm mt-2">
                            Check back later for exciting deals!
                        </p>
                    </div>
                ) : (
                    <>
                        
                        {/* Products Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                            {dealProducts.map((product, index) => (
                                <Link 
                                    key={product.id} 
                                    to={`/product/${product.slug || product.id}`} 
                                    className="block" 
                                    data-aos="fade-up" 
                                    data-aos-delay={Math.min(index * 50, 200)}
                                >
                                    <ProductCard product={product} variant="compact"/>
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <Footer />
        </div>
    );
}