"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCollegeAdmin } from "@/contexts/CollegeAdminContext";
import CollegeProtectedLayout from "../../components/CollegeProtectedLayout";
import { ChevronLeft, User, Mail, Building, GraduationCap, Hash, BookOpen } from "lucide-react";
import Link from "next/link";

export default function AddStudentPage() {
  const router = useRouter();
  const { token, admin } = useCollegeAdmin();
  const [form, setForm] = useState({ studentName: "", email: "", department: "", year: "", rollNumber: "", batchId: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [batches, setBatches] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch("/api/college/batches", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setBatches(d.batches ?? []));
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.endsWith(`@${admin?.domain}`)) {
      setError(`Email must end with @${admin?.domain}`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/college/students", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          studentName: form.studentName,
          email: form.email,
          department: form.department || undefined,
          year: form.year ? parseInt(form.year) : undefined,
          rollNumber: form.rollNumber || undefined,
          batchId: form.batchId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to add student."); return; }
      router.push("/college/students");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CollegeProtectedLayout>
      <div className="p-6 max-w-xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/college/students" className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Add Student</h1>
            <p className="text-slate-400 text-sm mt-0.5">Manually enroll a student to your college portal</p>
          </div>
        </div>

        <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-6">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input name="studentName" type="text" value={form.studentName} onChange={handleChange} required
                  placeholder="Rahul Kumar" className="input-field pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Institutional Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input name="email" type="email" value={form.email} onChange={handleChange} required
                  placeholder={`student@${admin?.domain ?? "university.ac.in"}`}
                  className="input-field pl-10" />
              </div>
              <p className="text-xs text-slate-500 mt-1">Must be @{admin?.domain}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Department</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input name="department" type="text" value={form.department} onChange={handleChange}
                    placeholder="Computer Science" className="input-field pl-10" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Year</label>
                <input name="year" type="number" value={form.year} onChange={handleChange}
                  placeholder="2026" min="1" max="9"
                  className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Roll Number</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input name="rollNumber" type="text" value={form.rollNumber} onChange={handleChange}
                    placeholder="CS2024001" className="input-field pl-10" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Batch</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select name="batchId" value={form.batchId} onChange={handleChange}
                    className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all">
                    <option value="">No Batch</option>
                    {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25 mt-2">
              {loading ? "Adding student…" : "Add & Send Invite Email"}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .input-field { @apply w-full bg-slate-800/60 border border-slate-600/60 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all; }
      `}</style>
    </CollegeProtectedLayout>
  );
}
