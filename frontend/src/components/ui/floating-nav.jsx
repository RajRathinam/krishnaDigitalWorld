"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Home, Search, ShoppingCart, User, Heart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { SearchModal } from "@/components/ui/search-modal";
import { Tv, Sofa, Package } from "lucide-react";
import { productApi } from "@/services/api";
import { toast } from "sonner";
import { useCart } from '@/contexts/CartContext'; // Add this import
const FloatingNav = () => {
    const location = useLocation();
    const [searchData, setSearchData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    // Get cart context
    const { cartCount, isLoading: cartLoading } = useCart(); // Add this
    // Hide floating nav on admin routes
    if (location.pathname.startsWith('/admin'))
        return null;
    const [active, setActive] = useState(0);
    const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });
    const containerRef = useRef(null);
    const btnRefs = useRef([]);
    // Fetch products for search
    useEffect(() => {
        let cancelled = false;
        const fetchProducts = async () => {
            if (searchData.length > 0)
                return; // Already fetched
            setIsLoading(true);
            try {
                const res = await productApi.getProducts({ limit: 50 });
                const fetched = res?.data?.products || res?.products || res?.data || res;
                const list = Array.isArray(fetched) ? fetched : fetched.data || fetched.products || [];
                // Map products to SearchItem format
                const items = list.map((p) => ({
                    id: String(p.id),
                    title: p.name,
                    description: p.description || p.shortDescription || '',
                    category: p.category?.name || p.category?.slug || 'Products',
                    href: `/product/${p.slug || p.id}`,
                    icon: getIconByCategory(p.category?.name || 'Products')
                }));
                if (!cancelled) {
                    setSearchData(items);
                }
            }
            catch (err) {
                console.error('Failed to load search data', err);
                if (!cancelled) {
                    toast.error(err?.message || 'Failed to load products for search');
                }
            }
            finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };
        fetchProducts();
        return () => {
            cancelled = true;
        };
    }, []);
    // Helper function to get icon based on category
    const getIconByCategory = (category) => {
        const categoryLower = category.toLowerCase();
        if (categoryLower.includes('tv') || categoryLower.includes('television') || categoryLower.includes('electronics')) {
            return Tv;
        }
        else if (categoryLower.includes('furniture') || categoryLower.includes('sofa') || categoryLower.includes('table')) {
            return Sofa;
        }
        else if (categoryLower.includes('plastic') || categoryLower.includes('container') || categoryLower.includes('storage')) {
            return Package;
        }
        else if (categoryLower.includes('home') || categoryLower.includes('appliance')) {
            return Home;
        }
        return Package;
    };
    // Fallback search data if API fails
    const getSearchData = () => {
        if (searchData.length > 0) {
            return searchData;
        }
        return [
            { id: "1", title: "Smart LED TV 55 inch", description: "4K Ultra HD Smart Television", category: "Electronics", icon: Tv, href: "/products?category=electronics" },
            { id: "2", title: "Double Door Refrigerator", description: "500L Frost Free with Inverter", category: "Home Appliances", icon: Home, href: "/products?category=home-appliances" },
            { id: "3", title: "Wooden Dining Table", description: "6 Seater Solid Wood Table", category: "Furniture", icon: Sofa, href: "/products?category=furniture" },
            { id: "4", title: "Plastic Storage Containers", description: "Set of 12 Airtight Containers", category: "Plastic", icon: Package, href: "/products?category=plastic" },
        ];
    };
    // Updated items array with dynamic cart count
    const items = [
        { id: 0, icon: Home, label: "Home", href: "/" },
        { id: 1, icon: Search, label: "Search", href: null, isSearch: true },
        { id: 2, icon: Heart, label: "Wishlist", href: "/account" },
        {
            id: 3,
            icon: ShoppingCart,
            label: "Cart",
            href: "/cart",
            badge: cartCount, // Use dynamic cart count here
            showBadge: cartCount > 0 // Only show badge if items exist
        },
        { id: 4, icon: User, label: "Account", href: "/account" },
    ];
    // Set active based on current route
    useEffect(() => {
        const path = location.pathname;
        if (path === "/")
            setActive(0);
        else if (path === "/cart")
            setActive(3);
        else if (path === "/account")
            setActive(4);
        else
            setActive(-1);
    }, [location.pathname]);
    // Update indicator position when active changes or resize
    useEffect(() => {
        const updateIndicator = () => {
            if (active >= 0 && btnRefs.current[active] && containerRef.current) {
                const btn = btnRefs.current[active];
                const container = containerRef.current;
                if (!btn)
                    return;
                const btnRect = btn.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                setIndicatorStyle({
                    width: btnRect.width,
                    left: btnRect.left - containerRect.left,
                });
            }
        };
        updateIndicator();
        window.addEventListener("resize", updateIndicator);
        return () => window.removeEventListener("resize", updateIndicator);
    }, [active]);
    return (<div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pt-1 pointer-events-none">
      <nav ref={containerRef} className="relative flex items-center justify-around bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-lg py-2 pointer-events-auto">
        {items.map((item, index) => {
            const Icon = item.icon;
            const isActive = active === index;
            if (item.isSearch) {
                return (<SearchModal key={item.id} data={getSearchData()} isLoading={isLoading}>
                <button ref={(el) => (btnRefs.current[index] = el)} className="relative flex flex-col items-center justify-center flex-1 px-2 py-2 text-sm font-medium text-muted-foreground">
                  <Icon className="w-5 h-5"/>
                  <span className="text-[10px] mt-0.5">{item.label}</span>
                </button>
              </SearchModal>);
            }
            return (<Link key={item.id} to={item.href} ref={(el) => (btnRefs.current[index] = el)} onClick={() => setActive(index)} className={`relative flex flex-col items-center justify-center flex-1 px-2 py-2 text-sm font-medium transition-colors ${isActive ? "text-accent" : "text-muted-foreground"}`}>
              <div className="relative">
                <Icon className="w-5 h-5"/>
                {/* Dynamic cart badge */}
                {item.badge !== undefined && item.showBadge && (<span className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {cartLoading ? '...' : item.badge}
                  </span>)}
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>);
        })}

        {/* Sliding Active Indicator */}
        {active >= 0 && (<motion.div className="absolute top-0 h-0.5 bg-accent rounded-full" initial={false} animate={{
                width: indicatorStyle.width * 0.5,
                left: indicatorStyle.left + indicatorStyle.width * 0.25,
            }} transition={{ type: "spring", stiffness: 400, damping: 30 }}/>)}
      </nav>
    </div>);
};
export default FloatingNav;
