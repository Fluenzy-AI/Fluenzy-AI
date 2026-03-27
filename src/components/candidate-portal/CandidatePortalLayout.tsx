"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  User,
  Bell,
  Briefcase,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  BookmarkCheck,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface CandidatePortalLayoutProps {
  children: React.ReactNode;
  candidate: {
    id: string;
    name: string;
    email: string;
  } | null;
  notifications?: number;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/candidates/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "My Applications", href: "/candidates/dashboard/applications", icon: <FileText className="w-5 h-5" /> },
  { label: "Interviews", href: "/candidates/dashboard/interviews", icon: <Calendar className="w-5 h-5" /> },
  { label: "Saved Jobs", href: "/candidates/dashboard/saved", icon: <BookmarkCheck className="w-5 h-5" /> },
  { label: "Browse Jobs", href: "/candidates/dashboard/careers", icon: <Briefcase className="w-5 h-5" /> },
];

const BOTTOM_NAV: NavItem[] = [
  { label: "Profile", href: "/candidates/dashboard/profile", icon: <User className="w-5 h-5" /> },
  { label: "Notifications", href: "/candidates/dashboard/notifications", icon: <Bell className="w-5 h-5" /> },
  { label: "Settings", href: "/candidates/dashboard/settings", icon: <Settings className="w-5 h-5" /> },
];

export default function CandidatePortalLayout({ children, candidate, notifications = 0 }: CandidatePortalLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/candidates/auth/logout", { method: "POST" });
      router.replace("/candidates/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isActive = (href: string) => {
    if (href === "/candidates/dashboard") {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-[#0D0F14] border-r border-white/5 z-50 transform transition-transform duration-300 flex flex-col
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo Header */}
        <div className="p-6 border-b border-white/5">
          <Link href="/candidates/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-white text-lg">Fluenzy AI</div>
              <div className="text-xs text-violet-400 font-medium">Candidate Portal</div>
            </div>
          </Link>
          {/* Close button for mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-6 right-4 p-2 rounded-lg hover:bg-white/5 lg:hidden"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">Main Menu</p>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${active
                    ? "bg-violet-500/10 text-violet-300 border border-violet-500/20 shadow-lg shadow-violet-500/5"
                    : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
                  }`}
              >
                <span className={`${active ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300"}`}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-violet-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center font-semibold">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
                {active && <ChevronRight className="w-4 h-4 text-violet-400" />}
              </Link>
            );
          })}

          <div className="pt-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">Account</p>
            {BOTTOM_NAV.map((item) => {
              const active = isActive(item.href);
              const isNotif = item.label === "Notifications";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                    ${active
                      ? "bg-violet-500/10 text-violet-300 border border-violet-500/20"
                      : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
                    }`}
                >
                  <span className={`relative ${active ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300"}`}>
                    {item.icon}
                    {isNotif && notifications > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {isNotif && notifications > 0 && (
                    <span className="bg-red-500/10 text-red-400 text-xs rounded-full px-2 py-0.5 font-semibold border border-red-500/20">
                      {notifications}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg shadow-violet-500/20">
              {candidate?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{candidate?.name || "User"}</p>
              <p className="text-xs text-slate-500 truncate">{candidate?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-72">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-[#0A0C10]/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl hover:bg-white/5 lg:hidden"
            >
              <Menu className="w-6 h-6 text-slate-400" />
            </button>

            {/* Breadcrumb / Page Title */}
            <div className="hidden lg:flex items-center gap-2 text-sm">
              <Link href="/candidates/dashboard" className="text-slate-500 hover:text-white transition-colors">
                Dashboard
              </Link>
              {pathname !== "/candidates/dashboard" && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                  <span className="text-white font-medium capitalize">
                    {pathname?.split("/").pop()?.replace(/-/g, " ")}
                  </span>
                </>
              )}
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              {/* Notification bell */}
              <Link
                href="/candidates/dashboard/notifications"
                className="relative p-2 rounded-xl hover:bg-white/5 transition-colors"
              >
                <Bell className="w-5 h-5 text-slate-400" />
                {notifications > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </Link>

              {/* Mobile user avatar */}
              <div className="lg:hidden w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                {candidate?.name?.[0]?.toUpperCase() || "U"}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
