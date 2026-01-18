import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Search, ChevronDown, ChevronUp, Phone, Mail, MessageCircle, MapPin, Clock, Package, RotateCcw, CreditCard, Truck, Shield, HelpCircle } from "lucide-react";
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
const contactMethods = [
    { icon: Phone, title: "Call Us", detail: "1800-123-4567", subtext: "Toll-free, 9 AM - 9 PM" },
    { icon: Mail, title: "Email", detail: "support@krishnastore.com", subtext: "Reply within 24 hours" },
    { icon: MessageCircle, title: "Live Chat", detail: "Chat with us", subtext: "Available 24/7" },
];
export default function Help() {
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedCategory, setExpandedCategory] = useState("orders");
    const [expandedFaq, setExpandedFaq] = useState(null);
    return (<div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <div className="bg-primary py-8 md:py-12">
        <div className="container px-4 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">How can we help you?</h1>
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"/>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search for help articles..." className="w-full pl-12 pr-4 py-3 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"/>
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
        ].map((item) => (<a key={item.label} href={item.href} className="flex flex-col items-center gap-2 p-4 bg-card rounded-lg border border-border hover:border-accent transition-colors">
              <item.icon className="w-6 h-6 text-accent"/>
              <span className="text-sm font-medium text-foreground">{item.label}</span>
            </a>))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* FAQs */}
          <div className="lg:col-span-8">
            <h2 className="text-lg md:text-xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>

            <div className="space-y-4">
              {faqCategories.map((category) => (<div key={category.id} id={category.id} className="bg-card rounded-lg border border-border overflow-hidden">
                  <button onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)} className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <category.icon className="w-5 h-5 text-accent"/>
                      <span className="font-medium text-foreground">{category.title}</span>
                    </div>
                    {expandedCategory === category.id ? (<ChevronUp className="w-5 h-5 text-muted-foreground"/>) : (<ChevronDown className="w-5 h-5 text-muted-foreground"/>)}
                  </button>

                  {expandedCategory === category.id && (<div className="border-t border-border">
                      {category.faqs.map((faq, i) => (<div key={i} className="border-b border-border last:border-0">
                          <button onClick={() => setExpandedFaq(expandedFaq === `${category.id}-${i}` ? null : `${category.id}-${i}`)} className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors">
                            <span className="text-sm text-foreground pr-4">{faq.q}</span>
                            {expandedFaq === `${category.id}-${i}` ? (<ChevronUp className="w-4 h-4 text-muted-foreground shrink-0"/>) : (<ChevronDown className="w-4 h-4 text-muted-foreground shrink-0"/>)}
                          </button>
                          {expandedFaq === `${category.id}-${i}` && (<div className="px-4 pb-4 text-sm text-muted-foreground">
                              {faq.a}
                            </div>)}
                        </div>))}
                    </div>)}
                </div>))}
            </div>
          </div>

          {/* Contact Section */}
          <div className="lg:col-span-4">
            <div className="bg-card rounded-lg border border-border p-4 md:p-6 sticky top-24">
              <h2 className="text-lg font-bold text-foreground mb-4">Contact Us</h2>

              <div className="space-y-4">
                {contactMethods.map((method) => (<div key={method.title} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center shrink-0">
                      <method.icon className="w-5 h-5 text-accent"/>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{method.title}</p>
                      <p className="text-sm text-krishna-blue-link">{method.detail}</p>
                      <p className="text-xs text-muted-foreground">{method.subtext}</p>
                    </div>
                  </div>))}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4"/>
                  Visit Our Store
                </h3>
                <p className="text-sm text-muted-foreground">
                  Krishna Store<br />
                  42, Electronics Market<br />
                  Mumbai, Maharashtra - 400001
                </p>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4"/>
                  <span>Mon-Sat: 10 AM - 9 PM</span>
                </div>
              </div>

              <button className="w-full mt-6 py-3 bg-accent hover:bg-krishna-orange-hover text-primary font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                <HelpCircle className="w-5 h-5"/>
                Submit a Request
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>);
}
