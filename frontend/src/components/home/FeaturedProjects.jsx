import { Gallery6 } from "@/components/ui/gallery6";
const featuredItems = [
    {
        id: "item-1",
        title: "Premium Smart TVs",
        summary: "Experience cinematic quality with our 4K Ultra HD smart TVs featuring voice control and smart home integration.",
        url: "/products?category=electronics&sub=tvs",
        image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&q=80",
    },
    {
        id: "item-2",
        title: "Modern Kitchen Appliances",
        summary: "Transform your cooking experience with energy-efficient refrigerators, smart ovens, and innovative kitchen gadgets.",
        url: "/products?category=home-appliances&sub=kitchen",
        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    },
    {
        id: "item-3",
        title: "Elegant Furniture",
        summary: "Discover handcrafted solid wood furniture that combines timeless design with exceptional durability.",
        url: "/products?category=furnitures",
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
    },
    {
        id: "item-4",
        title: "Smart Home Devices",
        summary: "Automate your home with intelligent devices that learn your preferences and save energy.",
        url: "/products?category=electronics&sub=smart-home",
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    },
    {
        id: "item-5",
        title: "Laundry Solutions",
        summary: "High-efficiency washing machines and dryers with advanced fabric care technology for perfect results.",
        url: "/products?category=home-appliances&sub=washing",
        image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&q=80",
    },
];
export function FeaturedProjects() {
    return (<Gallery6 heading="Featured Collections" demoUrl="/products" items={featuredItems}/>);
}
