"use client";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { categoryApi } from "@/services/api";
import { toast } from "sonner";

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

// Skeleton component for loading state
const SubcategorySkeleton = () => (
  <section className="container mx-auto px-3 py-2">
    {/* Mobile Skeleton */}
    <div className="md:hidden">
      <div className="flex gap-4 overflow-x-auto py-2 px-2">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="flex flex-col items-center shrink-0">
            <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
            <div className="mt-2 w-16 h-3 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>

    {/* Desktop Skeleton */}
    <div className="hidden md:block">
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6 py-4">
        {[...Array(12)].map((_, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="w-full aspect-square rounded-lg md:rounded-xl bg-gray-200 animate-pulse" />
            <div className="mt-3 w-3/4 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  </section>
);

export function SubcategorySlider() {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
        
        // Shuffle array to show random subcategories
        const shuffled = [...categoriesWithImages].sort(() => Math.random() - 0.5);
        
        if (!cancelled) {
          setCategories(shuffled);
          setFilteredCategories(shuffled.slice(0, 12));
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

  if (filteredCategories.length === 0) {
    return null; // Don't show anything if no categories have images
  }

  return (
    <section className="container mx-auto px-3 py-2">
      {/* Mobile: Horizontal Scroll */}
      <div className="md:hidden">
        <div
          id="mobile-subcategory-slider"
          className="flex gap-1 overflow-x-auto scrollbar-hide py-2 px-2 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filteredCategories.map((subcategory) => (
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
                <p className="text-xs font-medium text-gray-700 group-hover:text-accent transition-colors truncate">
                  {subcategory.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop & Tablet: Grid Layout */}
      <div className="hidden md:block">
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6 py-4">
          {filteredCategories.map((subcategory) => (
            <Link
              key={subcategory.id}
              to={subcategory.href}
              className="group flex flex-col items-center hover:scale-105 transition-transform duration-300"
            >
              {/* Square with rounded corners for desktop */}
              <div className="relative w-full aspect-square rounded-lg md:rounded-xl overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300">
                <img
                  src={subcategory.image}
                  alt={subcategory.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              
              {/* Subcategory name below image - desktop */}
              <div className="mt-3 text-center w-full px-2">
                <p className="text-sm font-medium text-gray-800 group-hover:text-accent transition-colors truncate">
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