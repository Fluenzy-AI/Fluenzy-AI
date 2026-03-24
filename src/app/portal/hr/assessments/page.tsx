"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import {
  Plus,
  Search,
  ClipboardList,
  Code,
  Mic,
  Video,
  Users as UsersIcon,
  Calendar,
  TrendingUp,
  BarChart3,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const HR_NAV = [
  { label: "Dashboard", href: "/portal/hr", icon: <HomeIcon /> },
  { label: "Employees", href: "/portal/hr/employees", icon: <UsersIcon2 /> },
  { label: "Candidates", href: "/portal/hr/candidates", icon: <UserPlusIcon /> },
  { label: "Interviews", href: "/portal/hr/interviews", icon: <CalendarIcon /> },
  { label: "Manage Jobs", href: "/portal/hr/jobs", icon: <BriefcaseIcon /> },
  { label: "Assessments", href: "/portal/hr/assessments", icon: <ClipboardListIcon /> },
  { label: "Analytics", href: "/portal/hr/analytics", icon: <ChartIcon /> },
  { label: "Leave Management", href: "/portal/hr/leaves", icon: <ClockIcon /> },
  { label: "Attendance", href: "/portal/hr/attendance", icon: <CheckSquareIcon /> },
  { label: "Payroll", href: "/portal/hr/payroll", icon: <BanknotesIcon /> },
  { label: "Offer Letters", href: "/portal/hr/offer-letters", icon: <DocumentIcon /> },
  { label: "Job Applications", href: "/portal/hr/job-applications", icon: <ClipboardListIcon /> },
];

interface Assessment {
  id: string;
  title: string;
  description?: string;
  type: string;
  duration: number;
  passingScore: number;
  questionsCount: number;
  assigned: number;
  completed: number;
  isActive: boolean;
  createdAt: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  position: string;
}

const assessmentIcons: Record<string, React.FC<{ className?: string }>> = {
  MCQ: ClipboardList,
  CODING: Code,
  AI_INTERVIEW: Mic,
  VOICE: Video,
  GD: UsersIcon,
};

const assessmentTypeLabels: Record<string, string> = {
  MCQ: "MCQ Test",
  CODING: "Coding Test",
  AI_INTERVIEW: "AI Interview",
  VOICE: "Voice Round",
  GD: "Group Discussion",
};

