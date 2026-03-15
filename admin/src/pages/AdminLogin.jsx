import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ShieldCheck, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const { sendLoginOtp, loginWithOtp, user, loading } = useAuth();

  const [step, setStep]                 = useState("phone"); // "phone" | "otp"
  const [phone, setPhone]               = useState("");
  const [otp, setOtp]                   = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [devOtp, setDevOtp]             = useState(null);
  const [error, setError]               = useState("");
  const [resendTimer, setResendTimer]   = useState(0);

  const navigate = useNavigate();

  // Redirect if already admin
  useEffect(() => {
    if (!loading && user?.role === "admin") navigate("/overview");
  }, [loading, user, navigate]);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const isBusy = loading || isProcessing;

  // ── Send OTP ───────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!phone.trim()) { setError("Please enter your phone number"); return; }
    setError("");
    setIsProcessing(true);
    try {
      const returned = await sendLoginOtp(phone);
      if (returned) setDevOtp(returned);
      setStep("otp");
      setResendTimer(30);
      toast({ title: "OTP sent", description: "Check your phone (or dev logs)." });
    } catch (err) {
      setDevOtp(null);
      const msg = err?.message || "Failed to send OTP";
      setError(msg);
      toast({ title: "Failed to send OTP", description: msg, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  const handleVerify = async () => {
    if (otp.length !== 6) { setError("Please enter the complete 6-digit OTP"); return; }
    setError("");
    setIsProcessing(true);
    try {
      const loggedInUser = await loginWithOtp(phone, otp);
      if (loggedInUser.role !== "admin" && loggedInUser.role !== "subadmin") {
        toast({ title: "Unauthorized", description: "You are not authorized to access this area.", variant: "destructive" });
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("authChanged"));
        setOtp("");
        setError("Access denied. Admin accounts only.");
        setIsProcessing(false);
        return;
      }
      toast({ title: "Welcome, admin 👋" });
      setDevOtp(null);
      navigate("/overview");
    } catch (err) {
      const msg = err?.message || "OTP verification failed";
      setError(msg);
      toast({ title: "Login failed", description: msg, variant: "destructive" });
      setOtp(""); // clear boxes on wrong OTP
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setOtp("");
    setDevOtp(null);
    setError("");
    await handleSendOtp();
  };

  // ── Layout ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
      <div className="w-full max-w-[440px] bg-card rounded-2xl shadow-xl border border-border overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        <AnimatePresence mode="wait">

          {/* ── Step 1: Phone ── */}
          {step === "phone" && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.28 }}
              className="p-8"
            >
              {/* Icon */}
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
              </div>

              {/* Heading */}
              <h2 className="text-2xl font-bold text-center text-foreground mb-1">Admin Login</h2>
              <p className="text-muted-foreground text-center text-sm mb-7">
                Enter your registered phone number to receive a one-time password.
              </p>

              {/* Phone input */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                    className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary"
                    disabled={isBusy}
                  />
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    key="err"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-destructive text-sm text-center mb-3"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* CTA */}
              <Button
                onClick={handleSendOtp}
                disabled={isBusy}
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
              >
                {isBusy ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                  />
                ) : (
                  <span className="flex items-center gap-2">
                    Send OTP
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                      className="flex"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </motion.span>
                  </span>
                )}
              </Button>
            </motion.div>
          )}

          {/* ── Step 2: OTP ── */}
          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28 }}
              className="p-8"
            >
              {/* Icon */}
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="w-8 h-8 text-primary" />
                </div>
              </div>

              {/* Heading */}
              <h2 className="text-2xl font-bold text-center text-foreground mb-1">Verify Your Number</h2>
              <p className="text-muted-foreground text-center text-sm mb-7">
                Enter the 6-digit code sent to
                <br />
                <span className="font-semibold text-foreground">{phone}</span>
              </p>

              {/* Dev OTP hint */}
              <AnimatePresence>
                {devOtp && /^\d{6}$/.test(devOtp) && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 mb-5"
                  >
                    <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Dev OTP: <span className="font-mono font-bold tracking-widest">{devOtp}</span>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* OTP boxes */}
              <div className="flex justify-center mb-5">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(val) => { setOtp(val); setError(""); }}
                  onComplete={handleVerify}
                  disabled={isBusy}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="w-12 h-14 text-xl border-border/50 focus-within:border-primary" />
                    <InputOTPSlot index={1} className="w-12 h-14 text-xl border-border/50 focus-within:border-primary" />
                    <InputOTPSlot index={2} className="w-12 h-14 text-xl border-border/50 focus-within:border-primary" />
                    <InputOTPSlot index={3} className="w-12 h-14 text-xl border-border/50 focus-within:border-primary" />
                    <InputOTPSlot index={4} className="w-12 h-14 text-xl border-border/50 focus-within:border-primary" />
                    <InputOTPSlot index={5} className="w-12 h-14 text-xl border-border/50 focus-within:border-primary" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    key="err"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-destructive text-sm text-center mb-3"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Verify button */}
              <Button
                onClick={handleVerify}
                disabled={isBusy || otp.length !== 6}
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 mb-4"
              >
                {isBusy ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                  />
                ) : "Verify & Sign in"}
              </Button>

              {/* Resend + change number */}
              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={() => { setStep("phone"); setOtp(""); setDevOtp(null); setError(""); }}
                  disabled={isBusy}
                  className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 flex items-center gap-1"
                >
                  ← Change number
                </button>

                <button
                  onClick={handleResend}
                  disabled={isBusy || resendTimer > 0}
                  className={`flex items-center gap-1 transition-colors disabled:opacity-40 ${
                    resendTimer > 0 ? "text-muted-foreground cursor-default" : "text-primary hover:text-primary/80"
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}