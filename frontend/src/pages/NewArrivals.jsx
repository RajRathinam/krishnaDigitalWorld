import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from '@/hooks/use-toast';
export default function NewArrivals() {
    useEffect(() => {
        AOS.init({ duration: 600, easing: "ease-out-cubic", once: true, offset: 50 });
    }, []);
    const [newProducts, setNewProducts] = useState([]);
    useEffect(() => {
        let cancelled = false;
        import('@/services/api').then(({ productApi }) => {
            (async () => {
                try {
                    const res = await productApi.getProducts({ sortBy: 'createdAt', sortOrder: 'desc', limit: 12 });
                    const fetched = res.data?.products || res.products || res.data || res;
                    const list = Array.isArray(fetched) ? fetched : fetched.data || fetched.products || [];
                    if (!cancelled)
                        setNewProducts(list.slice(0, 12));
                }
                catch (err) {
                    console.error('Failed to load new arrivals', err);
                    toast.error(err?.message || 'Failed to load new arrivals');
                }
            })();
        });
        return () => { cancelled = true; };
    }, []);
    return (<div className="min-h-screen bg-background overflow-x-hidden pb-20 md:pb-0">
      <Header />
      
      <div className="bg-card border-b mt-4 border-border">
        <div className="container py-2 px-3 md:px-4">
          <nav className="text-xs md:text-sm text-muted-foreground">
            <Link to="/" className="hover:text-accent">Home</Link>
            <span className="mx-1.5 md:mx-2">›</span>
            <span className="text-foreground font-medium">New Arrivals</span>
          </nav>
        </div>
      </div>

      {/* Simple Banner */}
      <div className="container px-3 md:px-4 py-4 md:py-6">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-8 md:py-10 text-center">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary-foreground"/>
              <span className="text-primary-foreground/90 text-sm font-medium">Just Launched</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-primary-foreground mb-2">
              New Arrivals
            </h1>
            <p className="text-primary-foreground/80 text-sm md:text-base max-w-md mx-auto">
              Discover the latest products • Up to 25% off on new launches
            </p>
          </div>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/10 rounded-full -translate-y-1/2 translate-x-1/2"/>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-foreground/10 rounded-full translate-y-1/2 -translate-x-1/2"/>
        </div>
      </div>

      <div className="container py-4 md:py-6 px-3 md:px-4">
        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {newProducts.map((product, index) => (<Link key={product.id} to={`/product/${product.slug || product.id}`} className="block" data-aos="fade-up" data-aos-delay={Math.min(index * 50, 200)}>
              <ProductCard product={product} variant="compact"/>
            </Link>))}
        </div>
      </div>

      <Footer />
    </div>);
}
