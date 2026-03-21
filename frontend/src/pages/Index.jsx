/**
 * Index Page - E-Commerce Home Page
 *
 * Advertisements are rendered at their configured positions:
 *  • homepage_top    → Slim banner immediately below the Header
 *  • homepage_middle → Cinematic carousel between BestSellers and PromoBanners
 *  • homepage_bottom → Compact carousel between BrandShowcase and BundleOffers
 *  • sidebar         → Fixed floating card on the right edge (always visible)
 *  • popup           → Session-modal shown 2 s after page load (once per session)
 */

import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

// Layout
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

// Home sections
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
  FeaturedProjects,
  AdvertisementCarousel,
} from "@/components/home";
import { SubcategorySlider } from "@/components/home";

const Index = () => {
  useEffect(() => {
    AOS.init({
      duration: 600,
      easing: "ease-out-cubic",
      once: true,
      offset: 50,
      disable: "mobile",
    });
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Header />

      {/* ── AD: homepage_top — slim dismissable banner below header ─────── */}
      <AdvertisementCarousel position="homepage_top" />

      <main className="relative">
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <HeroSlider />

        {/* ── Subcategory circles ─────────────────────────────────────────── */}
        <div data-aos="fade-up">
          <SubcategorySlider />
        </div>

        {/* ── Categories ──────────────────────────────────────────────────── */}
        <CategoryGrid />

        {/* ── Deal of the Day ─────────────────────────────────────────────── */}
        <div data-aos="fade-up">
          <DealOfTheDay />
        </div>

        {/* ── Best Sellers ────────────────────────────────────────────────── */}
        <div data-aos="fade-up" data-aos-delay="100">
          <BestSellers />
        </div>

        {/* ── AD: homepage_middle — cinematic video carousel ──────────────── */}
        <div data-aos="fade-up" data-aos-delay="50">
          <AdvertisementCarousel position="homepage_middle" />
        </div>

        {/* ── Promo Banners ───────────────────────────────────────────────── */}
        <div data-aos="fade-up" data-aos-delay="100">
          <PromoBanners />
        </div>

        {/* ── Product Showcase ────────────────────────────────────────────── */}
        <div data-aos="fade-up" data-aos-delay="100">
          <ProductShowcase />
        </div>

        {/* ── Featured Projects ───────────────────────────────────────────── */}
        <div data-aos="fade-up" data-aos-delay="100">
          <FeaturedProjects />
        </div>

        {/* ── Brand Showcase ──────────────────────────────────────────────── */}
        <div data-aos="fade-up" data-aos-delay="100">
          <BrandShowcase />
        </div>

        {/* ── AD: homepage_bottom — compact carousel before bundle offers ─── */}
        <div data-aos="fade-up" data-aos-delay="50">
          <AdvertisementCarousel position="homepage_bottom" />
        </div>

        {/* ── Bundle Offers ───────────────────────────────────────────────── */}
        <div data-aos="fade-up" data-aos-delay="100">
          <BundleOffers />
        </div>

        {/* ── Trust Badges ────────────────────────────────────────────────── */}
        <div data-aos="fade-up" data-aos-delay="100">
          <TrustBadges />
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <Footer />

      {/* ── AD: sidebar — fixed floating card, always visible ───────────── */}
      <AdvertisementCarousel position="sidebar" />

      {/* ── AD: popup — session modal shown 2 s after load ──────────────── */}
      <AdvertisementCarousel position="popup" />
    </div>
  );
};

export default Index;