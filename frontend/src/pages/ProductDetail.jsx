import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Star, Heart, Share2, ShoppingCart, Check, ChevronDown, ChevronUp, ThumbsUp, Package } from "lucide-react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ProductCard } from "@/components/product/ProductCard";
import { FloatingContactButtons } from "@/components/product/FloatingContactButtons";
import { toast } from "sonner";
import api from "@/lib/api";

// Frontend URL - use environment variable or fallback
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;

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

export default function ProductDetail() {
  const { slug, id } = useParams();
  const identifier = slug || id || "";
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [userRating, setUserRating] = useState(0);

  const handleRateProduct = async (rating) => {
    // Check auth
    const token = localStorage.getItem("authToken");
    if (!token) {
      window.dispatchEvent(new Event('openSignup'));
      return;
    }

    try {
      const response = await api.post('/reviews', {
        productId: product.id,
        rating: rating,
        comment: "" // Optional but sending empty string to be safe
      });

      if (response.data.success) {
        setUserRating(rating);
        toast.success("Thanks for your rating!");
        // Ideally refresh reviews here, but for now just showing success
      }
    } catch (err) {
      console.error("Rating error:", err);
      // Backend error handling (e.g., "already reviewed")
      if (err.response?.status === 403) {
        toast.error("You need to purchase this product to rate it.");
      } else if (err.response?.status === 400 && err.response?.data?.message?.includes("already")) {
        toast.error("You have already rated this product.");
      } else {
        toast.error(err.response?.data?.message || "Failed to submit rating.");
      }
    }
  };

  // Helper function to parse product data
  const parseProductData = (productData) => {
    if (!productData)
      return productData;
    // Parse attributes if it's a string
    if (typeof productData.attributes === 'string') {
      productData.attributes = parseJSONSafe(productData.attributes, {});
    }
    // Parse colorsAndImages if it's a string
    if (typeof productData.colorsAndImages === 'string') {
      productData.colorsAndImages = parseJSONSafe(productData.colorsAndImages, {});
    }
    // Parse stock if it's a string
    if (typeof productData.stock === 'string') {
      productData.stock = parseJSONSafe(productData.stock, {});
    }
    // Parse numeric values
    if (productData.price) {
      productData.price = parseFloat(productData.price) || 0;
    }
    if (productData.discountPrice) {
      productData.discountPrice = parseFloat(productData.discountPrice) || 0;
    }
    if (productData.discountPercentage) {
      productData.discountPercentage = parseFloat(productData.discountPercentage) || 0;
    }
    if (productData.rating) {
      productData.rating = parseFloat(productData.rating) || 0;
    }
    if (productData.totalReviews) {
      productData.totalReviews = parseInt(productData.totalReviews) || 0;
    }
    // Ensure colorsAndImages is an object
    if (!productData.colorsAndImages) {
      productData.colorsAndImages = {};
    }
    return productData;
  };
  // Helper function to get stock for selected color
  const getStockForColor = (stock, colorName) => {
    if (!stock || !colorName) {
      return 0;
    }
    // Parse stock if it's a string
    const stockObj = typeof stock === 'string' ? parseJSONSafe(stock, {}) : stock;
    // If stock is a number (legacy), return it
    if (typeof stockObj === 'number') {
      return stockObj;
    }
    // If stock is an object, get the specific color's stock
    if (typeof stockObj === 'object' && !Array.isArray(stockObj)) {
      const colorStock = stockObj[colorName];
      if (colorStock !== undefined && colorStock !== null) {
        const num = typeof colorStock === 'number' ? colorStock : parseInt(String(colorStock));
        return isNaN(num) ? 0 : num;
      }
    }
    return 0;
  };
  useEffect(() => {
    const fetchProduct = async () => {
      if (!identifier)
        return;
      setLoading(true);
      try {

        const response = await api.get(`/products/${identifier}`);
        let productData = response.data.data || response.data;
        // Parse and normalize product data
        productData = parseProductData(productData);
        console.log('Fetched product data:', productData);
        setProduct(productData);
      }
      catch (err) {
        console.error('Failed to fetch product', err);
        toast.error(err.response?.data?.message || 'Failed to load product details');
      }
      finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [identifier]);
  // Fetch related products
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!product?.id)
        return;
      setRelatedLoading(true);
      try {

        console.log('Fetching related products for product ID:', product.id);
        // Try to get from product.relatedProducts first
        if (product.relatedProducts && Array.isArray(product.relatedProducts) && product.relatedProducts.length > 0) {
          console.log('Using related products from product data:', product.relatedProducts);
          const parsedRelated = product.relatedProducts.map((p) => parseProductData(p));
          setRelatedProducts(parsedRelated.slice(0, 4));
        }
        else {
          // Try the dedicated related products endpoint
          const response = await api.get(`/products/${product.id}/related`);
          console.log('Related products API response:', response.data);
          let relatedData = [];
          // Handle different response structures
          if (response.data.success && response.data.data) {
            relatedData = response.data.data;
          }
          else if (Array.isArray(response.data)) {
            relatedData = response.data;
          }
          else if (response.data && response.data.relatedProducts) {
            relatedData = response.data.relatedProducts;
          }
          else if (response.data && response.data.products) {
            relatedData = response.data.products;
          }
          console.log('Parsed related data:', relatedData);
          // Ensure we have an array
          if (!Array.isArray(relatedData)) {
            console.warn('Related data is not an array:', relatedData);
            relatedData = [];
          }
          // Parse each related product
          const parsedRelated = relatedData.map((p) => parseProductData(p));
          // Filter out the current product and limit to 4
          const filteredRelated = parsedRelated
            .filter((p) => p.id !== product.id)
            .slice(0, 4);
          console.log('Filtered related products:', filteredRelated);
          setRelatedProducts(filteredRelated);
        }
      }
      catch (err) {
        console.error('Failed to fetch related products via API endpoint:', err);
        // Fallback: try to fetch from category
        if (product?.category?.slug) {
          try {

            console.log('Trying fallback: fetching products from category:', product.category.slug);
            const fallbackResponse = await api.get(`/categories/${product.category.slug}/products?page=1&limit=8`);
            const fetched = fallbackResponse.data.data?.products || fallbackResponse.data.products || [];
            const parsedFetched = Array.isArray(fetched) ? fetched.map((p) => parseProductData(p)) : [];
            const filtered = parsedFetched.filter((p) => p.id !== product.id).slice(0, 4);
            console.log('Fallback related products:', filtered);
            setRelatedProducts(filtered);
          }
          catch (fallbackErr) {
            console.error('Fallback related products fetch also failed', fallbackErr);
            setRelatedProducts([]);
          }
        }
        else {
          setRelatedProducts([]);
        }
      }
      finally {
        setRelatedLoading(false);
      }
    };
    if (product) {
      fetchRelatedProducts();
    }
  }, [product]);
  // Get parsed colors and images
  const getParsedColorsAndImages = () => {
    if (!product)
      return {};
    const colorsAndImages = product.colorsAndImages;
    if (!colorsAndImages)
      return {};
    if (typeof colorsAndImages === 'string') {
      return parseJSONSafe(colorsAndImages, {});
    }
    if (typeof colorsAndImages === 'object' && !Array.isArray(colorsAndImages)) {
      return colorsAndImages;
    }
    return {};
  };
  // Get parsed attributes
  const getParsedAttributes = () => {
    if (!product)
      return {};
    const attributes = product.attributes;
    if (!attributes)
      return {};
    if (typeof attributes === 'string') {
      return parseJSONSafe(attributes, {});
    }
    if (typeof attributes === 'object' && !Array.isArray(attributes)) {
      return attributes;
    }
    return {};
  };
  // Get selected color images
  const getSelectedColorImages = () => {
    const colorsAndImages = getParsedColorsAndImages();
    const colorNames = Object.keys(colorsAndImages);
    if (colorNames.length === 0)
      return [];
    const selectedColorName = colorNames[selectedColor];
    if (selectedColorName && colorsAndImages[selectedColorName]) {
      const images = colorsAndImages[selectedColorName];
      return Array.isArray(images) ? images : [];
    }
    return [];
  };
  // Get color names
  const getColorNames = () => {
    const colorsAndImages = getParsedColorsAndImages();
    return Object.keys(colorsAndImages);
  };
  // Add to cart - backend will handle incrementing existing items
  const handleAddToCart = async () => {
    if (!product)
      return false;
    const token = localStorage.getItem("authToken");
    if (!token) {
      window.dispatchEvent(new Event('openSignup'));
      return false;
    }
    try {
      const colorNames = getColorNames();
      const selectedColorName = colorNames[selectedColor];
      // const api = createApiClient();
      // Always add quantity 1 - backend will handle incrementing existing items
      const payload = {
        productId: String(product.id),
        quantity: 1 // Always 1, backend will increment if item exists
      };
      if (selectedColorName) {
        payload.colorName = selectedColorName;
        // Check stock for selected color
        const stockForColor = getStockForColor(product.stock, selectedColorName);
        if (stockForColor <= 0) {
          toast.error('Selected color is out of stock');
          return false;
        }
      }
      console.log('Adding to cart:', payload);
      const response = await api.post("/cart/items", payload);
      const result = response.data;
      if (result.success) {
        // Trigger cart update event
        window.dispatchEvent(new Event('cartUpdated'));
        toast.success(`${product.name} added to cart!`, {
          description: selectedColorName ? `Color: ${selectedColorName}` : 'Item added to cart',
        });
        return true;
      }
      else {
        toast.error(result.message || 'Failed to add to cart');
        return false;
      }
    }
    catch (err) {
      console.error('Add to cart error:', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please sign in again.');
        navigate('/login');
      }
      else {
        toast.error(err.response?.data?.message || 'Failed to add item to cart');
      }
      return false;
    }
  };
  const handleBuyNow = async () => {
    try {
      const success = await handleAddToCart();
      if (success) {
        navigate("/checkout");
      }
    }
    catch (err) {
      // handled in handleAddToCart
    }
  };
  const handleShare = () => {
    setShowQRModal(true);
  };
  const generateQRCodeUrl = () => {
    if (!product)
      return '';
    const productUrl = `${FRONTEND_URL}/product/${product.slug || product.id}`;
    const encodedUrl = encodeURIComponent(productUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`;
  };
  const handleWhatsAppShare = () => {
    if (!product)
      return;
    const productUrl = `${FRONTEND_URL}/product/${product.slug || product.id}`;
    const productName = product.name;
    const productPrice = product.discountPrice || product.price;
    const formattedPrice = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(productPrice);
    const shareText = `Check out this product on Krishna Stores:\n\n${productName}\nPrice: ${formattedPrice}\n\nView details: ${productUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
    setShowQRModal(false);
  };
  const copyToClipboard = () => {
    if (!product)
      return;
    const productUrl = `${FRONTEND_URL}/product/${product.slug || product.id}`;
    navigator.clipboard.writeText(productUrl)
      .then(() => {
        toast.success('Link copied to clipboard!');
        setShowQRModal(false);
      })
      .catch(() => {
        toast.error('Failed to copy link');
      });
  };
  const shareViaNative = () => {
    if (!product)
      return;
    const productUrl = `${FRONTEND_URL}/product/${product.slug || product.id}`;
    const productName = product.name;
    if (navigator.share) {
      navigator.share({
        title: productName,
        text: `Check out ${productName} on Krishna Stores`,
        url: productUrl,
      })
        .then(() => {
          console.log('Shared successfully');
          setShowQRModal(false);
        })
        .catch((error) => {
          console.log('Error sharing:', error);
        });
    }
    else {
      copyToClipboard();
    }
  };
  const handleColorChange = (index) => {
    setSelectedColor(index);
    setSelectedImage(0);
  };
  const getColorFromName = (colorName) => {
    if (!colorName || typeof colorName !== 'string')
      return '#cccccc';
    const colorNameLower = colorName.toLowerCase();
    const colorMap = {
      'white': '#ffffff',
      'black': '#000000',
      'red': '#ff0000',
      'blue': '#0000ff',
      'green': '#00ff00',
      'yellow': '#ffff00',
      'orange': '#ffa500',
      'purple': '#800080',
      'pink': '#ffc0cb',
      'brown': '#a52a2a',
      'gray': '#808080',
      'grey': '#808080',
      'silver': '#c0c0c0',
      'gold': '#ffd700',
      'navy': '#000080',
      'teal': '#008080',
      'maroon': '#800000',
      'olive': '#808000',
      'lime': '#00ff00',
      'aqua': '#00ffff',
      'fuchsia': '#ff00ff',
      'cyan': '#00ffff',
      'magenta': '#ff00ff',
    };
    for (const [key, value] of Object.entries(colorMap)) {
      if (colorNameLower.includes(key)) {
        return value;
      }
    }
    const colorWords = colorNameLower.split(/[/\s,&]+/);
    for (const word of colorWords) {
      const trimmedWord = word.trim();
      if (colorMap[trimmedWord]) {
        return colorMap[trimmedWord];
      }
    }
    const hashColor = stringToColor(colorName);
    return hashColor;
  };
  const stringToColor = (str) => {
    if (!str)
      return '#cccccc';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const r = (hash & 0xFF0000) >> 16;
    const g = (hash & 0x00FF00) >> 8;
    const b = hash & 0x0000FF;
    const adjustedR = Math.min(220, Math.max(30, r));
    const adjustedG = Math.min(220, Math.max(30, g));
    const adjustedB = Math.min(220, Math.max(30, b));
    return `rgb(${adjustedR}, ${adjustedG}, ${adjustedB})`;
  };
  const formatPrice = (price) => {
    if (!price && price !== 0)
      return '₹0';
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };
  const renderStars = (rating, size = "w-4 h-4") => (<div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (<Star key={star} className={`${size} ${star <= Math.floor(rating)
      ? "text-accent fill-accent"
      : star <= rating
        ? "text-accent fill-accent/50"
        : "text-muted-foreground"}`} />))}
  </div>);
  const price = product?.discountPrice ?? product?.price ?? 0;
  const originalPrice = product?.price ?? price;
  const discount = product?.discountPercentage ??
    (originalPrice && originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);
  const rating = product?.rating ?? 0;
  const reviewsCount = product?.totalReviews ?? 0;
  const getRatingPercentage = (star) => {
    const distributions = { 5: 65, 4: 20, 3: 10, 2: 3, 1: 2 };
    return distributions[star] || 0;
  };
  const specifications = () => {
    const attributes = getParsedAttributes();
    return Object.entries(attributes)
      .filter(([key, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').replace(/_/g, ' '),
        value: String(value)
      }));
  };
  const highlights = product?.description ? [product.description] : [];
  const reviews = Array.isArray(product?.reviews) ? product.reviews : [];
  if (loading) {
    return (<div className="min-h-screen bg-background">
      <Header />
      <div className="container py-20 text-center">
        <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Loading product…</h1>
        <p className="text-muted-foreground mb-6">Please wait while we fetch the product details.</p>
      </div>
      <Footer />
    </div>);
  }
  if (!product) {
    return (<div className="min-h-screen bg-background">
      <Header />
      <div className="container py-20 text-center">
        <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Product Not Found</h1>
        <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist or is inactive.</p>
        <Link to="/" className="btn-primary inline-block">Go Back Home</Link>
      </div>
      <Footer />
    </div>);
  }
  const selectedColorImages = getSelectedColorImages();
  const colorNames = getColorNames();
  const selectedColorName = colorNames[selectedColor] || '';
  const specs = specifications();
  return (<div className="min-h-screen bg-background pb-20 md:pb-0">
    <Header />

    {/* QR Code Modal */}
    {showQRModal && (<>
      <div className="fixed inset-0 bg-black/50 z-[100] transition-opacity" onClick={() => setShowQRModal(false)} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] bg-card rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground text-lg">Share Product</h3>
          <button onClick={() => setShowQRModal(false)} className="p-1 hover:bg-muted rounded-full">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="mb-4 flex justify-center">
            <div className="bg-white p-4 rounded-lg inline-block">
              <img src={generateQRCodeUrl()} alt="QR Code" className="w-48 h-48" onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-2">Scan QR code to view product</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleWhatsAppShare} className="py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.76.982.998-3.675-.236-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.9 6.994c-.004 5.45-4.438 9.88-9.888 9.88m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.333.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.333 11.893-11.893 0-3.18-1.24-6.162-3.495-8.411" />
            </svg>
            WhatsApp
          </button>
          <button onClick={shareViaNative} className="py-3 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-colors flex items-center justify-center gap-2">
            <Share2 className="w-5 h-5" />
            {navigator.share ? 'Share' : 'Copy Link'}
          </button>
        </div>
      </div>
    </>)}

    {/* Breadcrumb */}
    <div className="bg-card border-b md:mt-4 mt-1 border-border">
      <div className="container py-2 px-3 md:px-4">
        <nav className="text-xs md:text-sm text-muted-foreground overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Link to="/" className="hover:text-accent">Home</Link>
          <span className="mx-1.5">›</span>
          <Link to={`/products?category=${product?.category?.slug || ''}`} className="hover:text-accent">
            {product?.category?.name || 'Products'}
          </Link>
          <span className="mx-1.5">›</span>
          <span className="text-foreground">{product?.name}</span>
        </nav>
      </div>
    </div>

    <div className="container py-4 md:py-6 px-3 md:px-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">

        {/* Image Gallery */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24">
            {/* Main Image */}
            <div className="bg-card rounded-lg border border-border p-4 md:p-8 mb-3 relative">
              <div className="aspect-square flex items-center justify-center bg-secondary/30 rounded-lg overflow-hidden">
                {selectedColorImages.length > 0 && selectedColorImages[selectedImage]?.url ? (<img src={selectedColorImages[selectedImage].url} alt={selectedColorImages[selectedImage]?.alt || `${product?.name} - ${selectedColorName}`} className="w-full h-full object-cover" onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }} />) : (<div className="text-center">
                  <Package className="w-24 h-24 md:w-32 md:h-32 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No image available</p>
                </div>)}
              </div>
              {/* Wishlist & Share */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button className="p-2 bg-card rounded-full shadow-soft hover:shadow-medium transition-shadow">
                  <Heart className="w-5 h-5 text-muted-foreground hover:text-destructive" />
                </button>
                <button onClick={handleShare} className="p-2 bg-card rounded-full shadow-soft hover:shadow-medium transition-shadow">
                  <Share2 className="w-5 h-5 text-muted-foreground hover:text-accent" />
                </button>
              </div>
              {/* Discount Badge */}
              {discount > 0 && (<div className="absolute top-4 left-4">
                <span className="deal-badge">{discount}% OFF</span>
              </div>)}
            </div>

            {/* Thumbnails */}
            {selectedColorImages.length > 0 && (<div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {selectedColorImages.map((image, i) => (<button key={i} onClick={() => setSelectedImage(i)} className={`shrink-0 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-lg border-2 transition-colors bg-card ${selectedImage === i ? "border-accent" : "border-border hover:border-accent/50"}`}>
                {image?.url ? (<img src={image.url} alt={image.alt || `${product?.name} - ${selectedColorName}`} className="w-full h-full object-cover" onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }} />) : (<Package className="w-8 h-8 text-muted-foreground/50" />)}
              </button>))}
            </div>)}




          </div>
        </div>

        {/* Product Details */}
        <div className="lg:col-span-7">
          {/* Title & Rating */}
          <div className="mb-4">
            <p className="text-sm text-accent font-medium mb-1">{product.brand?.name || 'Unknown Brand'}</p>
            <h1 className="text-lg md:text-2xl font-medium text-foreground leading-tight mb-2">
              {product.name} {product.variant && `- ${product.variant}`}
            </h1>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <div className="flex items-center gap-1 bg-accent/10 px-2 py-1 rounded">
                <span className="font-medium text-accent">{rating}</span>
                <Star className="w-4 h-4 text-accent fill-accent" />
              </div>
              <span className="text-sm text-muted-foreground">
                {reviewsCount.toLocaleString()} reviews
              </span>
            </div>
          </div>

          {/* Price Section */}
          <div className="bg-card rounded-lg border border-border p-4 mb-4">
            <div className="flex items-baseline gap-2 flex-wrap mb-2">
              {discount > 0 && (<span className="text-xs text-muted-foreground">-{discount}%</span>)}
              <span className="text-2xl md:text-3xl font-bold text-foreground">{formatPrice(price)}</span>
              {originalPrice > price && (<>
                <span className="text-lg text-muted-foreground line-through">{formatPrice(originalPrice)}</span>
                <span className="text-sm text-accent font-medium">
                  Save {formatPrice(originalPrice - price)}
                </span>
              </>)}
            </div>


          </div>

          {/* Color Selection */}
          {colorNames.length > 0 && (<div className="mb-4">
            <h2 className="text-sm font-medium text-foreground mb-3">
              Color: <span className="text-muted-foreground">{selectedColorName || 'Default'}</span>
            </h2>
            <div className="flex gap-3 flex-wrap">
              {colorNames.map((colorName, i) => {
                const colorValue = getColorFromName(colorName);
                const isSelected = selectedColor === i;
                return (<button key={colorName} onClick={() => handleColorChange(i)} className={`relative w-10 h-10 rounded-full border-2 transition-all group ${isSelected
                  ? "border-accent ring-2 ring-accent/30"
                  : "border-border hover:border-accent/50"}`} title={colorName} style={{
                    backgroundColor: colorValue
                  }}>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {colorName}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  </div>

                  {isSelected && (<div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-white/80 flex items-center justify-center">
                      <Check className="w-3 h-3 text-gray-900" />
                    </div>
                  </div>)}
                </button>);
              })}
            </div>
          </div>)}

          {/* Stock Status */}
          {selectedColorName && (<div className="mb-4">
            <p className={`text-sm font-medium ${getStockForColor(product.stock, selectedColorName) > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {getStockForColor(product.stock, selectedColorName) > 0
                ? `In Stock: ${getStockForColor(product.stock, selectedColorName)} available`
                : 'Out of Stock'}
            </p>
          </div>)}

          {/* Quantity & Actions - Valid for ALL screens */}
          <div className="flex items-center gap-4 mb-6">
            <button onClick={handleAddToCart} className="flex-1 py-3 border-2 border-accent text-accent font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-accent/5 transition-colors">
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </button>
            <button onClick={handleBuyNow} className="flex-1 py-3 bg-accent hover:opacity-90 text-accent-foreground font-medium rounded-lg transition-colors">
              Buy Now
            </button>
          </div>

          {/* Seller Info */}
          <div className="text-sm text-muted-foreground mb-6">
            Sold by: <span className="text-accent cursor-pointer hover:underline">
              {product.seller?.name || 'Unknown Seller'}
            </span>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="font-bold text-foreground mb-3">Description</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          </div>

          {/* Highlights */}
          {highlights.length > 0 && (<div className="mb-6">
            <h2 className="font-bold text-foreground mb-3">Highlights</h2>
            <ul className="space-y-2">
              {highlights.map((highlight, i) => (<li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-accent shrink-0 mt=0.5" />
                {highlight}
              </li>))}
            </ul>
          </div>)}

          {/* Specifications */}
          {specs.length > 0 && (<div className="mb-6">
            <h2 className="font-bold text-foreground mb-3">Specifications</h2>
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {(showAllSpecs ? specs : specs.slice(0, 5)).map((spec, i) => (<tr key={i} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                    <td className="px-4 py-2.5 text-muted-foreground w-1/3">{spec.label}</td>
                    <td className="px-4 py-2.5 text-foreground">{spec.value}</td>
                  </tr>))}
                </tbody>
              </table>
              {specs.length > 5 && (<button onClick={() => setShowAllSpecs(!showAllSpecs)} className="w-full py-3 text-sm text-accent font-medium flex items-center justify-center gap-1 border-t border-border hover:bg-muted/50">
                {showAllSpecs ? "Show Less" : `Show All (${specs.length})`}
                {showAllSpecs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>)}
            </div>
          </div>)}

          {/* Reviews */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground">Customer Reviews</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground mr-1">Rate this product:</span>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRateProduct(star)}
                      className="p-1 hover:scale-110 transition-transform focus:outline-none"
                      title={`Rate ${star} stars`}
                    >
                      <Star
                        className={`w-5 h-5 ${star <= (userRating || 0)
                          ? "text-accent fill-accent"
                          : "text-muted-foreground hover:text-accent"
                          }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Rating Summary */}
            <div className="bg-card rounded-lg border border-border p-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">{rating}</div>
                  <div className="flex justify-center my-1">{renderStars(rating)}</div>
                  <div className="text-xs text-muted-foreground">{reviewsCount.toLocaleString()} ratings</div>
                </div>
                <div className="flex-1 space-y-1">
                  {[5, 4, 3, 2, 1].map((star) => (<div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-3">{star}</span>
                    <Star className="w-3 h-3 text-accent fill-accent" />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${getRatingPercentage(star)}%` }} />
                    </div>
                    <span className="w-8 text-muted-foreground">
                      {getRatingPercentage(star)}%
                    </span>
                  </div>))}
                </div>
              </div>
            </div>

            {/* Review List */}
            {reviews.length > 0 && (<>
              <div className="space-y-4">
                {(showAllReviews ? reviews : reviews.slice(0, 2)).map((review) => (<div key={review.id} className="bg-card rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center bg-accent/10 px-1.5 py-0.5 rounded text-xs">
                      <span className="font-medium text-accent">{review.rating}</span>
                      <Star className="w-3 h-3 text-accent fill-accent ml-0.5" />
                    </div>
                    <span className="font-medium text-sm text-foreground">{review.title || 'Great Product'}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{review.comment || 'No comment provided'}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{review.user?.name || 'Anonymous'}</span>
                      <span>•</span>
                      <span>{new Date(review.created_at).toLocaleDateString()}</span>
                      {review.verified && (<>
                        <span>•</span>
                        <span className="text-accent">Verified Purchase</span>
                      </>)}
                    </div>
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      <ThumbsUp className="w-3 h-3" />
                      <span>Helpful ({review.helpful || 0})</span>
                    </button>
                  </div>
                </div>))}
              </div>

              {reviews.length > 2 && (<button onClick={() => setShowAllReviews(!showAllReviews)} className="w-full py-3 mt-3 text-sm text-accent font-medium border border-border rounded-lg hover:bg-muted/50">
                {showAllReviews ? "Show Less" : "See All Reviews"}
              </button>)}
            </>)}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedLoading ? (<div className="mt-12 text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading related products...</p>
      </div>) : Array.isArray(relatedProducts) && relatedProducts.length > 0 ? (<div className="mt-12">
        <h2 className="section-title mb-6">You May Also Like</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {relatedProducts.map((relatedProduct) => (<ProductCard key={relatedProduct.id} product={relatedProduct} variant="compact" />))}
        </div>
      </div>) : null}
    </div>

    {/* Floating Contact Buttons for Mobile */}
    <FloatingContactButtons />

    <Footer />
  </div>);
}
