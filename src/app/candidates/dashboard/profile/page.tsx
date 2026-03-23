"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ProfileData {
  name: string;
  phone: string;
  education: string;
  experience: string;
  skills: string[];
  linkedin: string;
  portfolio: string;
  address: string;
  resumeUrl: string;
  resumeName: string;
  profileCompletion: number;
}

const EXPERIENCE_OPTIONS = ["0-1 years", "1-2 years", "2-4 years", "4-6 years", "6-10 years", "10+ years"];

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileData>({
    name: "", phone: "", education: "", experience: "", skills: [],
    linkedin: "", portfolio: "", address: "", resumeUrl: "", resumeName: "", profileCompletion: 0,
  });
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/candidates/me").then(r => r.json()),
      fetch("/api/candidates/profile").then(r => r.json()),
    ]).then(([me, prof]) => {
      const p = prof.profile || {};
      setForm({
        name: me.candidate?.name || "",
        phone: p.phone || "",
        education: p.education || "",
        experience: p.experience || "",
        skills: Array.isArray(p.skills) ? p.skills : [],
        linkedin: p.linkedin || "",
        portfolio: p.portfolio || "",
        address: p.address || "",
        resumeUrl: p.resumeUrl || "",
        resumeName: p.resumeName || "",
        profileCompletion: p.profileCompletion || 0,
      });
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/candidates/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setForm(f => ({ ...f, profileCompletion: data.profile?.profileCompletion ?? f.profileCompletion }));
      setMessage({ type: "success", text: "Profile saved successfully!" });
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = useCallback(async (file: File) => {
    setUploading(true);
    setMessage(null);
    try {
      if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
        throw new Error("Only PDF files are allowed");
      }

      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/careers/upload-resume", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      const updatedForm = { ...form, resumeUrl: data.url, resumeName: data.name };
      setForm(updatedForm);

      // Persist immediately so refresh does not lose resume reference.
      const saveRes = await fetch("/api/candidates/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedForm),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error || "Resume saved failed");

      setForm(f => ({ ...f, profileCompletion: saveData.profile?.profileCompletion ?? f.profileCompletion }));
      setMessage({ type: "success", text: "Resume uploaded and saved successfully!" });
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setUploading(false);
    }
  }, [form]);

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) setForm(f => ({ ...f, skills: [...f.skills, s] }));
    setSkillInput("");
  };

  const removeSkill = (s: string) => setForm(f => ({ ...f, skills: f.skills.filter(sk => sk !== s) }));

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  );

  const inputClass = "w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground text-sm">Recruiters see this when you apply</p>
      </div>

      {/* Completion bar */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Profile Completion</span>
          <span className="text-sm font-bold text-primary">{form.profileCompletion}%</span>
        </div>
        <div className="h-2 bg-border rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${form.profileCompletion}%` }} />
        </div>
      </div>

      {message && (
        <div className={`text-sm px-4 py-3 rounded-xl ${message.type === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
          {message.text}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Basic Information</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full Name">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} placeholder="Your name" />
          </Field>
          <Field label="Phone Number">
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputClass} placeholder="+91 98765 43210" />
          </Field>
          <Field label="Education">
            <input value={form.education} onChange={e => setForm(f => ({ ...f, education: e.target.value }))} className={inputClass} placeholder="B.Tech Computer Science, IIT Delhi" />
          </Field>
          <Field label="Years of Experience">
            <select value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} className={inputClass}>
              <option value="">Select experience</option>
              {EXPERIENCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Address">
            <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className={inputClass} placeholder="City, State, Country" />
          </Field>
        </div>
      </div>

      {/* Skills */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Skills</h2>
        <div className="flex gap-2">
          <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
            className={inputClass} placeholder="Add a skill and press Enter" />
          <button onClick={addSkill} className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-xl font-medium hover:bg-primary/90 transition shrink-0">Add</button>
        </div>
        {form.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.skills.map(s => (
              <span key={s} className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                {s}
                <button onClick={() => removeSkill(s)} className="text-muted-foreground hover:text-red-400 transition text-xs leading-none">✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Links */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Online Profiles</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="LinkedIn URL">
            <input value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} className={inputClass} placeholder="https://linkedin.com/in/..." />
          </Field>
          <Field label="Portfolio / GitHub">
            <input value={form.portfolio} onChange={e => setForm(f => ({ ...f, portfolio: e.target.value }))} className={inputClass} placeholder="https://github.com/..." />
          </Field>
        </div>
      </div>

      {/* Resume */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Resume</h2>
        {form.resumeUrl ? (
          <div className="flex items-center justify-between p-3 border border-border rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📄</span>
              <div>
                <p className="text-sm text-foreground font-medium">{form.resumeName || "Resume"}</p>
                <a href={form.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View uploaded resume</a>
              </div>
            </div>
            <button onClick={() => fileRef.current?.click()} className="text-xs text-muted-foreground hover:text-foreground transition">Replace</button>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-border rounded-xl py-8 text-center hover:border-primary transition cursor-pointer">
            <p className="text-3xl mb-2">📤</p>
            <p className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Click to upload your resume (PDF)"}</p>
          </button>
        )}
        <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleResumeUpload(f); e.target.value = ""; }} />
      </div>

      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition disabled:opacity-50">
        {saving ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
}
