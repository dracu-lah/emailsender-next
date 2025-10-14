"use client";
import { useState, useCallback } from "react";

export const useAuth = () => {
  const [auth, setAuth] = useState<{
    gmail: string;
    appPassword: string;
  } | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("auth");
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });

  const logout = useCallback(() => {
    localStorage.removeItem("auth");
    setAuth(null);
  }, []);

  return { auth, logout, isAuthenticated: !!auth };
};
