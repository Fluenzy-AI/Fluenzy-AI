"use client";

import { useEffect, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

const HR_NAV = [
  { label: "Dashboard", href: "/portal/hr", icon: <HomeIcon /> },
  { label: "Employees", href: "/portal/hr/employees", icon: <UsersIcon /> },
  { label: "Candidates", href: "/portal/hr/candidates", icon: <UserPlusIcon /> },
  { label: "Interviews", href: "/portal/hr/interviews", icon: <CalendarIcon /> },
  { label: "Leave Management", href: "/portal/hr/leaves", icon: <ClockIcon /> },
  { label: "Attendance", href: "/portal/hr/attendance", icon: <CheckSquareIcon /> },
  { label: "Payroll", href: "/portal/hr/payroll", icon: <BanknotesIcon /> },
  { label: "Offer Letters", href: "/portal/hr/offer-letters", icon: <DocumentIcon /> },
  { label: "Send Email", href: "/portal/hr/send-email", icon: <MailIcon /> },
  { label: "Email History", href: "/portal/hr/email-logs", icon: <MailOpenIcon /> },
];

interface HRAnalytics {
  overview: {
    totalEmployees: number;
    activeEmployees: number;
    onLeave: number;
    terminated: number;
    totalCandidates: number;
    pendingLeaves: number;
    thisMonthHires: number;
    thisMonthJoins: number;
  };
  departmentBreakdown: Array<{ department: string; count: number }>;
  candidatesByStatus: Array<{ status: string; count: number }>;
  recentLeaves: Array<{ id: string; type: string; status: string; days: number; employee: { name: string; department: string } }>;
  payroll: { totalNetThisMonth: number; processedCount: number };
}

export default function HRDashboard() {
  const { user, loading } = usePortalAuth();
  const [analytics, setAnalytics] = useState<HRAnalytics | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) { router.push("/portal/login"); return; }
    if (user) fetchAnalytics();
  }, [user, loading, router]);

  async function fetchAnalytics() {
    try {
      const res = await fetch("/api/portal/hr/analytics", { credentials: "include" });
      if (res.ok) setAnalytics(await res.json());
    } catch { /* silent */ }
    finally { setLoadingData(false); }
  }

  if (loading || loadingData) {
    return (
      <PortalLayout navItems={HR_NAV} title="HR Dashboard" roleLabel="HR Portal" roleColor="text-emerald-400">
        <DashboardSkeleton />
      </PortalLayout>
    );
  }

  const o = analytics?.overview;

  const statCards = [
    { label: "Total Employees", value: o?.totalEmployees ?? 0, icon: <UsersIcon />, color: "bg-blue-500/10 text-blue-400", change: `+${o?.thisMonthHires ?? 0} this month` },
    { label: "Active", value: o?.activeEmployees ?? 0, icon: <CheckSquareIcon />, color: "bg-green-500/10 text-green-400" },
    { label: "On Leave", value: o?.onLeave ?? 0, icon: <ClockIcon />, color: "bg-yellow-500/10 text-yellow-400" },
    { label: "Pending Leaves", value: o?.pendingLeaves ?? 0, icon: <BellIcon />, color: "bg-red-500/10 text-red-400", href: "/portal/hr/leaves?status=PENDING" },
    { label: "Candidates", value: o?.totalCandidates ?? 0, icon: <UserPlusIcon />, color: "bg-purple-500/10 text-purple-400", href: "/portal/hr/candidates" },
    { label: "Joined This Month", value: o?.thisMonthJoins ?? 0, icon: <TrendIcon />, color: "bg-indigo-500/10 text-indigo-400" },
  ];

  return (
    <PortalLayout navItems={HR_NAV} title="HR Dashboard" roleLabel="HR Portal" roleColor="text-emerald-400">
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-xl font-bold text-white">Welcome back, {user?.name?.split(" ")[0]}! 👋</h2>
          <p className="text-slate-400 text-sm mt-0.5">{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Breakdown */}
          <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Department Breakdown</h3>
              <Link href="/portal/hr/employees" className="text-xs text-indigo-400 hover:text-indigo-300 transition">View all →</Link>
            </div>
            {analytics?.departmentBreakdown?.length ? (
              <div className="space-y-3">
                {analytics.departmentBreakdown.slice(0, 6).map((dept) => {
                  const pct = o?.totalEmployees ? Math.round((dept.count / o.totalEmployees) * 100) : 0;
                  return (
                    <div key={dept.department}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300">{dept.department}</span>
                        <span className="text-slate-400">{dept.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No department data yet.</p>
            )}
          </div>

          {/* Recent Leave Requests */}
          <div className="bg-slate-900 rounded-2xl border border-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Recent Leaves</h3>
              <Link href="/portal/hr/leaves" className="text-xs text-indigo-400 hover:text-indigo-300 transition">Manage →</Link>
            </div>
            <div className="space-y-3">
              {analytics?.recentLeaves?.length ? (
                analytics.recentLeaves.map((leave) => (
                  <div key={leave.id} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${leave.status === "PENDING" ? "bg-yellow-400" : leave.status === "APPROVED" ? "bg-green-400" : "bg-red-400"}`} />
                    <div>
                      <p className="text-sm text-slate-300">{leave.employee.name}</p>
                      <p className="text-xs text-slate-500">{leave.type} · {leave.days}d · <span className={leave.status === "PENDING" ? "text-yellow-400" : leave.status === "APPROVED" ? "text-green-400" : "text-red-400"}>{leave.status}</span></p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm">No recent leave requests.</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-900 rounded-2xl border border-white/5 p-5">
          <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Add Employee", href: "/portal/hr/employees/new", icon: <UsersIcon />, color: "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400" },
              { label: "Add Candidate", href: "/portal/hr/candidates/new", icon: <UserPlusIcon />, color: "bg-purple-500/10 hover:bg-purple-500/20 text-purple-400" },
              { label: "Mark Attendance", href: "/portal/hr/attendance", icon: <CheckSquareIcon />, color: "bg-green-500/10 hover:bg-green-500/20 text-green-400" },
              { label: "Send Email", href: "/portal/hr/send-email", icon: <MailIcon />, color: "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400" },
            ].map((action) => (
              <Link key={action.label} href={action.href}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-white/5 text-sm font-medium transition-all cursor-pointer ${action.color}`}
              >
                <span className="w-5 h-5">{action.icon}</span>
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Payroll summary */}
        {analytics?.payroll && (
          <div className="bg-slate-900 rounded-2xl border border-white/5 p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white">Payroll This Month</h3>
              <Link href="/portal/hr/payroll" className="text-xs text-indigo-400 hover:text-indigo-300 transition">Details →</Link>
            </div>
            <div className="flex gap-8">
              <div>
                <p className="text-2xl font-bold text-white">₹{analytics.payroll.totalNetThisMonth.toLocaleString()}</p>
                <p className="text-slate-500 text-sm">Total Net Payroll</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{analytics.payroll.processedCount}</p>
                <p className="text-slate-500 text-sm">Records Processed</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}

function StatCard({ label, value, icon, color, change, href }: {
  label: string; value: number; icon: React.ReactNode; color: string; change?: string; href?: string;
}) {
  const content = (
    <div className={`bg-slate-900 rounded-2xl border border-white/5 p-4 hover:border-white/10 transition-all ${href ? "cursor-pointer" : ""}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <span className="w-4 h-4">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-slate-400 text-xs mt-0.5">{label}</p>
      {change && <p className="text-xs text-slate-500 mt-1">{change}</p>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-white/5 rounded-xl w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-white/5 rounded-2xl" />
    </div>
  );
}

// Icons
function HomeIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>; }
function UsersIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>; }
function UserPlusIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>; }
function CalendarIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }
function ClockIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function CheckSquareIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>; }
function BanknotesIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>; }
function DocumentIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>; }
function MailIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>; }
function MailOpenIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0L9.75 14.5" /></svg>; }
function BellIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>; }
function TrendIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>; }
