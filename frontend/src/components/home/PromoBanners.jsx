import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
const banners = [
    {
        title: "TV Upgrade Sale",
        subtitle: "Smart TVs from ₹12,999",
        bgGradient: "from-indigo-600 via-purple-600 to-pink-500",
        href: "/products?category=electronics&sub=tvs",
    },
    {
        title: "Beat the Heat",
        subtitle: "ACs & Coolers on Sale",
        bgGradient: "from-cyan-500 via-blue-500 to-indigo-500",
        href: "/products?category=home-appliances&sub=acs",
    },
    {
        title: "Kitchen Makeover",
        subtitle: "Up to 60% Off",
        bgGradient: "from-orange-500 via-amber-500 to-yellow-400",
        href: "/products?category=kitchen",
    },
    {
        title: "Laundry Days",
        subtitle: "Washing Machines Deal",
        bgGradient: "from-violet-500 via-purple-500 to-fuchsia-500",
        href: "/products?category=home-appliances&sub=washing",
    },
];
export function PromoBanners() {
    return (<section className="py-8 md:py-12">
      <div className="container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {banners.map((banner, index) => (<Link key={banner.title} to={banner.href} className={`group relative bg-gradient-to-br ${banner.bgGradient} rounded-xl p-4 md:p-6 text-white overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`} style={{ animationDelay: `${index * 100}ms` }}>
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"/>
              
              {/* Content */}
              <div className="relative z-10">
                <h3 className="font-display font-semibold text-base md:text-xl mb-1">{banner.title}</h3>
                <p className="text-sm text-white/85 mb-3">{banner.subtitle}</p>
                <span className="inline-flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all duration-300">
                  Shop now <ArrowRight className="w-4 h-4"/>
                </span>
              </div>
              
              {/* Decorative circles */}
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full"/>
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-white/10 rounded-full"/>
            </Link>))}
        </div>
      </div>
    </section>);
}
