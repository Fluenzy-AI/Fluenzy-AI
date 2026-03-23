"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { SkillsList } from "../shared/SkillPill";
import {
  Bookmark,
  MapPin,
  Clock,
  Briefcase,
  IndianRupee,
  ArrowRight,
  Share2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
}

interface JobCardProps {
  job: Job;
  index?: number;
  isSaved?: boolean;
  onSave?: (jobId: string) => void;
  onShare?: (job: Job) => void;
  className?: string;
  basePath?: string; // Custom base path for apply link (default: /careers)
}

const LOCATION_CONFIG: Record<
  LocationType,
  { label: string; bg: string; text: string; border: string }
> = {
  REMOTE: {
    label: "Remote",
    bg: "bg-[#22C55E]/10",
    text: "text-[#22C55E]",
    border: "border-[#22C55E]/20",
  },
  HYBRID: {
    label: "Hybrid",
    bg: "bg-[#3B82F6]/10",
    text: "text-[#3B82F6]",
    border: "border-[#3B82F6]/20",
  },
  ONSITE: {
    label: "On-site",
    bg: "bg-[#F59E0B]/10",
    text: "text-[#F59E0B]",
    border: "border-[#F59E0B]/20",
  },
};

const TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

// Format salary consistently
function formatSalary(salary: string): string {
  // Try to normalize salary format
  const normalized = salary
    .replace(/per\s*month/i, "/ month")
    .replace(/per\s*year/i, "/ year")
    .replace(/per\s*annum/i, "/ year")
    .replace(/p\.?a\.?/i, "/ year")
    .replace(/p\.?m\.?/i, "/ month");

  return normalized;
}

export function JobCard({
  job,
  index = 0,
  isSaved = false,
  onSave,
  onShare,
  className,
  basePath = "/careers",
}: JobCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [saved, setSaved] = useState(isSaved);

  const locationConfig = LOCATION_CONFIG[job.location];
  const daysAgo = formatDistanceToNow(new Date(job.createdAt), { addSuffix: true });

  const handleSave = () => {
    setSaved(!saved);
    onSave?.(job.id);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job.title,
        url: `${window.location.origin}/careers/${job.slug}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/careers/${job.slug}`);
    }
    onShare?.(job);
  };

  // Convert skills to the format expected by SkillsList
  const skillsData = job.skills.map((skill) => ({ name: skill }));

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.5,
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1] as const,
      }}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className={cn(
        "group relative bg-[#13161E] rounded-[14px] p-6",
        "border border-white/[0.06] hover:border-[#7C5CFC]/30",
        "shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_0_0.5px_rgba(255,255,255,0.06)]",
        "hover:shadow-[0_8px_24px_rgba(124,92,252,0.12),0_0_0_0.5px_rgba(124,92,252,0.15)]",
        "transition-all duration-300",
        saved && "border-l-2 border-l-[#7C5CFC]",
        className
      )}
    >
      {/* Save/Bookmark button */}
      <button
        onClick={handleSave}
        className={cn(
          "absolute top-4 left-4 p-2 rounded-lg transition-all",
          saved
            ? "bg-[#7C5CFC]/10 text-[#9F7FFF]"
            : "bg-white/[0.04] text-[#52515E] hover:text-[#8B8A99] hover:bg-white/[0.08]"
        )}
        aria-label={saved ? "Remove bookmark" : "Bookmark job"}
      >
        <Bookmark className={cn("w-4 h-4", saved && "fill-current")} />
      </button>

      {/* Content */}
      <div className="pt-6">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-base font-semibold text-[#F1F0F5] group-hover:text-[#9F7FFF] transition-colors pr-20">
            {job.title}
          </h3>
          <p className="text-sm text-[#8B8A99] mt-0.5">{job.department}</p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border",
              locationConfig.bg,
              locationConfig.text,
              locationConfig.border
            )}
          >
            <MapPin className="w-3 h-3" />
            {locationConfig.label}
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/[0.04] text-[#8B8A99] border border-white/[0.06]">
            <Briefcase className="w-3 h-3" />
            {TYPE_LABELS[job.employmentType]}
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/[0.04] text-[#8B8A99] border border-white/[0.06]">
            <Clock className="w-3 h-3" />
            {job.experienceYears}
          </span>

          {job.salaryRange && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20">
              <IndianRupee className="w-3 h-3" />
              {formatSalary(job.salaryRange)}
            </span>
          )}
        </div>

        {/* Skills */}
        <div className="mb-5">
          <SkillsList skills={skillsData} maxDisplay={4} size="sm" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
          <span className="text-[10px] text-[#52515E]">Posted {daysAgo}</span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-lg border border-white/[0.06] bg-white/[0.02] text-[#8B8A99] hover:text-[#F1F0F5] hover:bg-white/[0.06] transition-all"
              aria-label="Share job"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <Link
              href={`${basePath}/${job.slug}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#7C5CFC] focus:ring-offset-2 focus:ring-offset-[#0D0F14]"
              style={{
                background: "linear-gradient(135deg, #6B46FF 0%, #A855F7 50%, #EC4899 100%)",
                boxShadow: "0 4px 12px rgba(124,92,252,0.25)",
              }}
            >
              Apply Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
