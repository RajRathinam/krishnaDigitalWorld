import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { productApi, categoryApi } from "@/services/api";
import { toast } from "sonner";
import { 
  Search, 
  ShoppingCart, 
  User, 
  Menu, 
  Heart, 
  X, 
  ChevronDown, 
  ChevronRight,
  MapPin,
  Phone,
  Package,
  Clock,
  Gift,
  Star,
  Percent,
  Shield,
  Truck,
  TrendingUp,
  ExternalLink,
  LogOut
} from "lucide-react";
import { SearchModal } from "@/components/ui/search-modal";
import { Link } from "react-router-dom";
import { useCart } from '@/contexts/CartContext';
import { useShopInfo } from '@/contexts/ShopInfoContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from "@/lib/utils";

const quickLinks = [
  { label: "Today's Deals", href: "/deals", icon: Gift, highlight: true },
  { label: "New Arrivals", href: "/new-arrivals", icon: Star, highlight: true },
  { label: "Best Sellers", href: "/best-sellers", icon: TrendingUp, highlight: true }
];

const serviceFeatures = [
  { icon: Clock, text: "24/7 Support", subtext: "Dedicated assistance" },
  { icon: Shield, text: "Secure Payment", subtext: "100% protected" }
];

// Helper function to ensure something is an array
const ensureArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return [value];
    }
  }
  if (typeof value === 'object') {
    return Object.values(value);
  }
  return [];
};

