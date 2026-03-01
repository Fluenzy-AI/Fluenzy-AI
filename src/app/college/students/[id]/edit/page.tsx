"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CollegeProtectedLayout from "../../../components/CollegeProtectedLayout";
import { ArrowLeft, Save, Loader2, User, Tag, AlertTriangle, FileText, X } from "lucide-react";

interface BatchOption { id: string; batchName: string }

interface FormState {
  studentName: string;
  department: string;
  yearOfStudy: string;
  rollNumber: string;
  batchId: string;
  status: string;
  tags: string[];
  warningFlags: string[];
  adminNotes: string;
}

export default function StudentEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    studentName: "", department: "", yearOfStudy: "", rollNumber: "",
    batchId: "", status: "ACTIVE", tags: [], warningFlags: [], adminNotes: "",
  });
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [flagInput, setFlagInput] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("college_token");
    if (!token) return;
    Promise.all([
      fetch(`/api/college/students/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch("/api/college/batches", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ])
      .then(([sd, bd]) => {
        const s = sd.student;
        setForm({
          studentName: s.studentName ?? "",
          department: s.department ?? "",
          yearOfStudy: s.yearOfStudy ?? "",
          rollNumber: s.rollNumber ?? "",
          batchId: s.batch?.id ?? "",
          status: s.status ?? "ACTIVE",
          tags: s.tags ?? [],
          warningFlags: s.warningFlags ?? [],
          adminNotes: s.adminNotes ?? "",
        });
        setBatches(bd.batches ?? []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    }
    setTagInput("");
  };

  const removeTag = (t: string) => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }));

  const addFlag = () => {
    const t = flagInput.trim();
    if (t && !form.warningFlags.includes(t)) {
      setForm((f) => ({ ...f, warningFlags: [...f.warningFlags, t] }));
    }
    setFlagInput("");
  };

  const removeFlag = (t: string) => setForm((f) => ({ ...f, warningFlags: f.warningFlags.filter((x) => x !== t) }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("college_token");
      const res = await fetch(`/api/college/students/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Save failed."); return; }
      setSuccess(true);
      setTimeout(() => router.push(`/college/students/${id}`), 1200);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const field = (id: keyof FormState, label: string, placeholder = "", type = "text") => (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <input
        type={type}
        value={form[id] as string}
        onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
        placeholder={placeholder}
        className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
      />
    </div>
  );

  if (loading) {
    return (
      <CollegeProtectedLayout>
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
      </CollegeProtectedLayout>
    );
  }

  return (
    <CollegeProtectedLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><User className="w-6 h-6 text-indigo-400" /> Edit Student</h1>
          <p className="text-slate-400 text-sm mt-1">Update student profile, status, and admin notes.</p>
        </div>

        {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
        {success && <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saved! Redirecting…</div>}

        <form onSubmit={handleSave} className="space-y-5">
          <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Profile Details</h2>
            {field("studentName", "Full Name", "Student's full name")}
            {field("department", "Department / Branch", "e.g. Computer Science")}
            <div className="grid grid-cols-2 gap-4">
              {field("yearOfStudy", "Year of Study", "e.g. 3")}
              {field("rollNumber", "Roll Number / Student ID", "e.g. CS2021001")}
            </div>
          </div>

          <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Assignment & Status</h2>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Batch</label>
              <select
                value={form.batchId}
                onChange={(e) => setForm((f) => ({ ...f, batchId: e.target.value }))}
                className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              >
                <option value="">— No Batch —</option>
                {batches.map((b) => <option key={b.id} value={b.id}>{b.batchName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm space-y-3">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-2"><Tag className="w-4 h-4" /> Tags</h2>
            <div className="flex gap-2">
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Add tag and press Enter" className="flex-1 bg-slate-800/60 border border-slate-600/60 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
              <button type="button" onClick={addTag} className="px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-sm hover:bg-indigo-500/30 transition-all">Add</button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tags.map((t) => (
                  <span key={t} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                    {t}<button type="button" onClick={() => removeTag(t)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Warning Flags */}
          <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm space-y-3">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-yellow-400" /> Warning Flags</h2>
            <div className="flex gap-2">
              <input value={flagInput} onChange={(e) => setFlagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFlag(); } }}
                placeholder="e.g. Low Attendance" className="flex-1 bg-slate-800/60 border border-slate-600/60 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
              <button type="button" onClick={addFlag} className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-sm hover:bg-yellow-500/30 transition-all">Add</button>
            </div>
            {form.warningFlags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.warningFlags.map((t) => (
                  <span key={t} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-red-500/15 border border-red-500/30 text-red-300">
                    {t}<button type="button" onClick={() => removeFlag(t)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Admin Notes */}
          <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm space-y-3">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-2"><FileText className="w-4 h-4" /> Admin Notes</h2>
            <textarea rows={4} value={form.adminNotes}
              onChange={(e) => setForm((f) => ({ ...f, adminNotes: e.target.value }))}
              placeholder="Internal notes visible only to college admin…"
              className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none" />
          </div>

          <div className="flex items-center justify-end gap-3 pb-8">
            <button type="button" onClick={() => router.back()} className="px-5 py-2.5 rounded-xl border border-slate-600/50 text-slate-300 hover:text-white hover:border-slate-500 text-sm transition-all">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/25">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </CollegeProtectedLayout>
  );
}
