import { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { categoryApi } from '@/services/api';
import { Skeleton } from "@/components/ui/skeleton";
import { SplitHeading } from "@/components/ui/split-heading";

// Only 4 image URLs for consistent styling
const CATEGORY_IMAGES = [
  'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600&h=600&fit=crop&auto=format', // Gift items
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&h=600&fit=crop&auto=format', // Valentine/Galentine
  'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&h=600&fit=crop&auto=format', // Aquarius/Home Decor
  'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&h=600&fit=crop&auto=format', // Kids
];

// Function to get image for category (rotates through 4 images)
const getCategoryImage = (categoryIndex) => {
  return CATEGORY_IMAGES[categoryIndex % CATEGORY_IMAGES.length];
};

export function CategoryGrid() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let canceled = false;
    
    const fetchCategories = async () => {
      try {
        const res = await categoryApi.getCategories();
        const data = res?.data || [];
        
        if (!canceled && Array.isArray(data)) {
          // Take only first 8 categories and assign images
          const categoriesWithImages = data.slice(0, 8).map((cat, index) => ({
            ...cat,
            image: getCategoryImage(index)
          }));
          
          setCategories(categoriesWithImages);
        }
      } catch (err) {
        console.error('Failed to fetch categories for grid', err);
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    fetchCategories();
    return () => { canceled = true; };
  }, []);

  return (
    <section className="py-12 lg:py-16">
      <div className="container px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 lg:mb-14">
            <SplitHeading text="Browse by Category" className="text-3xl md:text-4xl font-bold tracking-tight" />
          
        </div>

        {/* Categories Grid */}
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <Skeleton className="w-full aspect-square rounded-lg mb-3" />
                  <Skeleton className="h-5 w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {categories.map((cat, index) => (
                <div key={cat.id} className="group">
                  <Link
                    to={`/products?category=${cat.slug}`}
                    className="block"
                  >
                    {/* Card Container with Fixed Size */}
                    <div className="flex flex-col items-center p-3 sm:p-4 border border-gray-200 rounded-xl hover:border-yellow-300 hover:shadow-lg transition-all duration-300 bg-white h-full">
                      
                      {/* Fixed Size Image Container */}
                      <div className="relative w-full aspect-square mb-3 sm:mb-4 rounded-lg overflow-hidden bg-gray-50">
                        <img
                          src={getCategoryImage(index)}
                          alt={cat.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = getCategoryImage(index); // Fallback to same image
                          }}
                        />
                        
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>

                      {/* Category Name */}
                      <div className="text-center w-full">
                        <h3 className="font-medium text-gray-900 group-hover:text-yellow-600 transition-colors duration-300 text-sm sm:text-base line-clamp-2">
                          {cat.name}
                        </h3>
                        
                        {/* Hover Indicator */}
                        <div className="w-8 h-1 bg-yellow-500 mx-auto mt-2 sm:mt-3 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}

         
        </div>
      </div>
    </section>
  );
}