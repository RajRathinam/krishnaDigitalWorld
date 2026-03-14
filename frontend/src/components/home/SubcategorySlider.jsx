"use client";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { categoryApi } from "@/services/api";
import { toast } from "sonner";
import { getImageUrl } from "@/lib/utils";

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const ensureArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  if (typeof value === "string") {
    try { const p = JSON.parse(value); return Array.isArray(p) ? p : [value]; }
    catch { return [value]; }
  }
  if (typeof value === "object") return Object.values(value);
  return [];
};

const ensureObject = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (!value) return {};
  try {
    const p = JSON.parse(value);
    return p && typeof p === "object" && !Array.isArray(p) ? p : {};
  } catch { return {}; }
};

/* ─── Skeleton ─────────────────────────────────────────────────────────────── */
const SubcategorySkeleton = () => (
  <section className="container mx-auto px-3 py-2">
    <div className="md:hidden">
      <div className="flex gap-7 overflow-x-auto py-2 px-2 scrollbar-hide">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex flex-col items-center shrink-0">
            <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse" />
            <div className="mt-2 w-16 h-3 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
    <div className="hidden md:block py-8">
      <div className="flex gap-3" style={{ height: 480 }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-1 rounded-3xl bg-stone-100 animate-pulse"
            style={{ height: i % 2 === 0 ? "100%" : "80%", alignSelf: "flex-end" }} />
        ))}
      </div>
    </div>
  </section>
);
/* ─── Uniform heights for consistent card size ────────────────────────────── */
const HEIGHTS = ["100%", "100%", "100%", "100%", "100%"];

/* ─── Ink accent colors per card (warm, editorial palette) ────────────────── */
const INK = ["#C1440E", "#1B6CA8", "#2D7D46", "#8B1A6B", "#B87A00"];

