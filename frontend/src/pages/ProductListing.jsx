import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { ChevronDown, ChevronUp, X, Grid3X3, List, SlidersHorizontal, Search, Check } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import { baseUrl } from '@/config/baseUrl';
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE_URL = baseUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest" },
  { value: "price-low",  label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "name-asc",   label: "Name: A to Z" },
  { value: "name-desc",  label: "Name: Z to A" },
  { value: "discount",   label: "Best Discount" },
];

const SORT_MAP = {
  "newest":     { sortBy: "createdAt",          sortOrder: "desc" },
  "price-low":  { sortBy: "price",              sortOrder: "asc"  },
  "price-high": { sortBy: "price",              sortOrder: "desc" },
  "name-asc":   { sortBy: "name",               sortOrder: "asc"  },
  "name-desc":  { sortBy: "name",               sortOrder: "desc" },
  "discount":   { sortBy: "discountPercentage", sortOrder: "desc" },
};

// Predefined price range options
const PRICE_RANGES = [
  { label: "Any Price",         min: null,  max: null   },
  { label: "Under ₹500",        min: null,  max: 500    },
  { label: "₹500 – ₹1,000",     min: 500,   max: 1000   },
  { label: "₹1,000 – ₹2,500",   min: 1000,  max: 2500   },
  { label: "₹2,500 – ₹5,000",   min: 2500,  max: 5000   },
  { label: "₹5,000 – ₹10,000",  min: 5000,  max: 10000  },
  { label: "₹10,000 – ₹25,000", min: 10000, max: 25000  },
  { label: "Above ₹25,000",     min: 25000, max: null   },
];

