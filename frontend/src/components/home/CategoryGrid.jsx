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

// Category placeholder images - rotates through these for visual variety
const CATEGORY_IMAGES = [
  'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600&h=600&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&h=600&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&h=600&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&h=600&fit=crop&auto=format',
];

// Maximum number of categories to display
const MAX_CATEGORIES = 8;

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
          // Take only first N categories and assign images
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
    <section className="py-12 lg:py-16 bg-background">
      <div className="container px-4 sm:px-6 lg:px-8">
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

        {/* Categories Grid */}
        <div className="max-w-7xl mx-auto">
          {loading ? (
            // Loading Skeletons
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: MAX_CATEGORIES }).map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <Skeleton className="w-full aspect-square rounded-lg mb-3" />
                  <Skeleton className="h-5 w-3/4" />
                </div>
              ))}
            </div>
          ) : error ? (
            // Error State
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">{error}</p>
            </div>
          ) : categories.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground text-center">
                No categories available at the moment.
              </p>
            </div>
          ) : (
            // Categories Grid
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {categories.map((cat, index) => (
                <div key={cat.id || index} className="group">
                  <Link
                    to={`/category/${cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-')}`}
                    className="block h-full"
                    aria-label={`Browse ${cat.name} category`}
                  >
                    {/* Card Container */}
                    <div className="flex flex-col items-center p-3 sm:p-4 border border-border rounded-xl hover:border-accent hover:shadow-lg transition-all duration-300 bg-card h-full">
                      {/* Image Container */}
                      <div className="relative w-full aspect-square mb-3 sm:mb-4 rounded-lg overflow-hidden bg-muted">
                        <img
                          src={cat.image}
                          alt={cat.name || 'Category'}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            e.target.src = getCategoryImage(index);
                          }}
                        />
                        
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>

                      {/* Category Name */}
                      <div className="text-center w-full">
                        <h3 className="font-medium text-foreground group-hover:text-accent transition-colors duration-300 text-sm sm:text-base line-clamp-2 min-h-[2.5em]">
                          {cat.name || 'Category'}
                        </h3>
                        
                        {/* Hover Indicator */}
                        <div className="w-8 h-1 bg-accent mx-auto mt-2 sm:mt-3 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* View All Categories Link (if more than MAX_CATEGORIES exist) */}
        {!loading && !error && categories.length > 0 && (
          <div className="text-center mt-8">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
            >
              View All Categories
              <span>→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
