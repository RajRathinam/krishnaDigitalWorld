import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ProductListing from "./pages/ProductListing";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Account from "./pages/Account";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import TodaysDeals from "./pages/TodaysDeals";
import NewArrivals from "./pages/NewArrivals";
import { AuthProvider } from "@/contexts/AuthContext";
import CustomerGuard from "@/components/auth/CustomerGuard";
import AboutUs from "./pages/AboutUs";
import BestSellersPage from "./pages/BestSellers";
import { MobileBottomNav } from "./components/layout/MobileBottomNav";
import { ScrollToTop } from "./components/ScrollToTop";
import { SignupDialog } from "@/components/home/SignupDialog";
import { CartProvider } from '@/contexts/CartContext';
import { ShopInfoProvider } from '@/contexts/ShopInfoContext';

// Import new policy pages
import Careers from "@/components/contentPages/Careers";
import OurPromise from "@/components/contentPages/OurPromise";
import PrivacyPolicy from "@/components/contentPages/PrivacyPolicy";
import Contact from "@/components/contentPages/Contact";
import TermsConditions from "@/components/contentPages/TermsConditions";
import ShippingPolicy from "@/components/contentPages/ShippingPolicy";
import RefundPolicy from "@/components/contentPages/RefundPolicy";
import ReturnPolicy from "@/components/contentPages/ReturnPolicy";
import HelpSupport from "@/components/contentPages/HelpSupport";
import WarrantyInfo from "@/components/contentPages/WarrantyInfo";
import InstallationSupport from "@/components/contentPages/InstallationSupport";

const queryClient = new QueryClient();

const App = () => {
  const [showSignup, setShowSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const onOpen = () => setShowSignup(true);
    window.addEventListener('openSignup', onOpen);
    
    // Show loader for 2 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => {
      window.removeEventListener('openSignup', onOpen);
      clearTimeout(timer);
    };
  }, []);

  const handleSignupOpenChange = (open) => {
    setShowSignup(open);
    if (!open) {
      localStorage.setItem('hasSignedUp', 'true');
    }
  };

  // Loader Component
  const Loader = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center justify-center">
        {/* Logo from public folder */}
        <img 
          src="/SK_Logo.png" 
          alt="Loading..." 
          className="h-10 md:h-16 w-auto animate-pulse"
        />
      </div>
    </div>
  );

  if (isLoading) {
    return <Loader />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <ScrollToTop />
          <CartProvider>
            <AuthProvider>
              <ShopInfoProvider>
                <Routes>
                  {/* Customer-only routes */}
                  <Route element={<CustomerGuard />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/products" element={<ProductListing />} />
                    <Route path="/category/:category" element={<ProductListing />} />
                    <Route path="/product/:slug" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/account" element={<Account />} />
                    <Route path="/help" element={<Help />} />
                    <Route path="/deals" element={<TodaysDeals />} />
                    <Route path="/new-arrivals" element={<NewArrivals />} />
                    <Route path="/best-sellers" element={<BestSellersPage />} />
                    <Route path="/about-us" element={<AboutUs />} />

                    {/* New footer pages */}
                    <Route path="/careers" element={<Careers />} />
                    <Route path="/our-promise" element={<OurPromise />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-conditions" element={<TermsConditions />} />
                    <Route path="/shipping-policy" element={<ShippingPolicy />} />
                    <Route path="/refund-policy" element={<RefundPolicy />} />
                    <Route path="/return-policy" element={<ReturnPolicy />} />
                    <Route path="/help-support" element={<HelpSupport />} />
                    <Route path="/warranty-info" element={<WarrantyInfo />} />
                    <Route path="/installation-support" element={<InstallationSupport />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
                <MobileBottomNav />
                <SignupDialog open={showSignup} onOpenChange={handleSignupOpenChange} />
              </ShopInfoProvider>
            </AuthProvider>
          </CartProvider>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;