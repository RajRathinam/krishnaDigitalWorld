import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Sparkles, Tag, ArrowRight, X, Check, Ticket } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

// ─── Shared animation helpers (same as SignupDialog) ──────────────────────────

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function BurstParticle({ angle, distance, delay, size, isSquare, colorClass }) {
  const rad = (angle * Math.PI) / 180;
  const tx = Math.cos(rad) * distance;
  const ty = Math.sin(rad) * distance;
  return (
    <motion.div
      initial={{ opacity: 0, x: 0, y: 0, scale: 0, rotate: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        x: tx,
        y: ty,
        scale: [0, 1.3, 1, 0],
        rotate: rand(-200, 200),
      }}
      transition={{ duration: rand(0.9, 1.6), delay, ease: "easeOut" }}
      className={colorClass}
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: isSquare ? 3 : "50%",
        pointerEvents: "none",
        top: "50%",
        left: "50%",
        marginTop: -size / 2,
        marginLeft: -size / 2,
      }}
    />
  );
}

function Streamer({ delay, x }) {
  const colorClasses = [
    "bg-primary",
    "bg-primary/60",
    "bg-primary/40",
    "bg-accent",
    "bg-accent/70",
    "bg-primary/20",
  ];
  const color = colorClasses[Math.floor(rand(0, colorClasses.length))];
  return (
    <motion.div
      initial={{ opacity: 0, y: "-8%", rotate: rand(-25, 25) }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: "108%",
        rotate: rand(-200, 200),
        x: [0, rand(-18, 18), rand(-18, 18)],
      }}
      transition={{ duration: rand(1.8, 3.0), delay, ease: "easeIn" }}
      className={color}
      style={{
        position: "absolute",
        left: `${x}%`,
        top: 0,
        width: rand(3, 7),
        height: rand(10, 24),
        borderRadius: 2,
        pointerEvents: "none",
      }}
    />
  );
}

function OrbitRing({ radius, speed, delay, dotClass }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.2 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.65, ease: "backOut" }}
      style={{
        position: "absolute",
        width: radius * 2,
        height: radius * 2,
        borderRadius: "50%",
        border: "1px dashed hsl(var(--primary) / 0.2)",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -60%)",
        pointerEvents: "none",
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: speed, ease: "linear" }}
        style={{ width: "100%", height: "100%", position: "relative" }}
      >
        <div
          className={dotClass}
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 8,
            height: 8,
            borderRadius: "50%",
            boxShadow: "0 0 8px currentColor",
          }}
        />
      </motion.div>
    </motion.div>
  );
}

// ─── Single coupon chip — flips on mount to reveal the code ───────────────────

