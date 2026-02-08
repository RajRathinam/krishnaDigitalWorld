import { ChevronUp, MapPin, Phone, Mail, Shield, FileText, Truck, RefreshCcw, Home, Briefcase, Facebook, Instagram, Twitter, Youtube, Linkedin, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from 'react';
import { categoryApi } from '@/services/api';
import { useShopInfo } from '@/contexts/ShopInfoContext';

// Social media icon mapping with multiple case variations
const SOCIAL_MEDIA_ICONS = {
  // Facebook variations
  facebook: Facebook,
  facebookpage: Facebook,
  fb: Facebook,
  'facebook.com': Facebook,
  
  // Instagram variations
  instagram: Instagram,
  insta: Instagram,
  ig: Instagram,
  'instagram.com': Instagram,
  
  // Twitter/X variations
  twitter: Twitter,
  x: Twitter,
  tw: Twitter,
  'twitter.com': Twitter,
  'x.com': Twitter,
  
  // YouTube variations
  youtube: Youtube,
  youtubechannel: Youtube,
  yt: Youtube,
  'youtube.com': Youtube,
  'youtu.be': Youtube,
  
  // LinkedIn variations
  linkedin: Linkedin,
  linkedinpage: Linkedin,
  li: Linkedin,
  'linkedin.com': Linkedin,
  
  // WhatsApp variations
  whatsapp: Phone,
  whatsappbusiness: Phone,
  wa: Phone,
  wapp: Phone,
  
  // Website variations
  website: Globe,
  site: Globe,
  web: Globe,
  url: Globe,
  
  // Pinterest variations
  pinterest: Globe,
  pin: Globe,
  'pinterest.com': Globe,
  
  // Telegram variations
  telegram: Globe,
  tg: Globe,
  'telegram.me': Globe,
  't.me': Globe,
};

// Normalize platform name for consistent matching
const normalizePlatformName = (platform) => {
  if (!platform) return 'website';
  
  let normalized = platform.toLowerCase().trim();
  
  // Remove common prefixes/suffixes
  normalized = normalized.replace(/(https?:\/\/)?(www\.)?/, ''); // Remove http/https/www
  normalized = normalized.replace(/\..*$/, ''); // Remove domain extensions
  normalized = normalized.replace(/[^a-z0-9]/g, ''); // Remove special characters
  
  return normalized;
};

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

  // Get social media links from shopInfo
  const socialMediaLinks = shopInfo?.socialMedia || {};
  const hasSocialMedia = Object.keys(socialMediaLinks).length > 0;

  // Function to get icon for social media platform with better matching
  const getSocialMediaIcon = (platform) => {
    const normalizedPlatform = normalizePlatformName(platform);
    
    // Check for exact match
    if (SOCIAL_MEDIA_ICONS[normalizedPlatform]) {
      return SOCIAL_MEDIA_ICONS[normalizedPlatform];
    }
    
    // Check for partial matches
    for (const [key, Icon] of Object.entries(SOCIAL_MEDIA_ICONS)) {
      if (normalizedPlatform.includes(key) || key.includes(normalizedPlatform)) {
        return Icon;
      }
    }
    
    // Default to Globe icon
    return Globe;
  };

  // Function to validate and format social media URL
  const formatSocialMediaUrl = (platform, url) => {
    if (!url) return '#';
    
    // Clean up the URL
    let cleanedUrl = url.trim();
    
    // Special handling for WhatsApp
    if (platform.toLowerCase().includes('whatsapp') || 
        platform.toLowerCase().includes('wa') ||
        cleanedUrl.includes('wa.me') ||
        cleanedUrl.includes('whatsapp')) {
      
      // Extract phone number
      const phoneMatch = cleanedUrl.match(/[\d\+]{10,}/);
      if (phoneMatch) {
        const phoneNumber = phoneMatch[0];
        // Ensure it has country code
        const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
        return `https://wa.me/${formattedNumber}`;
      }
    }
    
    // Add https:// if not present and doesn't start with common protocols
    if (!cleanedUrl.startsWith('http://') && 
        !cleanedUrl.startsWith('https://') &&
        !cleanedUrl.startsWith('mailto:') &&
        !cleanedUrl.startsWith('tel:')) {
      cleanedUrl = 'https://' + cleanedUrl;
    }
    
    return cleanedUrl;
  };

  // Debug: Log social media data in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && hasSocialMedia) {
      console.log('Social Media Links from API:', socialMediaLinks);
      console.log('Platform names:', Object.keys(socialMediaLinks));
      Object.entries(socialMediaLinks).forEach(([platform, url]) => {
        const normalized = normalizePlatformName(platform);
        console.log(`Platform: "${platform}" → Normalized: "${normalized}" → Icon:`, 
          getSocialMediaIcon(platform).name);
      });
    }
  }, [socialMediaLinks, hasSocialMedia]);

  return (
    <footer className="mt-12 md:pb-0">
      {/* Back to Top */}
      <button onClick={scrollToTop} className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground py-3 text-sm font-medium transition-colors border-t border-border">
        <span className="flex items-center justify-center gap-2">
          <ChevronUp className="w-4 h-4" />
          Back to top
        </span>
      </button>

      {/* Main Footer Links */}
      <div className="bg-primary md:px-10">
        <div className="container py-12 px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h3 className="text-primary-foreground font-display font-medium text-lg mb-4">{title}</h3>
                <ul className="space-y-2.5">
                  {links.map((link) => {
                    const Icon = link.icon;
                    return (
                      <li key={link.name}>
                        <Link to={link.path} className="flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors">
                          {Icon && <Icon className="w-3.5 h-3.5" />}
                          {link.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* Social Media Links Column */}
          {hasSocialMedia && (
            <div className="mt-8">
              <h3 className="text-primary-foreground font-display font-medium text-lg mb-4">Connect With Us</h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(socialMediaLinks).map(([platform, url]) => {
                  if (!url || !url.trim()) return null;
                  
                  const formattedUrl = formatSocialMediaUrl(platform, url);
                  const Icon = getSocialMediaIcon(platform);
                  const normalizedPlatform = normalizePlatformName(platform);
                  
                  return (
                    <a
                      key={platform}
                      href={formattedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground transition-colors group relative"
                      aria-label={`Follow us on ${platform}`}
                      title={`${platform}: ${url}`}
                    >
                      <Icon className="w-5 h-5" />
                      {/* Debug tooltip in development */}
                      {process.env.NODE_ENV === 'development' && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {platform} → {normalizedPlatform}
                        </div>
                      )}
                    </a>
                  );
                })}
              </div>
              
              {/* Optional: Follow us text */}
              <p className="mt-4 text-sm text-primary-foreground/60">
                Follow us for updates, offers, and more!
              </p>
            </div>
          )}

          {/* Contact Information */}
          <div className="mt-8 pt-8 border-t border-primary-foreground/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-12 h-12 md:w-10 md:h-10 text-accent" />
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
                <Phone className="w-5 h-5 text-accent" />
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
                <Mail className="w-5 h-5 text-accent" />
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
          <div className="container py-6 flex flex-col items-center gap-2">
            {/* Store name and location row */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 w-full">
              <Link to="/" className="flex items-center gap-2">
                <span className="text-xl font-display font-semibold text-primary-foreground">Sri Krishna</span>
                <span className="text-xl font-display font-semibold text-accent">Digital World</span>
              </Link>

              <div className="flex items-center gap-4 text-primary-foreground/60 text-sm">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {shopInfo?.city && shopInfo?.state
                    ? `${shopInfo.city}, ${shopInfo.state}`
                    : 'Nagapattinam, Tamil Nadu'}
                </span>
              </div>
            </div>

            {/* Social Media Links */}
            {hasSocialMedia && (
              <div className="flex gap-4 mt-2">
                {Object.entries(socialMediaLinks).map(([platform, url]) => {
                  if (!url || !url.trim()) return null;
                  
                  const formattedUrl = formatSocialMediaUrl(platform, url);
                  const Icon = getSocialMediaIcon(platform);
                  
                  return (
                    <a
                      key={platform}
                      href={formattedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-foreground/40 hover:text-primary-foreground transition-colors"
                      aria-label={`${platform}`}
                      title={platform}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="bg-secondary/50">
        <div className="container flex flex-col md:flex-row justify-between items-center py-6 px-4">
          <div className="text-center text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} {shopInfo?.shopName || 'Sri Krishna Home Appliances'}.</span>
          </div>
          {/* Powered by section */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 md:mt-0">
            <span>Powered by</span>
            <a
              href="https://infygrid.in"
              target="_blank"
              rel="noopener noreferrer"
              className="focus:outline-none rounded"
            >
              <img
                src="/infygrid_logo.png"
                alt="Infygrid"
                className="h-4 w-auto object-contain hover:opacity-80 transition-opacity"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}