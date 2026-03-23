"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye, EyeOff, Building2, Mail, Lock, ArrowLeft, Briefcase,
  Zap, Globe, Users, BarChart3,
} from "lucide-react";

const BENEFITS = [
  {
    icon: <Globe className="w-5 h-5 text-indigo-400" />,
    title: "Reach Thousands of Candidates",
    desc: "Post jobs to our growing network of trained, interview-ready candidates.",
  },
  {
    icon: <Zap className="w-5 h-5 text-purple-400" />,
    title: "Auto-Apply Engine",
    desc: "Let our AI match your jobs with qualified candidates automatically.",
  },
  {
    icon: <Users className="w-5 h-5 text-cyan-400" />,
    title: "Team Collaboration",
    desc: "Invite your HR team with role-based access control.",
  },
  {
    icon: <BarChart3 className="w-5 h-5 text-emerald-400" />,
    title: "AI-Powered Analytics",
    desc: "View Fluenzy scores, communication ratings, and interview readiness.",
  },
];

export default function CompanyLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/company/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed. Please try again.");
        return;
      }
      // Redirect to company portal
      router.push("/company/portal");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full bg-[#0f172a]/80 border border-slate-700/60 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all";

  return (
    <div className="min-h-screen flex bg-[#080d1a]">
      {/* ── LEFT BRANDING PANEL ── */}
      <div className="hidden lg:flex lg:w-[48%] flex-col justify-between bg-gradient-to-br from-[#0d1330] via-[#0f1840] to-[#0a0f28] p-12 relative overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-indigo-700/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-700/15 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-indigo-500/30">
            F
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">Fluenzy AI</span>
        </div>

        {/* Hero */}
        <div className="relative z-10 space-y-8">
          <div>
            <span className="inline-block text-xs font-semibold tracking-widest text-indigo-400 uppercase bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full mb-5">
              Company Portal
            </span>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Recruiter
              </span>
            </h1>
            <p className="text-slate-400 mt-4 text-base leading-relaxed max-w-sm">
              Access your dashboard to manage job postings, review applications, and connect with top talent.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            {BENEFITS.map((b) => (
              <div key={b.title} className="flex items-start gap-4 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                  {b.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{b.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Briefcase className="w-4 h-4" />
            <span>
              Looking for a job?{" "}
              <Link href="/jobs" className="text-indigo-400 hover:underline">
                Browse Jobs
              </Link>
            </span>
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="flex-1 flex flex-col min-h-screen bg-[#080d1a] overflow-y-auto">
        {/* Mobile back link */}
        <div className="lg:hidden px-6 pt-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Fluenzy AI
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10 lg:py-12">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/25 flex-shrink-0">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Company Login</h2>
                <p className="text-slate-400 text-sm mt-0.5">Sign in to your HR dashboard</p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                <span className="mt-0.5 text-red-400">!</span>
                {error}
              </div>
            )}

            {/* Card */}
            <div className="bg-[#0d1427]/70 border border-slate-700/40 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Work Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="hr@company.com"
                      required
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      required
                      className="w-full bg-[#0f172a]/80 border border-slate-700/60 rounded-xl pl-11 pr-10 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <Link
                    href="/company/forgot-password"
                    className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>

                <p className="text-center text-sm text-slate-500 pt-2">
                  Don&apos;t have an account?{" "}
                  <Link href="/company/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                    Register your company
                  </Link>
                </p>
              </form>
            </div>

            {/* Help text */}
            <p className="text-center text-xs text-slate-600 mt-6">
              Need help?{" "}
              <a href="mailto:support@fluenzyai.app" className="text-indigo-400 hover:underline">
                Contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
