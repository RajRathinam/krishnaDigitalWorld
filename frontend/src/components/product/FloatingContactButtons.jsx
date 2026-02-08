import { Phone, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useShopInfo } from "@/contexts/ShopInfoContext";

const FloatingContactButtons = () => {
  const { shopInfo } = useShopInfo();
  
  // Get phone numbers from shopInfo with fallbacks
  const whatsappNumber = shopInfo?.whatsappNumber || shopInfo?.phone;
  const phoneNumber = shopInfo?.phone || shopInfo?.supportPhone;

  // Format phone number for WhatsApp link
  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return '';
    
    // Remove all non-numeric characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Ensure it starts with country code if not already
    if (cleaned.startsWith('+')) {
      return cleaned;
    } else if (cleaned.startsWith('0')) {
      return '+91' + cleaned.substring(1); // Assuming India (+91) for numbers starting with 0
    } else if (cleaned.length === 10) {
      return '+91' + cleaned; // Assuming India (+91) for 10-digit numbers
    }
    return '+' + cleaned;
  };

  // Don't render if no phone numbers are available
  if (!whatsappNumber && !phoneNumber) {
    return null;
  }

  const whatsappUrl = whatsappNumber ? `https://wa.me/${formatPhoneForWhatsApp(whatsappNumber)}` : null;
  const telUrl = phoneNumber ? `tel:${phoneNumber}` : null;

  return (
    <div className="fixed bottom-24 right-4 md:hidden z-[100] flex flex-col gap-3">
      {/* WhatsApp Button - only show if WhatsApp number exists */}
      {whatsappUrl && (
        <motion.a 
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-600 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="w-6 h-6" />
        </motion.a>
      )}

      {/* Phone Button - only show if phone number exists */}
      {telUrl && (
        <motion.a 
          href={telUrl}
          className="w-12 h-12 bg-accent text-accent-foreground rounded-full shadow-lg flex items-center justify-center hover:opacity-90 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          aria-label="Call us"
        >
          <Phone className="w-6 h-6" />
        </motion.a>
      )}
    </div>
  );
};

export { FloatingContactButtons };