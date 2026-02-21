"use client";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { categoryApi } from "@/services/api";
import { toast } from "sonner";
import { getImageUrl } from "@/lib/utils";

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
  if (typeof value === 'object') return Object.values(value);
  return [];
};

const ensureObject = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
  } catch {
    return {};
  }
};

// ─── Bento grid layouts ───────────────────────────────────────────────────────
// Each layout is an array of Tailwind grid-placement classes (one per card).
// All layouts use a 6-column base so cards can be mixed freely.
const BENTO_LAYOUTS = [
  // Layout A — "Hero left"
  {
    cols: 6,
    rows: 4,
    cards: [
      { span: "col-span-2 row-span-2", label: "large" },
      { span: "col-span-2 row-span-1", label: "medium" },
      { span: "col-span-2 row-span-1", label: "medium" },
      { span: "col-span-1 row-span-2", label: "small" },
      { span: "col-span-1 row-span-2", label: "small" },
      { span: "col-span-2 row-span-2", label: "large" },
      { span: "col-span-2 row-span-2", label: "large" },
      { span: "col-span-2 row-span-2", label: "large" },
    ],
  },
  // Layout B — "Hero right"
  {
    cols: 6,
    rows: 4,
    cards: [
      { span: "col-span-1 row-span-2", label: "small" },
      { span: "col-span-1 row-span-2", label: "small" },
      { span: "col-span-2 row-span-1", label: "medium" },
      { span: "col-span-2 row-span-2", label: "large" },
      { span: "col-span-2 row-span-1", label: "medium" },
      { span: "col-span-2 row-span-2", label: "large" },
      { span: "col-span-2 row-span-2", label: "large" },
      { span: "col-span-2 row-span-2", label: "large" },
    ],
  },
  // Layout C — "Triple tall"
  {
    cols: 6,
    rows: 4,
    cards: [
      { span: "col-span-2 row-span-4", label: "xlarge" },
      { span: "col-span-2 row-span-2", label: "large" },
      { span: "col-span-2 row-span-2", label: "large" },
      { span: "col-span-1 row-span-2", label: "small" },
      { span: "col-span-1 row-span-2", label: "small" },
      { span: "col-span-2 row-span-2", label: "large" },
      { span: "col-span-2 row-span-2", label: "large" },
      { span: "col-span-2 row-span-2", label: "large" },
    ],
  },
  // Layout D — "Mosaic"
  {
    cols: 6,
    rows: 5,
    cards: [
      { span: "col-span-3 row-span-2", label: "large" },
      { span: "col-span-3 row-span-3", label: "xlarge" },
      { span: "col-span-2 row-span-3", label: "large" },
      { span: "col-span-1 row-span-1", label: "tiny" },
      { span: "col-span-1 row-span-2", label: "small" },
      { span: "col-span-2 row-span-2", label: "medium" },
      { span: "col-span-3 row-span-2", label: "large" },
      { span: "col-span-1 row-span-2", label: "small" },
    ],
  },
  // Layout E — "Balanced bento"
  {
    cols: 6,
    rows: 4,
    cards: [
      { span: "col-span-2 row-span-2", label: "large" },
      { span: "col-span-2 row-span-2", label: "large" },
      { span: "col-span-2 row-span-2", label: "large" },
      { span: "col-span-3 row-span-2", label: "large" },
      { span: "col-span-1 row-span-1", label: "tiny" },
      { span: "col-span-1 row-span-1", label: "tiny" },
      { span: "col-span-1 row-span-2", label: "small" },
      { span: "col-span-2 row-span-2", label: "large" },
    ],
  },
];

