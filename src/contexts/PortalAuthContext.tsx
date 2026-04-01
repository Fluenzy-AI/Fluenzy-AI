"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface PortalUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "HR" | "MARKETING_ADMIN";
  status: string;
  department?: string;
  phone?: string;
  avatar?: string;
  permissions?: Record<string, boolean>;
  lastLoginAt?: string;
}

interface PortalAuthContextType {
  user: PortalUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const PortalAuthContext = createContext<PortalAuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  refresh: async () => {},
});

export function PortalAuthProvider({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: "ADMIN" | "HR" | "MARKETING_ADMIN";
}) {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else if (res.status === 401) {
        // Try refresh
        const refreshRes = await fetch("/api/portal/auth/refresh", { method: "POST", credentials: "include" });
        if (refreshRes.ok) {
          const retryRes = await fetch("/api/portal/auth/me", { credentials: "include" });
          if (retryRes.ok) {
            const data = await retryRes.json();
            setUser(data.user);
            return;
          }
        }
        setUser(null);
        if (!pathname?.includes("/portal/login") && !pathname?.includes("/portal/forgot-password")) {
          router.push("/portal/login");
        }
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [router, pathname]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!loading && user && requiredRole && user.role !== requiredRole) {
      if (user.role === "ADMIN") router.push("/portal/admin");
      else if (user.role === "HR") router.push("/portal/hr");
      else if (user.role === "MARKETING_ADMIN") router.push("/portal/marketing");
    }
  }, [user, loading, requiredRole, router]);

  async function logout() {
    await fetch("/api/portal/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    router.push("/portal/login");
  }

  return (
    <PortalAuthContext.Provider value={{ user, loading, logout, refresh: fetchUser }}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth() {
  return useContext(PortalAuthContext);
}
