"use client";

import { useState } from "react";
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
];

const DEPARTMENTS = ["Engineering", "Product", "Design", "Marketing", "Sales", "HR", "Finance", "Operations", "Customer Support", "Legal", "Other"];

export default function AddEmployeePage() {
  const router = useRouter();
  const { user } = usePortalAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "Engineering",
    designation: "",
    joinDate: "",
    salary: "",
    address: "",
    emergencyContact: "",
  });

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/portal/hr/employees", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          salary: form.salary ? parseFloat(form.salary) : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/portal/hr/employees");
      } else {
        setError(data.error || "Failed to add employee");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <PortalLayout navItems={HR_NAV} title="Add Employee" roleLabel="HR Portal" roleColor="text-emerald-400">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-white transition text-sm flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">Add New Employee</h2>
            <p className="text-slate-400 text-sm">Fill in the employee details below</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-white/5 rounded-2xl p-6 space-y-5">
          {error && (
            <div className="px-4 py-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Personal Info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 pb-2 border-b border-white/5">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name *">
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                  required
                  placeholder="e.g. Priya Sharma"
                  className="input"
                />
              </Field>
              <Field label="Email Address *">
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set("email", e.target.value)}
                  required
                  placeholder="e.g. priya@company.com"
                  className="input"
                />
              </Field>
              <Field label="Phone Number">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => set("phone", e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="input"
                />
              </Field>
              <Field label="Emergency Contact">
                <input
                  type="text"
                  value={form.emergencyContact}
                  onChange={e => set("emergencyContact", e.target.value)}
                  placeholder="Name & phone"
                  className="input"
                />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <input
                  type="text"
                  value={form.address}
                  onChange={e => set("address", e.target.value)}
                  placeholder="Full address"
                  className="input"
                />
              </Field>
            </div>
          </div>

          {/* Job Info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 pb-2 border-b border-white/5">Job Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Designation / Role *">
                <input
                  type="text"
                  value={form.designation}
                  onChange={e => set("designation", e.target.value)}
                  required
                  placeholder="e.g. Software Engineer"
                  className="input"
                />
              </Field>
              <Field label="Department *">
                <select
                  value={form.department}
                  onChange={e => set("department", e.target.value)}
                  required
                  className="input"
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Date of Joining *">
                <input
                  type="date"
                  value={form.joinDate}
                  onChange={e => set("joinDate", e.target.value)}
                  required
                  className="input"
                />
              </Field>
              <Field label="Gross Salary (₹ / year)">
                <input
                  type="number"
                  value={form.salary}
                  onChange={e => set("salary", e.target.value)}
                  placeholder="e.g. 600000"
                  min={0}
                  className="input"
                />
              </Field>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 py-3 rounded-xl text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition"
            >
              {submitting ? "Adding Employee..." : "Add Employee"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          border-radius: 0.75rem;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }
        .input option {
          background: #1e293b;
        }
      `}</style>
    </PortalLayout>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
