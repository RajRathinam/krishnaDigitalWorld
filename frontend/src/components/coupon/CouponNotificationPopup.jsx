import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Sparkles, ArrowRight, X, Check, Ticket, Star } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

// ─── Honey Yellow Theme ───────────────────────────────────────────────────────
const Y  = "#ffc107"; // honey yellow
const YL = "#fff9e6"; // soft butter
const YD = "#e6a800"; // dark honey

function rand(min, max) { return Math.random() * (max - min) + min; }

// ─── Scratch Card ─────────────────────────────────────────────────────────────
function ScratchCard({ coupon, index }) {
  const canvasRef = useRef(null);
  const [scratched, setScratched] = useState(false);
  const [copied, setCopied] = useState(false);
  const isDrawing = useRef(false);

  const discountLabel =
    coupon.coupon?.discountType === "percentage"
      ? `${coupon.coupon.discountValue}% OFF`
      : `₹${coupon.coupon?.discountValue} OFF`;

  // Init canvas — honey-gold scratch surface
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    // Gold gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0,    "#f5d060");
    grad.addColorStop(0.25, "#e6a800");
    grad.addColorStop(0.55, "#ffd54f");
    grad.addColorStop(0.8,  "#e6a800");
    grad.addColorStop(1,    "#f5d060");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Subtle coin-line texture
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    for (let i = 0; i < W; i += 7) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke();
    }
    for (let j = 0; j < H; j += 7) {
      ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(W, j); ctx.stroke();
    }

    // Shine diagonal
    const shine = ctx.createLinearGradient(0, 0, W * 0.6, H * 0.6);
    shine.addColorStop(0, "rgba(255,255,255,0.28)");
    shine.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = shine;
    ctx.fillRect(0, 0, W, H);

    // Label
    ctx.fillStyle = "rgba(120,80,0,0.75)";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.fillText("✦  SCRATCH HERE  ✦", W / 2, H / 2 + 5);
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const scratch = (e) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getPos(e, canvas);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fill();
    checkPercent(ctx, canvas);
  };

  const checkPercent = (ctx, canvas) => {
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let cleared = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] === 0) cleared++;
    const pct = (cleared / (canvas.width * canvas.height)) * 100;
    if (pct > 42) setScratched(true);
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(coupon.coupon?.code || "").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.88 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.3 + index * 0.15, duration: 0.5, ease: "backOut" }}
      style={{
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: `0 6px 24px ${Y}55, 0 0 0 2px ${Y}`,
        position: "relative",
        userSelect: "none",
      }}
    >
      {/* ── Revealed layer ── */}
      <div
        style={{
          background: `linear-gradient(135deg, ${Y} 0%, ${YD} 100%)`,
          minHeight: 88,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          gap: 12,
        }}
      >
        {/* Left — discount */}
        <div>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 2,
            textTransform: "uppercase", color: "#7a5200cc", marginBottom: 2,
          }}>
            Your Reward
          </div>
          <div style={{
            fontSize: 30, fontWeight: 900, color: "#1a1a1a",
            letterSpacing: -1, lineHeight: 1,
          }}>
            {discountLabel}
          </div>
        </div>

        {/* Right — code + copy */}
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontSize: 9, letterSpacing: 2, textTransform: "uppercase",
            color: "#7a520099", marginBottom: 5,
          }}>
            Code
          </div>
          <div style={{
            fontFamily: "monospace", fontSize: 14, fontWeight: 900,
            letterSpacing: 3, color: "#1a1a1a",
            background: "rgba(255,255,255,0.45)",
            borderRadius: 8, padding: "4px 10px",
            border: "1.5px dashed #7a520066",
          }}>
            {coupon.coupon?.code}
          </div>
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleCopy}
            style={{
              marginTop: 6, padding: "3px 12px", borderRadius: 20,
              fontSize: 10, fontWeight: 700, cursor: "pointer",
              border: "1.5px solid #7a520055",
              background: copied ? "rgba(255,255,255,0.5)" : "transparent",
              color: copied ? "#1a6600" : "#1a1a1a",
              display: "flex", alignItems: "center", gap: 4,
              marginLeft: "auto", transition: "all 0.2s",
            }}
          >
            {copied
              ? <><Check style={{ width: 10, height: 10 }} /> Copied!</>
              : "Copy code"}
          </motion.button>
        </div>
      </div>

      {/* ── Gold scratch canvas ── */}
      <AnimatePresence>
        {!scratched && (
          <motion.canvas
            ref={canvasRef}
            width={560}
            height={176}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            onMouseDown={(e) => { isDrawing.current = true; scratch(e); }}
            onMouseMove={scratch}
            onMouseUp={() => { isDrawing.current = false; }}
            onMouseLeave={() => { isDrawing.current = false; }}
            onTouchStart={(e) => { e.preventDefault(); isDrawing.current = true; scratch(e); }}
            onTouchMove={(e) => { e.preventDefault(); scratch(e); }}
            onTouchEnd={() => { isDrawing.current = false; }}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              cursor: "crosshair", borderRadius: 14,
              touchAction: "none",
            }}
          />
        )}
      </AnimatePresence>

      {/* ── White reveal flash ── */}
      <AnimatePresence>
        {scratched && (
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.55 }}
            style={{
              position: "absolute", inset: 0,
              background: "#fff", borderRadius: 14, pointerEvents: "none",
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Burst particles ──────────────────────────────────────────────────────────
function BurstParticle({ angle, distance, delay, size, isSquare, color }) {
  const rad = (angle * Math.PI) / 180;
  return (
    <motion.div
      initial={{ opacity: 0, x: 0, y: 0, scale: 0, rotate: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        x: Math.cos(rad) * distance,
        y: Math.sin(rad) * distance,
        scale: [0, 1.3, 1, 0],
        rotate: rand(-200, 200),
      }}
      transition={{ duration: rand(0.9, 1.6), delay, ease: "easeOut" }}
      style={{
        position: "absolute", width: size, height: size,
        borderRadius: isSquare ? 3 : "50%",
        background: color, pointerEvents: "none",
        top: "50%", left: "50%",
        marginTop: -size / 2, marginLeft: -size / 2,
      }}
    />
  );
}

function Streamer({ delay, x }) {
  const colors = [Y, YD, "#fff", "#e5e7eb", YL, "#d1d5db", "#ffd54f"];
  return (
    <motion.div
      initial={{ opacity: 0, y: "-8%", rotate: rand(-25, 25) }}
      animate={{
        opacity: [0, 1, 1, 0], y: "108%",
        rotate: rand(-200, 200),
        x: [0, rand(-18, 18), rand(-18, 18)],
      }}
      transition={{ duration: rand(1.8, 3.0), delay, ease: "easeIn" }}
      style={{
        position: "absolute", left: `${x}%`, top: 0,
        width: rand(3, 7), height: rand(10, 24), borderRadius: 2,
        background: colors[Math.floor(rand(0, colors.length))], pointerEvents: "none",
      }}
    />
  );
}

function OrbitRing({ radius, speed, delay, dotColor }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.2 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.65, ease: "backOut" }}
      style={{
        position: "absolute", width: radius * 2, height: radius * 2,
        borderRadius: "50%", border: `1px dashed ${Y}44`,
        top: "50%", left: "50%", transform: "translate(-50%, -58%)",
        pointerEvents: "none",
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: speed, ease: "linear" }}
        style={{ width: "100%", height: "100%", position: "relative" }}
      >
        <div style={{
          position: "absolute", top: 0, left: "50%",
          transform: "translate(-50%, -50%)",
          width: 8, height: 8, borderRadius: "50%",
          background: dotColor, boxShadow: `0 0 8px ${dotColor}`,
        }} />
      </motion.div>
    </motion.div>
  );
}

