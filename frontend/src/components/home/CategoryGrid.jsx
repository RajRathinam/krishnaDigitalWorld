// CategoryGrid.jsx (Updated - Dynamic from API)
import { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { categoryApi } from '@/services/api';
import { Skeleton } from "@/components/ui/skeleton";
import { SplitHeading } from "@/components/ui/split-heading";
import { AlertCircle, ChevronsUp } from "lucide-react";
import { getImageUrl } from '@/lib/utils';

// Maximum number of categories to display
const MAX_CATEGORIES = 4;

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
          // Filter only active categories and take first 4
          const activeCategories = data.filter(cat => cat.isActive === true);
          const categoriesWithImages = activeCategories
            .slice(0, MAX_CATEGORIES)
            .map(cat => ({
              ...cat,
              slug: cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-'),
              // Process image URL through getImageUrl
              imageUrl: cat.image ? getImageUrl(cat.image) : null
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

  // Fallback image for categories without images
  const getCategoryImage = (category) => {
    if (category.imageUrl) {
      return category.imageUrl;
    }
    // Generate a gradient based on category name for consistent fallback
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-red-500 to-red-600',
      'from-yellow-500 to-yellow-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
      'from-teal-500 to-teal-600'
    ];
    const colorIndex = (category.id || 0) % colors.length;
    return colors[colorIndex];
  };

  return (
    <section className="py-12 lg:py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
            // Loading Skeletons - Square shape
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: MAX_CATEGORIES }).map((_, i) => (
                <div key={i} className="aspect-square">
                  <Skeleton className="w-full h-full rounded-xl" />
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
            // Categories Grid - 2 cols on mobile, 4 cols on desktop
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {categories.map((cat) => (
                <div key={cat.id} className="group aspect-square">
                  <Link
                    to={`/category/${cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-')}`}
                    className="block h-full"
                    aria-label={`Browse ${cat.name} category`}
                  >
                    {/* Card Container - Square Shape */}
                    <div className="relative h-full rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                      {/* Background Image - Dynamic from API */}
                      {cat.imageUrl ? (
                        <img
                          src={cat.imageUrl}
                          alt={cat.name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            console.error('Failed to load category image:', cat.imageUrl);
                            e.target.style.display = 'none';
                            e.target.parentElement.style.background = `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`;
                          }}
                        />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryImage(cat)}`} />
                      )}

                      {/* Overlay for better text visibility */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-colors duration-300" />

                      {/* Category Name */}
                      <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
                        <h3 className="text-white text-sm sm:text-xl font-semibold tracking-wider text-center drop-shadow-lg">
                          {cat.name}
                        </h3>
                      </div>

                      {/* Chevron indicator - hidden on mobile, visible on hover on desktop */}
                      <div className="absolute bottom-12 left-0 right-0 z-10 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ChevronsUp size={24} className="text-white animate-bounce" />
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