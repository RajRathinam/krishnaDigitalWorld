import { useState, useEffect, useRef, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  Star, Heart, Share2, ShoppingCart, Check,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  ThumbsUp, Package,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ProductCard } from "@/components/product/ProductCard";
import { FloatingContactButtons } from "@/components/product/FloatingContactButtons";
import { toast } from "sonner";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/utils";

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;

// ─── JSON helpers ──────────────────────────────────────────────────────────────
const parseJSONSafe = (data, defaultValue = null) => {
  if (!data) return defaultValue;
  if (typeof data === "object" && !Array.isArray(data)) return data;
  if (typeof data === "string") {
    try { return JSON.parse(data.replace(/\\"/g, '"').replace(/\\\\/g, "\\")); }
    catch { return defaultValue; }
  }
  return defaultValue;
};

// ─── Spec table helpers ────────────────────────────────────────────────────────
const formatKey = (key) =>
  String(key)
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

const formatValue = (val) => {
  if (val === null || val === undefined || val === "") return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (Array.isArray(val)) {
    if (!val.length) return "—";
    if (typeof val[0] === "object" && val[0] !== null)
      return val.map((item) => Object.entries(item).map(([k, v]) => `${formatKey(k)}: ${v}`).join(", ")).join("  |  ");
    return val.join(", ");
  }
  return String(val);
};

const flattenToRows = (obj) => {
  if (!obj || typeof obj !== "object" || Array.isArray(obj))
    return [{ label: "Value", value: formatValue(obj) }];
  const rows = [];
  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined || val === "") continue;
    const label = formatKey(key);
    if (Array.isArray(val)) {
      rows.push({ label, value: formatValue(val) });
    } else if (typeof val === "object") {
      for (const [subKey, subVal] of Object.entries(val)) {
        if (subVal === null || subVal === undefined || subVal === "") continue;
        const subLabel = `${label} · ${formatKey(subKey)}`;
        rows.push({
          label: subLabel,
          value: typeof subVal === "object" && !Array.isArray(subVal)
            ? JSON.stringify(subVal)
            : formatValue(subVal),
        });
      }
    } else {
      rows.push({ label, value: formatValue(val) });
    }
  }
  return rows;
};

const buildSpecSections = (attributes) => {
  if (!attributes || typeof attributes !== "object" || !Object.keys(attributes).length) return [];
  const isFlat = Object.values(attributes).every((v) => v === null || typeof v !== "object");
  if (isFlat) {
    const rows = Object.entries(attributes)
      .filter(([, v]) => v !== null && v !== undefined && v !== "")
      .map(([k, v]) => ({ label: formatKey(k), value: formatValue(v) }));
    return rows.length ? [{ title: null, rows }] : [];
  }
  return Object.entries(attributes)
    .map(([k, v]) => ({ title: formatKey(k), rows: flattenToRows(v) }))
    .filter((s) => s.rows.length > 0);
};

// ─── Image Slider ──────────────────────────────────────────────────────────────
function ImageSlider({ images, productName, colorName, discount }) {
  const [current, setCurrent]     = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef(null);
  const total = images.length;

  // Reset to first slide whenever the image list changes (color swap)
  useEffect(() => { setCurrent(0); setDragOffset(0); }, [images]);

  const goTo = useCallback((idx) => {
    setCurrent(((idx % total) + total) % total);
    setDragOffset(0);
  }, [total]);

  const prev = useCallback(() => goTo(current - 1), [current, goTo]);
  const next = useCallback(() => goTo(current + 1), [current, goTo]);

  // ── Pointer / touch drag ───────────────────────────────────────────────────
  const onPointerDown = (e) => {
    setIsDragging(true);
    setDragStartX(e.touches ? e.touches[0].clientX : e.clientX);
  };
  const onPointerMove = (e) => {
    if (!isDragging) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    setDragOffset(x - dragStartX);
  };
  const onPointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset < -50) next();
    else if (dragOffset > 50) prev();
    else setDragOffset(0);
  };

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next]);

  if (!images.length) {
    return (
      <div className="aspect-square flex flex-col items-center justify-center bg-card rounded-xl border border-border">
        <Package className="w-24 h-24 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">No image available</p>
      </div>
    );
  }

  // ── The key fix ───────────────────────────────────────────────────────────
  // translateX % is relative to the TRACK element (which is `total * 100%` wide).
  // To shift by exactly 1 container-width we must use (100 / total)% per step,
  // not 100% per step.  dragOffset is in pixels so it needs no correction.
  const trackShift = current * (100 / total); // % of track width == 1 container width per step

  return (
    <div className="select-none">
      {/* Main viewport */}
      <div
        ref={containerRef}
        className="relative bg-white rounded-xl border border-border overflow-hidden aspect-square cursor-grab active:cursor-grabbing"
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
      >
        {/* Track — holds all slides side-by-side */}
        <div
          className="flex h-full"
          style={{
            width: `${total * 100}%`,
            transform: `translateX(calc(-${trackShift}% + ${dragOffset}px))`,
            transition: isDragging ? "none" : "transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        >
          {images.map((image, i) => (
            <div
              key={i}
              className="flex items-center justify-center p-6 h-full"
              style={{ width: `${100 / total}%`, flexShrink: 0 }}
            >
              {image?.url ? (
                <img
                  src={getImageUrl(image.url)}
                  alt={image.alt || `${productName} - ${colorName}`}
                  className="w-full h-full object-contain pointer-events-none"
                  draggable={false}
                  onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                />
              ) : (
                <Package className="w-32 h-32 text-muted-foreground/40" />
              )}
            </div>
          ))}
        </div>

        {/* Discount badge */}
        {discount > 0 && (
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            <span className="deal-badge">{discount}% OFF</span>
          </div>
        )}

        {/* Prev / Next arrows */}
        {total > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full shadow-md hover:bg-white hover:scale-105 transition-all"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full shadow-md hover:bg-white hover:scale-105 transition-all"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </button>
          </>
        )}

        {/* Counter badge */}
        {total > 1 && (
          <div className="absolute bottom-3 right-3 z-10 pointer-events-none bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
            {current + 1} / {total}
          </div>
        )}
      </div>

      {/* Dot indicators */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-200 ${
                i === current ? "w-5 h-2 bg-accent" : "w-2 h-2 bg-border hover:bg-muted-foreground"
              }`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Thumbnail strip */}
      {total > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide p-1">
          {images.map((image, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`shrink-0 w-16 h-16 flex items-center justify-center rounded-lg border-2 transition-all bg-white overflow-hidden ${
                current === i
                  ? "border-accent shadow-sm scale-105"
                  : "border-border hover:border-accent/50 opacity-70 hover:opacity-100"
              }`}
            >
              {image?.url ? (
                <img
                  src={getImageUrl(image.url)}
                  alt={image.alt || `thumb ${i + 1}`}
                  className="w-full h-full object-contain p-1"
                  draggable={false}
                  onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                />
              ) : (
                <Package className="w-6 h-6 text-muted-foreground/40" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ProductDetail ────────────────────────────────────────────────────────
export default function ProductDetail() {
  const { slug, id } = useParams();
  const identifier = slug || id || "";
  const navigate = useNavigate();

  const [product,          setProduct]          = useState(null);
  const [loading,          setLoading]          = useState(false);
  const [selectedColor,    setSelectedColor]    = useState(0);
  const [showAllSpecs,     setShowAllSpecs]     = useState(false);
  const [openSections,     setOpenSections]     = useState({});
  const [showAllReviews,   setShowAllReviews]   = useState(false);
  const [relatedProducts,  setRelatedProducts]  = useState([]);
  const [relatedLoading,   setRelatedLoading]   = useState(false);
  const [showQRModal,      setShowQRModal]      = useState(false);
  const [userRating,       setUserRating]       = useState(0);

  const handleRateProduct = async (rating) => {
    const token = localStorage.getItem("authToken");
    if (!token) { window.dispatchEvent(new Event("openSignup")); return; }
    try {
      const res = await api.post("/reviews", { productId: product.id, rating, comment: "" });
      if (res.data.success) { setUserRating(rating); toast.success("Thanks for your rating!"); }
    } catch (err) {
      if (err.response?.status === 403) toast.error("You need to purchase this product to rate it.");
      else if (err.response?.status === 400 && err.response?.data?.message?.includes("already"))
        toast.error("You have already rated this product.");
      else toast.error(err.response?.data?.message || "Failed to submit rating.");
    }
  };

  const parseProductData = (d) => {
    if (!d) return d;
    if (typeof d.attributes      === "string") d.attributes      = parseJSONSafe(d.attributes, {});
    if (typeof d.colorsAndImages  === "string") d.colorsAndImages  = parseJSONSafe(d.colorsAndImages, {});
    if (typeof d.stock            === "string") d.stock            = parseJSONSafe(d.stock, {});
    if (d.price)              d.price              = parseFloat(d.price)              || 0;
    if (d.discountPrice)      d.discountPrice      = parseFloat(d.discountPrice)      || 0;
    if (d.discountPercentage) d.discountPercentage = parseFloat(d.discountPercentage) || 0;
    if (d.rating)             d.rating             = parseFloat(d.rating)             || 0;
    if (d.totalReviews)       d.totalReviews       = parseInt(d.totalReviews)         || 0;
    if (!d.colorsAndImages)   d.colorsAndImages    = {};
    return d;
  };

  const getStockForColor = (stock, colorName) => {
    if (!stock || !colorName) return 0;
    const s = typeof stock === "string" ? parseJSONSafe(stock, {}) : stock;
    if (typeof s === "number") return s;
    if (typeof s === "object" && !Array.isArray(s)) {
      const v = s[colorName];
      if (v != null) { const n = typeof v === "number" ? v : parseInt(String(v)); return isNaN(n) ? 0 : n; }
    }
    return 0;
  };

  useEffect(() => {
    const fetch_ = async () => {
      if (!identifier) return;
      setLoading(true);
      try {
        const res = await api.get(`/products/${identifier}`);
        setProduct(parseProductData(res.data.data || res.data));
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load product details");
      } finally { setLoading(false); }
    };
    fetch_();
  }, [identifier]);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!product?.id) return;
      setRelatedLoading(true);
      try {
        if (product.relatedProducts?.length > 0) {
          setRelatedProducts(product.relatedProducts.map(parseProductData).slice(0, 4));
        } else {
          const res = await api.get(`/products/${product.id}/related`);
          const d = res.data;
          let arr = d.success && d.data ? d.data : Array.isArray(d) ? d : d.relatedProducts || d.products || [];
          if (!Array.isArray(arr)) arr = [];
          setRelatedProducts(arr.map(parseProductData).filter((p) => p.id !== product.id).slice(0, 4));
        }
      } catch {
        if (product?.category?.slug) {
          try {
            const fb = await api.get(`/categories/${product.category.slug}/products?page=1&limit=8`);
            const fetched = fb.data.data?.products || fb.data.products || [];
            setRelatedProducts(
              (Array.isArray(fetched) ? fetched : [])
                .map(parseProductData)
                .filter((p) => p.id !== product.id)
                .slice(0, 4)
            );
          } catch { setRelatedProducts([]); }
        } else { setRelatedProducts([]); }
      } finally { setRelatedLoading(false); }
    };
    if (product) fetchRelated();
  }, [product]);

  const getParsedColorsAndImages = () => {
    if (!product) return {};
    const c = product.colorsAndImages;
    if (!c) return {};
    if (typeof c === "string") return parseJSONSafe(c, {});
    if (typeof c === "object" && !Array.isArray(c)) return c;
    return {};
  };

  const getParsedAttributes = () => {
    if (!product) return {};
    const a = product.attributes;
    if (!a) return {};
    if (typeof a === "string") return parseJSONSafe(a, {});
    if (typeof a === "object" && !Array.isArray(a)) return a;
    return {};
  };

  const getColorNames = () => Object.keys(getParsedColorsAndImages());

  const getSelectedColorImages = () => {
    const c = getParsedColorsAndImages();
    const names = Object.keys(c);
    if (!names.length) return [];
    const name = names[selectedColor];
    return name && c[name] ? (Array.isArray(c[name]) ? c[name] : []) : [];
  };

  const handleAddToCart = async () => {
    if (!product) return false;
    const token = localStorage.getItem("authToken");
    if (!token) { window.dispatchEvent(new Event("openSignup")); return false; }
    try {
      const colorNames        = getColorNames();
      const selectedColorName = colorNames[selectedColor];
      const payload           = { productId: String(product.id), quantity: 1 };
      if (selectedColorName) {
        payload.colorName = selectedColorName;
        if (getStockForColor(product.stock, selectedColorName) <= 0) {
          toast.error("Selected color is out of stock"); return false;
        }
      }
      const res = await api.post("/cart/items", payload);
      if (res.data.success) {
        window.dispatchEvent(new Event("cartUpdated"));
        toast.success(`${product.name} added to cart!`, {
          description: selectedColorName ? `Color: ${selectedColorName}` : "Item added to cart",
        });
        return true;
      }
      toast.error(res.data.message || "Failed to add to cart"); return false;
    } catch (err) {
      if (err.response?.status === 401) { toast.error("Session expired. Please sign in again."); navigate("/login"); }
      else toast.error(err.response?.data?.message || "Failed to add item to cart");
      return false;
    }
  };

  const handleBuyNow = async () => { const ok = await handleAddToCart(); if (ok) navigate("/checkout"); };

  const generateQRCodeUrl = () =>
    product ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${FRONTEND_URL}/product/${product.slug || product.id}`)}` : "";

  const handleWhatsAppShare = () => {
    if (!product) return;
    const url   = `${FRONTEND_URL}/product/${product.slug || product.id}`;
    const price = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(product.discountPrice || product.price);
    window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this product on Krishna Stores:\n\n${product.name}\nPrice: ${price}\n\nView details: ${url}`)}`, "_blank");
    setShowQRModal(false);
  };

  const copyToClipboard = () => {
    if (!product) return;
    navigator.clipboard.writeText(`${FRONTEND_URL}/product/${product.slug || product.id}`)
      .then(() => { toast.success("Link copied to clipboard!"); setShowQRModal(false); })
      .catch(() => toast.error("Failed to copy link"));
  };

  const shareViaNative = () => {
    if (!product) return;
    if (navigator.share)
      navigator.share({ title: product.name, text: `Check out ${product.name} on Krishna Stores`, url: `${FRONTEND_URL}/product/${product.slug || product.id}` })
        .then(() => setShowQRModal(false)).catch(console.log);
    else copyToClipboard();
  };

  const getColorFromName = (colorName) => {
    if (!colorName || typeof colorName !== "string") return "#cccccc";
    const lower = colorName.toLowerCase();
    const map = {
      white: "#ffffff", black: "#000000", red: "#ff0000", blue: "#0000ff", green: "#00cc44",
      yellow: "#ffff00", orange: "#ffa500", purple: "#800080", pink: "#ffc0cb", brown: "#a52a2a",
      gray: "#808080", grey: "#808080", silver: "#c0c0c0", gold: "#ffd700", navy: "#000080",
      teal: "#008080", maroon: "#800000",
    };
    for (const [key, val] of Object.entries(map)) { if (lower.includes(key)) return val; }
    let hash = 0;
    for (let i = 0; i < colorName.length; i++) hash = colorName.charCodeAt(i) + ((hash << 5) - hash);
    return `rgb(${Math.min(220,Math.max(30,(hash&0xff0000)>>16))},${Math.min(220,Math.max(30,(hash&0x00ff00)>>8))},${Math.min(220,Math.max(30,hash&0x0000ff))})`;
  };

  const formatPrice = (p) =>
    (!p && p !== 0) ? "₹0"
    : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p);

  const renderStars = (r, size = "w-4 h-4") => (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <Star key={s} className={`${size} ${s <= Math.floor(r) ? "text-accent fill-accent" : s <= r ? "text-accent fill-accent/50" : "text-muted-foreground"}`} />
      ))}
    </div>
  );

  const price         = product?.discountPrice ?? product?.price ?? 0;
  const originalPrice = product?.price ?? price;
  const discount      = product?.discountPercentage ?? (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);
  const rating        = product?.rating ?? 0;
  const reviewsCount  = product?.totalReviews ?? 0;
  const getRatingPct  = (s) => ({ 5: 65, 4: 20, 3: 10, 2: 3, 1: 2 }[s] || 0);

  const specSections = buildSpecSections(getParsedAttributes());
  const INITIAL_ROWS = 8;
  const toggleSection = (title) => setOpenSections((p) => ({ ...p, [title]: !p[title] }));

  useEffect(() => {
    if (specSections.length > 0) {
      const init = {};
      specSections.forEach((s) => { if (s.title) init[s.title] = true; });
      setOpenSections(init);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const highlights = product?.description ? [product.description] : [];
  const reviews     = Array.isArray(product?.reviews) ? product.reviews : [];

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background md:pb-0">
        <Header />
        <div className="bg-card border-b border-border">
          <div className="container py-2 px-3 md:px-4"><Skeleton className="h-4 w-1/3" /></div>
        </div>
        <div className="container py-4 md:py-6 px-3 md:px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">
            <div className="lg:col-span-5">
              <Skeleton className="aspect-square rounded-xl w-full" />
              <div className="flex gap-2 mt-3">{[0,1,2].map(i => <Skeleton key={i} className="w-16 h-16 rounded-lg" />)}</div>
            </div>
            <div className="lg:col-span-7 space-y-4">
              <Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-32" /><Skeleton className="h-24 w-full rounded-lg" />
              <div className="flex gap-4"><Skeleton className="h-12 flex-1 rounded-lg" /><Skeleton className="h-12 flex-1 rounded-lg" /></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist or is inactive.</p>
          <Link to="/" className="btn-primary inline-block">Go Back Home</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const colorNames          = getColorNames();
  const selectedColorName   = colorNames[selectedColor] || "";
  const selectedColorImages = getSelectedColorImages();

  return (
    <div className="min-h-screen bg-background md:pb-0">
      <Header />

      {/* QR Modal */}
      {showQRModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[100]" onClick={() => setShowQRModal(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] bg-card rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground text-lg">Share Product</h3>
              <button onClick={() => setShowQRModal(false)} className="p-1 hover:bg-muted rounded-full">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="text-center mb-6">
              <div className="mb-4 flex justify-center">
                <div className="bg-white p-4 rounded-lg inline-block">
                  <img src={generateQRCodeUrl()} alt="QR Code" className="w-48 h-48" onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Scan QR code to view product</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleWhatsAppShare} className="py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.76.982.998-3.675-.236-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.9 6.994c-.004 5.45-4.438 9.88-9.888 9.88m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.333.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.333 11.893-11.893 0-3.18-1.24-6.162-3.495-8.411" />
                </svg>
                WhatsApp
              </button>
              <button onClick={shareViaNative} className="py-3 bg-accent text-accent-foreground rounded-lg hover:opacity-90 flex items-center justify-center gap-2">
                <Share2 className="w-5 h-5" />
                {navigator.share ? "Share" : "Copy Link"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Breadcrumb */}
      <div className="bg-card border-b border-border">
        <div className="container py-2 px-3 md:px-4">
          <nav className="text-xs md:text-sm text-muted-foreground overflow-x-auto whitespace-nowrap scrollbar-hide">
            <Link to="/" className="hover:text-accent">Home</Link>
            <span className="mx-1.5">›</span>
            <Link to={`/products?category=${product?.category?.slug || ""}`} className="hover:text-accent">
              {product?.category?.name || "Products"}
            </Link>
            <span className="mx-1.5">›</span>
            <span className="text-foreground">{product?.name}</span>
          </nav>
        </div>
      </div>

      <div className="container py-4 md:py-6 px-3 md:px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">

          {/* ── Image column ── */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              {/* Brand + action row */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-sm text-accent font-medium">{product.brand?.name || "Unknown Brand"}</p>
                <div className="flex gap-1">
                  <button className="p-2 bg-card rounded-full border border-border shadow-sm hover:shadow-md transition-shadow">
                    <Heart className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                  <button onClick={() => setShowQRModal(true)} className="p-2 bg-card rounded-full border border-border shadow-sm hover:shadow-md transition-shadow">
                    <Share2 className="w-4 h-4 text-muted-foreground hover:text-accent" />
                  </button>
                </div>
              </div>

              <ImageSlider
                images={selectedColorImages}
                productName={product?.name}
                colorName={selectedColorName}
                discount={discount}
              />
            </div>
          </div>

          {/* ── Details column ── */}
          <div className="lg:col-span-7">

            {/* Title & rating */}
            <div className="mb-4">
              <h1 className="text-lg md:text-2xl font-medium text-foreground leading-tight mb-2">
                {product.name}{product.variant ? ` - ${product.variant}` : ""}
              </h1>
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <div className="flex items-center gap-1 bg-accent/10 px-2 py-1 rounded">
                  <span className="font-medium text-accent">{rating}</span>
                  <Star className="w-4 h-4 text-accent fill-accent" />
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="bg-card rounded-lg border border-border p-4 mb-4">
              <div className="flex items-baseline gap-2 flex-wrap">
                {discount > 0 && <span className="text-xs text-muted-foreground">-{discount}%</span>}
                <span className="text-2xl md:text-3xl font-bold text-foreground">{formatPrice(price)}</span>
                {originalPrice > price && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">{formatPrice(originalPrice)}</span>
                    <span className="text-sm text-accent font-medium">Save {formatPrice(originalPrice - price)}</span>
                  </>
                )}
              </div>
            </div>

            {/* Color selection */}
            {colorNames.length > 0 && (
              <div className="mb-4">
                <h2 className="text-sm font-medium text-foreground mb-3">
                  Color: <span className="text-muted-foreground">{selectedColorName || "Default"}</span>
                </h2>
                <div className="flex gap-3 flex-wrap">
                  {colorNames.map((colorName, i) => {
                    const isSelected = selectedColor === i;
                    return (
                      <button
                        key={colorName}
                        onClick={() => setSelectedColor(i)}
                        title={colorName}
                        style={{ backgroundColor: getColorFromName(colorName) }}
                        className={`relative w-10 h-10 rounded-full border-2 transition-all group ${
                          isSelected ? "border-accent ring-2 ring-accent/30" : "border-border hover:border-accent/50"
                        }`}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {colorName}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45" />
                        </div>
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full bg-white/80 flex items-center justify-center">
                              <Check className="w-3 h-3 text-gray-900" />
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock */}
            {selectedColorName && (
              <div className="mb-4">
                <p className={`text-sm font-medium ${getStockForColor(product.stock, selectedColorName) > 0 ? "text-green-600" : "text-red-600"}`}>
                  {getStockForColor(product.stock, selectedColorName) > 0
                    ? `In Stock: ${getStockForColor(product.stock, selectedColorName)} available`
                    : "Out of Stock"}
                </p>
              </div>
            )}

            {/* Cart / Buy buttons */}
            <div className="flex items-center gap-4 mb-6">
              <button onClick={handleAddToCart} className="flex-1 py-3 border-2 border-accent text-accent font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-accent/5 transition-colors">
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
              <button onClick={handleBuyNow} className="flex-1 py-3 bg-accent hover:opacity-90 text-accent-foreground font-medium rounded-lg transition-colors">
                Buy Now
              </button>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="font-bold text-foreground mb-2">Description</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            {/* Highlights */}
            {highlights.length > 0 && (
              <div className="mb-6">
                <h2 className="font-bold text-foreground mb-3">Highlights</h2>
                <ul className="space-y-2">
                  {highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Specifications */}
            {specSections.length > 0 && (
              <div className="mb-6">
                <h2 className="font-bold text-foreground mb-3">Specifications</h2>

                {specSections.length === 1 && !specSections[0].title ? (
                  <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <tbody>
                        {(showAllSpecs ? specSections[0].rows : specSections[0].rows.slice(0, INITIAL_ROWS)).map((row, i) => (
                          <tr key={i} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                            <td className="px-4 py-2.5 text-muted-foreground w-2/5 align-top font-medium">{row.label}</td>
                            <td className="px-4 py-2.5 text-foreground break-words">{row.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {specSections[0].rows.length > INITIAL_ROWS && (
                      <button onClick={() => setShowAllSpecs(!showAllSpecs)} className="w-full py-3 text-sm text-accent font-medium flex items-center justify-center gap-1 border-t border-border hover:bg-muted/50">
                        {showAllSpecs ? "Show Less" : `Show All (${specSections[0].rows.length})`}
                        {showAllSpecs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {specSections.map((section, si) => {
                      const isOpen = openSections[section.title] !== false;
                      return (
                        <div key={si} className="bg-card rounded-lg border border-border overflow-hidden">
                          <button onClick={() => toggleSection(section.title)} className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/70 transition-colors">
                            <span className="font-semibold text-sm text-foreground">{section.title}</span>
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span>{section.rows.length} specs</span>
                              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </span>
                          </button>
                          {isOpen && (
                            <table className="w-full text-sm">
                              <tbody>
                                {section.rows.map((row, i) => (
                                  <tr key={i} className={i % 2 === 0 ? "bg-muted/20" : ""}>
                                    <td className="px-4 py-2.5 text-muted-foreground w-11/20 align-top font-medium leading-snug">{row.label}</td>
                                    <td className="px-4 py-2.5 text-foreground break-words leading-snug">{row.value}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Reviews */}
            <div className="mb-6">
              <div className="bg-card rounded-lg border border-border p-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground">{rating}</div>
                    <div className="flex justify-center my-1">{renderStars(rating)}</div>
                    <div className="text-xs hidden text-muted-foreground">{reviewsCount.toLocaleString()} ratings</div>
                  </div>
                  <div className="flex-1 space-y-1">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-3">{star}</span>
                        <Star className="w-3 h-3 text-accent fill-accent" />
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-accent" style={{ width: `${getRatingPct(star)}%` }} />
                        </div>
                        <span className="w-8 text-muted-foreground">{getRatingPct(star)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {reviews.length > 0 && (
                <>
                  <div className="space-y-4">
                    {(showAllReviews ? reviews : reviews.slice(0, 2)).map((review) => (
                      <div key={review.id} className="bg-card rounded-lg border border-border p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center bg-accent/10 px-1.5 py-0.5 rounded text-xs">
                            <span className="font-medium text-accent">{review.rating}</span>
                            <Star className="w-3 h-3 text-accent fill-accent ml-0.5" />
                          </div>
                          <span className="font-medium text-sm text-foreground">{review.title || "Great Product"}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{review.comment || "No comment provided"}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{review.user?.name || "Anonymous"}</span>
                            <span>•</span>
                            <span>{new Date(review.created_at).toLocaleDateString()}</span>
                            {review.verified && (<><span>•</span><span className="text-accent">Verified Purchase</span></>)}
                          </div>
                          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                            <ThumbsUp className="w-3 h-3" />
                            <span>Helpful ({review.helpful || 0})</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {reviews.length > 2 && (
                    <button onClick={() => setShowAllReviews(!showAllReviews)} className="w-full py-3 mt-3 text-sm text-accent font-medium border border-border rounded-lg hover:bg-muted/50">
                      {showAllReviews ? "Show Less" : "See All Reviews"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Related */}
        {relatedLoading ? (
          <div className="mt-12 text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading related products...</p>
          </div>
        ) : relatedProducts.length > 0 ? (
          <div className="md:mt-12">
            <h2 className="section-title mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} variant="compact" />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <FloatingContactButtons />
      <Footer />
    </div>
  );
}