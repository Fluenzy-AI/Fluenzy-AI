"use client";

import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { Bell, LogOut, User, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function MarketingPortalHeader() {
  const { user, logout } = usePortalAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left side - Page title */}
        <div>
          <h1 className="text-lg font-semibold text-white">Marketing Portal</h1>
          <p className="text-xs text-slate-400">Manage campaigns, segments & automation</p>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white">
              3
            </span>
          </button>

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2 hover:bg-white/10 transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-full w-full rounded-lg object-cover" />
                ) : (
                  <User className="h-4 w-4 text-white" />
                )}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-white">{user?.name || "Marketing Admin"}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-xl">
                <div className="p-3 border-b border-white/5">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                  <span className="mt-2 inline-flex items-center rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-400">
                    Marketing Admin
                  </span>
                </div>
                <div className="p-2">
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
