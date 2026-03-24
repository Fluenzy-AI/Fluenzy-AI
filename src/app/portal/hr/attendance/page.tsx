"use client";

import { useEffect, useState, useCallback } from "react";
import PortalLayout from "@/components/PortalLayout";
import { usePortalAuth } from "@/contexts/PortalAuthContext";

const HR_NAV = [
  { label: "Dashboard", href: "/portal/hr" },
  { label: "Employees", href: "/portal/hr/employees" },
  { label: "Candidates", href: "/portal/hr/candidates" },
  { label: "Interviews", href: "/portal/hr/interviews" },
  { label: "Leave Requests", href: "/portal/hr/leaves" },
  { label: "Attendance", href: "/portal/hr/attendance" },
  { label: "Payroll", href: "/portal/hr/payroll" },
  { label: "Offer Letters", href: "/portal/hr/offer-letters" },
  { label: "Certificates", href: "/portal/hr/certificates" },
  { label: "Send Email", href: "/portal/hr/send-email" },
  { label: "Email Logs", href: "/portal/hr/email-logs" },
  { label: "Manage Jobs", href: "/portal/hr/jobs" },
  { label: "Assessments", href: "/portal/hr/assessments", icon: <ClipboardCheckIcon /> },
  { label: "Analytics", href: "/portal/hr/analytics", icon: <BarChartIcon /> },
  { label: "Job Applications", href: "/portal/hr/job-applications" },
];interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  status: string;
  checkIn?: string;
  checkOut?: string;
  hoursWorked?: number;
  note?: string;
}

interface Employee { id: string; name: string; employeeId: string; }

const STATUS_COLORS: Record<string, string> = {
  PRESENT: "text-green-400 bg-green-400/10",
  ABSENT: "text-red-400 bg-red-400/10",
  HALF_DAY: "text-yellow-400 bg-yellow-400/10",
  ON_LEAVE: "text-blue-400 bg-blue-400/10",
  HOLIDAY: "text-purple-400 bg-purple-400/10",
  WFH: "text-teal-400 bg-teal-400/10",
};

function todayStr() { return new Date().toISOString().split("T")[0]; }

