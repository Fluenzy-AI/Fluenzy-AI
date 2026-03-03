"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: "📋",
    title: "Track Applications",
    desc: "See real-time status of every job you apply to — Pending, Shortlisted, Interview Scheduled and more.",
  },
  {
    icon: "⚡",
    title: "Auto-Fill Forms",
    desc: "Build your profile once. Click 'Fill from Profile' on any job to instantly populate the application form.",
  },
  {
    icon: "📄",
    title: "Resume Management",
    desc: "Upload your PDF resume once. It's securely stored and ready to attach to any application in one click.",
  },
  {
    icon: "📅",
    title: "Interview Alerts",
    desc: "Get notified when an HR team schedules an interview for you with the exact date and time.",
  },
  {
    icon: "🧑‍💼",
    title: "Professional Profile",
    desc: "Maintain a rich candidate profile — skills, education, experience, LinkedIn, portfolio and more.",
  },
  {
    icon: "🔒",
    title: "Private & Secure",
    desc: "Your data is encrypted and only shared with the hiring team for roles you explicitly apply to.",
  },
];

const STEPS = [
  { num: "01", title: "Create your account", desc: "Register free in under 60 seconds." },
  { num: "02", title: "Build your profile", desc: "Add your details, skills and upload your resume." },
  { num: "03", title: "Apply to open roles", desc: "Browse jobs and auto-fill forms from your profile." },
  { num: "04", title: "Track your progress", desc: "Monitor application status from your dashboard." },
];

export default function CandidatesPortalPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/candidates/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.candidate) {
          router.replace("/candidates/dashboard");
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Gradient bg */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[700px] h-[700px] rounded-full bg-violet-600/8 blur-[140px]" />
        <div className="absolute bottom-0 right-[10%] w-[500px] h-[500px] rounded-full bg-indigo-600/6 blur-[100px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 pt-28 pb-20">

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-xs text-violet-300 font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Candidate Portal — Fluenzy AI
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-foreground leading-tight mb-4">
            Your Career Journey,<br />
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              All in One Place
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
            Register once. Auto-fill job applications. Track every application status in real time. Get notified when interviews are scheduled.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/candidates/signup"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-violet-600 to-purple-500 text-white font-bold text-sm hover:from-violet-500 hover:to-purple-400 transition-all shadow-xl shadow-violet-500/25">
              Create Free Account
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <Link href="/candidates/login"
              className="inline-flex items-center px-8 py-3 rounded-full border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all">
              Already have an account? Login
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Free forever · No credit card required</p>
        </motion.div>

        {/* ── How it works ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-20"
        >
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">How it works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((s, i) => (
              <motion.div key={s.num}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative bg-card border border-border rounded-2xl p-5"
              >
                <p className="text-3xl font-black text-violet-500/20 mb-3">{s.num}</p>
                <p className="font-semibold text-foreground text-sm mb-1">{s.title}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Features ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-2xl font-bold text-foreground text-center mb-2">Everything you need</h2>
          <p className="text-muted-foreground text-center text-sm mb-10">Built for candidates who take their career seriously</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card border border-border rounded-2xl p-5 hover:border-violet-500/30 transition-all group"
              >
                <span className="text-3xl mb-3 block">{f.icon}</span>
                <h3 className="font-semibold text-foreground text-sm mb-1.5 group-hover:text-violet-300 transition-colors">{f.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Bottom CTA ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="rounded-3xl bg-gradient-to-br from-violet-900/50 to-purple-900/50 border border-violet-500/20 p-10 text-center"
        >
          <h2 className="text-2xl font-black text-foreground mb-2">Ready to take control?</h2>
          <p className="text-muted-foreground text-sm mb-6">Join hundreds of candidates already using the portal</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/candidates/signup"
              className="px-8 py-3 rounded-full bg-violet-500 text-white font-bold text-sm hover:bg-violet-400 transition shadow-lg shadow-violet-500/25">
              Get Started Free
            </Link>
            <Link href="/careers"
              className="px-8 py-3 rounded-full border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition">
              Browse Open Jobs
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
