"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  FileText,
  Upload,
  Save,
  Linkedin,
  Globe,
  Github,
  CheckCircle,
  X,
} from "lucide-react";

interface Profile {
  id: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  linkedin?: string;
  portfolio?: string;
  github?: string;
  resumeUrl?: string;
  resumeName?: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  profile: Profile | null;
}

export default function ProfilePage() {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    location: "",
    bio: "",
    skills: "",
    experience: "",
    education: "",
    linkedin: "",
    portfolio: "",
    github: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/candidates/me");
        if (res.ok) {
          const data = await res.json();
          setCandidate(data.candidate);
          if (data.candidate) {
            const profile = data.candidate.profile || {};
            setForm({
              name: data.candidate.name || "",
              phone: profile.phone || "",
              location: profile.location || "",
              bio: profile.bio || "",
              skills: (profile.skills || []).join(", "),
              experience: profile.experience || "",
              education: profile.education || "",
              linkedin: profile.linkedin || "",
              portfolio: profile.portfolio || "",
              github: profile.github || "",
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5 MB");
      return;
    }

    setResumeFile(file);
    setResumeUploading(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/careers/upload-resume", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }
      const data = await res.json();
      
      // Update profile with new resume
      await fetch("/api/candidates/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeUrl: data.url,
          resumeName: data.name,
        }),
      });

      // Refresh candidate data
      const meRes = await fetch("/api/candidates/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        setCandidate(meData.candidate);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to upload resume");
    } finally {
      setResumeUploading(false);
      setResumeFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      // Update name
      if (form.name !== candidate?.name) {
        await fetch("/api/candidates/me", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name }),
        });
      }

      // Update profile
      const res = await fetch("/api/candidates/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: form.phone,
          location: form.location,
          bio: form.bio,
          skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
          experience: form.experience,
          education: form.education,
          linkedin: form.linkedin,
          portfolio: form.portfolio,
          github: form.github,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      // Refresh candidate data
      const meRes = await fetch("/api/candidates/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        setCandidate(meData.candidate);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const calculateCompletion = () => {
    let score = 10;
    if (form.name) score += 10;
    if (form.phone) score += 10;
    if (form.location) score += 10;
    if (form.skills) score += 15;
    if (form.experience) score += 15;
    if (form.education) score += 10;
    if (candidate?.profile?.resumeUrl) score += 15;
    if (form.linkedin || form.portfolio) score += 5;
    return Math.min(score, 100);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-white/5 rounded-xl w-48" />
        <div className="h-96 bg-white/5 rounded-xl" />
      </div>
    );
  }

  const completion = calculateCompletion();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your profile information</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-white">{completion}% Complete</p>
            <p className="text-xs text-slate-500">Profile strength</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#13161E] border-2 border-violet-500/50 flex items-center justify-center">
            <span className="text-sm font-bold text-violet-400">{completion}%</span>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
        >
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Profile saved successfully!</span>
        </motion.div>
      )}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400"
        >
          <span className="text-sm">{error}</span>
          <button onClick={() => setError("")}>
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-[#13161E] rounded-xl border border-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-violet-400" />
            Basic Information
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[#0A0C10] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
              <input
                type="email"
                value={candidate?.email || ""}
                disabled
                className="w-full bg-[#0A0C10] border border-white/5 text-slate-500 rounded-xl px-4 py-2.5 text-sm cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full bg-[#0A0C10] border border-white/5 text-white placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="City, Country"
                className="w-full bg-[#0A0C10] border border-white/5 text-white placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Brief introduction about yourself..."
              rows={3}
              className="w-full bg-[#0A0C10] border border-white/5 text-white placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 resize-none"
            />
          </div>
        </div>

        {/* Resume */}
        <div className="bg-[#13161E] rounded-xl border border-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-400" />
            Resume
          </h2>
          {candidate?.profile?.resumeUrl ? (
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {candidate.profile.resumeName || "Resume.pdf"}
                  </p>
                  <p className="text-xs text-slate-500">Current resume</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={candidate.profile.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-violet-400 hover:bg-violet-500/10 transition-colors"
                >
                  View
                </a>
                <label className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors cursor-pointer">
                  {resumeUploading ? "Uploading..." : "Replace"}
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleResumeUpload}
                    className="hidden"
                    disabled={resumeUploading}
                  />
                </label>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-white/10 hover:border-violet-500/30 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-slate-500 mb-3" />
              <p className="text-sm font-medium text-white mb-1">Upload your resume</p>
              <p className="text-xs text-slate-500">PDF up to 5MB</p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleResumeUpload}
                className="hidden"
                disabled={resumeUploading}
              />
            </label>
          )}
        </div>

        {/* Professional */}
        <div className="bg-[#13161E] rounded-xl border border-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-violet-400" />
            Professional Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Skills (comma separated)</label>
              <input
                type="text"
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                placeholder="Python, JavaScript, React, Machine Learning"
                className="w-full bg-[#0A0C10] border border-white/5 text-white placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Experience</label>
              <textarea
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
                placeholder="Describe your work experience..."
                rows={3}
                className="w-full bg-[#0A0C10] border border-white/5 text-white placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Education</label>
              <textarea
                value={form.education}
                onChange={(e) => setForm({ ...form, education: e.target.value })}
                placeholder="Your educational background..."
                rows={2}
                className="w-full bg-[#0A0C10] border border-white/5 text-white placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-[#13161E] rounded-xl border border-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-violet-400" />
            Links
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                <Linkedin className="w-3.5 h-3.5" />
                LinkedIn
              </label>
              <input
                type="url"
                value={form.linkedin}
                onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/you"
                className="w-full bg-[#0A0C10] border border-white/5 text-white placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                <Github className="w-3.5 h-3.5" />
                GitHub
              </label>
              <input
                type="url"
                value={form.github}
                onChange={(e) => setForm({ ...form, github: e.target.value })}
                placeholder="https://github.com/you"
                className="w-full bg-[#0A0C10] border border-white/5 text-white placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                <Globe className="w-3.5 h-3.5" />
                Portfolio
              </label>
              <input
                type="url"
                value={form.portfolio}
                onChange={(e) => setForm({ ...form, portfolio: e.target.value })}
                placeholder="https://yourportfolio.com"
                className="w-full bg-[#0A0C10] border border-white/5 text-white placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400 disabled:opacity-60 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
