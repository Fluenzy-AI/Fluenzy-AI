"use client";

import React, { useState, useEffect } from "react";
import PortalSidebar from "./PortalSidebar";
import CommandPalette from "./CommandPalette";
import "@/app/company/portal/portal-tokens.css";

import { useTheme } from "@/contexts/ThemeContext";

interface PortalLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function PortalLayout({ children, title }: PortalLayoutProps) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { resolvedTheme } = useTheme();

  // Sync with sidebar collapse state
  useEffect(() => {
    const saved = localStorage.getItem("portal-sidebar-collapsed");
    if (saved === "true") setSidebarCollapsed(true);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "portal-sidebar-collapsed") {
        setSidebarCollapsed(e.newValue === "true");
      }
    };
    window.addEventListener("storage", handleStorage);

    // Also observe via interval since same-tab storage events don't fire
    const interval = setInterval(() => {
      const current = localStorage.getItem("portal-sidebar-collapsed") === "true";
      setSidebarCollapsed(current);
    }, 300);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      id="portal-root"
      data-portal-theme={resolvedTheme}
      className="min-h-screen flex"
      style={{
        backgroundColor: "var(--portal-bg-base)",
        color: "var(--portal-text-primary)",
      }}
    >
      {/* Sidebar */}
      <PortalSidebar onOpenCommandPalette={() => setCommandPaletteOpen(true)} />

      {/* Main content area */}
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-200"
        style={{
          marginLeft: sidebarCollapsed ? "60px" : "240px",
        }}
      >
        {/* Top bar */}
        <header
          className="h-14 border-b flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-20"
          style={{
            backgroundColor: "var(--portal-bg-raised)",
            borderColor: "var(--portal-border)",
          }}
        >
          {/* Mobile hamburger space */}
          <div className="lg:hidden w-8" />

          {/* Page breadcrumb / title */}
          <h1
            className="text-sm font-medium flex-1"
            style={{ color: "var(--portal-text-secondary)" }}
          >
            {title}
          </h1>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* Responsive: hide sidebar margin on mobile */}
      <style jsx>{`
        @media (max-width: 1023px) {
          div[style*="margin-left"] {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
