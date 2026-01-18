import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
const AdminLogin = () => {
    const { sendLoginOtp, loginWithOtp, user, loading } = useAuth();
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState("phone");
    const [isProcessing, setIsProcessing] = useState(false);
    const [devOtp, setDevOtp] = useState(null);
    const navigate = useNavigate();
    // if already logged in as admin, go to admin panel
    useEffect(() => {
        if (!loading && user?.role === 'admin')
            navigate('/admin');
    }, [loading, user, navigate]);
    const handleSendOtp = async () => {
        if (!phone)
            return toast({ title: "Enter phone number" });
        try {
            setIsProcessing(true);
            const returnedOtp = await sendLoginOtp(phone);
            if (returnedOtp) {
                setDevOtp(returnedOtp);
            }
            setStep("otp");
            toast({ title: "OTP sent", description: "Check your phone (or dev logs)." });
        }
        catch (err) {
            setDevOtp(null);
            toast({ title: "Failed to send OTP", description: err?.message || "" });
        }
        finally {
            setIsProcessing(false);
        }
    };
    const handleVerify = async () => {
        if (!otp || !phone)
            return toast({ title: "Enter OTP" });
        try {
            setIsProcessing(true);
            const user = await loginWithOtp(phone, otp);
            if (user.role !== "admin") {
                // non-admin must not be allowed in admin area
                toast({ title: "Unauthorized", description: "You are not an admin." });
                // logout client side
                localStorage.removeItem("authToken");
                localStorage.removeItem("user");
                window.dispatchEvent(new Event("authChanged"));
                setIsProcessing(false);
                return;
            }
            toast({ title: "Welcome, admin" });
            setDevOtp(null);
            navigate("/admin");
        }
        catch (err) {
            toast({ title: "Login failed", description: err?.message || "" });
        }
        finally {
            setIsProcessing(false);
        }
    };
    return (<div className="min-h-screen flex items-center justify-center bg-muted/20">
      <div className="w-[420px] bg-card p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Admin Login</h2>
        {step === "phone" ? (<div className="flex flex-col gap-3">
            <Input placeholder="Phone (e.g., +911234567890)" value={phone} onChange={(e) => setPhone(e.target.value)}/>
            <Button onClick={handleSendOtp} disabled={loading}>{loading ? "Sending…" : "Send OTP"}</Button>
          </div>) : (<div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">OTP sent to {phone}</p>
            {devOtp && (<p className="text-sm text-muted-foreground">Dev OTP: <span className="font-mono">{devOtp}</span></p>)}
            <Input placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)}/>
            <div className="flex gap-2">
              <Button onClick={handleVerify} disabled={loading}>{loading ? "Verifying…" : "Verify & Sign in"}</Button>
              <Button variant="ghost" onClick={() => { setStep("phone"); setDevOtp(null); }}>Change phone</Button>
            </div>
          </div>)}
      </div>
    </div>);
};
export default AdminLogin;
