import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";

import api from "../api/client";

type Role = "teacher" | "student";

type AuthState = {
  token: string;
  role: Role;
  email: string;
};

type AuthContextType = {
  user: AuthState | null;
  login: (params: { email: string; password: string }) => Promise<void>;
  register: (params: {
    email: string;
    password: string;
    role: Role;
  }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthState | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("aipapergrader.token");
    const role = localStorage.getItem("aipapergrader.role") as Role | null;
    const email = localStorage.getItem("aipapergrader.email");
    if (token && role && email) {
      setUser({ token, role, email });
    }
  }, []);

  const login = async ({ email, password }: { email: string; password: string }) => {
    const data = new URLSearchParams();
    data.append("username", email);
    data.append("password", password);
    const response = await api.post("/auth/login", data, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const token = response.data.access_token as string;
    const base64 = token.split(".")[1];
    const normalized = base64.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalized));
    const resolvedRole = payload.role as Role | undefined;
    if (!resolvedRole) {
      throw new Error("Token missing role claim");
    }
    localStorage.setItem("aipapergrader.token", token);
    localStorage.setItem("aipapergrader.role", resolvedRole);
    localStorage.setItem("aipapergrader.email", email);
    setUser({ token, role: resolvedRole, email });
  };

  const register = async ({
    email,
    password,
    role,
  }: {
    email: string;
    password: string;
    role: Role;
  }) => {
    await api.post("/auth/register", { email, password, role });
    await login({ email, password });
  };

  const logout = () => {
    localStorage.removeItem("aipapergrader.token");
    localStorage.removeItem("aipapergrader.role");
    localStorage.removeItem("aipapergrader.email");
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, register, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

