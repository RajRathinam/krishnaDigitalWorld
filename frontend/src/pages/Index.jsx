import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSlider } from "@/components/home/HeroSlider";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { DealOfTheDay } from "@/components/home/DealOfTheDay";
import { BestSellers } from "@/components/home/BestSellers";
import { PromoBanners } from "@/components/home/PromoBanners";
import { ProductShowcase } from "@/components/home/ProductShowcase";
import { TrustBadges } from "@/components/home/TrustBadges";
import { BrandShowcase } from "@/components/home/BrandShowcase";
import { BundleOffers } from "@/components/home/BundleOffers";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
const Index = () => {
    useEffect(() => {
        AOS.init({
            duration: 600,
            easing: "ease-out-cubic",
            once: true,
            offset: 50,
        });
        // If the user hasn't seen the signup modal yet, ask the app to open it after a short delay
        const hasSignedUp = localStorage.getItem("hasSignedUp");
        if (!hasSignedUp) {
            const timer = setTimeout(() => {
                window.dispatchEvent(new Event('openSignup'));
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, []);
    return (<div className="min-h-screen bg-background overflow-x-hidden w-full">
      <Header />
      
      <main>
        <HeroSlider />
        <CategoryGrid />
        
        <div data-aos="fade-up">
          <DealOfTheDay />
        </div>
        
        <div data-aos="fade-up" data-aos-delay="100">
          <BestSellers />
        </div>
        
        <div data-aos="fade-up" data-aos-delay="100">
          <PromoBanners />
        </div>
        
        <div data-aos="fade-up" data-aos-delay="100">
          <ProductShowcase />
        </div>

        <div data-aos="fade-up" data-aos-delay="100">
          <FeaturedProjects />
        </div>
        
        <div data-aos="fade-up" data-aos-delay="100">
          <BrandShowcase />
        </div>

        <div data-aos="fade-up" data-aos-delay="100">
          <BundleOffers />
        </div>
        
        <div data-aos="fade-up" data-aos-delay="100">
          <TrustBadges />
        </div>
      </main>

      <Footer />
    </div>);
};
export default Index;
