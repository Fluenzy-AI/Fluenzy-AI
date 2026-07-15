"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PortalLayout } from "@/components/portal";
import { cn } from "@/lib/utils";
import {
  Building2,
  Image as ImageIcon,
  Zap,
  Cpu,
  ShieldAlert,
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
  { label: "Team & Permissions", href: "/company/portal/settings/team", icon: ShieldAlert },
  { label: "Billing", href: "/company/portal/settings/billing", icon: CreditCard },
  { label: "API & Integrations", href: "/company/portal/settings/api", icon: Code2 },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <PortalLayout title="Company Settings">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--portal-text-primary)" }}>
            Settings
          </h1>
          <p className="text-sm" style={{ color: "var(--portal-text-muted)" }}>
            Manage your company profile, preferences, and integrations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left Sub-nav */}
          <aside className="md:col-span-1 space-y-1">
            {SETTINGS_NAV.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[var(--portal-primary-muted)] text-[var(--portal-primary)]"
                      : "text-[var(--portal-text-secondary)] hover:bg-[var(--portal-sidebar-hover)] hover:text-[var(--portal-text-primary)]"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </aside>

          {/* Settings Content Area */}
          <main
            className="md:col-span-3 rounded-lg border p-6 min-h-[400px]"
            style={{
              backgroundColor: "var(--portal-bg-elevated)",
              borderColor: "var(--portal-border)",
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </PortalLayout>
  );
}
