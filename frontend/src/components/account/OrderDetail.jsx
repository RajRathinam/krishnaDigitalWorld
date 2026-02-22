// pages/OrderDetail.jsx
// Full order detail view — product images, payment info, tracking timeline, orbit animation.

import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Package,
  Truck,
  Check,
  X,
  Clock,
  BadgeCheck,
  Loader2,
  ReceiptText,
  Wallet,
  CreditCard,
  MapPin,
  Phone,
  User,
  Tag,
  ShoppingBag,
  CalendarDays,
  Hash,
  ChevronRight,
  CircleDot,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { baseUrl } from "@/config/baseUrl";

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

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(typeof price === "string" ? parseFloat(price) : price || 0);

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const formatDateShort = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

// ─────────────────────────────────────────────────────────────────────────────
// Orbit ring animation (same as SignupDialog / PaymentReturn)
// ─────────────────────────────────────────────────────────────────────────────
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function OrbitRing({ radius, speed, delay, dotClass, reverse = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.2 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.65, ease: "backOut" }}
      style={{
        position: "absolute",
        width: radius * 2,
        height: radius * 2,
        borderRadius: "50%",
        border: "1px dashed hsl(var(--primary) / 0.2)",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <motion.div
        animate={{ rotate: reverse ? -360 : 360 }}
        transition={{ repeat: Infinity, duration: speed, ease: "linear" }}
        style={{ width: "100%", height: "100%", position: "relative" }}
      >
        <div
          className={dotClass}
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 7,
            height: 7,
            borderRadius: "50%",
            boxShadow: "0 0 8px currentColor",
          }}
        />
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Status config
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:    { label: "Pending",    color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: Clock },
  processing: { label: "Processing", color: "text-primary",    bg: "bg-primary/10",    border: "border-primary/30",    icon: Loader2 },
  shipped:    { label: "Shipped",    color: "text-blue-500",   bg: "bg-blue-500/10",   border: "border-blue-500/30",   icon: Truck },
  delivered:  { label: "Delivered",  color: "text-green-500",  bg: "bg-green-500/10",  border: "border-green-500/30",  icon: BadgeCheck },
  cancelled:  { label: "Cancelled",  color: "text-destructive",bg: "bg-destructive/10",border: "border-destructive/30",icon: X },
};

