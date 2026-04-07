"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BarChart2,
  CreditCard,
  Settings,
  LogOut,
  Building2,
  ChevronRight,
  GraduationCap,
  Bell,
  Trophy,
} from "lucide-react";
import { useCollegeAdmin } from "@/contexts/CollegeAdminContext";

const NAV_ITEMS = [
  { href: "/college/dashboard",      label: "Dashboard",    icon: LayoutDashboard },
  { href: "/college/competitions",   label: "Competitions", icon: Trophy },
  { href: "/college/students",       label: "Students",     icon: Users },
  { href: "/college/batches",        label: "Batches",      icon: GraduationCap },
  { href: "/college/analytics",      label: "Analytics",    icon: BarChart2 },
  { href: "/college/notifications",  label: "Notifications", icon: Bell },
  { href: "/college/billing",        label: "Billing & Plan", icon: CreditCard },
  { href: "/college/settings",       label: "Settings",     icon: Settings },
];

export default function CollegeSidebar() {
  const pathname = usePathname();
  const { admin, logout } = useCollegeAdmin();

  return (
    <aside className="w-64 min-h-screen bg-[#0d1424]/95 border-r border-slate-700/40 flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-slate-700/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">{admin?.collegeName ?? "College Portal"}</p>
            <p className="text-slate-400 text-xs truncate">@{admin?.domain}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                active
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/40"
              }`}>
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`} />
              {label}
              {active && <ChevronRight className="w-3 h-3 ml-auto text-indigo-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Seats Usage */}
      {admin && (
        <div className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400 font-medium">Seat Usage</p>
            <span className="text-xs text-indigo-300 font-semibold">{admin.usedSeats}/{admin.totalSeats > 0 ? admin.totalSeats : "∞"} seats</span>
          </div>
          <div className="bg-slate-700 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all"
              style={{ width: admin.totalSeats > 0 ? `${Math.min(100, (admin.usedSeats / admin.totalSeats) * 100)}%` : "0%" }}
            />
          </div>
        </div>
      )}

      {/* Admin info + logout */}
      <div className="p-3 border-t border-slate-700/40">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex-shrink-0">
            <span className="text-indigo-300 text-xs font-bold">{admin?.adminName?.[0]?.toUpperCase() ?? "A"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-200 text-xs font-medium truncate">{admin?.adminName}</p>
            <p className="text-slate-500 text-xs truncate">{admin?.designation}</p>
          </div>
        </div>
        <button onClick={logout}
          className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
