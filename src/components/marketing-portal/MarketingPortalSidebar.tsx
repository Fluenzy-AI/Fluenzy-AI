"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Mail,
  Users,
  Zap,
  BarChart3,
  History,
  FileText,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  Megaphone,
} from "lucide-react";

interface MarketingPortalSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  {
    title: "Dashboard",
    href: "/portal/marketing",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: "Campaigns",
    href: "/portal/marketing/campaigns",
    icon: Mail,
  },
  {
    title: "Segments",
    href: "/portal/marketing/segments",
    icon: Users,
  },
  {
    title: "Automation",
    href: "/portal/marketing/automation",
    icon: Zap,
  },
  {
    title: "Analytics",
    href: "/portal/marketing/analytics",
    icon: BarChart3,
  },
  {
    title: "Email Logs",
    href: "/portal/marketing/email-logs",
    icon: History,
  },
  {
    title: "Templates",
    href: "/portal/marketing/templates",
    icon: FileText,
  },
  {
    title: "AI Generator",
    href: "/portal/marketing/ai-generator",
    icon: Sparkles,
  },
  {
    title: "Settings",
    href: "/portal/marketing/settings",
    icon: Settings,
  },
];

export function MarketingPortalSidebar({ collapsed, onToggle }: MarketingPortalSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300 bg-slate-900/95 backdrop-blur-xl border-r border-white/5",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/5">
        <Link href="/portal/marketing" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/20">
            <Megaphone className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">Marketing</span>
              <span className="text-[10px] text-purple-400">Portal</span>
            </div>
          )}
        </Link>
        <button
          onClick={onToggle}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto h-[calc(100vh-4rem)]">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30"
                  : "text-slate-400 hover:bg-white/5 hover:text-white",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.title : undefined}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-purple-400")} />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Version */}
      {!collapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-3">
            <p className="text-xs text-slate-400">Marketing Portal</p>
            <p className="text-xs text-purple-400 font-medium">v1.0.0</p>
          </div>
        </div>
      )}
    </aside>
  );
}
