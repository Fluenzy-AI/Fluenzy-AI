"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCompanyAuth } from "@/contexts/CompanyAuthContext";
import {
  COMPANY_NAV_SECTIONS,
  COMPANY_NAV_ITEMS,
  isCompanyNavItemActive,
  getPageTitleFromPath,
} from "./companyNavConfig";
import {
  LogOut,
  Menu,
  ExternalLink,
  Building2,
  ShieldCheck,
} from "lucide-react";

interface CompanyPortalLayoutProps {
  children: React.ReactNode;
}

export default function CompanyPortalLayout({ children }: CompanyPortalLayoutProps) {
  const { user, company, logout } = useCompanyAuth();
  const pathname = usePathname() || "/company/portal";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const title = getPageTitleFromPath(pathname);

  const getRoleLabel = () => {
    switch (user?.role) {
      case "ADMIN":
        return "Company Admin";
      case "HIRING_MANAGER":
        return "Hiring Manager";
      case "HR_RECRUITER":
        return "HR Recruiter";
      default:
        return "Company Member";
    }
  };

  const roleLabel = getRoleLabel();

  // Filter items by role permissions
  const visibleNavItems = COMPANY_NAV_ITEMS.filter((item) => {
    if (item.adminOnly && user?.role !== "ADMIN") return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white flex select-none">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Canonical Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 border-r border-white/5 z-30 transform transition-transform duration-200 lg:translate-x-0 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Branding Header */}
        <div className="p-6 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            {company?.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="w-8 h-8 rounded-xl object-cover border border-white/10 flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-purple-300 font-extrabold text-xs">
                  {company?.name?.[0]?.toUpperCase() || "C"}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <h2 className="font-bold text-white text-sm truncate tracking-tight">
                  {company?.name || "Company Portal"}
                </h2>
              </div>
              <p className="text-xs text-purple-400 font-medium truncate">
                @{company?.domain || "fluenzyai.com"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-4 overflow-y-auto min-h-0 custom-scrollbar">
          {COMPANY_NAV_SECTIONS.map((section) => {
            const sectionItems = visibleNavItems.filter((item) => item.section === section.id);
            if (sectionItems.length === 0) return null;

            return (
              <div key={section.id} className="space-y-1">
                <div className="px-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                  {section.title}
                </div>
                <div className="space-y-0.5 mt-1">
                  {sectionItems.map((item) => {
                    const active = isCompanyNavItemActive(pathname, item);

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${
                          active
                            ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-medium shadow-sm"
                            : "text-slate-400 hover:bg-white/5 hover:text-white font-normal"
                        }`}
                      >
                        <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                          {item.icon}
                        </span>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="bg-purple-600 text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {company?.slug && (
            <div className="pt-2">
              <a
                href={`/careers/${company.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors group"
              >
                <span className="flex items-center gap-2 truncate">
                  <Building2 className="w-3.5 h-3.5 text-purple-400" />
                  <span className="truncate">Public Careers Page</span>
                </span>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          )}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/30 flex items-center justify-center text-purple-300 font-semibold text-sm flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || "Company Member"}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="text-slate-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/5 flex-shrink-0"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
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
            <Menu className="w-5 h-5" />
          </button>
          
          {title && <h1 className="text-sm font-semibold text-slate-200 flex-1 truncate">{title}</h1>}
          {!title && <div className="flex-1" />}

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs font-medium px-2.5 py-1 rounded-full text-purple-400 bg-white/5 border border-white/10">
              {roleLabel}
            </span>
            {company?.autoApplyEnabled && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full text-emerald-400 bg-white/5 border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Auto-Apply Active
              </span>
            )}
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
