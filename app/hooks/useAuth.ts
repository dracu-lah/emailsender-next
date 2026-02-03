"use client";

import { useCallback, useState } from "react";

export type AuthState = {
  gmail: string;
  appPassword: string;
} | null;

const getInitialAuth = (): AuthState => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("auth");
    return stored ? (JSON.parse(stored) as AuthState) : null;
  } catch {
    return null;
  }
};

export const useAuth = () => {
  const [auth, setAuth] = useState<AuthState>(getInitialAuth);

  const logout = useCallback(() => {
    localStorage.removeItem("auth");
    setAuth(null);
  }, []);

  return { auth, logout, isAuthenticated: !!auth };
};

