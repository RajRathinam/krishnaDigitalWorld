import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Star, Heart, Share2, ShoppingCart, Truck, Shield, RotateCcw, MapPin, ChevronDown, ChevronUp, Check, Minus, Plus, Tv } from "lucide-react";
import { useParams } from "react-router-dom";
const specifications = [
  { label: "Brand", value: "Samsung" },
  { label: "Model Name", value: "Crystal 4K Neo Series" },
  { label: "Screen Size", value: "55 Inches" },
  { label: "Display Technology", value: "LED" },
  { label: "Resolution", value: "4K Ultra HD (3840 x 2160)" },
  { label: "Refresh Rate", value: "60 Hz" },
  { label: "Smart TV", value: "Yes (Tizen)" },
  { label: "Connectivity", value: "3 HDMI, 2 USB, Wi-Fi, Bluetooth" },
];
const highlights = [
  "Crystal Processor 4K - Experience crystal clear colors",
  "HDR support for vivid and lifelike picture quality",
  "Alexa & Google Assistant built-in for voice control",
  "AirSlim Design - Ultra-thin profile that fits anywhere",
  "Auto Game Mode with Motion Xcelerator for gaming",
];
const reviews = [
  { id: 1, user: "Rajesh M.", rating: 5, date: "15 Dec 2024", title: "Excellent picture quality!", comment: "The picture quality is amazing. Colors are vibrant and the 4K resolution is crystal clear. Very happy with this purchase.", verified: true },
  { id: 2, user: "Priya S.", rating: 4, date: "10 Dec 2024", title: "Good value for money", comment: "Great TV for the price. Smart features work smoothly. Only minor issue is the speakers could be better.", verified: true },
  { id: 3, user: "Amit K.", rating: 5, date: "5 Dec 2024", title: "Best TV in this range", comment: "Compared many options before buying. This is definitely the best in this price range. Installation was quick.", verified: true },
];
export default function ProductDetail() {
  const { id } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState("");
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const product = {
    id: 1,
    name: "Samsung 55\" Crystal 4K UHD Smart TV Neo Series with Alexa Built-in (2024 Model)",
    originalPrice: 64990,
    salePrice: 42990,
    discount: 34,
    rating: 4.5,
    reviews: 12453,
    inStock: true,
    seller: "Krishna Store (Authorized Dealer)",
  };
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };
  const renderStars = (rating, size = "w-4 h-4") => (<div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (<Star key={star} className={`${size} ${star <= Math.floor(rating)
      ? "text-accent fill-accent"
      : "text-muted-foreground"}`} />))}
  </div>);
  return (<div className="min-h-screen bg-background pb-20 md:pb-0">
    <Header />

    {/* Breadcrumb */}
    <div className="bg-card border-b border-border">
      <div className="container py-2 px-3 md:px-4">
        <nav className="text-xs md:text-sm text-muted-foreground overflow-x-auto whitespace-nowrap scrollbar-hide">
          <a href="/" className="hover:text-accent">Home</a>
          <span className="mx-1.5">›</span>
          <a href="/products?category=electronics" className="hover:text-accent">Electronics</a>
          <span className="mx-1.5">›</span>
          <span className="text-foreground">Samsung 55" Smart TV</span>
        </nav>
      </div>
    </div>

    <div className="container py-4 md:py-6 px-3 md:px-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">

        {/* Image Gallery - Mobile Optimized */}
        <div className="lg:col-span-5">
          <div className="sticky top-24">
            {/* Main Image */}
            <div className="bg-card rounded-lg border border-border p-4 md:p-8 mb-3 relative">
              <div className="aspect-square flex items-center justify-center">
                <Tv className="w-32 h-32 md:w-48 md:h-48 text-muted-foreground" />
              </div>
              {/* Wishlist & Share */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button className="p-2 bg-card rounded-full shadow-card hover:shadow-card-hover transition-shadow">
                  <Heart className="w-5 h-5 text-muted-foreground hover:text-destructive" />
                </button>
                <button className="p-2 bg-card rounded-full shadow-card hover:shadow-card-hover transition-shadow">
                  <Share2 className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {[0, 1, 2, 3].map((i) => (<button key={i} onClick={() => setSelectedImage(i)} className={`shrink-0 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-lg border-2 transition-colors ${selectedImage === i ? "border-accent" : "border-border hover:border-accent/50"}`}>
                <Tv className="w-8 h-8 text-muted-foreground" />
              </button>))}
            </div>

            {/* Mobile Buy Buttons - Sticky */}
            <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-card border-t border-border p-3 flex gap-3 z-40">
              <button className="flex-1 py-3 border-2 border-accent text-accent font-medium rounded-lg flex items-center justify-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
              <button className="flex-1 py-3 bg-accent text-primary font-medium rounded-lg">
                Buy Now
              </button>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="lg:col-span-7">
          {/* Title & Rating */}
          <div className="mb-4">
            <h1 className="text-lg md:text-2xl font-medium text-foreground leading-tight mb-2">
              {product.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <div className="flex items-center gap-1 bg-krishna-green/10 px-2 py-1 rounded">
                <span className="font-medium text-krishna-green">{product.rating}</span>
                <Star className="w-4 h-4 text-krishna-green fill-krishna-green" />
              </div>
              <span className="text-sm text-muted-foreground">
                {product.reviews.toLocaleString()} ratings
              </span>
              <span className="text-sm text-krishna-blue-link cursor-pointer hover:underline">
                1,234 reviews
              </span>
            </div>
          </div>

          {/* Price Section */}
          <div className="bg-card rounded-lg border border-border p-4 mb-4">
            <div className="flex items-baseline gap-2 flex-wrap mb-2">
              <span className="text-xs text-muted-foreground">-{product.discount}%</span>
              <span className="text-2xl md:text-3xl font-bold text-foreground">
                {formatPrice(product.salePrice)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <span>M.R.P.:</span>
              <span className="line-through">{formatPrice(product.originalPrice)}</span>
              <span className="text-krishna-green font-medium">
                Save {formatPrice(product.originalPrice - product.salePrice)}
              </span>
            </div>

            {/* REMOVED EMI OPTIONS */}
          </div>

          {/* Delivery */}
          <div className="bg-card rounded-lg border border-border p-4 mb-4">
            <div className="flex items-start gap-3 mb-3">
              <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-foreground font-medium mb-2">Deliver to</p>
                <div className="flex gap-2">
                  <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="Enter pincode" className="flex-1 px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent" maxLength={6} />
                  <button className="px-4 py-2 text-sm text-krishna-blue-link font-medium hover:underline">
                    Check
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-krishna-green">
                <Truck className="w-4 h-4" />
                <span>Free delivery by <strong>Tomorrow, 8 PM</strong></span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <RotateCcw className="w-4 h-4 text-muted-foreground" />
                <span>10 days replacement policy</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span>1 year warranty by Samsung</span>
              </div>
            </div>
          </div>

          {/* Quantity & Actions - Desktop */}
          <div className="hidden lg:flex items-center gap-4 mb-6">
            <div className="flex items-center border border-border rounded-lg">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-muted transition-colors">
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:bg-muted transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button className="flex-1 py-3 border-2 border-accent text-accent font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-accent/5 transition-colors">
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </button>
            <button className="flex-1 py-3 bg-accent hover:bg-krishna-orange-hover text-primary font-medium rounded-lg transition-colors">
              Buy Now
            </button>
          </div>

          {/* Seller Info */}
          <div className="text-sm text-muted-foreground mb-6">
            Sold by: <span className="text-krishna-blue-link cursor-pointer hover:underline">{product.seller}</span>
          </div>

          {/* Highlights */}
          <div className="mb-6">
            <h2 className="font-bold text-foreground mb-3">Highlights</h2>
            <ul className="space-y-2">
              {highlights.map((highlight, i) => (<li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-krishna-green shrink-0 mt-0.5" />
                {highlight}
              </li>))}
            </ul>
          </div>

          {/* Specifications */}
          <div className="mb-6">
            <h2 className="font-bold text-foreground mb-3">Specifications</h2>
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {(showAllSpecs ? specifications : specifications.slice(0, 5)).map((spec, i) => (<tr key={i} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                    <td className="px-4 py-2.5 text-muted-foreground w-1/3">{spec.label}</td>
                    <td className="px-4 py-2.5 text-foreground">{spec.value}</td>
                  </tr>))}
                </tbody>
              </table>
              {specifications.length > 5 && (<button onClick={() => setShowAllSpecs(!showAllSpecs)} className="w-full py-3 text-sm text-krishna-blue-link font-medium flex items-center justify-center gap-1 border-t border-border hover:bg-muted/50">
                {showAllSpecs ? "Show Less" : `Show All (${specifications.length})`}
                {showAllSpecs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>)}
            </div>
          </div>

          {/* Reviews */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground">Customer Reviews</h2>
              <button className="text-sm text-krishna-blue-link hover:underline">
                Write a review
              </button>
            </div>

            {/* Rating Summary */}
            <div className="bg-card rounded-lg border border-border p-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">{product.rating}</div>
                  <div className="flex justify-center my-1">{renderStars(product.rating)}</div>
                  <div className="text-xs text-muted-foreground">{product.reviews.toLocaleString()} ratings</div>
                </div>
                <div className="flex-1 space-y-1">
                  {[5, 4, 3, 2, 1].map((star) => (<div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-3">{star}</span>
                    <Star className="w-3 h-3 text-accent fill-accent" />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${star === 5 ? 65 : star === 4 ? 20 : star === 3 ? 10 : 3}%` }} />
                    </div>
                    <span className="w-8 text-muted-foreground">
                      {star === 5 ? "65%" : star === 4 ? "20%" : star === 3 ? "10%" : "3%"}
                    </span>
                  </div>))}
                </div>
              </div>
            </div>

            {/* Review List */}
            <div className="space-y-4">
              {(showAllReviews ? reviews : reviews.slice(0, 2)).map((review) => (<div key={review.id} className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center bg-krishna-green/10 px-1.5 py-0.5 rounded text-xs">
                    <span className="font-medium text-krishna-green">{review.rating}</span>
                    <Star className="w-3 h-3 text-krishna-green fill-krishna-green ml-0.5" />
                  </div>
                  <span className="font-medium text-sm text-foreground">{review.title}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{review.user}</span>
                  <span>•</span>
                  <span>{review.date}</span>
                  {review.verified && (<>
                    <span>•</span>
                    <span className="text-krishna-green">Verified Purchase</span>
                  </>)}
                </div>
              </div>))}
            </div>

            {reviews.length > 2 && (<button onClick={() => setShowAllReviews(!showAllReviews)} className="w-full py-3 mt-3 text-sm text-krishna-blue-link font-medium border border-border rounded-lg hover:bg-muted/50">
              {showAllReviews ? "Show Less" : "See All Reviews"}
            </button>)}
          </div>
        </div>
      </div>
    </div>

    <Footer />
  </div >);
}
