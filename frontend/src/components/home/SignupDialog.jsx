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

// ─────────────────────────────────────────────────────────────────────────────
// Welcome Animation — all colors use CSS vars (bg-primary, text-primary, etc.)
// so they automatically match your site theme.
// ─────────────────────────────────────────────────────────────────────────────

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

// A single burst particle (dot or square) that flies out from the centre
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

// Vertical falling streamer ribbon
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

// Spinning orbit ring with a glowing dot
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

// Flipping coupon card — front uses bg-primary, back uses bg-card
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
        style={{
          transformStyle: "preserve-3d",
          position: "relative",
          width: 230,
          height: 72,
          cursor: "pointer",
        }}
      >
        {/* Front — primary colour */}
        <div
          className="bg-primary"
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            boxShadow: "0 10px 28px hsl(var(--primary) / 0.4)",
          }}
        >
          <motion.div
            animate={{ rotate: [0, -15, 15, -8, 8, 0], scale: [1, 1.2, 1] }}
            transition={{ delay: 1.1, duration: 0.8 }}
          >
            <Gift className="w-7 h-7 text-primary-foreground" />
          </motion.div>
          <div>
            <div
              className="text-primary-foreground/70"
              style={{
                fontSize: 10,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Your reward
            </div>
            <div
              className="text-primary-foreground"
              style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1 }}
            >
              10% OFF
            </div>
          </div>
          <span
            className="text-primary-foreground/50 absolute right-3 flex items-center"
          >
            <RefreshCw className="w-3 h-3" />
          </span>
        </div>

        {/* Back — card background with primary accents */}
        <div
          className="bg-card border border-primary/30"
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 4,
            boxShadow: "0 10px 28px hsl(var(--primary) / 0.15)",
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
            style={{ fontSize: 20, fontWeight: 900, letterSpacing: 5, fontFamily: "monospace" }}
          >
            WELCOME10
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            className={`border border-primary/40 ${
              copied ? "text-green-500" : "text-primary"
            }`}
            style={{
              marginTop: 2,
              padding: "2px 12px",
              borderRadius: 20,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 0.5,
              cursor: "pointer",
              background: "transparent",
              transition: "color 0.2s",
            }}
          >
            {copied ? (
              <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Copied!</span>
            ) : (
              "Copy code"
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// The complete success screen
function WelcomeSuccessStep({ username, authMode, onClose }) {
  const particleColorClasses = [
    "bg-primary",
    "bg-primary/70",
    "bg-primary/40",
    "bg-accent",
    "bg-accent/60",
  ];

  const burstParticles = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    angle: (360 / 36) * i + rand(-6, 6),
    distance: rand(55, 130),
    delay: rand(0, 0.4),
    size: rand(5, 13),
    isSquare: Math.random() > 0.6,
    colorClass: particleColorClasses[i % particleColorClasses.length],
  }));

  const streamers = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    delay: rand(0, 1.2),
    x: rand(4, 96),
  }));

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[420px] overflow-hidden p-8">
      {/* Soft radial bg glow using primary */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 22%, hsl(var(--primary) / 0.16) 0%, hsl(var(--primary) / 0.05) 45%, transparent 70%)",
        }}
      />

      {/* Falling streamers */}
      {streamers.map((s) => (
        <Streamer key={s.id} delay={s.delay} x={s.x} />
      ))}

      {/* Orbit rings */}
      <OrbitRing radius={80}  speed={8}  delay={0.3} dotClass="bg-primary" />
      <OrbitRing radius={108} speed={13} delay={0.5} dotClass="bg-primary/60" />
      <OrbitRing radius={138} speed={19} delay={0.7} dotClass="bg-accent" />

      {/* Central icon + burst particles */}
      <div style={{ position: "relative", marginBottom: 28, zIndex: 2 }}>
        {burstParticles.map((p) => (
          <BurstParticle key={p.id} {...p} />
        ))}

        <motion.div
          initial={{ scale: 0, rotate: -35 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: "backOut" }}
          className="bg-primary/10"
          style={{
            width: 88,
            height: 88,
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
              <PartyPopper className="w-10 h-10 text-primary" />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* "You're in" label */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48, duration: 0.4 }}
        className="text-primary text-xs font-bold uppercase tracking-widest mb-2 relative z-10 flex items-center gap-2"
      >
        <Star className="w-3 h-3 fill-primary" /> You're in <Star className="w-3 h-3 fill-primary" />
      </motion.p>

      {/* Main heading */}
      <motion.h2
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.58, duration: 0.45 }}
        className="text-3xl font-bold text-center relative z-10 mb-1"
        style={{ letterSpacing: -0.5 }}
      >
        Welcome,{" "}
        <motion.span
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.72, type: "spring" }}
          className="text-primary"
        >
          {username || "Friend"}
        </motion.span>{" "}
        <PartyPopper className="inline w-7 h-7 text-primary" />
      </motion.h2>

      {/* Subtext — different message per mode */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.88, duration: 0.5 }}
        className="text-muted-foreground text-center text-sm relative z-10 max-w-[240px] leading-relaxed mb-6"
      >
        {authMode === "register"
          ? "You're now part of our community. Here's a little gift to get you started."
          : "You're now part of our community. Happy shopping!"}
      </motion.p>

      {/* 3D flip coupon — signup only */}
      {authMode === "register" && (
        <div className="relative z-10 mb-1">
          <CouponCard />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.1 }}
            className="text-muted-foreground text-center mt-2"
            style={{ fontSize: 10, letterSpacing: 0.4 }}
          >
            Tap card to flip • Copy code at checkout
          </motion.p>
        </div>
      )}

      {/* CTA — same Button component + classes as the rest of the dialog */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.15, duration: 0.5, ease: "backOut" }}
        className="relative z-10 mt-6"
      >
        <Button
          onClick={onClose}
          className="px-10 h-12 text-base font-semibold bg-primary hover:bg-primary/90 rounded-full"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Start Shopping
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

