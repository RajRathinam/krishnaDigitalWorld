import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { toast } from "sonner";
import { Minus, Plus, Trash2, ShieldCheck, Truck, ShoppingCart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/utils";

const emptyCart = { id: 0, items: [], totalAmount: 0 };

export default function Cart() {
  const [cart, setCart] = useState(emptyCart);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndFetchCart();
  }, []);

  // Listen for cart update events
  useEffect(() => {
    const handleCartUpdate = () => {
      console.log('Cart update event received, refreshing cart...');
      checkAuthAndFetchCart();
    };
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const checkAuthAndFetchCart = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsAuthenticated(false);
        setCart(emptyCart);
        setLoading(false);
        return;
      }

      try {
        await api.get('/auth/me');
        setIsAuthenticated(true);
      } catch (authErr) {
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
        setCart(emptyCart);
        setLoading(false);
        return;
      }

      // Fetch cart
      const res = await api.get('/cart');
      console.log('Cart API response:', res.data);
      const cartData = res.data.data || emptyCart;
      
      // Ensure items is an array and parse if needed
      let items = cartData.items || [];
      if (!Array.isArray(items)) {
        try {
          if (typeof items === 'string') {
            items = JSON.parse(items);
          }
          if (!Array.isArray(items)) {
            items = [];
          }
        } catch (e) {
          console.error('Error parsing cart items:', e);
          items = [];
        }
      }

      // Normalize colorName field and ensure product data exists
      items = items.map((item) => ({
        ...item,
        colorName: item.colorName || null,
        product: item.product || {}
      }));

      setCart({
        ...cartData,
        items: items
      });
    } catch (err) {
      console.error('Failed to fetch cart:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
        setCart(emptyCart);
      } else {
        toast.error(err.response?.data?.message || 'Failed to load cart');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price || 0);
  };

  // Helper function to get the correct image URL
  const getItemImageUrl = (item) => {
    if (item.imageUrl) return getImageUrl(item.imageUrl);
    if (item.product?.images && item.product.images.length > 0) {
      const firstImage = item.product.images[0];
      if (typeof firstImage === 'string') {
        return getImageUrl(firstImage);
      } else if (firstImage?.url) {
        return getImageUrl(firstImage.url);
      }
    }
    if (item.product?.thumbnail) return getImageUrl(item.product.thumbnail);
    if (item.product?.image) return getImageUrl(item.product.image);
    return '/placeholder.svg';
  };

  const updateQuantity = async (item, newQty) => {
    if (newQty < 1) return;

    if (!isAuthenticated) {
      toast.error('Please sign in to update cart');
      navigate('/login');
      return;
    }

    try {
      const payload = {
        quantity: newQty,
        colorName: item.colorName || null
      };

      const response = await api.put(`/cart/items/${item.productId}`, payload);
      const result = response.data;

      if (result.success) {
        await checkAuthAndFetchCart();
        window.dispatchEvent(new Event('cartUpdated'));
        toast.success('Quantity updated');
      } else {
        toast.error(result.message || 'Failed to update quantity');
      }
    } catch (err) {
      console.error('Update quantity error:', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please sign in again.');
        navigate('/login');
      } else if (err.response?.status === 400) {
        toast.error(err.response.data?.message || 'Invalid quantity');
      } else {
        toast.error(err.response?.data?.message || 'Failed to update quantity');
      }
    }
  };

  const removeItem = async (item) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to modify cart');
      navigate('/login');
      return;
    }

    try {
      const params = {};
      if (item.colorName) {
        params.colorName = item.colorName;
      }

      const response = await api.delete(`/cart/items/${item.productId}`, { params });
      const result = response.data;

      if (result.success) {
        await checkAuthAndFetchCart();
        window.dispatchEvent(new Event('cartUpdated'));
        toast.success('Item removed from cart');
      } else {
        toast.error(result.message || 'Failed to remove item');
      }
    } catch (err) {
      console.error('Remove item error:', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please sign in again.');
        navigate('/login');
      } else {
        toast.error(err.response?.data?.message || 'Failed to remove item');
      }
    }
  };

  const clearCartHandler = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to clear cart');
      navigate('/login');
      return;
    }

    if (!window.confirm('Are you sure you want to clear your cart?')) {
      return;
    }

    try {
      const response = await api.delete('/cart');
      const result = response.data;

      if (result.success) {
        setCart(emptyCart);
        window.dispatchEvent(new Event('cartUpdated'));
        toast.success('Cart cleared successfully');
      } else {
        toast.error(result.message || 'Failed to clear cart');
      }
    } catch (err) {
      console.error('Clear cart error:', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please sign in again.');
        navigate('/login');
      } else {
        toast.error(err.response?.data?.message || 'Failed to clear cart');
      }
    }
  };

  // Calculate cart totals
  const subtotal = cart?.totalAmount || 0;
  const originalTotal = cart?.items?.reduce((sum, item) => {
    const itemPrice = item.product?.price || item.price || 0;
    return sum + (itemPrice * (item.quantity || 1));
  }, 0) || 0;
  const discount = Math.max(0, originalTotal - subtotal);
  const deliveryFee = subtotal > 500 ? 0 : 49;
  const total = subtotal + deliveryFee;

  // Store cart data in sessionStorage for checkout
  const handleProceedToCheckout = () => {
    sessionStorage.setItem('checkoutCart', JSON.stringify({
      subtotal,
      discount,
      total,
      items: cart.items
    }));
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-4 md:py-6 px-3 md:px-4">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
            <div className="lg:col-span-8 space-y-3 md:space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card rounded-lg border border-border p-3 md:p-4">
                  <div className="flex gap-3 md:gap-4">
                    <Skeleton className="w-20 h-20 md:w-28 md:h-28 rounded-lg shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/3" />
                      <div className="flex justify-between items-center mt-4">
                        <Skeleton className="h-8 w-24 rounded" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="lg:col-span-4">
              <div className="bg-card rounded-lg border border-border p-4 space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full rounded" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12 px-4 text-center">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Please Sign In</h1>
          <p className="text-muted-foreground mb-6">You need to be signed in to view your cart.</p>
          <div className="flex gap-4 justify-center">
            <Link to="/login" className="px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:opacity-90">
              Sign In
            </Link>
            <Link to="/" className="px-6 py-3 border border-border rounded-lg hover:bg-card">
              Continue Shopping
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12 px-4 text-center">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Looks like you haven't added anything yet.</p>
          <Link to="/" className="px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:opacity-90">
            Continue Shopping
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-4 md:py-6 px-3 md:px-4">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            Shopping Cart ({cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0)} items)
          </h1>
          <button onClick={clearCartHandler} className="text-sm text-destructive hover:underline">
            Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-8 space-y-3 md:space-y-4">
            {cart.items.map((item, index) => {
              const imageUrl = getItemImageUrl(item);
              const itemName = item.product?.name || `Product ${item.productId}`;
              const itemPrice = item.product?.discountPrice || item.product?.price || item.price || 0;
              const itemOriginalPrice = item.product?.price || item.price || 0;
              const itemQuantity = item.quantity || 1;

              return (
                <div key={`${item.productId}-${item.colorName || 'null'}-${index}`} className="bg-card rounded-lg border border-border p-3 md:p-4">
                  <div className="flex gap-3 md:gap-4">
                    {/* Image */}
                    <div className="w-20 h-20 md:w-28 md:h-28 bg-muted rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                      <img 
                        src={imageUrl} 
                        alt={itemName} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                          e.currentTarget.className = 'w-10 h-10 object-contain';
                        }} 
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${item.product?.slug || item.productId}`} className="text-sm md:text-base text-foreground font-medium hover:text-accent line-clamp-2">
                        {itemName}
                      </Link>

                      {item.colorName && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Color: <span className="text-foreground">{item.colorName}</span>
                        </p>
                      )}

                      {/* Price - Mobile */}
                      <div className="mt-2 md:hidden">
                        <span className="text-lg font-bold text-foreground">
                          {formatPrice(itemPrice)}
                        </span>
                        {itemOriginalPrice > itemPrice && (
                          <span className="text-xs text-muted-foreground line-through ml-2">
                            {formatPrice(itemOriginalPrice)}
                          </span>
                        )}
                      </div>

                      {/* Quantity & Actions */}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center border border-border rounded">
                          <button 
                            onClick={() => updateQuantity(item, itemQuantity - 1)} 
                            className="p-1.5 md:p-2 hover:bg-muted transition-colors"
                            disabled={itemQuantity <= 1}
                          >
                            <Minus className="w-3 h-3 md:w-4 md:h-4" />
                          </button>
                          <span className="w-8 md:w-10 text-center text-sm font-medium">{itemQuantity}</span>
                          <button 
                            onClick={() => updateQuantity(item, itemQuantity + 1)} 
                            className="p-1.5 md:p-2 hover:bg-muted transition-colors"
                          >
                            <Plus className="w-3 h-3 md:w-4 md:h-4" />
                          </button>
                        </div>
                        <button onClick={() => removeItem(item)} className="text-xs md:text-sm text-destructive hover:underline flex items-center gap-1">
                          <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                          <span className="hidden sm:inline">Remove</span>
                        </button>
                      </div>
                    </div>

                    {/* Price - Desktop */}
                    <div className="hidden md:block text-right shrink-0">
                      <div className="text-xl font-bold text-foreground">
                        {formatPrice(itemPrice * itemQuantity)}
                      </div>
                      {itemOriginalPrice > itemPrice && (
                        <>
                          <div className="text-sm text-muted-foreground line-through">
                            {formatPrice(itemOriginalPrice * itemQuantity)}
                          </div>
                          <div className="text-sm text-accent font-medium">
                            Save {formatPrice((itemOriginalPrice - itemPrice) * itemQuantity)}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Delivery Info */}
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-3 text-sm">
                <Truck className="w-5 h-5 text-accent" />
                <span className="text-foreground">
                  <strong className="text-accent">Free Delivery</strong> on orders above ₹500
                </span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-card rounded-lg border border-border p-4 sticky top-24">
              <h2 className="font-bold text-foreground mb-4">Order Summary</h2>

              {/* Price Breakdown */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Subtotal ({cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0)} items)
                  </span>
                  <span className="text-foreground">{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-accent">
                    <span>Product Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className={deliveryFee === 0 ? "text-accent" : "text-foreground"}>
                    {deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}
                  </span>
                </div>
              </div>

              <div className="border-t border-border mt-4 pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-foreground">{formatPrice(total)}</span>
                </div>
                {discount > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    You're saving {formatPrice(discount)} on this order!
                  </p>
                )}
              </div>

              <button 
                onClick={handleProceedToCheckout}
                className="block w-full mt-4 py-3 bg-accent text-accent-foreground text-center font-medium rounded-lg hover:opacity-90 transition-colors"
              >
                Proceed to Checkout
              </button>

              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-accent" />
                <span>Safe and Secure Payments</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}