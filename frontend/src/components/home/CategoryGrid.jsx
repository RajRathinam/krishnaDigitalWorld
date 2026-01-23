import { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { categoryApi } from '@/services/api';
import { Skeleton } from "@/components/ui/skeleton";
import * as Icons from 'lucide-react';

// Mapping of category names to Lucide icons
const iconMap = {
  'electronics': 'Cpu',
  'laptops': 'Laptop',
  'mobiles': 'Smartphone',
  'phones': 'Phone',
  'tablets': 'Tablet',
  'computers': 'Monitor',
  'gaming': 'Gamepad2',
  'audio': 'Headphones',
  'headphones': 'Headphones',
  'speakers': 'Speaker',
  'tv': 'Tv',
  'monitors': 'Monitor',
  'printers': 'Printer',
  'kitchen': 'Utensils',
  'home': 'Home',
  'appliances': 'Refrigerator',
  'refrigerator': 'Refrigerator',
  'washing': 'WashingMachine',
  'microwave': 'Microwave',
  'furniture': 'Armchair',
  'lighting': 'Lamp',
  'decor': 'Palette',
  'clothing': 'Shirt',
  'fashion': 'ShoppingBag',
  'shoes': 'Shoe',
  'watches': 'Watch',
  'jewelry': 'Gem',
  'accessories': 'Glasses',
  'bags': 'ShoppingBag',
  'gadgets': 'Smartphone',
  'tools': 'Wrench',
  'camera': 'Camera',
  'photography': 'Camera',
  'toys': 'ToyBrick',
  'books': 'BookOpen',
  'stationery': 'PenTool',
  'sports': 'Trophy',
  'fitness': 'Dumbbell',
  'health': 'Heart',
  'beauty': 'Sparkles',
  'automotive': 'Car',
  'grocery': 'ShoppingCart',
  'office': 'Briefcase',
  'education': 'GraduationCap',
  'default': 'Box',
  'unknown': 'Package'
};

const getCategoryIcon = (categoryName) => {
  if (!categoryName) return 'Package';
  const name = categoryName.toLowerCase();
  if (iconMap[name]) return iconMap[name];
  for (const [key, icon] of Object.entries(iconMap)) {
    if (name.includes(key)) return icon;
  }
  return 'Package';
};

export function CategoryGrid() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const res = await categoryApi.getCategories();
        const data = res?.data || [];
        if (!canceled) setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch categories for grid', err);
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => { canceled = true; };
  }, []);

  return (
    <section className="py-12 sm:py-20 relative overflow-hidden">
      {/* Background Decorative Blobs for this section */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none translate-x-1/2 -translate-y-1/2" />

      <div className="container px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {loading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-56 w-full rounded-3xl" />
            ))
          ) : (
            categories.map((cat) => {
              const IconName = getCategoryIcon(cat.name);
              const Icon = Icons[IconName] || Icons.Package;

              return (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.slug}`}
                  className="group relative flex flex-col items-center p-1 rounded-3xl transition-all duration-500 hover:shadow-2xl hover:shadow-accent/20 active:scale-95 touch-manipulation h-full"
                >
                  {/* Animated Gradient Border Layer - More Vivid */}
                  <div className="absolute inset-0 bg-gradient-to-br from-border/80 via-border/40 to-border/80 rounded-3xl group-hover:from-accent group-hover:via-amber-400 group-hover:to-orange-500 transition-all duration-700 opacity-60 group-hover:opacity-100" />

                  {/* Card Content Layer - Frostier Glass */}
                  <div className="relative flex flex-col items-center w-full h-full bg-card/85 backdrop-blur-xl rounded-[22px] p-5 overflow-hidden border border-white/20 dark:border-white/10">

                    {/* Background sheen effect */}
                    <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />

                    {/* Decorative Blob - Larger & Brighter */}
                    <div className="absolute -top-16 -right-16 w-40 h-40 bg-accent/30 rounded-full blur-3xl group-hover:bg-accent/40 transition-all duration-500 scale-0 group-hover:scale-110" />
                    <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all duration-500 scale-0 group-hover:scale-110" />

                    {/* Icon Container - Floating Effect */}
                    <div className="relative mb-6 p-5 rounded-2xl bg-gradient-to-br from-background to-secondary shadow-[0_8px_16px_rgba(0,0,0,0.1)] group-hover:shadow-[0_16px_32px_rgba(var(--accent),0.3)] transition-all duration-500 ring-1 ring-black/5 group-hover:ring-accent/40 group-hover:-translate-y-2">
                      <Icon className="w-8 h-8 md:w-10 md:h-10 text-foreground group-hover:text-accent transition-colors duration-500 stroke-[1.5]" />
                    </div>

                    {/* Text Content */}
                    <div className="relative z-10 w-full text-center flex flex-col items-center flex-1 justify-between gap-4">
                      <h3 className="font-bold text-base md:text-lg text-foreground group-hover:text-accent transition-colors duration-300 line-clamp-1 tracking-tight">
                        {cat.name}
                      </h3>

                      {/* Explore Button - Gradient Pill */}
                      <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground group-hover:text-white transition-all bg-secondary/80 py-2.5 px-5 rounded-full w-full group-hover:bg-gradient-to-r group-hover:from-accent group-hover:to-amber-500 shadow-sm group-hover:shadow-lg group-hover:shadow-accent/40 border border-transparent group-hover:border-white/20">
                        <span>Explore</span>
                        <Icons.ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
