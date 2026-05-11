// CategoryGrid.jsx (Final - Staircase desktop layout, 2x2 mobile amber theme)
import { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { categoryApi } from '@/services/api';
import { Skeleton } from "@/components/ui/skeleton";
import { SplitHeading } from "@/components/ui/split-heading";
import { AlertCircle, ChevronsUp } from "lucide-react";
import { getImageUrl } from '@/lib/utils';

const MAX_CATEGORIES = 4;

const FALLBACK_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
];

// Staircase: card 1 lowest → card 4 highest
const STEP_OFFSETS = [0,24,56,96];

const CARD_CAPTIONS = [
  'Shop the finest selection',
  'Explore top picks',
  'Discover new arrivals',
  'Browse bestsellers',
];

// ── Replace with your own background image URL ──
const BG_IMAGE_URL = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600&auto=format&fit=crop';

export function CategoryGrid() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let canceled = false;
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await categoryApi.getCategories();
        const data = res?.data || [];
        if (!canceled && Array.isArray(data)) {
          const active = data.filter(cat => cat.isActive === true);
          const processed = active.slice(0, MAX_CATEGORIES).map(cat => ({
            ...cat,
            slug: cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-'),
            imageUrl: cat.image ? getImageUrl(cat.image) : null,
          }));
          setCategories(processed);
        } else if (!canceled) {
          setError('Invalid category data received');
        }
      } catch (err) {
        console.error('Failed to fetch categories for grid', err);
        if (!canceled) setError('Failed to load categories. Please try again later.');
      } finally {
        if (!canceled) setLoading(false);
      }
    };
    fetchCategories();
    return () => { canceled = true; };
  }, []);

  const getFallbackGradient = (idx) => FALLBACK_GRADIENTS[idx % FALLBACK_GRADIENTS.length];

  /* ─────────────────────────────────────
     Shared Header
  ───────────────────────────────────── */
  const SharedHeader = ({ mobile = false }) => (
    <div className={mobile ? 'mb-5 relative z-10' : 'mb-10 max-w-lg relative z-10'}>
      <p className={`font-semibold tracking-widest text-amber-600 uppercase mb-1.5 ${mobile ? 'text-[10px]' : 'text-xs'}`}>
        Shop by Collection
      </p>
      <SplitHeading
        text="Browse by Category"
        className={`font-bold tracking-tight text-gray-900 leading-tight ${mobile ? 'text-2xl' : 'text-4xl'}`}
      />
      <p className={`text-gray-500 ${mobile ? 'text-xs mt-1.5' : 'text-base mt-2'}`}>
        Discover our curated range — quality you can trust, style you'll love.
      </p>
    </div>
  );

  /* ─────────────────────────────────────
     Category Card
  ───────────────────────────────────── */
  const CategoryCard = ({ cat, idx, mobile = false }) => (
    <Link
      to={`/category/${cat.slug}`}
      aria-label={`Browse ${cat.name} category`}
      className="block"
    >
      <div
        className={`relative overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-300 ${mobile ? 'rounded-xl' : 'rounded-2xl'}`}
        style={{
          aspectRatio: mobile ? '1/1' : '3/4',
          outline: `${mobile ? '2px' : '2.5px'} solid #F59E0B`,
          outlineOffset: mobile ? '2px' : '3px',
        }}
      >
        {/* Category image */}
        {cat.imageUrl ? (
          <img
            src={cat.imageUrl}
            alt={cat.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.style.background = getFallbackGradient(idx);
            }}
          />
        ) : (
          <div className="absolute inset-0" style={{ background: getFallbackGradient(idx) }} />
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 transition-colors duration-300"
          style={{
            background: mobile
              ? 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)'
              : 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)',
          }}
        />

      

        {/* Mobile only: name inside card */}
        {mobile && (
          <>
            <div className="absolute bottom-0 left-0 right-0 z-10 p-3">
              <h3 className="text-white text-sm font-semibold tracking-wide text-center drop-shadow-lg">
                {cat.name}
              </h3>
            </div>
            <div className="absolute bottom-10 left-0 right-0 z-10 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ChevronsUp size={20} className="text-amber-300 animate-bounce" />
            </div>
          </>
        )}
      </div>

      {/* Desktop only: name + caption below card */}
      {!mobile && (
        <div className="mt-3 pl-0.5">
          <h3 className="text-gray-900 font-bold text-base leading-snug group-hover:text-amber-700 transition-colors duration-200">
            {cat.name}
          </h3>
          <p className="text-gray-400 text-xs mt-0.5">{CARD_CAPTIONS[idx]}</p>
          <div className="mt-2 inline-flex items-center gap-1 text-amber-600 text-xs font-bold border-b border-amber-300 pb-0.5 group-hover:border-amber-600 transition-colors duration-200">
            <span>Explore</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </div>
        </div>
      )}
    </Link>
  );

  /* ─────────────────────────────────────
     Loading Skeletons
  ───────────────────────────────────── */
  const LoadingSkeletons = ({ count, mobile = false }) => (
    mobile ? (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="aspect-square">
            <Skeleton className="w-full h-full rounded-xl" />
          </div>
        ))}
      </div>
    ) : (
      <div className="flex gap-5 xl:gap-7 items-start" style={{ width: '80%', paddingBottom: '3rem' }}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex-1"
            style={{ transform: `translateY(${STEP_OFFSETS[i]}px)` }}
          >
            <Skeleton className="w-full rounded-2xl aspect-[3/4]" />
            <Skeleton className="mt-3 h-4 w-3/4 rounded" />
            <Skeleton className="mt-2 h-3 w-1/2 rounded" />
          </div>
        ))}
      </div>
    )
  );

  /* ─────────────────────────────────────
     Error / Empty States
  ───────────────────────────────────── */
  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
      <p className="text-gray-500 text-center text-sm">Failed to load categories. Please try again later.</p>
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <p className="text-gray-500 text-center text-sm">No categories available at the moment.</p>
    </div>
  );

  /* ─────────────────────────────────────
     Render
  ───────────────────────────────────── */
  return (
    <section className="py-4 lg:py-16 bg-background overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* ══════════════════════════════════════════
            MOBILE (< lg) — amber theme, 2×2 grid
        ══════════════════════════════════════════ */}
        <div className="block lg:hidden">
          <div className="relative rounded-2xl bg-[#FDF8F0] border border-amber-100 overflow-hidden p-4 sm:p-6">

            {/* Decorative blobs */}
            <div
              className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-25 pointer-events-none"
              style={{ background: 'radial-gradient(circle, #FCD34D, #FDE68A)' }}
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full opacity-20 pointer-events-none"
              style={{ background: 'radial-gradient(circle, #F59E0B, #FCD34D)' }}
              aria-hidden="true"
            />

            <SharedHeader mobile />

            {loading ? (
              <LoadingSkeletons count={MAX_CATEGORIES} mobile />
            ) : error ? (
              <ErrorState />
            ) : categories.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {categories.map((cat, idx) => (
                  <div key={cat.id} className="group">
                    <CategoryCard cat={cat} idx={idx} mobile />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            DESKTOP (≥ lg) — staircase + full bg image
        ══════════════════════════════════════════ */}
        <div className="hidden lg:block">
          <div
            className="relative rounded-2xl overflow-hidden border border-amber-200"
            style={{ minHeight: '640px' }}
          >
            {/* Layer 1 — background image */}
            <img
              src={BG_IMAGE_URL}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-center"
              style={{ zIndex: 0 }}
            />

            {/* Layer 2 — left cream wash fading to transparent on the right */}
            <div
              className="absolute inset-0"
              style={{
                zIndex: 1,
                background:
                  'linear-gradient(to right, #FDF8F0 0%, #FDF8F0 38%, rgba(253,248,240,0.92) 52%, rgba(253,248,240,0.60) 65%, rgba(253,248,240,0.15) 80%, transparent 100%)',
              }}
            />

            {/* Layer 3 — subtle amber tint */}
            <div
              className="absolute inset-0"
              style={{ zIndex: 2, background: 'rgba(251,191,36,0.04)' }}
            />

            {/* Layer 4 — all content */}
            <div className="relative p-10 xl:p-14" style={{ zIndex: 3 }}>
              <SharedHeader />

              {loading ? (
                <LoadingSkeletons count={MAX_CATEGORIES} />
              ) : error ? (
                <ErrorState />
              ) : categories.length === 0 ? (
                <EmptyState />
              ) : (
                /* ── Staircase wrapper ── */
                <div className="relative" style={{ width: '80%', paddingBottom: '3rem' }}>

                  {/* Dashed baseline connecting all step feet */}
                  <div
                    className="absolute left-0 right-0 border-b border-dashed border-amber-300/50"
                    style={{ bottom: '3rem' }}
                    aria-hidden="true"
                  />

                  <div className="flex gap-5 xl:gap-7 items-start">
                    {categories.map((cat, idx) => (
                      <div
                        key={cat.id}
                        className="flex-1 flex flex-col group"
                        style={{
                          transform: `translateY(${STEP_OFFSETS[idx]}px)`,
                          transition: 'transform 0.3s ease',
                        }}
                      >
                        {/* Step number badge + horizontal connector */}
                        <div className="flex items-center gap-2 mb-2 pl-0.5">
                          <div className="flex-1 h-px bg-amber-200" />
                        </div>

                        <CategoryCard cat={cat} idx={idx} />

                        {/* Step foot accent */}
                        <div className="mt-3 h-0.5 rounded-full bg-gradient-to-r from-amber-400 to-transparent opacity-70" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}