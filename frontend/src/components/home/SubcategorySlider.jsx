"use client";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { categoryApi } from "@/services/api";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getImageUrl } from "@/lib/utils"; // IMPORT THIS

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

const ensureObject = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
  } catch (e) {
    return {};
  }
};

// Skeleton component for loading state
const SubcategorySkeleton = () => (
  <section className="container mx-auto px-3 py-2">
    {/* Mobile Skeleton */}
    <div className="md:hidden">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2 px-2">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="flex flex-col items-center shrink-0">
            <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse" />
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
            <div className="w-full aspect-square rounded-2xl md:rounded-[2rem] bg-gray-100 animate-pulse p-4 sm:p-6 lg:p-8 flex items-center justify-center">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-200" />
            </div>
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
  const [subcategories, setSubcategories] = useState([]);
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

  // Fetch all categories and their subcategory images from database
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const res = await categoryApi.getCategories();
        const data = res?.data || [];

        // Process categories and their subcategory images from database
        const processedSubcategories = ensureArray(data).flatMap(cat => {
          const subcategoriesArray = ensureArray(cat.subcategories)
            .map(item => String(item).trim())
            .filter(item => item.length > 0);
          
          const subcategoryImages = ensureObject(cat.subcategoryImages);

          // Create an array of subcategory objects with their database images
          return subcategoriesArray
            .map((sub, index) => {
              const imagePath = subcategoryImages[sub];
              
              // Only include subcategories that have an image in the database
              if (!imagePath) return null;
              
              return {
                id: `${cat.id || cat._id}-sub-${index}`,
                name: sub,
                categorySlug: cat.slug || cat.name?.toLowerCase()?.replace(/\s+/g, '-') || 'category',
                href: `/products?category=${cat.slug || cat.name?.toLowerCase()?.replace(/\s+/g, '-')}&subcategory=${encodeURIComponent(sub)}`,
                // Use the image from database with getImageUrl
                image: getImageUrl(imagePath)
              };
            })
            .filter(Boolean); // Remove null entries
        });

        if (!cancelled) {
          console.log('Loaded subcategories with images:', processedSubcategories.length);
          setSubcategories(processedSubcategories);
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

  if (subcategories.length === 0) {
    return null; // Don't show anything if no subcategories have images
  }

  return (
    <section className="container mx-auto px-3 py-2">
      {/* Mobile: Horizontal Scroll */}
      <div className="md:hidden">
        <div
          className="flex gap-2 overflow-x-auto scrollbar-hide py-2 px-2 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {subcategories.map((subcategory) => (
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
                  onError={(e) => {
                    console.error('Failed to load image:', subcategory.image);
                    // Fallback to a placeholder
                    e.target.src = '/placeholder-image.png';
                    e.target.onerror = null; // Prevent infinite loop
                  }}
                />
              </div>

              {/* Subcategory name below image */}
              <div className="mt-2 text-center w-20">
                <p className="text-xs font-medium text-gray-700 group-hover:text-blue-600 transition-colors truncate">
                  {subcategory.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop & Tablet: Slider Layout */}
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
          {subcategories.map((subcategory) => (
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
                  onError={(e) => {
                    console.error('Failed to load image:', subcategory.image);
                    // Fallback to a placeholder
                    e.target.src = '/placeholder-image.png';
                    e.target.onerror = null; // Prevent infinite loop
                  }}
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