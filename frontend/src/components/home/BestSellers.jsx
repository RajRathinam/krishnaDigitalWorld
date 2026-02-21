/**
 * BestSellers — Redesigned
 * Premium editorial layout with rank badges, hover reveal, and animated header
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, ArrowRight, Flame } from "lucide-react";
import { productApi } from "@/services/api";
import { getImageUrl } from "@/lib/utils";
import { SplitHeading } from "@/components/ui/split-heading";

// ─── Data helpers ─────────────────────────────────────────────────────────────
const parseProductData = (productData) => {
  if (!productData) return productData;
  const parsed = { ...productData };
  if (typeof parsed.colorsAndImages === "string") {
    try { parsed.colorsAndImages = JSON.parse(parsed.colorsAndImages.replace(/\\"/g, '"').replace(/\\\\/g, "\\")); }
    catch { parsed.colorsAndImages = {}; }
  }
  if (typeof parsed.images === "string") {
    try { parsed.images = JSON.parse(parsed.images.replace(/\\"/g, '"').replace(/\\\\/g, "\\")); }
    catch { parsed.images = []; }
  }
  return parsed;
};

const getProductImage = (p) => {
  let url = "/placeholder.svg";
  if (p.colorsAndImages && typeof p.colorsAndImages === "object") {
    const keys = Object.keys(p.colorsAndImages);
    if (keys.length) {
      const imgs = p.colorsAndImages[keys[0]];
      if (Array.isArray(imgs) && imgs[0]) url = typeof imgs[0] === "string" ? imgs[0] : imgs[0].url || url;
    }
  }
  if (url === "/placeholder.svg" && Array.isArray(p.images) && p.images[0]) {
    const i = p.images[0]; url = typeof i === "string" ? i : i.url || url;
  }
  if (url === "/placeholder.svg" && p.featuredImage) url = p.featuredImage;
  if (url === "/placeholder.svg" && p.image) url = typeof p.image === "string" ? p.image : p.image.url || url;
  return getImageUrl(url);
};

const fetchBestSellers = async () => {
  try {
    const response = await productApi.getBestSellers(8);
    let data = response.success && response.data ? response.data
      : response.products ?? (Array.isArray(response) ? response : response.data ?? []);
    return data.map((product, index) => {
      const p = parseProductData(product);
      const id = p.id || p._id || p.productId || `product-${index}`;
      const title = p.name || p.title || p.productName || "Product";
      const slug = p.slug || id || title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return { id, href: `/product/${slug}`, image: getProductImage(p), title, rating: p.rating || p.averageRating || null };
    }).filter((p) => p.id);
  } catch {
    return [];
  }
};

// ─── Rank badge colors ─────────────────────────────────────────────────────────
const rankMeta = [
  { bg: "from-yellow-400 to-amber-500", label: "#1" },
  { bg: "from-gray-300 to-gray-400",    label: "#2" },
  { bg: "from-amber-600 to-amber-700",  label: "#3" },
];

// ─── Single product card ───────────────────────────────────────────────────────
const BestSellerCard = ({ item, rank }) => {
  const meta = rankMeta[rank] ?? { bg: "from-gray-100 to-gray-200", label: `#${rank + 1}` };

  return (
    <Link
      to={item.href}
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-white border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-yellow-200"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
    >
      {/* Rank badge */}
      <div className={`absolute top-3 left-3 z-20 w-8 h-8 rounded-xl bg-gradient-to-br ${meta.bg} flex items-center justify-center shadow-md`}>
        <span className="text-white text-xs font-black">{meta.label}</span>
      </div>

      {/* Rating badge */}
      {item.rating && (
        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-amber-400">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="text-amber-700 text-[10px] font-bold">{Number(item.rating).toFixed(1)}</span>
        </div>
      )}

      {/* Image area */}
      <div className="relative aspect-square overflow-hidden bg-white">
        <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 60%)" }} />
        <img
          src={item.image}
          alt={item.title || "Best seller"}
          loading="lazy"
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.onerror = null; e.target.src = "/placeholder.svg"; }}
        />
      </div>

      {/* Accent bottom line */}
      <div
        className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500 rounded-full"
        style={{ background: "hsl(45,95%,50%)" }}
      />
    </Link>
  );
};

// ─── Skeleton — 3 cards only ──────────────────────────────────────────────────
const BestSellerSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="rounded-2xl overflow-hidden bg-white border border-gray-100">
        <div className="aspect-square bg-gray-100 animate-pulse" />
      </div>
    ))}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
export function BestSellers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBestSellers().then(setItems).finally(() => setLoading(false));
  }, []);

  // Only top 3
  const top3 = items.slice(0, 3);

  return (
    <section className="py-6 md:py-16 relative overflow-hidden">
      <div className="container relative z-10 px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="flex items-end justify-between mb-6 md:mb-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, hsl(45,100%,55%), hsl(35,100%,50%))" }}>
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <SplitHeading
                  text="Best Sellers"
                  className="text-3xl md:text-4xl font-bold tracking-tight"
                />
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: "hsl(45,100%,92%)", color: "hsl(35,100%,35%)" }}>
                  <Flame className="w-3 h-3" /> This Week
                </span>
              </div>
              <p className="text-sm text-gray-400 font-medium">Our most loved products right now</p>
            </div>
          </div>

          <Link
            to="/best-sellers"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-accent transition-colors group"
          >
            View all
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <BestSellerSkeleton />
        ) : top3.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium">No best sellers available yet</p>
            <p className="text-gray-300 text-sm mt-1">Check back soon for our top rated items</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
              {top3.map((item, i) => (
                <div key={item.id} className={i === 0 ? "col-span-2" : "col-span-1"}>
                  <BestSellerCard item={item} rank={i} />
                </div>
              ))}
            </div>

            {/* Mobile view all */}
            <div className="mt-6 flex justify-center sm:hidden">
              <Link
                to="/best-sellers"
                className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent/80 transition-colors"
              >
                View all best sellers <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}