/**
 * HeroSlider — Split dual-banner hero
 *
 * Shows two banners side-by-side (desktop) and stacked (mobile).
 * Pages through slides two at a time, with autoplay, dots and arrow nav.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { heroSliderApi } from "@/services/api";
import { getImageUrl } from "@/lib/utils";

const AUTO_PLAY_INTERVAL = 6000;
const PAUSE_RESUME_DELAY = 10000;

const DEFAULT_SLIDES = [
  {
    id: "def-1",
    title: "Transform Your Living Space",
    subtitle: "Premium furniture & home decor at unbeatable prices",
    cta: "Shop Now",
    ctaLink: "/products?category=furniture",
    image: "/hero-slider/sk_Furiture.png",
    accent: "UP TO 35% OFF",
    isDefault: true,
  },
  {
    id: "def-2",
    title: "Smart Kitchen Essentials",
    subtitle: "Modern appliances for the contemporary home chef",
    cta: "Shop Now",
    ctaLink: "/products?category=kitchen",
    image: "/hero-slider/sk_Electronics.png",
    accent: "UP TO 40% OFF",
    isDefault: true,
  },
  {
    id: "def-3",
    title: "Summer Cooling Solutions",
    subtitle: "Beat the heat with energy-efficient ACs & coolers",
    cta: "Shop Now",
    ctaLink: "/products?category=home-appliances",
    image: "/hero-slider/sk_Furiture.png",
    accent: "Starting ₹15,999",
    isDefault: true,
  },
];

function BannerCard({ slide, hiddenOnMobile = false }) {
  return (
    <Link
      to={slide.ctaLink || "#"}
      className={`group relative flex-1 min-w-0 rounded-2xl overflow-hidden ${hiddenOnMobile ? "hidden sm:block" : ""}`}
      style={{ height: "clamp(220px, 32vw, 400px)" }}
      aria-label={slide.title}
    >
      <img
        src={slide.isDefault ? slide.image : getImageUrl(slide.image)}
        alt={slide.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      {slide.accent && (
        <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-10">
          <div className="flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/95 shadow-lg text-center leading-none">
            <span className="text-[9px] sm:text-[10px] font-bold text-foreground/70 uppercase">Up to</span>
            <span className="text-sm sm:text-lg font-black text-accent-foreground" style={{ color: "hsl(45,100%,38%)" }}>
              {slide.accent.replace(/up to/i, "").trim()}
            </span>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 sm:p-6">
        <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-white leading-tight mb-1.5 sm:mb-2"
          style={{ textShadow: "0 2px 16px rgba(0,0,0,0.5)" }}>
          {slide.title}
        </h3>
        {slide.subtitle && (
          <p className="hidden sm:block text-xs sm:text-sm text-white/85 mb-3 sm:mb-4 max-w-xs">
            {slide.subtitle}
          </p>
        )}
        {slide.cta && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full font-bold text-black text-xs sm:text-sm shadow-lg group-hover:gap-2.5 transition-all"
            style={{ background: "hsl(45,100%,52%)" }}>
            {slide.cta}
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </span>
        )}
      </div>
    </Link>
  );
}

export function HeroSlider() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await heroSliderApi.getSliders();
        setSlides(res.success && res.data.length > 0 ? res.data : DEFAULT_SLIDES);
      } catch {
        setSlides(DEFAULT_SLIDES);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = slides.length;

  const goTo = useCallback((i) => {
    setCurrent((((i % total) + total) % total));
  }, [total]);

  const nextSlide = useCallback(() => goTo(current + 1), [current, goTo]);
  const prevSlide = useCallback(() => goTo(current - 1), [current, goTo]);

  const handleManualNav = (fn) => {
    fn();
    setIsPlaying(false);
    setTimeout(() => setIsPlaying(true), PAUSE_RESUME_DELAY);
  };

  // Autoplay
  useEffect(() => {
    if (!isPlaying || total <= 1) return;
    timerRef.current = setTimeout(() => {
      setCurrent((c) => (c + 1) % total);
    }, AUTO_PLAY_INTERVAL);
    return () => clearTimeout(timerRef.current);
  }, [isPlaying, current, total]);

  if (loading) {
    return (
      <section className="p-3 sm:p-6 lg:px-5">
        <div className="flex gap-3 sm:gap-5">
          <div className="flex-1 rounded-2xl h-[220px] sm:h-[350px] bg-gray-100 animate-pulse" />
          <div className="flex-1 rounded-2xl h-[220px] sm:h-[350px] bg-gray-100 animate-pulse hidden sm:block" />
        </div>
      </section>
    );
  }

  if (!slides.length) return null;

  const secondSlide = total > 1 ? slides[(current + 1) % total] : null;

  return (
    <section
      className="p-3 sm:p-5 lg:px-5"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
    >
      <div className="relative">
        <div className="flex flex-row gap-3 sm:gap-5">
          <BannerCard key={slides[current].id} slide={slides[current]} />
          {secondSlide && <BannerCard key={secondSlide.id} slide={secondSlide} hiddenOnMobile />}
        </div>

        {total > 1 && (
          <>
            <button
              onClick={() => handleManualNav(prevSlide)}
              className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-white shadow-lg hover:scale-110 transition-transform"
              aria-label="Previous banner"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={() => handleManualNav(nextSlide)}
              className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-white shadow-lg hover:scale-110 transition-transform"
              aria-label="Next banner"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>

            <div className="flex items-center justify-center gap-1.5 mt-4">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleManualNav(() => goTo(i))}
                  aria-label={`Banner ${i + 1}`}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === current ? 22 : 6,
                    background: i === current ? "hsl(45,100%,52%)" : "rgba(0,0,0,0.15)",
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
