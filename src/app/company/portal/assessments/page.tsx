"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PortalLayout, StatCard, EmptyState, PortalStatusBadge } from "@/components/portal";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  ClipboardList,
  Code,
  Mic,
  Video,
  Users as UsersIcon,
  Calendar,
  BarChart3,
} from "lucide-react";

interface Assessment {
  id: string;
  jobId: string;
  jobTitle: string;
  type: string;
  title: string;
  questions: number;
  duration: number;
  passPercentage: number;
  assigned: number;
  completed: number;
  createdAt: string;
}

const assessmentIcons: Record<string, any> = {
  MCQ: ClipboardList,
  CODING: Code,
  AI_INTERVIEW: Mic,
  VOICE: Video,
  GD: UsersIcon,
};

const TYPE_COLORS: Record<string, string> = {
  MCQ: "var(--portal-info)",
  CODING: "var(--portal-primary)",
  AI_INTERVIEW: "var(--portal-live)",
  VOICE: "var(--portal-warning)",
  GD: "var(--portal-success)",
};

/**
 * Safe number display — never renders NaN.
 * Returns "0" for zero, "—" for null/undefined/NaN.
 */
function safeNum(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "—";
  return val.toLocaleString();
}

function safePercent(numerator: number | undefined, denominator: number | undefined): string {
  if (!numerator || !denominator || isNaN(numerator) || isNaN(denominator) || denominator === 0) return "0%";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

export default function AssessmentsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/company/assessments");
      if (res.ok) {
        const data = await res.json();
        setAssessments(data.assessments || []);
      }
    } catch (error) {
      console.error("Failed to fetch assessments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAssessments = assessments.filter(
    (assessment) =>
      assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // NaN-safe stat computation
  const stats = {
    total: assessments.length,
    assigned: assessments.reduce((sum, a) => sum + (isNaN(a.assigned) ? 0 : a.assigned || 0), 0),
    completed: assessments.reduce((sum, a) => sum + (isNaN(a.completed) ? 0 : a.completed || 0), 0),
    avgCompletion: (() => {
      const validAssessments = assessments.filter((a) => a.assigned > 0 && !isNaN(a.assigned) && !isNaN(a.completed));
      if (validAssessments.length === 0) return 0;
      const totalRate = validAssessments.reduce((sum, a) => sum + (a.completed / a.assigned) * 100, 0);
      return Math.round(totalRate / validAssessments.length);
    })(),
  };

  return (
    <PortalLayout title="Assessments">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--portal-text-primary)" }}>
              Assessments
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--portal-text-muted)" }}>
              Create and manage candidate assessments
            </p>
          </div>
          <button
            onClick={() => router.push("/company/portal/assessments/new")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors"
            style={{
              backgroundColor: "var(--portal-primary)",
              color: "var(--portal-primary-text)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--portal-primary-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--portal-primary)";
            }}
          >
            <Plus className="w-4 h-4" />
            Create Assessment
          </button>
        </div>

        {/* Stats — NaN-safe */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Assessments" value={stats.total} variant="compact" loading={isLoading} icon={<ClipboardList className="w-5 h-5" />} />
          <StatCard label="Assigned" value={stats.assigned} variant="compact" loading={isLoading} icon={<UsersIcon className="w-5 h-5" />} />
          <StatCard label="Completed" value={stats.completed} variant="compact" loading={isLoading} icon={<BarChart3 className="w-5 h-5" />} />
          <StatCard label="Completion Rate" value={`${stats.avgCompletion}%`} variant="compact" loading={isLoading} icon={<BarChart3 className="w-5 h-5" />} />
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--portal-text-muted)" }}
          />
          <input
            type="text"
            placeholder="Search assessments by title or job..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md text-sm outline-none"
            style={{
              backgroundColor: "var(--portal-bg-elevated)",
              border: "1px solid var(--portal-border)",
              color: "var(--portal-text-primary)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--portal-primary)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--portal-border)";
            }}
          />
        </div>

        {/* Assessments Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-56 rounded-lg border portal-skeleton"
                style={{ borderColor: "var(--portal-border)" }}
              />
            ))}
          </div>
        ) : filteredAssessments.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="w-6 h-6" />}
            title={searchQuery ? "No assessments match your search" : "No assessments created yet"}
            description={
              searchQuery
                ? "Try adjusting your search terms."
                : "Create your first assessment to evaluate candidates."
            }
            action={
              !searchQuery
                ? { label: "Create Assessment", onClick: () => router.push("/company/portal/assessments/new") }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAssessments.map((assessment, index) => {
              const Icon = assessmentIcons[assessment.type] || ClipboardList;
              const typeColor = TYPE_COLORS[assessment.type] || "var(--portal-primary)";

              // NaN-safe completion rate
              const completionRate =
                assessment.assigned > 0 && !isNaN(assessment.assigned) && !isNaN(assessment.completed)
                  ? Math.round((assessment.completed / assessment.assigned) * 100)
                  : 0;

              const hasSubmissions = assessment.assigned > 0 && !isNaN(assessment.assigned);

              return (
                <motion.div
                  key={assessment.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.2 }}
                  className="rounded-lg border p-5 transition-shadow hover:shadow-[var(--portal-shadow-hover)] cursor-pointer"
                  style={{
                    backgroundColor: "var(--portal-bg-elevated)",
                    borderColor: "var(--portal-border)",
                  }}
                  onClick={() => router.push(`/company/portal/assessments/${assessment.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `color-mix(in srgb, ${typeColor} 12%, transparent)` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: typeColor }} />
                    </div>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${typeColor} 12%, transparent)`,
                        color: typeColor,
                      }}
                    >
                      {assessment.type.replace(/_/g, " ")}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold mb-0.5" style={{ color: "var(--portal-text-primary)" }}>
                    {assessment.title}
                  </h3>
                  <p className="text-xs mb-4" style={{ color: "var(--portal-text-muted)" }}>
                    {assessment.jobTitle}
                  </p>

                  <div className="space-y-1.5 mb-4">
                    {[
                      { label: "Questions", value: safeNum(assessment.questions) },
                      { label: "Duration", value: `${safeNum(assessment.duration)} mins` },
                      { label: "Pass %", value: `${safeNum(assessment.passPercentage)}%` },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-xs">
                        <span style={{ color: "var(--portal-text-muted)" }}>{label}</span>
                        <span className="portal-mono font-medium" style={{ color: "var(--portal-text-primary)" }}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Completion Progress — handles zero/NaN explicitly */}
                  <div className="pt-3" style={{ borderTop: "1px solid var(--portal-border)" }}>
                    {hasSubmissions ? (
                      <>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span style={{ color: "var(--portal-text-secondary)" }}>Completion</span>
                          <span className="portal-mono font-semibold" style={{ color: "var(--portal-text-primary)" }}>
                            {safeNum(assessment.completed)}/{safeNum(assessment.assigned)} · {completionRate}%
                          </span>
                        </div>
                        <div
                          className="w-full h-1.5 rounded-full overflow-hidden"
                          style={{ backgroundColor: "var(--portal-surface)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${completionRate}%`,
                              backgroundColor: "var(--portal-primary)",
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-center py-1" style={{ color: "var(--portal-text-muted)" }}>
                        No submissions yet
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 mt-3 text-xs" style={{ color: "var(--portal-text-muted)" }}>
                    <Calendar className="w-3 h-3" />
                    Created {new Date(assessment.createdAt).toLocaleDateString()}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
