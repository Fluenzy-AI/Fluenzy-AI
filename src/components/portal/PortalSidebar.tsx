"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCompanyAuth } from "@/contexts/CompanyAuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  ScanFace,
  UserPlus,
  Settings,
  BarChart3,
  Search,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Sun,
  Moon,
  ChevronDown,
} from "lucide-react";

import { useTheme } from "@/contexts/ThemeContext";

/* ─── Types ─── */
interface NavSection {
  label?: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  badge?: number;
}

/* ─── Centralized Navigation Config ─── */
export const PORTAL_NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/company/portal", icon: <LayoutDashboard className="w-4 h-4" /> },
    ],
  },
  {
    label: "Hiring",
    items: [
      { label: "Job Postings", href: "/company/portal/jobs", icon: <Briefcase className="w-4 h-4" /> },
      { label: "Applications", href: "/company/portal/applications", icon: <Users className="w-4 h-4" /> },
    ],
  },
  {
    label: "Evaluate",
    items: [
      { label: "Assessments", href: "/company/portal/assessments", icon: <FileText className="w-4 h-4" /> },
      { label: "HireLens AI", href: "/company/portal/hirelens", icon: <ScanFace className="w-4 h-4" /> },
    ],
  },
  {
    items: [
      { label: "Team", href: "/company/portal/team", icon: <UserPlus className="w-4 h-4" />, adminOnly: true },
      { label: "Analytics", href: "/company/portal/analytics", icon: <BarChart3 className="w-4 h-4" /> },
    ],
  },
  {
    items: [
      { label: "Settings", href: "/company/portal/settings", icon: <Settings className="w-4 h-4" />, adminOnly: true },
    ],
  },
];

/* Flat nav items for backward compat */
export const PORTAL_NAV_FLAT = PORTAL_NAV_SECTIONS.flatMap((s) => s.items);

/* ─── Component ─── */
interface PortalSidebarProps {
  onOpenCommandPalette?: () => void;
}

