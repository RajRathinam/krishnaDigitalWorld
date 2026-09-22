import { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AdminCollapsibleSidebar } from "@/components/AdminCollapsibleSidebar";
import { Bell, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Store } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { PageSkeleton } from "@/components/skeletons/PageSkeleton";
const Admin = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Persist sidebar state
    useEffect(() => {
        const savedState = localStorage.getItem("adminSidebarCollapsed");
        if (savedState) setIsSidebarCollapsed(savedState === "true");
    }, []);

    const toggleSidebar = () => {
        const newState = !isSidebarCollapsed;
        setIsSidebarCollapsed(newState);
        localStorage.setItem("adminSidebarCollapsed", String(newState));
    };

    const handleLogout = async () => {
        try {
            if (user?.logout) {
                await user.logout();
            } else {
                localStorage.removeItem('authToken');
                window.dispatchEvent(new Event('authChanged'));
            }
            toast({
                title: 'Logged out',
                description: 'You have been signed out successfully.'
            });
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            toast({ title: 'Logout failed', variant: 'destructive' });
        }
    };

    const getUserInitials = () => {
        if (user?.name) {
            return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        return 'AD';
    };

    const getUserDisplayName = () => {
        if (user?.name) return user.name;
        if (user?.email) return user.email.split('@')[0];
        return 'Admin';
    };

    if (loading) {
        return <PageSkeleton />;
    }

    const getPageTitle = () => {
        const path = location.pathname;
        if (path.includes('/overview'))
            return "Dashboard Overview";
        if (path.includes('/analytics'))
            return "Customer Analytics";
        if (path.includes('/products'))
            return "Product Management";
        if (path.includes('/orders'))
            return "Order Management";
        if (path.includes('/birthdays'))
            return "Birthday Center";
        if (path.includes('/user-coupons'))
            return "User Coupon Management";
        if (path.includes('/settings'))
            return "Settings";
        if (path.includes('/hero-slider'))
            return "Hero Slider";
        if (path.includes('/brands'))
            return "Brands";
        if (path.includes('/categories'))
            return "Categories";
        if (path.includes('/gifts'))
            return "Gifts";
        return "Dashboard";
    };
    const getActiveSection = () => {
        const path = location.pathname;
        if (path.includes('/overview'))
            return 'overview';
        if (path.includes('/analytics'))
            return 'analytics';
        if (path.includes('/products'))
            return 'products';
        if (path.includes('/orders'))
            return 'orders';
        if (path.includes('/birthdays'))
            return 'birthdays';
        if (path.includes('/user-coupons'))
            return 'user-coupons';
        if (path.includes('/settings'))
            return 'settings';
        if (path.includes('/hero-slider'))
            return 'hero-slider';
        if (path.includes('/brands'))
            return 'brands';
        if (path.includes('/categories'))
            return 'categories';
        if (path.includes('/gifts'))
            return 'gifts';
        return 'overview';
    };
    return (<div className="min-h-screen bg-muted/40">
        {/* Collapsible Sidebar */}
        <AdminCollapsibleSidebar
            activeSection={getActiveSection()}
            showFooter={false}
            isCollapsed={isSidebarCollapsed}
            toggleSidebar={toggleSidebar}
        />

        {/* Main content area with dynamic left margin */}
        <div className={`transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'ml-[60px]' : 'ml-64'}`}>
            {/* Top bar */}
            <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-3 flex items-center justify-between shadow-sm">
                <h1 className="text-lg font-semibold">{getPageTitle()}</h1>

                <div className="flex items-center gap-4 ml-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center gap-2 px-2 py-1.5 h-auto">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-primary text-primary-foreground">{getUserInitials()}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start overflow-hidden hidden sm:flex">
                                    <span className="text-sm font-medium truncate w-32 text-left">{getUserDisplayName()}</span>
                                    <span className="text-xs text-muted-foreground truncate w-32 text-left">Admin</span>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <div className="flex items-center gap-2 p-2 mx-1 my-1 bg-muted/50 rounded-md">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{getUserDisplayName()}</span>
                                    <span className="text-xs text-muted-foreground">Administrator</span>
                                </div>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate('/')} className="cursor-pointer">
                                <Store className="h-4 w-4 mr-2" /> Back to Store
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                                <LogOut className="h-4 w-4 mr-2" /> Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Page content - This is where nested routes will render */}
            <main className="p-6">
                <ErrorBoundary>
                    <Outlet />
                </ErrorBoundary>
            </main>
        </div>
    </div>);
};
export default Admin;
