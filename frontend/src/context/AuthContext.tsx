// src/context/AuthContext.tsx - FIXED VERSION
import React, { createContext, useState, useEffect, ReactNode } from "react";
import axiosInstance from "../axios";

interface User {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  [k: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user?: User) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Try to fetch current user if token present
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        const res = await axiosInstance.get("/auth/me").catch(() => null);
        if (res && res.data) {
          if (mounted) setUser(res.data.user || res.data);
        } else {
          const res2 = await axiosInstance.get("/user/me").catch(() => null);
          if (res2 && res2.data) {
            if (mounted) setUser(res2.data.user || res2.data);
          } else {
            if (mounted) setUser(null);
          }
        }
      } catch (err) {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    // Listen to global logout event
    const onLogout = () => {
      setUser(null);
      setLoading(false);
    };
    window.addEventListener("app:auth-logout", onLogout);

    return () => {
      mounted = false;
      window.removeEventListener("app:auth-logout", onLogout);
    };
  }, []);

  const login = async (token: string, userData?: User) => {
    localStorage.setItem("token", token);
    setLoading(true);
    if (userData) {
      setUser(userData);
      setLoading(false);
      return;
    }
    try {
      const res = await axiosInstance.get("/auth/me").catch(() => null);
      if (res && res.data) {
        setUser(res.data.user || res.data);
      } else {
        const res2 = await axiosInstance.get("/user/me").catch(() => null);
        setUser(res2?.data?.user || res2?.data || null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED LOGOUT - Reset user NGAY LẬP TỨC
  const logout = async () => {
    console.log('🔓 Logging out user:', user?.id);
    
    // ✅ 1. RESET USER NGAY - Không đợi API
    const currentUserId = user?.id;
    setUser(null);
    setLoading(false);
    
    // ✅ 2. XÓA TOKEN
    localStorage.removeItem("token");
    
    // ✅ 3. GỌI API LOGOUT (async, không block)
    try {
      const token = localStorage.getItem("token");
      if (currentUserId) {
        await axiosInstance.post("/auth/logout").catch((err) => {
          console.log("Logout API error (non-critical):", err.message);
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
    
    console.log("✅ Logout complete, user reset, chat will unmount");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};