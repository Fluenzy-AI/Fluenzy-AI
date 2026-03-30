"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import CompanyPortalLayout from "@/components/CompanyPortalLayout";
import {
  ArrowLeft,
  ClipboardList,
  Code,
  Mic,
  Video,
  Users as UsersIcon,
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  UserPlus,
  Settings,
  Check,
  ChevronRight,
  Trash2,
  Plus,
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

interface Question {
  id: string;
  text: string;
  type: "single" | "multiple";
  options: string[];
  correctAnswers: number[];
  marks: number;
}

interface AssessmentForm {
  type: "MCQ" | "CODING" | "AI_INTERVIEW" | "VOICE" | "GD" | "CORPORATE_VOICE" | "";
  subType?: string; // For Corporate Voice sub-types
  title: string;
  jobId: string;
  duration: number;
  passPercentage: number;
  description: string;
  questions: Question[];
  codingProblem?: string;
  codingLanguage?: string;
  // GD config
  gdTopic?: string;
  gdMaxCandidates?: number; // Max candidates per GD room
  // Voice config
  voiceAudioOnly?: boolean;
  voiceCategories?: string[];
  // Corporate Voice config
  corporateVoiceConfig?: {
    passages?: string[];
    audioPrompts?: string[];
    conversationTopic?: string;
    extemporaneousTopic?: string;
    prepTime?: number;
    summarizePassage?: string;
  };
}

const assessmentTypes = [
  { id: "MCQ", label: "Multiple Choice", icon: ClipboardList, desc: "Traditional MCQ assessment" },
  { id: "CODING", label: "Coding Challenge", icon: Code, desc: "Programming problem solving" },
  { id: "AI_INTERVIEW", label: "AI Interview", icon: Mic, desc: "AI-powered interview" },
  { id: "VOICE", label: "Voice Interview", icon: Video, desc: "Audio/video interview" },
  { id: "GD", label: "Group Discussion", icon: UsersIcon, desc: "Group discussion round" },
  { id: "CORPORATE_VOICE", label: "Corporate Voice", icon: Mic, desc: "Voice assessment with 6 sub-types" },
];

const corporateVoiceSubTypes = [
  { id: "read_aloud", label: "Read Aloud", desc: "Candidate reads text passages aloud" },
  { id: "listen_repeat", label: "Listen & Repeat", desc: "Candidate repeats audio prompts" },
  { id: "comprehension", label: "Comprehension", desc: "Listen and answer questions" },
  { id: "conversation", label: "Conversation", desc: "AI conducts professional conversation" },
  { id: "extemporaneous", label: "Extemporaneous", desc: "Impromptu speaking on a topic" },
  { id: "listen_summarize", label: "Listen & Summarize", desc: "Listen and summarize content" },
];

export default function NewAssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [jobs, setJobs] = useState<Array<{ id: string; title: string }>>([]);
  const [form, setForm] = useState<AssessmentForm>({
    type: "",
    title: "",
    jobId: "",
    duration: 60,
    passPercentage: 70,
    description: "",
    questions: [],
    gdMaxCandidates: 10, // Default: 10 candidates per GD room
  });

  React.useEffect(() => {
    // Fetch jobs for dropdown
    const fetchJobs = async () => {
      try {
        const res = await fetch("/api/company/jobs");
        if (res.ok) {
          const data = await res.json();
          const jobList = (data.jobs || []).map((job: any) => ({
            id: job.id,
            title: job.title,
          }));
          setJobs(jobList);
        }
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      }
    };
    fetchJobs();
  }, []);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: "",
      type: "single",
      options: ["", ""],
      correctAnswers: [],
      marks: 1,
    };
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  const updateQuestion = (id: string, field: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q
      ),
    }));
  };

  const deleteQuestion = (id: string) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
    }));
  };

  const addOption = (questionId: string) => {
    updateQuestion(questionId, "options", [
      ...form.questions.find((q) => q.id === questionId)?.options || [],
      "",
    ]);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...form,
        type: form.type || "MCQ",
      };

      const res = await fetch("/api/company/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/company/portal/assessments");
      }
    } catch (error) {
      console.error("Failed to create assessment:", error);
    }
  };

  return (
    <CompanyPortalLayout navItems={COMPANY_NAV} title="Create Assessment">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Create Assessment</h1>
            <p className="text-slate-400 mt-1">Step {step} of 4</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((num) => (
            <div
              key={num}
              className={`flex-1 h-1 rounded-full transition-all ${
                num <= step ? "bg-indigo-600" : "bg-slate-700"
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-6"
        >
          {/* Step 1: Assessment Type */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Select Assessment Type
                </h2>
                <p className="text-slate-400">
                  Choose the type of assessment for candidates
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assessmentTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <motion.div
                      key={type.id}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          type: type.id as any,
                        }))
                      }
                      className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                        form.type === type.id
                          ? "bg-indigo-500/10 border-indigo-500"
                          : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <Icon className="w-8 h-8 text-indigo-400" />
                        {form.type === type.id && (
                          <Check className="w-5 h-5 text-indigo-400" />
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white">{type.label}</h3>
                      <p className="text-sm text-slate-400 mt-1">{type.desc}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Assessment Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Assessment Details
                </h2>
                <p className="text-slate-400">
                  Configure basic information about your assessment
                </p>
              </div>

              <div className="space-y-4 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Assessment Title
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="e.g., Senior React Developer Assessment"
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Job Position
                  </label>
                  <select
                    value={form.jobId}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, jobId: e.target.value }))
                    }
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select a job position</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={form.duration}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          duration: parseInt(e.target.value),
                        }))
                      }
                      min="5"
                      max="480"
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Pass Percentage (%)
                    </label>
                    <input
                      type="number"
                      value={form.passPercentage}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          passPercentage: parseInt(e.target.value),
                        }))
                      }
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Add instructions or context for candidates..."
                    rows={4}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Questions (MCQ only) */}
          {step === 3 && form.type === "MCQ" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Add Questions
                  </h2>
                  <p className="text-slate-400">
                    Create multiple choice questions for the assessment
                  </p>
                </div>
                <Button
                  onClick={addQuestion}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>

              {form.questions.length === 0 ? (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
                  <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-4">
                    No questions added yet. Create your first question.
                  </p>
                  <Button
                    onClick={addQuestion}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {form.questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">
                          Question {index + 1}
                        </h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteQuestion(question.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <input
                          type="text"
                          value={question.text}
                          onChange={(e) =>
                            updateQuestion(question.id, "text", e.target.value)
                          }
                          placeholder="Enter question text..."
                          className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-slate-300 mb-1 block">
                              Question Type
                            </label>
                            <select
                              value={question.type}
                              onChange={(e) =>
                                updateQuestion(
                                  question.id,
                                  "type",
                                  e.target.value as "single" | "multiple"
                                )
                              }
                              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                            >
                              <option value="single">Single Choice</option>
                              <option value="multiple">Multiple Choice</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-sm text-slate-300 mb-1 block">
                              Marks
                            </label>
                            <input
                              type="number"
                              value={question.marks}
                              onChange={(e) =>
                                updateQuestion(
                                  question.id,
                                  "marks",
                                  parseInt(e.target.value)
                                )
                              }
                              min="1"
                              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm text-slate-300">Options</label>
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex gap-2">
                              <input
                                type={question.type === "single" ? "radio" : "checkbox"}
                                checked={question.correctAnswers.includes(
                                  optIndex
                                )}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    if (question.type === "single") {
                                      updateQuestion(question.id, "correctAnswers", [
                                        optIndex,
                                      ]);
                                    } else {
                                      updateQuestion(question.id, "correctAnswers", [
                                        ...question.correctAnswers,
                                        optIndex,
                                      ]);
                                    }
                                  } else {
                                    updateQuestion(
                                      question.id,
                                      "correctAnswers",
                                      question.correctAnswers.filter(
                                        (i) => i !== optIndex
                                      )
                                    );
                                  }
                                }}
                                className="w-4 h-4 mt-2"
                              />
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...question.options];
                                  newOptions[optIndex] = e.target.value;
                                  updateQuestion(question.id, "options", newOptions);
                                }}
                                placeholder={`Option ${optIndex + 1}`}
                                className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(question.id)}
                            className="border-slate-600 text-slate-300 hover:text-white"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Option
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Other Assessment Types */}
          {step === 3 && form.type !== "MCQ" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {form.type === "CODING"
                    ? "Coding Problem"
                    : form.type === "AI_INTERVIEW"
                    ? "Interview Configuration"
                    : "Assessment Configuration"}
                </h2>
                <p className="text-slate-400">
                  Configure details for {form.type?.replace("_", " ").toLowerCase()}
                </p>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
                {form.type === "CODING" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Programming Language
                      </label>
                      <select
                        value={form.codingLanguage || ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            codingLanguage: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">Select Language</option>
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                        <option value="csharp">C#</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Problem Statement
                      </label>
                      <textarea
                        value={form.codingProblem || ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            codingProblem: e.target.value,
                          }))
                        }
                        placeholder="Describe the coding problem, expected inputs/outputs, and constraints..."
                        rows={6}
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </>
                )}

                {(form.type === "AI_INTERVIEW" ||
                  form.type === "VOICE" ||
                  form.type === "GD") && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Interview Instructions
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Add instructions and guidelines for candidates..."
                      rows={6}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
                
                {form.type === "GD" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Discussion Topic
                      </label>
                      <input
                        type="text"
                        value={form.gdTopic || ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            gdTopic: e.target.value,
                          }))
                        }
                        placeholder="e.g., The impact of AI on the workforce"
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Max Candidates Per GD Room
                      </label>
                      <input
                        type="number"
                        min={2}
                        max={50}
                        value={form.gdMaxCandidates || 10}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            gdMaxCandidates: parseInt(e.target.value) || 10,
                          }))
                        }
                        placeholder="10"
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Candidates will be grouped automatically. E.g., 50 candidates with max 10 = 5 separate GD rooms.
                      </p>
                    </div>
                  </>
                )}

                {form.type === "CORPORATE_VOICE" && (
                  <div className="space-y-6">
                    {/* Sub-type selection */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-3">
                        Select Assessment Sub-Type
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {corporateVoiceSubTypes.map((subType) => (
                          <div
                            key={subType.id}
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                subType: subType.id,
                              }))
                            }
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              form.subType === subType.id
                                ? "bg-purple-500/10 border-purple-500"
                                : "bg-slate-700/50 border-slate-600 hover:border-slate-500"
                            }`}
                          >
                            <h4 className="font-medium text-white">{subType.label}</h4>
                            <p className="text-xs text-slate-400 mt-1">{subType.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sub-type specific configuration */}
                    {form.subType === "read_aloud" && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Text Passages (one per line)
                        </label>
                        <textarea
                          value={form.corporateVoiceConfig?.passages?.join("\n") || ""}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              corporateVoiceConfig: {
                                ...prev.corporateVoiceConfig,
                                passages: e.target.value.split("\n").filter(Boolean),
                              },
                            }))
                          }
                          placeholder="Enter text passages for candidates to read aloud. Each line will be a separate passage."
                          rows={6}
                          className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}

                    {form.subType === "listen_repeat" && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Audio Phrases (one per line)
                        </label>
                        <textarea
                          value={form.corporateVoiceConfig?.audioPrompts?.join("\n") || ""}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              corporateVoiceConfig: {
                                ...prev.corporateVoiceConfig,
                                audioPrompts: e.target.value.split("\n").filter(Boolean),
                              },
                            }))
                          }
                          placeholder="Enter phrases that will be spoken for candidates to repeat. Each line will be a separate phrase."
                          rows={6}
                          className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}

                    {form.subType === "conversation" && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Conversation Topic
                        </label>
                        <input
                          type="text"
                          value={form.corporateVoiceConfig?.conversationTopic || ""}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              corporateVoiceConfig: {
                                ...prev.corporateVoiceConfig,
                                conversationTopic: e.target.value,
                              },
                            }))
                          }
                          placeholder="e.g., Handling difficult client situations"
                          className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}

                    {form.subType === "extemporaneous" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Speaking Topic
                          </label>
                          <input
                            type="text"
                            value={form.corporateVoiceConfig?.extemporaneousTopic || ""}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                corporateVoiceConfig: {
                                  ...prev.corporateVoiceConfig,
                                  extemporaneousTopic: e.target.value,
                                },
                              }))
                            }
                            placeholder="e.g., The future of remote work"
                            className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Preparation Time (seconds)
                          </label>
                          <input
                            type="number"
                            value={form.corporateVoiceConfig?.prepTime || 30}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                corporateVoiceConfig: {
                                  ...prev.corporateVoiceConfig,
                                  prepTime: parseInt(e.target.value),
                                },
                              }))
                            }
                            min="0"
                            max="120"
                            className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    )}

                    {form.subType === "listen_summarize" && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Passage to Summarize
                        </label>
                        <textarea
                          value={form.corporateVoiceConfig?.summarizePassage || ""}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              corporateVoiceConfig: {
                                ...prev.corporateVoiceConfig,
                                summarizePassage: e.target.value,
                              },
                            }))
                          }
                          placeholder="Enter the passage that will be spoken to the candidate. They will need to summarize it in their own words."
                          rows={6}
                          className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Review & Publish */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Review & Publish
                </h2>
                <p className="text-slate-400">
                  Review your assessment before publishing
                </p>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Assessment Type</p>
                    <p className="text-lg font-bold text-white">
                      {form.type?.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Title</p>
                    <p className="text-lg font-bold text-white">{form.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Duration</p>
                    <p className="text-lg font-bold text-white">{form.duration} min</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Pass %</p>
                    <p className="text-lg font-bold text-white">
                      {form.passPercentage}%
                    </p>
                  </div>
                </div>

                {form.type === "MCQ" && (
                  <div>
                    <p className="text-sm text-slate-400 mb-2">
                      Total Questions
                    </p>
                    <p className="text-lg font-bold text-white">
                      {form.questions.length} questions
                    </p>
                  </div>
                )}

                {form.description && (
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Description</p>
                    <p className="text-slate-300 text-sm">{form.description}</p>
                  </div>
                )}

                <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-lg p-4 flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-400">
                      Assessment Ready
                    </p>
                    <p className="text-xs text-emerald-400/70">
                      You can publish this assessment and assign it to candidates
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex gap-4 justify-end">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="border-slate-600 text-slate-300 hover:text-white disabled:opacity-50"
          >
            Previous
          </Button>

          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !form.type) ||
                (step === 2 && (!form.title || !form.jobId)) ||
                (step === 3 && form.type === "MCQ" && form.questions.length === 0)
              }
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Publish Assessment
            </Button>
          )}
        </div>
      </div>
    </CompanyPortalLayout>
  );
}