// ─── Main celebration content ─────────────────────────────────────────────────
function CouponCelebrationContent({ coupons, onViewAll, onClose }) {
  const burstColors = [Y, YD, YL, "#fff", "#e5e7eb", "#ffd54f", "#ffe082"];
  const burstParticles = Array.from({ length: 38 }, (_, i) => ({
    id: i,
    angle: (360 / 38) * i + rand(-6, 6),
    distance: rand(52, 125),
    delay: rand(0, 0.38),
    size: rand(5, 13),
    isSquare: Math.random() > 0.55,
    color: burstColors[i % burstColors.length],
  }));
  const streamers = Array.from({ length: 24 }, (_, i) => ({
    id: i, delay: rand(0, 1.2), x: rand(4, 96),
  }));
  const visibleCoupons = coupons.slice(0, 3);
  const extraCount = coupons.length - visibleCoupons.length;

  return (
    <div style={{
      position: "relative", display: "flex", flexDirection: "column",
      alignItems: "center", minHeight: 500, overflow: "hidden",
      padding: "28px 24px 32px",
      background: `linear-gradient(160deg, #fff 0%, #fffdf5 55%, ${YL} 100%)`,
    }}>

      {/* Yellow top accent bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 5,
        background: `linear-gradient(90deg, ${Y}, ${YD}, ${Y})`,
        borderRadius: "20px 20px 0 0",
      }} />

      {/* Radial glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse at 50% 18%, ${Y}28 0%, ${Y}0a 45%, transparent 70%)`,
      }} />

      {/* Streamers */}
      {streamers.map((s) => <Streamer key={s.id} delay={s.delay} x={s.x} />)}

      {/* Orbit rings */}
      <OrbitRing radius={78}  speed={8}  delay={0.28} dotColor={Y} />
      <OrbitRing radius={108} speed={13} delay={0.46} dotColor={YD} />
      <OrbitRing radius={138} speed={20} delay={0.64} dotColor="#d1d5db" />

      {/* Central icon + burst */}
      <div style={{ position: "relative", marginBottom: 18, zIndex: 2 }}>
        {burstParticles.map((p) => <BurstParticle key={p.id} {...p} />)}

        <motion.div
          initial={{ scale: 0, rotate: -35 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: "backOut" }}
          style={{
            width: 84, height: 84, borderRadius: "50%",
            background: YL,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 0 12px ${Y}22, 0 0 0 26px ${Y}0d`,
            position: "relative", zIndex: 10,
          }}
        >
          <motion.div
            animate={{ rotate: [0, -18, 18, -10, 10, 0], scale: [1, 1.15, 1] }}
            transition={{ delay: 0.75, duration: 0.9 }}
          >
            <Ticket style={{ width: 40, height: 40, color: YD }} />
          </motion.div>
        </motion.div>
      </div>

      {/* Badge */}
      <motion.p
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.46, duration: 0.4 }}
        style={{
          color: YD, fontSize: 11, fontWeight: 800,
          textTransform: "uppercase", letterSpacing: "0.2em",
          marginBottom: 6, position: "relative", zIndex: 10,
          display: "flex", alignItems: "center", gap: 8,
        }}
      >
        <Star style={{ width: 12, height: 12, fill: Y, color: Y }} />
        Great News
        <Star style={{ width: 12, height: 12, fill: Y, color: Y }} />
      </motion.p>

      {/* Heading */}
      <motion.h2
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.56, duration: 0.45 }}
        style={{
          fontSize: 26, fontWeight: 900, textAlign: "center",
          color: "#111827", letterSpacing: -0.5,
          position: "relative", zIndex: 10, marginBottom: 6, lineHeight: 1.2,
        }}
      >
        You earned{" "}
        <motion.span
          initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, type: "spring" }}
          style={{ color: YD }}
        >
          {coupons.length} coupon{coupons.length !== 1 ? "s" : ""}
        </motion.span>{" "}
        <Gift style={{ display: "inline", width: 24, height: 24, color: Y }} />
      </motion.h2>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.82, duration: 0.5 }}
        style={{
          color: "#6b7280", textAlign: "center", fontSize: 13,
          position: "relative", zIndex: 10,
          maxWidth: 230, lineHeight: 1.6, marginBottom: 20,
        }}
      >
        Scratch each card to reveal your discount code!
      </motion.p>

      {/* Scratch cards */}
      <div style={{
        position: "relative", zIndex: 10,
        width: "100%", maxWidth: 340,
        display: "flex", flexDirection: "column", gap: 12, marginBottom: 4,
      }}>
        {visibleCoupons.map((coupon, index) => (
          <ScratchCard key={coupon.id} coupon={coupon} index={index} />
        ))}
        {extraCount > 0 && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.55 + visibleCoupons.length * 0.12 }}
            style={{ color: "#9ca3af", textAlign: "center", fontSize: 12, paddingTop: 4 }}
          >
            +{extraCount} more coupon{extraCount > 1 ? "s" : ""} waiting for you
          </motion.p>
        )}
      </div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.05, duration: 0.5, ease: "backOut" }}
        style={{
          position: "relative", zIndex: 10, marginTop: 20,
          display: "flex", gap: 10, width: "100%", maxWidth: 340,
        }}
      >
        {/* Later */}
        <button
          onClick={onClose}
          style={{
            flex: 1, height: 46, borderRadius: 12,
            border: "1.5px solid #e5e7eb",
            background: "#fff", color: "#6b7280",
            fontSize: 14, fontWeight: 600, cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "#f9fafb";
            e.currentTarget.style.borderColor = Y;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.borderColor = "#e5e7eb";
          }}
        >
          Later
        </button>

        {/* View All */}
        <motion.button
          whileHover={{ scale: 1.03, boxShadow: `0 10px 28px ${Y}88` }}
          whileTap={{ scale: 0.97 }}
          onClick={onViewAll}
          style={{
            flex: 1, height: 46, borderRadius: 12, border: "none",
            background: `linear-gradient(135deg, ${Y} 0%, ${YD} 100%)`,
            color: "#1a1a1a", fontSize: 14, fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            boxShadow: `0 4px 14px ${Y}55`,
          }}
        >
          View All
          <motion.span
            animate={{ x: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            style={{ display: "flex" }}
          >
            <ArrowRight style={{ width: 16, height: 16 }} />
          </motion.span>
        </motion.button>
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

  useEffect(() => { if (user) fetchUnnotifiedCoupons(); }, [user]);

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
    } finally { setLoading(false); }
  };

  const markAllNotified = async () => {
    for (const coupon of unnotifiedCoupons) {
      try { await api.put(`/coupons/${coupon.id}/notify`); }
      catch (err) { console.error("Error marking coupon as notified:", err); }
    }
    setUnnotifiedCoupons([]);
  };

  const handleViewAll = async () => { await markAllNotified(); setOpen(false); navigate("/account/coupons"); };
  const handleClose  = async () => { await markAllNotified(); setOpen(false); };

  if (loading || unnotifiedCoupons.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden"
        style={{
          border: `1.5px solid ${Y}55`,
          boxShadow: `0 32px 80px rgba(0,0,0,0.14), 0 0 0 1px ${YL}`,
        }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <VisuallyHidden><DialogTitle>New Coupons Available</DialogTitle></VisuallyHidden>


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