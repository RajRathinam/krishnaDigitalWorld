// CategoryGrid.jsx (Updated - Dynamic from API)
import { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { categoryApi } from '@/services/api';
import { Skeleton } from "@/components/ui/skeleton";
import { SplitHeading } from "@/components/ui/split-heading";
import { AlertCircle, ChevronsUp } from "lucide-react";

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
                    <div className="relative h-full rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
                      {/* Background Image - Dynamic from API */}
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                        style={{
                          backgroundImage: `url(${cat.image || '/categories/placeholder.jpg'})`
                        }}
                      />

                      {/* Overlay for better text visibility */}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />



                      {/* Chevron indicator */}
                      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 flex justify-center">
                        <ChevronsUp size={28} className="text-white animate-bounce" />
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