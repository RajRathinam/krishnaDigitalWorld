import { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AdminCollapsibleSidebar } from "@/components/admin/AdminCollapsibleSidebar";
import { Bell, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorBoundary } from "@/components/ui/error-boundary";
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const getPageTitle = () => {
        const path = location.pathname;
        if (path.includes('/admin/overview'))
            return "Dashboard Overview";
        if (path.includes('/admin/analytics'))
            return "Customer Analytics";
        if (path.includes('/admin/products'))
            return "Product Management";
        if (path.includes('/admin/orders'))
            return "Order Management";
        if (path.includes('/admin/birthdays'))
            return "Birthday Center";
        if (path.includes('/admin/settings'))
            return "Settings";
        if (path.includes('/admin/brands'))
            return "Brands";
        if (path.includes('/admin/categories'))
            return "Categories";
        return "Dashboard";
    };
    const getActiveSection = () => {
        const path = location.pathname;
        if (path.includes('/admin/overview'))
            return 'overview';
        if (path.includes('/admin/analytics'))
            return 'analytics';
        if (path.includes('/admin/products'))
            return 'products';
        if (path.includes('/admin/orders'))
            return 'orders';
        if (path.includes('/admin/birthdays'))
            return 'birthdays';
        if (path.includes('/admin/settings'))
            return 'settings';
        if (path.includes('/admin/brands'))
            return 'brands';
        if (path.includes('/admin/categories'))
            return 'categories';
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

                <div className="flex items-center gap-4">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search..." className="pl-9 w-64 bg-muted/50 border-none focus-visible:ring-1" />
                    </div>
                    <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-background" />
                    </Button>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                        {user?.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
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
