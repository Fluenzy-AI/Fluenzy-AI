"use client";

import { useEffect, useState, useCallback } from "react";
import PortalLayout from "@/components/PortalLayout";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

const HR_NAV = [
  { label: "Dashboard", href: "/portal/hr", icon: <HomeIcon /> },
  { label: "Employees", href: "/portal/hr/employees", icon: <UsersIcon /> },
  { label: "Candidates", href: "/portal/hr/candidates", icon: <UserPlusIcon /> },
  { label: "Leave Management", href: "/portal/hr/leaves", icon: <ClockIcon /> },
  { label: "Attendance", href: "/portal/hr/attendance", icon: <CheckSquareIcon /> },
  { label: "Payroll", href: "/portal/hr/payroll", icon: <BanknotesIcon /> },
  { label: "Offer Letters", href: "/portal/hr/offer-letters", icon: <DocumentIcon /> },
  { label: "Send Email", href: "/portal/hr/send-email", icon: <MailIcon /> },
  { label: "Email History", href: "/portal/hr/email-logs", icon: <MailOpenIcon /> },
];

interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  designation: string;
  joinDate: string;
  salary?: number;
  status: string;
  hr?: { name: string; email: string };
  _count?: { leaveRequests: number };
}

export default function EmployeesPage() {
  const { user, loading } = usePortalAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", department: "", designation: "", joinDate: "", salary: "", address: "",
  });
  const [formError, setFormError] = useState("");

  const fetchEmployees = useCallback(async () => {
    setLoadingData(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", search, ...(statusFilter ? { status: statusFilter } : {}) });
      const res = await fetch(`/api/portal/hr/employees?${params}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees);
        setTotal(data.total);
      }
    } catch { /* silent */ }
    finally { setLoadingData(false); }
  }, [page, search, statusFilter]);

  useEffect(() => {
    if (!loading && !user) { router.push("/portal/login"); return; }
    if (user) fetchEmployees();
  }, [user, loading, router, fetchEmployees]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(""); setSubmitting(true);
    try {
      const res = await fetch("/api/portal/hr/employees", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, salary: form.salary ? parseFloat(form.salary) : undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowForm(false);
        setForm({ name: "", email: "", phone: "", department: "", designation: "", joinDate: "", salary: "", address: "" });
        fetchEmployees();
      } else {
        setFormError(data.error || "Failed to create employee");
      }
    } catch { setFormError("Network error"); }
    finally { setSubmitting(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this employee? This action cannot be undone.")) return;
    const res = await fetch(`/api/portal/hr/employees/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) fetchEmployees();
    setDeleteId(null);
  }

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-500/10 text-green-400",
    INACTIVE: "bg-slate-500/10 text-slate-400",
    ON_LEAVE: "bg-yellow-500/10 text-yellow-400",
    TERMINATED: "bg-red-500/10 text-red-400",
  };

  return (
    <PortalLayout navItems={HR_NAV} title="Employee Management" roleLabel="HR Portal" roleColor="text-emerald-400">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">Employees</h2>
            <p className="text-slate-400 text-sm">{total} total employees</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl text-sm transition flex items-center gap-2"
          >
            <span>+</span> Add Employee
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by name, email, code..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
          {loadingData ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : employees.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3"><UsersIcon /></div>
              <p className="text-slate-400 font-medium">No employees found</p>
              <p className="text-slate-600 text-sm mt-1">Add your first employee to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Employee</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Department</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Joining Date</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Status</th>
                    <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-white/2 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-sm font-medium flex-shrink-0">
                            {emp.name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{emp.name}</p>
                            <p className="text-xs text-slate-500">{emp.email} · {emp.employeeCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-white">{emp.department}</p>
                        <p className="text-xs text-slate-500">{emp.designation}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-400">
                        {new Date(emp.joinDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[emp.status] || "bg-slate-500/10 text-slate-400"}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/portal/hr/employees/${emp.id}`} className="text-xs text-indigo-400 hover:text-indigo-300 transition">View</Link>
                          {user?.role === "ADMIN" && (
                            <button onClick={() => handleDelete(emp.id)} className="text-xs text-red-400 hover:text-red-300 transition">Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Showing {Math.min((page - 1) * 20 + 1, total)}–{Math.min(page * 20, total)} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 bg-white/5 border border-white/10 text-sm text-white rounded-lg disabled:opacity-40 hover:bg-white/10 transition">
                Previous
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}
                className="px-3 py-1.5 bg-white/5 border border-white/10 text-sm text-white rounded-lg disabled:opacity-40 hover:bg-white/10 transition">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white">Add New Employee</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white transition">✕</button>
              </div>
              {formError && <div className="mb-4 px-4 py-3 bg-red-500/15 border border-red-500/30 rounded-lg text-red-300 text-sm">{formError}</div>}
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FieldInput label="Full Name *" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} required />
                  <FieldInput label="Email *" type="email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} required />
                  <FieldInput label="Phone" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} />
                  <FieldInput label="Department *" value={form.department} onChange={v => setForm(p => ({ ...p, department: v }))} required />
                  <FieldInput label="Designation *" value={form.designation} onChange={v => setForm(p => ({ ...p, designation: v }))} required />
                  <FieldInput label="Join Date *" type="date" value={form.joinDate} onChange={v => setForm(p => ({ ...p, joinDate: v }))} required />
                  <FieldInput label="Salary (₹)" type="number" value={form.salary} onChange={v => setForm(p => ({ ...p, salary: v }))} />
                  <FieldInput label="Address" value={form.address} onChange={v => setForm(p => ({ ...p, address: v }))} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-white/5 border border-white/10 text-white py-2.5 rounded-xl text-sm hover:bg-white/10 transition">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition">
                    {submitting ? "Adding..." : "Add Employee"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}

function FieldInput({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required}
        className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
    </div>
  );
}

function HomeIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>; }
function UsersIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>; }
function UserPlusIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>; }
function ClockIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function CheckSquareIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>; }
function BanknotesIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>; }
function DocumentIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>; }
function MailIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>; }
function MailOpenIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0L9.75 14.5" /></svg>; }
