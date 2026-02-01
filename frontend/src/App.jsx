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

// Import SplashScreen
import SplashScreen from "@/components/SplashScreen";

const queryClient = new QueryClient();

const App = () => {
  const [showSignup, setShowSignup] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const onOpen = () => setShowSignup(true);
    window.addEventListener('openSignup', onOpen);
    
    // Check if user is already logged in
    const checkAuthStatus = () => {
      const token = localStorage.getItem('authToken');
      const user = localStorage.getItem('user');
      
      // If user is already authenticated, don't show signup dialog
      if (token && user) {
        setShowSignup(false);
      } else {
        // Only show signup if user hasn't signed up before
        const hasSignedUp = localStorage.getItem('hasSignedUp');
        if (!hasSignedUp) {
          // Show signup dialog after a delay
          setTimeout(() => {
            setShowSignup(true);
          }); // 1 second delay after splash screen
        }
      }
      
      setIsCheckingAuth(false);
    };
    
    // Check auth after splash screen
    if (!showSplash) {
      checkAuthStatus();
    }
    
    return () => window.removeEventListener('openSignup', onOpen);
  }, [showSplash]);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  const handleSignupOpenChange = (open) => {
    setShowSignup(open);
    if (!open) {
      localStorage.setItem('hasSignedUp', 'true');
    }
  };

  // Don't render main app while checking auth or showing splash
  if (showSplash || isCheckingAuth) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SplashScreen onFinish={handleSplashFinish} />
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </QueryClientProvider>
    );
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
                
                {/* Only show signup dialog if user is not authenticated */}
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