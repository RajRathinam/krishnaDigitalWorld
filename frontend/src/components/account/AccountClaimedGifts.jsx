import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, X, Store, ShoppingBag, ChevronRight } from "lucide-react";
import { giftApi } from "@/services/api";
import { getImageUrl } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

// ─────────────────────────────────────────────────────────────────────────────
// Gift Popup — shown when a claimed gift is clicked
// ─────────────────────────────────────────────────────────────────────────────
function GiftDetailPopup({ item, onClose }) {
  const gift = item.gift;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          className="bg-card border border-pink-200 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-8 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-purple-100 opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-orange-100 opacity-50 translate-y-1/2 -translate-x-1/3 pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <h2 className="text-xl font-black text-pink-600 mb-6 tracking-wide relative z-10">
            🎉 YOU WON THIS GIFT!
          </h2>

          <div className="relative mx-auto w-32 h-32 mb-4 z-10">
            {gift?.image ? (
              <img
                src={getImageUrl(gift.image)}
                alt={gift.productName}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full bg-pink-50 rounded-full flex items-center justify-center border-4 border-pink-100">
                <Gift className="w-16 h-16 text-pink-400" />
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-lg border-2 border-white flex items-center gap-1">
              <Gift className="w-3 h-3" /> FREE
            </div>
          </div>

          <h3 className="text-2xl font-black text-gray-900 mb-2 relative z-10">
            {gift?.productName || "Surprise Gift"}
          </h3>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-6 relative z-10">
            {item.source === "online" ? (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Won with order {item.orderNumber || `#${item.orderId}`}</span>
              </>
            ) : (
              <>
                <Store className="w-3.5 h-3.5" />
                <span>Bill No. {item.billNumber || "N/A"}</span>
              </>
            )}
          </div>

          <p className="text-gray-600 text-sm mb-6 relative z-10 font-medium">
            {item.source === "online"
              ? "This gift will be delivered along with your order."
              : "Show this screen to the shopkeeper to claim your gift!"}
          </p>

          <button
            onClick={onClose}
            className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-lg relative z-10"
          >
            Awesome!
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Claimed Gifts List
// ─────────────────────────────────────────────────────────────────────────────
export default function AccountClaimedGifts() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await giftApi.getMyClaimedGifts();
        setClaims(res.success ? res.data || [] : []);
      } catch (err) {
        toast({
          title: "Error",
          description: err?.message || "Failed to load your claimed gifts",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border p-8 text-center text-muted-foreground">
        Loading your claimed gifts...
      </div>
    );
  }

  if (!claims.length) {
    return (
      <div className="bg-card rounded-lg border border-border p-10 text-center">
        <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-semibold text-foreground mb-1">No gifts won yet</h3>
        <p className="text-sm text-muted-foreground">
          Gifts you win from online orders or scanning the in-store QR code will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Claimed Gifts</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {claims.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelected(item)}
            className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 text-left hover:shadow-md hover:border-accent/40 transition-all"
          >
            <div className="w-14 h-14 rounded-lg bg-pink-50 border border-pink-100 flex items-center justify-center shrink-0 overflow-hidden">
              {item.gift?.image ? (
                <img
                  src={getImageUrl(item.gift.image)}
                  alt={item.gift.productName}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Gift className="w-6 h-6 text-pink-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">
                {item.gift?.productName || "Surprise Gift"}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                {item.source === "online" ? (
                  <ShoppingBag className="w-3 h-3" />
                ) : (
                  <Store className="w-3 h-3" />
                )}
                {item.source === "online" ? "Online order" : "In-store scan"}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>

      {selected && (
        <GiftDetailPopup item={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
