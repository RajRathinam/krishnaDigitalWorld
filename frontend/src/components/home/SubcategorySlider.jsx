"use client";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { categoryApi } from "@/services/api";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  if (typeof value === 'object') {
    return Object.values(value);
  }
  return [];
};

// Image mapping based on your subcategory names
const SUB_CATEGORY_IMAGES = {
  // AC and Air Conditioner related
  "ac": "ac.png",
  "air conditioner": "ac.png",
  "air conditioners": "ac.png",

  // Audio related
  "audio": "audio.png",
  "speakers": "audio.png",
  "headphones": "audio.png",
  "earphones": "audio.png",
  "sound system": "audio.png",

  // Camera related
  "camera": "camera.png",
  "cameras": "camera.png",
  "dslr": "camera.png",
  "mirrorless": "camera.png",

  // Fan related
  "fan": "fan.png",
  "fans": "fan.png",
  "ceiling fan": "fan.png",
  "table fan": "fan.png",

  // Fridge related
  "fridge": "fridge.png",
  "refrigerator": "fridge.png",
  "refrigerators": "fridge.png",

  // Grinder related
  "grinder": "grinder.png",
  "mixer grinder": "grinder.png",
  "wet grinder": "grinder.png",

  // Iron related
  "iron": "iron.png",
  "iron box": "iron.png",

  // Laptop related
  "laptop": "laptop.png",
  "laptops": "laptop.png",
  "notebook": "laptop.png",

  // Microwave related
  "microwave": "microwave.png",
  "microwave oven": "microwave.png",

  // Mixer related
  "mixer": "mixer.png",
  "hand mixer": "mixer.png",
  "stand mixer": "mixer.png",

  // Mobile related
  "mobile": "mobile.png",
  "smartphone": "mobile.png",
  "phone": "mobile.png",
  "mobile phone": "mobile.png",

  // Smartwatch related
  "smartwatch": "smartwatch.png",
  "smart watch": "smartwatch.png",
  "watch": "smartwatch.png",
  "smart watches": "smartwatch.png",

  // Tablet related
  "tablet": "tablet.png",
  "tablets": "tablet.png",
  "ipad": "tablet.png",

  // TV related
  "tv": "tv.png",
  "television": "tv.png",
  "smart tv": "tv.png",
  "led tv": "tv.png",

  // Washing Machine related
  "washing machine": "washing Machine.png",
  "washing machines": "washing Machine.png",
  "washer": "washing Machine.png",

  // Water Purifier related
  "water purifier": "waterpurifier.png",
  "water purifiers": "waterpurifier.png",
  "ro": "waterpurifier.png",
  "water filter": "waterpurifier.png",
};

// Function to get image based on subcategory name
const getSubcategoryImage = (subcategoryName) => {
  const name = subcategoryName.toLowerCase().trim();

  // Check for exact match first
  if (SUB_CATEGORY_IMAGES[name]) {
    return `/sub-categories/${SUB_CATEGORY_IMAGES[name]}`;
  }

  // Check for partial matches (if name contains keywords)
  for (const [key, image] of Object.entries(SUB_CATEGORY_IMAGES)) {
    if (name.includes(key) || key.includes(name)) {
      return `/sub-categories/${image}`;
    }
  }

  // Return null if no image found
  return null;
};

// Skeleton component for loading state - Normal Gray Color
const SubcategorySkeleton = () => (
  <section className="container mx-auto px-3 py-2">
    {/* Mobile Skeleton */}
    <div className="md:hidden">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2 px-2">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="flex flex-col items-center shrink-0">
            {/* Gray Circle - Mobile */}
            <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse" />
            
            {/* Text skeleton - Mobile */}
            <div className="mt-2 text-center w-20">
              <div className="h-3 w-16 mx-auto bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Desktop & Tablet Skeleton */}
    <div className="hidden md:block relative py-6 md:py-10">
      <div className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide px-2 py-4">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="flex flex-col items-center shrink-0 w-36 md:w-44 lg:w-48">
            {/* Gray Container - Desktop */}
            <div className="w-full aspect-square rounded-2xl md:rounded-[2rem] bg-gray-100 animate-pulse p-4 sm:p-6 lg:p-8 flex items-center justify-center">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-200" />
            </div>
            
            {/* Text skeleton - Desktop */}
            <div className="mt-3 text-center w-full px-1">
              <div className="h-4 w-3/4 mx-auto bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-1/2 mx-auto bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Skeleton Navigation Arrows */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
      </div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
      </div>
    </div>
  </section>
);

