import { Gallery4 } from "@/components/ui/gallery4";
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
];
export function BestSellers() {
    return (<Gallery4 title="Best Sellers" description="Our most popular products this week, loved by thousands of happy customers." items={bestSellerItems}/>);
}