// ─────────────────────────────────────────────────────────────────────────────
// SignupDialog — info & otp steps are exactly the original code
// ─────────────────────────────────────────────────────────────────────────────

export function SignupDialog({ open, onOpenChange }) {
  const [step, setStep] = useState("info");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [authMode, setAuthMode] = useState("register");
  const [devOtp, setDevOtp] = useState(null);

  const navigate = useNavigate();

  const sendLoginOtp = async (phone) => {
    try {
      const response = await authApi.login({ phone });
      if (response.data?.otp) {
        setDevOtp(response.data.otp);
        return response.data.otp;
      }
      return response.success;
    } catch (error) {
      throw new Error(error.message || "Failed to send OTP");
    }
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
      } else {
        throw new Error(response.message || "OTP verification failed");
      }
    } catch (error) {
      throw new Error(error.message || "OTP verification failed");
    }
  };

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("info");
        setUsername("");
        setPhone("");
        setOtp("");
        setError("");
      }, 300);
    }
  }, [open]);

  const handleTryToClose = () => {
    if (step !== "success") {
      toast({
        title: "Please sign up to continue",
        description: "Complete the signup to access exclusive deals!",
        variant: "destructive",
      });
    }
  };

  const handleGenerateOTP = async () => {
    if (authMode === "register" && !username.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      if (authMode === "register") {
        const response = await authApi.register({ name: username, phone });
        const otp = response?.data?.otp;
        toast({
          title: response.message || "OTP sent successfully",
          description: otp ? `OTP: ${otp}` : undefined,
          variant: "default",
        });
        setDevOtp(otp || null);
        setStep("otp");
      } else {
        const returned = await sendLoginOtp(phone);
        toast({ title: "OTP sent successfully", variant: "default" });
        if (returned) setDevOtp(returned);
        setStep("otp");
      }
    } catch (err) {
      setDevOtp(null);
      const errorMessage =
        err.response?.data?.message || err?.message || "Failed to send OTP";
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError("Please enter the complete OTP");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      if (authMode === "register") {
        const response = await authApi.verifyOtp(phone, otp);
        if (response.success && response.data) {
          const { token, user } = response.data;
          localStorage.setItem("authToken", token);
          localStorage.setItem("user", JSON.stringify(user));
          window.dispatchEvent(new Event("authChanged"));
          toast({ title: "Signed up successfully", variant: "default" });
          setStep("success");
        } else {
          throw new Error(response.message || "OTP verification failed");
        }
      } else {
        const user = await loginWithOtp(phone, otp);
        toast({ title: "Signed in successfully", variant: "default" });
        setUsername(user.name || "");
        setDevOtp(null);
        setStep("success");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err?.message || "OTP verification failed";
      const retryMsg = err?.retryAfter
        ? ` Try again after ${err.retryAfter} seconds.`
        : "";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage + retryMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 border-primary/20"
        onPointerDownOutside={(e) => {
          e.preventDefault();
          handleTryToClose();
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          handleTryToClose();
        }}
      >
        {/* Close button that shows toast */}
        {step !== "success" && (
          <button
            onClick={handleTryToClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}

        <AnimatePresence mode="wait">
          {/* ── INFO STEP (unchanged from original) ───────────────────────── */}
          {step === "info" && (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="p-6"
            >
              <DialogHeader className="mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <DialogTitle className="text-2xl font-bold text-center">
                  {authMode === "register" ? "Join Our Community!" : "Welcome back!"}
                </DialogTitle>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <button
                    onClick={() => setAuthMode("register")}
                    className={`px-3 py-1 rounded-full text-sm ${
                      authMode === "register"
                        ? "bg-accent text-primary"
                        : "bg-card text-foreground"
                    }`}
                  >
                    Sign up
                  </button>
                  <button
                    onClick={() => setAuthMode("login")}
                    className={`px-3 py-1 rounded-full text-sm ${
                      authMode === "login"
                        ? "bg-accent text-primary"
                        : "bg-card text-foreground"
                    }`}
                  >
                    Sign in
                  </button>
                </div>
                <p className="text-muted-foreground text-center mt-2">
                  {authMode === "register"
                    ? "Get exclusive deals and updates on your favorite hardware"
                    : "Sign in with your phone number to continue"}
                </p>
              </DialogHeader>

              <div className="space-y-4">
                {authMode === "register" && (
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">
                      Your Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="username"
                        placeholder="Enter your name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter phone number"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                      }
                      className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary"
                    />
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-destructive text-sm text-center"
                  >
                    {error}
                  </motion.p>
                )}

                <Button
                  onClick={handleGenerateOTP}
                  disabled={isLoading}
                  className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                    />
                  ) : authMode === "register" ? (
                    "Generate OTP"
                  ) : (
                    "Send OTP"
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  {authMode === "register"
                    ? "By signing up, you agree to our Terms & Privacy Policy"
                    : "We will send a one-time password to your phone."}
                </p>

                {authMode === "register" ? (
                  <div className="text-center text-sm mt-2">
                    Already have an account?{" "}
                    <button
                      onClick={() => {
                        setAuthMode("login");
                        setDevOtp(null);
                      }}
                      className="text-primary font-medium hover:underline"
                    >
                      Sign in
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-sm mt-2">
                    New here?{" "}
                    <button
                      onClick={() => {
                        setAuthMode("register");
                        setDevOtp(null);
                      }}
                      className="text-primary font-medium hover:underline"
                    >
                      Sign up
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── OTP STEP (unchanged from original) ────────────────────────── */}
          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="p-6"
            >
              <DialogHeader className="mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Phone className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <DialogTitle className="text-2xl font-bold text-center">
                  Verify Your Number
                </DialogTitle>
                <p className="text-muted-foreground text-center mt-2">
                  Enter the 6-digit code sent to
                  <br />
                  <span className="font-medium text-foreground">+91 {phone}</span>
                </p>
              </DialogHeader>

              {devOtp && /^\d{6}$/.test(devOtp) && (
                <div className="px-6 pb-2">
                  <p className="text-sm text-muted-foreground">
                    Dev OTP:{" "}
                    <span className="font-mono text-primary font-bold">{devOtp}</span>
                  </p>
                </div>
              )}

              <div className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="w-12 h-14 text-xl border-border/50" />
                      <InputOTPSlot index={1} className="w-12 h-14 text-xl border-border/50" />
                      <InputOTPSlot index={2} className="w-12 h-14 text-xl border-border/50" />
                      <InputOTPSlot index={3} className="w-12 h-14 text-xl border-border/50" />
                      <InputOTPSlot index={4} className="w-12 h-14 text-xl border-border/50" />
                      <InputOTPSlot index={5} className="w-12 h-14 text-xl border-border/50" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-destructive text-sm text-center"
                  >
                    {error}
                  </motion.p>
                )}

                <Button
                  onClick={handleVerifyOTP}
                  disabled={isLoading || otp.length !== 6}
                  className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                    />
                  ) : (
                    "Verify OTP"
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className="text-muted-foreground">Didn't receive code?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("info");
                      setDevOtp(null);
                    }}
                    className="text-primary font-medium hover:underline"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── SUCCESS STEP — new animation, theme-matched ────────────────── */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <WelcomeSuccessStep
                username={username}
                authMode={authMode}
                onClose={() => onOpenChange(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}