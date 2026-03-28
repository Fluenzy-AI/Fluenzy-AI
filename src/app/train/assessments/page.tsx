"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  ClipboardList,
  Code,
  Mic,
  Video,
  Users,
  Calendar,
  Timer,
  Target,
  Building2,
  Briefcase,
  Play,
  Eye,
  Award,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Assessment {
  id: string;
  sessionToken: string;
  status: string;
  score: number | null;
  passed: boolean | null;
  assignedAt: string;
  expiresAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  assessment: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    duration: number;
    passingScore: number;
    questionsCount: number;
  };
  company: {
    id: string;
    name: string;
    logo: string | null;
  };
  job: {
    id: string;
    title: string;
  };
}

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  expired: number;
}

const assessmentTypeIcons: Record<string, any> = {
  MCQ: ClipboardList,
  CODING: Code,
  AI_INTERVIEW: Mic,
  VOICE: Video,
  GD: Users,
};

const assessmentTypeLabels: Record<string, string> = {
  MCQ: "Multiple Choice",
  CODING: "Coding Challenge",
  AI_INTERVIEW: "AI Interview",
  VOICE: "Voice Interview",
  GD: "Group Discussion",
};

const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
  PENDING: { bg: "bg-amber-500/10", text: "text-amber-400", icon: Clock },
  INVITED: { bg: "bg-blue-500/10", text: "text-blue-400", icon: FileText },
  IN_PROGRESS: { bg: "bg-purple-500/10", text: "text-purple-400", icon: Play },
  COMPLETED: { bg: "bg-emerald-500/10", text: "text-emerald-400", icon: CheckCircle },
  EXPIRED: { bg: "bg-red-500/10", text: "text-red-400", icon: XCircle },
  CANCELLED: { bg: "bg-gray-500/10", text: "text-gray-400", icon: XCircle },
};

export default function MyAssessmentsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    expired: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/candidates/assessments");
      if (res.ok) {
        const data = await res.json();
        setAssessments(data.assessments || []);
        setStats(data.stats || {
          total: 0,
          pending: 0,
          inProgress: 0,
          completed: 0,
          expired: 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch assessments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAssessments = assessments.filter((item) => {
    const matchesSearch =
      item.assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.job.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus =
      filterStatus === "all" ||
      item.status === filterStatus ||
      (filterStatus === "PENDING" && (item.status === "PENDING" || item.status === "INVITED"));
    
    const matchesType =
      filterType === "all" || item.assessment.type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleStartAssessment = (sessionToken: string) => {
    router.push(`/candidate/assessment/${sessionToken}`);
  };

  const handleViewResult = (sessionToken: string) => {
    router.push(`/candidate/assessment/${sessionToken}/result`);
  };

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffHours = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours < 48;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) return "Expired";
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} left`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""} left`;
    return "Less than an hour";
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">My Assessments</h1>
            <p className="text-slate-400">
              Complete assessments assigned by companies
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FileText className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-slate-400">Total</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
                <p className="text-sm text-slate-400">Pending</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Play className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
                <p className="text-sm text-slate-400">In Progress</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.completed}</p>
                <p className="text-sm text-slate-400">Completed</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <XCircle className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.expired}</p>
                <p className="text-sm text-slate-400">Expired</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by company, job or assessment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="MCQ">Multiple Choice</SelectItem>
              <SelectItem value="CODING">Coding Challenge</SelectItem>
              <SelectItem value="AI_INTERVIEW">AI Interview</SelectItem>
              <SelectItem value="VOICE">Voice Interview</SelectItem>
              <SelectItem value="GD">Group Discussion</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Assessments List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div className="text-center py-20">
            <Award className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No Assessments Found
            </h3>
            <p className="text-slate-400 max-w-md mx-auto">
              {assessments.length === 0
                ? "You don't have any assessments assigned yet. Apply to jobs and companies may invite you to complete assessments."
                : "No assessments match your current filters."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAssessments.map((item, index) => {
              const TypeIcon = assessmentTypeIcons[item.assessment.type] || FileText;
              const statusConfig = statusColors[item.status] || statusColors.PENDING;
              const StatusIcon = statusConfig.icon;
              const expiringSoon = isExpiringSoon(item.expiresAt);
              const canStart = item.status === "PENDING" || item.status === "INVITED" || item.status === "IN_PROGRESS";
              const isCompleted = item.status === "COMPLETED";

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-slate-800/50 border rounded-xl p-5 transition-all hover:border-indigo-500/50 ${
                    expiringSoon && canStart
                      ? "border-amber-500/50"
                      : "border-slate-700/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Company Logo */}
                      <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center overflow-hidden">
                        {item.company.logo ? (
                          <img
                            src={item.company.logo}
                            alt={item.company.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building2 className="w-6 h-6 text-slate-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Title & Company */}
                        <div className="flex items-start gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-white">
                            {item.assessment.title}
                          </h3>
                          <Badge className={`${statusConfig.bg} ${statusConfig.text}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {item.status.replace("_", " ")}
                          </Badge>
                          {expiringSoon && canStart && (
                            <Badge className="bg-amber-500/10 text-amber-400">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Expiring Soon
                            </Badge>
                          )}
                        </div>

                        <p className="text-slate-400 text-sm mt-1">
                          {item.company.name} • {item.job.title}
                        </p>

                        {/* Assessment Details */}
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-400">
                          <div className="flex items-center gap-1">
                            <TypeIcon className="w-4 h-4" />
                            <span>{assessmentTypeLabels[item.assessment.type]}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Timer className="w-4 h-4" />
                            <span>{item.assessment.duration} min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            <span>Pass: {item.assessment.passingScore}%</span>
                          </div>
                          {item.assessment.questionsCount > 0 && (
                            <div className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              <span>{item.assessment.questionsCount} questions</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Assigned {formatDate(item.assignedAt)}</span>
                          </div>
                          {item.expiresAt && canStart && (
                            <div className={`flex items-center gap-1 ${expiringSoon ? "text-amber-400" : ""}`}>
                              <Clock className="w-4 h-4" />
                              <span>{formatTimeRemaining(item.expiresAt)}</span>
                            </div>
                          )}
                        </div>

                        {/* Score for completed assessments */}
                        {isCompleted && item.score !== null && (
                          <div className="mt-3 flex items-center gap-3">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                              item.passed
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            }`}>
                              {item.passed ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                              <span className="font-semibold">{item.score}%</span>
                              <span className="text-sm">
                                {item.passed ? "Passed" : "Not Passed"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0">
                      {canStart && (
                        <Button
                          onClick={() => handleStartAssessment(item.sessionToken)}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          {item.status === "IN_PROGRESS" ? (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Continue
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Start Assessment
                            </>
                          )}
                        </Button>
                      )}
                      {isCompleted && (
                        <Button
                          variant="outline"
                          onClick={() => handleViewResult(item.sessionToken)}
                          className="border-slate-600 hover:bg-slate-700"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Result
                        </Button>
                      )}
                      {item.status === "EXPIRED" && (
                        <Badge className="bg-red-500/10 text-red-400 px-4 py-2">
                          Expired
                        </Badge>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