export default function PortalSidebar({ onOpenCommandPalette }: PortalSidebarProps) {
  const { user, company, logout } = useCompanyAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  // Persist collapse state
  useEffect(() => {
    const saved = localStorage.getItem("portal-sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("portal-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  // ⌘K shortcut
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenCommandPalette?.();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onOpenCommandPalette]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = useCallback(
    (href: string) => {
      if (href === "/company/portal") return pathname === href;
      return pathname === href || pathname?.startsWith(href + "/");
    },
    [pathname]
  );

  const getRoleLabel = () => {
    switch (user?.role) {
      case "ADMIN": return "Admin";
      case "HIRING_MANAGER": return "Hiring Manager";
      case "HR_RECRUITER": return "Recruiter";
      default: return "Member";
    }
  };

  const filteredSections = PORTAL_NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (item.adminOnly && user?.role !== "ADMIN") return false;
      return true;
    }),
  })).filter((section) => section.items.length > 0);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* ── Workspace Switcher ── */}
      <div className={cn("border-b border-[var(--portal-border)] transition-all", collapsed ? "p-3" : "p-4")}>
        <div className="flex items-center gap-3">
          {company?.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={company.name}
              className={cn("rounded-lg object-cover flex-shrink-0", collapsed ? "w-8 h-8" : "w-9 h-9")}
            />
          ) : (
            <div
              className={cn(
                "rounded-lg flex items-center justify-center flex-shrink-0",
                "bg-[var(--portal-primary)] text-white font-bold",
                collapsed ? "w-8 h-8 text-xs" : "w-9 h-9 text-sm"
              )}
            >
              {company?.name?.[0]?.toUpperCase() || "C"}
            </div>
          )}
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="flex-1 min-w-0"
            >
              <div className="font-semibold text-[var(--portal-text-primary)] text-sm truncate">
                {company?.name || "Company"}
              </div>
              <div className="text-xs text-[var(--portal-text-muted)] truncate">
                {getRoleLabel()}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Search trigger ── */}
      <div className={cn("border-b border-[var(--portal-border)]", collapsed ? "p-2" : "px-3 py-2")}>
        <button
          onClick={onOpenCommandPalette}
          className={cn(
            "w-full flex items-center gap-2 rounded-md transition-colors",
            "text-[var(--portal-text-muted)] hover:text-[var(--portal-text-secondary)]",
            "hover:bg-[var(--portal-sidebar-hover)]",
            collapsed ? "p-2 justify-center" : "px-3 py-2"
          )}
          title="Search (⌘K)"
        >
          <Search className="w-4 h-4 flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="text-sm flex-1 text-left">Search…</span>
              <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded border border-[var(--portal-border)] text-[var(--portal-text-muted)] font-mono">
                ⌘K
              </kbd>
            </>
          )}
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {filteredSections.map((section, sIdx) => (
          <div key={sIdx}>
            {section.label && !collapsed && (
              <div className="px-3 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--portal-text-muted)]">
                {section.label}
              </div>
            )}
            {section.label && collapsed && sIdx > 0 && (
              <div className="mx-2 my-2 border-t border-[var(--portal-border)]" />
            )}
            {section.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-md text-sm font-medium transition-all duration-150",
                    collapsed ? "p-2 justify-center" : "px-3 py-2",
                    active
                      ? "text-[var(--portal-primary)] bg-[var(--portal-sidebar-active)]"
                      : "text-[var(--portal-text-secondary)] hover:bg-[var(--portal-sidebar-hover)] hover:text-[var(--portal-text-primary)]"
                  )}
                >
                  {/* Active rail indicator */}
                  {active && (
                    <motion.div
                      layoutId="sidebar-active-rail"
                      className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full bg-[var(--portal-primary)]"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                  {!collapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--portal-danger)] text-white min-w-[18px] text-center">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Bottom Controls ── */}
      <div className="border-t border-[var(--portal-border)] p-2 space-y-1">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className={cn(
            "w-full flex items-center gap-3 rounded-md transition-colors",
            "text-[var(--portal-text-muted)] hover:text-[var(--portal-text-secondary)]",
            "hover:bg-[var(--portal-sidebar-hover)]",
            collapsed ? "p-2 justify-center" : "px-3 py-2"
          )}
          title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="w-4 h-4 flex-shrink-0" />
          ) : (
            <Moon className="w-4 h-4 flex-shrink-0" />
          )}
          {!collapsed && <span className="text-sm">{resolvedTheme === "dark" ? "Light mode" : "Dark mode"}</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full flex items-center gap-3 rounded-md transition-colors",
            "text-[var(--portal-text-muted)] hover:text-[var(--portal-text-secondary)]",
            "hover:bg-[var(--portal-sidebar-hover)]",
            collapsed ? "p-2 justify-center" : "px-3 py-2"
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="w-4 h-4 flex-shrink-0" />
          ) : (
            <PanelLeftClose className="w-4 h-4 flex-shrink-0" />
          )}
          {!collapsed && <span className="text-sm">Collapse</span>}
        </button>
      </div>

      {/* ── User Footer ── */}
      <div className={cn("border-t border-[var(--portal-border)]", collapsed ? "p-2" : "p-3")}>
        <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[var(--portal-primary-muted)] flex items-center justify-center text-[var(--portal-primary)] font-semibold text-sm flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--portal-text-primary)] truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-[var(--portal-text-muted)] truncate">
                {getRoleLabel()}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="text-[var(--portal-text-muted)] hover:text-[var(--portal-danger)] transition-colors p-1.5 rounded-md hover:bg-[var(--portal-sidebar-hover)] flex-shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile trigger (placed in the top bar, triggered externally) */}
      <button
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-md bg-[var(--portal-bg-raised)] border border-[var(--portal-border)] text-[var(--portal-text-secondary)]"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <PanelLeft className="w-5 h-5" />
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full z-50 lg:z-30",
          "bg-[var(--portal-sidebar-bg)] border-r border-[var(--portal-border)]",
          "transition-all duration-200 ease-out",
          // Desktop
          "hidden lg:flex lg:flex-col",
          collapsed ? "lg:w-[60px]" : "lg:w-[240px]",
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-0 left-0 h-full w-[240px] z-50 lg:hidden bg-[var(--portal-sidebar-bg)] border-r border-[var(--portal-border)] flex flex-col"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
