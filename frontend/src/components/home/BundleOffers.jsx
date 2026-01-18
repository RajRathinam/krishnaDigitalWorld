import { Package, Percent, Gift, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SplitHeading } from "@/components/ui/split-heading";
const bundleOffers = [
    {
        id: 1,
        title: "Kitchen Starter Pack",
        description: "Mixer + Toaster + Kettle",
        originalPrice: 12999,
        bundlePrice: 8999,
        discount: 31,
        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
        gradient: "from-orange-500 to-red-500",
        icon: Sparkles,
    },
    {
        id: 2,
        title: "Home Office Bundle",
        description: "Desk Lamp + Organizer + Fan",
        originalPrice: 8499,
        bundlePrice: 5999,
        discount: 29,
        image: "https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=400&h=300&fit=crop",
        gradient: "from-blue-500 to-cyan-500",
        icon: Gift,
    },
    {
        id: 3,
        title: "Living Room Combo",
        description: "LED TV + Soundbar + Stand",
        originalPrice: 45999,
        bundlePrice: 34999,
        discount: 24,
        image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=300&fit=crop",
        gradient: "from-purple-500 to-pink-500",
        icon: Package,
    },
    {
        id: 4,
        title: "Summer Cool Pack",
        description: "AC + Air Cooler + Fan",
        originalPrice: 52999,
        bundlePrice: 39999,
        discount: 25,
        image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=300&fit=crop",
        gradient: "from-emerald-500 to-teal-500",
        icon: Percent,
    },
];
export function BundleOffers() {
    const navigate = useNavigate();
    const formatPrice = (price) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(price);
    };
    return (<section className="w-full py-12 md:py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <SplitHeading text="Bundle Offers" as="h2" className="text-2xl md:text-3xl font-heading mb-3"/>
          <p className="text-muted-foreground">Save more when you buy together</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bundleOffers.map((bundle, index) => {
            const IconComp = bundle.icon;
            return (<div key={bundle.id} className="group relative bg-card rounded-2xl overflow-hidden border border-border/60 hover:border-accent/50 transition-all duration-500 hover:shadow-xl hover:shadow-accent/10 cursor-pointer animate-slide-up" style={{ animationDelay: `${index * 100}ms` }} onClick={() => navigate(`/products?bundle=${bundle.id}`)}>
                {/* Discount Badge */}
                <div className={`absolute top-4 right-4 z-10 bg-gradient-to-r ${bundle.gradient} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg`}>
                  {bundle.discount}% OFF
                </div>

                {/* Image */}
                <div className="relative h-40 overflow-hidden">
                  <img src={bundle.image} alt={bundle.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
                  <div className={`absolute inset-0 bg-gradient-to-t ${bundle.gradient} opacity-20 group-hover:opacity-30 transition-opacity`}/>
                  
                  {/* Floating Icon */}
                  <div className={`absolute bottom-4 left-4 w-12 h-12 rounded-xl bg-gradient-to-br ${bundle.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                    <IconComp className="w-6 h-6 text-white"/>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-1 group-hover:text-accent transition-colors">
                    {bundle.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {bundle.description}
                  </p>

                  {/* Pricing */}
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground line-through block">
                        {formatPrice(bundle.originalPrice)}
                      </span>
                      <span className="text-xl font-bold text-foreground">
                        {formatPrice(bundle.bundlePrice)}
                      </span>
                    </div>
                    <button className={`flex items-center gap-1 text-sm font-medium bg-gradient-to-r ${bundle.gradient} text-white px-4 py-2 rounded-lg group-hover:shadow-lg transition-all duration-300`}>
                      Shop
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
                    </button>
                  </div>
                </div>

                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500">
                  <div className="absolute inset-0 animate-shimmer"/>
                </div>
              </div>);
        })}
        </div>
      </div>
    </section>);
}
