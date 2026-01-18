import { Truck, Shield, Headphones, RefreshCw, CreditCard, Award } from "lucide-react";
const badges = [
    {
        icon: Truck,
        title: "Free Delivery",
        description: "On orders above ₹999",
        color: "from-blue-500 to-cyan-400",
    },
    {
        icon: Shield,
        title: "Genuine Products",
        description: "100% Authentic",
        color: "from-green-500 to-emerald-400",
    },
    {
        icon: RefreshCw,
        title: "No Returns",
        description: "No return policy",
        color: "from-orange-500 to-amber-400",
    },
    {
        icon: CreditCard,
        title: "Secure Payment",
        description: "Multiple options",
        color: "from-purple-500 to-violet-400",
    },
    {
        icon: Headphones,
        title: "24/7 Support",
        description: "Dedicated helpline",
        color: "from-pink-500 to-rose-400",
    },
    {
        icon: Award,
        title: "Brand Warranty",
        description: "Manufacturer warranty",
        color: "from-accent to-yellow-400",
    },
];
export function TrustBadges() {
    return (<section className="container mt-8">
      <div className="bg-card rounded-xl p-6 shadow-soft border border-border/50 relative overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-yellow-400/5 pointer-events-none"/>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 relative">
          {badges.map((badge, index) => (<div key={badge.title} className="flex flex-col items-center text-center group cursor-pointer" style={{ animationDelay: `${index * 50}ms` }}>
              <div className={`w-12 h-12 bg-gradient-to-br ${badge.color} rounded-full flex items-center justify-center mb-2 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300`}>
                <badge.icon className="w-6 h-6 text-white"/>
              </div>
              <h3 className="font-medium text-foreground text-sm group-hover:text-accent transition-colors">{badge.title}</h3>
              <p className="text-xs text-muted-foreground">{badge.description}</p>
            </div>))}
        </div>
      </div>
    </section>);
}