export function SubcategorySlider() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Fetch all categories and their subcategories
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const res = await categoryApi.getCategories();
        const data = res?.data || [];

        // Process categories and their subcategories
        const processedCategories = ensureArray(data).flatMap(cat => {
          const subcategoriesArray = ensureArray(cat.subcategories)
            .map(item => String(item).trim())
            .filter(item => item.length > 0);

          // Create an array of subcategory objects
          return subcategoriesArray.map((sub, index) => ({
            id: `${cat.id || cat._id}-sub-${index}`,
            name: sub,
            categorySlug: cat.slug || cat.name?.toLowerCase()?.replace(/\s+/g, '-') || 'category',
            href: `/products?category=${cat.slug || cat.name?.toLowerCase()?.replace(/\s+/g, '-')}&subcategory=${encodeURIComponent(sub)}`,
            // Get appropriate image based on subcategory name
            image: getSubcategoryImage(sub)
          }));
        });

        // Filter out categories without images (image === null)
        const categoriesWithImages = processedCategories.filter(cat => cat.image !== null);

        if (!cancelled) {
          setCategories(categoriesWithImages);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load subcategories', err);
        toast.error('Failed to load categories');
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, []);

  if (isLoading) {
    return <SubcategorySkeleton />;
  }

  if (categories.length === 0) {
    return null; // Don't show anything if no categories have images
  }

  return (
    <section className="container mx-auto px-3 py-2">
      {/* Mobile: Horizontal Scroll (Original Style) */}
      <div className="md:hidden">
        <div
          className="flex gap-2 overflow-x-auto scrollbar-hide py-2 px-2 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((subcategory) => (
            <Link
              key={subcategory.id}
              to={subcategory.href}
              className="group flex flex-col items-center shrink-0 hover:scale-105 transition-transform duration-300"
            >
              {/* Circle for mobile */}
              <div className="relative w-14 h-14 overflow-hidden transition-all duration-300">
                <img
                  src={subcategory.image}
                  alt={subcategory.name}
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              </div>

              {/* Subcategory name below image - mobile */}
              <div className="mt-2 text-center w-20">
                <p className="text-xs font-medium text-gray-700 group-hover:text-blue-600 transition-colors truncate">
                  {subcategory.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop & Tablet: Slider Layout (New Style) */}
      <div className="hidden md:block relative group/section py-6 md:py-10">
        {/* Navigation Arrows */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 shadow-lg border border-gray-100 p-2 rounded-full flex items-center justify-center opacity-0 group-hover/section:opacity-100 transition-opacity hover:bg-white"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>

        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 shadow-lg border border-gray-100 p-2 rounded-full flex items-center justify-center opacity-0 group-hover/section:opacity-100 transition-opacity hover:bg-white"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6 text-gray-700" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide px-2 py-4 scroll-smooth"
        >
          {categories.map((subcategory) => (
            <Link
              key={subcategory.id}
              to={subcategory.href}
              className="flex flex-col items-center shrink-0 w-36 md:w-44 lg:w-48 group transition-all duration-300 hover:translate-y-[-4px]"
            >
              {/* Card Container */}
              <div className="relative w-full aspect-square rounded-2xl md:rounded-[2rem] overflow-hidden bg-white border border-gray-100 shadow-sm group-hover:shadow-md transition-all duration-300 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
                <img
                  src={subcategory.image}
                  alt={subcategory.name}
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              </div>

              {/* Subcategory Label */}
              <div className="mt-3 text-center w-full px-1">
                <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors truncate">
                  {subcategory.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Custom Scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}