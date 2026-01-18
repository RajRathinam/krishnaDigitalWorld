import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { ChevronDown, ChevronUp, X, Grid3X3, List, SlidersHorizontal, Search, Check } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import { baseUrl } from '@/config/baseUrl';
// Base API configuration
const API_BASE_URL = baseUrl;
// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});
// Add auth token interceptor
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));
// Sort options configuration - Removed "relevance"
const SORT_OPTIONS = [
    { value: "newest", label: "Newest" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "name-asc", label: "Name: A to Z" },
    { value: "name-desc", label: "Name: Z to A" },
    { value: "discount", label: "Best Discount" },
];
// Map sort options to backend sort parameters
const SORT_MAP = {
    "newest": { sortBy: "createdAt", sortOrder: "desc" },
    "price-low": { sortBy: "price", sortOrder: "asc" },
    "price-high": { sortBy: "price", sortOrder: "desc" },
    "name-asc": { sortBy: "name", sortOrder: "asc" },
    "name-desc": { sortBy: "name", sortOrder: "desc" },
    "discount": { sortBy: "discountPercentage", sortOrder: "desc" },
};
export default function ProductListing() {
    const [searchParams] = useSearchParams();
    const category = searchParams.get("category");
    const subcategoryParam = searchParams.get("subcategory");
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [minPriceFilter, setMinPriceFilter] = useState(null);
    const [maxPriceFilter, setMaxPriceFilter] = useState(null);
    const [tempMinPrice, setTempMinPrice] = useState("");
    const [tempMaxPrice, setTempMaxPrice] = useState("");
    const [sortBy, setSortBy] = useState("newest"); // Changed default to "newest"
    const [viewMode, setViewMode] = useState("grid");
    const [expandedFilters, setExpandedFilters] = useState({
        brand: true,
        price: true,
        discount: false,
        sort: false
    });
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState(null);
    const [totalResults, setTotalResults] = useState(null);
    const [availableBrands, setAvailableBrands] = useState([]);
    const [computedMinPrice, setComputedMinPrice] = useState(null);
    const [computedMaxPrice, setComputedMaxPrice] = useState(null);
    const [subcategory, setSubcategory] = useState(subcategoryParam);
    const [categoriesList, setCategoriesList] = useState([]);
    const [brandSearch, setBrandSearch] = useState("");
    const [showBrandDropdown, setShowBrandDropdown] = useState(false);
    const brandDropdownRef = useRef(null);
    const brandInputRef = useRef(null);
    const [isSorting, setIsSorting] = useState(false);
    const fetchProducts = async () => {
        setLoading(true);
        setIsSorting(true);
        try {
            // Build params from url + filter state
            const params = { page: 1, limit: 48 };
            if (category)
                params.categorySlug = category;
            if (subcategoryParam)
                params.subcategory = subcategoryParam;
            if (selectedBrands.length)
                params.brandId = selectedBrands.join(',');
            if (minPriceFilter !== null)
                params.minPrice = minPriceFilter;
            if (maxPriceFilter !== null)
                params.maxPrice = maxPriceFilter;
            // Add sort parameters based on selected sort option
            const sortConfig = SORT_MAP[sortBy];
            if (sortConfig.sortBy) {
                params.sortBy = sortConfig.sortBy;
                params.sortOrder = sortConfig.sortOrder;
            }
            const response = await api.get('/products', { params });
            const data = response.data?.data || response.data;
            setProducts(data.products || []);
            setPagination(data.pagination || null);
            setTotalResults(data.pagination?.totalItems ?? (data.products || []).length ?? null);
            // Set computed price range if provided
            if (data.filters) {
                setComputedMinPrice(data.filters.computedMinPrice ?? null);
                setComputedMaxPrice(data.filters.computedMaxPrice ?? null);
            }
        }
        catch (err) {
            console.error('Failed to load products', err);
        }
        finally {
            setLoading(false);
            setIsSorting(false);
        }
    };
    useEffect(() => {
        fetchProducts();
    }, [category, subcategoryParam, selectedBrands, minPriceFilter, maxPriceFilter, sortBy]);
    useEffect(() => {
        AOS.init({ duration: 600, easing: "ease-out-cubic", once: true, offset: 50 });
        // Load available brands for filters
        const loadBrands = async () => {
            try {
                const response = await api.get('/brands');
                const data = response.data?.data || response.data;
                setAvailableBrands(Array.isArray(data) ? data : []);
            }
            catch (err) {
                console.error('Failed to load brands', err);
            }
        };
        // Load categories
        const loadCategories = async () => {
            try {
                const response = await api.get('/categories');
                const data = response.data?.data || response.data;
                setCategoriesList(Array.isArray(data) ? data : []);
            }
            catch (err) {
                console.error('Failed to load categories', err);
            }
        };
        loadBrands();
        loadCategories();
    }, []);
    // Close brand dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target)) {
                setShowBrandDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    // Focus on input when dropdown opens
    useEffect(() => {
        if (showBrandDropdown && brandInputRef.current) {
            brandInputRef.current.focus();
        }
    }, [showBrandDropdown]);
    const categoryTitle = category
        ? (categoriesList.find(c => c.slug === category)?.name || "Products")
        : "All Products";
    const toggleBrand = (brandId) => {
        setSelectedBrands(prev => prev.includes(brandId)
            ? prev.filter(b => b !== brandId)
            : [...prev, brandId]);
    };
    const applyPriceFilter = () => {
        const min = tempMinPrice ? parseInt(tempMinPrice) : null;
        const max = tempMaxPrice ? parseInt(tempMaxPrice) : null;
        // Validate min <= max
        if (min !== null && max !== null && min > max) {
            alert("Minimum price cannot be greater than maximum price");
            return;
        }
        setMinPriceFilter(min);
        setMaxPriceFilter(max);
    };
    const clearPriceFilter = () => {
        setMinPriceFilter(null);
        setMaxPriceFilter(null);
        setTempMinPrice("");
        setTempMaxPrice("");
    };
    const clearAllFilters = () => {
        setSelectedBrands([]);
        setMinPriceFilter(null);
        setMaxPriceFilter(null);
        setTempMinPrice("");
        setTempMaxPrice("");
    };
    const FilterSection = ({ title, expanded, onToggle, children }) => (<div className="border-b border-border py-3">
      <button onClick={onToggle} className="flex items-center justify-between w-full text-left">
        <span className="font-medium text-foreground text-sm">{title}</span>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground"/> : <ChevronDown className="w-4 h-4 text-muted-foreground"/>}
      </button>
      {expanded && <div className="mt-3 space-y-2">{children}</div>}
    </div>);
    const filteredBrands = availableBrands.filter(brand => brand.name.toLowerCase().includes(brandSearch.toLowerCase()));
    const FiltersContent = () => (<div className="space-y-1">
      {/* Sort Filter Section */}
      <FilterSection title="Sort By" expanded={expandedFilters.sort} onToggle={() => setExpandedFilters(prev => ({ ...prev, sort: !prev.sort }))}>
        <div className="space-y-1.5">
          {SORT_OPTIONS.map((option) => (<label key={option.value} className={`flex items-center gap-2 px-3 py-2 cursor-pointer rounded-md transition-colors ${sortBy === option.value ? 'bg-accent/10 border border-accent/30' : 'hover:bg-secondary'}`}>
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${sortBy === option.value
                ? 'bg-accent border-accent'
                : 'border-border'}`}>
                {sortBy === option.value && (<Check className="w-3 h-3 text-white"/>)}
              </div>
              <span className="text-sm text-foreground">{option.label}</span>
              <input type="radio" name="sort" value={option.value} checked={sortBy === option.value} onChange={(e) => setSortBy(e.target.value)} className="sr-only"/>
            </label>))}
        </div>
      </FilterSection>

      {/* Brand Filter with Searchable Select */}
      <FilterSection title="Brand" expanded={expandedFilters.brand} onToggle={() => setExpandedFilters(prev => ({ ...prev, brand: !prev.brand }))}>
        <div className="relative" ref={brandDropdownRef}>
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg cursor-pointer hover:border-accent/50 transition-colors" onClick={() => {
            setShowBrandDropdown(true);
            setTimeout(() => {
                if (brandInputRef.current) {
                    brandInputRef.current.focus();
                }
            }, 10);
        }}>
              <Search className="w-4 h-4 text-muted-foreground"/>
              <input ref={brandInputRef} type="text" placeholder="Search brands..." value={brandSearch} onChange={(e) => {
            setBrandSearch(e.target.value);
            setShowBrandDropdown(true);
        }} className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground" onClick={(e) => {
            e.stopPropagation();
            setShowBrandDropdown(true);
        }} onFocus={() => setShowBrandDropdown(true)}/>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showBrandDropdown ? 'rotate-180' : ''}`}/>
            </div>
            
            {/* Selected brands display */}
            {selectedBrands.length > 0 && (<div className="flex flex-wrap gap-1 mt-2">
                {selectedBrands.map(brandId => {
                const brand = availableBrands.find(b => String(b.id) === brandId);
                return brand ? (<span key={brandId} className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
                      {brand.name}
                      <button onClick={(e) => {
                        e.stopPropagation();
                        toggleBrand(brandId);
                    }} className="hover:text-destructive">
                        <X className="w-3 h-3"/>
                      </button>
                    </span>) : null;
            })}
              </div>)}
          </div>
          
          {/* Brand Dropdown */}
          {showBrandDropdown && (<div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredBrands.length === 0 ? (<div className="px-3 py-2 text-sm text-muted-foreground">No brands found</div>) : (<div className="py-1">
                  {filteredBrands.map((brand) => (<div key={brand.id} className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-secondary transition-colors ${selectedBrands.includes(String(brand.id)) ? 'bg-accent/10' : ''}`} onClick={() => {
                        toggleBrand(String(brand.id));
                        setBrandSearch("");
                        setShowBrandDropdown(false);
                    }}>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedBrands.includes(String(brand.id))
                        ? 'bg-accent border-accent'
                        : 'border-border'}`}>
                        {selectedBrands.includes(String(brand.id)) && (<Check className="w-3 h-3 text-white"/>)}
                      </div>
                      <span className="text-sm text-foreground">{brand.name}</span>
                    </div>))}
                </div>)}
            </div>)}
        </div>
      </FilterSection>

      {/* Price Filter with Apply Button */}
      <FilterSection title="Price" expanded={expandedFilters.price} onToggle={() => setExpandedFilters(prev => ({ ...prev, price: !prev.price }))}>
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <input type="number" placeholder="Min" value={tempMinPrice} onChange={(e) => setTempMinPrice(e.target.value)} className="w-1/2 px-3 py-2 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent" min="0" onFocus={(e) => e.target.select()}/>
            <input type="number" placeholder="Max" value={tempMaxPrice} onChange={(e) => setTempMaxPrice(e.target.value)} className="w-1/2 px-3 py-2 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent" min="0" onFocus={(e) => e.target.select()}/>
          </div>
          
          {(minPriceFilter !== null || maxPriceFilter !== null) ? (<div className="flex items-center justify-between">
              <span className="text-sm text-foreground">
                {minPriceFilter !== null && maxPriceFilter !== null
                ? `₹${minPriceFilter} - ₹${maxPriceFilter}`
                : minPriceFilter !== null
                    ? `Above ₹${minPriceFilter}`
                    : `Below ₹${maxPriceFilter}`}
              </span>
              <button onClick={clearPriceFilter} className="text-xs text-destructive hover:underline">
                Clear
              </button>
            </div>) : null}
          
          <button onClick={applyPriceFilter} disabled={!tempMinPrice && !tempMaxPrice} className={`w-full py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent ${tempMinPrice || tempMaxPrice
            ? 'bg-accent text-primary hover:bg-accent/90'
            : 'bg-muted text-muted-foreground cursor-not-allowed'}`}>
            Apply Price Filter
          </button>
          
          {(computedMinPrice !== null || computedMaxPrice !== null) && (<p className="text-xs text-muted-foreground mt-2">
              Prices range: ₹{computedMinPrice ?? 0} - ₹{computedMaxPrice ?? 0}
            </p>)}
        </div>
      </FilterSection>
    </div>);
    const hasActiveFilters = selectedBrands.length > 0 || minPriceFilter !== null || maxPriceFilter !== null;
    // Get current sort label
    const currentSortLabel = SORT_OPTIONS.find(opt => opt.value === sortBy)?.label || "Newest";
    return (<div className="min-h-screen bg-background overflow-x-hidden pb-20 md:pb-0">
      <Header />
      
      <div className="bg-card md:mt-4 mt-1 border-b border-border">
        <div className="container py-2 px-3 md:px-4">
          <nav className="text-xs md:text-sm text-muted-foreground">
            <Link to="/" className="hover:text-accent">Home</Link>
            <span className="mx-1.5 md:mx-2">›</span>
            <Link to="/products" className="hover:text-accent">All Products</Link>
            {category && (<>
                <span className="mx-1.5 md:mx-2">›</span>
                <Link to={`/products?category=${category}`} className="hover:text-accent">
                  {categoryTitle}
                </Link>
              </>)}
            {subcategoryParam && (<>
                <span className="mx-1.5 md:mx-2">›</span>
                <span className="text-foreground font-medium">{subcategoryParam}</span>
              </>)}
          </nav>
        </div>
      </div>

      <div className="container py-3 md:py-6 px-3 md:px-4">
        <div className="flex flex-col gap-3 mb-4 md:mb-6" data-aos="fade-up">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-foreground">
                {subcategoryParam ? `${subcategoryParam} ${categoryTitle}` : categoryTitle}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {(totalResults ?? products.length) + ' results'}
                {subcategoryParam && ` in ${subcategoryParam}`}
                {isSorting && ' • Sorting...'}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              {/* Desktop Sort Dropdown */}
              <div className="relative">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="py-2 px-3 bg-card border border-border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent appearance-none pr-8" disabled={isSorting}>
                  {SORT_OPTIONS.map((option) => (<option key={option.value} value={option.value}>
                      {option.label}
                    </option>))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"/>
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <button onClick={() => setViewMode("grid")} className={`p-2 rounded focus:outline-none focus:ring-2 focus:ring-accent ${viewMode === "grid" ? "bg-accent text-primary" : "text-muted-foreground"}`} disabled={isSorting}>
                  <Grid3X3 className="w-4 h-4"/>
                </button>
                <button onClick={() => setViewMode("list")} className={`p-2 rounded focus:outline-none focus:ring-2 focus:ring-accent ${viewMode === "list" ? "bg-accent text-primary" : "text-muted-foreground"}`} disabled={isSorting}>
                  <List className="w-4 h-4"/>
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 md:hidden">
            <button onClick={() => setShowMobileFilters(true)} className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-card border border-border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent" disabled={isSorting}>
              <SlidersHorizontal className="w-4 h-4"/>
              Filters
              {hasActiveFilters && <span className="bg-accent text-primary text-xs px-1.5 py-0.5 rounded-full">
                {selectedBrands.length + ((minPriceFilter !== null || maxPriceFilter !== null) ? 1 : 0)}
              </span>}
            </button>
            
           
          </div>
        </div>

        {hasActiveFilters && (<div className="flex flex-wrap gap-2 mb-4" data-aos="fade-up">
            {/* Active Sort Filter - Now always shown since sorting is always active */}
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
              {currentSortLabel}
              <button onClick={() => setSortBy("newest")} className="hover:text-destructive focus:outline-none focus:ring-2 focus:ring-accent rounded" disabled={isSorting}>
                <X className="w-3 h-3"/>
              </button>
            </span>
            
            {selectedBrands.map(bid => {
                const br = availableBrands.find(b => String(b.id) === bid);
                return (<span key={bid} className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
                  {br?.name || bid}
                  <button onClick={() => toggleBrand(bid)} className="hover:text-destructive focus:outline-none focus:ring-2 focus:ring-accent rounded" disabled={isSorting}>
                    <X className="w-3 h-3"/>
                  </button>
                </span>);
            })}
            
            {(minPriceFilter !== null || maxPriceFilter !== null) && (<span className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
                {minPriceFilter !== null && maxPriceFilter !== null
                    ? `₹${minPriceFilter} - ₹${maxPriceFilter}`
                    : minPriceFilter !== null
                        ? `Above ₹${minPriceFilter}`
                        : `Below ₹${maxPriceFilter}`}
                <button onClick={clearPriceFilter} className="hover:text-destructive focus:outline-none focus:ring-2 focus:ring-accent rounded" disabled={isSorting}>
                  <X className="w-3 h-3"/>
                </button>
              </span>)}
            
            <button onClick={clearAllFilters} className="text-xs text-krishna-blue-link hover:underline focus:outline-none focus:ring-2 focus:ring-accent rounded px-1" disabled={isSorting}>
              Clear all
            </button>
          </div>)}

        <div className="flex gap-6">
          <aside className="hidden md:block w-56 lg:w-64 shrink-0">
            <div className="bg-card rounded-lg border border-border p-4 sticky top-24" data-aos="fade-right">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-foreground">Filters</h2>
                {hasActiveFilters && (<button onClick={clearAllFilters} className="text-xs text-krishna-blue-link hover:underline focus:outline-none focus:ring-2 focus:ring-accent rounded" disabled={isSorting}>
                    Clear all
                  </button>)}
              </div>
              <FiltersContent />
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            {loading ? (<div className="text-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading products...</p>
              </div>) : products.length === 0 ? (<div className="text-center py-20">
                <h3 className="text-lg font-medium text-foreground">No products found</h3>
                <p className="text-muted-foreground mt-2">Try adjusting your filters or browse other categories</p>
                <Link to="/products" className="inline-block mt-4 px-4 py-2 bg-accent text-primary rounded-lg hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent">
                  Browse All Products
                </Link>
              </div>) : (<div className={`grid gap-3 md:gap-4 ${viewMode === "grid" ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"}`}>
                {products.map((product, index) => (<Link key={product.id} to={`/product/${product.slug || product.id}`} className="block focus:outline-none focus:ring-2 focus:ring-accent rounded-lg" data-aos="fade-up" data-aos-delay={Math.min(index * 50, 200)}>
                    <ProductCard product={product} variant={viewMode === "list" ? "default" : "compact"}/>
                  </Link>))}
              </div>)}
          </main>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (<>
          <div className="md:hidden fixed inset-0 bg-foreground/50 z-50" onClick={() => setShowMobileFilters(false)}/>
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card rounded-t-2xl z-50 max-h-[80vh] overflow-y-auto animate-slide-in-left">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-foreground">Filters</h2>
                <button onClick={() => setShowMobileFilters(false)} className="p-2 -mr-2 text-foreground hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded">
                  <X className="w-5 h-5"/>
                </button>
              </div>
              <FiltersContent />
              <button onClick={() => setShowMobileFilters(false)} className="w-full mt-4 py-3 bg-accent text-primary font-medium rounded-lg hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent">
                Apply Filters
              </button>
            </div>
          </div>
        </>)}

      <Footer />
    </div>);
}
