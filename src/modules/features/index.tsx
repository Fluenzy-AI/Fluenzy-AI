"use client";
import React from "react";
import { motion, Variants } from "framer-motion";
import { Briefcase, Code, Users, Building2, Languages, Bot, ArrowRight } from "lucide-react";

const ecosystem = [
  {
    icon: Briefcase,
    title: "HR Interview Coach",
    points: [
      "Behavioral questions",
      "STAR method detection",
      "Leadership principle mapping",
      "Company-personalized answers",
      "Perfect answer AI rewriting",
    ],
    gradient: "from-orange-500 to-amber-500",
    badge: "Behavioral",
  },
  {
    icon: Code,
    title: "Technical Mastery",
    points: [
      "DSA challenges",
      "System design evaluation",
      "API architecture questions",
      "Database decision testing",
      "AI model deployment reasoning",
    ],
    gradient: "from-emerald-500 to-cyan-500",
    badge: "Engineering",
  },
  {
    icon: Users,
    title: "GD Agent",
    points: [
      "AI-powered group discussion simulator",
      "Multi-role simulation",
      "Speaking time analytics",
      "Dominance tracking",
      "Engagement tracking",
    ],
    gradient: "from-violet-500 to-pink-500",
    badge: "Collaboration",
  },
  {
    icon: Building2,
    title: "Company Tracks",
    points: [
      "Google, Amazon, Microsoft preparation",
      "Company-wise readiness scoring",
      "Cultural alignment evaluation",
      "Role-specific strategy layers",
      "Interview-loop modeling",
    ],
    gradient: "from-blue-500 to-cyan-500",
    badge: "Strategy",
  },
  {
    icon: Languages,
    title: "English Learning & Daily Conversation",
    points: [
      "Business English",
      "Fluency training",
      "Grammar correction",
      "Professional communication polishing",
      "Workplace speaking drills",
    ],
    gradient: "from-sky-500 to-indigo-500",
    badge: "Communication",
  },
  {
    icon: Bot,
    title: "Real-Time AI Interviewer",
    points: [
      "Live interview simulation",
      "Follow-up dynamic questioning",
      "Resume-aware questions",
      "Experience-based difficulty calibration",
      "Performance intelligence feedback",
    ],
    gradient: "from-purple-500 to-blue-500",
    badge: "Intelligence",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const Features = () => {
  return (
    <section id="features" className="relative overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900 py-20 md:py-24">
      <div className="absolute left-1/4 top-20 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
      <div className="absolute bottom-20 right-1/4 h-[500px] w-[500px] rounded-full bg-violet-500/5 blur-[120px]" />

      <div className="container relative z-10 mx-auto px-4 md:px-8 xl:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center md:mb-14"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Core Training Ecosystem</p>
          <h2 className="fluid-h2 font-bold text-white">AI Interview Intelligence Operating System</h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {ecosystem.map((feature) => (
            <motion.div key={feature.title} variants={cardVariants} whileHover={{ y: -8 }} className="group" data-touch-hover>
              <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/60 p-6 shadow-2xl transition-all duration-500 group-hover:border-white/20 group-hover:shadow-purple-500/15">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-10`} />
                <div className="relative z-10">
                  <div className="mb-4 flex items-center justify-between">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.gradient} p-3 shadow-lg`}>
                      <feature.icon className="h-full w-full text-white" />
                    </div>
                    <span className="rounded-full border border-white/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="mb-3 text-lg font-bold text-white">{feature.title}</h3>
                  <div className="space-y-1.5">
                    {feature.points.map((point) => (
                      <div key={point} className="text-sm text-slate-300">
                        • {point}
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition group-hover:text-white">
                    <span>Explore Capability</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Feature Screenshots Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <div className="relative rounded-2xl overflow-hidden border border-purple-500/20 shadow-xl bg-slate-900/60 p-2 group hover:border-purple-500/50 transition-all duration-300">
            <img
              src="/image/landingimg3.png"
              alt="Technical Interview & Coding Evaluation"
              className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <p className="mt-3 text-xs font-bold text-center text-cyan-300 uppercase tracking-wider">Technical & Coding Interview</p>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-purple-500/20 shadow-xl bg-slate-900/60 p-2 group hover:border-purple-500/50 transition-all duration-300">
            <img
              src="/image/GDAgent.png"
              alt="GD Agent & AI Group Discussion Room"
              className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <p className="mt-3 text-xs font-bold text-center text-purple-300 uppercase tracking-wider">GD Agent & AI Discussion Room</p>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-purple-500/20 shadow-xl bg-slate-900/60 p-2 group hover:border-purple-500/50 transition-all duration-300">
            <img
              src="/image/ATS.png"
              alt="ATS Resume Checker & Score Engine"
              className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <p className="mt-3 text-xs font-bold text-center text-emerald-300 uppercase tracking-wider">ATS Resume Checker & Score</p>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-purple-500/20 shadow-xl bg-slate-900/60 p-2 group hover:border-purple-500/50 transition-all duration-300">
            <img
              src="/image/AIJobSearch.png"
              alt="AI Job Search & Auto Apply Matcher"
              className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <p className="mt-3 text-xs font-bold text-center text-amber-300 uppercase tracking-wider">AI Job Matcher & Auto Apply</p>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-purple-500/20 shadow-xl bg-slate-900/60 p-2 group hover:border-purple-500/50 transition-all duration-300">
            <img
              src="/image/landingimg4.png"
              alt="Behavioral Analytics & Feedback"
              className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <p className="mt-3 text-xs font-bold text-center text-blue-300 uppercase tracking-wider">Real-Time Performance Analytics</p>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-purple-500/20 shadow-xl bg-slate-900/60 p-2 group hover:border-purple-500/50 transition-all duration-300">
            <img
              src="/image/GD.png"
              alt="Group Discussion Room Simulation"
              className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <p className="mt-3 text-xs font-bold text-center text-pink-300 uppercase tracking-wider">GD Simulation & Multi-Role Coaching</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
