"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import PortalLayout from "@/components/PortalLayout";
import { usePortalAuth } from "@/contexts/PortalAuthContext";

const HR_NAV = [
  { label: "Dashboard", href: "/portal/hr" },
  { label: "Employees", href: "/portal/hr/employees" },
  { label: "Candidates", href: "/portal/hr/candidates" },
  { label: "Interviews", href: "/portal/hr/interviews" },
  { label: "Leave Management", href: "/portal/hr/leaves" },
  { label: "Attendance", href: "/portal/hr/attendance" },
  { label: "Payroll", href: "/portal/hr/payroll" },
  { label: "Offer Letters", href: "/portal/hr/offer-letters" },
  { label: "Send Email", href: "/portal/hr/send-email" },
  { label: "Email History", href: "/portal/hr/email-logs" },
  { label: "Manage Jobs", href: "/portal/hr/jobs" },
  { label: "Job Applications", href: "/portal/hr/job-applications" },
];

const STATUS_OPTIONS = ["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"];
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-400 border-green-500/20",
  INACTIVE: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  ON_LEAVE: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  TERMINATED: "bg-red-500/10 text-red-400 border-red-500/20",
};
const LEAVE_STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-400 bg-yellow-400/10",
  APPROVED: "text-green-400 bg-green-400/10",
  REJECTED: "text-red-400 bg-red-400/10",
};
const DEPARTMENTS = ["Engineering", "Product", "Design", "Marketing", "Sales", "HR", "Finance", "Operations", "Customer Support", "Legal", "Other"];

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
  address?: string;
  emergencyContact?: string;
  hr?: { name: string; email: string };
  leaveRequests: Array<{ id: string; type: string; status: string; startDate: string; endDate: string; days: number; reason?: string }>;
  attendances: Array<{ id: string; date: string; checkIn?: string; checkOut?: string; status: string }>;
  payrollRecords: Array<{ id: string; month: number; year: number; basicSalary: number; netSalary: number; status: string }>;
  offerLetters: Array<{ id: string; position: string; createdAt: string; status: string }>;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = usePortalAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "leaves" | "attendance" | "payroll">("overview");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Employee>>({});
  const [saveError, setSaveError] = useState("");

  async function fetchEmployee() {
    setLoading(true);
    try {
      const res = await fetch(`/api/portal/hr/employees/${id}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setEmployee(data.employee);
        setEditForm({
          name: data.employee.name,
          phone: data.employee.phone || "",
          department: data.employee.department,
          designation: data.employee.designation,
          salary: data.employee.salary,
          address: data.employee.address || "",
          emergencyContact: data.employee.emergencyContact || "",
          status: data.employee.status,
        });
      } else {
        router.push("/portal/hr/employees");
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (user) fetchEmployee();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  async function handleSave() {
    setSaveError(""); setSaving(true);
    try {
      const res = await fetch(`/api/portal/hr/employees/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (res.ok) {
        setEmployee(prev => prev ? { ...prev, ...data.employee } : null);
        setEditing(false);
      } else {
        setSaveError(data.error || "Failed to save");
      }
    } catch { setSaveError("Network error"); }
    finally { setSaving(false); }
  }

  if (loading) {
    return (
      <PortalLayout navItems={HR_NAV} title="Employee" roleLabel="HR Portal" roleColor="text-emerald-400">
        <div className="animate-pulse space-y-4">
          <div className="h-28 bg-white/5 rounded-2xl" />
          <div className="h-64 bg-white/5 rounded-2xl" />
        </div>
      </PortalLayout>
    );
  }

  if (!employee) return null;

  return (
    <PortalLayout navItems={HR_NAV} title={employee.name} roleLabel="HR Portal" roleColor="text-emerald-400">
      <div className="space-y-5">
        {/* Back + Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/portal/hr/employees")} className="text-slate-400 hover:text-white transition text-sm flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Employees
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-2xl font-bold flex-shrink-0">
              {employee.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-white">{employee.name}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium w-fit ${STATUS_COLORS[employee.status] || STATUS_COLORS.INACTIVE}`}>
                  {employee.status}
                </span>
              </div>
              <p className="text-slate-300 text-sm">{employee.designation} · {employee.department}</p>
              <p className="text-slate-500 text-xs mt-0.5">{employee.email} · {employee.employeeCode}</p>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-xl text-sm hover:bg-indigo-600/30 transition flex-shrink-0"
            >
              Edit
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Joined", value: new Date(employee.joinDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
              { label: "Salary (CTC)", value: employee.salary ? `₹${Number(employee.salary).toLocaleString()}` : "—" },
              { label: "Phone", value: employee.phone || "—" },
              { label: "Assigned HR", value: employee.hr?.name || "—" },
            ].map(item => (
              <div key={item.label} className="bg-white/3 rounded-xl px-3 py-2.5">
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="text-sm text-white mt-0.5 font-medium truncate">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/3 rounded-xl p-1 w-fit">
          {(["overview", "leaves", "attendance", "payroll"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm transition capitalize ${activeTab === tab ? "bg-indigo-600 text-white font-medium" : "text-slate-400 hover:text-white"}`}
            >
              {tab === "leaves" ? "Leave History" : tab === "attendance" ? "Attendance" : tab === "payroll" ? "Payroll" : "Overview"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoCard title="Contact Details">
              <InfoRow label="Email" value={employee.email} />
              <InfoRow label="Phone" value={employee.phone || "—"} />
              <InfoRow label="Address" value={employee.address || "—"} />
              <InfoRow label="Emergency Contact" value={employee.emergencyContact || "—"} />
            </InfoCard>
            <InfoCard title="Employment Details">
              <InfoRow label="Employee Code" value={employee.employeeCode} mono />
              <InfoRow label="Designation" value={employee.designation} />
              <InfoRow label="Department" value={employee.department} />
              <InfoRow label="Join Date" value={new Date(employee.joinDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} />
              <InfoRow label="CTC" value={employee.salary ? `₹${Number(employee.salary).toLocaleString()} / year` : "—"} />
            </InfoCard>
            {employee.offerLetters.length > 0 && (
              <InfoCard title="Offer Letters" className="sm:col-span-2">
                <div className="space-y-2">
                  {employee.offerLetters.map(ol => (
                    <div key={ol.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                      <div>
                        <p className="text-sm text-white">{ol.position}</p>
                        <p className="text-xs text-slate-500">{new Date(ol.createdAt).toLocaleDateString("en-IN")}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ol.status === "ACCEPTED" ? "bg-green-500/10 text-green-400" : "bg-slate-500/10 text-slate-400"}`}>
                        {ol.status}
                      </span>
                    </div>
                  ))}
                </div>
              </InfoCard>
            )}
          </div>
        )}

        {activeTab === "leaves" && (
          <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h3 className="font-semibold text-white text-sm">Leave Requests ({employee.leaveRequests.length})</h3>
            </div>
            {employee.leaveRequests.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No leave requests yet</div>
            ) : (
              <div className="divide-y divide-white/5">
                {employee.leaveRequests.map(lr => (
                  <div key={lr.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white font-medium">{lr.type}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(lr.startDate).toLocaleDateString("en-IN")} – {new Date(lr.endDate).toLocaleDateString("en-IN")} · {lr.days} day{lr.days !== 1 ? "s" : ""}
                      </p>
                      {lr.reason && <p className="text-xs text-slate-500 mt-0.5 italic">{lr.reason}</p>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEAVE_STATUS_COLORS[lr.status] || "bg-slate-500/10 text-slate-400"}`}>
                      {lr.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "attendance" && (
          <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h3 className="font-semibold text-white text-sm">Recent Attendance (last 30 records)</h3>
            </div>
            {employee.attendances.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No attendance records yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-xs text-slate-500">
                      <th className="text-left px-5 py-3">Date</th>
                      <th className="text-left px-5 py-3">Check In</th>
                      <th className="text-left px-5 py-3">Check Out</th>
                      <th className="text-left px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {employee.attendances.map(a => (
                      <tr key={a.id} className="hover:bg-white/2 transition">
                        <td className="px-5 py-3 text-white">{new Date(a.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</td>
                        <td className="px-5 py-3 text-slate-300">{a.checkIn ? new Date(a.checkIn).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                        <td className="px-5 py-3 text-slate-300">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.status === "PRESENT" ? "bg-green-500/10 text-green-400" : a.status === "ABSENT" ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "payroll" && (
          <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h3 className="font-semibold text-white text-sm">Payroll Records (last 12 months)</h3>
            </div>
            {employee.payrollRecords.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No payroll records yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-xs text-slate-500">
                      <th className="text-left px-5 py-3">Period</th>
                      <th className="text-left px-5 py-3">Basic Salary</th>
                      <th className="text-left px-5 py-3">Net Salary</th>
                      <th className="text-left px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {employee.payrollRecords.map(pr => (
                      <tr key={pr.id} className="hover:bg-white/2 transition">
                        <td className="px-5 py-3 text-white">{MONTHS[pr.month - 1]} {pr.year}</td>
                        <td className="px-5 py-3 text-slate-300">₹{Number(pr.basicSalary).toLocaleString()}</td>
                        <td className="px-5 py-3 text-white font-medium">₹{Number(pr.netSalary).toLocaleString()}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pr.status === "PAID" ? "bg-green-500/10 text-green-400" : pr.status === "PROCESSED" ? "bg-blue-500/10 text-blue-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                            {pr.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="font-semibold text-white">Edit Employee</h3>
              <button onClick={() => { setEditing(false); setSaveError(""); }} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              {saveError && <div className="px-3 py-2 bg-red-500/15 border border-red-500/30 rounded-lg text-red-300 text-sm">{saveError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <EF label="Full Name" value={String(editForm.name || "")} onChange={v => setEditForm(p => ({ ...p, name: v }))} />
                <EF label="Phone" value={String(editForm.phone || "")} onChange={v => setEditForm(p => ({ ...p, phone: v }))} />
                <EF label="Designation" value={String(editForm.designation || "")} onChange={v => setEditForm(p => ({ ...p, designation: v }))} />
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Department</label>
                  <select value={String(editForm.department || "")} onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))} className="inp w-full">
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Status</label>
                  <select value={String(editForm.status || "")} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))} className="inp w-full">
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <EF label="Salary (₹)" type="number" value={String(editForm.salary || "")} onChange={v => setEditForm(p => ({ ...p, salary: v ? parseFloat(v) : undefined }))} />
                <EF label="Address" value={String(editForm.address || "")} onChange={v => setEditForm(p => ({ ...p, address: v }))} className="col-span-2" />
                <EF label="Emergency Contact" value={String(editForm.emergencyContact || "")} onChange={v => setEditForm(p => ({ ...p, emergencyContact: v }))} className="col-span-2" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setEditing(false); setSaveError(""); }} className="flex-1 bg-white/5 border border-white/10 text-slate-300 py-2.5 rounded-xl text-sm hover:bg-white/10 transition">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .inp {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          border-radius: 0.75rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .inp:focus {
          border-color: #6366f1;
        }
        .inp option {
          background: #1e293b;
        }
      `}</style>
    </PortalLayout>
  );
}

function InfoCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-slate-900 border border-white/5 rounded-2xl p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-slate-300 mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm py-1 border-b border-white/5 last:border-0">
      <span className="text-slate-500 flex-shrink-0">{label}</span>
      <span className={`text-white text-right ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}

function EF({ label, value, onChange, type = "text", className = "" }: { label: string; value: string; onChange: (v: string) => void; type?: string; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="inp w-full" />
    </div>
  );
}
