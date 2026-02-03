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
import { ChevronLeft, ChevronRight, ArrowRight, Pause, Play } from "lucide-react";
import { Link } from "react-router-dom";

// Slide data - Using your local images
const slides = [
  {
    id: 1,
    title: "Transform Your Living Space",
    subtitle: "Premium furniture & home decor at unbeatable prices",
    cta: "Shop Living Room",
    ctaLink: "/products?category=furniture",
    image: "/hero-slider/sk_Furiture.png", // Your 1600x844 image
    accent: "Up to 50% Off",
  },
  {
    id: 2,
    title: "Smart Kitchen Essentials",
    subtitle: "Modern appliances for the contemporary home chef",
    cta: "Explore Kitchen",
    ctaLink: "/products?category=kitchen",
    image: "/hero-slider/sk_Electronics.png", // Add your kitchen image
    accent: "New Arrivals",
  },
  {
    id: 3,
    title: "Summer Cooling Solutions",
    subtitle: "Beat the heat with energy-efficient ACs & coolers",
    cta: "View Collection",
    ctaLink: "/products?category=home-appliances",
    image: "/hero-slider/sk_Furiture.png", // Add your AC image
    accent: "Starting ₹15,999",
  },
  {
    id: 4,
    title: "Entertainment Upgrade",
    subtitle: "4K TVs & sound systems for immersive experiences",
    cta: "Shop Electronics",
    ctaLink: "/products?category=electronics",
    image: "/hero-slider/sk_home_appliances.png", // Add your TV image
    accent: "Flash Sale",
  },
];

const AUTO_PLAY_INTERVAL = 5000; // 5 seconds
const PAUSE_RESUME_DELAY = 10000; // 10 seconds

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  /**
   * Navigate to next slide
   */
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  /**
   * Navigate to previous slide
   */
  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  /**
   * Handle manual navigation to specific slide
   */
  const handleManualNavigation = useCallback((index) => {
    setIsAutoPlaying(false);
    setIsPaused(true);
    setCurrentSlide(index);
    setTimeout(() => {
      setIsAutoPlaying(true);
      setIsPaused(false);
    }, PAUSE_RESUME_DELAY);
  }, []);

  /**
   * Toggle play/pause
   */
  const togglePlayPause = useCallback(() => {
    setIsPaused(!isPaused);
    setIsAutoPlaying(!isPaused);
  }, [isPaused]);

  /**
   * Auto-play functionality
   */
  useEffect(() => {
    if (!isAutoPlaying || isPaused) return;

    const timer = setInterval(nextSlide, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isAutoPlaying, isPaused, nextSlide]);

  /**
   * Keyboard navigation support
   */
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
        setIsAutoPlaying(false);
        setIsPaused(true);
        setTimeout(() => {
          setIsAutoPlaying(true);
          setIsPaused(false);
        }, PAUSE_RESUME_DELAY);
      } else if (e.key === 'ArrowRight') {
        nextSlide();
        setIsAutoPlaying(false);
        setIsPaused(true);
        setTimeout(() => {
          setIsAutoPlaying(true);
          setIsPaused(false);
        }, PAUSE_RESUME_DELAY);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nextSlide, prevSlide]);

  return (
    <section className="p-3 sm:p-6 lg:p-12">
      <div
        className="relative rounded-xl w-full h-[250px] min-h-[250px] sm:h-[350px] md:h-[380px] lg:h-[530px] overflow-hidden mx-auto max-w-8xl group"
        onMouseEnter={() => {
          setIsAutoPlaying(false);
          setIsPaused(true);
        }}
        onMouseLeave={() => {
          if (!isPaused) {
            setIsAutoPlaying(true);
            setIsPaused(false);
          }
        }}
        aria-label="Hero banner carousel"
      >
        {/* Slides Container */}
        <div className="relative w-full h-full">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              aria-hidden={index !== currentSlide}
            >
              {/* Background Image with proper aspect ratio handling */}
              <div className="absolute inset-0">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-fill transition-transform duration-[10s] ease-out"
                  loading={index === 0 ? "eager" : "lazy"}
                />
             
                {/* Content Container */}
                <div className="relative h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-center">
                  {/* Accent badge */}
                  <div className="inline-flex items-center px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs sm:text-sm font-semibold mb-4 sm:mb-6 shadow-lg">
                    {slide.accent}
                  </div>
                  
                  {/* Title */}
                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3 leading-tight">
                    {slide.title}
                  </h2>
                  
                  {/* Subtitle */}
                  <p className="text-sm sm:text-base md:text-lg text-white/90 mb-4 sm:mb-6 max-w-2xl">
                    {slide.subtitle}
                  </p>
                  
                  {/* CTA Button */}
                  <Link
                    to={slide.ctaLink}
                    className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white text-gray-900 font-semibold rounded-full hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl group"
                  >
                    {slide.cta}
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Controls */}
        {/* Previous Button */}
        <button
          onClick={() => {
            prevSlide();
            setIsAutoPlaying(false);
            setIsPaused(true);
            setTimeout(() => {
              setIsAutoPlaying(true);
              setIsPaused(false);
            }, PAUSE_RESUME_DELAY);
          }}
          className="hidden sm:block absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white p-2.5 sm:p-3 rounded-full border border-white/40 shadow-sm transition-all opacity-0 group-hover:opacity-100 z-20"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
        </button>

        {/* Next Button */}
        <button
          onClick={() => {
            nextSlide();
            setIsAutoPlaying(false);
            setIsPaused(true);
            setTimeout(() => {
              setIsAutoPlaying(true);
              setIsPaused(false);
            }, PAUSE_RESUME_DELAY);
          }}
          className="hidden sm:block absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white p-2.5 sm:p-3 rounded-full border border-white/40 shadow-sm transition-all opacity-0 group-hover:opacity-100 z-20"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          className="hidden md:block absolute top-3 right-3 bg-white/80 backdrop-blur-sm hover:bg-white p-1.5 sm:p-2 rounded-full border border-white/40 shadow-sm transition-all opacity-0 group-hover:opacity-100 z-20"
          aria-label={isPaused ? "Play slideshow" : "Pause slideshow"}
        >
          {isPaused ? (
            <Play className="w-3 h-3 sm:w-4 sm:h-4 text-gray-700" />
          ) : (
            <Pause className="w-3 h-3 sm:w-4 sm:h-4 text-gray-700" />
          )}
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-20" role="tablist" aria-label="Slide indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => handleManualNavigation(index)}
              className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-5 sm:w-6 bg-white"
                  : "w-1.5 sm:w-2 bg-white/60 hover:bg-white"
              }`}
              aria-label={`Go to slide ${index + 1}`}
              aria-selected={index === currentSlide}
              role="tab"
            />
          ))}
        </div>

        {/* Slide Counter - Desktop only */}
        <div className="hidden md:flex absolute bottom-4 right-4 lg:right-6 items-center gap-1 text-white/80 text-xs sm:text-sm font-medium z-20">
          <span className="text-white text-sm sm:text-base">{String(currentSlide + 1).padStart(2, '0')}</span>
          <span>/</span>
          <span>{String(slides.length).padStart(2, '0')}</span>
        </div>
      </div>
    </section>
  );
}