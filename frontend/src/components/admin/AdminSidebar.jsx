import { Users, Package, ShoppingCart, Gift, BarChart3, Settings, LogOut, X, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/services/api";
import { toast } from "@/hooks/use-toast";
const menuItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "analytics", label: "Customers", icon: Users },
    { id: "products", label: "Products", icon: Package },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "birthdays", label: "Birthdays", icon: Gift },
    { id: "settings", label: "Settings", icon: Settings },
];
export const AdminSidebar = ({ currentView, onViewChange, isOpen, onClose, showFooter = true, }) => {
    const navigate = useNavigate();
    return (<aside className={`
      fixed inset-y-0 left-0 z-50 w-64 bg-background border-r
      transform transition-transform duration-200 ease-in-out
      lg:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-primary-foreground"/>
            </div>
            <span className="font-bold text-lg">Admin Panel</span>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-5 w-5"/>
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (<button key={item.id} onClick={() => {
                onViewChange(item.id);
                onClose();
            }} className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                text-sm font-medium transition-colors
                ${currentView === item.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
              `}>
              <item.icon className="h-5 w-5"/>
              {item.label}
            </button>))}
        </nav>

        {/* Footer */}
        {showFooter && (<div className="p-4 border-t space-y-2">
            <Link to="/">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Home className="h-4 w-4"/>
                Back to Store
              </Button>
            </Link>
            <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive" onClick={async () => {
                try {
                    await authApi.logout();
                    // ensure local clearing and notify
                    localStorage.removeItem('authToken');
                    window.dispatchEvent(new Event('authChanged'));
                    toast({ title: 'Logged out', description: 'You have been signed out.' });
                    // navigate to admin root so AdminEntry shows login
                    navigate('/admin');
                }
                catch (err) {
                    // still clear and notify
                    localStorage.removeItem('authToken');
                    window.dispatchEvent(new Event('authChanged'));
                    toast({ title: 'Logged out', description: 'Signed out (offline).' });
                    window.location.href = '/admin';
                }
            }}>
              <LogOut className="h-4 w-4"/>
              Logout
            </Button>
          </div>)}
      </div>
    </aside>);
};
