"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authService } from "@/lib/services/auth.route";
import type { Role, User } from "@/lib/types";

const STORAGE_KEY = "restaurant-auth-user";

interface RegisterPayload {
  name: string;
  mobile: string;
  email?: string;
  password: string;
  role: Role;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  loginAdmin: (email: string, password: string) => Promise<User>;
  loginStaff: (mobile: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.role) parsed.role = parsed.role.toLowerCase();
        setUser(parsed);
      }
    } catch {
      // ignore corrupted storage
    }
    setLoading(false);
  }, []);

  const persist = useCallback((next: User | null) => {
    if (next && next.role) {
      next.role = next.role.toLowerCase() as Role;
    }
    setUser(next);
    if (next) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const loginAdmin = useCallback(
    async (email: string, password: string) => {
      const u = await authService.loginAdmin({ email, password });
      persist(u);
      return u;
    },
    [persist],
  );

  const loginStaff = useCallback(
    async (mobile: string, password: string) => {
      const u = await authService.loginStaff({ mobile, password });
      persist(u);
      return u;
    },
    [persist],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const u = await authService.register(payload);
      persist(u);
      return u;
    },
    [persist],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // server logout is stateless — ignore failures
    }
    persist(null);
  }, [persist]);

  const value = useMemo(
    () => ({ user, loading, loginAdmin, loginStaff, register, logout }),
    [user, loading, loginAdmin, loginStaff, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
