import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import { AuthProvider } from "@/contexts/AuthContext";
import CustomerGuard from "@/components/auth/CustomerGuard";
import AdminGuard from "./components/auth/AdminGuard";
import AboutUs from "./pages/AboutUs";
import BestSellersPage from "./pages/BestSellers";
import { MobileBottomNav } from "./components/layout/MobileBottomNav";
import { ScrollToTop } from "./components/ScrollToTop";
import { SignupDialog } from "@/components/home/SignupDialog";
import { CartProvider } from '@/contexts/CartContext';
import { LoaderProvider } from '@/contexts/LoaderContext';
import { GlobalLoader } from '@/components/ui/GlobalLoader';

// Import admin components
import { AdminOverview } from "@/components/admin/AdminOverview";
import { CustomerAnalytics } from "@/components/admin/CustomerAnalytics";
import { CustomerDetails } from "@/components/admin/CustomerDetails";
import { ProductManagement } from "@/components/admin/ProductManagement";
import { OrderManagement } from "@/components/admin/OrderManagement";
import { OrderDetails } from "@/components/admin/OrderDetails";
import { BirthdayManagement } from "@/components/admin/BirthdayManagement";
import { AdminSettings } from "@/components/admin/AdminSettings";
import AddBrand from "@/components/admin/AddBrand";
import AddCategory from "@/components/admin/AddCategory";

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

  useEffect(() => {
    const onOpen = () => setShowSignup(true);
    window.addEventListener('openSignup', onOpen);
    return () => window.removeEventListener('openSignup', onOpen);
  }, []);

  const handleSignupOpenChange = (open) => {
    setShowSignup(open);
    if (!open) {
      localStorage.setItem('hasSignedUp', 'true');
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <ScrollToTop />
          <CartProvider>
            <AuthProvider>
              <LoaderProvider>
                <GlobalLoader />
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

                  <Route path="/admin/login" element={<AdminLogin />} />

                  {/* Admin layout with nested routes */}
                  <Route path="/admin" element={<AdminGuard />}>
                    <Route element={<Admin />}>
                      <Route index element={<Navigate to="overview" replace />} />
                      <Route path="overview" element={<AdminOverview />} />
                      <Route path="analytics" element={<CustomerAnalytics />} />
                      <Route path="analytics/customers/:id" element={<CustomerDetails />} />
                      <Route path="products" element={<ProductManagement />} />
                      <Route path="orders" element={<OrderManagement />} />
                      <Route path="orders/:id" element={<OrderDetails />} />
                      <Route path="birthdays" element={<BirthdayManagement />} />
                      <Route path="settings" element={<AdminSettings />} />
                      <Route path="brands" element={<AddBrand />} />
                      <Route path="categories" element={<AddCategory />} />
                    </Route>
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
                <MobileBottomNav />
                <SignupDialog open={showSignup} onOpenChange={handleSignupOpenChange} />
              </LoaderProvider>
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
