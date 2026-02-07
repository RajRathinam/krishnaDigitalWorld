import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Check, MapPin, Truck, CreditCard, Building2, Smartphone, Banknote, ShieldCheck, Lock, Tv, WashingMachine, PartyPopper, Plus, Home, Briefcase, MapPin as MapPinIcon, User as UserIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ScratchToReveal } from "@/components/ui/scratch-to-reveal";
import { Confetti } from "@/components/ui/confetti";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
const iconMap = {
  tv: Tv,
  "washing-machine": WashingMachine,
};
export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState("address");
  const [savedAddressesList, setSavedAddressesList] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [deliveryOption, setDeliveryOption] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [placedOrderData, setPlacedOrderData] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showScratch, setShowScratch] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  // New address form state
  const [newAddress, setNewAddress] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    type: "home",
  });
  const [cart, setCart] = useState({ items: [], totalAmount: 0 });
  // Fetch cart
  const fetchCart = async () => {
    try {
      const response = await api.get("/cart");
      if (response.data.success) {
        setCart(response.data.data);
      }
    }
    catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || "Failed to load cart";
      if (status && status !== 401) {
        toast.error(message);
      }
    }
  };
  // Load user addresses
  const loadUserAddresses = async () => {
    if (!user)
      return;
    setIsLoadingAddresses(true);
    try {
      const response = await api.get("/auth/me");
      if (response.data.success) {
        const userData = response.data.data;
        const addresses = [];
        // Add primary address if exists
        if (userData?.address) {
          let primaryAddress;
          let parsedAddress = {};
          try {
            // First, try to parse the address string as JSON
            if (typeof userData.address === "string") {
              parsedAddress = JSON.parse(userData.address);
            }
            else if (typeof userData.address === "object") {
              parsedAddress = userData.address;
            }
          }
          catch (e) {
            console.warn("Failed to parse address JSON:", e);
          }
          // Extract address components
          let street = parsedAddress.street || "";
          let city = parsedAddress.city || "";
          let state = parsedAddress.state || "";
          let pincode = parsedAddress.pincode || "";
          const fullAddress = parsedAddress.fullAddress || "";
          // If fullAddress exists, try to extract components from it
          if (fullAddress) {
            const parts = fullAddress.split(", ");
            if (parts.length > 0) {
              // First part is the street
              if (!street && parts[0]) {
                street = parts[0];
              }
              // Look for pincode in the last part
              const lastPart = parts[parts.length - 1];
              if (/\d{6}/.test(lastPart)) {
                pincode = lastPart.replace(/\D/g, "").slice(0, 6);
              }
              // Everything between first and last could be city/state
              if (parts.length > 2) {
                const middleParts = parts.slice(1, parts.length - 1);
                if (!city && middleParts.length > 0) {
                  city = middleParts.join(", ");
                }
              }
            }
          }
          primaryAddress = {
            id: "primary",
            name: userData.name || "",
            phone: userData.phone || "",
            street: street,
            city: city,
            state: state,
            pincode: pincode,
            isDefault: true,
            type: "primary",
          };
          addresses.push(primaryAddress);
        }
        // Add additional addresses
        if (userData?.additionalAddresses) {
          let additional = userData.additionalAddresses;
          try {
            if (typeof additional === 'string') {
              additional = JSON.parse(additional);
            }
          } catch (e) {
            console.warn("Failed to parse additionalAddresses:", e);
            additional = [];
          }

          if (Array.isArray(additional)) {
            additional.forEach((addr) => {
              addresses.push({
                id: addr.id || String(Math.random()),
                name: addr.name || userData.name || "",
                phone: addr.phone || userData.phone || "",
                street: addr.street || "",
                city: addr.city || "",
                state: addr.state || "",
                pincode: addr.pincode || "",
                isDefault: addr.isDefault || false,
                type: addr.type || "other",
              });
            });
          }
        }
        // DEBUG LOG: Check what addresses are loaded
        console.log("🚀 DEBUG - Loaded addresses:", {
          userData: userData,
          addresses: addresses,
          selectedAddress: addresses.find(addr => addr.isDefault)?.id || addresses[0]?.id
        });
        setSavedAddressesList(addresses);
        // Select default address or the most recently added one (last in list)
        // If we just added an address, we want to select it
        const defaultAddress = addresses.find((addr) => addr.isDefault);

        if (selectedAddress && addresses.find(a => a.id === selectedAddress)) {
          // Keep current selection if valid
        } else if (defaultAddress) {
          setSelectedAddress(defaultAddress.id);
        } else if (addresses.length > 0) {
          // Default to the last added address (newest) if no default exists
          setSelectedAddress(addresses[addresses.length - 1].id);
        }
      }
    }
    catch (err) {
      console.error("Failed to load addresses:", err);
      toast.error("Failed to load addresses");
    }
    finally {
      setIsLoadingAddresses(false);
    }
  };
  const testBackendHealth = async () => {
    try {
      console.log("🩺 Testing backend health...");

      // Test known working endpoints using configured API instance
      const knownEndpoints = [
        "/auth/me",
        "/cart",
        "/products"
      ];

      for (const endpoint of knownEndpoints) {
        try {
          const response = await api.get(endpoint);
          console.log(`✅ ${endpoint}:`, response.status);
        }
        catch (e) {
          console.log(`❌ ${endpoint}:`, e.response?.status, e.message);
        }
      }
    }
    catch (error) {
      console.error("Health check failed:", error);
    }
  };
  // Call this once
  useEffect(() => {
    testBackendHealth();
  }, []);
  // Add new address
  const handleAddAddress = async () => {
    if (!user) {
      toast.error("Please sign in to add address");
      return;
    }
    try {
      // Validate required fields
      if (!newAddress.name || !newAddress.street || !newAddress.city || !newAddress.state || !newAddress.pincode) {
        toast.error("Please fill all required fields");
        return;
      }
      const response = await api.post("/auth/addresses", newAddress);
      if (response.data.success) {
        toast.success("Address added successfully");
        await loadUserAddresses();
        setShowAddressForm(false);
        setNewAddress({
          name: user.name || "",
          phone: user.phone || "",
          street: "",
          city: "",
          state: "",
          pincode: "",
          type: "home",
        });
      }
    }
    catch (err) {
      const message = err?.response?.data?.message || "Failed to add address";
      toast.error(message);
    }
  };
  // Place order with endpoint fallback
  const handlePlaceOrder = async () => {
    if (isPlacingOrder)
      return;
    try {
      if (!user) {
        toast.error("Please sign in to place an order");
        return;
      }
      if (!selectedAddressData) {
        toast.error("Please select a delivery address");
        return;
      }
      setIsPlacingOrder(true);
      // Build shipping address
      const shippingAddress = {
        name: selectedAddressData.name,
        phone: selectedAddressData.phone,
        street: selectedAddressData.street,
        city: selectedAddressData.city,
        state: selectedAddressData.state,
        zipCode: selectedAddressData.pincode,
        country: 'India',
      };
      // Prepare order items
      const orderItems = cart.items.map((item) => {
        const productId = Number(item.productId);
        const itemPrice = parseFloat(item.product?.discountPrice || item.product?.price || item.price) || 0;
        const quantity = parseInt(item.quantity) || 1;
        const total = parseFloat(item.totalPrice) || itemPrice * quantity;
        return {
          productId,
          name: item.productName || item.product?.name || "Product",
          quantity,
          price: itemPrice,
          colorName: item.colorName || null,
          total,
        };
      });
      if (orderItems.length === 0) {
        toast.error("Your cart is empty");
        setIsPlacingOrder(false);
        return;
      }
      const orderPayload = {
        shippingAddress,
        orderItems,
        paymentMethod: paymentMethod.toLowerCase(),
        notes: `Delivery: ${deliveryOption === "express" ? "Express (₹99)" : "Standard (Free)"}`,
        billingAddress: shippingAddress,
        deliveryType: deliveryOption, // Send delivery type (standard/express)
      };
      console.log("🚀 Order payload:", orderPayload);
      // Direct endpoint call
      const endpoint = "/orders";

      let response;
      try {
        console.log(`🔄 Sending order to: ${endpoint}`);
        response = await api.post(endpoint, orderPayload);
        console.log('✅ Order placed successfully');
      } catch (err) {
        console.error(`❌ Order placement failed:`, err?.response?.status || 'Unknown', err?.response?.data?.message || err.message);
        throw err;
      }
      if (response.data.success) {
        // On success, save order details for display
        setPlacedOrderData(response.data.data || response.data.order);
        setOrderPlaced(true);
        // Force update cart count in header
        window.dispatchEvent(new Event('cartUpdated'));
        window.dispatchEvent(new Event('refreshCart'));
        await fetchCart();

        setTimeout(() => setShowConfetti(true), 300);
        setTimeout(() => {
          toast.success("Order placed successfully!", {
            description: "Scratch below to reveal your reward!",
          });
        }, 600);
        setTimeout(() => setShowScratch(true), 1500);
      }
    }
    catch (err) {
      console.error("Order placement error:", {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
        endpointTried: err?.config?.url
      });
      const status = err?.response?.status;
      const message = err?.response?.data?.message || "Failed to place order";
      if (status === 404) {
        toast.error("Order endpoint not found. Please contact support.");
      }
      else if (status === 400) {
        toast.error(message || "Invalid order data");
      }
      else if (status === 500) {
        toast.error("Server error. Please try again.");
      }
      else {
        toast.error("Failed to place order. Please try again.");
      }
    }
    finally {
      setIsPlacingOrder(false);
    }
  };
  const handleScratchComplete = () => {
    toast.success("🎉 You won 10% off on your next order!", {
      description: "Coupon code: LUCKY10",
    });
  };
  // Initial data loading
  useEffect(() => {
    fetchCart();
  }, []);
  useEffect(() => {
    if (user) {
      loadUserAddresses();
    }
  }, [user]);
  const selectedAddressData = savedAddressesList.find((addr) => addr.id === selectedAddress);
  const subtotal = cart?.totalAmount || 0;
  const deliveryFee = deliveryOption === "express" ? 99 : 0;
  const total = subtotal + deliveryFee;
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };
  const getAddressTypeIcon = (type) => {
    switch (type) {
      case "home":
        return <Home className="w-4 h-4" />;
      case "work":
        return <Briefcase className="w-4 h-4" />;
      case "primary":
        return <UserIcon className="w-4 h-4" />;
      default:
        return <MapPinIcon className="w-4 h-4" />;
    }
  };
  const steps = [
    { id: "address", label: "Address", icon: MapPin },
    { id: "delivery", label: "Delivery", icon: Truck },
    { id: "payment", label: "Payment", icon: CreditCard },
  ];
  const StepIndicator = () => (<div className="flex items-center justify-center mb-6">
    {steps.map((step, i) => {
      const isActive = currentStep === step.id;
      const isComplete = steps.findIndex((s) => s.id === currentStep) > i;
      const Icon = step.icon;
      return (<div key={step.id} className="flex items-center">
        <button onClick={() => isComplete && setCurrentStep(step.id)} disabled={!isComplete} className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors ${isActive
          ? "bg-accent text-primary"
          : isComplete
            ? "bg-krishna-green text-white cursor-pointer"
            : "bg-muted text-muted-foreground"}`}>
          {isComplete ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
          <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
        </button>
        {i < steps.length - 1 && (<div className={`w-8 md:w-16 h-0.5 mx-1 ${isComplete ? "bg-krishna-green" : "bg-muted"}`} />)}
      </div>);
    })}
  </div>);
  const AddressStep = () => (<div className="space-y-4">
    <h2 className="text-lg font-bold text-foreground">Select Delivery Address</h2>

    {!user ? (<div className="text-center py-8">
      <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
      <p className="text-muted-foreground mb-4">Please sign in to select delivery address</p>
      <Link to="/" className="inline-block bg-accent text-primary font-medium px-6 py-2 rounded-lg">
        Sign in / Register
      </Link>
    </div>) : isLoadingAddresses ? (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    ) : savedAddressesList.length === 0 ? (<div className="text-center py-8">
      <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
      <p className="text-muted-foreground mb-4">No saved addresses found</p>
      <button onClick={() => setShowAddressForm(true)} className="inline-block bg-accent text-primary font-medium px-6 py-2 rounded-lg">
        + Add Address
      </button>
    </div>) : (<>
      {savedAddressesList.map((addr) => (<label key={addr.id} className={`block p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedAddress === addr.id
        ? "border-accent bg-accent/5"
        : "border-border hover:border-accent/50"}`}>
        <div className="flex items-start gap-3">
          <input type="radio" name="address" checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} className="mt-1 w-4 h-4 text-accent focus:ring-accent" />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-foreground">{addr.name}</span>
              <span className="flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded capitalize">
                {getAddressTypeIcon(addr.type)}
                {addr.type}
              </span>
              {addr.isDefault && (<span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">Default</span>)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
            </p>
            <p className="text-sm text-muted-foreground">Phone: {addr.phone}</p>
          </div>
        </div>
      </label>))}

      <button onClick={() => {
        setNewAddress({
          name: user?.name || "",
          phone: user?.phone || "",
          street: "",
          city: "",
          state: "",
          pincode: "",
          type: "home",
        });
        setShowAddressForm(true);
      }} className="w-full py-3 border-2 border-dashed border-border rounded-lg text-sm text-krishna-blue-link font-medium hover:border-accent transition-colors flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" />
        Add New Address
      </button>

      {selectedAddressData && (<button onClick={() => setCurrentStep("delivery")} className="w-full py-3 bg-accent hover:bg-krishna-orange-hover text-primary font-medium rounded-lg transition-colors mt-4">
        Deliver to this Address
      </button>)}
    </>)}

    {showAddressForm && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg border border-border p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-foreground mb-4">Add New Address</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Full Name *</label>
            <input type="text" value={newAddress.name} onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Enter full name" />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Phone Number</label>
            <input type="tel" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Enter phone number" />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Address Type</label>
            <select value={newAddress.type} onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="home">Home</option>
              <option value="work">Work</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Street Address *</label>
            <textarea value={newAddress.street} onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent" placeholder="House no., Building, Street, Area" rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">City *</label>
              <input type="text" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent" placeholder="City" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">State *</label>
              <input type="text" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent" placeholder="State" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Pincode *</label>
            <input type="text" value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent" placeholder="6-digit pincode" maxLength={6} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={() => {
            setShowAddressForm(false);
            setNewAddress({
              name: "",
              phone: "",
              street: "",
              city: "",
              state: "",
              pincode: "",
              type: "home",
            });
          }} className="flex-1 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
            Cancel
          </button>
          <button onClick={handleAddAddress} className="flex-1 py-2 bg-accent text-primary font-medium rounded-lg hover:bg-krishna-orange-hover transition-colors">
            Save Address
          </button>
        </div>
      </div>
    </div>)}
  </div>);
  const DeliveryStep = () => (<div className="space-y-4">
    <h2 className="text-lg font-bold text-foreground">Choose Delivery Option</h2>

    <label className={`block p-4 rounded-lg border-2 cursor-pointer transition-colors ${deliveryOption === "standard" ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}>
      <div className="flex items-start gap-3">
        <input type="radio" name="delivery" checked={deliveryOption === "standard"} onChange={() => setDeliveryOption("standard")} className="mt-1 w-4 h-4 text-accent focus:ring-accent" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">Standard Delivery</span>
            <span className="text-krishna-green font-medium">FREE</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Delivery by <strong>Tomorrow, 8 PM</strong>
          </p>
        </div>
      </div>
    </label>

    <label className={`block p-4 rounded-lg border-2 cursor-pointer transition-colors ${deliveryOption === "express" ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}>
      <div className="flex items-start gap-3">
        <input type="radio" name="delivery" checked={deliveryOption === "express"} onChange={() => setDeliveryOption("express")} className="mt-1 w-4 h-4 text-accent focus:ring-accent" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">Express Delivery</span>
            <span className="text-foreground font-medium">₹99</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Delivery by <strong>Today, 10 PM</strong>
          </p>
        </div>
      </div>
    </label>

    <button onClick={() => setCurrentStep("payment")} className="w-full py-3 bg-accent hover:bg-krishna-orange-hover text-primary font-medium rounded-lg transition-colors">
      Continue to Payment
    </button>
  </div>);
  const PaymentStep = () => (<div className="space-y-4">
    <h2 className="text-lg font-bold text-foreground">Payment Method</h2>

    <div className="space-y-2">
      {/* Cash on Delivery - Enabled */}
      <label className={`block p-4 rounded-lg border-2 cursor-pointer transition-colors ${paymentMethod === "cod" ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}>
        <div className="flex items-center gap-3">
          <input type="radio" name="payment" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="w-4 h-4 text-accent focus:ring-accent" />
          <Banknote className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <span className="font-medium text-foreground">Cash on Delivery</span>
            <p className="text-xs text-muted-foreground">Pay when you receive</p>
          </div>
        </div>
      </label>

      {/* Other payment methods - Disabled with coming soon message */}
      {[
        { id: "upi", label: "UPI", desc: "Google Pay, PhonePe, Paytm", icon: Smartphone },
        { id: "card", label: "Credit / Debit Card", desc: "Visa, Mastercard, Rupay", icon: CreditCard },
        { id: "netbanking", label: "Net Banking", desc: "All major banks", icon: Building2 },
      ].map((method) => (<div key={method.id} className="block p-4 rounded-lg border-2 border-border bg-muted/30 cursor-not-allowed relative">
        <div className="flex items-center gap-3 opacity-50">
          <input type="radio" name="payment" disabled className="w-4 h-4" />
          <method.icon className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <span className="font-medium text-foreground">{method.label}</span>
            <p className="text-xs text-muted-foreground">{method.desc}</p>
          </div>
        </div>
        <span className="absolute top-2 right-2 text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
          Coming Soon
        </span>
      </div>))}
    </div>

    <Confetti isActive={showConfetti} />

    <AnimatePresence mode="wait">
      {!orderPlaced ? (<motion.button key="place-order" onClick={handlePlaceOrder} disabled={isPlacingOrder} className="w-full py-3 bg-accent hover:bg-krishna-orange-hover disabled:bg-muted disabled:cursor-not-allowed text-primary font-medium rounded-lg transition-colors flex items-center justify-center gap-2" whileHover={{ scale: isPlacingOrder ? 1 : 1.02 }} whileTap={{ scale: isPlacingOrder ? 1 : 0.98 }} initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
        {isPlacingOrder ? (<>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          Processing...
        </>) : (<>
          <Lock className="w-4 h-4" />
          Place Order • {formatPrice(total)}
        </>)}
      </motion.button>) : (<motion.div key="order-success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="text-center space-y-4">
        <div className="bg-krishna-green/10 p-6 rounded-lg">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Check className="w-12 h-12 text-krishna-green" />
            <PartyPopper className="w-12 h-12 text-krishna-yellow" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Order Placed Successfully!</h3>
          <p className="text-muted-foreground mb-4">
            Thank you for your order. You will receive a confirmation SMS shortly.
          </p>
          {showScratch && (<div className="mb-4 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 opacity-20 blur-xl animate-pulse"></div>
            <div className="relative bg-card border-2 border-dashed border-accent/50 rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <ScratchToReveal
                width={250}
                height={150}
                minScratchPercentage={40}
                onComplete={handleScratchComplete}
                className="mx-auto rounded-lg overflow-hidden"
                gradientColors={["#FFD700", "#FFA500", "#FFD700"]}
              >
                <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-indigo-900 to-purple-900 text-white p-4 text-center">
                  <h4 className="text-2xl font-black text-yellow-400 mb-1">10% OFF</h4>
                  <p className="text-sm font-medium opacity-90">Coupon Code:</p>
                  <div className="bg-white/20 px-3 py-1 rounded mt-1 font-mono font-bold tracking-widest border border-white/30">LUCKY10</div>
                </div>
              </ScratchToReveal>
            </div>
            <p className="text-xs font-medium text-accent mt-3 animate-bounce">✨ Scratch above to reveal your surprise reward! ✨</p>
          </div>)}
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate("/")} className="flex-1 py-2 bg-accent text-primary font-medium rounded-lg hover:bg-krishna-orange-hover transition-colors">
            Continue Shopping
          </button>
          <button onClick={() => navigate("/account")} className="flex-1 py-2 border border-border font-medium rounded-lg hover:bg-muted transition-colors">
            View Orders
          </button>
        </div>
      </motion.div>)}
    </AnimatePresence>


  </div>);
  return (<div className="min-h-screen bg-background">
    <Header />

    <div className="container py-4 md:py-6 px-3 md:px-4 pb-20">
      <h1 className="text-xl md:text-2xl font-bold text-foreground mb-4 text-center">Checkout</h1>

      <StepIndicator />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-8">
          <div className="bg-card rounded-lg border border-border p-4 md:p-6">
            {currentStep === "address" && AddressStep()}
            {currentStep === "delivery" && DeliveryStep()}
            {currentStep === "payment" && PaymentStep()}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4">
          <div className="bg-card rounded-lg border border-border p-4 sticky top-24">
            <h2 className="font-bold text-foreground mb-4">Order Summary</h2>

            <div className="space-y-3 mb-4 pb-4 border-b border-border">
              {cart.items.map((item) => (<div key={`${item.productId}-${item.colorName || ""}`} className="flex gap-3">
                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center shrink-0">
                  <Tv className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground line-clamp-1">
                    {item.productName || item.product?.name || "Product"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Qty: {item.quantity}
                    {item.colorName && ` • Color: ${item.colorName}`}
                  </p>
                </div>
                <span className="text-sm font-medium text-foreground shrink-0">
                  {formatPrice(item.totalPrice || item.price * item.quantity)}
                </span>
              </div>))}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">
                  {formatPrice(orderPlaced && placedOrderData ? placedOrderData.totalPrice : subtotal)}
                </span>
              </div>

              {/* Tax Display */}
              {orderPlaced && placedOrderData && parseFloat(placedOrderData.taxAmount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="text-foreground">{formatPrice(placedOrderData.taxAmount)}</span>
                </div>
              )}

              {/* Discount Display */}
              {orderPlaced && placedOrderData && parseFloat(placedOrderData.discountAmount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-green-600">-{formatPrice(placedOrderData.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className={(orderPlaced && placedOrderData ? parseFloat(placedOrderData.shippingCost) : deliveryFee) === 0 ? "text-krishna-green" : "text-foreground"}>
                  {(orderPlaced && placedOrderData ? parseFloat(placedOrderData.shippingCost) : deliveryFee) === 0 ? "FREE" : formatPrice(orderPlaced && placedOrderData ? placedOrderData.shippingCost : deliveryFee)}
                </span>
              </div>
            </div>

            <div className="border-t border-border mt-4 pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-foreground">
                  {formatPrice(orderPlaced && placedOrderData ? placedOrderData.finalAmount : total)}
                </span>
              </div>
            </div>

            <Link to="/cart" className="block text-center text-sm text-krishna-blue-link mt-4 hover:underline">
              ← Back to Cart
            </Link>
          </div>
        </div>
      </div>
    </div>

    <Footer />
  </div>);
}
