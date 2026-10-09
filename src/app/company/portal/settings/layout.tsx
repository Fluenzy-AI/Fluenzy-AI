"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Building2,
  Image as ImageIcon,
  Zap,
  Cpu,
  UserCheck,
  CreditCard,
  Code2,
} from "lucide-react";

interface SubNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SETTINGS_NAV: SubNavItem[] = [
  { label: "Company Info", href: "/company/portal/settings/company", icon: Building2 },
  { label: "Branding", href: "/company/portal/settings/branding", icon: ImageIcon },
  { label: "Hiring Preferences", href: "/company/portal/settings/hiring", icon: Zap },
  { label: "HireLens Config", href: "/company/portal/settings/hirelens", icon: Cpu },
  { label: "Team & Permissions", href: "/company/portal/team", icon: UserCheck },
  { label: "Billing", href: "/company/portal/settings/billing", icon: CreditCard },
  { label: "API & Integrations", href: "/company/portal/settings/api", icon: Code2 },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Company Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your organization profile, hiring preferences, team permissions, and integrations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Sub-navigation */}
        <aside className="md:col-span-1 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-white/10 h-fit">
          {SETTINGS_NAV.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150",
                  isActive
                    ? "bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-sm"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </aside>

        {/* Settings Content Area */}
        <div className="md:col-span-3 bg-slate-900/60 rounded-xl border border-white/10 p-6 min-h-[450px]">
          {children}
        </div>
      </div>
    </div>
  );
}