const PAYMENT_STATUS_CONFIG = {
  pending:  { label: "Pending",  color: "text-orange-500", bg: "bg-orange-500/10" },
  paid:     { label: "Paid",     color: "text-green-500",  bg: "bg-green-500/10"  },
  failed:   { label: "Failed",   color: "text-destructive",bg: "bg-destructive/10"},
  refunded: { label: "Refunded", color: "text-primary",    bg: "bg-primary/10"    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Tracking timeline steps
// ─────────────────────────────────────────────────────────────────────────────
const TRACK_STEPS = ["pending", "processing", "shipped", "delivered"];

function TrackingTimeline({ currentStatus }) {
  const currentIdx = TRACK_STEPS.indexOf(currentStatus);
  const isCancelled = currentStatus === "cancelled";

  return (
    <div className="relative">
      {/* Connector line */}
      <div className="absolute top-4 left-4 right-4 h-0.5 bg-border z-0"
        style={{ left: "calc(2rem)", right: "calc(2rem)" }}
      />
      <motion.div
        className="absolute top-4 h-0.5 bg-primary z-0"
        style={{ left: "calc(2rem)" }}
        initial={{ width: 0 }}
        animate={{
          width: isCancelled
            ? 0
            : `calc(${(Math.max(0, currentIdx) / (TRACK_STEPS.length - 1)) * 100}% - 4rem)`,
        }}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
      />

      <div className="flex justify-between relative z-10">
        {TRACK_STEPS.map((step, i) => {
          const done = !isCancelled && i <= currentIdx;
          const active = !isCancelled && i === currentIdx;
          const cfg = STATUS_CONFIG[step];
          const Icon = cfg.icon;

          return (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex flex-col items-center gap-2 flex-1"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                  ${done
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-card border-border text-muted-foreground"
                  }
                  ${active ? "shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]" : ""}
                `}
              >
                {done && i < currentIdx ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className={`w-3.5 h-3.5 ${active ? "animate-pulse" : ""}`} />
                )}
              </div>
              <span
                className={`text-xs font-medium text-center leading-tight ${
                  done ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {cfg.label}
              </span>
            </motion.div>
          );
        })}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section card
// ─────────────────────────────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, delay = 0, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-card rounded-2xl border border-border overflow-hidden"
      style={{ boxShadow: "0 4px 20px hsl(var(--primary) / 0.05)" }}
    >
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border/60">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground text-sm">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Info row
// ─────────────────────────────────────────────────────────────────────────────
function InfoRow({ label, value, highlight, mono }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-border/40 last:border-0 gap-4">
      <span className="text-muted-foreground text-sm flex-shrink-0">{label}</span>
      <span
        className={`text-sm font-medium text-right ${
          highlight ? "text-primary" : mono ? "font-mono text-foreground" : "text-foreground"
        }`}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Product image — same logic as Cart component
// ─────────────────────────────────────────────────────────────────────────────
function ProductImage({ item }) {
  const [imgSrc, setImgSrc] = useState(null);

  useEffect(() => {
    // Priority: item.image → colorsAndImages for colorName → product.images[0]
    if (item.image) {
      setImgSrc(item.image);
    } else if (item.product?.colorsAndImages && item.colorName) {
      const colorImgs = item.product.colorsAndImages[item.colorName];
      if (colorImgs?.length) {
        const main = colorImgs.find((i) => i.type === "main");
        setImgSrc(main?.url || colorImgs[0]?.url || null);
      }
    } else if (item.product?.images?.length) {
      const first = item.product.images[0];
      setImgSrc(typeof first === "string" ? first : first?.url || null);
    }
  }, [item]);

  return (
    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-border/40">
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={item.name || "Product"}
          className="w-full h-full object-cover"
          onError={() => setImgSrc(null)}
        />
      ) : (
        <Package className="w-7 h-7 text-muted-foreground" />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero status badge with orbit rings
// ─────────────────────────────────────────────────────────────────────────────
function StatusHero({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  const isSuccess = status === "delivered";

  return (
    <div className="relative flex items-center justify-center" style={{ height: 120 }}>
      {/* Orbit rings */}
      <OrbitRing radius={44}  speed={8}  delay={0.3} dotClass="bg-primary" />
      <OrbitRing radius={60}  speed={13} delay={0.5} dotClass="bg-primary/55" reverse />
      <OrbitRing radius={76}  speed={20} delay={0.7} dotClass="bg-accent" />

      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, duration: 0.6, ease: "backOut" }}
        className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center ${cfg.bg} border ${cfg.border}`}
        style={{
          boxShadow: `0 0 0 8px hsl(var(--primary) / 0.07), 0 0 0 16px hsl(var(--primary) / 0.03)`,
        }}
      >
        <motion.div
          animate={
            isSuccess
              ? { rotate: [0, -10, 10, -6, 6, 0] }
              : status === "processing" || status === "pending"
              ? {}
              : {}
          }
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          <Icon
            className={`w-8 h-8 ${cfg.color} ${
              status === "processing" ? "animate-spin" : ""
            }`}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main OrderDetail Page
// ─────────────────────────────────────────────────────────────────────────────
export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/orders/${id}`);
      if (res.success) {
        let o = res.data;
        
        // Parse orderItems if string
        if (typeof o.orderItems === "string") {
          try { o.orderItems = JSON.parse(o.orderItems); } catch { o.orderItems = []; }
        }
        if (!Array.isArray(o.orderItems)) o.orderItems = [];
        
        // Parse shippingAddress if string
        if (typeof o.shippingAddress === "string") {
          try { 
            o.shippingAddress = JSON.parse(o.shippingAddress); 
          } catch { 
            o.shippingAddress = {}; 
          }
        }
        
        setOrder(o);
        console.log(o);
      } else {
        toast({ title: "Error", description: res.message || "Order not found", variant: "destructive" });
        navigate("/account/orders");
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to load order", variant: "destructive" });
      navigate("/account/orders");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(true);
    try {
      const res = await apiRequest(`/orders/${id}/cancel`, { method: "PUT" });
      if (res.success) {
        toast({ title: "Order cancelled successfully" });
        fetchOrder();
      } else {
        toast({ title: "Error", description: res.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to cancel order", variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-6xl py-6 px-4 pb-20 space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) return null;

  const orderStatus = order.orderStatus || "pending";
  const paymentStatus = order.paymentStatus || "pending";
  const statusCfg = STATUS_CONFIG[orderStatus] || STATUS_CONFIG.pending;
  const paymentCfg = PAYMENT_STATUS_CONFIG[paymentStatus] || PAYMENT_STATUS_CONFIG.pending;
  const canCancel = ["pending", "processing"].includes(orderStatus);

  // Parse shippingAddress if it's still a string (fallback)
  let shippingAddr = order.shippingAddress || {};
  if (typeof shippingAddr === "string") {
    try {
      shippingAddr = JSON.parse(shippingAddr);
    } catch {
      shippingAddr = {};
    }
  }
  
  const coupon = order.coupon;

  return (
    <div className="min-h-screen bg-background">

      <div className="md:container max-w-6xl py-6 px-2 md:pb-20">

        {/* Back + title */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 mb-5"
        >
          <div>
            <h1 className="text-lg font-bold text-foreground leading-none">
             {order.orderNumber || `ORD${String(order.id).slice(-6)}`}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Placed on {formatDateShort(order.created_at || order.createdAt)}
            </p>
          </div>
          <span className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
            <statusCfg.icon className="w-3 h-3" />
            {statusCfg.label}
          </span>
        </motion.div>

        {/* ── Row 1: Status hero (full width) ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-card rounded-2xl border border-border overflow-hidden mb-6"
          style={{ boxShadow: "0 4px 20px hsl(var(--primary) / 0.06)" }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.1) 0%, transparent 60%)",
            }}
          />
          {/* Side-by-side: orbit icon LEFT, timeline RIGHT */}
          <div className="flex flex-col sm:flex-row items-center gap-0 sm:gap-6 px-6 pt-6 pb-5 relative">
            {/* Left: icon + message */}
            <div className="flex flex-col items-center sm:items-start sm:w-56 flex-shrink-0">
              <StatusHero status={orderStatus} />
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="text-center sm:text-left mt-2"
              >
                <p className="font-bold text-foreground text-sm leading-snug">
                  {orderStatus === "delivered" && "Your order has been delivered!"}
                  {orderStatus === "shipped"   && "Your order is on the way!"}
                  {orderStatus === "processing"&& "Your order is being processed"}
                  {orderStatus === "pending"   && "Your order is confirmed"}
                  {orderStatus === "cancelled" && "Order has been cancelled"}
                </p>
                {order.trackingId && (
                  <p className="text-xs text-muted-foreground mt-1 font-mono break-all">
                    <span className="text-primary font-semibold">{order.trackingId}</span>
                  </p>
                )}
              </motion.div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px self-stretch bg-border/50 mx-2" />

            {/* Right: tracking timeline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="flex-1 w-full mt-5 sm:mt-0"
            >
              <TrackingTimeline currentStatus={orderStatus} />
            </motion.div>
          </div>
        </motion.div>

        {/* ── Row 2: 2-column layout for Order Items and Payment Details ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* LEFT COL: Order Items */}
          <div className="w-full">
            <SectionCard title="Order Items" icon={ShoppingBag} delay={0.15}>
              <div className="space-y-4">
                {order.orderItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.07 }}
                    className="flex items-center gap-3"
                  >
                    <ProductImage item={item} />
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/product/${item.product?.slug || item.productId}`}
                        className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2"
                      >
                        {item.name || item.product?.name || `Product #${item.productId}`}
                      </Link>
                      <div className="flex flex-wrap gap-x-3 mt-1">
                        {item.colorName && (
                          <span className="text-xs text-muted-foreground">
                            Color: <span className="text-foreground">{item.colorName}</span>
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Qty: <span className="text-foreground">{item.quantity}</span>
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatPrice(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-sm font-bold text-foreground flex-shrink-0">
                      {formatPrice(item.total || item.price * item.quantity)}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Price breakdown */}
              <div className="mt-5 pt-4 border-t border-border/60">
                <InfoRow label="Subtotal" value={formatPrice(order.totalPrice)} />
                {parseFloat(order.shippingCost) > 0 ? (
                  <InfoRow label="Shipping" value={formatPrice(order.shippingCost)} />
                ) : (
                  <InfoRow label="Shipping" value="FREE" highlight />
                )}
                {parseFloat(order.discountAmount) > 0 && (
                  <InfoRow label="Discount" value={`− ${formatPrice(order.discountAmount)}`} highlight />
                )}
                {coupon && (
                  <InfoRow
                    label="Coupon"
                    value={`${coupon.code} (${
                      coupon.discountType === "percentage"
                        ? `${coupon.discountValue}%`
                        : formatPrice(coupon.discountValue)
                    } off)`}
                    highlight
                  />
                )}
                <div className="flex items-center justify-between pt-3 mt-1">
                  <span className="font-bold text-foreground">Total Paid</span>
                  <span className="font-bold text-primary text-lg">{formatPrice(order.finalAmount)}</span>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* RIGHT COL: Payment Details */}
          <div className="w-full">
            <SectionCard title="Payment Details" icon={CreditCard} delay={0.22}>
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-muted/40 border border-border/40">
                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${paymentCfg.bg} ${paymentCfg.color}`}>
                  {paymentStatus === "paid"     && <BadgeCheck  className="w-3.5 h-3.5" />}
                  {paymentStatus === "pending"  && <Clock       className="w-3.5 h-3.5" />}
                  {paymentStatus === "failed"   && <X           className="w-3.5 h-3.5" />}
                  {paymentStatus === "refunded" && <ReceiptText className="w-3.5 h-3.5" />}
                  {paymentCfg.label}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground capitalize">
                    {order.paymentMethod === "cod"  ? "Cash on Delivery"
                     : order.paymentMethod === "upi"  ? "UPI"
                     : order.paymentMethod === "card" ? "Card"
                     : order.paymentMethod}
                  </p>
                  <p className="text-xs text-muted-foreground">Payment method</p>
                </div>
              </div>
              <InfoRow label="Status"    value={paymentCfg.label} />
              <InfoRow label="Total"     value={formatPrice(order.finalAmount)} highlight />
              {order.merchantOrderId     && <InfoRow label="Txn Ref"        value={order.merchantOrderId}      mono />}
              {order.phonePeTransactionId&& <InfoRow label="PhonePe Txn"    value={order.phonePeTransactionId} mono />}
              <InfoRow label="Ordered"   value={formatDate(order.created_at || order.createdAt)} />
            </SectionCard>
          </div>
        </div>

        {/* ── Row 3: Remaining sections in a single column ── */}
        <div className="space-y-4">
          {/* Shipping Address */}
          <SectionCard title="Shipping Address" icon={MapPin} delay={0.3}>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="text-sm space-y-0.5">
                {shippingAddr.name && (
                  <p className="font-semibold text-foreground">{shippingAddr.name}</p>
                )}
                {shippingAddr.street && (
                  <p className="text-muted-foreground">{shippingAddr.street}</p>
                )}
                {shippingAddr.city && shippingAddr.state && (
                  <p className="text-muted-foreground">
                    {shippingAddr.city}, {shippingAddr.state} - {shippingAddr.zipCode}
                  </p>
                )}
                {shippingAddr.country && (
                  <p className="text-muted-foreground">{shippingAddr.country}</p>
                )}
                {shippingAddr.phone && (
                  <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
                    <Phone className="w-3.5 h-3.5" />
                    {shippingAddr.phone}
                  </p>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Tracking Info (if available) */}
          {(order.trackingId || order.estimatedDelivery) && (
            <SectionCard title="Tracking Info" icon={Truck} delay={0.38}>
              {order.trackingId        && <InfoRow label="Tracking ID" value={order.trackingId} mono />}
              {order.estimatedDelivery && <InfoRow label="Est. Delivery" value={formatDateShort(order.estimatedDelivery)} highlight />}
              {order.orderStatus === "shipped" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-2"
                >
                  <Truck className="w-4 h-4 text-primary flex-shrink-0" />
                  <p className="text-xs text-primary font-medium leading-snug">
                    Your package is on its way!
                  </p>
                </motion.div>
              )}
            </SectionCard>
          )}

          {/* Notes */}
          {order.notes && (
            <SectionCard title="Order Notes" icon={ReceiptText} delay={0.44}>
              <p className="text-sm text-muted-foreground leading-relaxed">{order.notes}</p>
            </SectionCard>
          )}
        </div>

        {/* ── Row 4: Actions (full width) ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 mt-6"
        >
          <button
            onClick={() => navigate("/")}
            className="flex-1 py-2.5 h-11 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-colors text-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            Continue Shopping
          </button>
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 py-2.5 h-11 flex items-center justify-center gap-2 border border-destructive/40 text-destructive hover:bg-destructive/5 font-medium rounded-xl transition-colors text-sm"
            >
              {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              Cancel Order
            </button>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="text-center text-xs text-muted-foreground mt-4"
        >
          Having trouble?{" "}
          <button onClick={() => navigate("/contact")} className="text-primary hover:underline font-medium">
            Contact support
          </button>
        </motion.p>
      </div>
    </div>
  );
}