/* ─── Main component ───────────────────────────────────────────────────────── */
export function SubcategorySlider() {
  const [subcategories, setSubcategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const res = await categoryApi.getCategories();
        const data = res?.data || [];

        const processed = ensureArray(data).flatMap((cat) => {
          const subsArr = ensureArray(cat.subcategories)
            .map((item) => String(item).trim())
            .filter((item) => item.length > 0);
          const images = ensureObject(cat.subcategoryImages);

          return subsArr.map((sub, idx) => {
            const imagePath = images[sub];
            if (!imagePath) return null;
            return {
              id: `${cat.id || cat._id}-sub-${idx}`,
              name: sub,
              href: `/products?category=${cat.slug || cat.name?.toLowerCase()?.replace(/\s+/g, "-")
                }&subcategory=${encodeURIComponent(sub)}`,
              image: getImageUrl(imagePath),
            };
          }).filter(Boolean);
        });

        if (!cancelled) { setSubcategories(processed); setIsLoading(false); }
      } catch (err) {
        console.error("Failed to load subcategories", err);
        toast.error("Failed to load categories");
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  if (isLoading) return <SubcategorySkeleton />;
  if (subcategories.length === 0) return null;

  const display = [...subcategories].sort(() => Math.random() - 0.5).slice(0, 5);

  return (
    <section className="container mx-auto px-3 py-2">

      {/* ── Mobile: unchanged horizontal scroll pill ── */}
      <div className="md:hidden">
        <div className="flex gap-2 overflow-x-auto py-2 px-2 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {subcategories.map((sub) => (
            <Link key={sub.id} to={sub.href}
              className="group flex flex-col items-center shrink-0 hover:scale-105 transition-transform duration-300">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute w-14 h-14" style={{
                  background: "linear-gradient(160deg, hsl(45,100%,62%) 0%, hsl(45,92%,48%) 100%)",
                  borderRadius: "55% 45% 40% 60% / 65% 35% 65% 35%",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
                }} />
                <img src={sub.image} alt={sub.name}
                  className="relative z-10 w-11 h-11 object-contain group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => { e.target.src = "/placeholder-image.png"; e.target.onerror = null; }} />
              </div>
              <div className="mt-2 text-center w-20">
                <p className="text-xs font-medium text-gray-700 group-hover:text-accent transition-colors truncate">
                  {sub.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Desktop: alternating-height portrait cards ── */}
      <div className="hidden md:block">
        <style>{`
          /* Section wrapper */
          .sc3-section {
            padding: 2.5rem 0 3rem;
          }

          /* Dot-grid paper texture on section bg using pseudo */
          .sc3-bg {
            position: relative;
            border-radius: 2rem;
            overflow: hidden;
            padding: 2.5rem 2rem;
            background-color: #f9f6f1;
            background-image:
              radial-gradient(circle, #c8b99a 1px, transparent 1px);
            background-size: 22px 22px;
          }
          .sc3-bg::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg,
              rgba(249,246,241,0.6) 0%,
              rgba(249,246,241,0.15) 40%,
              rgba(249,246,241,0.15) 60%,
              rgba(249,246,241,0.6) 100%
            );
            pointer-events: none;
            z-index: 0;
          }

          /* Header above cards */
          .sc3-header {
            position: relative;
            z-index: 1;
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            margin-bottom: 2rem;
          }
          .sc3-label {
            font-size: 0.62rem;
            font-weight: 800;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: #a0856a;
            margin-bottom: 0.3rem;
          }
          .sc3-title {
            font-size: 2.2rem;
            font-weight: 900;
            letter-spacing: -0.045em;
            color: #1a1310;
            line-height: 1;
          }
          .sc3-title em {
            font-style: italic;
            font-weight: 300;
            color: #7a6550;
          }
          .sc3-cta {
            font-size: 0.72rem;
            font-weight: 800;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #1a1310;
            text-decoration: none;
            border-bottom: 2px solid #1a1310;
            padding-bottom: 2px;
            transition: opacity 0.2s;
          }
          .sc3-cta:hover { opacity: 0.5; }

          /* Cards row */
          .sc3-row {
            position: relative;
            z-index: 1;
            display: flex;
            align-items: flex-end;
            gap: 0.9rem;
          }

          /* Individual card */
          .sc3-card {
            flex: 1;
            border-radius: 1.25rem;
            overflow: hidden;
            position: relative;
            cursor: pointer;
            text-decoration: none;
            background: #fff;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05);
            transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1),
                        box-shadow 0.35s ease;
            display: flex;
            flex-direction: column;
          }
          .sc3-card:hover {
            transform: translateY(-10px) scale(1.02);
            box-shadow: 0 20px 50px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08);
          }

          /* Image zone */
          .sc3-img-zone {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem 1rem;
            background: #fdfbf8;
            overflow: hidden;
            min-height: 120px;
          }
          .sc3-img-zone img {
            width: 100%;
            max-height: 140px;
            object-fit: contain;
            filter: drop-shadow(0 6px 18px rgba(0,0,0,0.13));
            transition: transform 0.45s cubic-bezier(0.34,1.56,0.64,1);
          }
          .sc3-card:hover .sc3-img-zone img {
            transform: scale(1.14) translateY(-5px);
          }

          /* Ink accent bar */
          .sc3-ink {
            height: 3px;
            width: 100%;
            flex-shrink: 0;
          }

          /* Name footer */
          .sc3-footer {
            padding: 0.7rem 0.9rem 0.75rem;
            background: #fff;
            flex-shrink: 0;
          }
          .sc3-name {
            font-size: 0.8rem;
            font-weight: 800;
            letter-spacing: -0.01em;
            color: #1a1310;
            line-height: 1.2;
            margin: 0;
          }
          .sc3-index {
            font-size: 0.55rem;
            font-weight: 700;
            letter-spacing: 0.12em;
            color: #bbb;
            text-transform: uppercase;
            margin-bottom: 0.2rem;
          }

          /* card entrance animation */
          @keyframes sc3Up {
            from { opacity: 0; transform: translateY(28px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .sc3-card { animation: sc3Up 0.5s both; }
          .sc3-card:nth-child(1) { animation-delay: 0.05s; }
          .sc3-card:nth-child(2) { animation-delay: 0.12s; }
          .sc3-card:nth-child(3) { animation-delay: 0.19s; }
          .sc3-card:nth-child(4) { animation-delay: 0.26s; }
          .sc3-card:nth-child(5) { animation-delay: 0.33s; }
        `}</style>

        <div className="sc3-section">
          <div className="sc3-bg">
            {/* Header */}
            <div className="sc3-header">
              <div>
                <p className="sc3-label">Explore our range</p>
                <h2 className="sc3-title">Shop by <em>Products</em></h2>
              </div>
              <Link to="/products" className="sc3-cta">Browse all →</Link>
            </div>

            {/* Portrait card row */}
            <div className="sc3-row" style={{ height: 340 }}>
              {display.map((sub, i) => (
                <Link
                  key={sub.id}
                  to={sub.href}
                  className="sc3-card"
                  style={{ height: HEIGHTS[i] }}
                >
                  {/* Image */}
                  <div className="sc3-img-zone">
                    <img
                      src={sub.image}
                      alt={sub.name}
                      loading="lazy"
                      onError={(e) => { e.target.src = "/placeholder-image.png"; e.target.onerror = null; }}
                    />
                  </div>

                  {/* Ink bar */}
                  <div className="sc3-ink" style={{ background: INK[i % INK.length] }} />

                  {/* Footer */}
                  <div className="sc3-footer">
                    <p className="sc3-index">0{i + 1}</p>
                    <p className="sc3-name">{sub.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
}