/**
 * Index Page - E-Commerce Home Page
 * 
 * This is the main landing page of the e-commerce application.
 * It displays various sections including hero slider, categories, deals, 
 * best sellers, and featured products.
 * 
 * @component
 * @returns {JSX.Element} The home page component
 */

import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

// Layout Components
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

// Home Page Components - Import from centralized index
import {
  HeroSlider,
  CategoryGrid,
  DealOfTheDay,
  BestSellers,
  PromoBanners,
  ProductShowcase,
  TrustBadges,
  BrandShowcase,
  BundleOffers,
  FeaturedProjects
} from "@/components/home";

const Index = () => {
  /**
   * Initialize AOS (Animate On Scroll) library and handle signup modal
   */
  useEffect(() => {
    // Initialize AOS animations
    AOS.init({
      duration: 600,
      easing: "ease-out-cubic",
      once: true,
      offset: 50,
      disable: 'mobile' // Disable animations on mobile to prevent blank spaces
    });
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full">
      {/* Header Navigation */}
      <Header />

      {/* Main Content */}
      <main className="relative">
        {/* Hero Section - Full width banner with call-to-action */}
        <HeroSlider />

        {/* Category Grid - Browse products by category */}
        <CategoryGrid />

        {/* Deal of the Day - Time-limited offers */}
        <div data-aos="fade-up">
          <DealOfTheDay />
        </div>

        {/* Best Sellers - Most popular products */}
        <div data-aos="fade-up" data-aos-delay="100">
          <BestSellers />
        </div>

        {/* Promotional Banners - Marketing campaigns */}
        <div data-aos="fade-up" data-aos-delay="100">
          <PromoBanners />
        </div>

        {/* Product Showcase - Featured/Recommended products */}
        <div data-aos="fade-up" data-aos-delay="100">
          <ProductShowcase />
        </div>

        {/* Featured Projects - Showcase installations/case studies */}
        <div data-aos="fade-up" data-aos-delay="100">
          <FeaturedProjects />
        </div>

        {/* Brand Showcase - Featured brands */}
        <div data-aos="fade-up" data-aos-delay="100">
          <BrandShowcase />
        </div>

        {/* Bundle Offers - Special combo deals */}
        <div data-aos="fade-up" data-aos-delay="100">
          <BundleOffers />
        </div>

        {/* Trust Badges - Social proof and guarantees */}
        <div data-aos="fade-up" data-aos-delay="100">
          <TrustBadges />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
