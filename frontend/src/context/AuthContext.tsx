// src/context/AuthContext.tsx - INTEGRATED WITH CHAT
import React, { createContext, useState, useEffect, ReactNode } from "react";
import axiosInstance from "../axios";
import { triggerUserLogout } from "../utils/authEvents"; // ← THÊM

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
    
    // ✅ LƯU USER VÀO LOCALSTORAGE để ChatWidget đọc được
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    }
    
    setLoading(true);
    if (userData) {
      setUser(userData);
      setLoading(false);
      return;
    }
    try {
      const res = await axiosInstance.get("/auth/me").catch(() => null);
      if (res && res.data) {
        const user = res.data.user || res.data;
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user)); // ← LƯU USER
      } else {
        const res2 = await axiosInstance.get("/user/me").catch(() => null);
        const user = res2?.data?.user || res2?.data || null;
        setUser(user);
        if (user) {
          localStorage.setItem("user", JSON.stringify(user)); // ← LƯU USER
        }
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // ✅ LOGOUT - TÍCH HỢP CHAT
  const logout = async () => {
    const currentUserId = user?.id;
    console.log('🔔 AuthContext: Logging out user:', currentUserId);
    
    // ✅ 1. TRIGGER CHAT LOGOUT EVENT TRƯỚC KHI XÓA DATA
    triggerUserLogout();
    console.log('🔔 Chat: Logout event triggered from AuthContext');
    
    // ✅ 2. RESET USER STATE NGAY LẬP TỨC
    setUser(null);
    setLoading(false);
    
    // ✅ 3. XÓA LOCALSTORAGE
    localStorage.removeItem("token");
    localStorage.removeItem("user"); // ← XÓA USER
    
    // ✅ 4. GỌI API LOGOUT (async, không block)
    try {
      if (currentUserId) {
        await axiosInstance.post("/auth/logout").catch((err) => {
          console.log("Logout API error (non-critical):", err.message);
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
    
    console.log("✅ AuthContext: Logout complete");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};