/**
 * TrustBadges Component
 * 
 * Displays trust indicators, guarantees, and service highlights.
 * Builds customer confidence with social proof elements.
 * 
 * Features:
 * - Service badges (delivery, warranty, support, etc.)
 * - Icon-based design
 * - Hover effects
 * - Responsive grid
 * - Color-coded categories
 * 
 * @component
 * @returns {JSX.Element} Trust badges component
 */

import { Truck, Shield, Headphones, RefreshCw, CreditCard, Award } from "lucide-react";

// Trust badge data
const badges = [
    {
        icon: Truck,
        title: "Free Delivery",
        description: "On orders above ₹999",
        color: "from-blue-500 to-cyan-400",
        href: "/shipping-policy",
    },
    {
        icon: Shield,
        title: "Genuine Products",
        description: "100% Authentic",
        color: "from-green-500 to-emerald-400",
        href: "/our-promise",
    },
    {
        icon: RefreshCw,
        title: "Easy Returns",
        description: "7-day return policy",
        color: "from-orange-500 to-amber-400",
        href: "/return-policy",
    },
    {
        icon: CreditCard,
        title: "Secure Payment",
        description: "Multiple options",
        color: "from-purple-500 to-violet-400",
        href: "/help-support",
    },
    {
        icon: Headphones,
        title: "24/7 Support",
        description: "Dedicated helpline",
        color: "from-pink-500 to-rose-400",
        href: "/contact",
    },
    {
        icon: Award,
        title: "Brand Warranty",
        description: "Manufacturer warranty",
        color: "from-accent to-yellow-400",
        href: "/warranty-info",
    },
];

export function TrustBadges() {
    return (
        <section className="container mt-8 px-4 sm:px-6 lg:px-8">
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border/50 relative overflow-hidden">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-yellow-400/5 pointer-events-none" />
                
                {/* Badges Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 relative">
                    {badges.map((badge, index) => {
                        const IconComponent = badge.icon;
                        const BadgeContent = (
                            <div 
                                className="flex flex-col items-center text-center group cursor-pointer"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Icon */}
                                <div 
                                    className={`w-12 h-12 bg-gradient-to-br ${badge.color} rounded-full flex items-center justify-center mb-2 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300`}
                                >
                                    <IconComponent className="w-6 h-6 text-white" />
                                </div>
                                
                                {/* Title */}
                                <h3 className="font-medium text-foreground text-sm group-hover:text-accent transition-colors mb-1">
                                    {badge.title}
                                </h3>
                                
                                {/* Description */}
                                <p className="text-xs text-muted-foreground">
                                    {badge.description}
                                </p>
                            </div>
                        );

                        // Render as link if href provided, otherwise as div
                        return badge.href ? (
                            <a
                                key={badge.title}
                                href={badge.href}
                                className="no-underline"
                                aria-label={`${badge.title} - ${badge.description}`}
                            >
                                {BadgeContent}
                            </a>
                        ) : (
                            <div key={badge.title}>
                                {BadgeContent}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
