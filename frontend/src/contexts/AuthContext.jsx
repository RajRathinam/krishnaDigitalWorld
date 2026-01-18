import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "@/services/api";
import { toast } from "@/hooks/use-toast";
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const setLocalUser = (u) => {
        if (u) {
            localStorage.setItem("user", JSON.stringify(u));
        }
        else {
            localStorage.removeItem("user");
        }
        setUser(u);
    };
    const normalizeUser = (u) => {
        if (!u)
            return null;
        // Some older backends might return role as 'user' — normalize to 'customer'
        const role = (u.role === 'user') ? 'customer' : (u.role || 'customer');
        return {
            ...u,
            role,
        };
    };
    const refreshUser = async () => {
        setLoading(true);
        const token = localStorage.getItem("authToken");
        if (!token) {
            setLocalUser(null);
            setLoading(false);
            return;
        }
        try {
            const res = await authApi.getMe();
            // be defensive about response shape
            const u = (res && res.data) ? res.data : res;
            setLocalUser(normalizeUser(u));
        }
        catch (err) {
            // broken token
            localStorage.removeItem("authToken");
            setLocalUser(null);
            toast.error?.(err?.message || 'Failed to refresh user');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        // Initial load
        refreshUser();
        const onAuthChanged = () => refreshUser();
        window.addEventListener("authChanged", onAuthChanged);
        // storage events from other tabs
        const onStorage = (e) => {
            if (e.key === "authToken" || e.key === "user")
                refreshUser();
        };
        window.addEventListener("storage", onStorage);
        return () => {
            window.removeEventListener("authChanged", onAuthChanged);
            window.removeEventListener("storage", onStorage);
        };
    }, []);
    const loginWithToken = (token, u) => {
        localStorage.setItem("authToken", token);
        setLocalUser(u);
        window.dispatchEvent(new Event("authChanged"));
    };
    const sendLoginOtp = async (phone) => {
        try {
            const res = await authApi.login({ phone });
            const otp = res?.data?.otp || res?.otp;
            // In development, show OTP in a toast to make testing easier
            if (process.env.NODE_ENV === 'development' && otp) {
                toast.success?.({ title: 'OTP (dev)', description: `OTP: ${otp}` });
            }
            return otp;
        }
        catch (err) {
            toast.error?.(err?.message || 'Failed to send OTP');
            throw err;
        }
    };
    const loginWithOtp = async (phone, otp) => {
        try {
            const res = await authApi.verifyLogin(phone, otp);
            const payload = res?.data || res;
            const token = payload?.token;
            const user = payload?.user;
            if (!token || !user)
                throw new Error('Invalid login response');
            localStorage.setItem("authToken", token);
            setLocalUser(normalizeUser(user));
            window.dispatchEvent(new Event("authChanged"));
            return user;
        }
        catch (err) {
            toast.error?.(err?.message || 'Login failed');
            throw err;
        }
    };
    const logout = async () => {
        try {
            await authApi.logout();
        }
        catch (err) {
            // ignore network errors
        }
        localStorage.removeItem("authToken");
        setLocalUser(null);
        window.dispatchEvent(new Event("authChanged"));
    };
    return (<AuthContext.Provider value={{ user, loading, loginWithToken, sendLoginOtp, loginWithOtp, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>);
};
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};
