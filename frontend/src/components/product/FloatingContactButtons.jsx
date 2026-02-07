import { Phone, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
const FloatingContactButtons = () => {
  return (<div className="fixed bottom-24 right-4 md:hidden z-[100] flex flex-col gap-3">
    <motion.a href="https://wa.me/918903902341" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-600 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} aria-label="Chat on WhatsApp">
      <MessageCircle className="w-6 h-6" />
    </motion.a>

    <motion.a href="tel:+919876543210" className="w-12 h-12 bg-accent text-accent-foreground rounded-full shadow-lg flex items-center justify-center hover:opacity-90 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} aria-label="Call us">
      <Phone className="w-6 h-6" />
    </motion.a>
  </div>);
};
export { FloatingContactButtons };