// Function to open Google Maps with store location
const openGoogleMaps = (address, city, state, pincode, country = 'India') => {
  const fullAddress = [address, city, state, pincode, country]
    .filter(part => part && part.trim() !== '')
    .join(', ');
  
  const encodedAddress = encodeURIComponent(fullAddress);
  // Use Google Maps URL that works on both mobile and desktop
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
};

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // Import logout from useAuth
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [openCategory, setOpenCategory] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [searchData, setSearchData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const { cartCount, cartTotal, isLoading } = useCart();
  const { shopInfo, loading: shopInfoLoading } = useShopInfo();
  
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if a category is active
  const isCategoryActive = (categorySlug) => {
    const params = new URLSearchParams(location.search);
    const currentCategory = params.get('category');
    return currentCategory === categorySlug;
  };

  // Check if a quick link is active
  const isQuickLinkActive = (href) => {
    return location.pathname === href;
  };

  // Check if subcategory is active
  const isSubcategoryActive = (categorySlug, subcategory) => {
    const params = new URLSearchParams(location.search);
    const currentCategory = params.get('category');
    const currentSubcategory = params.get('subcategory');
    return currentCategory === categorySlug && currentSubcategory === encodeURIComponent(subcategory);
  };

  // Fetch categories for header menu
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await categoryApi.getCategories();
        const data = res?.data || [];
        
        const transformedCategories = ensureArray(data).map(cat => {
          const subcategoriesArray = ensureArray(cat.subcategories)
            .map(item => String(item).trim())
            .filter(item => item.length > 0);
          
          return {
            id: cat.id || cat._id || Math.random().toString(36).substr(2, 9),
            name: cat.name || 'Unnamed Category',
            slug: cat.slug || cat.name?.toLowerCase()?.replace(/\s+/g, '-') || 'category',
            subcategories: subcategoriesArray,
            image: cat.image || null
          };
        });
        
        if (!cancelled) {
          setCategories(transformedCategories);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
        toast.error('Failed to load categories');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Fetch products for search
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await productApi.getProducts({ limit: 50 });
        const fetched = res?.data?.products || res?.products || res?.data || res;
        const list = ensureArray(fetched);
        const items = list.map((p) => ({
          id: String(p.id || p._id),
          title: p.name || 'Unnamed Product',
          description: p.description || p.shortDescription || '',
          category: p.category?.name || p.category?.slug || 'Products',
          price: p.price || 0,
          image: p.images?.[0] || p.image || null,
          href: `/product/${p.slug || p.id}`,
        }));
        if (!cancelled) setSearchData(items);
      } catch (err) {
        console.error('Failed to load search data', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleCloseMenu = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsMenuOpen(false);
      setIsClosing(false);
    }, 300);
  };

  const openSignup = () => window.dispatchEvent(new Event('openSignup'));

  const handleLogout = async () => {
    await logout();
    setOpenDropdown(null);
    handleCloseMenu();
    toast.success('Signed out successfully');
    navigate('/');
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isMenuOpen) {
        handleCloseMenu();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen]);

  // Format phone number for display
  const formatPhoneNumber = (phone) => {
    if (!phone) return '+91 98765 43210'; // Default fallback
    return phone;
  };

  return (
    <>
      <header className={cn(
        "sticky top-0 left-0 right-0 z-40 transition-all duration-300",
        isScrolled 
          ? "bg-card/95 backdrop-blur-md shadow-md border-b border-border" 
          : "bg-card border-b border-border"
      )}>
        {/* Top Bar - Enhanced with shop info */}
        <div className="hidden lg:block bg-gradient-to-r from-primary/90 to-primary text-primary-foreground">
          <div className="container flex items-center justify-between py-2 text-xs">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" />
                <a 
                  href={`tel:${shopInfo?.phone || '+919876543210'}`} 
                  className="hover:underline cursor-pointer"
                >
                  {formatPhoneNumber(shopInfo?.phone)}
                </a>
              </div>
              <button 
                onClick={() => openGoogleMaps(
                  shopInfo?.address,
                  shopInfo?.city,
                  shopInfo?.state,
                  shopInfo?.pincode,
                  shopInfo?.country
                )}
                className="flex items-center gap-2 hover:underline cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Store Locator</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </button>
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5" />
                <Link to="/account/orders" className="hover:underline">Track Order</Link>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/help" className="hover:underline opacity-90 hover:opacity-100 flex items-center gap-1">
                Help Center
              </Link>
              {!user && (
                <button 
                  onClick={openSignup}
                  className="hover:underline opacity-90 hover:opacity-100"
                >
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="container">
          {/* Desktop Header */}
          <div className="hidden lg:flex justify-between items-center gap-6 py-4">
            {/* Logo */}
            <Link to="/" className="flex items-center shrink-0 group">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img 
                    src="/SK_Logo.png" 
                    alt="Krishna Stores" 
                    className="h-12 w-auto transition-transform" 
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-foreground tracking-wide leading-tight">
                    <span className="text-accent">Sri</span> Krishna
                  </span>
                  <span className="text-xs font-medium text-muted-foreground tracking-wide">
                    Digital World
                  </span>
                </div>
              </div>
            </Link>

            {/* Desktop Search - Opens Modal */}
            <div className="flex-1 max-w-2xl">
              <SearchModal data={searchData}>
                <button 
                  type="button" 
                  className="w-full flex items-center gap-3 px-5 py-3 bg-secondary/50 border-2 border-border rounded-xl text-muted-foreground text-sm text-left hover:border-accent/50 hover:bg-secondary transition-all duration-300 group"
                >
                  <Search className="w-4 h-4 shrink-0 group-hover:text-accent transition-colors" />
                  <span className="flex-1 truncate">Search for products, brands, and more...</span>
                  <kbd className="hidden xl:inline-flex h-5 items-center gap-1 rounded bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground shrink-0 border border-border">
                    ⌘K
                  </kbd>
                </button>
              </SearchModal>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Wishlist with text */}
              <Link 
                to="/account/wishlist" 
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-accent/10 transition-all duration-300 group"
                aria-label="Wishlist"
              >
                <div className="relative">
                  <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                    0
                  </span>
                </div>
                <span className="text-sm font-medium hidden xl:inline">Wishlist</span>
              </Link>

              {/* Account Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'account' ? null : 'account')}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl transition-all duration-300",
                    openDropdown === 'account' || location.pathname.startsWith('/account')
                      ? "bg-accent/20 text-accent"
                      : "hover:bg-accent/10 hover:text-accent"
                  )}
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium hidden xl:inline">
                    {user ? user.name?.split(' ')[0] : 'Account'}
                  </span>
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform duration-200 hidden xl:block",
                    openDropdown === 'account' && "rotate-180"
                  )} />
                </button>

                {openDropdown === 'account' && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-card rounded-xl border border-border shadow-lg py-2 animate-fade-up">
                    {user ? (
                      <>
                        <div className="px-4 py-3 border-b border-border">
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <Link 
                          to="/account/profile" 
                          className="block px-4 py-2 text-sm hover:bg-accent/10 transition-colors"
                          onClick={() => setOpenDropdown(null)}
                        >
                          My Account
                        </Link>
                        <Link 
                          to="/account/orders" 
                          className="block px-4 py-2 text-sm hover:bg-accent/10 transition-colors"
                          onClick={() => setOpenDropdown(null)}
                        >
                          My Orders
                        </Link>
                        <Link 
                          to="/account/wishlist" 
                          className="block px-4 py-2 text-sm hover:bg-accent/10 transition-colors"
                          onClick={() => setOpenDropdown(null)}
                        >
                          Wishlist
                        </Link>
                        <Link 
                          to="/account/addresses" 
                          className="block px-4 py-2 text-sm hover:bg-accent/10 transition-colors"
                          onClick={() => setOpenDropdown(null)}
                        >
                          Addresses
                        </Link>
                        <div className="border-t border-border my-2"></div>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="px-4 py-3">
                          <button 
                            onClick={() => {
                              openSignup();
                              setOpenDropdown(null);
                            }}
                            className="w-full px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
                          >
                            Sign In
                          </button>
                          <p className="text-xs text-center text-muted-foreground mt-2">
                            New customer? <button onClick={() => {
                              openSignup();
                              setOpenDropdown(null);
                            }} className="text-accent hover:underline">Register</button>
                          </p>
                        </div>
                        <div className="border-t border-border my-2" />
                        <Link 
                          to="/account/orders" 
                          className="block px-4 py-2 text-sm hover:bg-accent/10 transition-colors"
                          onClick={() => setOpenDropdown(null)}
                        >
                          Track Order
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Cart with text */}
              <Link 
                to="/cart" 
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-accent/10 transition-all duration-300 group"
                aria-label="Cart"
              >
                <div className="relative">
                  <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                    {isLoading ? '...' : cartCount}
                  </span>
                </div>
                <span className="text-sm font-medium hidden xl:inline">Cart</span>
              </Link>
            </div>
          </div>

          {/* Navigation Bar */}
          <div className="hidden lg:flex items-center justify-between py-2 border-t border-border">
            {/* Categories - Show only first 4 categories from backend */}
            <div className="flex items-center gap-1">
              {categories.slice(0, 4).map((cat) => (
                <div key={cat.id} className="relative group">
                  <Link 
                    to={`/products?category=${cat.slug}`} 
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                      isCategoryActive(cat.slug)
                        ? "bg-accent/10 text-accent"
                        : "text-foreground hover:bg-secondary hover:text-accent"
                    )}
                  >
                    {cat.name}
                    {cat.subcategories.length > 0 && (
                      <ChevronDown className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:rotate-180 transition-all" />
                    )}
                  </Link>
                  
                  {/* Subcategories Dropdown - Shows on hover */}
                  {cat.subcategories.length > 0 && (
                    <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[200px]">
                      <div className="bg-card rounded-lg border border-border shadow-lg p-2">
                        {cat.subcategories.map((sub, index) => (
                          <Link
                            key={`${cat.id}-sub-${index}`}
                            to={`/products?category=${cat.slug}&subcategory=${encodeURIComponent(sub)}`}
                            className={cn(
                              "block px-3 py-2 text-sm rounded-md transition-colors",
                              isSubcategoryActive(cat.slug, sub)
                                ? "text-accent font-semibold bg-accent/5"
                                : "text-muted-foreground hover:text-accent hover:bg-accent/5"
                            )}
                          >
                            {sub}
                          </Link>
                        ))}
                        
                        {/* View All link */}
                        <div className="border-t border-border mt-2 pt-2">
                          <Link
                            to={`/products?category=${cat.slug}`}
                            className="block px-3 py-2 text-sm font-medium text-accent hover:bg-accent/5 rounded-md transition-colors"
                          >
                            View All 
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* More Categories Link - If there are more than 4 categories */}
              {categories.length > 4 && (
                <Link
                  to="/categories"
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-accent transition-colors"
                >
                  +{categories.length - 4} more
                </Link>
              )}
            </div>

            {/* Quick Links */}
            <nav className="flex items-center gap-1">
              {quickLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                      isQuickLinkActive(item.href)
                        ? "bg-accent/10 text-accent"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Service Features */}
            <div className="flex items-center gap-4">
              {serviceFeatures.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <Icon className="w-4 h-4 text-accent" />
                    <div>
                      <p className="font-medium text-foreground">{feature.text}</p>
                      <p className="text-muted-foreground">{feature.subtext}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-3 py-3">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 -ml-2 text-foreground hover:text-accent transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link to="/" className="flex items-center shrink-0">
              <img src="/SK_Logo.png" alt="Krishna Stores" className="h-8 w-auto" />
              <div className="ml-2 flex flex-col">
                <span className="text-lg font-bold text-foreground tracking-wide leading-tight">
                  <span className="text-accent">Sri</span> Krishna
                </span>
                <span className="text-[10px] font-medium text-muted-foreground tracking-wide leading-tight">
                  Digital World
                </span>
              </div>
            </Link>

            <div className="flex-1" />

            <Link 
              to="/cart" 
              className="relative p-2 text-foreground hover:text-accent transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {isLoading ? '...' : cartCount}
              </span>
            </Link>

            {/* Mobile Search - Opens Modal */}
            <SearchModal data={searchData}>
              <button className="p-2 text-foreground hover:text-accent transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </SearchModal>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100]">
          <div 
            className={cn(
              "absolute inset-0 bg-foreground/40 transition-opacity duration-300",
              isClosing ? "opacity-0" : "opacity-100"
            )} 
            onClick={handleCloseMenu} 
          />

          <div 
            ref={menuRef}
            className={cn(
              "absolute inset-y-0 left-0 w-[300px] max-w-[80vw] bg-card shadow-elevated flex flex-col transition-transform duration-300 ease-out",
              isClosing ? "-translate-x-full" : "translate-x-0"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <img src="/SK_Logo.png" alt="Krishna Stores" className="h-8 w-auto" />
                <div className="flex flex-col">
                  <span className="font-bold leading-tight">
                    <span className="text-accent">Sri</span> Krishna
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground tracking-wide leading-tight">
                    Digital World
                  </span>
                </div>
              </div>
              <button 
                onClick={handleCloseMenu} 
                className="p-2 -mr-2 text-foreground hover:text-accent transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Info if logged in */}
            {user && (
              <div className="p-4 bg-secondary/30 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {user.phone || "Phone not available"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto py-2">
              {/* Categories */}
              <div className="px-2">
                <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Shop by Category
                </p>
                {categories.map((cat) => {
                  const subcategories = ensureArray(cat.subcategories);
                  const firstFourSubcategories = subcategories.slice(0, 4);
                  
                  return (
                    <div key={cat.id}>
                      <button 
                        onClick={() => setOpenCategory(openCategory === cat.id ? null : cat.id)} 
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-3 rounded-md transition-colors",
                          isCategoryActive(cat.slug)
                            ? "text-accent font-semibold bg-accent/5"
                            : "text-foreground hover:bg-secondary"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{cat.name}</span>
                        </div>
                        <ChevronRight className={cn(
                          "w-4 h-4 transition-transform",
                          openCategory === cat.id ? "rotate-90" : "",
                          isCategoryActive(cat.slug) ? "text-accent" : "text-muted-foreground"
                        )} />
                      </button>
                      
                      {openCategory === cat.id && (
                        <div className="ml-8 mb-2 border-l-2 border-border pl-3">
                          {firstFourSubcategories.map((sub, index) => (
                            <Link 
                              key={`${cat.id}-mobile-sub-${index}`} 
                              to={`/products?category=${cat.slug}&subcategory=${encodeURIComponent(sub)}`} 
                              className={cn(
                                "block px-3 py-2 text-sm transition-colors",
                                isSubcategoryActive(cat.slug, sub)
                                  ? "text-accent font-semibold"
                                  : "text-muted-foreground hover:text-foreground"
                              )} 
                              onClick={handleCloseMenu}
                            >
                              {sub}
                            </Link>
                          ))}
                          
                          <Link 
                            to={`/products?category=${cat.slug}`} 
                            className="block px-3 py-2 text-sm font-medium text-accent hover:underline" 
                            onClick={handleCloseMenu}
                          >
                            View All 
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="h-px bg-border mx-4 my-3" />

              {/* Quick Links */}
              <div className="px-2">
                <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Quick Links
                </p>
                {quickLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link 
                      key={item.label} 
                      to={item.href} 
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-md transition-colors text-sm",
                        isQuickLinkActive(item.href) 
                          ? "bg-accent/10 text-accent"
                          : "text-foreground hover:bg-secondary"
                      )}
                      onClick={handleCloseMenu}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              <div className="h-px bg-border mx-4 my-3" />

              {/* Account Links */}
              <div className="px-2">
                <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Account
                </p>
                {!user ? (
                  <>
                    <button
                      onClick={() => {
                        handleCloseMenu();
                        openSignup();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-foreground hover:bg-secondary transition-colors text-sm"
                    >
                      <User className="w-4 h-4 text-muted-foreground" />
                      Sign In / Register
                    </button>
                    <Link 
                      to="/account/orders" 
                      className="flex items-center gap-3 px-3 py-3 rounded-md text-foreground hover:bg-secondary transition-colors text-sm"
                      onClick={handleCloseMenu}
                    >
                      <Package className="w-4 h-4 text-muted-foreground" />
                      Track Order
                    </Link>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/account/profile" 
                      className="flex items-center gap-3 px-3 py-3 rounded-md text-foreground hover:bg-secondary transition-colors text-sm"
                      onClick={handleCloseMenu}
                    >
                      <User className="w-4 h-4 text-muted-foreground" />
                      My Account
                    </Link>
                    <Link 
                      to="/account/orders" 
                      className="flex items-center gap-3 px-3 py-3 rounded-md text-foreground hover:bg-secondary transition-colors text-sm"
                      onClick={handleCloseMenu}
                    >
                      <Package className="w-4 h-4 text-muted-foreground" />
                      My Orders
                    </Link>
                    <Link 
                      to="/account/addresses" 
                      className="flex items-center gap-3 px-3 py-3 rounded-md text-foreground hover:bg-secondary transition-colors text-sm"
                      onClick={handleCloseMenu}
                    >
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      Addresses
                    </Link>
                  </>
                )}
                <Link 
                  to="/account/wishlist" 
                  className="flex items-center gap-3 px-3 py-3 rounded-md text-foreground hover:bg-secondary transition-colors text-sm"
                  onClick={handleCloseMenu}
                >
                  <Heart className="w-4 h-4 text-muted-foreground" />
                  Wishlist
                </Link>
                <Link 
                  to="/cart" 
                  className="flex items-center gap-3 px-3 py-3 rounded-md text-foreground hover:bg-secondary transition-colors text-sm"
                  onClick={handleCloseMenu}
                >
                  <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                  Cart ({cartCount})
                </Link>
                
                {/* Logout button for mobile */}
                {user && (
                  <>
                    <div className="h-px bg-border mx-4 my-3" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-destructive hover:bg-destructive/10 transition-colors text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </>
                )}
              </div>

              <div className="h-px bg-border mx-4 my-3" />

              {/* Help & Support */}
              <div className="px-2">
                <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Support
                </p>
                <Link 
                  to="/help" 
                  className="flex items-center gap-3 px-3 py-3 rounded-md text-foreground hover:bg-secondary transition-colors text-sm"
                  onClick={handleCloseMenu}
                >
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  Help Center
                </Link>
                <button 
                  onClick={() => {
                    handleCloseMenu();
                    openGoogleMaps(
                      shopInfo?.address,
                      shopInfo?.city,
                      shopInfo?.state,
                      shopInfo?.pincode,
                      shopInfo?.country
                    );
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-foreground hover:bg-secondary transition-colors text-sm"
                >
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1 text-left">Store Locator</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-secondary/30">
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Truck className="w-3 h-3" />
                  <span>Free Shipping</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>24/7 Support</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-1">
                  <Gift className="w-3 h-3" />
                  <span>Special Offers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}