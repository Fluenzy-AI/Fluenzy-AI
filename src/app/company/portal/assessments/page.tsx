"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import CompanyPortalLayout from "@/components/CompanyPortalLayout";
import {
  Plus,
  Search,
  ClipboardList,
  Code,
  Mic,
  Video,
  Users as UsersIcon,
  Calendar,
  Clock,
  TrendingUp,
  BarChart3,
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  UserPlus,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const COMPANY_NAV = [
  { label: "Dashboard", href: "/company/portal", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Job Postings", href: "/company/portal/jobs", icon: <Briefcase className="w-4 h-4" /> },
  { label: "Applications", href: "/company/portal/applications", icon: <Users className="w-4 h-4" /> },
  { label: "Assessments", href: "/company/portal/assessments", icon: <FileText className="w-4 h-4" /> },
  { label: "Team", href: "/company/portal/team", icon: <UserPlus className="w-4 h-4" />, adminOnly: true },
  { label: "Settings", href: "/company/portal/settings", icon: <Settings className="w-4 h-4" />, adminOnly: true },
];

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

  const filteredAssessments = assessments.filter((assessment) =>
    assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assessment.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: assessments.length,
    assigned: assessments.reduce((sum, a) => sum + a.assigned, 0),
    completed: assessments.reduce((sum, a) => sum + a.completed, 0),
    avgCompletion: assessments.length > 0
      ? Math.round(
          (assessments.reduce((sum, a) => sum + (a.assigned > 0 ? (a.completed / a.assigned) * 100 : 0), 0) /
            assessments.length)
        )
      : 0,
  };

  return (
    <CompanyPortalLayout navItems={COMPANY_NAV} title="Assessments">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Assessments</h1>
          <p className="text-slate-400 mt-1">Create and manage candidate assessments</p>
        </div>
        <Button
          onClick={() => router.push("/company/portal/assessments/new")}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Assessment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Assessments</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Assigned</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.assigned}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Completed</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Completion Rate</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.avgCompletion}%</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search assessments by title or job..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Assessments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredAssessments.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
          <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No assessments found</h3>
          <p className="text-slate-400 mb-4">
            {searchQuery
              ? "Try adjusting your search"
              : "Create your first assessment to evaluate candidates"}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => router.push("/company/portal/assessments/new")}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Assessment
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAssessments.map((assessment, index) => {
            const Icon = assessmentIcons[assessment.type] || ClipboardList;
            const completionRate = assessment.assigned > 0
              ? Math.round((assessment.completed / assessment.assigned) * 100)
              : 0;

            return (
              <motion.div
                key={assessment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-indigo-500/50 transition-all cursor-pointer"
                onClick={() => router.push(`/company/portal/assessments/${assessment.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <span className="px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium">
                    {assessment.type.replace("_", " ")}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-1">{assessment.title}</h3>
                <p className="text-sm text-slate-400 mb-4">{assessment.jobTitle}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Questions:</span>
                    <span className="text-white font-semibold">{assessment.questions}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Duration:</span>
                    <span className="text-white font-semibold">{assessment.duration} mins</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Pass Percentage:</span>
                    <span className="text-white font-semibold">{assessment.passPercentage}%</span>
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Completion Rate</span>
                    <span className="text-sm text-white font-semibold">{completionRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                    <span>{assessment.completed} completed</span>
                    <span>{assessment.assigned} assigned</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 mt-4 text-xs text-slate-500">
                  <Calendar className="w-3 h-3" />
                  Created {new Date(assessment.createdAt).toLocaleDateString()}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
    </CompanyPortalLayout>
  );
}
