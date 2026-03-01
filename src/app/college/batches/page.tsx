"use client";
import { useEffect, useState } from "react";
import { useCollegeAdmin } from "@/contexts/CollegeAdminContext";
import CollegeProtectedLayout from "../components/CollegeProtectedLayout";
import { Plus, GraduationCap, Trash2, Users } from "lucide-react";

interface Batch {
  id: string;
  name: string;
  department?: string;
  graduationYear?: number;
  description?: string;
  _count?: { students: number };
}

export default function BatchesPage() {
  const { token } = useCollegeAdmin();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", department: "", graduationYear: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchBatches = async () => {
    if (!token) return;
    setLoading(true);
    const res = await fetch("/api/college/batches", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setBatches((await res.json()).batches);
    setLoading(false);
  };

  useEffect(() => { fetchBatches(); }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Batch name is required."); return; }
    setSaving(true);
    setError("");
    const res = await fetch("/api/college/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, graduationYear: form.graduationYear ? parseInt(form.graduationYear) : undefined }),
    });
    if (res.ok) {
      setForm({ name: "", department: "", graduationYear: "", description: "" });
      setShowForm(false);
      fetchBatches();
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to create batch.");
    }
    setSaving(false);
  };

  return (
    <CollegeProtectedLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-indigo-400" /> Batches
            </h1>
            <p className="text-slate-400 text-sm mt-1">Organize students into batches by department or graduation year</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium text-sm hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25">
            <Plus className="w-4 h-4" /> New Batch
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Create New Batch</h3>
            {error && <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Batch Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="CSE Batch 2026" className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Department</label>
                <input type="text" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="Computer Science" className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Graduation Year</label>
                <input type="number" value={form.graduationYear} onChange={(e) => setForm({ ...form, graduationYear: e.target.value })}
                  placeholder="2026" className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Description</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional notes…" className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="col-span-2 flex gap-2">
                <button type="submit" disabled={saving}
                  className="px-4 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm hover:bg-indigo-500/30 transition-all disabled:opacity-50">
                  {saving ? "Creating…" : "Create Batch"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-slate-300 text-sm hover:bg-slate-700 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Batches Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-slate-800/50 animate-pulse" />)}
          </div>
        ) : batches.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
            No batches yet. Create your first batch to organize students.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((batch) => (
              <div key={batch.id} className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-5 hover:border-indigo-500/30 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-indigo-400" />
                  </div>
                </div>
                <h3 className="text-white font-semibold">{batch.name}</h3>
                {batch.department && <p className="text-slate-400 text-sm mt-0.5">{batch.department}</p>}
                {batch.graduationYear && <p className="text-slate-500 text-xs mt-0.5">Graduation: {batch.graduationYear}</p>}
                {batch.description && <p className="text-slate-500 text-xs mt-1">{batch.description}</p>}
                <div className="mt-3 pt-3 border-t border-slate-700/30 flex items-center gap-1 text-slate-400 text-sm">
                  <Users className="w-3.5 h-3.5" /> {batch._count?.students ?? 0} students
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CollegeProtectedLayout>
  );
}
