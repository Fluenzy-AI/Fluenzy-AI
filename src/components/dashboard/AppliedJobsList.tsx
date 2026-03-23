"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { StatusBadge, ApplicationTimeline, type ApplicationStatus } from "../shared/StatusBadge";
import { ApplicationRowSkeleton } from "../shared/SkeletonLoader";
import { ArrowRight, MapPin, Building2, Calendar, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Application {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  job: {
    title: string;
    department: string;
    location: string;
    slug?: string;
    company?: string;
  };
}

interface AppliedJobsListProps {
  applications: Application[];
  loading?: boolean;
  maxDisplay?: number;
  className?: string;
}

// Generate initials for company avatar
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Generate consistent gradient for company
function getAvatarGradient(name: string): string {
  const gradients = [
    "from-[#7C5CFC] to-[#A855F7]",
    "from-[#3B82F6] to-[#60A5FA]",
    "from-[#22C55E] to-[#4ADE80]",
    "from-[#F59E0B] to-[#FBBF24]",
    "from-[#EC4899] to-[#F472B6]",
    "from-[#06B6D4] to-[#22D3EE]",
  ];

  const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[index % gradients.length];
}

function ApplicationRow({
  application,
  index,
}: {
  application: Application;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });

  const companyName = application.job.company || application.job.department;
  const daysAgo = formatDistanceToNow(new Date(application.createdAt), { addSuffix: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1] as const,
      }}
      className={cn(
        "group relative bg-[#13161E] rounded-[14px] p-4",
        "border border-white/[0.06] hover:border-white/[0.1]",
        "shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_0_0.5px_rgba(255,255,255,0.06)]",
        "hover:shadow-[0_4px_12px_rgba(0,0,0,0.5)]",
        "transition-all duration-200"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Company avatar */}
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0",
            `bg-gradient-to-br ${getAvatarGradient(companyName)}`
          )}
        >
          {getInitials(companyName)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {/* Job title */}
              <h4 className="text-sm font-semibold text-[#F1F0F5] truncate group-hover:text-[#9F7FFF] transition-colors">
                {application.job.title}
              </h4>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                {/* Department */}
                <span className="inline-flex items-center gap-1 text-xs text-[#8B8A99]">
                  <Building2 className="w-3 h-3" />
                  {application.job.department}
                </span>

                {/* Location */}
                {application.job.location && (
                  <span className="inline-flex items-center gap-1 text-xs text-[#8B8A99]">
                    <MapPin className="w-3 h-3" />
                    {application.job.location}
                  </span>
                )}

                {/* Days ago */}
                <span className="inline-flex items-center gap-1 text-xs text-[#52515E]">
                  <Calendar className="w-3 h-3" />
                  {daysAgo}
                </span>
              </div>
            </div>

            {/* Status badge */}
            <StatusBadge status={application.status} size="sm" />
          </div>

          {/* Application timeline */}
          <div className="mt-3">
            <ApplicationTimeline currentStatus={application.status} size="sm" />
          </div>
        </div>

        {/* View details arrow (slides in on hover) */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          whileHover={{ opacity: 1, x: 0 }}
          className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Link
            href={application.job.slug ? `/careers/${application.job.slug}` : "#"}
            className="flex items-center gap-1 text-xs font-medium text-[#7C5CFC] hover:text-[#9F7FFF] transition-colors"
          >
            View details
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Empty state component
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
      className={cn(
        "bg-[#13161E] rounded-[14px] p-8 text-center",
        "border border-dashed border-white/[0.1]"
      )}
    >
      {/* Illustration */}
      <div className="w-16 h-16 rounded-full bg-[#7C5CFC]/10 flex items-center justify-center mx-auto mb-4">
        <FileText className="w-7 h-7 text-[#7C5CFC]" />
      </div>

      <h3 className="text-sm font-semibold text-[#F1F0F5] mb-1">
        No applications yet
      </h3>
      <p className="text-xs text-[#8B8A99] mb-5 max-w-xs mx-auto">
        Start applying to positions that match your skills and experience
      </p>

      <Link
        href="/careers"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C5CFC]/10 text-[#9F7FFF] hover:bg-[#7C5CFC]/20 text-sm font-medium transition-colors"
      >
        Browse open positions
        <ArrowRight className="w-4 h-4" />
      </Link>
    </motion.div>
  );
}

export function AppliedJobsList({
  applications,
  loading = false,
  maxDisplay = 6,
  className,
}: AppliedJobsListProps) {
  const displayedApps = applications.slice(0, maxDisplay);

  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        {[1, 2, 3].map((i) => (
          <ApplicationRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-[#F1F0F5]">Applied Jobs</h2>
        {applications.length > 0 && (
          <Link
            href="/candidates/dashboard/applications"
            className="text-xs font-medium text-[#7C5CFC] hover:text-[#9F7FFF] transition-colors flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      <AnimatePresence mode="wait">
        {applications.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {displayedApps.map((app, index) => (
              <ApplicationRow key={app.id} application={app} index={index} />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
