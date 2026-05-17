import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, User, Sparkles, PartyPopper, X, Gift, Check, ArrowRight, RefreshCw, Star, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";

// ─── Theme tokens ────────────────────────────────────────────────────────────
// Primary yellow : #e8c700
// Light yellow   : #fdf6b2
// Gray dark      : #1a1a1a  (text)
// Gray mid       : #6b7280  (muted)
// Gray light     : #f3f4f6  (surface)
// White          : #ffffff
// ─────────────────────────────────────────────────────────────────────────────

const Y = "#ffc107";   // honey yellow
const YL = "#fff9e6";   // soft butter
const YD = "#e6a800";   // dark honey

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper function to format date
const formatDate = (dateString, includeTime = true) => {
  const date = new Date(dateString);
  const options = { year: "numeric", month: "short", day: "numeric" };
  if (includeTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }
  return new Intl.DateTimeFormat("en-IN", options).format(date);
};

// Auth API functions
const authApi = {
  register: async (data) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },
  verifyOtp: async (phone, otp, purpose = "register") => {
    const response = await api.post("/auth/verify-otp", { phone, otp, purpose });
    return response.data;
  },
  login: async (data) => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },
  verifyLogin: async (phone, otp) => {
    const response = await api.post("/auth/verify-login", { phone, otp, purpose: "login" });
    return response.data;
  },
  resendOtp: async (phone, purpose = "login") => {
    const response = await api.post("/auth/resend-otp", { phone, purpose });
    return response.data;
  },
  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
  updateMe: async (data) => {
    const response = await api.put("/auth/me", data);
    return response.data;
  },
  logout: async () => {
    try {
      const response = await api.post("/auth/logout");
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      return response.data;
    } catch (error) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      return { success: true, message: "Logged out successfully", data: null };
    }
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

// ─── Burst particle ───────────────────────────────────────────────────────────
function BurstParticle({ angle, distance, delay, size, isSquare, color }) {
  const rad = (angle * Math.PI) / 180;
  const tx = Math.cos(rad) * distance;
  const ty = Math.sin(rad) * distance;
  return (
    <motion.div
      initial={{ opacity: 0, x: 0, y: 0, scale: 0, rotate: 0 }}
      animate={{ opacity: [0, 1, 1, 0], x: tx, y: ty, scale: [0, 1.3, 1, 0], rotate: rand(-200, 200) }}
      transition={{ duration: rand(0.9, 1.6), delay, ease: "easeOut" }}
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: isSquare ? 3 : "50%",
        background: color,
        pointerEvents: "none",
        top: "50%",
        left: "50%",
        marginTop: -size / 2,
        marginLeft: -size / 2,
      }}
    />
  );
}

// ─── Falling streamer ─────────────────────────────────────────────────────────
function Streamer({ delay, x }) {
  const colors = [Y, YD, "#fff", "#e5e7eb", YL, "#d1d5db"];
  const color = colors[Math.floor(rand(0, colors.length))];
  return (
    <motion.div
      initial={{ opacity: 0, y: "-8%", rotate: rand(-25, 25) }}
      animate={{ opacity: [0, 1, 1, 0], y: "108%", rotate: rand(-200, 200), x: [0, rand(-18, 18), rand(-18, 18)] }}
      transition={{ duration: rand(1.8, 3.0), delay, ease: "easeIn" }}
      style={{
        position: "absolute",
        left: `${x}%`,
        top: 0,
        width: rand(3, 7),
        height: rand(10, 24),
        borderRadius: 2,
        background: color,
        pointerEvents: "none",
      }}
    />
  );
}

// ─── Orbit ring ───────────────────────────────────────────────────────────────
function OrbitRing({ radius, speed, delay, dotColor }) {
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
        border: `1px dashed ${Y}44`,
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
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: dotColor,
            boxShadow: `0 0 8px ${dotColor}`,
          }}
        />
      </motion.div>
    </motion.div>
  );
}

