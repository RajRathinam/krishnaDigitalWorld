/**
 * CategoryGrid Component
 * 
 * Displays product categories in a responsive grid layout.
 * Fetches categories from API and displays them with images and hover effects.
 * 
 * Features:
 * - Fetches categories from API
 * - Responsive grid (2 cols mobile, 4 cols desktop)
 * - Loading skeletons
 * - Hover effects and animations
 * - Direct links to category product listings
 * - Error handling
 * 
 * @component
 * @returns {JSX.Element} Category grid component
 */

import { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { categoryApi } from '@/services/api';
import { Skeleton } from "@/components/ui/skeleton";
import { SplitHeading } from "@/components/ui/split-heading";
import { AlertCircle } from "lucide-react";
import { ChevronsUp } from "lucide-react";

// Category images - 4 images for 4 categories
const CATEGORY_IMAGES = [
  '/categories/electronic.PNG',
  '/categories/furniture.PNG',
  '/categories/home.PNG',
  '/categories/plastic.PNG',
];

// Maximum number of categories to display
const MAX_CATEGORIES = 4;

/**
 * Get category image by index (rotates through available images)
 * @param {number} categoryIndex - Index of the category
 * @returns {string} Image URL
 */
const getCategoryImage = (categoryIndex) => {
  return CATEGORY_IMAGES[categoryIndex % CATEGORY_IMAGES.length];
};

export function CategoryGrid() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let canceled = false;
    
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await categoryApi.getCategories();
        const data = res?.data || [];
        
        if (!canceled && Array.isArray(data)) {
          // Take only first 4 categories and assign images
          const categoriesWithImages = data
            .slice(0, MAX_CATEGORIES)
            .map((cat, index) => ({
              ...cat,
              image: cat.image || getCategoryImage(index),
              slug: cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-')
            }));
          
          setCategories(categoriesWithImages);
        } else if (!canceled) {
          setError('Invalid category data received');
        }
      } catch (err) {
        console.error('Failed to fetch categories for grid', err);
        if (!canceled) {
          setError('Failed to load categories. Please try again later.');
        }
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    };

    fetchCategories();
    return () => { canceled = true; };
  }, []);

  return (
    <section className="lg:py-16 bg-background">
      <div className="container p-3 sm:p-6 lg:p-8">
        {/* Section Header */}
        <div className="text-center mb-10 lg:mb-14">
          <SplitHeading 
            text="Browse by Category" 
            className="text-3xl md:text-4xl font-bold tracking-tight" 
          />
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            Explore our wide range of product categories
          </p>
        </div>

        {/* Categories Grid - Centered container */}
        <div className="max-w-7xl mx-auto flex justify-center">
          {loading ? (
            // Loading Skeletons - Square shape - Centered
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-2xl md:max-w-4xl">
              {Array.from({ length: MAX_CATEGORIES }).map((_, i) => (
                <div key={i} className="aspect-square">
                  <Skeleton className="w-full h-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : error ? (
            // Error State - Centered
            <div className="flex flex-col items-center justify-center py-12 max-w-2xl">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">{error}</p>
            </div>
          ) : categories.length === 0 ? (
            // Empty State - Centered
            <div className="flex flex-col items-center justify-center py-12 max-w-2xl">
              <p className="text-muted-foreground text-center">
                No categories available at the moment.
              </p>
            </div>
          ) : (
            // Categories Grid - Center aligned with max width
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-2xl md:max-w-4xl">
              {categories.map((cat, index) => (
                <div key={cat.id || index} className="group aspect-square">
                  <Link
                    to={`/category/${cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-')}`}
                    className="block h-full"
                    aria-label={`Browse ${cat.name} category`}
                  >
                    {/* Card Container - Square Shape */}
                    <div className="relative h-full rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
                      {/* Background Image */}
                      <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                        style={{ backgroundImage: `url(${cat.image})` }}
                      />
                      
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Chevron Up Icon - Centered */}
                      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 flex justify-center">
                        <ChevronsUp 
                          size={28} 
                          className="text-white/90 animate-bounce opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        />
                      </div>
                      
                      {/* Category Name - Centered at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
                        <h3 className="text-white font-semibold text-lg md:text-xl text-center transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                          {cat.name}
                        </h3>
                        <p className="text-white/80 text-sm text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                          Shop Now
                        </p>
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