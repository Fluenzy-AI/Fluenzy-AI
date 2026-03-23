"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { FileText, Upload, Download, RefreshCw, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ResumeWidgetProps {
  resumeUrl?: string | null;
  lastUpdated?: string | null;
  aiScore?: number | null;
  loading?: boolean;
  className?: string;
}

// Score ring component
function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (score / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 80) return "#22C55E";
    if (score >= 60) return "#F59E0B";
    return "#EF4444";
  };

  const color = getColor(score);

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={4}
          stroke="rgba(255,255,255,0.06)"
          fill="none"
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={4}
          stroke={color}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-[#F1F0F5]">{score}</span>
      </div>
    </div>
  );
}

// PDF preview placeholder
function PDFPreview() {
  return (
    <div className="w-full h-24 rounded-lg bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-white/[0.06] flex items-center justify-center">
      <div className="text-center">
        <FileText className="w-8 h-8 text-[#7C5CFC] mx-auto mb-1.5" />
        <span className="text-[10px] text-[#8B8A99]">Resume.pdf</span>
      </div>
    </div>
  );
}

export function ResumeWidget({
  resumeUrl,
  lastUpdated,
  aiScore,
  loading = false,
  className,
}: ResumeWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [showActions, setShowActions] = useState(false);

  if (loading) {
    return (
      <div
        className={cn(
          "bg-[#13161E] rounded-[14px] p-5",
          "border border-white/[0.06]",
          className
        )}
      >
        <div className="h-4 w-20 bg-white/[0.06] rounded animate-pulse mb-4" />
        <div className="h-24 bg-white/[0.06] rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={cn(
        "bg-[#13161E] rounded-[14px] p-5",
        "border border-white/[0.06]",
        "shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_0_0.5px_rgba(255,255,255,0.06)]",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#F1F0F5] flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#8B8A99]" />
          Resume
        </h3>

        {/* AI Score badge */}
        {aiScore !== null && aiScore !== undefined && resumeUrl && (
          <div className="flex items-center gap-2">
            <ScoreRing score={aiScore} size={40} />
            <div className="text-[10px]">
              <p className="text-[#8B8A99]">AI Score</p>
              <p className="font-semibold text-[#F1F0F5]">{aiScore}/100</p>
            </div>
          </div>
        )}
      </div>

      {resumeUrl ? (
        <div className="relative">
          {/* PDF Preview */}
          <PDFPreview />

          {/* Last updated */}
          {lastUpdated && (
            <p className="text-[10px] text-[#52515E] mt-2">
              Last updated: {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
            </p>
          )}

          {/* Action buttons (show on hover) */}
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: showActions ? 1 : 0, y: showActions ? 0 : 4 }}
            className="flex items-center gap-2 mt-3"
          >
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-[#8B8A99] hover:text-[#F1F0F5] text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>

            <Link
              href="/candidates/dashboard/profile#resume"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7C5CFC]/10 hover:bg-[#7C5CFC]/20 text-[#9F7FFF] text-xs font-medium transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Replace
            </Link>
          </motion.div>
        </div>
      ) : (
        // No resume uploaded state
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-[#7C5CFC]/10 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-5 h-5 text-[#7C5CFC]" />
          </div>
          <p className="text-xs text-[#8B8A99] mb-3">
            No resume uploaded yet. Add one to auto-fill applications.
          </p>
          <Link
            href="/candidates/dashboard/profile#resume"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20 text-xs font-semibold transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Resume
          </Link>
        </div>
      )}

      {/* AI Review upsell */}
      {resumeUrl && !aiScore && (
        <Link
          href="/candidates/dashboard/ai-review"
          className="flex items-center gap-3 mt-4 p-3 rounded-xl bg-gradient-to-r from-[#7C5CFC]/5 to-[#A855F7]/5 border border-[#7C5CFC]/10 hover:border-[#7C5CFC]/20 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C5CFC] to-[#A855F7] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#F1F0F5]">Get AI Resume Review</p>
            <p className="text-[10px] text-[#8B8A99]">Improve your score and stand out</p>
          </div>
          <svg
            className="w-4 h-4 text-[#7C5CFC]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}
    </motion.div>
  );
}
