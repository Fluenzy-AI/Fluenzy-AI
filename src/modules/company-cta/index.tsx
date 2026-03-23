"use client";
import Link from "next/link";
import { Building2, LogIn, FilePlus, Users, BarChart3, Briefcase } from "lucide-react";

const STATS = [
  { value: "500+", label: "Companies Hiring" },
  { value: "10K+", label: "Jobs Posted" },
  { value: "50K+", label: "Candidates Placed" },
  { value: "4.8★", label: "Company Rating" },
];

const FEATURES = [
  { icon: <Briefcase className="w-5 h-5 text-indigo-400" />, text: "Post jobs & manage applications" },
  { icon: <Users className="w-5 h-5 text-purple-400" />, text: "Access candidate database" },
  { icon: <BarChart3 className="w-5 h-5 text-cyan-400" />, text: "Real-time hiring analytics" },
];

export default function CompanyCta() {
  return (
    <section className="relative py-24 overflow-hidden bg-[#06090f]">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-700/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-700/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Top badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-purple-400 uppercase bg-purple-500/10 border border-purple-500/20 px-4 py-1.5 rounded-full">
            <Building2 className="w-4 h-4" /> For Companies
          </span>
        </div>

        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Hire top talent with{" "}
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              AI-powered recruiting
            </span>
          </h2>
          <p className="text-slate-400 mt-4 text-lg leading-relaxed">
            Post jobs, manage applications, and find the best candidates with our AI-powered recruitment platform.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {STATS.map((s) => (
            <div key={s.label} className="text-center bg-white/[0.03] border border-white/[0.07] rounded-2xl py-5 px-4">
              <p className="text-3xl font-bold text-white">{s.value}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Main card */}
        <div className="bg-gradient-to-br from-[#0d1330] to-[#0f1840] border border-purple-500/20 rounded-3xl p-10 md:p-14 flex flex-col md:flex-row items-center gap-10">
          {/* Left: features */}
          <div className="flex-1 space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-600 flex items-center justify-center shadow-xl shadow-purple-500/30 mb-2">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">Company Portal</h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Post jobs, manage applications, and find the best candidates with our AI-powered recruitment platform.
            </p>
            <div className="space-y-3 pt-1">
              {FEATURES.map((f) => (
                <div key={f.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                    {f.icon}
                  </div>
                  <span className="text-sm text-slate-300">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px self-stretch bg-white/[0.06]" />

          {/* Right: CTA buttons */}
          <div className="flex-shrink-0 w-full md:w-80 space-y-4">
            <p className="text-slate-400 text-sm text-center md:text-left mb-2">
              Already registered? Sign in to your portal.
            </p>

            <Link
              href="/company/login"
              className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-600 text-white font-semibold text-base hover:from-purple-600 hover:to-cyan-700 transition-all shadow-xl shadow-purple-500/25 group"
            >
              <LogIn className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              Company Login
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/[0.07]" />
              <span className="text-xs text-slate-600">or</span>
              <div className="flex-1 h-px bg-white/[0.07]" />
            </div>

            <Link
              href="/company/signup"
              className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-white/[0.05] border border-purple-500/30 text-white font-semibold text-base hover:bg-purple-500/10 hover:border-purple-400/50 transition-all group"
            >
              <FilePlus className="w-5 h-5 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
              Register Company
            </Link>

            <p className="text-center text-xs text-slate-600 pt-1">
              Post jobs & hire talent for free
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
