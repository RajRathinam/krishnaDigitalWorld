import { Home, Grid, ShoppingCart, User, Search } from "lucide-react";
import { productApi } from "@/services/api";
import { SearchModal } from "@/components/ui/search-modal";
import { toast } from "sonner";
import { NavLink, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function MobileBottomNav() {
    const { cartCount } = useCart();
    const location = useLocation();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [searchData, setSearchData] = useState([]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await productApi.getProducts({ limit: 50 });
                const fetched = res?.data?.products || res?.products || res?.data || res;
                const list = Array.isArray(fetched) ? fetched : (fetched ? [fetched] : []);
                const items = list.map((p) => ({
                    id: String(p.id || p._id),
                    title: p.name || 'Unnamed Product',
                    description: p.description || p.shortDescription || '',
                    category: p.category?.name || p.category?.slug || 'Products',
                    href: `/product/${p.slug || p.id}`,
                }));
                if (!cancelled) setSearchData(items);
            } catch (err) {
                console.error('Failed to load search data', err);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Hide bottom nav on scroll down, show on scroll up
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Always show at top or bottom of page
            if (currentScrollY < 10 || (window.innerHeight + currentScrollY) >= document.body.offsetHeight - 10) {
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
                // Scrolling down
                setIsVisible(false);
            } else {
                // Scrolling up
                setIsVisible(true);
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    // Don't show on admin pages or checkout
    if (location.pathname.startsWith('/admin') || location.pathname === '/checkout') {
        return null;
    }

    const navItems = [
        { icon: Home, label: "Home", path: "/" },
        { icon: Grid, label: "Shop", path: "/products" },
        { icon: Search, label: "Search", path: "/deals" }, // Using deals page as search placeholder for now
        { icon: User, label: "Account", path: "/account" },
    ];

    return (
        <>
            {/* Spacer removed - handled by Footer padding */}

            <div className={cn(
                "fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-500 ease-in-out pb-safe-bottom",
                isVisible ? "translate-y-0" : "translate-y-full"
            )}>
                <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border/50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] dark:bg-black/80" />

                <div className="relative flex items-center justify-around h-16 px-2">
                    {/* Left Items */}
                    <NavLinkItem to="/" icon={Home} label="Home" />
                    <NavLinkItem to="/products" icon={Grid} label="Shop" />

                    {/* Center Cart Button - Floating Dock Style */}
                    <div className="relative -top-6 group">
                        <NavLink
                            to="/cart"
                            className={({ isActive }) => cn(
                                "flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 border-[3px] border-background relative z-10",
                                isActive
                                    ? "bg-gradient-to-br from-accent to-amber-600 text-white shadow-accent/50 scale-110"
                                    : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105"
                            )}
                        >
                            <ShoppingCart className="w-6 h-6" />
                            <AnimatePresence>
                                {cartCount > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white border-2 border-background shadow-sm"
                                    >
                                        {cartCount > 9 ? '9+' : cartCount}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </NavLink>
                        <span className="absolute -bottom-5 w-full text-center text-[10px] font-medium text-muted-foreground opacity-90 transition-opacity group-hover:text-accent">Cart</span>
                        {/* Glow effect behind cart */}
                        <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>

                    {/* Right Items */}
                    <SearchModal data={searchData}>
                        <button className="relative flex flex-col items-center justify-center w-full h-full gap-1 text-[10px] font-medium transition-colors duration-300 text-muted-foreground hover:text-foreground">
                            <div className="relative">
                                <motion.div whileTap={{ scale: 0.8 }} className="p-1 rounded-full transition-colors">
                                    <Search className="w-5 h-5" />
                                </motion.div>
                            </div>
                            <span className="transition-all duration-300 scale-100">Search</span>
                        </button>
                    </SearchModal>
                    <NavLinkItem to="/account" icon={User} label="Account" />
                </div>
            </div>
        </>
    );
}

function NavLinkItem({ to, icon: Icon, label }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => cn(
                "relative flex flex-col items-center justify-center w-full h-full gap-1 text-[10px] font-medium transition-colors duration-300",
                isActive ? "text-accent" : "text-muted-foreground hover:text-foreground"
            )}
        >
            {({ isActive }) => (
                <>
                    <div className="relative">
                        <motion.div
                            whileTap={{ scale: 0.8 }}
                            className={cn("p-1 rounded-full transition-colors", isActive && "bg-accent/10")}
                        >
                            <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                        </motion.div>
                    </div>
                    <span className={cn("transition-all duration-300", isActive ? "font-semibold scale-105" : "scale-100")}>{label}</span>
                </>
            )}
        </NavLink>
    );
}