export default function AttendancePage() {
  const { user } = usePortalAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("PRESENT");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [checkIn, setCheckIn] = useState("09:00");
  const [checkOut, setCheckOut] = useState("18:00");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [attRes, empRes] = await Promise.all([
      fetch(`/api/portal/hr/attendance?date=${selectedDate}&limit=100`, { credentials: "include" }),
      fetch("/api/portal/hr/employees?limit=200&status=ACTIVE", { credentials: "include" }),
    ]);
    if (attRes.ok) { const d = await attRes.json(); setRecords(d.attendance || d.records || []); }
    if (empRes.ok) { const d = await empRes.json(); setEmployees(d.employees || []); }
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => { if (user) fetchData(); }, [user, fetchData]);

  async function markAttendance(employeeId: string, status: string) {
    setMarking(true);
    await fetch("/api/portal/hr/attendance", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, date: selectedDate, status, checkIn: status === "PRESENT" || status === "WFH" ? checkIn : undefined, checkOut: status === "PRESENT" || status === "WFH" ? checkOut : undefined }),
    });
    await fetchData();
    setMarking(false);
  }

  async function markBulk() {
    if (selectedEmployees.length === 0) return alert("Select at least one employee.");
    setMarking(true);
    for (const empId of selectedEmployees) {
      await fetch("/api/portal/hr/attendance", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: empId, date: selectedDate, status: bulkStatus, checkIn: bulkStatus === "PRESENT" ? checkIn : undefined, checkOut: bulkStatus === "PRESENT" ? checkOut : undefined }),
      });
    }
    setSelectedEmployees([]);
    setBulkMode(false);
    await fetchData();
    setMarking(false);
  }

  const recordMap = new Map(records.map(r => [r.employeeId, r]));
  const present = records.filter(r => r.status === "PRESENT" || r.status === "WFH").length;
  const absent = records.filter(r => r.status === "ABSENT").length;
  const marked = records.length;

  return (
    <PortalLayout navItems={HR_NAV} title="Attendance" roleLabel="HR Portal" roleColor="text-emerald-400">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Attendance</h2>
            <p className="text-slate-400 text-sm">{marked}/{employees.length} marked · {present} present · {absent} absent</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} max={todayStr()}
              className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
            <button onClick={() => setBulkMode(!bulkMode)}
              className={`px-3 py-2 text-sm rounded-xl transition ${bulkMode ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>
              Bulk Mark
            </button>
          </div>
        </div>

        {/* Check-in/out time controls */}
        <div className="flex flex-wrap gap-4 bg-slate-900 rounded-2xl border border-white/5 p-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Default Check-in</label>
            <input type="time" value={checkIn} onChange={e => setCheckIn(e.target.value)}
              className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-sm text-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Default Check-out</label>
            <input type="time" value={checkOut} onChange={e => setCheckOut(e.target.value)}
              className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-sm text-white" />
          </div>
        </div>

        {/* Bulk actions */}
        {bulkMode && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center gap-3 flex-wrap">
            <span className="text-sm text-indigo-300">{selectedEmployees.length} selected</span>
            <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
              className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white">
              {Object.keys(STATUS_COLORS).map(s => <option key={s}>{s}</option>)}
            </select>
            <button onClick={markBulk} disabled={marking || selectedEmployees.length === 0}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm rounded-xl transition">
              {marking ? "Marking..." : "Mark Selected"}
            </button>
            <button onClick={() => setSelectedEmployees(employees.map(e => e.id))} className="text-xs text-indigo-400 hover:text-indigo-300">Select All</button>
            <button onClick={() => setSelectedEmployees([])} className="text-xs text-slate-500 hover:text-slate-400">Clear</button>
          </div>
        )}

        {loading ? <div className="text-center py-16 text-slate-500">Loading...</div> : (
          <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/3 border-b border-white/5">
                  <tr className="text-left text-xs text-slate-500">
                    {bulkMode && <th className="px-4 py-3 w-10"><input type="checkbox" checked={selectedEmployees.length === employees.length}
                      onChange={e => setSelectedEmployees(e.target.checked ? employees.map(x => x.id) : [])} /></th>}
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Emp ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Check-in</th>
                    <th className="px-4 py-3">Check-out</th>
                    <th className="px-4 py-3">Hours</th>
                    <th className="px-4 py-3">Mark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {employees.map(emp => {
                    const rec = recordMap.get(emp.id);
                    return (
                      <tr key={emp.id} className="hover:bg-white/2 transition">
                        {bulkMode && (
                          <td className="px-4 py-3">
                            <input type="checkbox" checked={selectedEmployees.includes(emp.id)}
                              onChange={e => setSelectedEmployees(prev => e.target.checked ? [...prev, emp.id] : prev.filter(x => x !== emp.id))} />
                          </td>
                        )}
                        <td className="px-4 py-3 text-sm text-white">{emp.name}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 font-mono">{emp.employeeId}</td>
                        <td className="px-4 py-3">
                          {rec ? <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[rec.status]}`}>{rec.status}</span>
                            : <span className="text-xs text-slate-600">Not marked</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">{rec?.checkIn || "—"}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{rec?.checkOut || "—"}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">{rec?.hoursWorked ?? "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {["PRESENT", "ABSENT", "HALF_DAY", "WFH", "ON_LEAVE"].map(s => (
                              <button key={s} onClick={() => markAttendance(emp.id, s)} disabled={marking}
                                title={s} className={`text-xs px-1.5 py-0.5 rounded transition ${rec?.status === s ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/10"}`}>
                                {s === "PRESENT" ? "P" : s === "ABSENT" ? "A" : s === "HALF_DAY" ? "H" : s === "WFH" ? "W" : "L"}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}

function ClipboardCheckIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>; }
function BarChartIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>; }