// Card size → padding / image size inside bento cell
const cardStyle = {
  xlarge: { padding: "p-8",  img: "w-28 h-28" },
  large:  { padding: "p-6",  img: "w-20 h-20" },
  medium: { padding: "p-4",  img: "w-16 h-16" },
  small:  { padding: "p-3",  img: "w-12 h-12" },
  tiny:   { padding: "p-2",  img: "w-8  h-8"  },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SubcategorySkeleton = () => (
  <section className="container mx-auto px-3 py-2">
    <div className="md:hidden">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2 px-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex flex-col items-center shrink-0">
            <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse" />
            <div className="mt-2 w-16 h-3 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
    <div className="hidden md:block py-6">
      <div className="grid grid-cols-6 gap-3 h-80">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  </section>
);

// ─── Bento Card ───────────────────────────────────────────────────────────────
const BentoCard = ({ subcategory, label = "medium" }) => {
  const s = cardStyle[label] ?? cardStyle.medium;
  const isLarge = label === "xlarge" || label === "large";

  return (
    <Link
      to={subcategory.href}
      className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
      style={{
        background: "linear-gradient(145deg, #ffffff 0%, hsl(45,100%,96%) 100%)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
      }}
    >
      {/* Accent corner tab */}
      <div
        className="absolute top-0 right-0 w-8 h-8 rounded-bl-2xl rounded-tr-xl opacity-50"
        style={{
          background: "linear-gradient(135deg, hsl(45,100%,62%), hsl(45,90%,50%))",
        }}
      />

      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-2xl pointer-events-none"
        style={{ background: "hsl(45,95%,70%)" }}
      />

      {/* Content */}
      <div className={`relative z-10 flex flex-col items-center justify-center gap-2 ${s.padding} w-full h-full`}>
        <img
          src={subcategory.image}
          alt={subcategory.name}
          className={`${s.img} object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-sm`}
          loading="lazy"
          onError={(e) => {
            e.target.src = "/placeholder-image.png";
            e.target.onerror = null;
          }}
        />
        <p
          className={`font-semibold text-gray-800 group-hover:text-accent transition-colors text-center leading-tight ${
            isLarge ? "text-sm" : "text-xs"
          }`}
        >
          {subcategory.name}
        </p>
        {/* Animated underline */}
        <div
          className="h-0.5 w-0 group-hover:w-8 transition-all duration-300 rounded-full"
          style={{ background: "hsl(45,95%,50%)" }}
        />
      </div>
    </Link>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
export function SubcategorySlider() {
  const [subcategories, setSubcategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pick a random layout once per mount (i.e., each page refresh)
  const [layout] = useState(
    () => BENTO_LAYOUTS[Math.floor(Math.random() * BENTO_LAYOUTS.length)]
  );

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const res = await categoryApi.getCategories();
        const data = res?.data || [];

        const processedSubcategories = ensureArray(data).flatMap((cat) => {
          const subcategoriesArray = ensureArray(cat.subcategories)
            .map((item) => String(item).trim())
            .filter((item) => item.length > 0);

          const subcategoryImages = ensureObject(cat.subcategoryImages);

          return subcategoriesArray
            .map((sub, index) => {
              const imagePath = subcategoryImages[sub];
              if (!imagePath) return null;
              return {
                id: `${cat.id || cat._id}-sub-${index}`,
                name: sub,
                categorySlug:
                  cat.slug ||
                  cat.name?.toLowerCase()?.replace(/\s+/g, "-") ||
                  "category",
                href: `/products?category=${
                  cat.slug || cat.name?.toLowerCase()?.replace(/\s+/g, "-")
                }&subcategory=${encodeURIComponent(sub)}`,
                image: getImageUrl(imagePath),
              };
            })
            .filter(Boolean);
        });

        if (!cancelled) {
          setSubcategories(processedSubcategories);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to load subcategories", err);
        toast.error("Failed to load categories");
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) return <SubcategorySkeleton />;
  if (subcategories.length === 0) return null;

  // Pair each layout slot with a subcategory (cycle if fewer subcategories than slots)
  const gridItems = layout.cards.map((card, i) => ({
    ...card,
    subcategory: subcategories[i % subcategories.length],
  }));

  return (
    <section className="container mx-auto px-3 py-2">

      {/* ── Mobile: horizontal scroll ── */}
      <div className="md:hidden">
        <div
          className="flex gap-2 overflow-x-auto scrollbar-hide py-2 px-2 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {subcategories.map((subcategory) => (
            <Link
              key={subcategory.id}
              to={subcategory.href}
              className="group flex flex-col items-center shrink-0 hover:scale-105 transition-transform duration-300"
            >
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div
                  className="absolute w-14 h-14"
                  style={{
                    background:
                      "linear-gradient(160deg, hsl(45,100%,62%) 0%, hsl(45,92%,48%) 100%)",
                    borderRadius: "55% 45% 40% 60% / 65% 35% 65% 35%",
                    boxShadow:
                      "0 4px 8px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08), inset 0 1px 2px rgba(255,255,255,0.35)",
                  }}
                />
                <img
                  src={subcategory.image}
                  alt={subcategory.name}
                  className="relative z-10 w-11 h-11 object-contain group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = "/placeholder-image.png";
                    e.target.onerror = null;
                  }}
                />
              </div>
              <div className="mt-2 text-center w-20">
                <p className="text-xs font-medium text-gray-700 group-hover:text-accent transition-colors truncate">
                  {subcategory.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
{/* Desktop & Tablet: Fixed Bento Grid, Random Subcategories */}
<div className="hidden md:block py-6 md:py-10">
  {(() => {
    // Shuffle subcategories on each render/refresh
    const shuffled = [...subcategories].sort(() => Math.random() - 0.5);

    // Fixed 5-slot layout
    const slots = [
      { cls: "col-span-2 row-span-3",                  size: "large"  },
      { cls: "col-span-2 row-span-2 col-start-3",      size: "medium" },
      { cls: "col-span-2 row-span-2 col-start-1 row-start-4", size: "medium" },
      { cls: "col-span-2 row-span-3 col-start-3 row-start-3", size: "large"  },
      { cls: "row-span-5 col-start-5 row-start-1",     size: "small"  },
    ];

    const imgSize = { large: "w-24 h-24", medium: "w-16 h-16", small: "w-10 h-10" };
    const textSize = { large: "text-sm",  medium: "text-xs",   small: "text-xs"  };
    const padding  = { large: "p-6",      medium: "p-4",       small: "p-3"      };

    return (
      <div className="grid grid-cols-5 grid-rows-5 gap-3" style={{ height: "480px" }}>
        {slots.map((slot, i) => {
          const sub = shuffled[i % shuffled.length];
          if (!sub) return null;
          return (
            <Link
              key={`${sub.id}-${i}`}
              to={sub.href}
              className={`${slot.cls} group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl`}
              style={{
                background: "linear-gradient(145deg, #ffffff 0%, hsl(45,100%,96%) 100%)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
              }}
            >
              {/* Accent corner */}
              <div
                className="absolute top-0 right-0 w-8 h-8 rounded-bl-2xl rounded-tr-xl opacity-50"
                style={{ background: "linear-gradient(135deg, hsl(45,100%,62%), hsl(45,90%,50%))" }}
              />

              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"
                style={{ background: "hsl(45,95%,60%)" }}
              />

              {/* Content */}
              <div className={`relative z-10 flex flex-col items-center justify-center gap-2 ${padding[slot.size]} w-full h-full`}>
                <img
                  src={sub.image}
                  alt={sub.name}
                  className={`${imgSize[slot.size]} object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-sm`}
                  loading="lazy"
                  onError={(e) => { e.target.src = "/placeholder-image.png"; e.target.onerror = null; }}
                />
                <p className={`${textSize[slot.size]} font-semibold text-gray-800 group-hover:text-accent transition-colors text-center leading-tight`}>
                  {sub.name}
                </p>
                <div
                  className="h-0.5 w-0 group-hover:w-8 transition-all duration-300 rounded-full"
                  style={{ background: "hsl(45,95%,50%)" }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    );
  })()}
</div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
}