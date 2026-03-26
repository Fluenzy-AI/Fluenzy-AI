"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { User, Upload, Briefcase, Sparkles } from "lucide-react";

interface QuickAction {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  gradient: string;
  recommended?: boolean;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    href: "/profile",
    icon: <User className="w-5 h-5 text-white" />,
    label: "Edit Profile",
    description: "Update your info and skills",
    gradient: "from-[#7C5CFC] to-[#9F7FFF]",
  },
  {
    href: "/profile#resume",
    icon: <Upload className="w-5 h-5 text-white" />,
    label: "Upload Resume",
    description: "Attach or update your CV",
    gradient: "from-[#22C55E] to-[#4ADE80]",
  },
  {
    href: "/jobs",
    icon: <Briefcase className="w-5 h-5 text-white" />,
    label: "Browse Jobs",
    description: "Find new opportunities",
    gradient: "from-[#3B82F6] to-[#60A5FA]",
  },
  {
    href: "/train/ai-review",
    icon: <Sparkles className="w-5 h-5 text-white" />,
    label: "AI Resume Review",
    description: "Get instant feedback",
    gradient: "from-[#A855F7] to-[#EC4899]",
    recommended: true,
  },
];

interface QuickActionCardProps {
  action: QuickAction;
  index: number;
}

function QuickActionCard({ action, index }: QuickActionCardProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.4,
        delay: 0.3 + index * 0.08,
        ease: [0.16, 1, 0.3, 1] as const,
      }}
    >
      <Link
        ref={ref}
        href={action.href}
        className={cn(
          "group relative block bg-[#13161E] rounded-[14px] p-5",
          "border border-white/[0.06] hover:border-[#7C5CFC]/40",
          "shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_0_0.5px_rgba(255,255,255,0.06)]",
          "hover:shadow-[0_8px_24px_rgba(124,92,252,0.15),0_0_0_0.5px_rgba(124,92,252,0.2)]",
          "transition-all duration-300"
        )}
      >
        {/* Recommended badge */}
        {action.recommended && (
          <div className="absolute -top-2 -right-2 z-10">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-[#A855F7] to-[#EC4899] text-white shadow-lg">
              Recommended
            </span>
          </div>
        )}

        {/* Icon with gradient background */}
        <div className="relative mb-4">
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
              `bg-gradient-to-br ${action.gradient}`
            )}
            style={{
              boxShadow: `0 4px 12px ${
                action.gradient.includes("7C5CFC")
                  ? "rgba(124,92,252,0.25)"
                  : action.gradient.includes("22C55E")
                  ? "rgba(34,197,94,0.25)"
                  : action.gradient.includes("3B82F6")
                  ? "rgba(59,130,246,0.25)"
                  : "rgba(168,85,247,0.25)"
              }`,
            }}
          >
            {action.icon}
          </div>

          {/* Glow effect on hover */}
          <div
            className={cn(
              "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl",
              `bg-gradient-to-br ${action.gradient}`
            )}
            style={{ transform: "scale(0.8)" }}
            aria-hidden="true"
          />
        </div>

        {/* Content */}
        <h3 className="text-sm font-semibold text-[#F1F0F5] mb-1 group-hover:text-[#9F7FFF] transition-colors">
          {action.label}
        </h3>
        <p className="text-xs text-[#8B8A99]">{action.description}</p>

        {/* Arrow indicator */}
        <div className="absolute bottom-4 right-4 opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
          <svg
            className="w-4 h-4 text-[#7C5CFC]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    </motion.div>
  );
}

interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className }: QuickActionsProps) {
  return (
    <div className={className}>
      <h2 className="text-sm font-bold text-[#F1F0F5] mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {QUICK_ACTIONS.map((action, index) => (
          <QuickActionCard key={action.href} action={action} index={index} />
        ))}
      </div>
    </div>
  );
}
