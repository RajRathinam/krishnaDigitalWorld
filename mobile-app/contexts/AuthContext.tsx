import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi } from "@/services/api";

interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phone: string) => Promise<any>;
  verifyOtp: (phone: string, otp: string) => Promise<User>;
  register: (name: string, phone: string) => Promise<any>;
  verifyRegistration: (phone: string, otp: string) => Promise<User>;
  resendOtp: (phone: string, purpose: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (updatedUser: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("authToken");
      if (!storedUser || !token) {
        setLoading(false);
        return;
      }
      try {
        const res: any = await authApi.getMe();
        if (res?.success && res?.data) {
          setUser(res.data as User);
          await AsyncStorage.setItem("user", JSON.stringify(res.data));
        } else {
          await AsyncStorage.removeItem("authToken");
          await AsyncStorage.removeItem("user");
          setUser(null);
        }
      } catch (e: any) {
        const status = e?.response?.status;
        if (status === 401 || status === 403) {
          await AsyncStorage.removeItem("authToken");
          await AsyncStorage.removeItem("user");
          setUser(null);
        } else {
          setUser(JSON.parse(storedUser) as User);
        }
      }
    } catch (e) {
      console.error("Failed to load user", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe();
      const userData = res.data || res;
      setUser(userData);
      await AsyncStorage.setItem("user", JSON.stringify(userData));
    } catch (e) {
      console.error("Failed to refresh user", e);
      // If refresh fails, it might be due to an expired token
      await logout();
    }
  };

  const updateUser = async (updatedUser: any) => {
    setUser(updatedUser);
    await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const login = async (phone: string) => {
    setUser(null);
    await AsyncStorage.removeItem("authToken");
    await AsyncStorage.removeItem("user");
    return await authApi.login(phone);
  };

  const verifyOtp = async (phone: string, otp: string) => {
    const res: any = await authApi.verifyOtp(phone, otp);
    if (res.success) {
      setUser(res.user || res.data.user);
      return res.user || res.data.user;
    }
    throw new Error(res.message || "Verification failed");
  };

  const register = async (name: string, phone: string) => {
    setUser(null);
    await AsyncStorage.removeItem("authToken");
    await AsyncStorage.removeItem("user");
    return await authApi.register({ name, phone });
  };

  const verifyRegistration = async (phone: string, otp: string) => {
    const res: any = await authApi.verifyRegistrationOtp(phone, otp);
    if (res.success) {
      setUser(res.user || res.data.user);
      return res.user || res.data.user;
    }
    throw new Error(res.message || "Registration failed");
  };

  const resendOtp = async (phone: string, purpose: string) => {
    return await authApi.resendOtp(phone, purpose);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        verifyOtp,
        register,
        verifyRegistration,
        resendOtp,
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
