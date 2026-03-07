import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { User, Package, Heart, LogOut, MapPin, ChevronRight, Ticket } from "lucide-react";

const menuItems = [
  { id: "profile", label: "Profile", icon: User, path: "/account/profile" },
  { id: "orders", label: "My Orders", icon: Package, path: "/account/orders" },
  { id: "coupons", label: "Coupons", icon: Ticket, path: "/account/coupons" },
  { id: "wishlist", label: "Wishlist", icon: Heart, path: "/account/wishlist" },
  { id: "addresses", label: "Addresses", icon: MapPin, path: "/account/addresses" },
];

export function AccountLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    // Set active tab based on current path
    const path = location.pathname;
    if (path.includes('/profile') || path === '/account') setActiveTab('profile');
    else if (path.includes('/orders')) setActiveTab('orders');
    else if (path.includes('/coupons')) setActiveTab('coupons');
    else if (path.includes('/wishlist')) setActiveTab('wishlist');
    else if (path.includes('/addresses')) setActiveTab('addresses');
  }, [location.pathname]);

  // Function to trigger signup dialog from homepage
  const triggerSignupDialog = () => {
    localStorage.setItem('forceSignup', 'true');
    navigate('/');
    setTimeout(() => {
      window.dispatchEvent(new Event('openSignup'));
    }, 500);
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/');
    toast({ title: 'Signed out successfully' });
  };

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">You're not signed in</h1>
          <p className="text-muted-foreground mb-6">Please sign in to access your account</p>
          <button
            onClick={triggerSignupDialog}
            className="bg-accent text-primary font-medium px-6 py-2 rounded-lg hover:bg-krishna-orange-hover transition-colors"
          >
            Sign in / Register
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-4 md:py-6 px-3 md:px-4">


        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="bg-card rounded-lg border border-border p-4 sticky top-24">
      <h2 className="text-lg font-bold text-foreground mb-4">My Account</h2>

              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-accent" />
                </div>
                <div className="overflow-hidden">
                  <p className="font-medium text-foreground truncate">{user?.name || 'User'}</p>
                  <p className="text-sm text-muted-foreground truncate">{user?.email || user?.phone || 'Account'}</p>
                </div>
              </div>

              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      activeTab === item.id
                        ? "bg-accent/10 text-accent font-medium"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                ))}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </nav>
            </div>
          </aside>

          {/* Mobile Tab Bar */}
          <div className="lg:hidden overflow-x-auto scrollbar-hide -mx-3 px-3">
            <div className="flex gap-2 pb-2">
              {menuItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                    activeTab === item.id
                      ? "bg-accent text-primary font-medium"
                      : "bg-card border border-border text-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleSignOut}
                className="flex bg-card border border-border text-destructive items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Main Content */}
          <main className="lg:col-span-9">
            <Outlet />
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}