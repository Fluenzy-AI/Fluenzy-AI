"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { HR_NAV_ITEMS, isHRNavItemActive } from "./hrNavConfig";

interface HRSidebarProps {
  onMobileClose?: () => void;
}

export default function HRSidebar({ onMobileClose }: HRSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = usePortalAuth();

  return (
    <aside className="h-full w-64 bg-slate-900 border-r border-white/5 flex flex-col select-none text-white">
      {/* Branding Header (Fixed top) */}
      <div className="p-6 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-xl bg-slate-900/90 border border-purple-500/20 shadow-md shadow-purple-900/20 flex items-center justify-center flex-shrink-0">
            <img src="/white-removebg-preview1.png" alt="Fluenzy AI Logo" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <div className="font-extrabold bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-400 !bg-clip-text text-transparent text-sm leading-tight">
              Fluenzy AI
            </div>
            <div className="text-xs font-medium text-emerald-400">HR Portal</div>
          </div>
        </div>
      </div>

      {/* Navigation Links (Scrollable if viewport is small) */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0 custom-scrollbar">
        {HR_NAV_ITEMS.map((item) => {
          const active = isHRNavItemActive(pathname || "", item);
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => onMobileClose?.()}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                active
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-medium shadow-sm"
                  : "text-slate-400 hover:bg-white/5 hover:text-white font-normal"
              }`}
            >
              <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">{item.icon}</span>
              <span className="flex-1 truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Footer (Fixed bottom) */}
      <div className="p-4 border-t border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-semibold text-sm flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || "HR Manager"}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email || "hr@fluenzyai.com"}</p>
          </div>
          <button
            onClick={logout}
            className="text-slate-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/5 flex-shrink-0"
            title="Logout"
            aria-label="Logout"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
