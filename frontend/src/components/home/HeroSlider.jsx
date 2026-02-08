/**
 * HeroSlider Component
 * 
 * Main hero banner component with auto-rotating slides showcasing
 * featured products, categories, and promotional offers.
 * 
 * Features:
 * - Auto-rotating carousel (5s interval)
 * - Manual navigation (arrows, indicators)
 * - Pause on hover
 * - Responsive design (mobile-first)
 * - Smooth transitions and animations
 * - Accessibility support
 * 
 * @component
 * @returns {JSX.Element} Hero slider component
 */

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { heroSliderApi } from "@/services/api";
import { getImageUrl } from "@/lib/utils";

const AUTO_PLAY_INTERVAL = 5000; // 5 seconds
const PAUSE_RESUME_DELAY = 10000; // 10 seconds

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
  }
];

export function HeroSlider() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  /**
   * Fetch slides from API
   */
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        setLoading(true);
        const res = await heroSliderApi.getSliders();
        if (res.success && res.data.length > 0) {
          setSlides(res.data);
        } else {
          setSlides(DEFAULT_SLIDES);
        }
      } catch (err) {
        console.error("Failed to fetch hero slides:", err);
        setSlides(DEFAULT_SLIDES);
      } finally {
        setLoading(false);
      }
    };
    fetchSlides();
  }, []);

  /**
   * Navigate to next slide
   */
  const nextSlide = useCallback(() => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  /**
   * Navigate to previous slide
   */
  const prevSlide = useCallback(() => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  /**
   * Handle manual navigation to specific slide
   */
  const handleManualNavigation = useCallback((index) => {
    setIsAutoPlaying(false);
    setCurrentSlide(index);
    setTimeout(() => {
      setIsAutoPlaying(true);
    }, PAUSE_RESUME_DELAY);
  }, []);

  /**
   * Auto-play functionality
   */
  useEffect(() => {
    if (!isAutoPlaying || slides.length === 0) return;

    const timer = setInterval(nextSlide, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isAutoPlaying, nextSlide, slides.length]);

  /**
   * Keyboard navigation support
   */
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
        setIsAutoPlaying(false);
        setTimeout(() => {
          setIsAutoPlaying(true);
        }, PAUSE_RESUME_DELAY);
      } else if (e.key === 'ArrowRight') {
        nextSlide();
        setIsAutoPlaying(false);
        setTimeout(() => {
          setIsAutoPlaying(true);
        }, PAUSE_RESUME_DELAY);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nextSlide, prevSlide]);

  if (loading) {
    return (
      <section className="p-3 sm:p-6 lg:p-12">
        <div className="relative rounded-xl w-full h-[250px] sm:h-[350px] md:h-[380px] lg:h-[530px] overflow-hidden mx-auto max-w-8xl bg-muted flex items-center justify-center">
     
        </div>
      </section>
    );
  }

  if (slides.length === 0) return null;

  return (
    <section className="p-3 sm:p-6 lg:p-6">
      <div
        className="relative rounded-xl w-full h-[250px] min-h-[250px] sm:h-[350px] md:h-[380px] lg:h-[530px] overflow-hidden mx-auto max-w-8xl group"
        aria-label="Hero banner carousel"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {/* Slides Container */}
        <div className="relative w-full h-full">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              aria-hidden={index !== currentSlide}
            >
              {/* Background Image with proper aspect ratio handling */}
              <div className="absolute inset-0">
                <img
                  src={slide.isDefault ? slide.image : getImageUrl(slide.image)}
                  alt={slide.title}
                  className="w-full h-full object-fill transition-transform duration-[10s] ease-out"
                  loading={index === 0 ? "eager" : "lazy"}
                />

                {/* Gradient Overlay for better text readability - Mobile */}
                <div className="hidden md:absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {/* Content Container - Shows on both mobile and desktop */}
                <div className="absolute hidden inset-0 h-full md:flex flex-col justify-end pb-4 sm:pb-6 px-4 sm:px-6 lg:px-8 text-left">
                  <div className="w-full max-w-2xl">
                    {/* Accent badge - Yellow background with black text */}
                    {slide.accent && (
                      <div className="inline-flex items-center px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-yellow-400 text-black font-semibold mb-2 sm:mb-3 shadow-lg text-xs sm:text-sm">
                        {slide.accent}
                      </div>
                    )}

                    {/* Title - Responsive font sizes */}
                    {slide.title && (
                      <h2 className="text-lg sm:text-xl md:text-2xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 leading-tight drop-shadow-md">
                        {slide.title}
                      </h2>
                    )}

                    {/* Subtitle - Hidden on very small screens, shown on sm and up */}
                    {slide.subtitle && (
                      <p className="hidden sm:block text-sm md:text-base lg:text-lg text-white/90 mb-3 sm:mb-4 max-w-xl drop-shadow-sm">
                        {slide.subtitle}
                      </p>
                    )}

                    {/* CTA Button - Yellow background with black text */}
                    {slide.cta && (
                      <div className="flex items-center gap-2">
                        <Link
                          to={slide.ctaLink || "#"}
                          className="inline-flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-yellow-400 text-black font-semibold rounded-full hover:bg-yellow-300 transition-all duration-300 shadow-lg hover:shadow-xl group text-xs sm:text-sm"
                        >
                          {slide.cta}
                          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Controls - Desktop only */}
        {/* Previous Button */}
        <button
          onClick={() => {
            prevSlide();
            setIsAutoPlaying(false);
            setTimeout(() => {
              setIsAutoPlaying(true);
            }, PAUSE_RESUME_DELAY);
          }}
          className="hidden md:block absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white p-2.5 sm:p-3 rounded-full border border-white/40 shadow-sm transition-all opacity-0 group-hover:opacity-100 z-20"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
        </button>

        {/* Next Button */}
        <button
          onClick={() => {
            nextSlide();
            setIsAutoPlaying(false);
            setTimeout(() => {
              setIsAutoPlaying(true);
            }, PAUSE_RESUME_DELAY);
          }}
          className="hidden md:block absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white p-2.5 sm:p-3 rounded-full border border-white/40 shadow-sm transition-all opacity-0 group-hover:opacity-100 z-20"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
        </button>

        {/* Slide Indicators - Desktop only */}
        <div className="hidden md:flex absolute bottom-4 left-1/2 -translate-x-1/2 items-center gap-2 z-20" role="tablist" aria-label="Slide indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => handleManualNavigation(index)}
              className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                ? "w-6 bg-white"
                : "w-2 bg-white/60 hover:bg-white"
                }`}
              aria-label={`Go to slide ${index + 1}`}
              aria-selected={index === currentSlide}
              role="tab"
            />
          ))}
        </div>

        {/* Mobile Slide Indicators - Smaller and closer to bottom */}
        <div className="md:hidden absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20" role="tablist" aria-label="Slide indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => handleManualNavigation(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide
                ? "w-4 bg-white"
                : "w-1.5 bg-white/60 hover:bg-white"
                }`}
              aria-label={`Go to slide ${index + 1}`}
              aria-selected={index === currentSlide}
              role="tab"
            />
          ))}
        </div>

        {/* Slide Counter - Desktop only */}
        <div className="hidden md:flex absolute bottom-4 right-4 lg:right-6 items-center gap-1 text-white/80 text-sm font-medium z-20">
          <span className="text-white">{String(currentSlide + 1).padStart(2, '0')}</span>
          <span>/</span>
          <span>{String(slides.length).padStart(2, '0')}</span>
        </div>
      </div>
    </section>
  );
}