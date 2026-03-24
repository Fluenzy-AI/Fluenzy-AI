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
  { label: "Manage Jobs", href: "/portal/hr/jobs" },
  { label: "Assessments", href: "/portal/hr/assessments", icon: <ClipboardCheckIcon /> },
  { label: "Analytics", href: "/portal/hr/analytics", icon: <BarChartIcon /> },
  { label: "Job Applications", href: "/portal/hr/job-applications" },
];

function ClipboardCheckIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>; }
function BarChartIcon() { return <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>; }

const DEPARTMENTS = ["Engineering", "Product", "Design", "Marketing", "Sales", "HR", "Finance", "Operations", "Customer Support", "Legal", "Other"];
const SOURCES = ["LinkedIn", "Naukri", "Indeed", "Referral", "Website", "Campus", "Agency", "Other"];

export default function AddCandidatePage() {
  const router = useRouter();
  const { user } = usePortalAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    department: "Engineering",
    source: "LinkedIn",
    expectedSalary: "",
    currentSalary: "",
    experience: "",
    resumeUrl: "",
    interviewNotes: "",
    interviewerName: "",
  });
  const [skills, setSkills] = useState<string[]>([]);

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills(prev => [...prev, s]);
      setSkillInput("");
    }
  }

  function removeSkill(s: string) {
    setSkills(prev => prev.filter(x => x !== s));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        position: form.position,
        department: form.department,
        source: form.source,
        expectedSalary: form.expectedSalary ? parseFloat(form.expectedSalary) : undefined,
        currentSalary: form.currentSalary ? parseFloat(form.currentSalary) : undefined,
        experience: form.experience ? parseFloat(form.experience) : undefined,
        resumeUrl: form.resumeUrl || undefined,
        interviewNotes: form.interviewNotes || undefined,
        interviewerName: form.interviewerName || undefined,
        skills,
      };
      const res = await fetch("/api/portal/hr/candidates", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/portal/hr/candidates");
      } else {
        setError(data.error || "Failed to add candidate");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <PortalLayout navItems={HR_NAV} title="Add Candidate" roleLabel="HR Portal" roleColor="text-emerald-400">
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
            <h2 className="text-xl font-bold text-white">Add New Candidate</h2>
            <p className="text-slate-400 text-sm">Add a candidate to your hiring pipeline</p>
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
                  placeholder="e.g. Rahul Mehta"
                  className="inp"
                />
              </Field>
              <Field label="Email Address *">
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set("email", e.target.value)}
                  required
                  placeholder="e.g. rahul@gmail.com"
                  className="inp"
                />
              </Field>
              <Field label="Phone Number">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => set("phone", e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="inp"
                />
              </Field>
              <Field label="Years of Experience">
                <input
                  type="number"
                  value={form.experience}
                  onChange={e => set("experience", e.target.value)}
                  placeholder="e.g. 3"
                  min={0}
                  step={0.5}
                  className="inp"
                />
              </Field>
            </div>
          </div>

          {/* Job Info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 pb-2 border-b border-white/5">Role & Application</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Position Applied For *">
                <input
                  type="text"
                  value={form.position}
                  onChange={e => set("position", e.target.value)}
                  required
                  placeholder="e.g. Senior Frontend Developer"
                  className="inp"
                />
              </Field>
              <Field label="Department">
                <select value={form.department} onChange={e => set("department", e.target.value)} className="inp">
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Source / How did they apply?">
                <select value={form.source} onChange={e => set("source", e.target.value)} className="inp">
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Resume URL">
                <input
                  type="url"
                  value={form.resumeUrl}
                  onChange={e => set("resumeUrl", e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="inp"
                />
              </Field>
              <Field label="Current Salary (₹ / year)">
                <input
                  type="number"
                  value={form.currentSalary}
                  onChange={e => set("currentSalary", e.target.value)}
                  placeholder="e.g. 500000"
                  min={0}
                  className="inp"
                />
              </Field>
              <Field label="Expected Salary (₹ / year)">
                <input
                  type="number"
                  value={form.expectedSalary}
                  onChange={e => set("expectedSalary", e.target.value)}
                  placeholder="e.g. 800000"
                  min={0}
                  className="inp"
                />
              </Field>
            </div>
          </div>

          {/* Skills */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 pb-2 border-b border-white/5">Skills</h3>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                placeholder="Add skill and press Enter or +"
                className="flex-1 inp"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-xl text-sm hover:bg-indigo-600/30 transition"
              >
                +
              </button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {skills.map(s => (
                  <span key={s} className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600/15 border border-indigo-500/20 text-indigo-300 rounded-lg text-xs">
                    {s}
                    <button type="button" onClick={() => removeSkill(s)} className="text-indigo-400 hover:text-red-400 transition ml-0.5">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 pb-2 border-b border-white/5">Additional Notes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Interviewer Name">
                <input
                  type="text"
                  value={form.interviewerName}
                  onChange={e => set("interviewerName", e.target.value)}
                  placeholder="e.g. Ankit Gupta"
                  className="inp"
                />
              </Field>
              <Field label="Initial Notes" className="sm:col-span-2">
                <textarea
                  value={form.interviewNotes}
                  onChange={e => set("interviewNotes", e.target.value)}
                  rows={3}
                  placeholder="Any relevant notes about this candidate..."
                  className="inp resize-none"
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
              {submitting ? "Adding Candidate..." : "Add Candidate"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .inp {
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
        .inp:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }
        .inp option {
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
