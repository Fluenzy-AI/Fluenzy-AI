"use client";
import Link from "next/link";
import { Building2, LogIn, FilePlus, Users, BarChart3, BookOpen } from "lucide-react";
import Card3D from "@/components/ui/Card3D";

const STATS = [
  { value: "200+", label: "Partner Institutions" },
  { value: "50K+", label: "Students Trained" },
  { value: "91%", label: "Placement Rate" },
  { value: "4.9★", label: "Admin Rating" },
];

const FEATURES = [
  { icon: <Users className="w-5 h-5 text-indigo-400" />, text: "Bulk student onboarding via CSV" },
  { icon: <BarChart3 className="w-5 h-5 text-purple-400" />, text: "Real-time performance analytics" },
  { icon: <BookOpen className="w-5 h-5 text-cyan-400" />, text: "Curated AI learning paths per domain" },
];

export default function CollegeCta() {
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
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-indigo-400 uppercase bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full">
            <Building2 className="w-4 h-4" /> For Colleges & Universities
          </span>
        </div>

        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Take your campus placements{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              to the next level
            </span>
          </h2>
          <p className="text-slate-400 mt-4 text-lg leading-relaxed">
            Give your students access to AI-powered mock interviews, group discussion practice, and real-time analytics — all managed from your college admin portal.
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
        <Card3D depth={40} glowColor="rgba(99, 102, 241, 0.4)">
          <div className="bg-gradient-to-br from-[#0d1330] to-[#0f1840] border border-indigo-500/30 rounded-3xl p-10 md:p-14 flex flex-col md:flex-row items-center gap-10 shadow-2xl">
            {/* Left: features */}
            <div className="flex-1 space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/30 mb-2">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">College Admin Portal</h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                One dashboard to manage all your students, track their progress, assign modules, and measure placement readiness.
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
                Already a partner? Sign in to your dashboard.
              </p>

              <Link
                href="/college/login"
                className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-base hover:from-indigo-600 hover:to-purple-700 transition-all shadow-xl shadow-indigo-500/25 group"
              >
                <LogIn className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                College Admin Sign In
              </Link>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/[0.07]" />
                <span className="text-xs text-slate-600">or</span>
                <div className="flex-1 h-px bg-white/[0.07]" />
              </div>

              <Link
                href="/college/signup"
                className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-white/[0.05] border border-indigo-500/30 text-white font-semibold text-base hover:bg-indigo-500/10 hover:border-indigo-400/50 transition-all group"
              >
                <FilePlus className="w-5 h-5 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                Apply for Partnership
              </Link>

              <p className="text-center text-xs text-slate-600 pt-1">
                Approval within 1–2 business days · Free to apply
              </p>
            </div>
          </div>
        </Card3D>
      </div>
    </section>
  );
}
