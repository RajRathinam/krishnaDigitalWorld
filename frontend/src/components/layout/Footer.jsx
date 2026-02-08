import { ChevronUp, MapPin, Phone, Mail, Shield, FileText, Truck, RefreshCcw, Home, Briefcase, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from 'react';
import { categoryApi } from '@/services/api';
import { useShopInfo } from '@/contexts/ShopInfoContext';

// Import social icons safely
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube, 
  Linkedin 
} from "lucide-react";

// Social media icon mapping
const SOCIAL_MEDIA_ICONS = {
  facebook: Facebook || Globe,
  instagram: Instagram || Globe,
  twitter: Twitter || Globe,
  youtube: Youtube || Globe,
  linkedin: Linkedin || Globe,
  whatsapp: Phone || Globe,
  website: Globe,
};

// Normalize platform name for consistent matching
const normalizePlatformName = (platform) => {
  if (!platform) return 'website';
  
  let normalized = platform.toLowerCase().trim();
  
  // Remove common prefixes/suffixes
  normalized = normalized.replace(/(https?:\/\/)?(www\.)?/, '');
  normalized = normalized.replace(/\..*$/, '');
  normalized = normalized.replace(/[^a-z0-9]/g, '');
  
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

// Helper function to parse social media data from API
const parseSocialMediaData = (socialMediaData) => {
  if (!socialMediaData) return {};
  
  // If it's already an object, return it
  if (typeof socialMediaData === 'object' && !Array.isArray(socialMediaData)) {
    // Filter out numeric keys
    const filtered = {};
    Object.entries(socialMediaData).forEach(([key, value]) => {
      if (!isNaN(key) || !value || value.trim() === '') return;
      filtered[key] = value;
    });
    return filtered;
  }
  
  // If it's a string, try to parse it as JSON
  if (typeof socialMediaData === 'string') {
    try {
      // First, try to parse it directly
      const parsed = JSON.parse(socialMediaData);
      
      // Filter out numeric keys and empty values
      const filtered = {};
      Object.entries(parsed).forEach(([key, value]) => {
        // Skip numeric keys (like "0", "1") and empty values
        if (!isNaN(key) || !value || value.trim() === '') return;
        filtered[key] = value;
      });
      
      return filtered;
    } catch (error) {
      // If parsing fails, try to fix common issues
      console.warn('Initial JSON parse failed, attempting cleanup...');
      
      try {
        // Remove problematic entries like "0":"{" and "1":"}"
        let cleanedString = socialMediaData;
        
        // Use regex to remove the problematic key-value pairs
        cleanedString = cleanedString.replace(/"\d+":"\{"/g, '');
        cleanedString = cleanedString.replace(/"\d+":"\}"/g, '');
        cleanedString = cleanedString.replace(/,,/g, ',');
        cleanedString = cleanedString.replace(/,}/g, '}');
        cleanedString = cleanedString.replace(/{,/g, '{');
        
        // Try parsing again
        const parsed = JSON.parse(cleanedString);
        
        // Filter out any remaining numeric keys
        const filtered = {};
        Object.entries(parsed).forEach(([key, value]) => {
          if (!isNaN(key) || !value || value.trim() === '') return;
          filtered[key] = value;
        });
        
        return filtered;
      } catch (cleanupError) {
        console.error('Failed to parse social media JSON even after cleanup:', cleanupError);
        
        // Last resort: manually extract social media links
        const manualExtract = {};
        const platforms = ['facebook', 'twitter', 'instagram', 'youtube', 'linkedin', 'whatsapp'];
        
        platforms.forEach(platform => {
          // Look for pattern like "facebook":"https://..."
          const regex = new RegExp(`"${platform}":"([^"]+)"`);
          const match = socialMediaData.match(regex);
          if (match && match[1]) {
            manualExtract[platform] = match[1];
          }
        });
        
        return manualExtract;
      }
    }
  }
  
  return {};
};

export function Footer() {
  const { shopInfo } = useShopInfo();
  const [categories, setCategories] = useState([]);
  const [socialMediaLinks, setSocialMediaLinks] = useState({});

  // Parse and process social media links from shopInfo
  useEffect(() => {
    if (shopInfo) {
      const parsedLinks = parseSocialMediaData(shopInfo.socialMedia);
      setSocialMediaLinks(parsedLinks);
      
      // Debug in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Original socialMedia:', shopInfo.socialMedia);
        console.log('Parsed socialMedia:', parsedLinks);
        console.log('Type of socialMedia:', typeof shopInfo.socialMedia);
      }
    }
  }, [shopInfo]);

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

  // Check if we have social media links
  const hasSocialMedia = Object.keys(socialMediaLinks).length > 0;

  // Function to get icon for social media platform
  const getSocialMediaIcon = (platform) => {
    const normalizedPlatform = normalizePlatformName(platform);
    const Icon = SOCIAL_MEDIA_ICONS[normalizedPlatform] || Globe;
    
    // Return JSX element
    return Icon ? <Icon className="w-5 h-5" /> : <Globe className="w-5 h-5" />;
  };

  // Function to validate and format social media URL
  const formatSocialMediaUrl = (platform, url) => {
    if (!url || typeof url !== 'string') return '#';
    
    let cleanedUrl = url.trim();
    
    // Special handling for WhatsApp
    const lowerPlatform = platform.toLowerCase();
    if (lowerPlatform.includes('whatsapp') || 
        lowerPlatform.includes('wa') ||
        cleanedUrl.includes('wa.me') ||
        cleanedUrl.includes('whatsapp')) {
      
      const phoneMatch = cleanedUrl.match(/[\d\+]{10,}/);
      if (phoneMatch) {
        const phoneNumber = phoneMatch[0];
        const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
        return `https://wa.me/${formattedNumber}`;
      }
    }
    
    // Add https:// if not present
    if (!cleanedUrl.startsWith('http://') && 
        !cleanedUrl.startsWith('https://') &&
        !cleanedUrl.startsWith('mailto:') &&
        !cleanedUrl.startsWith('tel:')) {
      cleanedUrl = 'https://' + cleanedUrl;
    }
    
    return cleanedUrl;
  };

  // Parse other JSON fields that might be strings
  const parseJSONField = (field) => {
    if (!field) return {};
    if (typeof field === 'object') return field;
    if (typeof field === 'string') {
      try {
        // Check if it's a JSON string
        if (field.startsWith('{') || field.startsWith('[')) {
          return JSON.parse(field);
        }
      } catch {
        // If parsing fails, return empty object
      }
    }
    return {};
  };

  return (
    <footer className="mt-12 pb-16 md:pb-0">
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
                  if (!url || typeof url !== 'string' || !url.trim()) return null;
                  
                  const formattedUrl = formatSocialMediaUrl(platform, url);
                  
                  return (
                    <a
                      key={platform}
                      href={formattedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground transition-colors"
                      aria-label={`Follow us on ${platform}`}
                      title={`Follow us on ${platform}: ${url}`}
                    >
                      {getSocialMediaIcon(platform)}
                    </a>
                  );
                })}
              </div>
              
              {/* Follow us text */}
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
                  if (!url || typeof url !== 'string' || !url.trim()) return null;
                  
                  const formattedUrl = formatSocialMediaUrl(platform, url);
                  return (
                    <a
                      key={platform}
                      href={formattedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-foreground/40 hover:text-primary-foreground transition-colors"
                      aria-label={`${platform}`}
                      title={`${platform}: ${url}`}
                    >
                      {getSocialMediaIcon(platform)}
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