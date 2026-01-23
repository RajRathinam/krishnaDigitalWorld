import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const heroSlides = [
  {
    id: 1,
    title: "Next-Gen Electronics",
    subtitle: "Upgrade Your Lifestyle",
    description: "Experience the future with our latest collection of smart gadgets and premium home appliances.",
    image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=2101&auto=format&fit=crop",
    accent: "from-blue-600 to-indigo-600",
    cta: "Explore Now",
    link: "/products?category=electronics"
  },
  {
    id: 2,
    title: "Premium Home Comfort",
    subtitle: "Designed for Living",
    description: "Transform your living space with our elegant, energy-efficient appliances.",
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=2070&auto=format&fit=crop",
    accent: "from-amber-500 to-orange-600",
    cta: "Shop Home",
    link: "/products?category=home-appliances"
  },
  {
    id: 3,
    title: "Smart Kitchen",
    subtitle: "Cook Like a Pro",
    description: "Professional grade kitchen appliances for the modern culinary enthusiast.",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=2000&auto=format&fit=crop",
    accent: "from-emerald-500 to-teal-600",
    cta: "View Collection",
    link: "/products?category=kitchen"
  }
];

export function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % heroSlides.length);
  }, []);

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide, isPaused]);

  return (
    <section
      className="relative w-full h-[600px] md:h-[700px] overflow-hidden bg-background"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      {heroSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === current ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
        >
          {/* Background Image with Parallax-like scaling */}
          <div className="absolute inset-0 overflow-hidden bg-black">
            <img
              src={slide.image}
              alt={slide.title}
              className={`w-full h-full object-cover transition-transform duration-10000 ease-linear ${index === current ? "scale-110" : "scale-100"
                }`}
            />
            {/* Gradient Overlay - Simplified for maximum visibility - White text needs dark bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
          </div>

          {/* Content */}
          <div className="absolute inset-0 flex items-center justify-center md:justify-start container px-6 md:px-12">
            <div className={`max-w-2xl text-white space-y-6 md:space-y-8 ${index === current ? 'animate-in slide-in-from-bottom-10 fade-in duration-1000' : ''}`}>
              <div className="space-y-2">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium">
                  <Sparkles className="w-3 h-3 text-yellow-400" />
                  {slide.subtitle}
                </span>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
                  {slide.title}
                </h1>
              </div>

              <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-lg">
                {slide.description}
              </p>

              <div className="flex flex-wrap gap-4">
                <Link to={slide.link}>
                  <Button size="lg" className="bg-white text-black hover:bg-white/90 border-0 rounded-full px-8 h-12 md:h-14 md:text-lg font-semibold shadow-xl shadow-black/20 hover:scale-105 transition-all duration-300">
                    {slide.cta} <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/products">
                  <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white/10 rounded-full px-8 h-12 md:h-14 md:text-lg">
                    View All Products
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation - Bottom Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${current === index ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
              }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Navigation - Sides */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:bg-black/40 hover:text-white transition-all duration-300 hidden md:flex"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:bg-black/40 hover:text-white transition-all duration-300 hidden md:flex"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </section>
  );
}
