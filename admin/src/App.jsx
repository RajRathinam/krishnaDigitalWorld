import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminGuard from "./components/auth/AdminGuard";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";
// Import admin components (they're in /components not /components/admin)
import { AdminOverview } from "@/components/AdminOverview";
import { CustomerAnalytics } from "@/components/CustomerAnalytics";
import { CustomerDetails } from "@/components/CustomerDetails";
import { ProductManagement } from "@/components/ProductManagement";
import { OrderManagement } from "@/components/OrderManagement";
import { OrderDetails } from "@/components/OrderDetails";
import { BirthdayManagement } from "@/components/BirthdayManagement";
import { AdminSettings } from "@/components/AdminSettings";
import { HeroSliderManagement } from "@/components/HeroSliderManagement";
import AddBrand from "@/components/AddBrand";
import AddCategory from "@/components/AddCategory";

import "./index.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<AdminLogin />} />

              <Route path="/" element={<AdminGuard />}>
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
                  <Route path="hero-slider" element={<HeroSliderManagement />} />
                  <Route path="brands" element={<AddBrand />} />
                  <Route path="categories" element={<AddCategory />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
