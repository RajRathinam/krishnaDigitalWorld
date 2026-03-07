// pages/Checkout.jsx
import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  Check, MapPin, Truck, CreditCard, Smartphone, Banknote,
  Lock, Tv, PartyPopper, Plus, Home,
  Briefcase, MapPin as MapPinIcon, User as UserIcon,
  ArrowLeft, AlertCircle, Loader2, Tag
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ScratchToReveal } from "@/components/ui/scratch-to-reveal";
import { Confetti } from "@/components/ui/confetti";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/utils";

const MAX_ADDITIONAL = 3; // additional addresses beyond primary = total 4

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const getItemImageUrl = (item) => {
  if (item.imageUrl) return getImageUrl(item.imageUrl);
  if (item.product?.images?.length) {
    const first = item.product.images[0];
    return getImageUrl(typeof first === "string" ? first : first?.url);
  }
  if (item.product?.thumbnail) return getImageUrl(item.product.thumbnail);
  if (item.product?.image)     return getImageUrl(item.product.image);
  return null;
};

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

const getAddressTypeIcon = (type) => {
  switch (type) {
    case "home":    return <Home      className="w-4 h-4" />;
    case "work":    return <Briefcase className="w-4 h-4" />;
    case "primary": return <UserIcon  className="w-4 h-4" />;
    default:        return <MapPinIcon className="w-4 h-4" />;
  }
};

const STEPS = [
  { id: "address",  label: "Address",  icon: MapPin     },
  { id: "delivery", label: "Delivery", icon: Truck      },
  { id: "payment",  label: "Payment",  icon: CreditCard },
];

// ─────────────────────────────────────────────────────────────────────────────
// Profile completeness helpers
// Required: name, phone, primary address (street + city + pincode)
// Email is intentionally optional
// ─────────────────────────────────────────────────────────────────────────────
const parseAddress = (addr) => {
  if (!addr) return null;
  if (typeof addr === "object") return addr;
  try { return JSON.parse(addr); } catch { return null; }
};

const isProfileComplete = (userData) => {
  if (!userData) return false;
  if (!userData.name?.trim())  return false;
  if (!userData.phone?.trim()) return false;
  const parsed = parseAddress(userData.address);
  if (!parsed) return false;
  if (!parsed.street?.trim() || !parsed.city?.trim() || !parsed.pincode?.trim()) return false;
  return true;
};

