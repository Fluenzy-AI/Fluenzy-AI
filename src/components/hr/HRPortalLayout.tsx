"use client";

import React, { useState } from "react";
import HRSidebar from "./HRSidebar";

interface HRPortalLayoutProps {
  children: React.ReactNode;
  title?: string;
  roleLabel?: string;
  roleColor?: string;
}

export default function HRPortalLayout({
  children,
  title,
  roleLabel = "HR Portal",
  roleColor = "text-emerald-400",
}: HRPortalLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Canonical Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 z-30 transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <HRSidebar onMobileClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-white/5 bg-slate-900/50 backdrop-blur flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-10">
          <button
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {title && <h1 className="text-sm font-semibold text-slate-200 flex-1 truncate">{title}</h1>}
          {!title && <div className="flex-1" />}
          <div className="flex items-center gap-2">
            <span className={`hidden sm:inline text-xs font-medium px-2.5 py-1 rounded-full ${roleColor} bg-white/5 border border-white/10`}>
              {roleLabel}
            </span>
          </div>
        </header>

        {/* Main Content Container */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
