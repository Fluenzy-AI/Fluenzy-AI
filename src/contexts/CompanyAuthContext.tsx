"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface CompanyUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "HIRING_MANAGER" | "HR_RECRUITER";
  phone?: string;
  avatar?: string;
  lastLoginAt?: string;
}

export interface CompanyInfo {
  id: string;
  name: string;
  slug: string;
  domain: string;
  logoUrl?: string;
  status: string;
  autoApplyEnabled: boolean;
}

interface CompanyAuthContextType {
  user: CompanyUser | null;
  company: CompanyInfo | null;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CompanyAuthContext = createContext<CompanyAuthContextType>({
  user: null,
  company: null,
  loading: true,
  logout: async () => {},
  refresh: async () => {},
});

export function CompanyAuthProvider({
  children,
  requiredRoles,
}: {
  children: React.ReactNode;
  requiredRoles?: ("ADMIN" | "HIRING_MANAGER" | "HR_RECRUITER")[];
}) {
  const [user, setUser] = useState<CompanyUser | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/company/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setCompany(data.company);
      } else if (res.status === 401) {
        // Try refresh
        const refreshRes = await fetch("/api/company/auth/refresh", { method: "POST", credentials: "include" });
        if (refreshRes.ok) {
          const retryRes = await fetch("/api/company/auth/me", { credentials: "include" });
          if (retryRes.ok) {
            const data = await retryRes.json();
            setUser(data.user);
            setCompany(data.company);
            return;
          }
        }
        setUser(null);
        setCompany(null);
        if (!pathname?.includes("/company/login") && !pathname?.includes("/company/signup") && !pathname?.includes("/company/forgot-password")) {
          router.push("/company/login");
        }
      }
    } catch {
      setUser(null);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }, [router, pathname]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!loading && user && requiredRoles && !requiredRoles.includes(user.role)) {
      // User doesn't have required role, redirect to dashboard
      router.push("/company/portal");
    }
  }, [user, loading, requiredRoles, router]);

  async function logout() {
    await fetch("/api/company/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    setCompany(null);
    router.push("/company/login");
  }

  return (
    <CompanyAuthContext.Provider value={{ user, company, loading, logout, refresh: fetchUser }}>
      {children}
    </CompanyAuthContext.Provider>
  );
}

export function useCompanyAuth() {
  return useContext(CompanyAuthContext);
}