// Returns human-readable list of exactly what's missing
const getMissingFields = (userData) => {
  const missing = [];
  if (!userData) return ["Profile data unavailable — please sign in again"];
  if (!userData.name?.trim())  missing.push("Full Name");
  if (!userData.phone?.trim()) missing.push("Phone Number");
  const parsed = parseAddress(userData.address);
  if (!parsed) {
    missing.push("Primary Address (street, city & pincode required)");
  } else {
    if (!parsed.street?.trim())  missing.push("Primary Address — Street");
    if (!parsed.city?.trim())    missing.push("Primary Address — City");
    if (!parsed.pincode?.trim()) missing.push("Primary Address — Pincode");
  }
  return missing;
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function Checkout() {
  const navigate = useNavigate();
  const { user }  = useAuth();

  // Steps
  const [currentStep, setCurrentStep] = useState("address");

  // Profile gate
  const [profileChecking, setProfileChecking] = useState(true);
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  // Addresses
  const [savedAddressesList, setSavedAddressesList]   = useState([]);
  const [selectedAddress,    setSelectedAddress]      = useState("");
  const [isLoadingAddresses, setIsLoadingAddresses]   = useState(false);
  const [showAddressForm,    setShowAddressForm]      = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: "", phone: "", street: "", city: "", state: "", pincode: "", type: "home",
  });

  // Delivery & payment
  const [deliveryOption, setDeliveryOption] = useState("standard");
  const [paymentMethod,  setPaymentMethod]  = useState("cod");

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Order state
  const [cart,             setCart]           = useState({ items: [], totalAmount: 0 });
  const [isPlacingOrder,   setIsPlacingOrder] = useState(false);
  const [orderPlaced,      setOrderPlaced]    = useState(false);
  const [placedOrderData,  setPlacedOrderData]= useState(null);
  const [showScratch,      setShowScratch]    = useState(false);
  const [showConfetti,     setShowConfetti]   = useState(false);

  // Profile modal — shown at order-click time when profile is incomplete
  const [showProfileModal,     setShowProfileModal]     = useState(false);
  const [missingProfileFields, setMissingProfileFields] = useState([]);

  // Derived
  const additionalCount   = savedAddressesList.filter((a) => a.type !== "primary").length;
  const isAddressLimitHit = additionalCount >= MAX_ADDITIONAL;
  const selectedAddressData = savedAddressesList.find((a) => a.id === selectedAddress);
  const subtotal   = cart?.totalAmount || 0;
  const deliveryFee = deliveryOption === "express" ? 99 : 0;
  const total = Math.max(0, subtotal - couponDiscount + deliveryFee);
  const totalSavings = couponDiscount;

  // ── On mount: fetch cart + check profile ──────────────────────────────────
  useEffect(() => { fetchCart(); }, []);

  useEffect(() => {
    if (user) {
      checkProfileAndLoadAddresses();
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      const res = await api.get("/cart");
      if (res.data.success) setCart(res.data.data);
    } catch (err) {
      const status = err?.response?.status;
      if (status && status !== 401) toast.error(err?.response?.data?.message || "Failed to load cart");
    }
  };

  // ── Coupon functions ─────────────────────────────────────────────────────
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setApplyingCoupon(true);

    try {
      const response = await api.post('/coupons/validate', {
        couponCode: couponCode.trim(),
        cartTotal: subtotal
      });

      const result = response.data;

      if (result.success) {
        setAppliedCoupon(result.data.coupon);
        setCouponDiscount(Number(result.data.discount) || 0);
        toast.success(result.message || 'Coupon applied successfully!');
      } else {
        toast.error(result.message || 'Invalid coupon code');
        setAppliedCoupon(null);
        setCouponDiscount(0);
      }
    } catch (err) {
      console.error('Apply coupon error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to apply coupon';
      toast.error(errorMessage);
      setAppliedCoupon(null);
      setCouponDiscount(0);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode("");
    toast.success('Coupon removed');
  };

  // ── Profile gate + address loader (single API call) ───────────────────────
  const checkProfileAndLoadAddresses = async () => {
    setProfileChecking(true);
    try {
      const res = await api.get("/auth/me");
      if (!res.data.success) return;

      const userData = res.data.data;

      // Profile gate — redirect if incomplete
      if (!isProfileComplete(userData)) {
        setProfileIncomplete(true);
        setProfileChecking(false);
        return;
      }

      setProfileIncomplete(false);
      parseAndSetAddresses(userData);
    } catch (err) {
      console.error("Profile check failed:", err);
    } finally {
      setProfileChecking(false);
    }
  };

  const loadUserAddresses = async () => {
    setIsLoadingAddresses(true);
    try {
      const res = await api.get("/auth/me");
      if (res.data.success) parseAndSetAddresses(res.data.data);
    } catch (err) {
      toast.error("Failed to load addresses");
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const parseAndSetAddresses = (userData) => {
    const addresses = [];

    // Primary address
    if (userData?.address) {
      let parsed = {};
      try {
        parsed = typeof userData.address === "string"
          ? JSON.parse(userData.address)
          : userData.address;
      } catch { parsed = {}; }

      addresses.push({
        id:        "primary",
        name:      userData.name  || "",
        phone:     userData.phone || "",
        street:    parsed.street  || "",
        city:      parsed.city    || "",
        state:     parsed.state   || "",
        pincode:   parsed.pincode || "",
        isDefault: true,
        type:      "primary",
      });
    }

    // Additional addresses
    let additional = userData?.additionalAddresses || [];
    if (typeof additional === "string") {
      try { additional = JSON.parse(additional); } catch { additional = []; }
    }
    if (Array.isArray(additional)) {
      additional.forEach((addr) => {
        addresses.push({
          id:        addr.id    || String(Math.random()),
          name:      addr.name  || userData.name  || "",
          phone:     addr.phone || userData.phone || "",
          street:    addr.street  || "",
          city:      addr.city    || "",
          state:     addr.state   || "",
          pincode:   addr.pincode || "",
          isDefault: addr.isDefault || false,
          type:      addr.type   || "other",
        });
      });
    }

    setSavedAddressesList(addresses);

    // Auto-select
    const def = addresses.find((a) => a.isDefault);
    setSelectedAddress((prev) => {
      if (prev && addresses.find((a) => a.id === prev)) return prev;
      return def?.id || addresses[0]?.id || "";
    });
  };

  // ── Add new address ────────────────────────────────────────────────────────
  const handleAddAddress = async () => {
    if (!newAddress.name || !newAddress.street || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      const res = await api.post("/auth/addresses", newAddress);
      if (res.data.success) {
        toast.success("Address added successfully");
        await loadUserAddresses();
        setShowAddressForm(false);
        setNewAddress({ name: user?.name || "", phone: user?.phone || "", street: "", city: "", state: "", pincode: "", type: "home" });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add address");
    }
  };

  // ── Profile check at order-click time ────────────────────────────────────
  // Re-fetches from API so stale state never causes a silent failure.
  const verifyProfileBeforeOrder = async () => {
    try {
      const res = await api.get("/auth/me");
      if (!res.data.success) return false;
      const userData = res.data.data;
      if (isProfileComplete(userData)) return true;
      // Profile incomplete — compute missing fields and show modal
      setMissingProfileFields(getMissingFields(userData));
      setShowProfileModal(true);
      return false;
    } catch {
      // Network / auth error — let the order attempt fail naturally
      return true;
    }
  };

  // ── COD order ─────────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (isPlacingOrder || !selectedAddressData) return;
    setIsPlacingOrder(true);
    try {
      // Re-verify profile freshly before placing order
      const profileOk = await verifyProfileBeforeOrder();
      if (!profileOk) { setIsPlacingOrder(false); return; }

      const shippingAddress = buildShippingAddress(selectedAddressData);
      const orderItems = buildOrderItems();
      if (!orderItems.length) { toast.error("Your cart is empty"); return; }

      const res = await api.post("/orders", {
        shippingAddress,
        orderItems,
        paymentMethod: "cod",
        notes: `Delivery: ${deliveryOption === "express" ? "Express (₹99)" : "Standard (Free)"}${appliedCoupon ? ` • Coupon: ${appliedCoupon.code} (${formatPrice(couponDiscount)} off)` : ''}`,
        billingAddress: shippingAddress,
        deliveryType: deliveryOption,
        couponCode: appliedCoupon?.code,
        couponDiscount: couponDiscount
      });

      if (res.data.success) {
        setPlacedOrderData(res.data.data || res.data.order);
        setOrderPlaced(true);
        window.dispatchEvent(new Event("cartUpdated"));
        window.dispatchEvent(new Event("refreshCart"));
        await fetchCart();
        setTimeout(() => setShowConfetti(true), 300);
        setTimeout(() => toast.success("Order placed!", { description: "Scratch to reveal your reward!" }), 600);
        setTimeout(() => setShowScratch(true), 1500);
      }
    } catch (err) {
      const status  = err?.response?.status;
      const message = err?.response?.data?.message || "Failed to place order";
      if (status === 400) toast.error(message);
      else if (status === 500) toast.error("Server error. Please try again.");
      else toast.error("Failed to place order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // ── PhonePe / UPI payment ─────────────────────────────────────────────────
  const handlePhonePePayment = async () => {
    if (isPlacingOrder || !selectedAddressData) return;
    setIsPlacingOrder(true);
    try {
      // Re-verify profile freshly before initiating payment
      const profileOk = await verifyProfileBeforeOrder();
      if (!profileOk) { setIsPlacingOrder(false); return; }

      const shippingAddress = buildShippingAddress(selectedAddressData);
      toast.loading("Preparing payment…", { id: "phonepe-init" });

      const res = await api.post("/payments/initiate", {
        shippingAddress,
        billingAddress: shippingAddress,
        deliveryType: deliveryOption,
        notes: `Delivery: ${deliveryOption === "express" ? "Express (₹99)" : "Standard (Free)"}${appliedCoupon ? ` • Coupon: ${appliedCoupon.code} (${formatPrice(couponDiscount)} off)` : ''}`,
        couponCode: appliedCoupon?.code,
        couponDiscount: couponDiscount
      });

      toast.dismiss("phonepe-init");

      if (res.data.success) {
        const { redirectUrl } = res.data.data;
        if (!redirectUrl) { toast.error("Could not get payment URL. Please try again."); return; }
        toast.success("Redirecting to PhonePe…");
        window.location.href = redirectUrl;
      } else {
        toast.error(res.data.message || "Payment initiation failed");
      }
    } catch (err) {
      toast.dismiss("phonepe-init");
      toast.error(err?.response?.data?.message || "Payment initiation failed. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const buildShippingAddress = (addr) => ({
    name:    addr.name,
    phone:   addr.phone,
    street:  addr.street,
    city:    addr.city,
    state:   addr.state,
    zipCode: addr.pincode,
    country: "India",
  });

  const buildOrderItems = () =>
    cart.items.map((item) => ({
      productId: Number(item.productId),
      name:      item.productName || item.product?.name || "Product",
      quantity:  parseInt(item.quantity) || 1,
      price:     parseFloat(item.product?.discountPrice || item.product?.price || item.price) || 0,
      colorName: item.colorName || null,
      total:     parseFloat(item.totalPrice) || 0,
    }));

  const goToStep = (step) => setCurrentStep(step);

  const handleScratchComplete = () => {
    toast.success("🎉 You won 10% off on your next order!", { description: "Coupon code: LUCKY10" });
  };

  // ── Step indicator ─────────────────────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {STEPS.map((step, i) => {
        const isActive   = currentStep === step.id;
        const isComplete = STEPS.findIndex((s) => s.id === currentStep) > i;
        const Icon       = step.icon;
        return (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => isComplete && goToStep(step.id)}
              disabled={!isComplete}
              className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors ${
                isActive    ? "bg-accent text-primary"
                : isComplete ? "bg-krishna-green text-white cursor-pointer"
                : "bg-muted text-muted-foreground"
              }`}
            >
              {isComplete ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`w-8 md:w-16 h-0.5 mx-1 ${isComplete ? "bg-krishna-green" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  // ── Profile incomplete gate UI ─────────────────────────────────────────────
  if (profileChecking) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-muted-foreground text-sm">Checking your profile…</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (profileIncomplete) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 px-4 max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-8 text-center shadow-sm"
          >
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Complete Your Profile First</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              To place an order we need your <strong>name</strong>, <strong>phone number</strong>,
              and a <strong>primary address</strong>. Email is optional.
            </p>
            <div className="space-y-3 text-left mb-6 px-2">
              {[
                { label: "Full Name",       required: true  },
                { label: "Phone Number",    required: true  },
                { label: "Primary Address", required: true  },
                { label: "Email",           required: false },
              ].map(({ label, required }) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${required ? "bg-amber-500/20" : "bg-green-500/20"}`}>
                    {required
                      ? <span className="text-amber-500 text-[10px] font-bold">!</span>
                      : <Check className="w-2.5 h-2.5 text-green-500" />
                    }
                  </div>
                  <span className={required ? "text-foreground" : "text-muted-foreground"}>
                    {label} {required ? <span className="text-amber-500">*</span> : <span className="text-xs">(optional)</span>}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("/account/profile")}
              className="w-full py-3 bg-accent hover:bg-krishna-orange-hover text-primary font-semibold rounded-xl transition-colors"
            >
              Go to Profile Settings
            </button>
            <Link to="/cart" className="block text-sm text-muted-foreground hover:text-foreground mt-3 transition-colors">
              ← Back to Cart
            </Link>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Address Step ───────────────────────────────────────────────────────────
  const AddressStep = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Select Delivery Address</h2>
      <p className="text-xs text-muted-foreground -mt-2">
        1 primary + up to {MAX_ADDITIONAL} saved addresses (total 4)
      </p>

      {isLoadingAddresses ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ) : savedAddressesList.length === 0 ? (
        <div className="text-center py-8">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No addresses found. Add one to continue.</p>
          <button onClick={() => setShowAddressForm(true)}
            className="bg-accent text-primary font-medium px-6 py-2 rounded-lg hover:bg-krishna-orange-hover transition-colors">
            + Add Address
          </button>
        </div>
      ) : (
        <>
          {/* Address list */}
          <div className="space-y-3">
            {savedAddressesList.map((addr) => (
              <label
                key={addr.id}
                className={`block p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedAddress === addr.id ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio" name="address"
                    checked={selectedAddress === addr.id}
                    onChange={() => setSelectedAddress(addr.id)}
                    className="mt-1 w-4 h-4 text-accent focus:ring-accent"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{addr.name}</span>
                      <span className="flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded capitalize">
                        {getAddressTypeIcon(addr.type)}{addr.type}
                      </span>
                      {addr.isDefault && (
                        <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">Primary</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                    <p className="text-sm text-muted-foreground">Phone: {addr.phone}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Add address button — hidden when 3 additional already saved */}
          {!isAddressLimitHit ? (
            <button
              onClick={() => {
                setNewAddress({ name: user?.name || "", phone: user?.phone || "", street: "", city: "", state: "", pincode: "", type: "home" });
                setShowAddressForm(true);
              }}
              className="w-full py-3 border-2 border-dashed border-border rounded-lg text-sm text-krishna-blue-link font-medium hover:border-accent transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New Address
              <span className="text-xs text-muted-foreground ml-1">
                ({MAX_ADDITIONAL - additionalCount} slot{MAX_ADDITIONAL - additionalCount !== 1 ? "s" : ""} left)
              </span>
            </button>
          ) : (
            <div className="w-full py-3 border border-border rounded-lg text-xs text-muted-foreground flex items-center justify-center gap-2 bg-muted/30">
              <Lock className="w-3.5 h-3.5" />
              Maximum {MAX_ADDITIONAL} additional addresses reached. Delete one from your profile to add more.
            </div>
          )}

          {selectedAddressData && (
            <button
              onClick={() => goToStep("delivery")}
              className="w-full py-3 bg-accent hover:bg-krishna-orange-hover text-primary font-medium rounded-lg transition-colors"
            >
              Deliver to this Address →
            </button>
          )}
        </>
      )}

      {/* Add address modal */}
      {showAddressForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg border border-border p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-foreground mb-4">Add New Address</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Full Name *</label>
                <input type="text" value={newAddress.name} onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Enter full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Phone Number</label>
                <input type="tel" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Enter phone number" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Address Type</label>
                <select value={newAddress.type} onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent">
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Street Address *</label>
                <textarea value={newAddress.street} onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="House no., Building, Street, Area" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">City *</label>
                  <input type="text" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent" placeholder="City" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">State *</label>
                  <input type="text" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent" placeholder="State" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Pincode *</label>
                <input type="text" value={newAddress.pincode}
                  onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                  className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="6-digit pincode" maxLength={6} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddressForm(false)}
                className="flex-1 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={handleAddAddress}
                className="flex-1 py-2 bg-accent text-primary font-medium rounded-lg hover:bg-krishna-orange-hover transition-colors text-sm">
                Save Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── Delivery Step ──────────────────────────────────────────────────────────
  const DeliveryStep = () => (
    <div className="space-y-4">
      {/* Back button */}
      <button onClick={() => goToStep("address")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors -mb-1">
        <ArrowLeft className="w-4 h-4" /> Change Address
      </button>

      {/* Selected address summary */}
      {selectedAddressData && (
        <div className="p-3 rounded-lg bg-muted/40 border border-border text-sm">
          <p className="font-medium text-foreground">{selectedAddressData.name}</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            {selectedAddressData.street}, {selectedAddressData.city}, {selectedAddressData.state} - {selectedAddressData.pincode}
          </p>
        </div>
      )}

      <h2 className="text-lg font-bold text-foreground">Choose Delivery Option</h2>

      <label className={`block p-4 rounded-lg border-2 cursor-pointer transition-colors ${
        deliveryOption === "standard" ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}>
        <div className="flex items-start gap-3">
          <input type="radio" name="delivery" checked={deliveryOption === "standard"}
            onChange={() => setDeliveryOption("standard")} className="mt-1 w-4 h-4 text-accent focus:ring-accent" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Standard Delivery</span>
              <span className="text-krishna-green font-medium">FREE</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Delivery by <strong>Tomorrow, 8 PM</strong></p>
          </div>
        </div>
      </label>

      <label className={`block p-4 rounded-lg border-2 cursor-pointer transition-colors ${
        deliveryOption === "express" ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}>
        <div className="flex items-start gap-3">
          <input type="radio" name="delivery" checked={deliveryOption === "express"}
            onChange={() => setDeliveryOption("express")} className="mt-1 w-4 h-4 text-accent focus:ring-accent" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Express Delivery</span>
              <span className="text-foreground font-medium">₹99</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Delivery by <strong>Today, 10 PM</strong></p>
          </div>
        </div>
      </label>

      <button onClick={() => goToStep("payment")}
        className="w-full py-3 bg-accent hover:bg-krishna-orange-hover text-primary font-medium rounded-lg transition-colors">
        Continue to Payment →
      </button>
    </div>
  );

  // ── Payment Step ───────────────────────────────────────────────────────────
  const PaymentStep = () => (
    <div className="space-y-4">
      {/* Back button */}
      <button onClick={() => goToStep("delivery")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors -mb-1">
        <ArrowLeft className="w-4 h-4" /> Change Delivery Option
      </button>

      {/* Delivery summary */}
      <div className="p-3 rounded-lg bg-muted/40 border border-border text-sm flex items-center justify-between">
        <span className="text-muted-foreground">
          {deliveryOption === "express" ? "Express Delivery" : "Standard Delivery"}
        </span>
        <span className={deliveryOption === "express" ? "text-foreground font-medium" : "text-krishna-green font-medium"}>
          {deliveryOption === "express" ? "₹99" : "FREE"}
        </span>
      </div>

      <h2 className="text-lg font-bold text-foreground">Payment Method</h2>

      <div className="space-y-2">
        {/* COD */}
        <label className={`block p-4 rounded-lg border-2 cursor-pointer transition-colors ${
          paymentMethod === "cod" ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}>
          <div className="flex items-center gap-3">
            <input type="radio" name="payment" checked={paymentMethod === "cod"}
              onChange={() => setPaymentMethod("cod")} className="w-4 h-4 text-accent focus:ring-accent" />
            <Banknote className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <span className="font-medium text-foreground">Cash on Delivery</span>
              <p className="text-xs text-muted-foreground">Pay when you receive</p>
            </div>
          </div>
        </label>

        {/* PhonePe / UPI */}
        <label className={`block p-4 rounded-lg border-2 cursor-pointer transition-colors ${
          paymentMethod === "upi" ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}>
          <div className="flex items-center gap-3">
            <input type="radio" name="payment" checked={paymentMethod === "upi"}
              onChange={() => setPaymentMethod("upi")} className="w-4 h-4 text-accent focus:ring-accent" />
            <Smartphone className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <span className="font-medium text-foreground">UPI / Cards / Net Banking</span>
              <p className="text-xs text-muted-foreground">Pay via PhonePe — UPI, Debit/Credit Card, Net Banking</p>
            </div>
         </div>
        </label>
      </div>

      <Confetti isActive={showConfetti} />

      <AnimatePresence mode="wait">
        {!orderPlaced ? (
          <motion.button
            key="place-order"
            onClick={paymentMethod === "upi" ? handlePhonePePayment : handlePlaceOrder}
            disabled={isPlacingOrder}
            className="w-full py-3 bg-accent hover:bg-krishna-orange-hover disabled:bg-muted disabled:cursor-not-allowed text-primary font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            whileHover={{ scale: isPlacingOrder ? 1 : 1.02 }}
            whileTap={{ scale: isPlacingOrder ? 1 : 0.98 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {isPlacingOrder ? (
              <><Loader2 className="w-4 h-4 animate-spin" />
                {paymentMethod === "upi" ? "Connecting to PhonePe…" : "Processing…"}
              </>
            ) : (
              <><Lock className="w-4 h-4" />
                {paymentMethod === "upi"
                  ? `Pay ₹${total.toLocaleString("en-IN")} via PhonePe`
                  : `Place Order • ${formatPrice(total)}`}
              </>
            )}
          </motion.button>
        ) : (
          <motion.div key="order-success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
            className="text-center space-y-4">
            <div className="bg-krishna-green/10 p-6 rounded-lg">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Check className="w-12 h-12 text-krishna-green" />
                <PartyPopper className="w-12 h-12 text-krishna-yellow" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Order Placed Successfully!</h3>
              <p className="text-muted-foreground mb-4">Thank you! You'll receive a confirmation SMS shortly.</p>
              {showScratch && (
                <div className="mb-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 opacity-20 blur-xl animate-pulse" />
                  <div className="relative bg-card border-2 border-dashed border-accent/50 rounded-xl p-4 shadow-lg">
                    <ScratchToReveal width={250} height={150} minScratchPercentage={40} onComplete={handleScratchComplete}
                      className="mx-auto rounded-lg overflow-hidden" gradientColors={["#FFD700", "#FFA500", "#FFD700"]}>
                      <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-indigo-900 to-purple-900 text-white p-4 text-center">
                        <h4 className="text-2xl font-black text-yellow-400 mb-1">10% OFF</h4>
                        <p className="text-sm font-medium opacity-90">Coupon Code:</p>
                        <div className="bg-white/20 px-3 py-1 rounded mt-1 font-mono font-bold tracking-widest border border-white/30">LUCKY10</div>
                      </div>
                    </ScratchToReveal>
                  </div>
                  <p className="text-xs font-medium text-accent mt-3 animate-bounce">✨ Scratch to reveal your reward! ✨</p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate("/")}
                className="flex-1 py-2 bg-accent text-sm text-primary font-medium rounded-lg hover:bg-krishna-orange-hover transition-colors">
                Continue Shopping
              </button>
              <button onClick={() => navigate("/account/orders")}
                className="flex-1 py-2 text-sm border border-border font-medium rounded-lg hover:bg-muted transition-colors">
                View Orders
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ── Profile incomplete modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowProfileModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{    opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-amber-500/8 border-b border-amber-500/20 px-6 pt-6 pb-5 text-center">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-7 h-7 text-amber-500" />
                </div>
                <h2 className="text-base font-bold text-foreground">Profile Incomplete</h2>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Please complete the following fields before placing your order.
                </p>
              </div>

              {/* Missing fields list */}
              <div className="px-6 py-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Missing information
                </p>
                <ul className="space-y-2">
                  {missingProfileFields.map((field) => (
                    <li key={field} className="flex items-center gap-2.5 text-sm">
                      <div className="w-5 h-5 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                        <span className="text-amber-500 text-[11px] font-bold">!</span>
                      </div>
                      <span className="text-foreground">{field}</span>
                    </li>
                  ))}
                </ul>

                <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                  <span className="font-medium text-foreground">Note:</span> Email address is optional
                  and not required to place an order.
                </p>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 flex flex-col gap-2">
                <button
                  onClick={() => navigate("/account/profile")}
                  className="w-full py-2.5 bg-accent hover:bg-krishna-orange-hover text-primary font-semibold rounded-xl transition-colors text-sm"
                >
                  Complete My Profile
                </button>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="w-full py-2.5 border border-border text-muted-foreground hover:bg-muted font-medium rounded-xl transition-colors text-sm"
                >
                  Back to Checkout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="container py-4 md:py-6 px-3 md:px-4 pb-20">
        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-4 text-center">Checkout</h1>

        <StepIndicator />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Main content */}
          <div className="lg:col-span-8">
            <div className="bg-card rounded-lg border border-border p-4 md:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentStep === "address"  && <AddressStep  />}
                  {currentStep === "delivery" && <DeliveryStep />}
                  {currentStep === "payment"  && <PaymentStep  />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-4">
            <div className="bg-card rounded-lg border border-border p-4 sticky top-24">
              <h2 className="font-bold text-foreground mb-4">Order Summary</h2>

              {/* Coupon Section */}
              <div className="mb-4 pb-4 border-b border-border">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={couponCode} 
                    onChange={(e) => setCouponCode(e.target.value)} 
                    placeholder="Enter coupon code" 
                    className="flex-1 px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent bg-background" 
                    disabled={!!appliedCoupon || applyingCoupon} 
                  />
                  {appliedCoupon ? (
                    <button 
                      onClick={removeCoupon} 
                      className="px-4 py-2 text-sm font-medium text-destructive hover:underline whitespace-nowrap"
                    >
                      Remove
                    </button>
                  ) : (
                    <button 
                      onClick={applyCoupon} 
                      disabled={!couponCode.trim() || applyingCoupon} 
                      className="px-4 py-2 text-sm font-medium text-accent hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 whitespace-nowrap"
                    >
                      {applyingCoupon && <Loader2 className="w-3 h-3 animate-spin" />}
                      Apply
                    </button>
                  )}
                </div>
                {appliedCoupon && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-accent">
                    <Tag className="w-4 h-4" />
                    <span>Coupon "{appliedCoupon.code}" applied! {appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}% off` : `${formatPrice(appliedCoupon.discountValue)} off`}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-4 pb-4 border-b border-border">
                {cart.items.map((item) => {
                  const imageUrl = getItemImageUrl(item);
                  return (
                    <div key={`${item.productId}-${item.colorName || ""}`} className="flex gap-3">
                      <div className="w-12 h-12 bg-white border border-border p-1 rounded overflow-hidden flex items-center justify-center shrink-0">
                        {imageUrl
                          ? <img src={imageUrl} alt={item.productName || "Product"} className="w-full h-full object-contain"
                              onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }} />
                          : <Tv className="w-6 h-6 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground line-clamp-1">{item.productName || item.product?.name || "Product"}</p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity}{item.colorName && ` • ${item.colorName}`}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-foreground shrink-0">
                        {formatPrice(item.totalPrice || item.price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(orderPlaced && placedOrderData ? placedOrderData.totalPrice : subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-accent">
                    <span>Coupon Discount</span>
                    <span>-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className={deliveryFee === 0 ? "text-krishna-green" : ""}>
                    {deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}
                  </span>
                </div>
              </div>
              <div className="border-t border-border mt-4 pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(orderPlaced && placedOrderData ? placedOrderData.finalAmount : total)}</span>
                </div>
                {totalSavings > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    You're saving {formatPrice(totalSavings)} on this order!
                  </p>
                )}
              </div>
              <Link to="/cart" className="block text-center text-sm text-krishna-blue-link mt-4 hover:underline">
                ← Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}