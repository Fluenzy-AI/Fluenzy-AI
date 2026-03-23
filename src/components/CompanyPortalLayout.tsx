"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCompanyAuth } from "@/contexts/CompanyAuthContext";

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: number;
  adminOnly?: boolean;
}

interface CompanyPortalLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  title: string;
}

export default function CompanyPortalLayout({ children, navItems, title }: CompanyPortalLayoutProps) {
  const { user, company, logout } = useCompanyAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter((item) => {
    if (item.adminOnly && user?.role !== "ADMIN") return false;
    return true;
  });

  const getRoleColor = () => {
    switch (user?.role) {
      case "ADMIN":
        return "text-emerald-400";
      case "HIRING_MANAGER":
        return "text-blue-400";
      case "HR_RECRUITER":
        return "text-purple-400";
      default:
        return "text-slate-400";
    }
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case "ADMIN":
        return "Admin";
      case "HIRING_MANAGER":
        return "Hiring Manager";
      case "HR_RECRUITER":
        return "HR Recruiter";
      default:
        return "Member";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 border-r border-white/5 z-30 transform transition-transform duration-200 flex flex-col
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Company Logo & Name */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} className="w-9 h-9 rounded-xl object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">{company?.name?.[0]?.toUpperCase() || "C"}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-sm truncate">{company?.name || "Company"}</div>
              <div className="text-xs text-slate-500 truncate">@{company?.domain}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/company/portal" && pathname?.startsWith(item.href + "/"));
            const isExact = pathname === item.href;
            const shouldHighlight = item.href === "/company/portal" ? isExact : active;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                  ${shouldHighlight
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
              >
                <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-300 font-semibold text-sm flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || "User"}</p>
              <p className={`text-xs truncate ${getRoleColor()}`}>{getRoleLabel()}</p>
            </div>
            <button
              onClick={logout}
              className="text-slate-500 hover:text-red-400 transition-colors p-1 flex-shrink-0"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-14 border-b border-white/5 bg-slate-900/50 backdrop-blur flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-10">
          <button
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-sm font-semibold text-slate-300 flex-1">{title}</h1>
          <div className="flex items-center gap-2">
            <span className={`hidden sm:inline text-xs px-2 py-1 rounded-full ${getRoleColor()} bg-white/5 border border-white/10`}>
              {getRoleLabel()}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
