"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye, EyeOff, Building2, Mail, Lock, ArrowLeft,
  Users, BarChart3, BookOpen, ShieldCheck
} from "lucide-react";
import { useCollegeAdmin } from "@/contexts/CollegeAdminContext";

const OAUTH_ERRORS: Record<string, string> = {
  not_registered:   "No college account found for this Google email. Please sign up first or use email/password.",
  pending:          "Your application is still under review. You will be notified once approved.",
  rejected:         "Your partnership application has been rejected. Please contact support.",
  suspended:        "Your account has been suspended. Please contact support.",
  google_failed:    "Google sign-in failed. Please try again or use email/password.",
  google_cancelled: "Google sign-in was cancelled.",
};

const FEATURES = [
  { icon: Users,      title: "Bulk Student Management",  desc: "Upload hundreds of students via CSV in seconds." },
  { icon: BarChart3,  title: "Real-time Analytics",      desc: "Track scores, sessions & module usage per student." },
  { icon: BookOpen,   title: "Curated Learning Paths",   desc: "Assign AI modules tailored to your campus needs." },
  { icon: ShieldCheck,title: "Domain-verified Access",   desc: "Secure institutional login with email domain check." },
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useCollegeAdmin();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // Read OAuth error from redirect
  useEffect(() => {
    const err = searchParams.get("error");
    if (err && OAUTH_ERRORS[err]) setError(OAUTH_ERRORS[err]);
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError("All fields are required."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/college/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Login failed."); return; }
      login(data.token, data.admin);
      router.push("/college/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    window.location.href = "/api/college/google-auth";
  };

  return (
    <div className="min-h-screen flex bg-[#0a0f1e]">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 bg-gradient-to-br from-[#0d1427] via-[#111c3a] to-[#0a0f1e] border-r border-slate-800/60">
        {/* Glow blobs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-black text-lg">F</span>
            </div>
            <span className="text-white font-bold text-xl">Fluenzy AI</span>
          </Link>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-6">
          <div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 tracking-wide uppercase">
              College Partner Portal
            </span>
            <h1 className="text-4xl font-extrabold text-white mt-4 leading-tight">
              Empower your students<br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                with AI-powered learning
              </span>
            </h1>
            <p className="text-slate-400 mt-3 text-base leading-relaxed max-w-sm">
              Manage your institution's student progress, track analytics, and assign curated AI practice modules — all from one dashboard.
            </p>
          </div>

          {/* Feature list */}
          <div className="grid grid-cols-1 gap-3 max-w-sm">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <div className="relative z-10">
          <p className="text-xs text-slate-600">
            Students should log in at{" "}
            <Link href="/login" className="text-slate-500 hover:text-slate-400 underline underline-offset-2">
              fluenzyai.app/login
            </Link>
          </p>
        </div>
      </div>

      {/* ── Right login panel ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative overflow-auto">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative">
          {/* Mobile back link */}
          <Link href="/" className="lg:hidden inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Fluenzy AI
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">College Admin Portal</h2>
                <p className="text-slate-400 text-sm">Sign in to manage your institution</p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm leading-relaxed">
              {error}
            </div>
          )}

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-black/20 mb-5"
          >
            {googleLoading ? (
              <span className="w-5 h-5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span className="text-sm font-semibold text-slate-700">
              {googleLoading ? "Redirecting to Google…" : "Continue with Google"}
            </span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-700/60" />
            <span className="text-xs text-slate-500 font-medium">or sign in with email</span>
            <div className="flex-1 h-px bg-slate-700/60" />
          </div>

          {/* Email / Password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Institutional Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="admin@university.ac.in" required autoComplete="email"
                  className="w-full bg-slate-800/60 border border-slate-600/60 rounded-xl pl-10 pr-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-slate-300">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange}
                  placeholder="••••••••" required autoComplete="current-password"
                  className="w-full bg-slate-800/60 border border-slate-600/60 rounded-xl pl-10 pr-10 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading || googleLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25 mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : "Sign In to Portal →"}
            </button>
          </form>

          {/* Bottom links */}
          <div className="mt-7 pt-6 border-t border-slate-700/50 space-y-3 text-center">
            <p className="text-sm text-slate-400">
              New institution?{" "}
              <Link href="/college/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Apply for Partnership
              </Link>
            </p>
            <p className="text-xs text-slate-600">
              Google sign-in only works for already-registered college admins.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CollegeLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e]">
        <span className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
