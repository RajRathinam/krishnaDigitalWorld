import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useShopInfo } from '@/contexts/ShopInfoContext';
import { Search, ChevronDown, ChevronUp, Phone, Mail, MessageCircle, MapPin, Clock, Package, RotateCcw, CreditCard, Truck, Shield, HelpCircle, ExternalLink } from "lucide-react";

const faqCategories = [
    {
        id: "orders",
        title: "Orders & Shipping",
        icon: Package,
        faqs: [
            { q: "How do I track my order?", a: "You can track your order from the 'My Orders' section in your account. You'll also receive SMS and email updates with tracking links." },
            { q: "What are the delivery charges?", a: "Delivery is FREE on all orders above ₹500. For orders below ₹500, a nominal delivery fee of ₹49 applies." },
            { q: "How long does delivery take?", a: "Most orders are delivered within 2-5 business days. Express delivery options are available for select locations." },
        ],
    },
    {
        id: "returns",
        title: "Returns & Refunds",
        icon: RotateCcw,
        faqs: [
            { q: "What is your return policy?", a: "We offer a 10-day replacement policy on all products. If the product is damaged or defective, we'll replace it free of cost." },
            { q: "How do I initiate a return?", a: "Go to 'My Orders', select the order, and click 'Return'. Our team will schedule a pickup within 24-48 hours." },
            { q: "When will I get my refund?", a: "Refunds are processed within 5-7 business days after we receive the returned product. The amount will be credited to your original payment method." },
        ],
    },
    {
        id: "payment",
        title: "Payment & Pricing",
        icon: CreditCard,
        faqs: [
            { q: "What payment methods do you accept?", a: "We accept UPI, Credit/Debit Cards, Net Banking, and Cash on Delivery. EMI options are available on select products." },
            { q: "Is it safe to pay online?", a: "Yes, all payments are 100% secure. We use industry-standard encryption and never store your card details." },
            { q: "How do EMI payments work?", a: "Select EMI at checkout, choose your bank and tenure. Your EMI amount will be charged monthly to your credit card." },
        ],
    },
    {
        id: "warranty",
        title: "Warranty & Service",
        icon: Shield,
        faqs: [
            { q: "What warranty do products have?", a: "All products come with manufacturer warranty ranging from 1-5 years depending on the product category." },
            { q: "How do I claim warranty?", a: "Contact our support team with your order ID and issue description. We'll coordinate with the manufacturer for warranty claims." },
            { q: "Do you offer installation?", a: "Yes, free installation is available for ACs, TVs above 32\", and washing machines in select cities." },
        ],
    },
];

