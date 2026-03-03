"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────────────────
interface Job {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: "REMOTE" | "HYBRID" | "ONSITE";
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
  experienceYears: string;
  salaryRange?: string;
  skills: string[];
  isActive: boolean;
  createdAt: string;
  _count: { applications: number };
}

interface CandidateSession { id: string; name: string; email: string }

// ── Constants ──────────────────────────────────────────────────────────────
const LOC_LABELS: Record<string, string> = { REMOTE: "Remote", HYBRID: "Hybrid", ONSITE: "On-site" };
const LOC_COLORS: Record<string, string> = {
  REMOTE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  HYBRID: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ONSITE: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};
const TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

const PERKS = [
  { icon: "🚀", title: "High Impact Work", desc: "Your code reaches thousands of learners every day. Ship features that matter." },
  { icon: "🌍", title: "Remote-First", desc: "Work from anywhere. We care about outcomes, not hours at a desk." },
  { icon: "🧠", title: "Learn & Grow", desc: "Annual learning budget, conference allowances, and internal knowledge sharing." },
  { icon: "💡", title: "Innovate Freely", desc: "Bring ideas to the table. We embrace experimentation and reward curiosity." },
  { icon: "🤝", title: "Great Team", desc: "Collaborate with passionate A-players who love what they build." },
  { icon: "💰", title: "Competitive Pay", desc: "Market-aligned salaries, ESOPs, and performance bonuses." },
];

const BENEFITS = [
  { icon: "🏥", label: "Health Insurance" },
  { icon: "🏖️", label: "Flexible PTO" },
  { icon: "📚", label: "Learning Budget" },
  { icon: "💻", label: "Home Office Setup" },
  { icon: "🎉", label: "Team Retreats" },
  { icon: "📈", label: "ESOPs" },
  { icon: "🍕", label: "Team Lunches" },
  { icon: "⚙️", label: "Latest Tools" },
];

const VALUES = [
  { label: "Ownership", color: "from-violet-500 to-purple-600" },
  { label: "Transparency", color: "from-blue-500 to-cyan-600" },
  { label: "Speed", color: "from-orange-500 to-amber-600" },
  { label: "Craftsmanship", color: "from-pink-500 to-rose-600" },
];

const FAQ = [
  { q: "What is the hiring process?", a: "Apply online → HR screen → Technical round → Culture fit → Offer. Typically 2–3 weeks." },
  { q: "Is it fully remote?", a: "Yes, most roles are remote-first. Some hybrid roles exist in Bangalore, India." },
  { q: "What stack do you use?", a: "Next.js 15, TypeScript, Tailwind CSS, Prisma, MongoDB, Python (AI backend), and more." },
  { q: "Do you offer internships?", a: "Yes! We offer both paid internships and full-time roles across Engineering, Design, and Marketing." },
  { q: "How should I prepare?", a: "Research our product, think of real examples from your experience, and bring genuine curiosity." },
];

// ── Skeleton ───────────────────────────────────────────────────────────────
function JobSkeleton() {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/2 p-6 animate-pulse space-y-3">
      <div className="h-5 w-2/3 bg-white/10 rounded-lg" />
      <div className="h-4 w-1/3 bg-white/5 rounded-lg" />
      <div className="flex gap-2 mt-2">
        <div className="h-6 w-16 bg-white/5 rounded-full" />
        <div className="h-6 w-20 bg-white/5 rounded-full" />
      </div>
      <div className="h-8 w-24 bg-white/10 rounded-xl mt-4" />
    </div>
  );
}

