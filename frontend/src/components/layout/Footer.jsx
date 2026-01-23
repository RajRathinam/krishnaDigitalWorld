import { ChevronUp, MapPin, Phone, Mail, Shield, FileText, Truck, RefreshCcw, Home, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from 'react';
import { categoryApi } from '@/services/api';
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
  return (
    <footer className="relative z-10 mt-20 border-t border-white/10 overflow-hidden">
      {/* Background Mesh for Footer */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl -z-20" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/20 rounded-full blur-[100px] -z-10 opacity-30 pointer-events-none" />
      <div className="absolute bottom-0 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] -z-10 opacity-30 pointer-events-none" />

      {/* Back to Top */}
      <button
        onClick={scrollToTop}
        className="w-full relative group overflow-hidden bg-accent/5 hover:bg-accent/10 text-accent-foreground/80 py-4 text-sm font-medium transition-all duration-300 border-b border-white/5"
      >
        <span className="relative z-10 flex items-center justify-center gap-2 group-hover:-translate-y-0.5 transition-transform">
          <ChevronUp className="w-4 h-4 animate-bounce" />
          Back to Top
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </button>

      {/* Main Footer Links */}
      <div className="container py-16 px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 mb-16">
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="space-y-6">
              <h3 className="text-white font-display font-bold text-lg tracking-wide relative inline-block">
                {title}
                <span className="absolute -bottom-2 left-0 w-12 h-1 bg-accent rounded-full" />
              </h3>
              <ul className="space-y-4">
                {links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.name}>
                      <Link
                        to={link.path}
                        className="group flex items-center gap-3 text-white/60 hover:text-accent text-sm transition-all duration-300 hover:translate-x-1"
                      >
                        <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-accent/10 transition-colors">
                          {Icon && <Icon className="w-3.5 h-3.5 text-white/40 group-hover:text-accent transition-colors" />}
                        </div>
                        {link.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-white/10">
          {[
            {
              icon: MapPin,
              title: "Store Location",
              text: "Sri Krishna Home Appliances, Nagapattinam",
              sub: "Delivery within 30km radius",
              color: "text-red-400"
            },
            {
              icon: Phone,
              title: "Call Us",
              text: "+91 99999 99999",
              sub: "Mon-Sat: 10AM - 9PM",
              href: "tel:+919999999999",
              color: "text-green-400"
            },
            {
              icon: Mail,
              title: "Email Us",
              text: "support@krishnadigital.com",
              sub: "24/7 Online Support",
              href: "mailto:support@krishnadigital.com",
              color: "text-blue-400"
            }
          ].map((item, i) => (
            <div key={i} className="flex gap-4 p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-accent/20 transition-all duration-300 group">
              <div className={`p-3 rounded-xl bg-white/5 group-hover:scale-110 transition-transform duration-300 ${item.color}`}>
                <item.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-white mb-1">{item.title}</p>
                {item.href ? (
                  <a href={item.href} className="text-sm text-white/70 hover:text-accent transition-colors block mb-0.5">{item.text}</a>
                ) : (
                  <p className="text-sm text-white/70 mb-0.5">{item.text}</p>
                )}
                <p className="text-xs text-white/40">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-white/10 bg-black/40 backdrop-blur-md">
        <div className="container py-8 px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-xl font-display font-bold text-white group-hover:text-accent transition-colors">Sri Krishna</span>
            <span className="text-xl font-display font-bold text-accent">Digital World</span>
          </Link>

          <div className="text-center md:text-right text-xs text-white/40">
            <p>© {new Date().getFullYear()} Sri Krishna Home Appliances. All rights reserved.</p>
            <p className="mt-1">Designed with ❤️ for Nagapattinam</p>
          </div>
        </div>
      </div>
    </footer>
  );
}