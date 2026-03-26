"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { SkillsList, type ProficiencyLevel } from "../shared/SkillPill";
import { Plus } from "lucide-react";

interface Skill {
  name: string;
  proficiency?: ProficiencyLevel;
  years?: number;
}

interface TopSkillsWidgetProps {
  skills: Skill[];
  maxDisplay?: number;
  loading?: boolean;
  onAddSkill?: () => void;
  className?: string;
}

export function TopSkillsWidget({
  skills,
  maxDisplay = 8,
  loading = false,
  onAddSkill,
  className,
}: TopSkillsWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  if (loading) {
    return (
      <div
        className={cn(
          "bg-[#13161E] rounded-[14px] p-5",
          "border border-white/[0.06]",
          className
        )}
      >
        <div className="h-4 w-24 bg-white/[0.06] rounded animate-pulse mb-4" />
        <div className="flex flex-wrap gap-1.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-7 w-16 bg-white/[0.06] rounded-md animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // If no skills, show empty state
  if (skills.length === 0) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.35, ease: [0.16, 1, 0.3, 1] as const }}
        className={cn(
          "bg-[#13161E] rounded-[14px] p-5",
          "border border-white/[0.06]",
          className
        )}
      >
        <h3 className="text-sm font-bold text-[#F1F0F5] mb-4">Top Skills</h3>
        <p className="text-xs text-[#8B8A99] mb-3">
          Add your skills to help employers find you
        </p>
        <Link
          href="/profile#skills"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#7C5CFC]/10 text-[#9F7FFF] hover:bg-[#7C5CFC]/20 text-xs font-semibold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Skills
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "bg-[#13161E] rounded-[14px] p-5",
        "border border-white/[0.06]",
        "shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_0_0.5px_rgba(255,255,255,0.06)]",
        className
      )}
    >
      <h3 className="text-sm font-bold text-[#F1F0F5] mb-4">Top Skills</h3>

      <SkillsList
        skills={skills}
        maxDisplay={maxDisplay}
        showAdd={!!onAddSkill}
        onAddSkill={onAddSkill}
      />
    </motion.div>
  );
}
