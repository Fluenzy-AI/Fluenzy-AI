"use client";
import { BookOpen, MessageSquare, UserPlus, Code, Building2, Users, ArrowRight, Sparkles } from "lucide-react";
import React from "react";
import { motion, Variants } from "framer-motion";

const features = [
  {
    icon: BookOpen,
    title: "English Learning",
    description:
      "Enhance your professional communication with AI-driven conversations, instant grammar feedback, and targeted fluency exercises that prepare you for global workplaces.",
    gradient: "from-blue-500 to-cyan-500",
    shadow: "shadow-blue-500/20",
    glow: "from-blue-500/10 to-cyan-500/10",
    badge: "Language",
    delay: 0.1,
  },
  {
    icon: MessageSquare,
    title: "Daily Conversation",
    description:
      "Build confidence in everyday workplace interactions through realistic role-playing scenarios, networking simulations, and team collaboration practice with AI mentors.",
    gradient: "from-violet-500 to-purple-500",
    shadow: "shadow-violet-500/20",
    glow: "from-violet-500/10 to-purple-500/10",
    badge: "Practice",
    delay: 0.2,
  },
  {
    icon: UserPlus,
    title: "HR Interview Coach",
    description:
      "Ace your HR interviews with comprehensive preparation covering behavioral questions, situational judgment, and personality assessments guided by AI experts.",
    gradient: "from-orange-500 to-amber-500",
    shadow: "shadow-orange-500/20",
    glow: "from-orange-500/10 to-amber-500/10",
    badge: "Interview",
    delay: 0.3,
  },
  {
    icon: Code,
    title: "Technical Mastery",
    description:
      "Sharpen your technical skills with adaptive coding challenges, system design simulations, and algorithmic problem-solving powered by intelligent AI tutors.",
    gradient: "from-emerald-500 to-teal-500",
    shadow: "shadow-emerald-500/20",
    glow: "from-emerald-500/10 to-teal-500/10",
    badge: "Technical",
    delay: 0.4,
  },
  {
    icon: Building2,
    title: "Company Tracks",
    description:
      "Get insider preparation for top companies with customized interview questions, case studies, and cultural insights tailored to your target employers.",
    gradient: "from-cyan-500 to-blue-500",
    shadow: "shadow-cyan-500/20",
    glow: "from-cyan-500/10 to-blue-500/10",
    badge: "Strategy",
    delay: 0.5,
  },
  {
    icon: Users,
    title: "GD Agent",
    description:
      "Excel in group discussions with AI-moderated practice sessions, leadership role-playing, and constructive feedback on your communication and collaboration skills.",
    gradient: "from-rose-500 to-pink-500",
    shadow: "shadow-rose-500/20",
    glow: "from-rose-500/10 to-pink-500/10",
    badge: "Collaboration",
    delay: 0.6,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const Features = () => {
  return (
    <section id="features" className="py-16 relative overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900">
      {/* Background effects */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-cyan-500/3 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

function FeatureCard({ feature, index }: { feature: any; index: number }) {
  const { icon: Icon, title, description, gradient, shadow, glow, badge, delay } = feature;

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
      className="group cursor-pointer"
    >
      <div className={`h-full rounded-2xl border border-white/[0.08] bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-xl p-7 transition-all duration-500 relative overflow-hidden hover:border-white/20 hover:${shadow} hover:shadow-2xl`}>
        {/* Hover gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`} />
        
        {/* Top accent line */}
        <div className={`absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

        <div className="relative z-10">
          {/* Badge + Icon Row */}
          <div className="flex items-start justify-between mb-5">
            <div
              className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} p-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}
            >
              <Icon className="w-full h-full text-white" />
            </div>
            <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full border border-white/10 text-slate-400 group-hover:text-slate-200 group-hover:border-white/20 transition-all duration-300`}>
              {badge}
            </span>
          </div>

          <h3 className="text-lg font-bold mb-2.5 text-white group-hover:text-white transition-colors duration-300">
            {title}
          </h3>

          <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors duration-300 mb-5">
            {description}
          </p>

          {/* Explore link */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 group-hover:text-white transition-all duration-300">
            <span>Explore</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform duration-300" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Features;
