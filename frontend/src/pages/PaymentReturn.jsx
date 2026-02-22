// pages/PaymentReturn.jsx
// PhonePe redirects users here after payment completes.
// We ALWAYS verify payment status server-side — never trust URL params alone.

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  Check,
  XCircle,
  Loader2,
  RefreshCw,
  ShoppingBag,
  CircleAlert,
  Clock,
  BadgeCheck,
  ArrowRight,
  PackageCheck,
  ReceiptText,
  Wallet,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import api from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// Shared animation helpers (same as SignupDialog)
// ─────────────────────────────────────────────────────────────────────────────
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
  const colorClasses = ["bg-primary", "bg-primary/60", "bg-primary/40", "bg-accent", "bg-accent/70"];
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

// Spinning orbit ring with a glowing dot — same as SignupDialog
function OrbitRing({ radius, speed, delay, dotClass, reverse = false }) {
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
        border: "1px dashed hsl(var(--primary) / 0.18)",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <motion.div
        animate={{ rotate: reverse ? -360 : 360 }}
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
            width: 7,
            height: 7,
            borderRadius: "50%",
            boxShadow: "0 0 8px currentColor",
          }}
        />
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Order detail row
// ─────────────────────────────────────────────────────────────────────────────
function DetailRow({ icon: Icon, label, value, highlight }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <span className={`text-sm font-semibold ${highlight ? "text-primary" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUCCESS STATE
// ─────────────────────────────────────────────────────────────────────────────
function SuccessState({ orderData, navigate }) {
  const particleColors = ["bg-primary", "bg-primary/70", "bg-primary/40", "bg-accent", "bg-accent/60"];
  const burstParticles = Array.from({ length: 32 }, (_, i) => ({
    id: i,
    angle: (360 / 32) * i + rand(-6, 6),
    distance: rand(50, 120),
    delay: rand(0, 0.35),
    size: rand(5, 12),
    isSquare: Math.random() > 0.6,
    colorClass: particleColors[i % particleColors.length],
  }));
  const streamers = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: rand(0, 1.1),
    x: rand(4, 96),
  }));

  return (
    <div className="relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 20%, hsl(var(--primary) / 0.14) 0%, hsl(var(--primary) / 0.04) 50%, transparent 70%)",
        }}
      />

      {/* Streamers */}
      {streamers.map((s) => (
        <Streamer key={s.id} delay={s.delay} x={s.x} />
      ))}

      <div className="relative z-10 flex flex-col items-center pt-10 pb-8 px-6">
        {/* Icon with burst + orbit rings */}
        <div style={{ position: "relative", marginBottom: 28 }}>
          {burstParticles.map((p) => (
            <BurstParticle key={p.id} {...p} />
          ))}
          <OrbitRing radius={70}  speed={8}  delay={0.3} dotClass="bg-primary" />
          <OrbitRing radius={96}  speed={13} delay={0.5} dotClass="bg-primary/60" reverse />
          <OrbitRing radius={122} speed={19} delay={0.7} dotClass="bg-accent" />
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, duration: 0.65, ease: "backOut" }}
            className="bg-primary/10 relative z-10 flex items-center justify-center"
            style={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              boxShadow:
                "0 0 0 10px hsl(var(--primary) / 0.08), 0 0 0 22px hsl(var(--primary) / 0.04)",
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 220 }}
            >
              <motion.div
                animate={{ rotate: [0, -12, 12, -6, 6, 0] }}
                transition={{ delay: 0.7, duration: 0.8 }}
              >
                <BadgeCheck className="w-11 h-11 text-primary" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="text-primary text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2"
        >
          <Check className="w-3 h-3" /> Payment Confirmed <Check className="w-3 h-3" />
        </motion.p>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.45 }}
          className="text-3xl font-bold text-center mb-2"
          style={{ letterSpacing: -0.5 }}
        >
          Order{" "}
          <span className="text-primary">Successful!</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-muted-foreground text-center text-sm max-w-xs leading-relaxed mb-6"
        >
          Your order has been confirmed and will be processed shortly.
        </motion.p>

        {/* Order details card */}
        {(orderData?.orderNumber || orderData?.amount) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.82, duration: 0.45 }}
            className="w-full max-w-sm bg-card border border-border/60 rounded-xl px-3 py-2 mb-7"
            style={{ boxShadow: "0 4px 20px hsl(var(--primary) / 0.08)" }}
          >
            {orderData?.orderNumber && (
              <DetailRow
                icon={ReceiptText}
                label="Order No."
                value={orderData.orderNumber}
              />
            )}
            {orderData?.amount && (
              <DetailRow
                icon={Wallet}
                label="Amount Paid"
                value={`₹${parseFloat(orderData.amount).toLocaleString("en-IN")}`}
                highlight
              />
            )}
            {orderData?.status && (
              <DetailRow
                icon={PackageCheck}
                label="Status"
                value={orderData.status}
              />
            )}
          </motion.div>
        )}

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.45 }}
          className="flex flex-col sm:flex-row gap-3 w-full max-w-sm"
        >
          <button
            onClick={() => navigate("/account/orders")}
            className="flex-1 py-2.5 flex items-center justify-center gap-2 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-colors text-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            View My Orders
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex-1 py-2.5 flex items-center justify-center gap-2 h-11 border border-border hover:bg-muted font-medium rounded-xl transition-colors text-sm"
          >
            Continue Shopping
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADING STATE
// ─────────────────────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center py-16 px-6"
    >
      {/* Pulsing ring + orbit rings */}
      <div className="relative mb-8" style={{ width: 88, height: 88 }}>
        <OrbitRing radius={62}  speed={7}  delay={0.2} dotClass="bg-primary" />
        <OrbitRing radius={84}  speed={11} delay={0.4} dotClass="bg-primary/50" reverse />
        <OrbitRing radius={108} speed={17} delay={0.6} dotClass="bg-accent" />
        <motion.div
          animate={{ scale: [1, 1.18, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-primary/20"
          style={{ width: 88, height: 88 }}
        />
        <motion.div
          animate={{ scale: [1, 1.35, 1], opacity: [0.2, 0.05, 0.2] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.3 }}
          className="absolute inset-0 rounded-full bg-primary/10"
          style={{ width: 88, height: 88 }}
        />
        <div
          className="bg-primary/10 flex items-center justify-center relative z-10"
          style={{ width: 88, height: 88, borderRadius: "50%" }}
        >
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </div>

      <h2 className="text-xl font-bold text-foreground mb-2 text-center">
        Verifying your payment…
      </h2>
      <p className="text-muted-foreground text-sm text-center max-w-xs">
        Please wait, do not close this page.
      </p>

      {/* Progress bar */}
      <div className="mt-8 w-48 h-1 bg-border rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FAILED STATE
// ─────────────────────────────────────────────────────────────────────────────
function FailedState({ navigate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center py-12 px-6"
    >
      {/* Shaking icon + orbit rings */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="relative mb-6"
        style={{ width: 88, height: 88 }}
      >
        <OrbitRing radius={62}  speed={9}  delay={0.3} dotClass="bg-destructive/70" />
        <OrbitRing radius={86}  speed={14} delay={0.5} dotClass="bg-destructive/40" reverse />
        <OrbitRing radius={110} speed={20} delay={0.7} dotClass="bg-primary/40" />
        <div
          className="flex items-center justify-center relative z-10"
          style={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            background: "hsl(0 84% 60% / 0.1)",
            boxShadow: "0 0 0 10px hsl(0 84% 60% / 0.06)",
          }}
        >
          <motion.div
            animate={{ x: [0, -6, 6, -4, 4, 0] }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <XCircle className="w-11 h-11 text-destructive" />
          </motion.div>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-destructive text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1"
      >
        <CircleAlert className="w-3 h-3" /> Payment Failed
      </motion.p>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-2xl font-bold text-foreground mb-2 text-center"
        style={{ letterSpacing: -0.4 }}
      >
        Transaction Declined
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="text-muted-foreground text-sm text-center max-w-xs leading-relaxed mb-8"
      >
        Your payment could not be processed. No amount has been charged to your account.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-sm"
      >
        <button
          onClick={() => navigate("/checkout")}
          className="flex-1 py-2.5 flex items-center justify-center gap-2 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
        <button
          onClick={() => navigate("/cart")}
          className="flex-1 py-2.5 flex items-center justify-center gap-2 h-11 border border-border hover:bg-muted font-medium rounded-xl transition-colors text-sm"
        >
          Back to Cart
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PENDING STATE
// ─────────────────────────────────────────────────────────────────────────────
function PendingState({ navigate, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center py-12 px-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="relative mb-6"
        style={{ width: 88, height: 88 }}
      >
        <OrbitRing radius={62}  speed={8}  delay={0.3} dotClass="bg-primary" />
        <OrbitRing radius={86}  speed={13} delay={0.5} dotClass="bg-primary/55" reverse />
        <OrbitRing radius={110} speed={20} delay={0.7} dotClass="bg-accent" />
        {/* Pulse ring */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.05, 0.3] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full"
          style={{ width: 88, height: 88, background: "hsl(var(--primary) / 0.15)", zIndex: 1 }}
        />
        <div
          className="bg-primary/10 flex items-center justify-center relative z-10"
          style={{ width: 88, height: 88, borderRadius: "50%" }}
        >
          <Clock className="w-10 h-10 text-primary" />
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-primary text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1"
      >
        <Clock className="w-3 h-3" /> Processing
      </motion.p>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-2xl font-bold text-foreground mb-2 text-center"
        style={{ letterSpacing: -0.4 }}
      >
        Payment Processing
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="text-muted-foreground text-sm text-center max-w-xs leading-relaxed mb-8"
      >
        This may take a moment. Your order will be confirmed once the payment settles. You can check your order status in your account.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-sm"
      >
        <button
          onClick={onRetry}
          className="flex-1 py-2.5 flex items-center justify-center gap-2 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Check Again
        </button>
        <button
          onClick={() => navigate("/account/orders")}
          className="flex- py-2.5 flex items-center justify-center gap-2 h-11 border border-border hover:bg-muted font-medium rounded-xl transition-colors text-sm"
        >
          View Orders
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR STATE
// ─────────────────────────────────────────────────────────────────────────────
function ErrorState({ navigate, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center py-12 px-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="relative mb-6"
        style={{ width: 88, height: 88 }}
      >
        <OrbitRing radius={62}  speed={10} delay={0.3} dotClass="bg-muted-foreground/50" />
        <OrbitRing radius={86}  speed={15} delay={0.5} dotClass="bg-muted-foreground/30" reverse />
        <OrbitRing radius={110} speed={22} delay={0.7} dotClass="bg-primary/30" />
        <div
          className="flex items-center justify-center relative z-10"
          style={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            background: "hsl(var(--muted))",
            boxShadow: "0 0 0 10px hsl(var(--muted) / 0.5)",
          }}
        >
          <CircleAlert className="w-11 h-11 text-muted-foreground" />
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-2"
      >
        Verification Error
      </motion.p>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-2xl font-bold text-foreground mb-2 text-center"
        style={{ letterSpacing: -0.4 }}
      >
        Something Went Wrong
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="text-muted-foreground text-sm text-center max-w-xs leading-relaxed mb-8"
      >
        We couldn't verify your payment. If any amount was deducted, please contact support with your transaction ID.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-sm"
      >
        <button
          onClick={onRetry}
          className="flex-1 flex items-center justify-center gap-2 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Verification
        </button>
        <button
          onClick={() => navigate("/account/orders")}
          className="flex-1 flex items-center justify-center gap-2 h-11 border border-border hover:bg-muted font-medium rounded-xl transition-colors text-sm"
        >
          View Orders
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const merchantOrderId = searchParams.get("merchantOrderId");

  const [status, setStatus] = useState("loading"); // loading | success | failed | pending | error
  const [orderData, setOrderData] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const verifyPayment = async () => {
    if (!merchantOrderId) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const response = await api.get(`/payments/status/${merchantOrderId}`);
      if (response.data.success) {
        const paymentState = response.data.data?.status;
        setOrderData(response.data.data);
        if (paymentState === "COMPLETED") {
          setStatus("success");
          window.dispatchEvent(new Event("cartUpdated"));
          window.dispatchEvent(new Event("refreshCart"));
        } else if (paymentState === "FAILED") {
          setStatus("failed");
          toast.error("Payment failed. Please try again.");
        } else {
          if (retryCount < 3) {
            setTimeout(() => setRetryCount((c) => c + 1), 3000);
          } else {
            setStatus("pending");
          }
        }
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error("Payment verification error:", err);
      setStatus("error");
    }
  };

  useEffect(() => {
    verifyPayment();
  }, [merchantOrderId, retryCount]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-8 px-4 pb-5 max-w-lg mx-auto">
        {/* Status breadcrumb pill */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center mb-5"
        >
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card text-xs text-muted-foreground">
            <span className={`w-2 h-2 rounded-full ${
              status === "success" ? "bg-primary animate-none" :
              status === "failed" ? "bg-destructive" :
              status === "error" ? "bg-muted-foreground" :
              "bg-primary animate-pulse"
            }`} />
            {status === "loading" && "Verifying payment…"}
            {status === "success" && "Payment confirmed"}
            {status === "failed" && "Payment failed"}
            {status === "pending" && "Processing payment"}
            {status === "error" && "Verification error"}
          </div>
        </motion.div>

        {/* Main card */}
        <div
          className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
          style={{ boxShadow: "0 8px 32px hsl(var(--primary) / 0.06)" }}
        >
          <AnimatePresence mode="wait">
            {status === "loading" && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <LoadingState />
              </motion.div>
            )}
            {status === "success" && (
              <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SuccessState orderData={orderData} navigate={navigate} />
              </motion.div>
            )}
            {status === "failed" && (
              <motion.div key="failed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <FailedState navigate={navigate} />
              </motion.div>
            )}
            {status === "pending" && (
              <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PendingState navigate={navigate} onRetry={verifyPayment} />
              </motion.div>
            )}
            {status === "error" && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ErrorState navigate={navigate} onRetry={verifyPayment} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-xs text-muted-foreground mt-5"
        >
          Having trouble?{" "}
          <button
            onClick={() => navigate("/contact")}
            className="text-primary hover:underline font-medium"
          >
            Contact support
          </button>
        </motion.p>
      </div>

      <Footer />
    </div>
  );
}