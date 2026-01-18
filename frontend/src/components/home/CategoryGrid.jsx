import { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { categoryApi } from '@/services/api';
import * as Icons from 'lucide-react';
// Mapping of category names to Lucide icons
const iconMap = {
  // Electronics
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
  // Home & Kitchen
  'kitchen': 'Utensils',
  'home': 'Home',
  'appliances': 'Refrigerator',
  'refrigerator': 'Refrigerator',
  'washing': 'WashingMachine',
  'microwave': 'Microwave',
  'furniture': 'Armchair',
  'lighting': 'Lamp',
  'decor': 'Palette',
  // Fashion
  'clothing': 'Shirt',
  'fashion': 'ShoppingBag',
  'shoes': 'Shoe',
  'watches': 'Watch',
  'jewelry': 'Gem',
  'accessories': 'Glasses',
  'bags': 'ShoppingBag',
  // General
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
  // Default fallbacks
  'default': 'Box',
  'unknown': 'Package'
};
// Helper function to get icon for category
const getCategoryIcon = (categoryName) => {
  if (!categoryName)
    return 'Package';
  const name = categoryName.toLowerCase();
  // Check exact matches
  if (iconMap[name])
    return iconMap[name];
  // Check partial matches
  for (const [key, icon] of Object.entries(iconMap)) {
    if (name.includes(key))
      return icon;
  }
  // Default icon
  return 'Package';
};
export function CategoryGrid() {
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const res = await categoryApi.getCategories();
        const data = res?.data || [];
        if (!canceled)
          setCategories(Array.isArray(data) ? data : []);
      }
      catch (err) {
        console.error('Failed to fetch categories for grid', err);
      }
    })();
    return () => { canceled = true; };
  }, []);
  return (<section className="py-10 sm:py-16 bg-gray-50 dark:bg-gray-900">
    <div className="container px-4 sm:px-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
        {categories.map((category) => {
          const IconName = getCategoryIcon(category.name);
          const Icon = Icons[IconName] || Icons.Package;
          return (<Link key={category.slug} to={`/products?category=${category.slug}`} className="block h-full">
            <div className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-accent dark:hover:border-accent hover:shadow-lg hover:shadow-accent/10 transition-all duration-300 overflow-hidden h-full">

              <div className="flex flex-col items-center p-4 sm:p-6 gap-3 sm:gap-4 h-full justify-center">

                {/* Icon */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-accent/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-accent/20 transition-all duration-300">
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-accent group-hover:scale-110 transition-transform duration-300 stroke-[1.5]" />
                </div>

                {/* Content */}
                <div className="text-center w-full">
                  <h3 className="text-gray-900 dark:text-gray-100 text-sm sm:text-base font-medium group-hover:text-accent transition-colors line-clamp-1">
                    {category.name}
                  </h3>
                  <p className="hidden sm:block text-xs text-gray-500 mt-1">Explore</p>
                </div>

              </div>
            </div>
          </Link>);
        })}
      </div>
    </div>
  </section>);
}
