import type { Metadata } from "next";
import Link from "next/link";
import { Building2, LogIn, FilePlus, Users, BarChart3, Briefcase, CheckCircle2, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Company Portal - AI-Powered Recruitment & Hiring | FluenzyAI",
  description: "Post jobs, manage candidate applications, conduct automated AI screening, and access real-time hiring analytics on FluenzyAI Company Portal.",
};

const STATS = [
  { value: "500+", label: "Companies Hiring" },
  { value: "10K+", label: "Jobs Posted" },
  { value: "50K+", label: "Candidates Placed" },
  { value: "4.8★", label: "Company Rating" },
];

const FEATURES = [
  {
    icon: Briefcase,
    title: "Job Posting & Application Pipeline",
    description: "Publish job listings with automated skill tags, custom questions, and real-time candidate applicant tracking.",
  },
  {
    icon: Users,
    title: "AI Candidate Database Access",
    description: "Search and filter top candidates evaluated on real interview performance scores and communication metrics.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Hiring Analytics",
    description: "Track conversion funnels, interview completion rates, and benchmark candidates against FAANG standards.",
  },
  {
    icon: ShieldCheck,
    title: "Automated AI Screening & Reports",
    description: "Get detailed transcripts, behavioral scores, and automated feedback summaries for every candidate.",
  },
];

export default function CompanyPortalPage() {
  return (
    <main className="min-h-screen bg-background text-foreground py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Top Header Badge */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-red-500 uppercase bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-full">
            <Building2 className="w-4 h-4" /> For Companies & Employers
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight">
            Hire Top Talent with{" "}
            <span className="bg-gradient-to-r from-red-600 to-rose-600 !bg-clip-text text-transparent">
              AI-Powered Recruitment
            </span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-xl max-w-2xl mx-auto font-medium">
            Post jobs, evaluate candidates with automated AI interviews, and streamline your entire hiring workflow.
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
              <Sparkles className="w-3.5 h-3.5" /> Employer Portal Access
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              Ready to build your team?
            </h2>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              Log in to your existing employer dashboard or register a new company profile to start posting jobs for free.
            </p>
          </div>

          <div className="w-full md:w-80 space-y-3">
            <Link
              href="/company/login"
              className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-base shadow-lg shadow-red-600/25 hover:scale-[1.02] transition-all"
            >
              <LogIn className="w-5 h-5" />
              Company Login
            </Link>

            <Link
              href="/company/signup"
              className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-background border border-border text-foreground font-bold text-base hover:bg-muted transition-all"
            >
              <FilePlus className="w-5 h-5 text-red-500" />
              Register Company
            </Link>
            <p className="text-center text-xs text-muted-foreground font-semibold pt-1">
              Post jobs & hire talent for free
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}
