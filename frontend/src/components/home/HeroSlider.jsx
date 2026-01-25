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

// Slide data - Can be moved to API/Config in production
const slides = [
  {
    id: 1,
    title: "Transform Your Living Space",
    subtitle: "Premium furniture & home decor at unbeatable prices",
    cta: "Shop Living Room",
    ctaLink: "/products?category=furniture",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&q=80",
    accent: "Up to 50% Off",
    gradient: "from-blue-600/80 to-purple-600/80",
  },
  {
    id: 2,
    title: "Smart Kitchen Essentials",
    subtitle: "Modern appliances for the contemporary home chef",
    cta: "Explore Kitchen",
    ctaLink: "/products?category=kitchen",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80",
    accent: "New Arrivals",
    gradient: "from-orange-600/80 to-red-600/80",
  },
  {
    id: 3,
    title: "Summer Cooling Solutions",
    subtitle: "Beat the heat with energy-efficient ACs & coolers",
    cta: "View Collection",
    ctaLink: "/products?category=home-appliances",
    image: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1920&q=80",
    accent: "Starting ₹15,999",
    gradient: "from-cyan-600/80 to-blue-600/80",
  },
  {
    id: 4,
    title: "Entertainment Upgrade",
    subtitle: "4K TVs & sound systems for immersive experiences",
    cta: "Shop Electronics",
    ctaLink: "/products?category=electronics",
    image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=1920&q=80",
    accent: "Flash Sale",
    gradient: "from-purple-600/80 to-pink-600/80",
  },
];

const AUTO_PLAY_INTERVAL = 5000; // 5 seconds
const PAUSE_RESUME_DELAY = 10000; // 10 seconds

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = right, -1 = left

  /**
   * Navigate to next slide
   */
  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  /**
   * Navigate to previous slide
   */
  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  /**
   * Handle manual navigation to specific slide
   */
  const handleManualNavigation = useCallback((index) => {
    setDirection(index > currentSlide ? 1 : -1);
    setIsAutoPlaying(false);
    setIsPaused(true);
    setCurrentSlide(index);
    setTimeout(() => {
      setIsAutoPlaying(true);
      setIsPaused(false);
    }, PAUSE_RESUME_DELAY);
  }, [currentSlide]);

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
    <section 
      className="relative w-full h-[60vh] min-h-[400px] sm:h-[400px] md:h-[480px] lg:h-[540px] overflow-hidden bg-muted"
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
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-accent/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-400/15 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none z-0" />

      {/* Slides Container */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="absolute inset-0 transition-transform duration-700 ease-out"
            style={{
              transform: `translateX(${(index - currentSlide) * 100}%)`,
            }}
            aria-hidden={index !== currentSlide}
          >
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-[8s] ease-out"
              style={{
                backgroundImage: `url(${slide.image})`,
                backgroundPosition: "center center",
                transform: index === currentSlide ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              {/* Gradient Overlays for Text Readability */}
              <div className="absolute inset-0 bg-black/40 sm:bg-gradient-to-r sm:from-black/70 sm:via-black/40 sm:to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent sm:hidden" />
            </div>

            {/* Content */}
            <div className="relative h-full container flex flex-col justify-center items-center sm:items-start text-center sm:text-left px-4 sm:px-6 lg:px-8 pb-12 sm:pb-0 z-10">
              <div
                className={`max-w-lg lg:max-w-xl transition-all duration-500 delay-200 flex flex-col items-center sm:items-start ${
                  index === currentSlide
                    ? 'opacity-100 translate-y-0 sm:translate-x-0'
                    : 'opacity-0 translate-y-4 sm:translate-y-0 sm:translate-x-8'
                }`}
              >
                {/* Accent Badge */}
                <span className="inline-block mb-3 sm:mb-4 px-3 sm:px-4 py-1.5 bg-accent text-accent-foreground text-xs sm:text-sm font-semibold rounded-full shadow-lg animate-float">
                  {slide.accent}
                </span>

                {/* Title */}
                <h1 className="text-3xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 leading-tight drop-shadow-lg">
                  {slide.title}
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-base md:text-lg text-white/90 mb-6 sm:mb-8 max-w-xs sm:max-w-md line-clamp-3 sm:line-clamp-none">
                  {slide.subtitle}
                </p>

                {/* Call-to-Action Buttons */}
                <div className="flex flex-wrap gap-3 justify-center sm:justify-start w-full">
                  <Link
                    to={slide.ctaLink}
                    className="group inline-flex items-center gap-2 bg-accent text-accent-foreground font-semibold py-3 px-8 rounded-full hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/30 transition-all duration-300 text-sm sm:text-base"
                    aria-label={`${slide.cta} - ${slide.title}`}
                  >
                    {slide.cta}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/products"
                    className="hidden sm:inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white font-medium py-3 px-6 rounded-full border border-white/25 hover:bg-white/25 hover:border-accent/50 transition-all duration-300 text-sm sm:text-base"
                    aria-label="View all products"
                  >
                    View All
                  </Link>
                </div>
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
        className="hidden sm:block absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 bg-white/15 backdrop-blur-sm hover:bg-white/25 p-3 rounded-full border border-white/20 transition-all z-20"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
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
        className="hidden sm:block absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 bg-white/15 backdrop-blur-sm hover:bg-white/25 p-3 rounded-full border border-white/20 transition-all z-20"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5 text-white" />
      </button>

      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        className="hidden md:block absolute top-4 right-4 bg-white/15 backdrop-blur-sm hover:bg-white/25 p-2 rounded-full border border-white/20 transition-all z-20"
        aria-label={isPaused ? "Play slideshow" : "Pause slideshow"}
      >
        {isPaused ? (
          <Play className="w-4 h-4 text-white" />
        ) : (
          <Pause className="w-4 h-4 text-white" />
        )}
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20" role="tablist" aria-label="Slide indicators">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => handleManualNavigation(index)}
            className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "w-6 sm:w-8 bg-white"
                : "w-1.5 sm:w-2 bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${index + 1}`}
            aria-selected={index === currentSlide}
            role="tab"
          />
        ))}
      </div>

      {/* Slide Counter - Desktop only */}
      <div className="hidden md:flex absolute bottom-6 right-6 lg:right-8 items-center gap-2 text-white/60 text-sm font-medium z-20">
        <span className="text-white text-lg">{String(currentSlide + 1).padStart(2, '0')}</span>
        <span>/</span>
        <span>{String(slides.length).padStart(2, '0')}</span>
      </div>
    </section>
  );
}