export default function HRAssessmentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = usePortalAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/portal/login");
      return;
    }
    if (user) {
      fetchAssessments();
      fetchCandidates();
    }
  }, [user, authLoading, router]);

  const fetchAssessments = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/portal/hr/assessments", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAssessments(data.assessments || []);
      }
    } catch (error) {
      console.error("Failed to fetch assessments:", error);
      toast.error("Failed to load assessments");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await fetch("/api/portal/hr/candidates?limit=100", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates || []);
      }
    } catch (error) {
      console.error("Failed to fetch candidates:", error);
    }
  };

  const filteredAssessments = assessments.filter(
    (assessment) =>
      assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: assessments.length,
    assigned: assessments.reduce((sum, a) => sum + a.assigned, 0),
    completed: assessments.reduce((sum, a) => sum + a.completed, 0),
    avgCompletion:
      assessments.length > 0
        ? Math.round(
            assessments.reduce(
              (sum, a) => sum + (a.assigned > 0 ? (a.completed / a.assigned) * 100 : 0),
              0
            ) / assessments.length
          )
        : 0,
  };

  const handleAssign = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setShowAssignModal(true);
  };

  if (authLoading || isLoading) {
    return (
      <PortalLayout navItems={HR_NAV} title="Assessments" roleLabel="HR Portal" roleColor="text-emerald-400">
        <AssessmentSkeleton />
      </PortalLayout>
    );
  }

  return (
    <PortalLayout navItems={HR_NAV} title="Assessments" roleLabel="HR Portal" roleColor="text-emerald-400">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Assessment Center</h1>
            <p className="text-slate-400 mt-1">Create and manage candidate assessments</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
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
            className="bg-slate-900 border border-white/5 rounded-xl p-4"
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
            className="bg-slate-900 border border-white/5 rounded-xl p-4"
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
            className="bg-slate-900 border border-white/5 rounded-xl p-4"
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
            className="bg-slate-900 border border-white/5 rounded-xl p-4"
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
            placeholder="Search assessments by title or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-white/5 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Assessments List */}
        {filteredAssessments.length === 0 ? (
          <div className="bg-slate-900 border border-white/5 rounded-xl p-12 text-center">
            <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No assessments found</h3>
            <p className="text-slate-400 mb-4">
              {searchQuery
                ? "Try adjusting your search"
                : "Create your first assessment to evaluate candidates"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Assessment
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssessments.map((assessment, index) => {
              const Icon = assessmentIcons[assessment.type] || ClipboardList;
              const completionRate =
                assessment.assigned > 0
                  ? Math.round((assessment.completed / assessment.assigned) * 100)
                  : 0;

              return (
                <motion.div
                  key={assessment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-slate-900 border border-white/5 rounded-xl p-6 hover:border-indigo-500/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-indigo-400" />
                    </div>
                    <span className="px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium">
                      {assessmentTypeLabels[assessment.type] || assessment.type}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{assessment.title}</h3>
                  {assessment.description && (
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">{assessment.description}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Questions:</span>
                      <span className="text-white font-semibold">{assessment.questionsCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Duration:</span>
                      <span className="text-white font-semibold">{assessment.duration} mins</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Pass Score:</span>
                      <span className="text-white font-semibold">{assessment.passingScore}%</span>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">Completion Rate</span>
                      <span className="text-sm text-white font-semibold">{completionRate}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
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

                  <div className="flex items-center gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAssign(assessment)}
                      className="flex-1 border-slate-700 hover:bg-slate-800"
                    >
                      Assign
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/portal/hr/assessments/${assessment.id}`)}
                      className="flex-1 text-indigo-400 hover:text-indigo-300"
                    >
                      View Details
                    </Button>
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

        {/* Create Assessment Modal */}
        <CreateAssessmentModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            fetchAssessments();
            setShowCreateModal(false);
          }}
        />

        {/* Assign Assessment Modal */}
        {selectedAssessment && (
          <AssignAssessmentModal
            open={showAssignModal}
            onClose={() => {
              setShowAssignModal(false);
              setSelectedAssessment(null);
            }}
            assessment={selectedAssessment}
            candidates={candidates}
            onAssigned={() => {
              fetchAssessments();
              setShowAssignModal(false);
              setSelectedAssessment(null);
            }}
          />
        )}
      </div>
    </PortalLayout>
  );
}

// Create Assessment Modal Component
function CreateAssessmentModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "MCQ",
    duration: 30,
    passingScore: 60,
    questions: [] as { question: string; options?: string[]; correct?: number }[],
  });
  const [currentQuestion, setCurrentQuestion] = useState({
    question: "",
    options: ["", "", "", ""],
    correct: 0,
  });

  const handleAddQuestion = () => {
    if (!currentQuestion.question.trim()) {
      toast.error("Question text is required");
      return;
    }
    if (form.type === "MCQ" && currentQuestion.options.some((o) => !o.trim())) {
      toast.error("All options are required for MCQ");
      return;
    }

    setForm({
      ...form,
      questions: [
        ...form.questions,
        form.type === "MCQ"
          ? currentQuestion
          : { question: currentQuestion.question },
      ],
    });
    setCurrentQuestion({
      question: "",
      options: ["", "", "", ""],
      correct: 0,
    });
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("Assessment title is required");
      return;
    }
    if (form.questions.length === 0) {
      toast.error("Add at least one question");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/portal/hr/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create assessment");
      }

      toast.success("Assessment created successfully");
      onCreated();
      setForm({
        title: "",
        description: "",
        type: "MCQ",
        duration: 30,
        passingScore: 60,
        questions: [],
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create assessment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Assessment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-slate-300">Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., JavaScript Technical Assessment"
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>

            <div className="col-span-2">
              <Label className="text-slate-300">Description (optional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the assessment..."
                className="bg-slate-800 border-slate-700 text-white mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label className="text-slate-300">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="MCQ">MCQ Test</SelectItem>
                  <SelectItem value="CODING">Coding Test</SelectItem>
                  <SelectItem value="AI_INTERVIEW">AI Interview</SelectItem>
                  <SelectItem value="VOICE">Voice Round</SelectItem>
                  <SelectItem value="GD">Group Discussion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Duration (minutes)</Label>
              <Input
                type="number"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 30 })}
                min={5}
                max={180}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-slate-300">Pass Score (%)</Label>
              <Input
                type="number"
                value={form.passingScore}
                onChange={(e) => setForm({ ...form, passingScore: parseInt(e.target.value) || 60 })}
                min={0}
                max={100}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
          </div>

          {/* Questions Section */}
          <div className="border-t border-slate-800 pt-4">
            <h3 className="text-white font-medium mb-3">
              Questions ({form.questions.length} added)
            </h3>

            {/* Added Questions List */}
            {form.questions.length > 0 && (
              <div className="space-y-2 mb-4">
                {form.questions.map((q, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-slate-800 p-3 rounded-lg"
                  >
                    <span className="text-slate-300 text-sm truncate flex-1">
                      {i + 1}. {q.question}
                    </span>
                    <button
                      onClick={() =>
                        setForm({
                          ...form,
                          questions: form.questions.filter((_, idx) => idx !== i),
                        })
                      }
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Question */}
            <div className="bg-slate-800/50 p-4 rounded-lg space-y-3">
              <Input
                value={currentQuestion.question}
                onChange={(e) =>
                  setCurrentQuestion({ ...currentQuestion, question: e.target.value })
                }
                placeholder="Enter question text..."
                className="bg-slate-800 border-slate-700 text-white"
              />

              {form.type === "MCQ" && (
                <div className="space-y-2">
                  {currentQuestion.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correct"
                        checked={currentQuestion.correct === i}
                        onChange={() => setCurrentQuestion({ ...currentQuestion, correct: i })}
                        className="accent-indigo-500"
                      />
                      <Input
                        value={opt}
                        onChange={(e) => {
                          const newOptions = [...currentQuestion.options];
                          newOptions[i] = e.target.value;
                          setCurrentQuestion({ ...currentQuestion, options: newOptions });
                        }}
                        placeholder={`Option ${i + 1}`}
                        className="bg-slate-800 border-slate-700 text-white flex-1"
                      />
                    </div>
                  ))}
                  <p className="text-xs text-slate-500">Select the correct answer</p>
                </div>
              )}

              <Button
                onClick={handleAddQuestion}
                variant="outline"
                size="sm"
                className="border-slate-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Question
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Assessment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Assign Assessment Modal Component
function AssignAssessmentModal({
  open,
  onClose,
  assessment,
  candidates,
  onAssigned,
}: {
  open: boolean;
  onClose: () => void;
  assessment: Assessment;
  candidates: Candidate[];
  onAssigned: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const filteredCandidates = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleCandidate = (id: string) => {
    setSelectedCandidates((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    if (selectedCandidates.length === 0) {
      toast.error("Select at least one candidate");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/portal/hr/assessments/${assessment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "assign",
          candidateIds: selectedCandidates,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to assign assessment");
      }

      toast.success(`Assessment assigned to ${selectedCandidates.length} candidate(s)`);
      onAssigned();
      setSelectedCandidates([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to assign assessment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">
            Assign: {assessment.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidates..."
              className="pl-10 bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredCandidates.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No candidates found</p>
            ) : (
              filteredCandidates.map((candidate) => (
                <div
                  key={candidate.id}
                  onClick={() => toggleCandidate(candidate.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                    selectedCandidates.includes(candidate.id)
                      ? "bg-indigo-500/20 border border-indigo-500/50"
                      : "bg-slate-800 border border-transparent hover:border-slate-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center ${
                      selectedCandidates.includes(candidate.id)
                        ? "bg-indigo-500 border-indigo-500"
                        : "border-slate-600"
                    }`}
                  >
                    {selectedCandidates.includes(candidate.id) && (
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{candidate.name}</p>
                    <p className="text-slate-400 text-sm truncate">{candidate.email}</p>
                  </div>
                  <span className="text-xs text-slate-500">{candidate.position}</span>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <p className="text-slate-400 text-sm">
              {selectedCandidates.length} selected
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                disabled={loading || selectedCandidates.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Assign Assessment
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Skeleton loader
function AssessmentSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div className="h-8 bg-white/5 rounded-lg w-48" />
        <div className="h-10 bg-white/5 rounded-lg w-40" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-white/5 rounded-xl" />
        ))}
      </div>
      <div className="h-10 bg-white/5 rounded-lg" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 bg-white/5 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// Icon components (matching HR portal pattern)
function HomeIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}
function UsersIcon2() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}
function UserPlusIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
      />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}
function BriefcaseIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}
function ClipboardListIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6m-6 4h6"
      />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
function CheckSquareIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
  );
}
function BanknotesIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}
function DocumentIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}
