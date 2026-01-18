import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from '@/hooks/use-toast';
import { Star, Heart, ShoppingCart, Check, Tv, Refrigerator, WashingMachine, AirVent, Fan, Lightbulb, Flame, Microwave, Droplets, Shirt, Wind, Sofa, BedDouble, Armchair, DoorOpen, BookOpen, Package, Headphones, Speaker, Wifi, Keyboard, } from "lucide-react";
import axios from "axios";
import { baseUrl } from '@/config/baseUrl';
// Base API configuration
const API_BASE_URL = baseUrl;
// Helper function to parse JSON strings safely
const parseJSONSafe = (data, defaultValue = null) => {
    if (!data)
        return defaultValue;
    if (typeof data === 'object' && !Array.isArray(data)) {
        return data;
    }
    if (typeof data === 'string') {
        try {
            // Remove any extra backslashes that might be in the string
            const cleanedData = data.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            return JSON.parse(cleanedData);
        }
        catch (error) {
            console.error('Failed to parse JSON:', error, 'Data:', data);
            return defaultValue;
        }
    }
    return defaultValue;
};
// Helper function to parse product data
const parseProductData = (productData) => {
    if (!productData)
        return productData;
    const parsed = { ...productData };
    // Parse colorsAndImages if it's a string
    if (typeof parsed.colorsAndImages === 'string') {
        parsed.colorsAndImages = parseJSONSafe(parsed.colorsAndImages, {});
    }
    // Parse attributes if it's a string
    if (typeof parsed.attributes === 'string') {
        parsed.attributes = parseJSONSafe(parsed.attributes, {});
    }
    // Parse stock if it's a string
    if (typeof parsed.stock === 'string') {
        parsed.stock = parseJSONSafe(parsed.stock, {});
    }
    // Parse numeric values
    if (parsed.price) {
        parsed.price = typeof parsed.price === 'string' ? parseFloat(parsed.price) || 0 : parsed.price;
    }
    if (parsed.discountPrice) {
        parsed.discountPrice = typeof parsed.discountPrice === 'string' ? parseFloat(parsed.discountPrice) || 0 : parsed.discountPrice;
    }
    if (parsed.discountPercentage) {
        parsed.discountPercentage = typeof parsed.discountPercentage === 'string' ? parseFloat(parsed.discountPercentage) || 0 : parsed.discountPercentage;
    }
    if (parsed.rating) {
        parsed.rating = typeof parsed.rating === 'string' ? parseFloat(parsed.rating) || 0 : parsed.rating;
    }
    if (parsed.totalReviews) {
        parsed.totalReviews = typeof parsed.totalReviews === 'string' ? parseInt(parsed.totalReviews) || 0 : parsed.totalReviews;
    }
    // Ensure images is an array
    if (typeof parsed.images === 'string') {
        parsed.images = parseJSONSafe(parsed.images, []);
    }
    return parsed;
};
const iconMap = {
    tv: Tv,
    refrigerator: Refrigerator,
    "washing-machine": WashingMachine,
    "air-vent": AirVent,
    fan: Fan,
    lightbulb: Lightbulb,
    flame: Flame,
    microwave: Microwave,
    droplets: Droplets,
    shirt: Shirt,
    wind: Wind,
    vacuum: Wind,
    blender: Flame,
    sofa: Sofa,
    bed: BedDouble,
    chair: Armchair,
    door: DoorOpen,
    bookshelf: BookOpen,
    package: Package,
    headphones: Headphones,
    speaker: Speaker,
    wifi: Wifi,
    keyboard: Keyboard,
};
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
// Cart API functions using direct Axios
const cartApi = {
    addToCart: async (data) => {
        const api = createCartApi();
        try {
            const response = await api.post("/cart/items", data);
            return response.data;
        }
        catch (error) {
            throw error.response?.data || error;
        }
    },
    updateCartItem: async (productId, data) => {
        const api = createCartApi();
        try {
            const response = await api.put(`/cart/items/${productId}`, data);
            return response.data;
        }
        catch (error) {
            throw error.response?.data || error;
        }
    },
    removeFromCart: async (productId, params) => {
        const api = createCartApi();
        try {
            const url = `/cart/items/${productId}`;
            const response = await api.delete(url, { params });
            return response.data;
        }
        catch (error) {
            throw error.response?.data || error;
        }
    },
    getCart: async () => {
        const api = createCartApi();
        try {
            const response = await api.get("/cart");
            return response.data;
        }
        catch (error) {
            throw error.response?.data || error;
        }
    },
    clearCart: async () => {
        const api = createCartApi();
        try {
            const response = await api.delete("/cart");
            return response.data;
        }
        catch (error) {
            throw error.response?.data || error;
        }
    },
    getCartCount: async () => {
        const api = createCartApi();
        try {
            const response = await api.get("/cart/count");
            return response.data;
        }
        catch (error) {
            throw error.response?.data || error;
        }
    },
};
// Wishlist utility functions
const WISHLIST_KEY = "wishlist_items";
const getWishlist = () => {
    if (typeof window === "undefined")
        return [];
    const wishlist = localStorage.getItem(WISHLIST_KEY);
    return wishlist ? JSON.parse(wishlist) : [];
};
const saveWishlist = (items) => {
    if (typeof window === "undefined")
        return;
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
};
const isInWishlist = (productId) => {
    const wishlist = getWishlist();
    return wishlist.some(item => String(item.id) === String(productId));
};
const addToWishlist = (product) => {
    const wishlist = getWishlist();
    const productId = String(product.id || product.productId || product._id);
    if (!isInWishlist(productId)) {
        // Parse product data first
        const parsedProduct = parseProductData(product);
        // Extract first image from colorsAndImages
        let firstImage = '/placeholder.svg';
        if (parsedProduct.colorsAndImages && typeof parsedProduct.colorsAndImages === 'object') {
            // Get the first color key
            const colorKeys = Object.keys(parsedProduct.colorsAndImages);
            if (colorKeys.length > 0) {
                const firstColor = colorKeys[0];
                // Get the first image array for that color
                const colorImages = parsedProduct.colorsAndImages[firstColor];
                // Get the first image from that array
                if (Array.isArray(colorImages) && colorImages.length > 0) {
                    const firstImg = colorImages[0];
                    firstImage = typeof firstImg === 'string' ? firstImg : (firstImg.url || firstImg);
                }
            }
        }
        // Fallback to direct images array if colorsAndImages doesn't exist
        else if (parsedProduct.images && Array.isArray(parsedProduct.images)) {
            const firstImg = parsedProduct.images[0];
            if (firstImg) {
                firstImage = typeof firstImg === 'string' ? firstImg : (firstImg.url || firstImg);
            }
        }
        const productToSave = {
            id: productId,
            name: parsedProduct.name || parsedProduct.shortName || parsedProduct.productName,
            price: parsedProduct.discountPrice ?? parsedProduct.salePrice ?? parsedProduct.price ?? parsedProduct.originalPrice ?? 0,
            originalPrice: parsedProduct.price ?? parsedProduct.originalPrice ?? parsedProduct._originalPrice ?? 0,
            image: firstImage,
            slug: parsedProduct.slug || productId,
            addedAt: new Date().toISOString()
        };
        wishlist.push(productToSave);
        saveWishlist(wishlist);
    }
    return wishlist;
};
const removeFromWishlist = (productId) => {
    const wishlist = getWishlist();
    const updatedWishlist = wishlist.filter(item => String(item.id) !== String(productId));
    saveWishlist(updatedWishlist);
    return updatedWishlist;
};
// Cart context helper
const useCartContext = () => {
    const { toast } = useToast();
    const refreshCart = async () => {
        // Trigger cart update event for Header component
        window.dispatchEvent(new Event('cartUpdated'));
    };
    const addToCart = async (productId, quantity = 1, colorName, imageUrl) => {
        try {
            const payload = {
                productId,
                quantity
            };
            if (colorName) {
                payload.colorName = colorName;
            }
            if (imageUrl) {
                payload.imageUrl = imageUrl;
            }
            console.log('Adding to cart with payload:', payload); // Debug log
            const result = await cartApi.addToCart(payload);
            if (result.success) {
                await refreshCart();
                return true;
            }
            else {
                toast({
                    title: 'Error',
                    description: result.message || 'Please sign in to add items to your cart.',
                    variant: 'destructive',
                });
                return false;
            }
        }
        catch (err) {
            console.error('Failed to add to cart:', err);
            if (err?.status === 401) {
                toast({
                    title: 'Sign in required',
                    description: 'Please sign in to add items to your cart',
                    variant: 'destructive',
                });
            }
            else {
                toast({
                    title: 'Error',
                    description: err?.message || 'Please sign in to add items to your cart.',
                    variant: 'destructive',
                });
            }
            return false;
        }
    };
    const removeFromCart = async (productId, colorName) => {
        try {
            const params = colorName ? { colorName } : {};
            const result = await cartApi.removeFromCart(String(productId), params);
            if (result.success) {
                await refreshCart();
                toast.success('Item removed from cart');
                return true;
            }
            else {
                toast.error(result.message || 'Failed to remove item');
                return false;
            }
        }
        catch (err) {
            console.error('Failed to remove from cart:', err);
            if (err?.status === 401) {
                toast.error('Session expired. Please sign in again.');
            }
            else {
                toast.error(err?.message || 'Failed to remove item');
            }
            return false;
        }
    };
    const updateCartItem = async (productId, data) => {
        try {
            const result = await cartApi.updateCartItem(String(productId), data);
            if (result.success) {
                await refreshCart();
                toast.success('Cart updated');
                return true;
            }
            else {
                toast.error(result.message || 'Failed to update cart item');
                return false;
            }
        }
        catch (err) {
            console.error('Failed to update cart item:', err);
            if (err?.status === 401) {
                toast.error('Session expired. Please sign in again.');
            }
            else {
                toast.error(err?.message || 'Failed to update cart item');
            }
            return false;
        }
    };
    const clearCart = async () => {
        try {
            const result = await cartApi.clearCart();
            if (result.success) {
                window.dispatchEvent(new Event('cartUpdated'));
                toast.success('Cart cleared');
                return true;
            }
            else {
                toast.error(result.message || 'Failed to clear cart');
                return false;
            }
        }
        catch (err) {
            console.error('Failed to clear cart:', err);
            if (err?.status === 401) {
                toast.error('Session expired. Please sign in again.');
            }
            else {
                toast.error(err?.message || 'Failed to clear cart');
            }
            return false;
        }
    };
    return {
        addToCart,
        removeFromCart,
        updateCartItem,
        clearCart,
        refreshCart,
    };
};
export function ProductCard({ product, variant = "default", selectedColor }) {
    // Parse the product data first
    const parsedProduct = parseProductData(product);
    // Normalize fields from parsed product
    const id = parsedProduct.id || parsedProduct.productId || parsedProduct._id;
    const name = parsedProduct.name || parsedProduct.shortName || parsedProduct.productName;
    const price = (parsedProduct.discountPrice ?? parsedProduct.salePrice) ?? parsedProduct.price ?? parsedProduct.originalPrice ?? 0;
    const originalPrice = parsedProduct.price ?? parsedProduct.originalPrice ?? parsedProduct._originalPrice ?? price;
    const discount = parsedProduct.discountPercentage ?? (originalPrice && price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);
    const rating = parsedProduct.rating ?? parsedProduct.avgRating ?? 0;
    const reviews = parsedProduct.totalReviews ?? parsedProduct.reviews ?? 0;
    const badge = parsedProduct.badge || (parsedProduct.isFeatured ? 'Featured' : undefined);
    // REMOVED EMI
    const slug = parsedProduct.slug || id;
    const { addToCart: addToCartContext } = useCartContext();
    // Function to find the first image and color
    const getProductImageAndColor = () => {
        let imageUrl = '/placeholder.svg';
        let colorName = selectedColor || null;
        // Check if colorsAndImages exists and is an object
        if (parsedProduct.colorsAndImages && typeof parsedProduct.colorsAndImages === 'object') {
            const colorKeys = Object.keys(parsedProduct.colorsAndImages);
            if (colorKeys.length > 0) {
                // If color is specified, use it; otherwise use first color
                const colorToUse = colorName || colorKeys[0];
                colorName = colorName || colorKeys[0];
                const colorImages = parsedProduct.colorsAndImages[colorToUse];
                if (Array.isArray(colorImages) && colorImages.length > 0) {
                    const firstImg = colorImages[0];
                    if (firstImg) {
                        imageUrl = typeof firstImg === 'string' ? firstImg : (firstImg.url || firstImg);
                    }
                }
            }
        }
        // Fallback to images array
        if (imageUrl === '/placeholder.svg' && Array.isArray(parsedProduct.images) && parsedProduct.images.length > 0) {
            const firstImg = parsedProduct.images[0];
            if (firstImg) {
                imageUrl = typeof firstImg === 'string' ? firstImg : (firstImg.url || firstImg);
            }
        }
        return { imageUrl, colorName };
    };
    const productIdStr = String(id);
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isWishlisted, setIsWishlisted] = React.useState(isInWishlist(id));
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    // Sync wishlist state on mount
    useEffect(() => {
        setIsWishlisted(isInWishlist(id));
    }, [id]);
    const goToProduct = useCallback(() => {
        if (!slug) {
            console.error("Product has no slug or ID:", product);
            return;
        }
        navigate(`/product/${slug}`);
    }, [navigate, slug, product]);
    const onCardKeyDown = useCallback((e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            goToProduct();
        }
    }, [goToProduct]);
    const formatPrice = (price) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(price);
    };
    const handleAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Check authentication
        const token = localStorage.getItem("authToken");
        if (!token) {
            window.dispatchEvent(new Event('openSignup'));
            return;
        }

        if (isAddingToCart)
            return;
        setIsAddingToCart(true);
        try {
            // Get image and color before adding to cart
            const { imageUrl, colorName } = getProductImageAndColor();
            console.log('Adding to cart with:', {
                productId: productIdStr,
                colorName,
                imageUrl
            });
            if (!id || productIdStr === "undefined" || productIdStr === "null") {
                console.error("Invalid product ID:", product);
                toast({
                    title: "Error",
                    description: "Cannot add invalid product to cart.",
                    variant: "destructive",
                });
                setIsAddingToCart(false);
                return;
            }
            // Use the addToCart from cart context with imageUrl
            const success = await addToCartContext(productIdStr, 1, colorName, imageUrl);
            if (success) {
                setTimeout(() => {
                    setShowSuccess(true);
                }, 500);
                setTimeout(() => {
                    setIsAddingToCart(false);
                    setShowSuccess(false);
                }, 1200);
                toast({
                    title: "Added to Cart",
                    description: `${name} has been added to your cart.`,
                });
            }
            else {
                setIsAddingToCart(false);
                toast({
                    title: "Error",
                    description: "Failed to add item to cart.",
                    variant: "destructive",
                });
            }
        }
        catch (err) {
            setIsAddingToCart(false);
            toast({
                title: 'Error',
                description: err?.message || 'Failed to add item to cart.',
                variant: "destructive"
            });
        }
    };
    const handleAddToWishlist = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isWishlisted) {
            removeFromWishlist(id);
            setIsWishlisted(false);
            toast({
                title: "Removed from Wishlist",
                description: `${name} has been removed from your wishlist.`,
            });
        }
        else {
            addToWishlist(parsedProduct);
            setIsWishlisted(true);
            toast({
                title: "Added to Wishlist",
                description: `${name} has been added to your wishlist.`,
            });
        }
    };
    const renderStars = (rating) => {
        return (<div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (<Star key={star} className={`w-3 h-3 ${star <= Math.floor(rating)
                ? "text-gold fill-gold"
                : star <= rating
                    ? "text-gold fill-gold/50"
                    : "text-border fill-border"}`} />))}
        </div>);
    };
    const renderProductIcon = (iconName) => {
        const IconComponent = iconName ? iconMap[iconName] : Package;
        const FinalIcon = IconComponent || Package;
        return (<FinalIcon className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground/50" />);
    };
    // Get current image for display
    const { imageUrl: displayImageUrl } = getProductImageAndColor();
    if (variant === "compact") {
        return (<article role="link" tabIndex={0} onClick={goToProduct} onKeyDown={onCardKeyDown} className="group block bg-card rounded-xl border border-border/60 p-4 hover:shadow-card-hover transition-all relative cursor-pointer" aria-label={`View ${name}`}>
            {/* Badge */}
            {badge && (<span className="absolute top-3 left-3 z-10 bg-accent text-accent-foreground text-[10px] font-semibold px-2.5 py-1 rounded-md">
                {badge}
            </span>)}

            {/* Wishlist */}
            <button type="button" onClick={handleAddToWishlist} className="absolute top-3 right-3 z-10 p-2 bg-background/90 rounded-full shadow-sm opacity-100 transition-opacity" aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}>
                <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? "text-red-500 fill-red-500" : "text-muted-foreground hover:text-destructive"}`} />
            </button>

            {/* Image */}
            <div className="aspect-square bg-secondary/30 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                <img src={displayImageUrl} alt={name} className="w-full h-full object-cover" onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                }} />
            </div>

            {/* Title */}
            <h3 className="text-sm text-foreground line-clamp-2 mb-3 min-h-[42px] font-medium leading-relaxed group-hover:text-accent transition-colors">
                {name}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-3">
                {renderStars(rating)}
                <span className="text-xs text-muted-foreground">({reviews.toLocaleString()})</span>
            </div>

            {/* Price */}
            <div className="space-y-1 mb-3">
                <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-foreground">{formatPrice(price)}</span>
                    {originalPrice > price && (<span className="text-xs text-muted-foreground line-through">{formatPrice(originalPrice)}</span>)}
                </div>
                {discount > 0 && (<span className="text-xs font-semibold text-accent">{discount}% off</span>)}
            </div>

            {/* EMI */}
            {/* REMOVED EMI */}

            {/* Add to Cart */}
            <button type="button" onClick={handleAddToCart} disabled={isAddingToCart} className={`w-full text-sm font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 overflow-hidden ${showSuccess
                ? 'bg-emerald-500 text-white'
                : 'bg-accent text-accent-foreground hover:bg-accent/90 hover:shadow-md hover:shadow-accent/20'}`}>
                {showSuccess ? (<span className="inline-flex items-center gap-2 animate-in zoom-in duration-300">
                    <Check className="w-4 h-4" />
                    <span>Added!</span>
                </span>) : isAddingToCart ? (<span className="inline-flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Adding...</span>
                </span>) : (<>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                </>)}
            </button>
        </article>);
    }
    // Default variant
    return (<article role="link" tabIndex={0} onClick={goToProduct} onKeyDown={onCardKeyDown} className="group block premium-card p-4 md:p-5 relative cursor-pointer" aria-label={`View ${name}`}>
        {/* Wishlist Button */}
        <button type="button" onClick={handleAddToWishlist} className="absolute top-3 right-3 z-10 p-2 bg-background/90 rounded-full shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}>
            <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? "text-red-500 fill-red-500" : "text-muted-foreground hover:text-destructive"}`} />
        </button>

        {/* Badge */}
        {badge && (<div className="absolute top-3 left-3 z-10">
            <span className="deal-badge">{badge}</span>
        </div>)}

        {/* Image */}
        <div className="aspect-square bg-secondary/50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-secondary/70 transition-colors overflow-hidden">
            <img src={displayImageUrl} alt={name} className="w-full h-full object-cover" onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
            }} />
        </div>

        {/* Title */}
        <h3 className="text-sm md:text-base text-foreground line-clamp-2 mb-3 min-h-[44px] font-medium group-hover:text-accent transition-colors">{name}</h3>

        {/* Rating + Discount */}
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                {renderStars(rating)}
                <span className="text-xs text-muted-foreground">({reviews.toLocaleString()})</span>
            </div>
            {discount > 0 && (<span className="text-xs font-medium text-accent">{discount}% off</span>)}
        </div>

        {/* Price */}
        <div className="mb-4">
            <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xl font-bold text-foreground">{formatPrice(price)}</span>
                {originalPrice > price && (<span className="text-sm text-muted-foreground line-through">{formatPrice(originalPrice)}</span>)}
            </div>
            {/* REMOVED EMI */}
        </div>

        {/* Add to Cart Button */}
        <button type="button" onClick={handleAddToCart} disabled={isAddingToCart} className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm transition-all duration-300 active:scale-95 overflow-hidden rounded-md font-medium ${showSuccess
            ? 'bg-emerald-500 text-white'
            : 'btn-primary hover:shadow-lg hover:shadow-accent/20'}`}>
            {showSuccess ? (<span className="inline-flex items-center gap-2 animate-in zoom-in duration-300">
                <Check className="w-4 h-4" />
                <span>Added!</span>
            </span>) : isAddingToCart ? (<span className="inline-flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Adding...</span>
            </span>) : (<>
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
            </>)}
        </button>
    </article>);
}
export default ProductCard;
