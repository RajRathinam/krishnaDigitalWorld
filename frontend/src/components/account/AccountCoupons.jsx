import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  Ticket,
  Calendar,
  Copy,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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

function CouponSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

function CouponCard({ coupon, index, onCopy }) {
  const userCoupon = coupon;
  const couponData = coupon.coupon || coupon;
  
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(couponData.code);
    setCopied(true);
    toast({ title: "Coupon code copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const isExpired = new Date(couponData.validUntil) < new Date();
  const isUsed = userCoupon.isUsed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className={`relative bg-gradient-to-br rounded-2xl border overflow-hidden transition-all hover:shadow-md ${
        isExpired
          ? "from-muted/30 to-muted/10 border-border/40 opacity-60"
          : isUsed
          ? "from-orange-500/5 to-orange-500/5 border-orange/30"
          : "from-blue-500/5 to-blue-500/5 border-blue-200/30"
      }`}
      style={{
        boxShadow: isExpired
          ? "none"
          : isUsed
          ? "0 2px 12px hsl(24 100% 57% / 0.08)"
          : "0 2px 12px hsl(209 100% 50% / 0.08)",
      }}
    >
      {/* Status badge */}
      {isUsed && (
        <div className="absolute top-3 md:mt-0 mt-10 right-3 bg-orange-500/90 text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
          <Check className="w-3 h-3" />
          Used
        </div>
      )}
      {isExpired && (
        <div className="absolute top-3 md:mt-0 mt-10 right-3 bg-muted-foreground/90 text-background px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Expired
        </div>
      )}

      <div className="p-4 md:p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isUsed ? 'bg-orange-500/10 border-orange/20' : 'bg-blue-500/10 border-blue-200/20'}`}>
                <Ticket className={`w-6 h-6 ${isUsed ? 'text-orange-600' : 'text-blue-600'}`} />
              </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {couponData.description || "Discount Coupon"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {couponData.discountType === "percentage"
                  ? `${couponData.discountValue}% Off`
                  : `₹${couponData.discountValue} Off`}
                {couponData.maxDiscount &&
                  ` (Max: ${formatPrice(couponData.maxDiscount)})`}
              </p>
            </div>
          </div>
        </div>

        {/* Coupon Code */}
        <div className="mb-4 p-3 bg-muted/40 rounded-lg border border-border/60">
          <p className="text-xs text-muted-foreground mb-1.5">Coupon Code</p>
          <button
            onClick={handleCopy}
            disabled={isExpired || isUsed}
            className={`w-full flex items-center justify-between gap-2 transition-colors ${
              isExpired || isUsed ? "cursor-not-allowed" : "hover:text-primary"
            }`}
          >
            <span className="font-mono font-bold text-lg text-foreground">
              {couponData.code}
            </span>
            {copied ? (
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
          </button>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-muted/30 rounded-lg p-2.5">
            <p className="text-xs text-muted-foreground mb-0.5">Min Order</p>
            <p className="text-sm font-semibold text-foreground">
              {couponData.minOrderAmount > 0
                ? formatPrice(couponData.minOrderAmount)
                : "No minimum"}
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2.5">
            <p className="text-xs text-muted-foreground mb-0.5">Valid Until</p>
            <p className="text-sm font-semibold text-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(couponData.validUntil)}
            </p>
          </div>
        </div>

        {/* Status message */}
        {isUsed && (
          <p className="text-xs text-center text-orange-600 bg-orange-500/10 rounded-lg py-1.5 px-2">
            This coupon has been used on {formatDate(userCoupon.usedAt)}
          </p>
        )}
        {isExpired && !isUsed && (
          <p className="text-xs text-center text-muted-foreground bg-muted/40 rounded-lg py-1.5 px-2">
            This coupon has expired
          </p>
        )}
        {!isExpired && !isUsed && (
          <p className="text-xs text-center text-blue-600 bg-blue-500/10 rounded-lg py-1.5 px-2">
            Ready to use
          </p>
        )}
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12 px-4"
    >
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
        <Ticket className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No Coupons Yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        You don't have any coupons assigned to you yet. Keep an eye on your account for special offers and promotions!
      </p>
    </motion.div>
  );
}

export function AccountCoupons() {
  const { user, loading } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [allCoupons, setAllCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("available"); // available, used

  useEffect(() => {
    if (user && !loading) {
      fetchCoupons();
    }
  }, [user, loading]);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const result = await apiRequest("/coupons/my-coupons");
      if (result.success && result.data) {
        setAllCoupons(result.data);
      } else {
        setAllCoupons([]);
        toast({ title: "Failed to load coupons" });
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast({ title: "Error fetching coupons" });
    } finally {
      setIsLoading(false);
    }
  };

  const availableCoupons = allCoupons.filter(
    (c) => !c.isUsed && new Date(c.coupon.validUntil) >= new Date()
  );
  const usedCoupons = allCoupons.filter((c) => c.isUsed);

  const displayCoupons = activeTab === "available" ? availableCoupons : usedCoupons;

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <CouponSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("available")}
          className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${
            activeTab === "available"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Available ({availableCoupons.length})
        </button>
        <button
          onClick={() => setActiveTab("used")}
          className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${
            activeTab === "used"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Used ({usedCoupons.length})
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <CouponSkeleton key={i} />
          ))}
        </div>
      ) : displayCoupons.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayCoupons.map((coupon, index) => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