export default function Help() {
    const { shopInfo } = useShopInfo();
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedCategory, setExpandedCategory] = useState("orders");
    const [expandedFaq, setExpandedFaq] = useState(null);

    // Prepare contact methods based on shopInfo
    const contactMethods = [
        { 
            icon: Phone, 
            title: "Call Us", 
            detail: shopInfo?.supportPhone || shopInfo?.phone || "Contact Us", 
            subtext: shopInfo?.phone ? "Available during business hours" : "Contact us for support",
            action: () => {
                const phoneNumber = (shopInfo?.supportPhone || shopInfo?.phone)?.replace(/[^\d+]/g, '');
                if (phoneNumber) {
                    window.location.href = `tel:${phoneNumber}`;
                } else {
                    alert("Phone number not available. Please visit our store or send us an email.");
                }
            }
        },
        { 
            icon: Mail, 
            title: "Email", 
            detail: shopInfo?.supportEmail || shopInfo?.email || "Email Us", 
            subtext: shopInfo?.supportEmail ? "Reply within 24 hours" : "Send us an email",
            action: () => {
                const email = shopInfo?.supportEmail || shopInfo?.email;
                if (email) {
                    const subject = encodeURIComponent("Support Request");
                    const body = encodeURIComponent(`Hello,\n\nI need help with:\n\n[Please describe your issue here]\n\nThank you.`);
                    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
                } else {
                    alert("Email address not available. Please call us or visit our store.");
                }
            }
        },
        { 
            icon: MessageCircle, 
            title: "WhatsApp", 
            detail: shopInfo?.whatsappNumber ? `Chat on WhatsApp` : "Message Us", 
            subtext: shopInfo?.whatsappNumber ? "Available 24/7" : "Contact us via phone",
            action: () => {
                if (shopInfo?.whatsappNumber) {
                    const phone = shopInfo.whatsappNumber.replace(/[^\d+]/g, '');
                    const message = encodeURIComponent("Hello, I need help with...");
                    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
                } else if (shopInfo?.phone) {
                    const phoneNumber = shopInfo.phone.replace(/[^\d+]/g, '');
                    window.location.href = `tel:${phoneNumber}`;
                } else {
                    alert("WhatsApp/Phone number not available. Please send us an email or visit our store.");
                }
            }
        },
    ];

    // Get primary location
    const primaryLocation = Array.isArray(shopInfo?.locations) && shopInfo.locations.length > 0 
        ? shopInfo.locations[0] 
        : null;

    // Format business hours
    const formatBusinessHours = () => {
        if (!shopInfo?.businessHours) return "Mon-Sun: 9 AM - 9 PM";
        
        const hours = shopInfo.businessHours;
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        // Check if all days have same hours
        const firstDay = hours[days[0]];
        const allSame = days.every(day => 
            hours[day] && 
            hours[day].open === firstDay.open && 
            hours[day].close === firstDay.close
        );
        
        if (allSame && firstDay) {
            return `Mon-Sun: ${firstDay.open} - ${firstDay.close}`;
        }
        
        return "Check specific hours for each day";
    };

    const handleVisitStore = () => {
        if (shopInfo?.mapEmbedUrl) {
            // Try to extract Google Maps URL from embed URL
            let mapsUrl = shopInfo.mapEmbedUrl;
            if (mapsUrl.includes('src="')) {
                const match = mapsUrl.match(/src="([^"]+)"/);
                if (match && match[1]) {
                    mapsUrl = match[1];
                }
            }
            window.open(mapsUrl, '_blank');
        } else if (shopInfo?.address) {
            const address = encodeURIComponent(shopInfo.address);
            window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
        } else if (primaryLocation?.address) {
            const address = encodeURIComponent(primaryLocation.address);
            window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
        } else {
            alert("Store location information not available. Please contact us for directions.");
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            {/* Hero Section */}
            <div className="bg-primary py-8 md:py-12">
                <div className="container px-4 text-center">
                    <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
                        How can we help you?
                    </h1>
                    <p className="text-primary-foreground/80 mb-6">
                        Get support for {shopInfo?.shopName || "our store"}
                    </p>
                    <div className="max-w-xl mx-auto relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"/>
                        <input 
                            type="text" 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            placeholder="Search for help articles..." 
                            className="w-full pl-12 pr-4 py-3 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>
                </div>
            </div>

            <div className="container py-6 md:py-8 px-3 md:px-4">
                {/* Quick Links */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
                    {[
                        { icon: Package, label: "Track Order", href: "/account" },
                        { icon: RotateCcw, label: "Returns", href: "#returns" },
                        { icon: Truck, label: "Delivery Info", href: "#orders" },
                        { icon: Shield, label: "Warranty", href: "#warranty" },
                    ].map((item) => (
                        <a 
                            key={item.label} 
                            href={item.href} 
                            className="flex flex-col items-center gap-2 p-4 bg-card rounded-lg border border-border hover:border-accent transition-colors"
                        >
                            <item.icon className="w-6 h-6 text-accent"/>
                            <span className="text-sm font-medium text-foreground">{item.label}</span>
                        </a>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                    {/* FAQs */}
                    <div className="lg:col-span-8">
                        <h2 className="text-lg md:text-xl font-bold text-foreground mb-4">
                            Frequently Asked Questions
                        </h2>

                        <div className="space-y-4">
                            {faqCategories.map((category) => (
                                <div key={category.id} id={category.id} className="bg-card rounded-lg border border-border overflow-hidden">
                                    <button 
                                        onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)} 
                                        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <category.icon className="w-5 h-5 text-accent"/>
                                            <span className="font-medium text-foreground">{category.title}</span>
                                        </div>
                                        {expandedCategory === category.id ? (
                                            <ChevronUp className="w-5 h-5 text-muted-foreground"/>
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-muted-foreground"/>
                                        )}
                                    </button>

                                    {expandedCategory === category.id && (
                                        <div className="border-t border-border">
                                            {category.faqs.map((faq, i) => (
                                                <div key={i} className="border-b border-border last:border-0">
                                                    <button 
                                                        onClick={() => setExpandedFaq(expandedFaq === `${category.id}-${i}` ? null : `${category.id}-${i}`)} 
                                                        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                                                    >
                                                        <span className="text-sm text-foreground pr-4">{faq.q}</span>
                                                        {expandedFaq === `${category.id}-${i}` ? (
                                                            <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0"/>
                                                        ) : (
                                                            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0"/>
                                                        )}
                                                    </button>
                                                    {expandedFaq === `${category.id}-${i}` && (
                                                        <div className="px-4 pb-4 text-sm text-muted-foreground">
                                                            {faq.a}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact Section */}
                    <div className="lg:col-span-4">
                        <div className="bg-card rounded-lg border border-border p-4 md:p-6 sticky top-24">
                            <h2 className="text-lg font-bold text-foreground mb-4">Contact Us</h2>

                            <div className="space-y-4">
                                {contactMethods.map((method) => (
                                    <button 
                                        key={method.title} 
                                        onClick={method.action}
                                        className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer text-left"
                                    >
                                        <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center shrink-0">
                                            <method.icon className="w-5 h-5 text-accent"/>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-foreground">{method.title}</p>
                                            <p className="text-sm text-accent hover:text-accent/80 transition-colors">
                                                {method.detail}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{method.subtext}</p>
                                        </div>
                                        {method.title === "WhatsApp" && shopInfo?.whatsappNumber && (
                                            <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0 mt-2" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-6 pt-6 border-t border-border">
                                <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                                    <MapPin className="w-4 h-4"/>
                                    Visit Our Store
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                    {primaryLocation?.name || shopInfo?.shopName || "Krishna Store"}
                                </p>
                                {primaryLocation?.address ? (
                                    <p className="text-sm text-muted-foreground mb-2">{primaryLocation.address}</p>
                                ) : shopInfo?.address ? (
                                    <p className="text-sm text-muted-foreground mb-2">{shopInfo.address}</p>
                                ) : (
                                    <p className="text-sm text-muted-foreground mb-2">
                                        {shopInfo?.city || "City"}, {shopInfo?.state || "State"} - {shopInfo?.pincode || "Pincode"}
                                    </p>
                                )}
                                
                                {primaryLocation?.phone && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Location Phone: {primaryLocation.phone}
                                    </p>
                                )}
                                
                                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground mb-3">
                                    <Clock className="w-4 h-4"/>
                                    <span>{formatBusinessHours()}</span>
                                </div>
                                
                                <button 
                                    onClick={handleVisitStore}
                                    className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4"/>
                                    Open in Google Maps
                                </button>
                            </div>

                            <button 
                                onClick={() => {
                                    const email = shopInfo?.supportEmail || shopInfo?.email;
                                    if (email) {
                                        const subject = encodeURIComponent("Support Request");
                                        const body = encodeURIComponent(`Hello,\n\nI need help with:\n\n[Please describe your issue here]\n\nOrder ID (if applicable): \n\nThank you.`);
                                        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
                                    } else {
                                        alert("Please use one of the contact methods above to reach out to us.");
                                    }
                                }}
                                className="w-full mt-6 py-3 bg-accent text-sm hover:bg-accent/90 text-primary font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <HelpCircle className="w-5 h-5"/>
                                Submit a Support Request
                            </button>
                            
                            {/* Additional contact info */}
                            {(shopInfo?.alternatePhone || shopInfo?.supportPhone !== shopInfo?.phone) && (
                                <div className="mt-4 pt-4 border-t border-border/50">
                                    <h4 className="text-sm font-medium text-foreground mb-2">Other Contact Options</h4>
                                    <div className="space-y-1">
                                        {shopInfo?.alternatePhone && shopInfo.alternatePhone !== shopInfo?.phone && (
                                            <button 
                                                onClick={() => {
                                                    const phoneNumber = shopInfo.alternatePhone.replace(/[^\d+]/g, '');
                                                    window.location.href = `tel:${phoneNumber}`;
                                                }}
                                                className="text-xs text-accent hover:text-accent/80 transition-colors"
                                            >
                                                Alternate Phone: {shopInfo.alternatePhone}
                                            </button>
                                        )}
                                        {shopInfo?.supportPhone && shopInfo.supportPhone !== shopInfo?.phone && (
                                            <button 
                                                onClick={() => {
                                                    const phoneNumber = shopInfo.supportPhone.replace(/[^\d+]/g, '');
                                                    window.location.href = `tel:${phoneNumber}`;
                                                }}
                                                className="text-xs text-accent hover:text-accent/80 transition-colors block"
                                            >
                                                Support Phone: {shopInfo.supportPhone}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}