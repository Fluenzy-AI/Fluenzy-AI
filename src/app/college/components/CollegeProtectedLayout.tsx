"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCollegeAdmin } from "@/contexts/CollegeAdminContext";
import CollegeSidebar from "../components/CollegeSidebar";
import { Loader2 } from "lucide-react";

export default function CollegeProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, login } = useCollegeAdmin();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pick up token injected by Google OAuth callback redirect
  useEffect(() => {
    const oauthToken = searchParams.get("college_token");
    if (!oauthToken) return;
    // Fetch admin data with this token then log in
    fetch("/api/college/me", { headers: { Authorization: `Bearer ${oauthToken}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.admin) {
          login(oauthToken, d.admin);
          // Remove the token from the URL without a full reload
          const url = new URL(window.location.href);
          url.searchParams.delete("college_token");
          window.history.replaceState({}, "", url.toString());
        }
      })
      .catch(console.error);
  }, [searchParams, login]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/college/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e]">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-[#0a0f1e]">
      <CollegeSidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}

