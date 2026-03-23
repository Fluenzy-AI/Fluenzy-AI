"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { JobCard } from "@/components/careers/JobCard";
import { FilterBar } from "@/components/careers/FilterBar";
import { JobCardSkeleton } from "@/components/shared/SkeletonLoader";
import { SimpleCounter } from "@/components/shared/AnimatedCounter";
import { Briefcase, Search, Filter, ArrowDown, Mail } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type LocationType = "REMOTE" | "HYBRID" | "ONSITE";
type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";

interface Job {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: LocationType;
  employmentType: EmploymentType;
  experienceYears: string;
  salaryRange?: string;
  skills: string[];
  isActive: boolean;
  createdAt: string;
  _count: { applications: number };
}

interface CandidateSession {
  id: string;
  name: string;
  email: string;
  skills?: string[];
}

interface FilterState {
  search: string;
  department: string;
  location: string;
  employmentType: string;
}

// ── Constants ──────────────────────────────────────────────────────────────
const PERKS = [
  { icon: "🚀", title: "High Impact Work", desc: "Your code reaches thousands of learners every day." },
  { icon: "🌍", title: "Remote-First", desc: "Work from anywhere. We care about outcomes." },
  { icon: "🧠", title: "Learn & Grow", desc: "Annual learning budget and conference allowances." },
  { icon: "💡", title: "Innovate Freely", desc: "Bring ideas to the table. We embrace curiosity." },
  { icon: "🤝", title: "Great Team", desc: "Collaborate with passionate A-players." },
  { icon: "💰", title: "Competitive Pay", desc: "Market-aligned salaries and ESOPs." },
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

const FAQ = [
  { q: "What is the hiring process?", a: "Apply online → HR screen → Technical round → Culture fit → Offer. Typically 2–3 weeks." },
  { q: "Is it fully remote?", a: "Yes, most roles are remote-first. Some hybrid roles exist in Bangalore." },
  { q: "What stack do you use?", a: "Next.js 15, TypeScript, Tailwind CSS, Prisma, MongoDB, Python (AI)." },
  { q: "Do you offer internships?", a: "Yes! Both paid internships and full-time roles across Engineering, Design, and Marketing." },
  { q: "How should I prepare?", a: "Research our product, think of real examples, and bring genuine curiosity." },
];

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

// ── Empty State ────────────────────────────────────────────────────────────
function EmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-[20px] border border-dashed border-white/[0.1] bg-[#13161E]/50 py-16 text-center"
    >
      {/* Floating illustration */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="mb-6"
      >
        <div className="w-20 h-20 rounded-full bg-[#7C5CFC]/10 flex items-center justify-center mx-auto">
          <Search className="w-8 h-8 text-[#7C5CFC]" />
        </div>
      </motion.div>

      <h3 className="text-lg font-semibold text-[#F1F0F5] mb-2">
        No roles match your filters
      </h3>
      <p className="text-sm text-[#8B8A99] max-w-sm mx-auto mb-6">
        Try adjusting your search criteria or clearing some filters to see more results.
      </p>
      <button
        onClick={onClearFilters}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7C5CFC]/10 text-[#9F7FFF] hover:bg-[#7C5CFC]/20 text-sm font-medium transition-colors"
      >
        <Filter className="w-4 h-4" />
        Clear all filters
      </button>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function CareersClient() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filtered, setFiltered] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<string[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [candidate, setCandidate] = useState<CandidateSession | null | undefined>(undefined);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [displayCount, setDisplayCount] = useState(6);

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    department: "All",
    location: "All",
    employmentType: "All",
  });

  const positionsRef = useRef<HTMLDivElement>(null);

  // Fetch candidate session
  useEffect(() => {
    fetch("/api/candidates/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setCandidate(d?.candidate || null))
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
  }, [candidate]);

  // Apply filters
  useEffect(() => {
    let list = [...jobs];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(searchLower) ||
          j.department.toLowerCase().includes(searchLower) ||
          j.skills.some((s) => s.toLowerCase().includes(searchLower))
      );
    }

    if (filters.department !== "All") {
      list = list.filter((j) => j.department === filters.department);
    }

    if (filters.location !== "All") {
      list = list.filter((j) => j.location === filters.location);
    }

    if (filters.employmentType !== "All") {
      list = list.filter((j) => j.employmentType === filters.employmentType);
    }

    setFiltered(list);
    setDisplayCount(6); // Reset display count when filters change
  }, [filters, jobs, candidate]);

  const scrollToPositions = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveJob = (jobId: string) => {
    setSavedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      department: "All",
      location: "All",
      employmentType: "All",
    });
  };

  const displayedJobs = filtered.slice(0, displayCount);
  const hasMore = displayCount < filtered.length;

  return (
    <div className="min-h-screen bg-[#0D0F14] text-[#F1F0F5]">
      {/* ── Open Positions ── */}
      <section ref={positionsRef} className="pt-24 pb-20 px-4 bg-[#0D0F14]">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Open Positions</h2>
            {candidate && candidate.skills && candidate.skills.length > 0 ? (
              <p className="text-[#8B8A99] text-lg">
                Showing roles matching your {candidate.skills.slice(0, 3).join(", ")} skills
              </p>
            ) : (
              <p className="text-[#8B8A99] text-lg">Find your next opportunity and make an impact.</p>
            )}
          </FadeIn>

          {/* Filter Bar */}
          <FadeIn delay={0.05} className="mb-8">
            <FilterBar
              departments={departments}
              resultsCount={filtered.length}
              filters={filters}
              onFilterChange={setFilters}
              loading={loading}
            />
          </FadeIn>

          {/* Jobs Grid */}
          {loading ? (
            <div className="grid gap-5 md:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState onClearFilters={clearFilters} />
          ) : (
            <>
              <div className="grid gap-5 md:grid-cols-2">
                {displayedJobs.map((job, i) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    index={i}
                    isSaved={savedJobs.has(job.id)}
                    onSave={handleSaveJob}
                  />
                ))}
              </div>

              {/* Load more button */}
              {hasMore && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => setDisplayCount((prev) => prev + 6)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm font-medium hover:bg-white/[0.08] transition-colors"
                  >
                    Load more ({filtered.length - displayCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-20 px-4">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] rounded-full bg-[#7C5CFC]/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] rounded-full bg-[#A855F7]/8 blur-[100px]" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-full border border-[#7C5CFC]/30 bg-[#7C5CFC]/5 text-[#9F7FFF] mb-6">
              <span className="w-2 h-2 rounded-full bg-[#7C5CFC] animate-pulse" />
              We're Hiring
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            Build the Future of
            <br />
            <span className="bg-gradient-to-r from-[#7C5CFC] via-[#A855F7] to-[#EC4899] bg-clip-text text-transparent">
              AI-Powered Learning
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-[#8B8A99] max-w-2xl mx-auto mb-10"
          >
            Join the team behind Fluenzy AI — helping millions level up their communication skills through the power of AI.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <button
              onClick={scrollToPositions}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #6B46FF 0%, #A855F7 50%, #EC4899 100%)",
                boxShadow: "0 8px 24px rgba(124,92,252,0.25)",
              }}
            >
              View Open Positions
              <ArrowDown className="w-4 h-4" />
            </button>

            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/[0.1] bg-white/[0.04] font-semibold hover:bg-white/[0.08] transition-all"
            >
              Learn About Us
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-wrap justify-center gap-8 mt-16"
          >
            {[
              { value: jobs.length, label: "Open Positions", suffix: "" },
              { value: 50, label: "Active Learners", suffix: "K+" },
              { value: 15, label: "Team Members", suffix: "+" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold">
                  <SimpleCounter value={s.value} duration={600} />
                  {s.suffix}
                </p>
                <p className="text-sm text-[#8B8A99] mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Why Join ── */}
      <section className="py-20 px-4 bg-[#13161E]/50">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Work at Fluenzy AI?</h2>
            <p className="text-[#8B8A99] text-lg max-w-xl mx-auto">
              We've built a culture where talented people do the best work of their careers.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PERKS.map((perk, i) => (
              <FadeIn key={perk.title} delay={i * 0.07}>
                <div className="group h-full rounded-[14px] border border-white/[0.06] bg-[#13161E] hover:border-[#7C5CFC]/30 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-[#7C5CFC]/5 hover:-translate-y-0.5">
                  <div className="text-3xl mb-4">{perk.icon}</div>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-[#9F7FFF] transition-colors">
                    {perk.title}
                  </h3>
                  <p className="text-[#8B8A99] text-sm leading-relaxed">{perk.desc}</p>
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
            <p className="text-[#8B8A99] text-lg">We take care of our team so you can focus on building.</p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {BENEFITS.map((b) => (
                <div
                  key={b.label}
                  className="flex flex-col items-center gap-2.5 p-5 rounded-[14px] border border-white/[0.06] bg-[#13161E]/60 hover:border-[#7C5CFC]/30 transition-all text-center group"
                >
                  <span className="text-2xl">{b.icon}</span>
                  <span className="text-sm font-medium group-hover:text-[#9F7FFF] transition-colors">
                    {b.label}
                  </span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-4 bg-[#13161E]/30">
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-[#8B8A99] text-lg">Everything you need to know about working at Fluenzy AI.</p>
          </FadeIn>

          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <div className="rounded-[14px] border border-white/[0.06] bg-[#13161E]/60 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-semibold hover:text-[#9F7FFF] transition-colors"
                  >
                    {item.q}
                    <motion.svg
                      animate={{ rotate: openFaq === i ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-4 h-4 text-[#52515E]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </motion.svg>
                  </button>
                  <motion.div
                    initial={false}
                    animate={{ height: openFaq === i ? "auto" : 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-4 text-sm text-[#8B8A99] leading-relaxed">{item.a}</p>
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
          <div className="max-w-3xl mx-auto text-center rounded-[20px] border border-[#7C5CFC]/20 bg-gradient-to-br from-[#7C5CFC]/5 via-[#A855F7]/5 to-[#EC4899]/5 p-12">
            <h2 className="text-3xl font-bold mb-4">Don't see a role you like?</h2>
            <p className="text-[#8B8A99] text-lg mb-8 max-w-md mx-auto">
              We're always looking for exceptional talent. Send your resume and we'll reach out if there's a fit.
            </p>
            <a
              href="mailto:careers@fluenzyai.app"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white transition-all hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg, #6B46FF 0%, #A855F7 50%, #EC4899 100%)",
                boxShadow: "0 8px 24px rgba(124,92,252,0.25)",
              }}
            >
              <Mail className="w-4 h-4" />
              Email Your Resume
            </a>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
