import { useState, useEffect } from "react";
import { productApi, categoryApi } from "@/services/api";
import { toast } from "sonner";
import { Search, ShoppingCart, User, Menu, Heart, X, ChevronDown, ChevronRight } from "lucide-react";
import { SearchModal } from "@/components/ui/search-modal";
import { Link } from "react-router-dom";
import { useCart } from '@/contexts/CartContext';
const quickLinks = [
  { label: "Today's Deals", href: "/deals", highlight: true },
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Best Sellers", href: "/best-sellers" }
];
// Helper function to ensure something is an array
const ensureArray = (value) => {
  if (Array.isArray(value))
    return value;
  if (value === null || value === undefined)
    return [];
  if (typeof value === 'string') {
    try {
      // Try to parse if it's a JSON string
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    }
    catch {
      return [value];
    }
  }
  if (typeof value === 'object') {
    return Object.values(value);
  }
  return [];
};
export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [openCategory, setOpenCategory] = useState(null);
  const [user, setUser] = useState(null);
  const [searchData, setSearchData] = useState([]);
  const [categories, setCategories] = useState([]);
  const { cartCount, cartTotal, isLoading } = useCart();
  // Fetch categories for header menu
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await categoryApi.getCategories();
        const data = res?.data || [];
        console.log('Raw categories data:', data); // Debug
        // Transform the backend data with safe array handling
        const transformedCategories = ensureArray(data).map(cat => {
          // Ensure subcategories is always an array of strings
          const subcategoriesArray = ensureArray(cat.subcategories)
            .map(item => String(item).trim())
            .filter(item => item.length > 0);
          return {
            id: cat.id || cat._id || Math.random().toString(36).substr(2, 9),
            name: cat.name || 'Unnamed Category',
            slug: cat.slug || cat.name?.toLowerCase()?.replace(/\s+/g, '-') || 'category',
            subcategories: subcategoriesArray
          };
        });
        console.log('Transformed categories:', transformedCategories); // Debug
        if (!cancelled) {
          setCategories(transformedCategories);
        }
      }
      catch (err) {
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
          href: `/product/${p.slug || p.id}`,
        }));
        if (!cancelled)
          setSearchData(items);
      }
      catch (err) {
        console.error('Failed to load search data', err);
        toast.error(err?.message || 'Failed to load products for search');
      }
    })();
    return () => { cancelled = true; };
  }, []);
  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      }
      catch (err) {
        console.error('Failed to parse user from localStorage', err);
      }
    }
  }, []);
  const handleCloseMenu = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsMenuOpen(false);
      setIsClosing(false);
    }, 300);
  };
  const openSignup = () => window.dispatchEvent(new Event('openSignup'));
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isMenuOpen) {
        handleCloseMenu();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen]);
  return (<>
    <header className="sticky top-0 left-0 right-0 z-50 bg-card border-b border-border">
      {/* Top Bar */}
      <div className="hidden lg:block bg-primary text-primary-foreground">
        <div className="container flex items-center justify-between py-1.5 text-xs">
          <p>Free shipping on orders over ₹999</p>
          <div className="flex items-center gap-6">
            <Link to="/help" className="hover:underline">Help Center</Link>
            <Link to="/account" className="hover:underline">Track Order</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container flex items-center gap-3 lg:gap-6 py-3 lg:py-4">
        {/* Mobile Menu Toggle */}
        <button type="button" onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2 -ml-2 text-foreground hover:text-accent transition-colors" aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center shrink-0">
          <div className="flex items-center gap-2">
            <img src="/SK_Logo.png" alt="Krishna Stores" className="h-10 w-auto lg:h-12" />
            <div className="flex flex-col">
              <span className="text-xl lg:text-2xl font-bold text-foreground tracking-wide leading-tight">
                <span className="text-accent">Sri</span> Krishna
              </span>
              <span className="text-xs lg:text-sm font-medium text-muted-foreground tracking-wide">
                Digital World
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-0.5 ml-4">
          {categories.map((cat) => (<div key={cat.id} className="relative group">
            <Link to={`/products?category=${cat.slug}`} className="flex items-center gap-1 px-2.5 py-2 text-sm text-foreground/80 hover:text-foreground transition-colors whitespace-nowrap">
              {cat.name}
              <ChevronDown className="w-3.5 h-3.5 opacity-50" />
            </Link>
            {/* Dropdown - FIXED with safe array */}
            <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <div className="bg-card rounded-lg border border-border shadow-dropdown p-3 min-w-[180px]">
                {ensureArray(cat.subcategories).map((sub, index) => (<Link key={`${cat.id}-sub-${index}`} to={`/products?category=${cat.slug}&subcategory=${encodeURIComponent(sub)}`} className="block px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-secondary rounded-md transition-colors">
                  {sub}
                </Link>))}
                <div className="border-t border-border mt-2 pt-2">
                  <Link to={`/products?category=${cat.slug}`} className="block px-3 py-2 text-sm font-medium text-accent hover:bg-secondary rounded-md transition-colors">
                    View All
                  </Link>
                </div>
              </div>
            </div>
          </div>))}
          <div className="h-4 w-px bg-border mx-1" />
          {quickLinks.map((item) => (<Link key={item.label} to={item.href} className={`px-2.5 py-2 text-sm transition-colors whitespace-nowrap ${item.highlight
            ? "text-accent font-medium"
            : "text-foreground/80 hover:text-foreground"}`}>
            {item.label}
          </Link>))}
        </nav>

        {/* Spacer */}
        <div className="flex-1 min-w-0" />

        {/* Desktop Search */}
        <div className="hidden lg:block w-full max-w-xs xl:max-w-sm">
          <SearchModal data={searchData}>
            <button type="button" className="w-full flex items-center gap-3 px-4 py-2.5 bg-secondary border border-border rounded-full text-muted-foreground text-sm text-left hover:border-accent/50 transition-colors">
              <Search className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">Search products...</span>
              <kbd className="hidden xl:inline-flex h-5 items-center gap-1 rounded bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground shrink-0">
                ⌘K
              </kbd>
            </button>
          </SearchModal>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          {/* Wishlist */}
          <Link to="/account" onClick={(e) => {
            const storedUser = localStorage.getItem('user');
            if (!storedUser) {
              e.preventDefault();
              openSignup();
            }
          }} type="button" className="hidden md:flex p-2 text-foreground hover:text-accent transition-colors" aria-label="Wishlist">
            <Heart className="w-5 h-5" />
          </Link>

          {/* Account */}
          <Link to="/account" onClick={(e) => {
            const storedUser = localStorage.getItem('user');
            if (!storedUser) {
              e.preventDefault();
              openSignup();
            }
          }} className="flex p-2 text-foreground hover:text-accent transition-colors" aria-label="Account">
            <User className="w-5 h-5" />
          </Link>

          {/* Cart */}
          <Link to="/cart" onClick={(e) => {
            const storedUser = localStorage.getItem('user');
            if (!storedUser) {
              e.preventDefault();
              openSignup();
            }
          }} className="flex items-center gap-2 p-2 text-foreground hover:text-accent transition-colors" aria-label="Cart">
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {isLoading ? '...' : cartCount}
              </span>
            </div>
            {/* <span className="hidden lg:block text-sm font-medium">
          {new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
          }).format(cartTotal)}
        </span> */}
          </Link>
        </div>
      </div>
    </header>

    {/* Mobile Menu Overlay */}
    {isMenuOpen && (<div className="lg:hidden fixed inset-0 z-[100]">
      <div className={`absolute inset-0 bg-foreground/40 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`} onClick={handleCloseMenu} />

      <div className={`absolute inset-y-0 left-0 w-[300px] max-w-[85vw] bg-card shadow-elevated flex flex-col transition-transform duration-300 ease-out ${isClosing ? '-translate-x-full' : 'translate-x-0 animate-slide-in-left'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="text-lg font-bold text-foreground">
            Menu
          </span>
          <button onClick={handleCloseMenu} className="p-2 -mr-2 text-foreground hover:text-accent transition-colors" aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-2">
          {/* Categories */}
          <div className="px-2">
            <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Shop by Category
            </p>
            {categories.map((cat) => (<div key={cat.id}>
              <button onClick={() => setOpenCategory(openCategory === cat.id ? null : cat.id)} className="w-full flex items-center justify-between px-3 py-3 text-foreground hover:bg-secondary rounded-md transition-colors">
                <span className="text-sm font-medium">{cat.name}</span>
                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${openCategory === cat.id ? 'rotate-90' : ''}`} />
              </button>
              {openCategory === cat.id && (<div className="ml-3 mb-2 border-l-2 border-border pl-3">
                {ensureArray(cat.subcategories).map((sub, index) => (<Link key={`${cat.id}-mobile-sub-${index}`} to={`/products?category=${cat.slug}&subcategory=${encodeURIComponent(sub)}`} className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={handleCloseMenu}>
                  {sub}
                </Link>))}
                <Link to={`/products?category=${cat.slug}`} className="block px-3 py-2 text-sm text-accent font-medium" onClick={handleCloseMenu}>
                  View All →
                </Link>
              </div>)}
            </div>))}
          </div>

          <div className="h-px bg-border mx-4 my-3" />

          {/* Quick Links */}
          <div className="px-2">
            <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Quick Links
            </p>
            {quickLinks.map((item) => (<Link key={item.label} to={item.href} className={`block px-3 py-3 rounded-md transition-colors text-sm ${item.highlight
              ? "text-accent font-medium"
              : "text-foreground hover:bg-secondary"}`} onClick={handleCloseMenu}>
              {item.label}
            </Link>))}
          </div>

          <div className="h-px bg-border mx-4 my-3" />

          {/* Account */}
          <div className="px-2">
            <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Account
            </p>
            <Link to="/account" className="flex items-center gap-3 px-3 py-3 text-foreground hover:bg-secondary rounded-md transition-colors" onClick={(e) => {
              handleCloseMenu();
              const storedUser = localStorage.getItem('user');
              if (!storedUser) {
                e.preventDefault();
                openSignup();
              }
            }}>
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Sign In / Register</span>
            </Link>
            <Link to="/cart" className="flex items-center gap-3 px-3 py-3 text-foreground hover:bg-secondary rounded-md transition-colors" onClick={handleCloseMenu}>
              <ShoppingCart className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Your Cart ({cartCount})</span>
            </Link>
          </div>
        </div>
      </div>
    </div>)}
  </>);
}
