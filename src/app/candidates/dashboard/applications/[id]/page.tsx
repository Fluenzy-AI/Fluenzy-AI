"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Download,
  ExternalLink,
  Briefcase,
  Mail,
  Phone,
  User,
} from "lucide-react";

interface Application {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  email: string;
  phone: string;
  experience: string;
  coverLetter?: string;
  resumeUrl?: string;
  resumeName?: string;
  linkedin?: string;
  portfolio?: string;
  job: {
    id: string;
    title: string;
    slug: string;
    department: string;
    location: string;
    employmentType: string;
    description: string;
    salaryRange?: string;
  };
  interviews?: Array<{
    id: string;
    scheduledAt: string;
    status: string;
    type: string;
    meetingLink?: string;
    notes?: string;
  }>;
}

const STATUS_STEPS = [
  { key: "APPLIED", label: "Applied", icon: FileText },
  { key: "UNDER_REVIEW", label: "Under Review", icon: Eye },
  { key: "SHORTLISTED", label: "Shortlisted", icon: CheckCircle },
  { key: "INTERVIEW_SCHEDULED", label: "Interview", icon: Calendar },
  { key: "FINAL", label: "Decision", icon: CheckCircle },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: "Pending", color: "text-amber-400", bgColor: "bg-amber-500/10" },
  APPLIED: { label: "Applied", color: "text-blue-400", bgColor: "bg-blue-500/10" },
  UNDER_REVIEW: { label: "Under Review", color: "text-violet-400", bgColor: "bg-violet-500/10" },
  SHORTLISTED: { label: "Shortlisted", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
  INTERVIEW_SCHEDULED: { label: "Interview Scheduled", color: "text-indigo-400", bgColor: "bg-indigo-500/10" },
  REJECTED: { label: "Not Selected", color: "text-red-400", bgColor: "bg-red-500/10" },
  HIRED: { label: "Hired! 🎉", color: "text-green-400", bgColor: "bg-green-500/10" },
};

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const res = await fetch(`/api/candidates/applications/${params.id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Application not found");
          } else {
            setError("Failed to load application");
          }
          return;
        }
        const data = await res.json();
        setApplication(data.application);
      } catch (err) {
        console.error("Failed to fetch application:", err);
        setError("Failed to load application");
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchApplication();
  }, [params.id]);

  const getCurrentStep = () => {
    if (!application) return 0;
    if (application.status === "REJECTED" || application.status === "HIRED") return 5;
    const stepIndex = STATUS_STEPS.findIndex((s) => s.key === application.status);
    return stepIndex >= 0 ? stepIndex + 1 : 1;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-white/5 rounded-xl w-48" />
        <div className="h-64 bg-white/5 rounded-xl" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-48 bg-white/5 rounded-xl" />
          <div className="h-48 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{error || "Application not found"}</h2>
        <p className="text-slate-400 text-sm mb-6">The application you're looking for doesn't exist or you don't have access.</p>
        <Link
          href="/candidates/dashboard/applications"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Applications
        </Link>
      </div>
    );
  }

  const status = STATUS_CONFIG[application.status] || STATUS_CONFIG.PENDING;
  const currentStep = getCurrentStep();

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/candidates/dashboard/applications"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Applications
      </Link>

      {/* Header */}
      <div className="bg-[#13161E] rounded-xl border border-white/5 p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{application.job.title}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <Building className="w-4 h-4" />
                Fluenzy AI
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {application.job.location}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {application.job.employmentType.replace("_", " ")}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${status.bgColor} ${status.color}`}>
              {status.label}
            </span>
            <p className="text-xs text-slate-500">
              Applied {new Date(application.createdAt).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="bg-[#13161E] rounded-xl border border-white/5 p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Application Progress</h2>
        <div className="flex items-center justify-between">
          {STATUS_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep - 1;
            const isRejected = application.status === "REJECTED" && index === STATUS_STEPS.length - 1;
            const isHired = application.status === "HIRED" && index === STATUS_STEPS.length - 1;

            return (
              <div key={step.key} className="flex-1 relative">
                {index > 0 && (
                  <div
                    className={`absolute left-0 top-5 w-full h-0.5 -translate-x-1/2 ${
                      isCompleted ? "bg-violet-500" : "bg-white/10"
                    }`}
                  />
                )}
                <div className="relative flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center z-10 border transition-all ${
                      isRejected
                        ? "bg-red-500/20 border-red-500/30"
                        : isHired
                        ? "bg-green-500/20 border-green-500/30"
                        : isCompleted || isCurrent
                        ? "bg-violet-500/20 border-violet-500/30"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    {isRejected ? (
                      <XCircle className="w-5 h-5 text-red-400" />
                    ) : isHired ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <Icon className={`w-5 h-5 ${isCompleted || isCurrent ? "text-violet-400" : "text-slate-500"}`} />
                    )}
                  </div>
                  <p className={`text-xs mt-2 font-medium text-center ${isCompleted || isCurrent ? "text-white" : "text-slate-500"}`}>
                    {isRejected ? "Not Selected" : isHired ? "Hired!" : step.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Your Information */}
        <div className="bg-[#13161E] rounded-xl border border-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Your Information</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <User className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Name</p>
                <p className="text-sm text-white font-medium">{application.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Mail className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm text-white font-medium">{application.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Phone className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Phone</p>
                <p className="text-sm text-white font-medium">{application.phone}</p>
              </div>
            </div>
            {application.resumeUrl && (
              <a
                href={application.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-violet-500/30 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Resume</p>
                  <p className="text-sm text-white font-medium truncate group-hover:text-violet-300 transition-colors">
                    {application.resumeName || "View Resume"}
                  </p>
                </div>
                <Download className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors" />
              </a>
            )}
          </div>
        </div>

        {/* Job Details */}
        <div className="bg-[#13161E] rounded-xl border border-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Job Details</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500">Department</p>
              <p className="text-sm text-white font-medium">{application.job.department}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Employment Type</p>
              <p className="text-sm text-white font-medium">{application.job.employmentType.replace("_", " ")}</p>
            </div>
            {application.job.salaryRange && (
              <div>
                <p className="text-xs text-slate-500">Salary Range</p>
                <p className="text-sm text-white font-medium">{application.job.salaryRange}</p>
              </div>
            )}
            <Link
              href={`/careers/${application.job.slug}`}
              className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors mt-4"
            >
              View Full Job Description
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Interviews Section */}
      {application.interviews && application.interviews.length > 0 && (
        <div className="bg-[#13161E] rounded-xl border border-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Scheduled Interviews</h2>
          <div className="space-y-3">
            {application.interviews.map((interview) => (
              <div
                key={interview.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{interview.type} Interview</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(interview.scheduledAt).toLocaleDateString("en-IN", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                {interview.meetingLink && (
                  <a
                    href={interview.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-400 transition-colors"
                  >
                    Join Meeting
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cover Letter */}
      {application.coverLetter && (
        <div className="bg-[#13161E] rounded-xl border border-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Cover Letter</h2>
          <p className="text-sm text-slate-300 whitespace-pre-wrap">{application.coverLetter}</p>
        </div>
      )}
    </div>
  );
}