export default function ProductListing() {
  const [searchParams] = useSearchParams();
  const { category: routeCategory } = useParams();
  const navigate = useNavigate();

  const queryCategory    = searchParams.get("category");
  const category         = routeCategory || queryCategory;
  const subcategoryParam = searchParams.get("subcategory");

  const [showMobileFilters,  setShowMobileFilters]  = useState(false);
  const [selectedBrands,     setSelectedBrands]     = useState([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState(null); // index into PRICE_RANGES, null = "Any"
  const [sortBy,             setSortBy]             = useState("newest");
  const [viewMode,           setViewMode]           = useState("grid");
  const [expandedFilters,    setExpandedFilters]    = useState({ brand: true, price: true, sort: false });

  const [products,        setProducts]        = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [isSorting,       setIsSorting]       = useState(false);
  const [pagination,      setPagination]      = useState(null);
  const [totalResults,    setTotalResults]    = useState(null);
  const [availableBrands, setAvailableBrands] = useState([]);
  const [computedMinPrice, setComputedMinPrice] = useState(null);
  const [computedMaxPrice, setComputedMaxPrice] = useState(null);
  const [categoriesList,  setCategoriesList]  = useState([]);

  const [brandSearch,       setBrandSearch]       = useState("");
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);

  const brandDropdownRef   = useRef(null);
  const brandInputRef      = useRef(null);
  const priceDropdownRef   = useRef(null);
  const abortControllerRef = useRef(null);

  // ─── Core fetch: accepts explicit overrides so stale state is never an issue ──
  const fetchProducts = useCallback(async ({
    overrideSortBy         = null,
    overrideSelectedBrands = null,
    overridePriceRangeIdx  = undefined, // undefined = "use current state", null = "Any Price"
    isSortOperation        = false,
  } = {}) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    isSortOperation ? setIsSorting(true) : setLoading(true);

    const activeSortBy   = overrideSortBy         ?? sortBy;
    const activeBrands   = overrideSelectedBrands ?? selectedBrands;
    const activePriceIdx = overridePriceRangeIdx !== undefined
      ? overridePriceRangeIdx
      : selectedPriceRange;
    const activePriceRange = activePriceIdx !== null ? PRICE_RANGES[activePriceIdx] : null;

    try {
      const params = { page: 1, limit: 48 };

      if (category)         params.categorySlug = category;
      if (subcategoryParam) params.subcategory  = subcategoryParam;
      if (activeBrands.length) params.brandId   = activeBrands.join(',');
      if (activePriceRange?.min != null) params.minPrice = activePriceRange.min;
      if (activePriceRange?.max != null) params.maxPrice = activePriceRange.max;

      const sortConfig = SORT_MAP[activeSortBy];
      params.sortBy    = sortConfig.sortBy;
      params.sortOrder = sortConfig.sortOrder;

      const response = await api.get('/products', {
        params,
        signal: abortControllerRef.current.signal,
      });

      const data = response.data?.data || response.data;
      setProducts(data.products || []);
      setPagination(data.pagination || null);
      setTotalResults(data.pagination?.totalItems ?? (data.products || []).length ?? null);

      if (data.filters) {
        setComputedMinPrice(data.filters.computedMinPrice ?? null);
        setComputedMaxPrice(data.filters.computedMaxPrice ?? null);
      }
    } catch (err) {
      if (err.code !== 'ERR_CANCELED' && err.name !== 'CanceledError' && err.name !== 'AbortError') {
        console.error('Failed to load products', err);
      }
    } finally {
      isSortOperation ? setIsSorting(false) : setLoading(false);
      abortControllerRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, subcategoryParam, sortBy, selectedBrands, selectedPriceRange]);

  // ─── Sort: pass new value as override so it takes effect immediately ──────
  const handleSortChange = (newSortBy) => {
    if (newSortBy === sortBy) return;
    setSortBy(newSortBy);
    fetchProducts({ overrideSortBy: newSortBy, isSortOperation: true });
    window.scrollTo({ top: document.querySelector('main')?.offsetTop - 100 || 0, behavior: 'smooth' });
  };

  // ─── Brand toggle ─────────────────────────────────────────────────────────
  const toggleBrand = (brandId) => {
    const next = selectedBrands.includes(brandId)
      ? selectedBrands.filter(b => b !== brandId)
      : [...selectedBrands, brandId];
    setSelectedBrands(next);
    fetchProducts({ overrideSelectedBrands: next });
  };

  // ─── Price range ──────────────────────────────────────────────────────────
  const handlePriceRangeSelect = (idx) => {
    // idx 0 = "Any Price" = clear
    const newIdx = idx === 0 ? null : idx;
    setSelectedPriceRange(newIdx);
    setShowPriceDropdown(false);
    fetchProducts({ overridePriceRangeIdx: newIdx });
  };

  // ─── Clear all ────────────────────────────────────────────────────────────
  const clearAllFilters = () => {
    setSelectedBrands([]);
    setSelectedPriceRange(null);
    setSortBy("newest");
    fetchProducts({
      overrideSortBy: "newest",
      overrideSelectedBrands: [],
      overridePriceRangeIdx: null,
    });
  };

  // ─── Initial load + re-fetch on URL change ────────────────────────────────
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, subcategoryParam]);

  useEffect(() => {
    AOS.init({ duration: 600, easing: "ease-out-cubic", once: true, offset: 50, disable: 'mobile' });

    const loadBrands = async () => {
      try {
        const res  = await api.get('/brands');
        const data = res.data?.data || res.data;
        setAvailableBrands(Array.isArray(data) ? data : []);
      } catch (err) { console.error('Failed to load brands', err); }
    };

    const loadCategories = async () => {
      try {
        const res  = await api.get('/categories');
        const data = res.data?.data || res.data;
        setCategoriesList(Array.isArray(data) ? data : []);
      } catch (err) { console.error('Failed to load categories', err); }
    };

    loadBrands();
    loadCategories();

    return () => { if (abortControllerRef.current) abortControllerRef.current.abort(); };
  }, []);

  // ─── Close dropdowns on outside click ────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(e.target))
        setShowBrandDropdown(false);
      if (priceDropdownRef.current && !priceDropdownRef.current.contains(e.target))
        setShowPriceDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (showBrandDropdown && brandInputRef.current) brandInputRef.current.focus();
  }, [showBrandDropdown]);

  const categoryTitle = category
    ? (categoriesList.find(c => c.slug === category)?.name || "Products")
    : "All Products";

  const filteredBrands = availableBrands.filter(b =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const activePriceLabel  = selectedPriceRange !== null ? PRICE_RANGES[selectedPriceRange]?.label : null;
  const hasActiveFilters  = selectedBrands.length > 0 || selectedPriceRange !== null;
  const currentSortLabel  = SORT_OPTIONS.find(o => o.value === sortBy)?.label || "Newest";

  // ─── Reusable collapsible section ────────────────────────────────────────
  const FilterSection = ({ title, expanded, onToggle, children }) => (
    <div className="border-b border-border py-3">
      <button
        onClick={onToggle}
        disabled={loading || isSorting}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="font-medium text-foreground text-sm">{title}</span>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {expanded && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );

  // ─── Shared filters panel ─────────────────────────────────────────────────
  const FiltersContent = () => (
    <div className="space-y-1">

      {/* Sort */}
      <FilterSection
        title="Sort By"
        expanded={expandedFilters.sort}
        onToggle={() => setExpandedFilters(p => ({ ...p, sort: !p.sort }))}
      >
        <div className="space-y-1.5">
          {SORT_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer rounded-md transition-colors ${
                sortBy === option.value ? 'bg-accent/10 border border-accent/30' : 'hover:bg-secondary'
              } ${isSorting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                sortBy === option.value ? 'bg-accent border-accent' : 'border-border'
              }`}>
                {sortBy === option.value && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm text-foreground">{option.label}</span>
              {isSorting && sortBy === option.value && (
                <span className="ml-auto text-xs text-accent animate-pulse">Sorting…</span>
              )}
              <input
                type="radio"
                name="sort"
                value={option.value}
                checked={sortBy === option.value}
                onChange={() => handleSortChange(option.value)}
                disabled={isSorting}
                className="sr-only"
              />
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Brand */}
      <FilterSection
        title="Brand"
        expanded={expandedFilters.brand}
        onToggle={() => setExpandedFilters(p => ({ ...p, brand: !p.brand }))}
      >
        <div className="relative" ref={brandDropdownRef}>
          <div
            className={`flex items-center gap-2 px-3 py-2 border border-border rounded-lg cursor-pointer hover:border-accent/50 transition-colors ${
              (loading || isSorting) ? 'opacity-50 pointer-events-none' : ''
            }`}
            onClick={() => setShowBrandDropdown(true)}
          >
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={brandInputRef}
              type="text"
              placeholder="Search brands…"
              value={brandSearch}
              onChange={(e) => { setBrandSearch(e.target.value); setShowBrandDropdown(true); }}
              onClick={(e) => { e.stopPropagation(); setShowBrandDropdown(true); }}
              onFocus={() => setShowBrandDropdown(true)}
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
              disabled={loading || isSorting}
            />
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${showBrandDropdown ? 'rotate-180' : ''}`} />
          </div>

          {/* Selected brand chips */}
          {selectedBrands.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedBrands.map(brandId => {
                const brand = availableBrands.find(b => String(b.id) === brandId);
                return brand ? (
                  <span key={brandId} className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
                    {brand.name}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleBrand(brandId); }}
                      disabled={loading || isSorting}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          )}

          {/* Brand dropdown */}
          {showBrandDropdown && (
            <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredBrands.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">No brands found</div>
              ) : (
                <div className="py-1">
                  {filteredBrands.map((brand) => (
                    <div
                      key={brand.id}
                      className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-secondary transition-colors ${
                        selectedBrands.includes(String(brand.id)) ? 'bg-accent/10' : ''
                      } ${(loading || isSorting) ? 'pointer-events-none opacity-50' : ''}`}
                      onClick={() => {
                        toggleBrand(String(brand.id));
                        setBrandSearch("");
                        setShowBrandDropdown(false);
                      }}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        selectedBrands.includes(String(brand.id)) ? 'bg-accent border-accent' : 'border-border'
                      }`}>
                        {selectedBrands.includes(String(brand.id)) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm text-foreground">{brand.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </FilterSection>

      {/* Price Range — select2-style dropdown */}
      <FilterSection
        title="Price Range"
        expanded={expandedFilters.price}
        onToggle={() => setExpandedFilters(p => ({ ...p, price: !p.price }))}
      >
        <div className="relative" ref={priceDropdownRef}>
          {/* Trigger */}
          <button
            type="button"
            onClick={() => { if (!loading && !isSorting) setShowPriceDropdown(p => !p); }}
            disabled={loading || isSorting}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 border rounded-lg text-sm transition-colors ${
              selectedPriceRange !== null
                ? 'border-accent/60 bg-accent/5 text-foreground'
                : 'border-border bg-transparent text-muted-foreground hover:border-accent/50'
            } ${(loading || isSorting) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className={selectedPriceRange !== null ? 'text-foreground font-medium' : ''}>
              {activePriceLabel ?? "Select price range"}
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
              {selectedPriceRange !== null && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); handlePriceRangeSelect(0); }}
                  onKeyDown={(e) => e.key === 'Enter' && handlePriceRangeSelect(0)}
                  className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </span>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${showPriceDropdown ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* Options list */}
          {showPriceDropdown && (
            <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden">
              {PRICE_RANGES.map((range, idx) => {
                const isSelected = idx === 0
                  ? selectedPriceRange === null
                  : selectedPriceRange === idx;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-accent/10 text-accent'
                        : 'hover:bg-secondary text-foreground'
                    }`}
                    onClick={() => handlePriceRangeSelect(idx)}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-accent border-accent' : 'border-border'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm">{range.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* API price hint */}
          {(computedMinPrice !== null || computedMaxPrice !== null) && (
            <p className="text-xs text-muted-foreground mt-2">
              Available range: ₹{computedMinPrice ?? 0} – ₹{computedMaxPrice ?? 0}
            </p>
          )}
        </div>
      </FilterSection>
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
            <Link to="/products" className="hover:text-accent">All Products</Link>
            {category && (
              <>
                <span className="mx-1.5 md:mx-2">›</span>
                <Link to={`/products?category=${category}`} className="hover:text-accent">{categoryTitle}</Link>
              </>
            )}
            {subcategoryParam && (
              <>
                <span className="mx-1.5 md:mx-2">›</span>
                <span className="text-foreground font-medium">{subcategoryParam}</span>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="container py-3 md:py-6 px-3 md:px-4">

        {/* Page header */}
        <div className="flex flex-col gap-3 mb-4 md:mb-6" data-aos="fade-up">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-foreground">
                {subcategoryParam ? `${subcategoryParam} ${categoryTitle}` : categoryTitle}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {subcategoryParam && `in ${subcategoryParam}`}
                {isSorting && <span className="ml-2 text-accent animate-pulse">• Sorting…</span>}
              </p>
            </div>

            <div className="hidden md:flex items-center gap-3">
              {/* Desktop sort select */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  disabled={isSorting}
                  className={`py-2 px-3 bg-card border border-border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent appearance-none pr-8 ${
                    isSorting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                {isSorting && (
                  <div className="absolute inset-0 bg-card/50 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* View mode toggle */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  disabled={loading || isSorting}
                  className={`p-2 rounded focus:outline-none focus:ring-2 focus:ring-accent ${
                    viewMode === "grid" ? "bg-accent text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  disabled={loading || isSorting}
                  className={`p-2 rounded focus:outline-none focus:ring-2 focus:ring-accent ${
                    viewMode === "list" ? "bg-accent text-primary" : "text-muted-foreground"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile filter trigger */}
          <div className="flex gap-2 md:hidden">
            <button
              onClick={() => setShowMobileFilters(true)}
              disabled={loading || isSorting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-card border border-border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="bg-accent text-primary text-xs px-1.5 py-0.5 rounded-full">
                  {selectedBrands.length + (selectedPriceRange !== null ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        {(hasActiveFilters || sortBy !== "newest") && (
          <div className="flex flex-wrap gap-2 mb-4" data-aos="fade-up">
            {sortBy !== "newest" && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
                {currentSortLabel}
                <button onClick={() => handleSortChange("newest")} disabled={isSorting} className="hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedBrands.map(bid => {
              const br = availableBrands.find(b => String(b.id) === bid);
              return (
                <span key={bid} className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
                  {br?.name || bid}
                  <button onClick={() => toggleBrand(bid)} disabled={loading || isSorting} className="hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}

            {selectedPriceRange !== null && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
                {PRICE_RANGES[selectedPriceRange]?.label}
                <button onClick={() => handlePriceRangeSelect(0)} disabled={loading || isSorting} className="hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={clearAllFilters}
              disabled={loading || isSorting}
              className="text-xs text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-accent rounded px-1"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden md:block w-56 lg:w-64 shrink-0">
            <div className="bg-card rounded-lg border border-border p-4 sticky top-24" data-aos="fade-right">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-foreground">Filters</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    disabled={loading || isSorting}
                    className="text-xs text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-accent rounded"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <FiltersContent />
            </div>
          </aside>

          {/* Product grid / list */}
          <main className="flex-1 min-w-0">
            {loading || isSorting ? (
              <div className={`grid gap-3 md:gap-4 ${
                viewMode === "grid"
                  ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                  : "grid-cols-1"
              }`}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-3 p-3 border rounded-lg">
                    <Skeleton className={`w-full ${viewMode === "grid" ? "aspect-[4/5]" : "h-48"} rounded-lg`} />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <div className="flex justify-between items-center pt-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <h3 className="text-lg font-medium text-foreground">No products found</h3>
                <p className="text-muted-foreground mt-2">Try adjusting your filters or browse other categories</p>
                <button
                  onClick={() => { clearAllFilters(); navigate("/products"); }}
                  className="inline-block mt-4 px-4 py-2 bg-accent text-primary rounded-lg hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  Browse All Products
                </button>
              </div>
            ) : (
              <div className={`grid gap-3 md:gap-4 ${
                viewMode === "grid"
                  ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                  : "grid-cols-1"
              }`}>
                {products.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.slug || product.id}`}
                    className="block focus:outline-none focus:ring-2 focus:ring-accent rounded-lg"
                  >
                    <ProductCard
                      product={product}
                      variant={viewMode === "list" ? "default" : "compact"}
                    />
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile filters drawer */}
      {showMobileFilters && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-foreground/50 z-50"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="md:hidden fixed top-0 left-0 right-0 bg-card rounded-b-2xl z-50 max-h-[80vh] overflow-y-auto shadow-xl animate-slide-in-top">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-foreground">Filters</h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 -mr-2 text-foreground hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FiltersContent />
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full mt-4 py-3 bg-accent text-primary font-medium rounded-lg hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}

      <Footer />

      <style>{`
        @keyframes slideInTop {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        .animate-slide-in-top { animation: slideInTop 0.3s ease-out; }
      `}</style>
    </div>
  );
}