// ── FadeIn wrapper ─────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function CareersClient() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filtered, setFiltered] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [locFilter, setLocFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [departments, setDepartments] = useState<string[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [candidate, setCandidate] = useState<CandidateSession | null | undefined>(undefined);
  const positionsRef = useRef<HTMLDivElement>(null);

  // Fetch candidate session
  useEffect(() => {
    fetch("/api/candidates/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => setCandidate(d?.candidate || null))
      .catch(() => setCandidate(null));
  }, []);

  // Fetch jobs
  useEffect(() => {
    fetch("/api/careers/jobs")
      .then((r) => r.json())
      .then((d) => {
        setJobs(d.jobs || []);
        setFiltered(d.jobs || []);
        setDepartments(d.meta?.departments || []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter
  useEffect(() => {
    let list = [...jobs];
    if (search) list = list.filter((j) => j.title.toLowerCase().includes(search.toLowerCase()) || j.department.toLowerCase().includes(search.toLowerCase()));
    if (deptFilter !== "All") list = list.filter((j) => j.department === deptFilter);
    if (locFilter !== "All") list = list.filter((j) => j.location === locFilter);
    if (typeFilter !== "All") list = list.filter((j) => j.employmentType === typeFilter);
    setFiltered(list);
  }, [search, deptFilter, locFilter, typeFilter, jobs]);

  const scrollToPositions = () => positionsRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Candidate Auth Banner ── */}
      {candidate !== undefined && (
        <div className="w-full bg-gradient-to-r from-violet-900/80 to-purple-900/80 backdrop-blur-md border-b border-violet-500/20 px-4 py-2.5">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            {candidate ? (
              <>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-black shrink-0">
                    {candidate.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-xs text-violet-100">
                    Welcome back, <strong className="text-white">{candidate.name.split(" ")[0]}</strong>! Track your applications and auto-fill forms.
                  </p>
                </div>
                <Link href="/candidates/dashboard"
                  className="shrink-0 text-xs font-bold px-4 py-1.5 rounded-full bg-violet-500 text-white hover:bg-violet-400 transition-all shadow-lg shadow-violet-500/30 whitespace-nowrap">
                  My Dashboard →
                </Link>
              </>
            ) : (
              <>
                <p className="text-xs text-violet-200 hidden sm:block">
                  <span className="text-white font-semibold">Candidate Portal:</span> Login or register to track applications, auto-fill forms and manage your profile.
                </p>
                <p className="text-xs text-violet-200 sm:hidden font-medium">Track applications &amp; auto-fill forms</p>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href="/candidates/login"
                    className="text-xs font-bold px-4 py-1.5 rounded-full border border-violet-400/50 text-violet-200 hover:text-white hover:border-violet-300 transition-all whitespace-nowrap">
                    Login
                  </Link>
                  <Link href="/candidates/signup"
                    className="text-xs font-bold px-4 py-1.5 rounded-full bg-white text-violet-900 hover:bg-violet-100 transition-all shadow-md whitespace-nowrap">
                    Register Free
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-24 pb-20 px-4">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] rounded-full bg-indigo-600/8 blur-[100px]" />
        </div>
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              We're Hiring
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-6"
          >
            Build the Future of
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              AI-Powered Learning
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Join the team behind Fluenzy AI — helping millions level up their communication skills and career prospects through the power of AI.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <button
              onClick={scrollToPositions}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/25"
            >
              View Open Positions
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-foreground font-semibold text-base hover:bg-white/8 transition-all hover:scale-[1.02]"
            >
              Learn About Us
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-wrap justify-center gap-8 mt-16 text-center"
          >
            {[
              { value: "50K+", label: "Active Learners" },
              { value: "15+", label: "Team Members" },
              { value: "Remote", label: "First Company" },
              { value: "2×", label: "YoY Growth" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Why Join ── */}
      <section className="py-20 px-4 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Work at Fluenzy AI?</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">We've built a culture where talented people do the best work of their careers.</p>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PERKS.map((perk, i) => (
              <FadeIn key={perk.title} delay={i * 0.07}>
                <div className="group h-full rounded-2xl border border-white/8 bg-card/50 hover:bg-card hover:border-primary/30 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5">
                  <div className="text-3xl mb-4">{perk.icon}</div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground group-hover:text-primary transition-colors">{perk.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{perk.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Benefits & Perks</h2>
            <p className="text-muted-foreground text-lg">We take care of our team so you can focus on building.</p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {BENEFITS.map((b) => (
                <div key={b.label} className="flex flex-col items-center gap-2.5 p-5 rounded-2xl border border-white/8 bg-card/30 hover:border-primary/30 hover:bg-card/60 transition-all text-center group">
                  <span className="text-2xl">{b.icon}</span>
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{b.label}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Company Culture / Values ── */}
      <section className="py-20 px-4 bg-card/20">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Our Culture & Values</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              We build in the open, move fast, and never stop learning. These principles guide every decision.
            </p>
          </FadeIn>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
            {VALUES.map((v, i) => (
              <FadeIn key={v.label} delay={i * 0.08}>
                <div className={`rounded-2xl bg-gradient-to-br ${v.color} p-[1px]`}>
                  <div className="h-full rounded-[15px] bg-background/90 backdrop-blur-sm flex items-center justify-center py-6 px-4">
                    <span className="text-base font-semibold text-center text-foreground">{v.label}</span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.15}>
            <div className="rounded-2xl border border-white/8 bg-card/40 p-8 text-center">
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                "We believe that when smart, motivated people are given autonomy and clear goals, they build extraordinary things. Our team is our most important product."
              </p>
              <p className="mt-4 text-sm font-semibold text-primary">— Fluenzy AI Leadership</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Open Positions ── */}
      <section ref={positionsRef} className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Open Positions</h2>
            <p className="text-muted-foreground text-lg">Find your next opportunity and make an impact.</p>
          </FadeIn>

          {/* Filters */}
          <FadeIn delay={0.05} className="mb-8">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" /></svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search roles..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="bg-white/5 border border-white/10 text-foreground rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="All">All Departments</option>
                {departments.map((d) => <option key={d}>{d}</option>)}
              </select>
              <select value={locFilter} onChange={(e) => setLocFilter(e.target.value)} className="bg-white/5 border border-white/10 text-foreground rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="All">All Locations</option>
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ONSITE">On-site</option>
              </select>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-white/5 border border-white/10 text-foreground rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="All">All Types</option>
                <option value="FULL_TIME">Full-time</option>
                <option value="PART_TIME">Part-time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </div>
          </FadeIn>

          {/* Position Count */}
          {!loading && (
            <p className="text-sm text-muted-foreground mb-5">
              {filtered.length === 0 ? "No positions match your filters" : `${filtered.length} open position${filtered.length !== 1 ? "s" : ""}`}
            </p>
          )}

          {/* Jobs Grid */}
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[...Array(4)].map((_, i) => <JobSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <FadeIn>
              <div className="rounded-2xl border border-dashed border-white/10 py-20 text-center">
                <div className="text-5xl mb-4">🔭</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No openings right now</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                  We don't have any open positions matching your filters. Try adjusting your search or check back soon.
                </p>
                <button
                  onClick={() => { setSearch(""); setDeptFilter("All"); setLocFilter("All"); setTypeFilter("All"); }}
                  className="text-sm text-primary hover:underline"
                >
                  Clear filters
                </button>
              </div>
            </FadeIn>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((job, i) => (
                <FadeIn key={job.id} delay={i * 0.05}>
                  <div className="group h-full rounded-2xl border border-white/8 bg-card/40 hover:bg-card hover:border-primary/30 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 flex flex-col">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors leading-tight">{job.title}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{job.department}</p>
                      </div>
                      <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full border font-medium ${LOC_COLORS[job.location]}`}>
                        {LOC_LABELS[job.location]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span className="text-xs bg-white/5 text-muted-foreground border border-white/8 px-2 py-0.5 rounded-full">{TYPE_LABELS[job.employmentType]}</span>
                      <span className="text-xs bg-white/5 text-muted-foreground border border-white/8 px-2 py-0.5 rounded-full">{job.experienceYears}</span>
                      {job.salaryRange && <span className="text-xs bg-emerald-500/5 text-emerald-400 border border-emerald-500/15 px-2 py-0.5 rounded-full">{job.salaryRange}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-5">
                      {job.skills.slice(0, 4).map((s) => (
                        <span key={s} className="text-xs bg-primary/5 text-primary/80 px-2 py-0.5 rounded-md">{s}</span>
                      ))}
                      {job.skills.length > 4 && <span className="text-xs text-muted-foreground">+{job.skills.length - 4}</span>}
                    </div>
                    <div className="mt-auto flex items-center gap-3">
                      <Link
                        href={`/careers/${job.slug}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Apply Now
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                      </Link>
                      <button
                        onClick={() => { if (navigator.share) navigator.share({ title: job.title, url: `${window.location.origin}/careers/${job.slug}` }); else navigator.clipboard.writeText(`${window.location.origin}/careers/${job.slug}`); }}
                        className="p-2 rounded-xl border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:border-white/20 transition-all"
                        title="Share"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" /></svg>
                      </button>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-4 bg-card/20">
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-lg">Everything you need to know about working at Fluenzy AI.</p>
          </FadeIn>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <div className="rounded-2xl border border-white/8 bg-card/40 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    {item.q}
                    <svg className={`w-4 h-4 text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <motion.div
                    initial={false}
                    animate={{ height: openFaq === i ? "auto" : 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                  </motion.div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <section className="py-20 px-4">
        <FadeIn>
          <div className="max-w-3xl mx-auto text-center rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-violet-500/5 to-indigo-500/5 p-12">
            <h2 className="text-3xl font-bold mb-4">Don't see a role you like?</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
              We're always looking for exceptional talent. Send your resume and we'll reach out if there's a fit.
            </p>
            <a
              href="mailto:careers@fluenzyai.app"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all hover:scale-[1.02]"
            >
              Email Your Resume
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </a>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
