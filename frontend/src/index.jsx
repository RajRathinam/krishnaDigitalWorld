/**
 * Main Entry Point for E-Commerce Frontend
 * 
 * This file serves as the central export point for all components,
 * making imports cleaner and more organized throughout the application.
 */

// ==================== Layout Components ====================
export { Header } from './components/layout/Header';
export { Footer } from './components/layout/Footer';
export { MobileBottomNav } from './components/layout/MobileBottomNav';

// ==================== Home Page Components ====================
export { HeroSlider } from './components/home/HeroSlider';
export { CategoryGrid } from './components/home/CategoryGrid';
export { DealOfTheDay } from './components/home/DealOfTheDay';
export { BestSellers } from './components/home/BestSellers';
export { PromoBanners } from './components/home/PromoBanners';
export { ProductShowcase } from './components/home/ProductShowcase';
export { TrustBadges } from './components/home/TrustBadges';
export { BrandShowcase } from './components/home/BrandShowcase';
export { BundleOffers } from './components/home/BundleOffers';
export { FeaturedProjects } from './components/home/FeaturedProjects';
export { SignupDialog } from './components/home/SignupDialog';

// ==================== Product Components ====================
export { ProductCard } from './components/product/ProductCard';
export { FloatingContactButtons } from './components/product/FloatingContactButtons';

// ==================== Auth Components ====================
export { default as CustomerGuard } from './components/auth/CustomerGuard';

// ==================== Content Pages ====================
export { default as Careers } from './components/contentPages/Careers';
export { default as Contact } from './components/contentPages/Contact';
export { default as HelpSupport } from './components/contentPages/HelpSupport';
export { default as InstallationSupport } from './components/contentPages/InstallationSupport';
export { default as OurPromise } from './components/contentPages/OurPromise';
export { default as PrivacyPolicy } from './components/contentPages/PrivacyPolicy';
export { default as RefundPolicy } from './components/contentPages/RefundPolicy';
export { default as ReturnPolicy } from './components/contentPages/ReturnPolicy';
export { default as ShippingPolicy } from './components/contentPages/ShippingPolicy';
export { default as TermsConditions } from './components/contentPages/TermsConditions';
export { default as WarrantyInfo } from './components/contentPages/WarrantyInfo';

// ==================== Pages ====================
export { default as Index } from './pages/Index';
export { default as ProductListing } from './pages/ProductListing';
export { default as ProductDetail } from './pages/ProductDetail';
export { default as Cart } from './pages/Cart';
export { default as Checkout } from './pages/Checkout';
export { default as Account } from './pages/Account';
export { default as Help } from './pages/Help';
export { default as NotFound } from './pages/NotFound';
export { default as TodaysDeals } from './pages/TodaysDeals';
export { default as NewArrivals } from './pages/NewArrivals';
export { default as BestSellersPage } from './pages/BestSellers';
export { default as AboutUs } from './pages/AboutUs';

// ==================== Contexts ====================
export { AuthProvider, useAuth } from './contexts/AuthContext';
export { CartProvider, useCart } from './contexts/CartContext';

// ==================== Hooks ====================
export { useMediaQuery } from './hooks/use-media-query';
export { useMobile } from './hooks/use-mobile';
export { useToast } from './hooks/use-toast';

// ==================== Utilities ====================
export { ScrollToTop } from './components/ScrollToTop';
export { NavLink } from './components/NavLink';

// ==================== Services ====================
export * from './services/api';

// ==================== Config ====================
export { baseUrl } from './config/baseUrl';

// ==================== Utils ====================
export * from './lib/utils';
export * from './lib/api';

