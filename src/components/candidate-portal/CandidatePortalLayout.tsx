"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  ChevronDown,
  Menu,
  X,
  Sparkles,
  BookmarkCheck,
  History,
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
  { label: "Dashboard", href: "/candidates/dashboard", icon: <LayoutDashboard className="w-5 h-5 flex-shrink-0" /> },
  { label: "My Applications", href: "/candidates/dashboard/applications", icon: <FileText className="w-5 h-5 flex-shrink-0" /> },
  { label: "Interviews", href: "/candidates/dashboard/interviews", icon: <Calendar className="w-5 h-5 flex-shrink-0" /> },
  { label: "Saved Jobs", href: "/candidates/dashboard/saved", icon: <BookmarkCheck className="w-5 h-5 flex-shrink-0" /> },
  { label: "Browse Jobs", href: "/candidates/dashboard/careers", icon: <Briefcase className="w-5 h-5 flex-shrink-0" /> },
];

const BOTTOM_NAV: NavItem[] = [
  { label: "Profile", href: "/candidates/dashboard/profile", icon: <User className="w-5 h-5 flex-shrink-0" /> },
  { label: "Notifications", href: "/candidates/dashboard/notifications", icon: <Bell className="w-5 h-5 flex-shrink-0" /> },
  { label: "Settings", href: "/candidates/dashboard/settings", icon: <Settings className="w-5 h-5 flex-shrink-0" /> },
];

export default function CandidatePortalLayout({ children, candidate, notifications = 0 }: CandidatePortalLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/candidates/auth/logout", { method: "POST" });
      router.replace("/candidates/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [router]);

  const isActive = useCallback((href: string) => {
    if (href === "/candidates/dashboard") {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  }, [pathname]);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const openSidebar = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen min-h-dvh bg-[#0A0C10] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-dvh bg-[#0A0C10] text-white flex overflow-x-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full h-dvh w-[280px] max-w-[85vw] bg-[#0D0F14] border-r border-white/5 z-50 
          flex flex-col transition-transform duration-300 ease-out will-change-transform
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/5 flex-shrink-0">
          <Link href="/candidates/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20 flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-white text-lg truncate">Fluenzy AI</div>
              <div className="text-xs text-violet-400 font-medium">Candidate Portal</div>
            </div>
          </Link>
          {/* Close button for mobile */}
          <button
            onClick={closeSidebar}
            className="p-2 -mr-2 rounded-xl hover:bg-white/10 active:bg-white/20 lg:hidden transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto overscroll-contain">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">Main Menu</p>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-3 sm:px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98]
                  ${active
                    ? "bg-violet-500/10 text-violet-300 border border-violet-500/20 shadow-lg shadow-violet-500/5"
                    : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent active:bg-white/10"
                  }`}
              >
                <span className={`flex-shrink-0 ${active ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300"}`}>
                  {item.icon}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-violet-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center font-semibold flex-shrink-0">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
                {active && <ChevronRight className="w-4 h-4 text-violet-400 flex-shrink-0" />}
              </Link>
            );
          })}

          <div className="pt-6">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">Account</p>
            {BOTTOM_NAV.map((item) => {
              const active = isActive(item.href);
              const isNotif = item.label === "Notifications";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 px-3 sm:px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98]
                    ${active
                      ? "bg-violet-500/10 text-violet-300 border border-violet-500/20"
                      : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent active:bg-white/10"
                    }`}
                >
                  <span className={`relative flex-shrink-0 ${active ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300"}`}>
                    {item.icon}
                    {isNotif && notifications > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#0D0F14]" />
                    )}
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {isNotif && notifications > 0 && (
                    <span className="bg-red-500/10 text-red-400 text-xs rounded-full px-2 py-0.5 font-semibold border border-red-500/20 flex-shrink-0">
                      {notifications}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Footer */}
        <div className="p-3 sm:p-4 border-t border-white/5 flex-shrink-0">
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
              className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 active:bg-red-500/20 transition-all flex-shrink-0"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 w-full lg:ml-[280px]">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-[#0A0C10]/90 backdrop-blur-xl border-b border-white/5 flex-shrink-0">
          <div className="flex items-center justify-between px-3 sm:px-4 lg:px-8 py-3 sm:py-4 gap-3">
            {/* Mobile menu button */}
            <button
              onClick={openSidebar}
              className="p-2 -ml-2 rounded-xl hover:bg-white/5 active:bg-white/10 lg:hidden transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6 text-slate-400" />
            </button>

            {/* Breadcrumb / Page Title */}
            <div className="hidden lg:flex items-center gap-2 text-sm min-w-0">
              <Link href="/candidates/dashboard" className="text-slate-500 hover:text-white transition-colors flex-shrink-0">
                Dashboard
              </Link>
              {pathname !== "/candidates/dashboard" && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  <span className="text-white font-medium capitalize truncate">
                    {pathname?.split("/").pop()?.replace(/-/g, " ")}
                  </span>
                </>
              )}
            </div>

            {/* Mobile page title */}
            <div className="lg:hidden flex-1 min-w-0 text-center">
              <span className="text-sm font-semibold text-white capitalize truncate">
                {pathname === "/candidates/dashboard" 
                  ? "Dashboard" 
                  : pathname?.split("/").pop()?.replace(/-/g, " ")}
              </span>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Notification bell */}
              <Link
                href="/candidates/dashboard/notifications"
                className="relative p-2 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors"
                aria-label={`Notifications${notifications > 0 ? ` (${notifications} unread)` : ''}`}
              >
                <Bell className="w-5 h-5 text-slate-400" />
                {notifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse ring-2 ring-[#0A0C10]" />
                )}
              </Link>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-[#13161E] border border-white/10 hover:border-violet-500/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden ring-2 ring-violet-500/20">
                    {candidate?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform hidden sm:block ${profileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown Menu */}
                <AnimatePresence>
                  {profileMenuOpen && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setProfileMenuOpen(false)} 
                      />
                      
                      {/* Dropdown */}
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#13161E] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden"
                      >
                        {/* User Info Header */}
                        <div className="p-4 sm:p-5 border-b border-white/5 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl sm:text-2xl ring-4 ring-violet-500/20 flex-shrink-0">
                              {candidate?.name?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                                {candidate?.name || "User"}
                              </h3>
                              <p className="text-sm text-slate-400 truncate">
                                {candidate?.email}
                              </p>
                              <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-slate-300 border border-white/10">
                                Candidate
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Links Grid */}
                        <div className="p-3 sm:p-4 grid grid-cols-2 gap-2">
                          <Link
                            href="/candidates/dashboard/profile"
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center gap-3 p-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white active:bg-white/10 transition-colors"
                          >
                            <User className="w-5 h-5 text-slate-500" />
                            <span className="text-sm font-medium">Profile</span>
                          </Link>
                          <Link
                            href="/candidates/dashboard/settings"
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center gap-3 p-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white active:bg-white/10 transition-colors"
                          >
                            <Settings className="w-5 h-5 text-slate-500" />
                            <span className="text-sm font-medium">Settings</span>
                          </Link>
                          <Link
                            href="/candidates/dashboard/applications"
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center gap-3 p-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white active:bg-white/10 transition-colors"
                          >
                            <History className="w-5 h-5 text-slate-500" />
                            <span className="text-sm font-medium">History</span>
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 p-3 rounded-xl text-red-400 hover:bg-red-500/10 active:bg-red-500/20 transition-colors"
                          >
                            <LogOut className="w-5 h-5" />
                            <span className="text-sm font-medium">Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
