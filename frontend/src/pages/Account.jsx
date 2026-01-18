import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { User, Package, Heart, LogOut, ChevronRight, ShoppingBag, Truck, Check, X, Calendar, MapPin, Plus, Home, Briefcase, MapPin as MapPinIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { baseUrl } from '@/config/baseUrl';
// Base API configuration
const API_BASE_URL = baseUrl;
// Helper function to get auth token
const getAuthToken = () => localStorage.getItem('authToken');
// Helper function for API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  const data = await response.json();
  // Ensure consistent response format
  const formattedResponse = {
    success: data.success !== undefined ? data.success : response.ok,
    data: data.data || data,
    message: data.message || '',
    errors: data.errors || [],
    status: response.status,
  };
  if (!response.ok && !formattedResponse.success) {
    throw new Error(formattedResponse.message || 'Request failed');
  }
  return formattedResponse;
};
// API functions
const api = {
  // Auth API
  getMe: async () => {
    return apiRequest('/auth/me');
  },
  updateMe: async (data) => {
    return apiRequest('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  // Address API
  addAddress: async (addressData) => {
    return apiRequest('/auth/addresses', {
      method: 'POST',
      body: JSON.stringify(addressData),
    });
  },
  updateAddress: async (addressId, addressData) => {
    return apiRequest(`/auth/addresses/${addressId}`, {
      method: 'PUT',
      body: JSON.stringify(addressData),
    });
  },
  deleteAddress: async (addressId) => {
    return apiRequest(`/auth/addresses/${addressId}`, {
      method: 'DELETE',
    });
  },
  setDefaultAddress: async (addressId) => {
    return apiRequest(`/auth/addresses/${addressId}/default`, {
      method: 'PUT',
    });
  },
  // Order API
  getOrders: async () => {
    return apiRequest('/orders');
  },
  getOrderDetails: async (id) => {
    return apiRequest(`/orders/${id}`);
  },
  cancelOrder: async (id, reason) => {
    return apiRequest(`/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};
export default function Account() {
  const [activeTab, setActiveTab] = useState("orders");
  const { user, loading, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  // Profile fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  // Primary address fields (from profile tab)
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  // Additional addresses (for addresses tab)
  const [additionalAddresses, setAdditionalAddresses] = useState([]);
  const [primaryAddress, setPrimaryAddress] = useState(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  // New address form
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    type: 'home'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState([]);
  // Load user data including addresses
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setDateOfBirth(user.dateOfBirth || "");
      // Load addresses
      loadUserAddresses();
    }
  }, [user]);
  const loadUserAddresses = async () => {
    if (!user)
      return;
    setIsLoadingAddresses(true);
    try {
      const response = await api.getMe();
      if (response.success) {
        const userData = response.data;
        // Parse primary address
        let primary = null;
        if (userData?.address) {
          if (typeof userData.address === 'object') {
            primary = {
              id: 'primary',
              name: userData.name || '',
              phone: userData.phone || '',
              street: userData.address.street || '',
              city: userData.address.city || userData.address.district || '',
              state: userData.address.state || '',
              pincode: userData.address.pincode || '',
              isDefault: true,
              type: 'primary'
            };
          }
          else {
            // Parse string address
            const addressString = userData.address;
            let parsedStreet = '';
            let parsedCity = '';
            let parsedState = '';
            let parsedPincode = '';

            // Try to parse as JSON first
            try {
              const parsed = JSON.parse(addressString);
              parsedStreet = parsed.street || '';
              parsedCity = parsed.city || '';
              parsedState = parsed.state || '';
              parsedPincode = parsed.pincode || '';
            } catch (e) {
              // Fallback to split if not JSON
              const parts = addressString.split(', ');
              parsedStreet = parts[0] || '';
              parsedCity = parts.length > 1 ? parts.slice(1, -1).join(', ') : '';
              parsedPincode = parts.length > 0 && /\d{6}/.test(parts[parts.length - 1]) ? parts[parts.length - 1] : '';
            }

            primary = {
              id: 'primary',
              name: userData.name || '',
              phone: userData.phone || '',
              street: parsedStreet,
              city: parsedCity,
              state: parsedState,
              pincode: parsedPincode,
              isDefault: true,
              type: 'primary'
            };
          }
          // Set primary address fields for profile tab
          if (primary) {
            setStreet(primary.street || "");
            setCity(primary.city || "");
            setState(primary.state || "");
            setPincode(primary.pincode || "");
          }
        }
        // Parse additional addresses
        const additional = [];
        if (userData?.additionalAddresses && Array.isArray(userData.additionalAddresses)) {
          userData.additionalAddresses.forEach((addr) => {
            additional.push({
              id: addr.id || String(Math.random()),
              name: addr.name || userData.name || '',
              phone: addr.phone || userData.phone || '',
              street: addr.street || '',
              city: addr.city || '',
              state: addr.state || '',
              pincode: addr.pincode || '',
              isDefault: addr.isDefault || false,
              type: addr.type || 'other',
              createdAt: addr.createdAt,
              updatedAt: addr.updatedAt
            });
          });
        }
        setPrimaryAddress(primary);
        setAdditionalAddresses(additional);
      }
    }
    catch (err) {
      console.error('Failed to load addresses:', err);
      toast({ title: 'Error', description: 'Failed to load addresses' });
    }
    finally {
      setIsLoadingAddresses(false);
    }
  };
  useEffect(() => {
    if (user && activeTab === "orders") {
      fetchOrders();
    }
  }, [user, activeTab]);
  useEffect(() => {
    if (activeTab === "wishlist") {
      loadWishlist();
    }
  }, [activeTab]);
  const fetchOrders = async () => {
    if (!user)
      return;
    setOrdersLoading(true);
    try {
      const response = await api.getOrders();
      if (response.success) {
        // Handle the response structure correctly
        if (response.data && response.data.orders) {
          setOrders(response.data.orders);
        }
        else if (Array.isArray(response.data)) {
          setOrders(response.data);
        }
        else {
          setOrders([]);
        }
      }
    }
    catch (err) {
      console.error('Failed to fetch orders:', err);
      toast({ title: 'Error', description: 'Failed to load orders' });
    }
    finally {
      setOrdersLoading(false);
    }
  };
  const loadWishlist = () => {
    const wishlist = localStorage.getItem("wishlist_items");
    if (wishlist) {
      try {
        setWishlistItems(JSON.parse(wishlist));
      }
      catch (err) {
        console.error('Failed to parse wishlist:', err);
      }
    }
    else {
      setWishlistItems([]);
    }
  };
  const removeFromWishlist = (productId) => {
    const updatedWishlist = wishlistItems.filter(item => item.id !== productId);
    localStorage.setItem("wishlist_items", JSON.stringify(updatedWishlist));
    setWishlistItems(updatedWishlist);
    toast({
      title: "Removed from Wishlist",
      description: "Item removed from your wishlist.",
    });
  };
  // Profile tab save handler
  const handleSaveProfile = async () => {
    if (!user)
      return;
    setIsSaving(true);
    try {
      const updateData = {
        name,
        email: email || null
      };
      if (dateOfBirth)
        updateData.dateOfBirth = dateOfBirth;
      // Update primary address
      if (street.trim() || city.trim() || pincode.trim()) {
        updateData.address = {
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          fullAddress: `${street.trim()}${city.trim() ? `, ${city.trim()}` : ''}${pincode.trim() ? `, ${pincode.trim()}` : ''}`
        };
      }
      const response = await api.updateMe(updateData);
      if (response.success) {
        toast({ title: 'Profile updated successfully' });
        await refreshUser();
        await loadUserAddresses();
      }
    }
    catch (err) {
      toast({ title: 'Update failed', description: err?.message || 'Unable to update profile' });
    }
    finally {
      setIsSaving(false);
    }
  };
  // Address management handlers
  const handleAddAddress = async () => {
    if (!user)
      return;
    try {
      // Validate required fields
      if (!newAddress.name || !newAddress.street || !newAddress.city || !newAddress.state || !newAddress.pincode) {
        toast({ title: 'Error', description: 'Please fill all required fields' });
        return;
      }
      const response = await api.addAddress(newAddress);
      if (response.success) {
        toast({ title: 'Address added successfully' });
        setAdditionalAddresses(response.data.additionalAddresses || []);
        setShowAddressForm(false);
        setNewAddress({
          name: user.name || '',
          phone: user.phone || '',
          street: '',
          city: '',
          state: '',
          pincode: '',
          type: 'home'
        });
      }
    }
    catch (err) {
      toast({ title: 'Error', description: err?.message || 'Failed to add address' });
    }
  };
  const handleUpdateAddress = async () => {
    if (!user || !editingAddress)
      return;
    try {
      const response = await api.updateAddress(editingAddress.id, newAddress);
      if (response.success) {
        toast({ title: 'Address updated successfully' });
        setAdditionalAddresses(response.data.additionalAddresses || []);
        setShowAddressForm(false);
        setEditingAddress(null);
        setNewAddress({
          name: user.name || '',
          phone: user.phone || '',
          street: '',
          city: '',
          state: '',
          pincode: '',
          type: 'home'
        });
      }
    }
    catch (err) {
      toast({ title: 'Error', description: err?.message || 'Failed to update address' });
    }
  };
  const handleDeleteAddress = async (addressId) => {
    if (!user)
      return;
    if (!confirm('Are you sure you want to delete this address?'))
      return;
    try {
      const response = await api.deleteAddress(addressId);
      if (response.success) {
        toast({ title: 'Address deleted successfully' });
        setAdditionalAddresses(response.data.additionalAddresses || []);
      }
    }
    catch (err) {
      toast({ title: 'Error', description: err?.message || 'Failed to delete address' });
    }
  };
  const handleSetDefaultAddress = async (addressId) => {
    if (!user)
      return;
    try {
      const response = await api.setDefaultAddress(addressId);
      if (response.success) {
        toast({ title: 'Default address updated' });
        setAdditionalAddresses(response.data.additionalAddresses || []);
      }
    }
    catch (err) {
      toast({ title: 'Error', description: err?.message || 'Failed to set default address' });
    }
  };
  const formatPrice = (price) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(numPrice);
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "delivered": return "text-green-600 bg-green-50";
      case "shipped": return "text-blue-600 bg-blue-50";
      case "confirmed": return "text-yellow-600 bg-yellow-50";
      case "pending": return "text-orange-600 bg-orange-50";
      case "cancelled": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };
  const getStatusIcon = (status) => {
    switch (status) {
      case "delivered": return <Check className="w-4 h-4" />;
      case "shipped": return <Truck className="w-4 h-4" />;
      case "confirmed": return <Package className="w-4 h-4" />;
      case "pending": return <Package className="w-4 h-4" />;
      case "cancelled": return <X className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };
  const getAddressTypeIcon = (type) => {
    switch (type) {
      case 'home':
        return <Home className="w-4 h-4" />;
      case 'work':
        return <Briefcase className="w-4 h-4" />;
      case 'primary':
        return <User className="w-4 h-4" />;
      default:
        return <MapPinIcon className="w-4 h-4" />;
    }
  };
  const menuItems = [
    { id: "orders", label: "My Orders", icon: Package },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "profile", label: "Profile", icon: User },
    { id: "addresses", label: "Addresses", icon: MapPin },
  ];
  return (<div className="min-h-screen bg-background">
    <Header />

    <div className="container py-4 md:py-6 px-3 md:px-4">
      <h1 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">My Account</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="bg-card rounded-lg border border-border p-4 sticky top-24">
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="font-medium text-foreground">{user?.name || 'Guest'}</p>
                <p className="text-sm text-muted-foreground">{user?.email || user?.phone || 'Not signed in'}</p>
              </div>
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => (<button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === item.id
                ? "bg-accent/10 text-accent font-medium"
                : "text-foreground hover:bg-muted"}`}>
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>))}
              <button onClick={async () => {
                await logout();
                navigate('/');
                toast({ title: 'Signed out' });
              }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors">
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </nav>
          </div>
        </aside>

        {/* Mobile Tab Bar */}
        <div className="lg:hidden overflow-x-auto scrollbar-hide -mx-3 px-3">
          <div className="flex gap-2 pb-2">
            {menuItems.map((item) => (<button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${activeTab === item.id
              ? "bg-accent text-primary font-medium"
              : "bg-card border border-border text-foreground"}`}>
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>))}
            <button onClick={async () => {
              await logout();
              navigate('/');
              toast({ title: 'Signed out' });
            }} className="flex bg-card border border-border border-red-400 text-red-400 text-foreground items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors">
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="lg:col-span-9">
          {/* Orders Tab */}
          {activeTab === "orders" && (<div className="space-y-4">
            {(!loading && !user) ? (<div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">You're not signed in</p>
              <p className="text-muted-foreground mb-4">Sign in or register to view your orders and account details.</p>
              <Link to="/" className="inline-block bg-accent text-primary font-medium px-6 py-2 rounded-lg">
                Sign in / Register
              </Link>
            </div>) : (<>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">My Orders</h2>
                <button onClick={fetchOrders} className="text-sm text-krishna-blue-link hover:underline" disabled={ordersLoading}>
                  {ordersLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              {ordersLoading ? (<div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading orders...</p>
              </div>) : (<>
                {orders.map((order) => (<div key={order.id} className="bg-card rounded-lg border border-border p-4">
                  <div className="flex flex-row sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Order #{order.orderNumber || `ORD${String(order.id)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ordered on {formatDate(order.created_at || order.createdAt)}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                      {getStatusIcon(order.orderStatus)}
                      {order.orderStatus?.charAt(0).toUpperCase() + order.orderStatus?.slice(1)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {(() => {
                      let items = order.orderItems;
                      if (typeof items === 'string') {
                        try {
                          items = JSON.parse(items);
                        } catch (e) {
                          items = [];
                        }
                      }
                      if (!Array.isArray(items)) items = [];

                      return items.length > 0 ? (items.map((item, index) => (<div key={index} className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                          {item?.image ? (<img src={item.image} alt={item?.name || 'Product'} className="w-full h-full object-cover" onError={(e) => {
                            e.target.src = '/placeholder.svg';
                          }} />) : (<Package className="w-6 h-6 text-muted-foreground" />)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground line-clamp-1">{item?.name || 'Product'}</p>
                          <p className="text-xs text-muted-foreground">
                            {item?.colorName && `Color: ${item.colorName} | `}Qty: {item?.quantity || 1}
                          </p>
                          <p className="text-sm font-medium text-foreground mt-1">
                            {formatPrice(item?.price || 0)}
                          </p>
                        </div>
                      </div>))) : (<div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">No items found in this order</p>
                      </div>);
                    })()}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                    <p className="text-sm font-medium text-foreground">
                      Total: {formatPrice(order.finalAmount || order.totalPrice || 0)}
                    </p>
                    <Link to={`/order/${order.id}`} className="text-krishna-blue-link text-sm hover:underline flex items-center gap-1">
                      View Details <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>))}

                {orders.length === 0 && (<div className="text-center py-12">
                  <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground mb-2">No orders yet</p>
                  <p className="text-muted-foreground mb-4">Start shopping to see your orders here</p>
                  <Link to="/" className="inline-block bg-accent text-primary font-medium px-6 py-2 rounded-lg">
                    Shop Now
                  </Link>
                </div>)}
              </>)}
            </>)}
          </div>)}

          {/* Wishlist Tab */}
          {activeTab === "wishlist" && (<div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">My Wishlist</h2>

            {wishlistItems.length === 0 ? (<div className="text-center py-12">
              <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">Your wishlist is empty</p>
              <p className="text-muted-foreground mb-4">Start adding items to your wishlist while shopping</p>
              <Link to="/" className="inline-block bg-accent text-primary font-medium px-6 py-2 rounded-lg">
                Start Shopping
              </Link>
            </div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wishlistItems.map((item) => (<div key={item.id} className="bg-card rounded-lg border border-border p-4 flex flex-col">
                <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={(e) => {
                    e.target.src = '/placeholder.svg';
                  }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground font-medium line-clamp-2 mb-2">{item.name}</p>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-lg font-bold text-foreground">{formatPrice(item.price)}</span>
                    {item.originalPrice > item.price && (<span className="text-sm text-muted-foreground line-through">{formatPrice(item.originalPrice)}</span>)}
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <Link to={`/product/${item.slug}`} className="flex-1 text-center text-xs bg-accent text-primary px-3 py-2 rounded hover:bg-accent/90 transition-colors">
                      View Product
                    </Link>
                    <button onClick={() => removeFromWishlist(item.id)} className="text-xs text-destructive hover:underline px-3 py-2 rounded hover:bg-destructive/10 transition-colors">
                      Remove
                    </button>
                  </div>
                </div>
              </div>))}
            </div>)}
          </div>)}

          {/* Profile Tab */}
          {activeTab === "profile" && (<div className="bg-card rounded-lg border border-border p-4 md:p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Profile Settings</h2>

            {(!loading && !user) ? (<div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Please sign in to view and edit your profile.</p>
              <Link to="/" className="inline-block bg-accent text-primary font-medium px-6 py-2 rounded-lg">Sign in / Register</Link>
            </div>) : (<div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" readOnly />
                  <p className="text-xs text-muted-foreground mt-1">Phone number cannot be changed</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Email (Optional)</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Enter your email" />
                  <p className="text-xs text-muted-foreground mt-1">Optional - for order updates and offers</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date of Birth (Optional)
                  </label>
                  <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" />
                  <p className="text-xs text-muted-foreground mt-1">Get special birthday offers!</p>
                </div>
              </div>

              {/* Primary Address Fields */}
              <div className="pt-4 border-t border-border">
                <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Primary Address
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Street Address *</label>
                    <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" placeholder="House no., Building, Street, Area" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">City *</label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" placeholder="City" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">State *</label>
                    <input type="text" value={state} onChange={(e) => setState(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" placeholder="State" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Pincode *</label>
                    <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent" placeholder="6-digit pincode" maxLength={6} />
                  </div>
                </div>
              </div>

              <button onClick={handleSaveProfile} disabled={isSaving} className="w-full py-3 bg-accent hover:bg-krishna-orange-hover text-primary font-medium rounded-lg transition-colors disabled:opacity-50">
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>)}
          </div>)}

          {/* Addresses Tab */}
          {activeTab === "addresses" && (<div className="bg-card rounded-lg border border-border p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">My Addresses</h2>
              <button onClick={() => {
                setShowAddressForm(true);
                setEditingAddress(null);
                setNewAddress({
                  name: user?.name || '',
                  phone: user?.phone || '',
                  street: '',
                  city: '',
                  state: '',
                  pincode: '',
                  type: 'home'
                });
              }} className="flex items-center gap-2 px-3 py-2 bg-accent text-primary font-medium rounded-lg hover:bg-krishna-orange-hover transition-colors">
                <Plus className="w-4 h-4" />
                Add Address
              </button>
            </div>

            {!user ? (<div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Please sign in to manage your addresses.</p>
              <Link to="/" className="inline-block bg-accent text-primary font-medium px-6 py-2 rounded-lg">Sign in / Register</Link>
            </div>) : (<>
              {/* Primary Address */}
              <div className="mb-6">
                <h3 className="font-medium text-foreground mb-3">Primary Address</h3>
                {primaryAddress ? (<div className="bg-accent/5 p-4 rounded-lg border border-accent">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm bg-accent/20 text-accent px-2 py-0.5 rounded">Primary</span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm font-medium text-foreground">{primaryAddress.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {primaryAddress.street}, {primaryAddress.city}, {primaryAddress.state} - {primaryAddress.pincode}
                      </p>
                      {primaryAddress.phone && (<p className="text-sm text-muted-foreground mt-1">Phone: {primaryAddress.phone}</p>)}
                    </div>
                    <button onClick={() => {
                      setActiveTab('profile');
                    }} className="md:text-sm text-xs text-krishna-blue-link hover:underline">
                      Edit in Profile
                    </button>
                  </div>
                </div>) : (<div className="bg-muted/30 p-4 rounded-lg border border-border">
                  <p className="text-muted-foreground">No primary address set. Add one in your profile.</p>
                  <button onClick={() => setActiveTab('profile')} className="mt-2 text-sm text-krishna-blue-link hover:underline">
                    Go to Profile
                  </button>
                </div>)}
              </div>

              {/* Additional Addresses */}
              <div className="mb-6">
                <h3 className="font-medium text-foreground mb-3">Saved Addresses ({additionalAddresses.length})</h3>

                {isLoadingAddresses ? (<div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading addresses...</p>
                </div>) : additionalAddresses.length === 0 ? (<div className="text-center py-6 border border-dashed border-border rounded-lg">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-3">No saved addresses yet</p>
                  <p className="text-sm text-muted-foreground mb-4">Add addresses for faster checkout</p>
                  <button onClick={() => {
                    setNewAddress({
                      name: user?.name || '',
                      phone: user?.phone || '',
                      street: '',
                      city: '',
                      state: '',
                      pincode: '',
                      type: 'home'
                    });
                    setShowAddressForm(true);
                  }} className="inline-block bg-accent text-primary font-medium px-4 py-2 rounded-lg text-sm">
                    + Add Your First Address
                  </button>
                </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {additionalAddresses.map((address) => (<div key={address.id} className={`border rounded-lg p-4 relative ${address.isDefault ? 'border-accent bg-accent/5' : 'border-border'}`}>
                    {address.isDefault && (<span className="absolute top-2 right-2 text-xs bg-accent text-primary px-2 py-1 rounded">
                      Default
                    </span>)}
                    <div className="flex items-start gap-2 mb-2">
                      <div className="text-muted-foreground mt-0.5">
                        {getAddressTypeIcon(address.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-medium text-foreground capitalize">{address.type}</p>
                          <span className="text-xs text-muted-foreground">•</span>
                          <p className="text-sm text-foreground font-medium">{address.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {address.street}, {address.city}, {address.state} - {address.pincode}
                        </p>
                        {address.phone && (<p className="text-xs text-muted-foreground mt-1">Phone: {address.phone}</p>)}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleSetDefaultAddress(address.id)} disabled={address.isDefault} className={`text-xs px-3 py-1 rounded ${address.isDefault
                        ? 'bg-muted text-muted-foreground cursor-default'
                        : 'text-krishna-blue-link hover:underline'}`}>
                        {address.isDefault ? 'Default' : 'Set as Default'}
                      </button>
                      <button onClick={() => {
                        setEditingAddress(address);
                        setNewAddress({
                          name: address.name,
                          phone: address.phone,
                          street: address.street,
                          city: address.city,
                          state: address.state,
                          pincode: address.pincode,
                          type: address.type || 'home'
                        });
                        setShowAddressForm(true);
                      }} className="text-xs text-krishna-blue-link hover:underline px-3 py-1 rounded">
                        Edit
                      </button>
                      <button onClick={() => handleDeleteAddress(address.id)} className="text-xs text-destructive hover:underline px-3 py-1 rounded">
                        Delete
                      </button>
                    </div>
                  </div>))}
                </div>)}
              </div>

              {/* Address Form Modal */}
              {showAddressForm && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-card rounded-lg border border-border p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                  <h3 className="text-lg font-bold text-foreground mb-4">
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Full Name *
                      </label>
                      <input type="text" value={newAddress.name} onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Enter full name" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Phone Number
                      </label>
                      <input type="tel" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Enter phone number" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Address Type
                      </label>
                      <select value={newAddress.type} onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent">
                        <option value="home">Home</option>
                        <option value="work">Work</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Street Address *
                      </label>
                      <textarea value={newAddress.street} onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent" placeholder="House no., Building, Street, Area" rows={2} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          City *
                        </label>
                        <input type="text" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent" placeholder="City" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          State *
                        </label>
                        <input type="text" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent" placeholder="State" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Pincode *
                      </label>
                      <input type="text" value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent" placeholder="6-digit pincode" maxLength={6} />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button onClick={() => {
                      setShowAddressForm(false);
                      setEditingAddress(null);
                      setNewAddress({
                        name: '',
                        phone: '',
                        street: '',
                        city: '',
                        state: '',
                        pincode: '',
                        type: 'home'
                      });
                    }} className="flex-1 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                      Cancel
                    </button>
                    <button onClick={editingAddress ? handleUpdateAddress : handleAddAddress} className="flex-1 py-2 bg-accent text-primary font-medium rounded-lg hover:bg-krishna-orange-hover transition-colors">
                      {editingAddress ? 'Update Address' : 'Save Address'}
                    </button>
                  </div>
                </div>
              </div>)}
            </>)}
          </div>)}
        </main>
      </div>
    </div>

    <Footer />
  </div>);
}
