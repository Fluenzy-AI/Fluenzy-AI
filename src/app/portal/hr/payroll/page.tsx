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
  { label: "Job Applications", href: "/portal/hr/job-applications" },
];interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: number;
  year: number;
  basicSalary: number;
  hra: number;
  allowances: number;
  deductions: number;
  pf: number;
  tax: number;
  netSalary: number;
  status: string;
  paidAt?: string;
}

interface Employee { id: string; name: string; employeeId: string; basicSalary?: number; }

const STATUS = { PENDING: "text-yellow-400 bg-yellow-400/10", PROCESSED: "text-blue-400 bg-blue-400/10", PAID: "text-green-400 bg-green-400/10", HOLD: "text-red-400 bg-red-400/10" };
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function thisMonth() { const d = new Date(); return { month: d.getMonth() + 1, year: d.getFullYear() }; }

export default function PayrollPage() {
  const { user } = usePortalAuth();
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const { month: currMonth, year: currYear } = thisMonth();
  const [filterMonth, setFilterMonth] = useState(currMonth);
  const [filterYear, setFilterYear] = useState(currYear);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ employeeId: "", month: currMonth, year: currYear, basicSalary: 0, hra: 0, allowances: 0, deductions: 0, pf: 0, tax: 0 });
  const [creating, setCreating] = useState(false);

  const netSalary = form.basicSalary + form.hra + form.allowances - form.deductions - form.pf - form.tax;
  const totalNetPayroll = records.reduce((s, r) => s + r.netSalary, 0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ month: String(filterMonth), year: String(filterYear), limit: "50" });
    const [payRes, empRes] = await Promise.all([
      fetch(`/api/portal/hr/payroll?${params}`, { credentials: "include" }),
      fetch("/api/portal/hr/employees?limit=200&status=ACTIVE", { credentials: "include" }),
    ]);
    if (payRes.ok) { const d = await payRes.json(); setRecords(d.payroll || []); setTotal(d.total || 0); }
    if (empRes.ok) { const d = await empRes.json(); setEmployees(d.employees || []); }
    setLoading(false);
  }, [filterMonth, filterYear]);

  useEffect(() => { if (user) fetchData(); }, [user, fetchData]);

  function prefillFromEmployee(empId: string) {
    const emp = employees.find(e => e.id === empId);
    if (emp?.basicSalary) {
      const basic = emp.basicSalary;
      setForm(f => ({ ...f, employeeId: empId, basicSalary: basic, hra: Math.round(basic * 0.4), allowances: Math.round(basic * 0.1), pf: Math.round(basic * 0.12), tax: Math.round(basic * 0.05), deductions: 0 }));
    } else { setForm(f => ({ ...f, employeeId: empId })); }
  }

  async function createPayroll() {
    if (!form.employeeId) return alert("Select an employee.");
    setCreating(true);
    const res = await fetch("/api/portal/hr/payroll", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, netSalary }),
    });
    if (res.ok) { await fetchData(); setShowAdd(false); }
    else { const d = await res.json(); alert(d.error); }
    setCreating(false);
  }

  const years = [currYear - 1, currYear, currYear + 1];

  return (
    <PortalLayout navItems={HR_NAV} title="Payroll" roleLabel="HR Portal" roleColor="text-emerald-400">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Payroll</h2>
            <p className="text-slate-400 text-sm">{total} records · Total Payout: <span className="text-white font-medium">₹{totalNetPayroll.toLocaleString()}</span></p>
          </div>
          <div className="flex gap-2">
            <select value={filterMonth} onChange={e => setFilterMonth(+e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white">
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select value={filterYear} onChange={e => setFilterYear(+e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white">
              {years.map(y => <option key={y}>{y}</option>)}
            </select>
            <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl transition flex-shrink-0">+ Add</button>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
          {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> :
            records.length === 0 ? <div className="p-8 text-center text-slate-500">No payroll records for {MONTHS[filterMonth - 1]} {filterYear}</div> : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/3 border-b border-white/5">
                    <tr className="text-left text-xs text-slate-500">
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Basic</th>
                      <th className="px-4 py-3">HRA</th>
                      <th className="px-4 py-3">Allowances</th>
                      <th className="px-4 py-3">Deductions</th>
                      <th className="px-4 py-3">PF</th>
                      <th className="px-4 py-3">Tax</th>
                      <th className="px-4 py-3 font-semibold text-white">Net Pay</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {records.map(r => (
                      <tr key={r.id} className="hover:bg-white/2 transition">
                        <td className="px-4 py-3 text-sm text-white font-medium">{r.employeeName}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">₹{r.basicSalary.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">₹{r.hra.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">₹{r.allowances.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-red-400">-₹{r.deductions.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-red-400">-₹{r.pf.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-red-400">-₹{r.tax.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-white font-bold">₹{r.netSalary.toLocaleString()}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS[r.status as keyof typeof STATUS] || "text-slate-400 bg-slate-400/10"}`}>{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-white/10">
                    <tr>
                      <td colSpan={7} className="px-4 py-3 text-xs text-slate-500 font-medium text-right">Total Net Payout</td>
                      <td className="px-4 py-3 text-sm text-white font-bold">₹{totalNetPayroll.toLocaleString()}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="font-semibold text-white">Create Payroll Entry</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Employee *</label>
                <select value={form.employeeId} onChange={e => prefillFromEmployee(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white">
                  <option value="">Select employee...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.employeeId})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Month</label>
                  <select value={form.month} onChange={e => setForm(f => ({ ...f, month: +e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white">
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Year</label>
                  <select value={form.year} onChange={e => setForm(f => ({ ...f, year: +e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white">
                    {years.map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[["basicSalary", "Basic Salary"], ["hra", "HRA"], ["allowances", "Allowances"], ["deductions", "Deductions"], ["pf", "PF (Employer)"], ["tax", "TDS/Tax"]].map(([k, l]) => (
                  <div key={k}>
                    <label className="text-xs text-slate-500 block mb-1">{l} (₹)</label>
                    <input type="number" min={0} value={form[k as keyof typeof form]}
                      onChange={e => setForm(f => ({ ...f, [k]: +e.target.value }))}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                  </div>
                ))}
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-indigo-300">Net Salary</span>
                <span className="text-lg font-bold text-white">₹{netSalary.toLocaleString()}</span>
              </div>
              <button onClick={createPayroll} disabled={creating}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm rounded-xl transition font-medium">
                {creating ? "Creating..." : "Create Payroll Entry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
