"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

interface CollegeAdminData {
  id: string;
  collegeName: string;
  adminName: string;
  email: string;
  domain: string;
  designation: string;
  contactNumber: string;
  logoUrl?: string | null;
  totalSeats: number;
  usedSeats: number;
  allocatedPlan: string;
  planExpiresAt?: string | null;
  moduleLimits?: Record<string, number> | null;
  status: string;
  createdAt: string;
}

interface CollegeAdminContextType {
  admin: CollegeAdminData | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, adminData: CollegeAdminData) => void;
  logout: () => void;
  refreshAdmin: () => Promise<void>;
}

const CollegeAdminContext = createContext<CollegeAdminContextType | null>(null);

export function CollegeAdminProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<CollegeAdminData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAdmin = useCallback(async () => {
    const storedToken = localStorage.getItem("college_token");
    if (!storedToken) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/college/me", {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdmin(data.admin);
        setToken(storedToken);
      } else {
        localStorage.removeItem("college_token");
        setAdmin(null);
        setToken(null);
      }
    } catch {
      localStorage.removeItem("college_token");
      setAdmin(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAdmin();
  }, [refreshAdmin]);

  const login = useCallback((newToken: string, adminData: CollegeAdminData) => {
    localStorage.setItem("college_token", newToken);
    setToken(newToken);
    setAdmin(adminData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("college_token");
    setToken(null);
    setAdmin(null);
    // Clear cookie too
    document.cookie = "college_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    window.location.href = "/college/login";
  }, []);

  return (
    <CollegeAdminContext.Provider
      value={{ admin, token, isLoading, isAuthenticated: !!admin, login, logout, refreshAdmin }}
    >
      {children}
    </CollegeAdminContext.Provider>
  );
}

export function useCollegeAdmin() {
  const ctx = useContext(CollegeAdminContext);
  if (!ctx) throw new Error("useCollegeAdmin must be used inside CollegeAdminProvider");
  return ctx;
}
