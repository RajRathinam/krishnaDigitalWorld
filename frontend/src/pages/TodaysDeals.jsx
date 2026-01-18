import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { Clock, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from '@/hooks/use-toast';
export default function TodaysDeals() {
    useEffect(() => {
        AOS.init({ duration: 600, easing: "ease-out-cubic", once: true, offset: 50 });
    }, []);
    const [dealProducts, setDealProducts] = useState([]);
    useEffect(() => {
        let cancelled = false;
        import('@/services/api').then(({ productApi }) => {
            (async () => {
                try {
                    const res = await productApi.getFeaturedProducts();
                    const fetched = res.data || res.products || res.data?.data || res;
                    if (!cancelled)
                        setDealProducts(Array.isArray(fetched) ? fetched : fetched.data || fetched.products || []);
                }
                catch (err) {
                    console.error('Failed to load deals', err);
                    toast.error(err?.message || 'Failed to load deals');
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
            <span className="text-foreground font-medium">Today's Deals</span>
          </nav>
        </div>
      </div>

      <div className="container py-6 md:py-8 px-3 md:px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6" data-aos="fade-up">
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
            <Zap className="w-6 h-6 text-accent"/>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display text-foreground">Today's Deals</h1>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-4 h-4 text-destructive"/>
              <span className="text-sm text-destructive font-medium">Deals refresh in 05:23:45</span>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {dealProducts.map((product, index) => (<Link key={product.id} to={`/product/${product.slug || product.id}`} className="block" data-aos="fade-up" data-aos-delay={Math.min(index * 50, 200)}>
              <ProductCard product={product} variant="compact"/>
            </Link>))}
        </div>
      </div>

      <Footer />
    </div>);
}
