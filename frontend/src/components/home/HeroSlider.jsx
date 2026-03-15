/**
 * HeroSlider — Innovated
 *
 * Design direction: Cinematic editorial
 * - Clip-path wipe transitions instead of plain fade
 * - Floating glassmorphism content card (not locked to bottom)
 * - Animated SVG progress ring per slide
 * - Staggered text reveal on slide change
 * - Floating accent pill that morphs between slides
 * - Magnetic-feel CTA button on hover
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { heroSliderApi } from "@/services/api";
import { getImageUrl } from "@/lib/utils";

const AUTO_PLAY_INTERVAL = 5000;
const PAUSE_RESUME_DELAY = 10000;

const DEFAULT_SLIDES = [
  {
    id: "def-1",
    title: "Transform Your Living Space",
    subtitle: "Premium furniture & home decor at unbeatable prices",
    cta: "Shop Living Room",
    ctaLink: "/products?category=furniture",
    image: "/hero-slider/sk_Furiture.png",
    accent: "Up to 50% Off",
    isDefault: true,
    color: "from-amber-900/80 to-orange-900/60",
    tag: "Furniture",
  },
  {
    id: "def-2",
    title: "Smart Kitchen Essentials",
    subtitle: "Modern appliances for the contemporary home chef",
    cta: "Explore Kitchen",
    ctaLink: "/products?category=kitchen",
    image: "/hero-slider/sk_Electronics.png",
    accent: "New Arrivals",
    isDefault: true,
    color: "from-blue-900/80 to-indigo-900/60",
    tag: "Electronics",
  },
  {
    id: "def-3",
    title: "Summer Cooling Solutions",
    subtitle: "Beat the heat with energy-efficient ACs & coolers",
    cta: "View Collection",
    ctaLink: "/products?category=home-appliances",
    image: "/hero-slider/sk_Furiture.png",
    accent: "Starting ₹15,999",
    isDefault: true,
    color: "from-cyan-900/80 to-teal-900/60",
    tag: "Appliances",
  },
];

// SVG progress ring for the nav buttons
const ProgressRing = ({ progress, size = 44, stroke = 2.5 }) => {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="absolute inset-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(255,255,255,0.9)" strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={circ - (circ * progress) / 100}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.1s linear" }}
      />
    </svg>
  );
};

export function HeroSlider() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(null);
  const [direction, setDirection] = useState("next");
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [textKey, setTextKey] = useState(0); // force re-animate text
  const progressRef = useRef(null);
  const startTimeRef = useRef(null);

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

  const goTo = useCallback((index, dir = "next") => {
    setDirection(dir);
    setPrev(current => current);
    setCurrent(index);
    setTextKey(k => k + 1);
    setProgress(0);
    startTimeRef.current = performance.now();
  }, []);

  const next = useCallback(() => {
    setCurrent(c => {
      const n = (c + 1) % slides.length;
      goTo(n, "next");
      return c; // goTo will update
    });
  }, [slides.length, goTo]);

  const nextSlide = useCallback(() => {
    if (!slides.length) return;
    setDirection("next");
    setTextKey(k => k + 1);
    setProgress(0);
    startTimeRef.current = performance.now();
    setCurrent(c => {
      setPrev(c);
      return (c + 1) % slides.length;
    });
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    if (!slides.length) return;
    setDirection("prev");
    setTextKey(k => k + 1);
    setProgress(0);
    startTimeRef.current = performance.now();
    setCurrent(c => {
      setPrev(c);
      return (c - 1 + slides.length) % slides.length;
    });
  }, [slides.length]);

  const handleDot = (i) => {
    setIsPlaying(false);
    setDirection(i > current ? "next" : "prev");
    setTextKey(k => k + 1);
    setProgress(0);
    setPrev(current);
    setCurrent(i);
    setTimeout(() => setIsPlaying(true), PAUSE_RESUME_DELAY);
  };

  // Progress tick
  useEffect(() => {
    if (!isPlaying || !slides.length) return;
    startTimeRef.current = performance.now();
    const tick = () => {
      const elapsed = performance.now() - startTimeRef.current;
      const p = Math.min((elapsed / AUTO_PLAY_INTERVAL) * 100, 100);
      setProgress(p);
      if (p < 100) {
        progressRef.current = requestAnimationFrame(tick);
      } else {
        nextSlide();
        startTimeRef.current = performance.now();
      }
    };
    progressRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(progressRef.current);
  }, [isPlaying, slides.length, current, nextSlide]);

  // Keyboard
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "ArrowLeft") { prevSlide(); setIsPlaying(false); setTimeout(() => setIsPlaying(true), PAUSE_RESUME_DELAY); }
      if (e.key === "ArrowRight") { nextSlide(); setIsPlaying(false); setTimeout(() => setIsPlaying(true), PAUSE_RESUME_DELAY); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [nextSlide, prevSlide]);

  if (loading) {
    return (
      <section className="p-3 sm:p-6 lg:px-5">
        <div className="relative rounded-2xl w-full h-[250px] sm:h-[350px] lg:h-[530px] bg-gray-100 animate-pulse overflow-hidden">
          <div className="absolute bottom-6 left-6 space-y-3">
            <div className="h-4 w-24 bg-gray-200 rounded-full" />
            <div className="h-8 w-64 bg-gray-200 rounded-lg" />
            <div className="h-4 w-48 bg-gray-200 rounded" />
          </div>
        </div>
      </section>
    );
  }

  if (!slides.length) return null;

  const slide = slides[current];

  return (
    <section className="p-3 sm:p-5 lg:px-5">
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(60px); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-60px); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        @keyframes fadeUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes clipIn {
          from { clip-path: inset(0 100% 0 0); }
          to   { clip-path: inset(0 0% 0 0);   }
        }
        @keyframes clipInLeft {
          from { clip-path: inset(0 0 0 100%); }
          to   { clip-path: inset(0 0 0 0%);   }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px);  }
          50%       { transform: translateY(-8px); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }

        .hero-img-in-next  { animation: clipIn     0.75s cubic-bezier(0.77,0,0.175,1) forwards; }
        .hero-img-in-prev  { animation: clipInLeft 0.75s cubic-bezier(0.77,0,0.175,1) forwards; }
        .text-tag    { animation: fadeUp       0.4s 0.2s ease both; }
        .text-title  { animation: fadeUp       0.5s 0.35s ease both; }
        .text-sub    { animation: fadeUp       0.45s 0.5s ease both; }
        .text-cta    { animation: fadeUp       0.45s 0.65s ease both; }
        .float-pill  { animation: float 4s ease-in-out infinite; }
        .shimmer-btn {
          background: linear-gradient(90deg, hsl(45,100%,50%) 0%, hsl(45,100%,70%) 45%, hsl(45,100%,50%) 100%);
          background-size: 200% auto;
          animation: shimmer 2.5s linear infinite;
        }
      `}</style>

      <div
        className="relative rounded-2xl w-full overflow-hidden mx-auto"
        style={{ height: "clamp(240px, 48vw, 530px)" }}
        onMouseEnter={() => setIsPlaying(false)}
        onMouseLeave={() => setIsPlaying(true)}
        aria-label="Hero banner carousel"
      >
        {/* ── Background images with clip-path transition ── */}
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 ${
              i === current
                ? direction === "next"
                  ? "hero-img-in-next z-10"
                  : "hero-img-in-prev z-10"
                : "z-0"
            }`}
          >
            <img
              src={s.isDefault ? s.image : getImageUrl(s.image)}
              alt={s.title}
              className="w-full h-full object-fill"
              loading={i === 0 ? "eager" : "lazy"}
            />
            {/* Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
          </div>
        ))}

        {/* ── Floating accent pill (top-left) ── */}
        <div className="absolute top-4 left-4 z-30 float-pill hidden sm:block">
          <div
            className="px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase text-black shadow-lg"
            style={{ background: "hsl(45,100%,52%)" }}
          >
            {slide.accent || slide.tag || "Featured"}
          </div>
        </div>

        {/* ── Slide counter top-right ── */}
        <div className="absolute top-4 right-4 z-30 hidden md:flex items-center gap-1.5">
          <span className="text-white font-bold text-lg leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>
            {String(current + 1).padStart(2, "0")}
          </span>
          <span className="text-white/40 text-sm">/</span>
          <span className="text-white/50 text-sm">{String(slides.length).padStart(2, "0")}</span>
        </div>

        {/* ── Content card (glassmorphism) ── */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-6 lg:p-8">
          <div key={textKey} className="max-w-lg">
            {/* Tag */}
           {!slide.cta && <div className="text-tag text-xs font-semibold font-heading tracking-widest uppercase text-yellow-400 mb-2 sm:mb-3 opacity-0">
              {slide.tag || "Collection"}
            </div>}

            {/* Title */}
            <h2 className="text-title text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight mb-2 sm:mb-3 opacity-0"
              style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
              {slide.title}
            </h2>

            {/* Subtitle */}
            {slide.subtitle && (
              <p className="text-sub hidden sm:block text-sm md:text-base text-white/80 mb-4 md:mb-5 max-w-sm opacity-0">
                {slide.subtitle}
              </p>
            )}

            {/* CTA */}
            {slide.cta && (
              <div className="text-cta opacity-0">
                <Link
                  to={slide.ctaLink || "#"}
                  className="shimmer-btn inline-flex text-xs items-center gap-1 px-3 py-1.5 sm:px-6 sm:py-3 rounded-full font-bold text-black text-sm shadow-xl hover:scale-105 transition-transform duration-200 group"
                >
                  {slide.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Left nav button with progress ring ── */}
        <button
          onClick={() => { prevSlide(); setIsPlaying(false); setTimeout(() => setIsPlaying(true), PAUSE_RESUME_DELAY); }}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 items-center justify-center"
          aria-label="Previous slide"
        >
          <ProgressRing progress={100 - progress} />
          <div className="relative w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/30 transition-colors">
            <ChevronLeft className="w-4 h-4 text-white" />
          </div>
        </button>

        {/* ── Right nav button with progress ring ── */}
        <button
          onClick={() => { nextSlide(); setIsPlaying(false); setTimeout(() => setIsPlaying(true), PAUSE_RESUME_DELAY); }}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 items-center justify-center"
          aria-label="Next slide"
        >
          <ProgressRing progress={progress} />
          <div className="relative w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/30 transition-colors">
            <ChevronRight className="w-4 h-4 text-white" />
          </div>
        </button>

        {/* ── Dot indicators ── */}
        <div className="absolute bottom-4 right-4 md:right-16 z-30 flex items-center gap-1.5 md:bottom-6">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => handleDot(i)}
              aria-label={`Slide ${i + 1}`}
              className="relative overflow-hidden rounded-full transition-all duration-300"
              style={{
                width: i === current ? 22 : 6,
                height: 6,
                background: i === current ? "rgba(242,233,234)" : "rgba(255,255,255,0.4)",
              }}
            >
              {/* fill bar on active */}
              {i === current && (
                <span
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: "rgba(0,0,0,0.25)",
                    transition: "width 0.1s linear",
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* ── Mobile bottom bar with thin progress line ── */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 h-0.5 bg-white/20 z-30">
          <div
            className="h-full bg-yellow-400 transition-none rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </section>
  );
}