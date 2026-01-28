import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const slides = [
  {
    id: 1,
    title: "Transform Your Living Space",
    subtitle: "Premium furniture & home decor at unbeatable prices",
    cta: "Shop Living Room",
    ctaLink: "/products?category=furniture",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&q=80",
    accent: "Up to 50% Off",
  },
  {
    id: 2,
    title: "Smart Kitchen Essentials",
    subtitle: "Modern appliances for the contemporary home chef",
    cta: "Explore Kitchen",
    ctaLink: "/products?category=kitchen",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80",
    accent: "New Arrivals",
  },
  {
    id: 3,
    title: "Summer Cooling Solutions",
    subtitle: "Beat the heat with energy-efficient ACs & coolers",
    cta: "View Collection",
    ctaLink: "/products?category=home-appliances",
    image: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1920&q=80",
    accent: "Starting ₹15,999",
  },
  {
    id: 4,
    title: "Entertainment Upgrade",
    subtitle: "4K TVs & sound systems for immersive experiences",
    cta: "Shop Electronics",
    ctaLink: "/products?category=electronics",
    image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=1920&q=80",
    accent: "Flash Sale",
  },
];

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [direction, setDirection] = useState(1); // 1 = right, -1 = left
  const [isAnimating, setIsAnimating] = useState(false);

  const nextSlide = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsAnimating(false), 600);
  }, [isAnimating]);

  const prevSlide = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsAnimating(false), 600);
  }, [isAnimating]);

  useEffect(() => {
    if (!isAutoPlaying)
      return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, nextSlide]);

  const handleManualNavigation = (index) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection(index > currentSlide ? 1 : -1);
    setIsAutoPlaying(false);
    setCurrentSlide(index);
    setTimeout(() => {
      setIsAnimating(false);
      setIsAutoPlaying(true);
    }, 10000);
  };

  return (
    <section 
      className="relative w-full h-[60vh] min-h-[400px] sm:h-[400px] md:h-[480px] lg:h-[540px] overflow-hidden bg-muted" 
      onMouseEnter={() => setIsAutoPlaying(false)} 
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Colorful accent elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-accent/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-400/15 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      {/* Slides Container */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div 
            key={slide.id} 
            className="absolute inset-0 transition-transform duration-700 ease-out"
            style={{
              transform: `translateX(${(index - currentSlide) * 100}%)`,
            }}
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
              {/* Enhanced Gradient for Mobile Usability */}
              <div className="absolute inset-0 bg-black/40 sm:bg-gradient-to-r sm:from-black/70 sm:via-black/40 sm:to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent sm:hidden" />
            </div>

            {/* Content with Text Transport Effects */}
            <div className="relative h-full container flex flex-col justify-end items-center sm:items-start text-center sm:text-left px-4 sm:px-6 lg:px-20 pb-12 sm:pb-10">
              <div 
                className={`max-w-lg lg:max-w-xl transition-all duration-500 flex flex-col items-center sm:items-start ${
                  index === currentSlide 
                    ? 'opacity-100 translate-y-0 sm:translate-x-0' 
                    : direction === 1 
                      ? 'opacity-0 translate-y-4 sm:translate-y-0 sm:translate-x-8' 
                      : 'opacity-0 translate-y-4 sm:translate-y-0 sm:-translate-x-8'
                }`}
              >
                {/* Accent Badge with Text Transport */}
                <span 
                  className="inline-block mb-3 sm:mb-4 px-3 sm:px-4 py-1.5 bg-accent text-accent-foreground text-xs sm:text-sm font-semibold rounded-full shadow-lg"
                  style={{
                    transform: index === currentSlide 
                      ? 'translateY(0) rotate(0deg) scale(1)' 
                      : direction === 1 
                        ? 'translateY(20px) rotate(5deg) scale(0.8)' 
                        : 'translateY(20px) rotate(-5deg) scale(0.8)',
                    opacity: index === currentSlide ? 1 : 0,
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    transitionDelay: index === currentSlide ? '0.1s' : '0s',
                  }}
                >
                  {slide.accent}
                </span>

                {/* Title with Advanced Text Transport */}
                <h1 
                  className="text-3xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 leading-tight drop-shadow-lg"
                  style={{
                    transform: index === currentSlide 
                      ? 'translateY(0) skewY(0deg)' 
                      : direction === 1 
                        ? 'translateY(40px) skewY(2deg)' 
                        : 'translateY(40px) skewY(-2deg)',
                    opacity: index === currentSlide ? 1 : 0,
                    filter: index === currentSlide ? 'blur(0px)' : 'blur(2px)',
                    transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                    transitionDelay: index === currentSlide ? '0.2s' : '0s',
                    textShadow: index === currentSlide 
                      ? '2px 2px 4px rgba(0,0,0,0.5), 0 0 20px rgba(255,255,255,0.1)' 
                      : '2px 2px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  {slide.title}
                </h1>

                {/* Subtitle with Text Transport */}
                <p 
                  className="text-base sm:text-base md:text-lg text-white/90 mb-6 sm:mb-8 max-w-xs sm:max-w-md line-clamp-3 sm:line-clamp-none"
                  style={{
                    transform: index === currentSlide 
                      ? 'translateY(0) scale(1)' 
                      : direction === 1 
                        ? 'translateY(30px) scale(0.95)' 
                        : 'translateY(30px) scale(0.95)',
                    opacity: index === currentSlide ? 1 : 0,
                    letterSpacing: index === currentSlide ? '0.02em' : '0.01em',
                    transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    transitionDelay: index === currentSlide ? '0.3s' : '0s',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  }}
                >
                  {slide.subtitle}
                </p>

                {/* Buttons with Text Transport */}
                <div 
                  className="flex flex-wrap gap-3 justify-center sm:justify-start w-full"
                  style={{
                    transform: index === currentSlide 
                      ? 'translateY(0)' 
                      : direction === 1 
                        ? 'translateY(20px)' 
                        : 'translateY(20px)',
                    opacity: index === currentSlide ? 1 : 0,
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    transitionDelay: index === currentSlide ? '0.4s' : '0s',
                  }}
                >
                  <Link 
                    to={slide.ctaLink} 
                    className="group inline-flex items-center gap-2 bg-accent text-accent-foreground font-semibold py-3 px-8 rounded-full hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/30 transition-all duration-300 text-sm sm:text-base"
                    style={{
                      transform: index === currentSlide 
                        ? 'scale(1)' 
                        : 'scale(0.9)',
                    }}
                  >
                    {slide.cta}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link 
                    to="/products" 
                    className="hidden sm:inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white font-medium py-3 px-6 rounded-full border border-white/25 hover:bg-white/25 hover:border-accent/50 transition-all duration-300 text-sm sm:text-base"
                    style={{
                      transform: index === currentSlide 
                        ? 'scale(1)' 
                        : 'scale(0.9)',
                    }}
                  >
                    View All
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows - Hidden on Mobile to reduce clutter */}
      <button 
        onClick={() => { 
          prevSlide(); 
          setIsAutoPlaying(false); 
          setTimeout(() => setIsAutoPlaying(true), 10000); 
        }} 
        className="hidden sm:block absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 bg-white/15 backdrop-blur-sm hover:bg-white/25 p-3 rounded-full border border-white/20 transition-all"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>
      <button 
        onClick={() => { 
          nextSlide(); 
          setIsAutoPlaying(false); 
          setTimeout(() => setIsAutoPlaying(true), 10000); 
        }} 
        className="hidden sm:block absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 bg-white/15 backdrop-blur-sm hover:bg-white/25 p-3 rounded-full border border-white/20 transition-all"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5 text-white" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
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
          />
        ))}
      </div>

      {/* Slide Counter - Desktop only */}
      <div className="hidden md:flex absolute bottom-6 right-6 lg:right-8 items-center gap-2 text-white/60 text-sm font-medium">
        <span className="text-white text-lg">{String(currentSlide + 1).padStart(2, '0')}</span>
        <span>/</span>
        <span>{String(slides.length).padStart(2, '0')}</span>
      </div>
    </section>
  );
}