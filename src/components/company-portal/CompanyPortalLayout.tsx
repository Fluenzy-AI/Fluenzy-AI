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
  ChevronRight,
  Sparkles,
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

  const getRoleBadge = () => {
    switch (user?.role) {
      case "ADMIN":
        return { label: "Company Admin", bg: "bg-purple-500/15 border-purple-500/30 text-purple-300" };
      case "HIRING_MANAGER":
        return { label: "Hiring Manager", bg: "bg-blue-500/15 border-blue-500/30 text-blue-300" };
      case "HR_RECRUITER":
        return { label: "HR Recruiter", bg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" };
      default:
        return { label: "Recruiter Member", bg: "bg-slate-500/15 border-slate-500/30 text-slate-300" };
    }
  };

  const roleInfo = getRoleBadge();

  // Filter items by role permissions
  const visibleNavItems = COMPANY_NAV_ITEMS.filter((item) => {
    if (item.adminOnly && user?.role !== "ADMIN") return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex portal-dark font-sans selection:bg-purple-500/30 selection:text-purple-200">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Global Canonical Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 border-r border-white/10 z-50 transform transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Branding & Company Header */}
        <div className="p-5 border-b border-white/10 flex-shrink-0 bg-slate-900/80">
          <div className="flex items-center gap-3">
            {company?.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="w-10 h-10 rounded-xl object-cover border border-white/10 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-950/50 border border-white/10">
                <span className="text-white font-extrabold text-base">
                  {company?.name?.[0]?.toUpperCase() || "C"}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-white text-sm truncate tracking-tight">
                  {company?.name || "Company Workspace"}
                </h2>
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
              </div>
              <p className="text-xs text-slate-400 truncate font-mono">
                @{company?.domain || "fluenzyai.com"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto min-h-0 custom-scrollbar">
          {COMPANY_NAV_SECTIONS.map((section) => {
            const sectionItems = visibleNavItems.filter((item) => item.section === section.id);
            if (sectionItems.length === 0) return null;

            return (
              <div key={section.id} className="space-y-1">
                <div className="px-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                  {section.title}
                </div>
                <div className="space-y-0.5 mt-1.5">
                  {sectionItems.map((item) => {
                    const active = isCompanyNavItemActive(pathname, item);

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group relative ${
                          active
                            ? "bg-gradient-to-r from-purple-600/25 to-indigo-600/15 text-purple-200 border border-purple-500/30 shadow-sm shadow-purple-950/30 font-semibold"
                            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                        }`}
                      >
                        <span
                          className={`flex-shrink-0 transition-colors ${
                            active ? "text-purple-300" : "text-slate-400 group-hover:text-slate-200"
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="bg-purple-600 text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold">
                            {item.badge}
                          </span>
                        )}
                        {active && (
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 absolute left-1" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Public Portal Link Quick Action */}
        {company?.slug && (
          <div className="px-3 py-2 border-t border-white/5 bg-slate-900/50">
            <a
              href={`/careers/${company.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 text-xs font-medium transition-colors group"
            >
              <span className="flex items-center gap-2 truncate">
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                <span className="truncate">Public Careers Page</span>
              </span>
              <ExternalLink className="w-3 h-3 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        )}

        {/* User Profile Footer */}
        <div className="p-3 border-t border-white/10 bg-slate-950/60 flex-shrink-0">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 border border-purple-400/30 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name || "Company Member"}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors p-1.5 rounded-lg flex-shrink-0"
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
        {/* Sticky Top Header Bar */}
        <header className="h-14 border-b border-white/10 bg-slate-900/80 backdrop-blur-md flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-30">
          <button
            className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumbs / Title */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xs text-slate-400 hidden sm:inline-flex items-center gap-1.5 font-medium">
              <span>{company?.name || "Company"}</span>
              <ChevronRight className="w-3 h-3 text-slate-600" />
            </span>
            <h1 className="text-sm font-bold text-white truncate tracking-tight">{title}</h1>
          </div>

          {/* User Role & Company Status Badges */}
          <div className="flex items-center gap-2.5">
            <span className={`hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${roleInfo.bg}`}>
              <Sparkles className="w-3 h-3" />
              {roleInfo.label}
            </span>
            {company?.autoApplyEnabled && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Auto-Apply Active
              </span>
            )}
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