function CouponChip({ coupon, index }) {
  const [flipped, setFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFlipped(true), 900 + index * 180);
    return () => clearTimeout(t);
  }, [index]);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(coupon.coupon?.code || "").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const discountLabel =
    coupon.coupon?.discountType === "percentage"
      ? `${coupon.coupon.discountValue}% OFF`
      : `₹${coupon.coupon?.discountValue} OFF`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.88 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.35 + index * 0.12, duration: 0.45, ease: "backOut" }}
      style={{ perspective: 700 }}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.65, ease: "easeInOut" }}
        onClick={() => setFlipped((f) => !f)}
        style={{
          transformStyle: "preserve-3d",
          position: "relative",
          height: 62,
          cursor: "pointer",
        }}
      >
        {/* Front — primary gradient */}
        <div
          className="bg-primary"
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            boxShadow: "0 8px 22px hsl(var(--primary) / 0.35)",
          }}
        >
          <motion.div
            animate={{ rotate: [0, -15, 15, -8, 8, 0], scale: [1, 1.2, 1] }}
            transition={{ delay: 0.9 + index * 0.18, duration: 0.75 }}
          >
            <Tag className="w-5 h-5 text-primary-foreground" />
          </motion.div>
          <div>
            <div
              className="text-primary-foreground/70"
              style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600 }}
            >
              New reward
            </div>
            <div
              className="text-primary-foreground"
              style={{ fontSize: 19, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1 }}
            >
              {discountLabel}
            </div>
          </div>
          <span className="text-primary-foreground/40 absolute right-3 text-xs">flip →</span>
        </div>

        {/* Back — card bg with code */}
        <div
          className="bg-card border border-primary/30"
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 3,
            boxShadow: "0 8px 22px hsl(var(--primary) / 0.12)",
          }}
        >
          <div
            className="text-muted-foreground"
            style={{ fontSize: 9, letterSpacing: 2.5, textTransform: "uppercase" }}
          >
            Coupon Code
          </div>
          <div
            className="text-primary"
            style={{ fontSize: 17, fontWeight: 900, letterSpacing: 4, fontFamily: "monospace" }}
          >
            {coupon.coupon?.code}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            className={`border border-primary/40 ${copied ? "text-green-500" : "text-primary"}`}
            style={{
              marginTop: 2,
              padding: "2px 10px",
              borderRadius: 20,
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: 0.5,
              cursor: "pointer",
              background: "transparent",
              transition: "color 0.2s",
            }}
          >
            {copied ? (
              <span className="flex items-center gap-1">
                <Check className="w-2.5 h-2.5" /> Copied!
              </span>
            ) : (
              "Copy code"
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main celebration content ─────────────────────────────────────────────────

function CouponCelebrationContent({ coupons, onViewAll, onClose }) {
  const particleColorClasses = [
    "bg-primary",
    "bg-primary/70",
    "bg-primary/40",
    "bg-accent",
    "bg-accent/60",
  ];

  const burstParticles = Array.from({ length: 32 }, (_, i) => ({
    id: i,
    angle: (360 / 32) * i + rand(-6, 6),
    distance: rand(50, 115),
    delay: rand(0, 0.35),
    size: rand(5, 12),
    isSquare: Math.random() > 0.6,
    colorClass: particleColorClasses[i % particleColorClasses.length],
  }));

  const streamers = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: rand(0, 1.1),
    x: rand(4, 96),
  }));

  const visibleCoupons = coupons.slice(0, 3);
  const extraCount = coupons.length - visibleCoupons.length;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[460px] overflow-hidden p-6">
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 20%, hsl(var(--primary) / 0.16) 0%, hsl(var(--primary) / 0.05) 45%, transparent 70%)",
        }}
      />

      {/* Streamers */}
      {streamers.map((s) => (
        <Streamer key={s.id} delay={s.delay} x={s.x} />
      ))}

      {/* Orbit rings */}
      <OrbitRing radius={76}  speed={8}  delay={0.25} dotClass="bg-primary" />
      <OrbitRing radius={104} speed={14} delay={0.45} dotClass="bg-primary/60" />
      <OrbitRing radius={132} speed={20} delay={0.65} dotClass="bg-accent" />

      {/* Central icon + burst */}
      <div style={{ position: "relative", marginBottom: 20, zIndex: 2 }}>
        {burstParticles.map((p) => (
          <BurstParticle key={p.id} {...p} />
        ))}

        <motion.div
          initial={{ scale: 0, rotate: -35 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: "backOut" }}
          className="bg-primary/10"
          style={{
            width: 84,
            height: 84,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow:
              "0 0 0 10px hsl(var(--primary) / 0.08), 0 0 0 22px hsl(var(--primary) / 0.04)",
            position: "relative",
            zIndex: 10,
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.35, type: "spring", stiffness: 220 }}
          >
            <motion.div
              animate={{ rotate: [0, -18, 18, -10, 10, 0], scale: [1, 1.15, 1] }}
              transition={{ delay: 0.75, duration: 0.9 }}
            >
              <Ticket className="w-10 h-10 text-primary" />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Badge */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.46, duration: 0.4 }}
        className="text-primary text-xs font-bold uppercase tracking-widest mb-1 relative z-10 flex items-center gap-2"
      >
        <Sparkles className="w-3 h-3 fill-primary/40" /> Great News <Sparkles className="w-3 h-3 fill-primary/40" />
      </motion.p>

      {/* Heading */}
      <motion.h2
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.56, duration: 0.45 }}
        className="text-2xl font-bold text-center relative z-10 mb-1"
        style={{ letterSpacing: -0.5 }}
      >
        You earned{" "}
        <motion.span
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, type: "spring" }}
          className="text-primary"
        >
          {coupons.length} coupon{coupons.length !== 1 ? "s" : ""}
        </motion.span>
        {"  "}
        <Gift className="inline w-6 h-6 text-primary" />
      </motion.h2>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.82, duration: 0.5 }}
        className="text-muted-foreground text-center text-sm relative z-10 max-w-[240px] leading-relaxed mb-5"
      >
        Tap any card to reveal the code and use it at checkout.
      </motion.p>

      {/* Coupon chips */}
      <div className="relative z-10 w-full max-w-xs space-y-2.5 mb-1">
        {visibleCoupons.map((coupon, index) => (
          <CouponChip key={coupon.id} coupon={coupon} index={index} />
        ))}

        {extraCount > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 + visibleCoupons.length * 0.12 }}
            className="text-muted-foreground text-center text-xs pt-1"
          >
            +{extraCount} more coupon{extraCount > 1 ? "s" : ""} waiting for you
          </motion.p>
        )}
      </div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.5, ease: "backOut" }}
        className="relative z-10 mt-5 flex gap-3 w-full max-w-xs"
      >
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1 h-11 border-border/50 text-muted-foreground hover:text-foreground"
        >
          Later
        </Button>
        <Button
          onClick={onViewAll}
          className="flex-1 h-11 text-sm font-semibold bg-primary hover:bg-primary/90 rounded-full"
        >
          <span className="flex items-center gap-2">
            View All
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              className="flex"
            >
              <ArrowRight className="w-4 h-4" />
            </motion.span>
          </span>
        </Button>
      </motion.div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const CouponNotificationPopup = () => {
  const [unnotifiedCoupons, setUnnotifiedCoupons] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) fetchUnnotifiedCoupons();
  }, [user]);

  const fetchUnnotifiedCoupons = async () => {
    try {
      setLoading(true);
      const response = await api.get("/coupons/unnotified");
      if (response.data.success && response.data.data.length > 0) {
        setUnnotifiedCoupons(response.data.data);
        setOpen(true);
      }
    } catch (error) {
      console.error("Error fetching unnotified coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAllNotified = async () => {
    for (const coupon of unnotifiedCoupons) {
      try {
        await api.put(`/coupons/${coupon.id}/notify`);
      } catch (err) {
        console.error("Error marking coupon as notified:", err);
      }
    }
    setUnnotifiedCoupons([]);
  };

  const handleViewAll = async () => {
    await markAllNotified();
    setOpen(false);
    navigate("/account/coupons");
  };

  const handleClose = async () => {
    await markAllNotified();
    setOpen(false);
  };

  if (loading || unnotifiedCoupons.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 border-primary/20"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Accessible title for screen readers */}
        <VisuallyHidden>
          <DialogTitle>New Coupons Available</DialogTitle>
        </VisuallyHidden>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <CouponCelebrationContent
          coupons={unnotifiedCoupons}
          onViewAll={handleViewAll}
          onClose={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CouponNotificationPopup;