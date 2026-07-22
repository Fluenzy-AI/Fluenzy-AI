import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, LogIn, FilePlus, Users, BarChart3, BookOpen, ShieldCheck, CheckCircle2, Sparkles, Building2 } from "lucide-react";

export const metadata: Metadata = {
  title: "College Admin Portal - Campus Placement & Student AI Training | FluenzyAI",
  description: "Manage student placement preparation, assign AI interview modules, track student progress, and boost campus placement rates with FluenzyAI College Portal.",
};

const STATS = [
  { value: "200+", label: "Partner Institutions" },
  { value: "50K+", label: "Students Trained" },
  { value: "91%", label: "Placement Rate" },
  { value: "4.9★", label: "Admin Rating" },
];

const FEATURES = [
  {
    icon: Users,
    title: "Bulk Student Onboarding via CSV",
    description: "Effortlessly import entire batches, departments, and graduating classes with automated account creation.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Performance Analytics",
    description: "Monitor student interview readiness scores, technical mastery, and communication fluency across all departments.",
  },
  {
    icon: BookOpen,
    title: "Domain-Specific AI Learning Paths",
    description: "Assign customized training paths tailored for Software Engineering, Product Management, Data Science, and HR rounds.",
  },
  {
    icon: ShieldCheck,
    title: "Campus Placement Readiness Benchmarking",
    description: "Evaluate your college's placement readiness against FAANG-level benchmarks before campus recruitment drives.",
  },
];

export default function CollegePortalPage() {
  return (
    <main className="min-h-screen bg-background text-foreground py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Top Header Badge */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-red-500 uppercase bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-full">
            <GraduationCap className="w-4 h-4" /> For Colleges & Universities
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight">
            Take Your Campus Placements{" "}
            <span className="bg-gradient-to-r from-red-600 to-rose-600 !bg-clip-text text-transparent">
              To The Next Level
            </span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-xl max-w-2xl mx-auto font-medium">
            Give your students access to AI-powered mock interviews, group discussion practice, and real-time placement analytics.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center bg-card border border-border rounded-2xl py-6 px-4 shadow-sm hover:border-red-500/30 transition-all">
              <p className="text-3xl sm:text-4xl font-black text-foreground">{s.value}</p>
              <p className="text-xs sm:text-sm font-semibold text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">{f.description}</p>
            </div>
          ))}
        </div>

        {/* Main Portal Action Banner */}
        <div className="bg-card border border-red-500/30 rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-lg text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" /> Institutional Portal Access
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              College Admin Dashboard
            </h2>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              Already a partner? Sign in to manage your students, or apply for an institutional partnership today.
            </p>
          </div>

          <div className="w-full md:w-80 space-y-3">
            <Link
              href="/college/login"
              className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-base shadow-lg shadow-red-600/25 hover:scale-[1.02] transition-all"
            >
              <LogIn className="w-5 h-5" />
              College Admin Sign In
            </Link>

            <Link
              href="/college/signup"
              className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-background border border-border text-foreground font-bold text-base hover:bg-muted transition-all"
            >
              <FilePlus className="w-5 h-5 text-red-500" />
              Apply for Partnership
            </Link>
            <p className="text-center text-xs text-muted-foreground font-semibold pt-1">
              Approval within 1–2 business days · Free to apply
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}
