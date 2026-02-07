import { ChevronUp, MapPin, Phone, Mail, Shield, FileText, Truck, RefreshCcw, Home, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from 'react';
import { categoryApi } from '@/services/api';
import { useShopInfo } from '@/contexts/ShopInfoContext';
const footerLinks = {
    "Company": [
        { name: "About Us", path: "/about-us", icon: Home },
        { name: "Careers", path: "/careers", icon: Briefcase },
        { name: "Our Promise", path: "/our-promise", icon: Shield },
        { name: "Help", path: "/help", icon: Shield },
        { name: "Contact Us", path: "/contact", icon: Phone }
    ],
    "Policies": [
        { name: "Privacy Policy", path: "/privacy-policy", icon: Shield },
        { name: "Conditions", path: "/terms-conditions", icon: FileText },
        { name: "Shipping Policy", path: "/shipping-policy", icon: Truck },
        { name: "Refund Policy", path: "/refund-policy", icon: RefreshCcw },
        { name: "Return Policy", path: "/return-policy", icon: RefreshCcw }
    ],
    "Customer Service": [
        { name: "Help & Support", path: "/help-support", icon: Phone },
        { name: "Warranty Info", path: "/warranty-info", icon: Shield },
        { name: "Installation Support", path: "/installation-support", icon: Home }
    ],
    "Shop By Category": [
        { name: "Kitchen Appliances", path: "/products?category=kitchen", query: "kitchen" },
        { name: "Home & Utility", path: "/products?category=home-utility", query: "home-utility" },
        { name: "Energy Efficient", path: "/products?category=energy-efficient", query: "energy-efficient" }
    ]
};
export function Footer() {
    const { shopInfo } = useShopInfo();
    const [categories, setCategories] = useState([]);
    useEffect(() => {
        let canceled = false;
        (async () => {
            try {
                const res = await categoryApi.getCategories();
                const data = res?.data || [];
                if (!canceled)
                    setCategories(Array.isArray(data) ? data : []);
            }
            catch (err) {
                console.error('Failed to fetch footer categories', err);
            }
        })();
        return () => { canceled = true; };
    }, []);
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    return (<footer className="mt-12 md:pb-0">
      {/* Back to Top */}
      <button onClick={scrollToTop} className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground py-3 text-sm font-medium transition-colors border-t border-border">
        <span className="flex items-center justify-center gap-2">
          <ChevronUp className="w-4 h-4"/>
          Back to top
        </span>
      </button>

      {/* Main Footer Links */}
      <div className="bg-primary md:px-10">
        <div className="container py-12 px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Object.entries(footerLinks).map(([title, links]) => (<div key={title}>
                <h3 className="text-primary-foreground font-display font-medium text-lg mb-4">{title}</h3>
                <ul className="space-y-2.5">
                  {links.map((link) => {
                const Icon = link.icon;
                return (<li key={link.name}>
                        <Link to={link.path} className="flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors">
                          {Icon && <Icon className="w-3.5 h-3.5"/>}
                          {link.name}
                        </Link>
                      </li>);
            })}
                </ul>
              </div>))}
          </div>

          {/* Contact Information */}
          <div className="mt-8 pt-8 border-t border-primary-foreground/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="flex items-center gap-3">
                <MapPin className="w-12 h-12 md:w-10 md:h-10 text-accent"/>
                <div>
                  <p className="font-medium text-primary-foreground">Store Location</p>
                  <p className="text-xs md:text-sm text-primary-foreground/60">
                    {shopInfo?.address || shopInfo?.city 
                      ? `${shopInfo.address || ''}${shopInfo.city ? `, ${shopInfo.city}` : ''}${shopInfo.state ? `, ${shopInfo.state}` : ''}${shopInfo.pincode ? ` - ${shopInfo.pincode}` : ''}`
                      : 'Sri Krishna Home Appliances, Nagapattinam'}
                  </p>
                  <p className="text-xs text-primary-foreground/40">Delivery within 30km radius</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-accent"/>
                <div>
                  <p className="font-medium text-primary-foreground">Call Us</p>
                  {shopInfo?.phone ? (
                    <a href={`tel:${shopInfo.phone}`} className="text-xs md:text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                      {shopInfo.phone}
                    </a>
                  ) : (
                    <span className="text-sm text-primary-foreground/60">+91 XXXXXXXXXX</span>
                  )}
                  {shopInfo?.supportPhone && (
                    <p className="text-xs text-primary-foreground/40">Support: {shopInfo.supportPhone}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-accent"/>
                <div>
                  <p className="font-medium text-primary-foreground">Email Us</p>
                  {shopInfo?.email ? (
                    <a href={`mailto:${shopInfo.email}`} className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                      {shopInfo.email}
                    </a>
                  ) : (
                    <span className="text-xs md:text-sm text-primary-foreground/60">support@srikrishnahomeappliances.com</span>
                  )}
                  {shopInfo?.supportEmail && (
                    <p className="text-xs text-primary-foreground/40">Support: {shopInfo.supportEmail}</p>
                  )}
                </div>
              </div>
             
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-primary-foreground/10">
          <div className="container py-6 flex flex-col md:flex-row items-center justify-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-display font-semibold text-primary-foreground">Sri Krishna</span>
              <span className="text-xl font-display font-semibold text-accent">Digital World</span>
            </Link>
            <div className="flex items-center gap-4 text-primary-foreground/60 text-sm">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5"/> 
                {shopInfo?.city && shopInfo?.state 
                  ? `${shopInfo.city}, ${shopInfo.state}`
                  : 'Nagapattinam, Tamil Nadu'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="bg-secondary/50">
        <div className="container py-6 px-4">  
          <div className="text-center text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} {shopInfo?.shopName || 'Sri Krishna Home Appliances'}. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>);
}