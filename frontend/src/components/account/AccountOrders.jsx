import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  Package,
  ShoppingBag,
  Check,
  Truck,
  X,
  Calendar,
  ChevronRight,
  Clock,
  BadgeCheck,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { baseUrl } from "@/config/baseUrl";
import { motion } from "framer-motion";

const API_BASE_URL = baseUrl;
const getAuthToken = () => localStorage.getItem("authToken");

const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  const data = await response.json();
  return {
    success: data.success !== undefined ? data.success : response.ok,
    data: data.data || data,
    message: data.message || "",
  };
};

const api = { getOrders: () => apiRequest("/orders") };

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(typeof price === "string" ? parseFloat(price) : price || 0);

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// ─────────────────────────────────────────────────────────────────────────────
// Status config
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  delivered:  { label: "Delivered",  color: "text-green-600",      bg: "bg-green-500/10",    border: "border-green-500/20",    icon: BadgeCheck },
  shipped:    { label: "Shipped",    color: "text-blue-600",       bg: "bg-blue-500/10",     border: "border-blue-500/20",     icon: Truck      },
  confirmed:  { label: "Confirmed",  color: "text-primary",        bg: "bg-primary/10",      border: "border-primary/20",      icon: Check      },
  processing: { label: "Processing", color: "text-primary",        bg: "bg-primary/10",      border: "border-primary/20",      icon: Loader2    },
  pending:    { label: "Pending",    color: "text-orange-600",     bg: "bg-orange-500/10",   border: "border-orange-500/20",   icon: Clock      },
  cancelled:  { label: "Cancelled",  color: "text-destructive",    bg: "bg-destructive/10",  border: "border-destructive/20",  icon: X          },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Product image (same logic as Cart + OrderDetail)
// ─────────────────────────────────────────────────────────────────────────────
function ProductImage({ item }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    if (item.image) return setSrc(item.image);
    if (item.product?.colorsAndImages && item.colorName) {
      const imgs = item.product.colorsAndImages[item.colorName];
      if (imgs?.length) {
        const main = imgs.find((i) => i.type === "main");
        return setSrc(main?.url || imgs[0]?.url || null);
      }
    }
    if (item.product?.images?.length) {
      const first = item.product.images[0];
      return setSrc(typeof first === "string" ? first : first?.url || null);
    }
  }, [item]);

  return (
    <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-border/40">
      {src ? (
        <img
          src={src}
          alt={item.name || "Product"}
          className="w-full h-full object-cover"
          onError={() => setSrc(null)}
        />
      ) : (
        <Package className="w-6 h-6 text-muted-foreground" />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single order card
// ─────────────────────────────────────────────────────────────────────────────
function OrderCard({ order, index }) {
  let items = order.orderItems;
  if (typeof items === "string") {
    try { items = JSON.parse(items); } catch { items = []; }
  }
  if (!Array.isArray(items)) items = [];

  const visibleItems = items.slice(0, 2);
  const extraCount = items.length - visibleItems.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="bg-card rounded-2xl border border-border overflow-hidden transition-shadow hover:shadow-md"
      style={{ boxShadow: "0 2px 12px hsl(var(--primary) / 0.04)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/20">
        <div>
          <p className="text-sm font-semibold text-foreground">
            #{order.orderNumber || `ORD${String(order.id).slice(-6)}`}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Calendar className="w-3 h-3" />
            {formatDate(order.created_at || order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.orderStatus} />
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-3">
        {visibleItems.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <ProductImage item={item} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground font-medium line-clamp-1">
                {item.name || item.product?.name || `Product #${item.productId}`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.colorName && `${item.colorName} · `}Qty: {item.quantity || 1}
              </p>
            </div>
            <p className="text-sm font-semibold text-foreground flex-shrink-0">
              {formatPrice(item.price || 0)}
            </p>
          </div>
        ))}
        {extraCount > 0 && (
          <p className="text-xs text-muted-foreground text-center py-1">
            +{extraCount} more item{extraCount > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 bg-muted/10">
        <p className="text-sm font-bold text-foreground">
          Total:{" "}
          <span className="text-primary">
            {formatPrice(order.finalAmount || order.totalPrice || 0)}
          </span>
        </p>
        <Link
          to={`/account/orders/${order.orderNumber}`}
          className="flex items-center gap-1 text-sm text-primary font-medium hover:underline"
        >
          View Details
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function AccountOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const response = await api.getOrders();
      if (response.success) {
        const raw = response.data;
        setOrders(
          Array.isArray(raw?.orders) ? raw.orders : Array.isArray(raw) ? raw : []
        );
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to load orders", variant: "destructive" });
    } finally {
      setOrdersLoading(false);
    }
  };

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (ordersLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">My Orders</h2>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div className="space-y-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="w-14 h-14 rounded-xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <div className="flex justify-between border-t border-border pt-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">My Orders</h2>
        <button
          onClick={fetchOrders}
          disabled={ordersLoading}
          className="text-sm text-primary hover:underline font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Empty state */}
      {orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-14 bg-card rounded-2xl border border-border"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-primary" />
          </div>
          <p className="text-lg font-semibold text-foreground mb-1">No orders yet</p>
          <p className="text-muted-foreground text-sm mb-5">
            Start shopping to see your orders here
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            Shop Now
          </Link>
        </motion.div>
      ) : (
        orders.map((order, i) => (
          <OrderCard key={order.id} order={order} index={i} />
        ))
      )}
    </div>
  );
}