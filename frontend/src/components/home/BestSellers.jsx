import { Gallery4 } from "@/components/ui/gallery4";
import { SplitHeading } from "@/components/ui/split-heading";
import { TrendingUp, Star } from "lucide-react";

const bestSellerItems = [
    {
        id: "ceiling-fan",
        title: "Bajaj 1200mm Ceiling Fan",
        description: "High-performance ceiling fan with energy-efficient motor and elegant design. Perfect for any room.",
        href: "/product/5",
        image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&h=400&fit=crop",
    },
    {
        id: "led-bulb",
        title: "Philips 9W LED Bulb Pack",
        description: "Energy-saving LED bulbs with bright white light. Pack of 4 for complete home lighting.",
        href: "/product/6",
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
    },
    {
        id: "induction",
        title: "Prestige Induction Cooktop",
        description: "Advanced induction cooking with precise temperature control and safety features.",
        href: "/product/7",
        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop",
    },
    {
        id: "otg",
        title: "Morphy Richards OTG 25L",
        description: "Versatile oven toaster griller for baking, grilling, and toasting. Perfect for modern kitchens.",
        href: "/product/8",
        image: "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=600&h=400&fit=crop",
    },
    {
        id: "mixer",
        title: "Butterfly Mixer Grinder 750W",
        description: "Powerful mixer grinder with multiple jars for all your blending and grinding needs.",
        href: "/product/9",
        image: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&h=400&fit=crop",
    },
    {
        id: "water-heater",
        title: "Havells Instant Water Heater",
        description: "3L instant water heater with advanced safety features and quick heating technology.",
        href: "/product/10",
        image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&h=400&fit=crop",
    },
    {
        id: "iron",
        title: "Philips Dry Iron",
        description: "Lightweight dry iron with non-stick coating and uniform heating.",
        href: "/product/11",
        image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&h=400&fit=crop",
    }
];

export function BestSellers() {
    return (
        <section className="py-12 md:py-20 relative overflow-hidden bg-muted/30">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />

            <div className="container relative z-10">
                <div className="flex items-center gap-3 mb-8 md:mb-12">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <SplitHeading text="Best Sellers" className="text-2xl md:text-3xl font-bold" />
                </div>

                <Gallery4
                    title=""
                    description="Our most popular products this week, loved by thousands of happy customers."
                    items={bestSellerItems}
                />
            </div>
        </section>
    );
}