// ─── Flip coupon card ─────────────────────────────────────────────────────────
function CouponCard() {
  const [flipped, setFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFlipped(true), 1600);
    return () => clearTimeout(t);
  }, []);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText("WELCOME10").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 1.05, duration: 0.55, ease: "backOut" }}
      style={{ perspective: 700 }}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.75, ease: "easeInOut" }}
        onClick={() => setFlipped((f) => !f)}
        style={{ transformStyle: "preserve-3d", position: "relative", width: 240, height: 76, cursor: "pointer" }}
      >
        {/* Front */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            borderRadius: 14,
            background: `linear-gradient(135deg, ${Y} 0%, ${YD} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            boxShadow: `0 10px 28px ${Y}66`,
          }}
        >
          <motion.div
            animate={{ rotate: [0, -15, 15, -8, 8, 0], scale: [1, 1.2, 1] }}
            transition={{ delay: 1.1, duration: 0.8 }}
          >
            <Gift style={{ width: 28, height: 28, color: "#1a1a1a" }} />
          </motion.div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, color: "#1a1a1a99" }}>
              Your reward
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1, color: "#1a1a1a" }}>
              10% OFF
            </div>
          </div>
          <span style={{ position: "absolute", right: 10, color: "#1a1a1a55", display: "flex", alignItems: "center" }}>
            <RefreshCw style={{ width: 12, height: 12 }} />
          </span>
        </div>

        {/* Back */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderRadius: 14,
            background: "#fff",
            border: `2px dashed ${Y}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 4,
            boxShadow: `0 10px 28px ${Y}33`,
          }}
        >
          <div style={{ fontSize: 9, letterSpacing: 2.5, textTransform: "uppercase", color: "#9ca3af" }}>
            Coupon Code
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 5, fontFamily: "monospace", color: "#1a1a1a" }}>
            WELCOME10
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            style={{
              marginTop: 2,
              padding: "3px 14px",
              borderRadius: 20,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.5,
              cursor: "pointer",
              background: copied ? "#d1fae5" : YL,
              color: copied ? "#065f46" : "#1a1a1a",
              border: `1px solid ${copied ? "#6ee7b7" : Y}`,
              transition: "all 0.2s",
            }}
          >
            {copied ? (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Check style={{ width: 12, height: 12 }} /> Copied!
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

// ─── Success screen ───────────────────────────────────────────────────────────
function WelcomeSuccessStep({ username, authMode, onClose }) {
  const particleColors = [Y, YD, YL, "#fff", "#e5e7eb", "#d1d5db"];

  const burstParticles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    angle: (360 / 40) * i + rand(-6, 6),
    distance: rand(55, 140),
    delay: rand(0, 0.4),
    size: rand(5, 14),
    isSquare: Math.random() > 0.6,
    color: particleColors[i % particleColors.length],
  }));

  const streamers = Array.from({ length: 26 }, (_, i) => ({
    id: i,
    delay: rand(0, 1.2),
    x: rand(4, 96),
  }));

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 440,
        overflow: "hidden",
        padding: "2.5rem 2rem",
        background: "#fff",
      }}
    >
      {/* Yellow radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(ellipse at 50% 20%, ${Y}28 0%, ${Y}0a 45%, transparent 70%)`,
        }}
      />

      {/* Streamers */}
      {streamers.map((s) => (
        <Streamer key={s.id} delay={s.delay} x={s.x} />
      ))}

      {/* Orbit rings */}
      <OrbitRing radius={82} speed={8} delay={0.3} dotColor={Y} />
      <OrbitRing radius={112} speed={13} delay={0.5} dotColor={YD} />
      <OrbitRing radius={144} speed={19} delay={0.7} dotColor="#d1d5db" />

      {/* Central icon + burst */}
      <div style={{ position: "relative", marginBottom: 28, zIndex: 2 }}>
        {burstParticles.map((p) => (
          <BurstParticle key={p.id} {...p} />
        ))}

        <motion.div
          initial={{ scale: 0, rotate: -35 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: "backOut" }}
          style={{
            width: 92,
            height: 92,
            borderRadius: "50%",
            background: YL,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 0 12px ${Y}22, 0 0 0 26px ${Y}0d`,
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
              <PartyPopper style={{ width: 42, height: 42, color: YD }} />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* "You're in" */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48, duration: 0.4 }}
        style={{
          color: YD,
          fontSize: 11,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          marginBottom: 8,
          position: "relative",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Star style={{ width: 12, height: 12, fill: Y, color: Y }} />
        You're in
        <Star style={{ width: 12, height: 12, fill: Y, color: Y }} />
      </motion.p>

      {/* Main heading */}
      <motion.h2
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.58, duration: 0.45 }}
        style={{
          fontSize: 30,
          fontWeight: 900,
          textAlign: "center",
          letterSpacing: -0.5,
          color: "#111827",
          position: "relative",
          zIndex: 10,
          marginBottom: 4,
          lineHeight: 1.2,
        }}
      >
        Welcome,{" "}
        <motion.span
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.72, type: "spring" }}
          style={{ color: YD }}
        >
          {username || "Friend"}
        </motion.span>{" "}
        <PartyPopper style={{ display: "inline", width: 26, height: 26, color: YD }} />
      </motion.h2>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.88, duration: 0.5 }}
        style={{
          color: "#6b7280",
          textAlign: "center",
          fontSize: 14,
          position: "relative",
          zIndex: 10,
          maxWidth: 240,
          lineHeight: 1.6,
          marginBottom: 24,
        }}
      >
        {authMode === "register"
          ? "You're now part of our community. Here's a little gift to get you started."
          : "You're now part of our community. Happy shopping!"}
      </motion.p>

      {/* Coupon (register only) */}
      {authMode === "register" && (
        <div style={{ position: "relative", zIndex: 10, marginBottom: 4 }}>
          <CouponCard />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.1 }}
            style={{ color: "#9ca3af", textAlign: "center", marginTop: 8, fontSize: 10, letterSpacing: 0.4 }}
          >
            Tap card to flip • Copy code at checkout
          </motion.p>
        </div>
      )}

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.15, duration: 0.5, ease: "backOut" }}
        style={{ position: "relative", zIndex: 10, marginTop: 24 }}
      >
        <motion.button
          whileHover={{ scale: 1.04, boxShadow: `0 12px 32px ${Y}88` }}
          whileTap={{ scale: 0.97 }}
          onClick={onClose}
          style={{
            padding: "0 40px",
            height: 50,
            fontSize: 15,
            fontWeight: 700,
            borderRadius: 999,
            background: `linear-gradient(135deg, ${Y} 0%, ${YD} 100%)`,
            color: "#1a1a1a",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: `0 6px 20px ${Y}55`,
            transition: "box-shadow 0.2s",
          }}
        >
          <ShoppingBag style={{ width: 18, height: 18 }} />
          Start Shopping
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

// ─── Shared input style helpers ───────────────────────────────────────────────
const inputStyle = {
  height: 48,
  paddingLeft: 40,
  background: "#f9fafb",
  border: "1.5px solid #e5e7eb",
  borderRadius: 10,
  fontSize: 15,
  color: "#111827",
  outline: "none",
  width: "100%",
  transition: "border-color 0.2s",
};

const focusStyle = { borderColor: Y, boxShadow: `0 0 0 3px ${Y}33` };

// ─── Primary button ───────────────────────────────────────────────────────────
function PrimaryButton({ onClick, disabled, children }) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02, boxShadow: `0 8px 24px ${Y}66` } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        height: 50,
        fontSize: 15,
        fontWeight: 700,
        borderRadius: 12,
        background: disabled
          ? "#e5e7eb"
          : `linear-gradient(135deg, ${Y} 0%, ${YD} 100%)`,
        color: disabled ? "#9ca3af" : "#1a1a1a",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        boxShadow: disabled ? "none" : `0 4px 14px ${Y}44`,
        transition: "background 0.2s, box-shadow 0.2s",
      }}
    >
      {children}
    </motion.button>
  );
}

// ─── Main dialog ──────────────────────────────────────────────────────────────
export function SignupDialog({ open, onOpenChange }) {
  const [step, setStep] = useState("info");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [authMode, setAuthMode] = useState("register");
  const [devOtp, setDevOtp] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  const navigate = useNavigate();

  const sendLoginOtp = async (phone) => {
    try {
      const response = await authApi.login({ phone });
      if (response.data?.otp) { setDevOtp(response.data.otp); return response.data.otp; }
      return response.success;
    } catch (error) { throw new Error(error.message || "Failed to send OTP"); }
  };

  const loginWithOtp = async (phone, otp) => {
    try {
      const response = await authApi.verifyLogin(phone, otp);
      if (response.success && response.data) {
        const { token, user } = response.data;
        localStorage.setItem("authToken", token);
        localStorage.setItem("user", JSON.stringify(user));
        window.dispatchEvent(new Event("authChanged"));
        return user;
      } else { throw new Error(response.message || "OTP verification failed"); }
    } catch (error) { throw new Error(error.message || "OTP verification failed"); }
  };

  useEffect(() => {
    if (!open) {
      setTimeout(() => { setStep("info"); setUsername(""); setPhone(""); setOtp(""); setError(""); }, 300);
    }
  }, [open]);

  const handleTryToClose = () => {
    if (step !== "success") {
      toast({ title: "Please sign up to continue", description: "Complete the signup to access exclusive deals!", variant: "destructive" });
    }
  };

  const handleGenerateOTP = async () => {
    if (authMode === "register" && !username.trim()) { setError("Please enter your name"); return; }
    if (!phone.trim() || phone.length < 10) { setError("Please enter a valid phone number"); return; }
    setError(""); setIsLoading(true);
    try {
      if (authMode === "register") {
        const response = await authApi.register({ name: username, phone });
        const otp = response?.data?.otp;
        toast({ title: response.message || "OTP sent successfully", description: otp ? `OTP: ${otp}` : undefined, variant: "default" });
        setDevOtp(otp || null); setStep("otp");
      } else {
        const returned = await sendLoginOtp(phone);
        toast({ title: "OTP sent successfully", variant: "default" });
        if (returned) setDevOtp(returned);
        setStep("otp");
      }
    } catch (err) {
      setDevOtp(null);
      const errorMessage = err.response?.data?.message || err?.message || "Failed to send OTP";
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) { setError("Please enter the complete OTP"); return; }
    setError(""); setIsLoading(true);
    try {
      if (authMode === "register") {
        const response = await authApi.verifyOtp(phone, otp);
        if (response.success && response.data) {
          const { token, user } = response.data;
          localStorage.setItem("authToken", token); localStorage.setItem("user", JSON.stringify(user));
          window.dispatchEvent(new Event("authChanged"));
          toast({ title: "Signed up successfully", variant: "default" });
          setStep("success");
        } else { throw new Error(response.message || "OTP verification failed"); }
      } else {
        const user = await loginWithOtp(phone, otp);
        toast({ title: "Signed in successfully", variant: "default" });
        setUsername(user.name || ""); setDevOtp(null); setStep("success");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err?.message || "OTP verification failed";
      const retryMsg = err?.retryAfter ? ` Try again after ${err.retryAfter} seconds.` : "";
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage + retryMsg, variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden"
        style={{
          background: "#fff",
          border: "none",
          boxShadow: "0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px #f3f4f6",
        }}
        onPointerDownOutside={(e) => { e.preventDefault(); handleTryToClose(); }}
        onEscapeKeyDown={(e) => { e.preventDefault(); handleTryToClose(); }}
      >
        {/* Yellow top accent bar */}
        <div style={{ height: 5, background: `linear-gradient(90deg, ${Y}, ${YD})`, borderRadius: "20px 20px 0 0" }} />

        {/* Close button */}
        {step !== "success" && (
          <button
            onClick={handleTryToClose}
            style={{
              position: "absolute",
              right: 16,
              top: 16,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#f3f4f6",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#e5e7eb")}
            onMouseLeave={e => (e.currentTarget.style.background = "#f3f4f6")}
          >
            <X style={{ width: 14, height: 14, color: "#6b7280" }} />
            <span className="sr-only">Close</span>
          </button>
        )}

        <AnimatePresence mode="wait">

          {/* ── INFO STEP ─────────────────────────────────────────────────── */}
          {step === "info" && (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              style={{ padding: "28px 28px 32px" }}
            >
              {/* Icon */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                <div
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: "50%",
                    background: YL,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 0 0 8px ${Y}22`,
                  }}
                >
                  <Sparkles style={{ width: 30, height: 30, color: YD }} />
                </div>
              </div>

              {/* Title */}
              <h2 style={{ fontSize: 24, fontWeight: 900, textAlign: "center", color: "#111827", marginBottom: 14 }}>
                {authMode === "register" ? "Join Our Community!" : "Welcome Back!"}
              </h2>

              {/* Mode toggle */}
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 12 }}>
                {["register", "login"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setAuthMode(mode)}
                    style={{
                      padding: "5px 18px",
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      border: "none",
                      background: authMode === mode ? Y : "#f3f4f6",
                      color: authMode === mode ? "#1a1a1a" : "#6b7280",
                      transition: "all 0.2s",
                      boxShadow: authMode === mode ? `0 2px 8px ${Y}66` : "none",
                    }}
                  >
                    {mode === "register" ? "Sign up" : "Sign in"}
                  </button>
                ))}
              </div>

              {/* Subtext */}
              <p style={{ color: "#6b7280", textAlign: "center", fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
                {authMode === "register"
                  ? "Get exclusive deals and updates on your favorite product"
                  : "Sign in with your phone number to continue"}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Name field */}
                {authMode === "register" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Your Name</label>
                    <div style={{ position: "relative" }}>
                      <User style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#9ca3af" }} />
                      <input
                        placeholder="Enter your name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onFocus={() => setFocusedField("name")}
                        onBlur={() => setFocusedField(null)}
                        style={{ ...inputStyle, ...(focusedField === "name" ? focusStyle : {}) }}
                      />
                    </div>
                  </div>
                )}

                {/* Phone field */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Phone Number</label>
                  <div style={{ position: "relative" }}>
                    <Phone style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#9ca3af" }} />
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      onFocus={() => setFocusedField("phone")}
                      onBlur={() => setFocusedField(null)}
                      style={{ ...inputStyle, ...(focusedField === "phone" ? focusStyle : {}) }}
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ color: "#ef4444", fontSize: 13, textAlign: "center" }}
                  >
                    {error}
                  </motion.p>
                )}

                {/* Submit */}
                <PrimaryButton onClick={handleGenerateOTP} disabled={isLoading}>
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      style={{ width: 20, height: 20, border: "2.5px solid #1a1a1a44", borderTopColor: "#1a1a1a", borderRadius: "50%" }}
                    />
                  ) : authMode === "register" ? "Generate OTP" : "Send OTP"}
                </PrimaryButton>

                <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center" }}>
                  {authMode === "register"
                    ? "By signing up, you agree to our Terms & Privacy Policy"
                    : "We will send a one-time password to your phone."}
                </p>

                {/* Toggle link */}
                <div style={{ textAlign: "center", fontSize: 13, color: "#6b7280" }}>
                  {authMode === "register" ? "Already have an account? " : "New here? "}
                  <button
                    onClick={() => { setAuthMode(authMode === "register" ? "login" : "register"); setDevOtp(null); }}
                    style={{ color: YD, fontWeight: 700, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                  >
                    {authMode === "register" ? "Sign in" : "Sign up"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── OTP STEP ───────────────────────────────────────────────────── */}
          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              style={{ padding: "28px 28px 32px" }}
            >
              {/* Icon */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                <div
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: "50%",
                    background: YL,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 0 0 8px ${Y}22`,
                  }}
                >
                  <Phone style={{ width: 30, height: 30, color: YD }} />
                </div>
              </div>

              <h2 style={{ fontSize: 24, fontWeight: 900, textAlign: "center", color: "#111827", marginBottom: 8 }}>
                Verify Your Number
              </h2>
              <p style={{ color: "#6b7280", textAlign: "center", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                Enter the 6-digit code sent to<br />
                <span style={{ fontWeight: 700, color: "#111827" }}>+91 {phone}</span>
              </p>

              {/* Dev OTP hint */}
              {devOtp && /^\d{6}$/.test(devOtp) && (
                <div style={{ marginBottom: 12, padding: "8px 14px", background: YL, borderRadius: 8, border: `1px solid ${Y}` }}>
                  <p style={{ fontSize: 13, color: "#1a1a1a" }}>
                    Dev OTP: <span style={{ fontFamily: "monospace", fontWeight: 700, color: YD }}>{devOtp}</span>
                  </p>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* OTP Input — styled slots */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          style={{ width: 46, height: 54, fontSize: 22, borderColor: "#e5e7eb", borderRadius: 10 }}
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ color: "#ef4444", fontSize: 13, textAlign: "center" }}
                  >
                    {error}
                  </motion.p>
                )}

                <PrimaryButton onClick={handleVerifyOTP} disabled={isLoading || otp.length !== 6}>
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      style={{ width: 20, height: 20, border: "2.5px solid #1a1a1a44", borderTopColor: "#1a1a1a", borderRadius: "50%" }}
                    />
                  ) : "Verify OTP"}
                </PrimaryButton>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13 }}>
                  <span style={{ color: "#6b7280" }}>Didn't receive code?</span>
                  <button
                    onClick={() => { setStep("info"); setDevOtp(null); }}
                    style={{ color: YD, fontWeight: 700, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── SUCCESS STEP ───────────────────────────────────────────────── */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <WelcomeSuccessStep username={username} authMode={authMode} onClose={() => onOpenChange(false)} />
            </motion.div>
          )}

        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}