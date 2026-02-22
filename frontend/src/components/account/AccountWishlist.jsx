import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { Heart, ShoppingBag, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import { baseUrl } from "@/config/baseUrl";

const API_BASE_URL = baseUrl;

// Create axios instance for cart operations
const createCartApi = () => {
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Add auth token interceptor
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return api;
};

// Cart API functions
const cartApi = {
  addToCart: async (data) => {
    const api = createCartApi();
    try {
      const response = await api.post("/cart/items", data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

const formatPrice = (price) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numPrice);
};

export default function AccountWishlist() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [movingToCart, setMovingToCart] = useState({}); // Track which items are being moved

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = () => {
    const wishlist = localStorage.getItem("wishlist_items");
    if (wishlist) {
      try {
        setWishlistItems(JSON.parse(wishlist));
      } catch (err) {
        console.error('Failed to parse wishlist:', err);
      }
    } else {
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

  const moveToCart = async (item) => {
    // Check authentication first
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to your cart",
        variant: "destructive",
      });
      window.dispatchEvent(new Event('openSignup'));
      return;
    }

    // Set loading state for this item
    setMovingToCart(prev => ({ ...prev, [item.id]: true }));

    try {
      // Prepare the payload
      const payload = {
        productId: parseInt(item.id), // Ensure it's a number
        quantity: 1,
      };

      // Add colorName if it exists in the item
      if (item.colorName) {
        payload.colorName = item.colorName;
      }

      // Add imageUrl if it exists
      if (item.image) {
        payload.imageUrl = item.image;
      }

      console.log('Adding to cart from wishlist:', payload);

      // Call the cart API
      const result = await cartApi.addToCart(payload);

      if (result.success) {
        // Remove from wishlist after successful cart addition
        removeFromWishlist(item.id);

        toast({
          title: "Added to Cart",
          description: `${item.name} has been moved to your cart.`,
        });

        // Dispatch cart update event for Header component
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to add item to cart.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Failed to add to cart:', err);
      
      // Handle 401 unauthorized
      if (err?.status === 401 || err?.response?.status === 401) {
        toast({
          title: "Session expired",
          description: "Please sign in again to continue.",
          variant: "destructive",
        });
        window.dispatchEvent(new Event('openSignup'));
      } else {
        toast({
          title: "Error",
          description: err?.message || "Failed to add item to cart.",
          variant: "destructive",
        });
      }
    } finally {
      // Clear loading state
      setMovingToCart(prev => ({ ...prev, [item.id]: false }));
    }
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border border-border">
        <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium text-foreground mb-2">Your wishlist is empty</p>
        <p className="text-muted-foreground mb-4">Start adding items to your wishlist while shopping</p>
        <Link
          to="/"
          className="inline-block bg-accent text-primary font-medium px-6 py-2 rounded-lg hover:bg-accent/90 transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">My Wishlist ({wishlistItems.length})</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {wishlistItems.map((item) => (
          <div key={item.id} className="bg-card rounded-lg border border-border p-4 flex flex-col hover:shadow-md transition-shadow">
            <div className="w-full h-48 bg-white rounded-lg flex items-center justify-center mb-3 overflow-hidden">
              <img
                src={item.image || '/placeholder.svg'}
                alt={item.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.src = '/placeholder.svg';
                }}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground font-medium line-clamp-2 mb-2">{item.name}</p>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-lg font-bold text-foreground">{formatPrice(item.price)}</span>
                {item.originalPrice > item.price && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(item.originalPrice)}
                  </span>
                )}
              </div>
              {item.colorName && (
                <p className="text-xs text-muted-foreground mb-2">
                  Color: <span className="text-foreground">{item.colorName}</span>
                </p>
              )}
              <div className="flex gap-2 mt-auto">
                <Link
                  to={`/product/${item.slug}`}
                  className="flex-1 text-center text-xs bg-accent text-primary px-3 py-2 rounded hover:bg-accent/90 transition-colors"
                >
                  View Details
                </Link>
                <button
                  onClick={() => moveToCart(item)}
                  disabled={movingToCart[item.id]}
                  className="flex-1 text-center text-xs bg-primary text-primary-foreground px-3 py-2 rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {movingToCart[item.id] ? (
                    <span className="flex items-center justify-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Adding...
                    </span>
                  ) : (
                    "Move to Cart"
                  )}
                </button>
              </div>
              <button
                onClick={() => removeFromWishlist(item.id)}
                disabled={movingToCart[item.id]}
                className="w-full mt-2 text-xs text-destructive hover:underline px-3 py-1.5 rounded hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}