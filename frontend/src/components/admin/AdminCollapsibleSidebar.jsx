"use client";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, LogOut, Settings, UserCircle, Package, ShoppingCart, Cake, BarChart3, PanelLeftClose, PanelLeftOpen, UserCog, Blocks, Store, Tag, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api"; // Ensure api is imported for logout fallback

const sidebarVariants = {
  open: {
    width: "16rem",
  },
  closed: {
    width: "60px",
  },
};
const contentVariants = {
  open: { display: "block", opacity: 1, x: 0 },
  closed: { display: "none", opacity: 0, x: -10 },
};

export function AdminCollapsibleSidebar({ activeSection, showFooter = true, isCollapsed, toggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Use the real AuthContext
  const { logout, user } = useAuth();

  const menuItems = [
    { id: "overview", title: "Dashboard", icon: LayoutDashboard, badge: null, path: "/admin/overview" },
    { id: "analytics", title: "Customer Analytics", icon: BarChart3, badge: null, path: "/admin/analytics" },
    { id: "products", title: "Products", icon: Package, badge: null, path: "/admin/products" },
    { id: "orders", title: "Orders", icon: ShoppingCart, badge: null, path: "/admin/orders" },
    { id: "birthdays", title: "Birthdays", icon: Cake, badge: null, path: "/admin/birthdays" },
  ];

  const managementItems = [
    { id: "brands", title: "Brands", icon: Tag, path: "/admin/brands" },
    { id: "categories", title: "Categories", icon: Blocks, path: "/admin/categories" },
    { id: "settings", title: "Settings", icon: Settings, path: "/admin/settings" },
  ];

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
      } else {
        // Fallback manual logout
        localStorage.removeItem('authToken');
        window.dispatchEvent(new Event('authChanged'));
      }
      toast({
        title: 'Logged out',
        description: 'You have been signed out successfully.'
      });
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({ title: 'Logout failed', variant: 'destructive' });
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 1);
    }
    return 'AD';
  };

  const getUserDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'Admin';
  };

  return (
    <motion.div
      className="sidebar fixed left-0 top-0 z-40 h-full shrink-0 border-r bg-card text-card-foreground shadow-sm"
      initial={false}
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarVariants}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="flex h-full w-full flex-col">
        {/* Header Section */}
        <div className="p-3 border-b flex items-center justify-between h-16">
          <div className={cn("flex items-center gap-2 overflow-hidden transition-all", isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold">SK</span>
            </div>
            <span className="font-bold whitespace-nowrap">Sri Krishna</span>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="ml-auto h-8 w-8">
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        {/* User Profile Dropdown */}
        <div className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={cn("w-full justify-start p-2", isCollapsed ? "px-0 justify-center" : "")}>
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarFallback className="bg-primary text-primary-foreground">{getUserInitials()}</AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-sm font-medium truncate w-32 text-left">{getUserDisplayName()}</span>
                    <span className="text-xs text-muted-foreground truncate w-32 text-left">Admin</span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56" side={isCollapsed ? "right" : "bottom"}>
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

        <Separator />

        <ScrollArea className="flex-1 py-3">
          <div className="space-y-1 px-3">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={activeSection === item.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start overflow-hidden",
                  activeSection === item.id && "bg-primary/10 text-primary font-medium hover:bg-primary/15",
                  isCollapsed ? "px-2 justify-center" : ""
                )}
                onClick={() => navigate(item.path)}
                title={isCollapsed ? item.title : undefined}
              >
                <item.icon className={cn("h-4 w-4", isCollapsed ? "mr-0" : "mr-2")} />
                {!isCollapsed && <span>{item.title}</span>}
              </Button>
            ))}

            {!isCollapsed && (
              <div className="px-2 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Management
              </div>
            )}
            {isCollapsed && <Separator className="my-2" />}

            {managementItems.map((item) => (
              <Button
                key={item.id}
                variant={activeSection === item.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start overflow-hidden",
                  activeSection === item.id && "bg-primary/10 text-primary font-medium hover:bg-primary/15",
                  isCollapsed ? "px-2 justify-center" : ""
                )}
                onClick={() => navigate(item.path)}
                title={isCollapsed ? item.title : undefined}
              >
                <item.icon className={cn("h-4 w-4", isCollapsed ? "mr-0" : "mr-2")} />
                {!isCollapsed && <span>{item.title}</span>}
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 mt-auto border-t">
          {!isCollapsed ? (
            <div className="text-xs text-center text-muted-foreground">
              <p>Admin Panel v1.0.0</p>
              <p>&copy; 2024 Krishna Stores</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <Badge variant="outline" className="text-[10px]">v1.0</Badge>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
