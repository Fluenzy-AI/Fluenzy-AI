"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Calendar,
  MapPin,
  Briefcase,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface ApplicationDetail {
  id: string;
  status: string;
  createdAt: string;
  interviewDate?: string | null;
  notes?: string;
  isAutoApplied: boolean;
  resumeUrl: string;
  resumeName: string;
  coverLetter?: string;
  experience: string;
  name: string;
  email: string;
  phone: string;
  linkedin?: string;
  portfolio?: string;
  job: {
    id: string;
    title: string;
    slug: string;
    department: string;
    location: string;
    employmentType: string;
    salaryMin?: string;
    salaryMax?: string;
    description: string;
    company: {
      id: string;
      name: string;
      slug: string;
      logoUrl?: string;
    };
  };
}

interface Timeline {
  status: string;
  icon: React.ReactNode;
  date?: string;
  description: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  PENDING: { bg: "bg-yellow-500/10", text: "text-yellow-400", icon: "🔵" },
  REVIEWED: { bg: "bg-blue-500/10", text: "text-blue-400", icon: "👀" },
  SHORTLISTED: { bg: "bg-emerald-500/10", text: "text-emerald-400", icon: "⭐" },
  INTERVIEW_SCHEDULED: {
    bg: "bg-violet-500/10",
    text: "text-violet-400",
    icon: "📞",
  },
  HIRED: { bg: "bg-purple-500/10", text: "text-purple-400", icon: "🎉" },
  REJECTED: { bg: "bg-red-500/10", text: "text-red-400", icon: "❌" },
};

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApplication();
  }, [applicationId]);

  const fetchApplication = async () => {
    try {
      const res = await fetch(
        `/api/candidates/applications/${applicationId}`
      );
      if (!res.ok) throw new Error("Application not found");
      const data = await res.json();
      setApp(data.application);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load application");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-8 h-8 text-[#7C5CFC]" />
        </motion.div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-[#EF4444]" />
        <h2 className="text-xl font-bold text-[#F1F0F5]">Application Not Found</h2>
        <p className="text-[#8B8A99]">{error || "The application you're looking for doesn't exist"}</p>
        <Link
          href="/candidates/dashboard/applications"
          className="px-4 py-2 bg-[#7C5CFC] text-white rounded-lg hover:bg-[#7C5CFC]/90"
        >
          Back to Applications
        </Link>
      </div>
    );
  }

  const colorScheme = STATUS_COLORS[app.status] || STATUS_COLORS.PENDING;

  const timelineEvents: Timeline[] = [
    {
      status: "PENDING",
      icon: "📤",
      date: new Date(app.createdAt).toLocaleDateString("en-IN", {
        dateStyle: "long",
        timeStyle: "short",
      }),
      description: `Applied ${app.isAutoApplied ? "automatically" : "manually"}`,
    },
    ...(app.status !== "PENDING"
      ? [
          {
            status: "REVIEWED",
            icon: "👀",
            date: "",
            description: "HR reviewed your application",
          },
        ]
      : []),
    ...(["SHORTLISTED", "INTERVIEW_SCHEDULED", "HIRED", "REJECTED"].includes(
      app.status
    )
      ? [
          {
            status: "SHORTLISTED",
            icon: "⭐",
            date: "",
            description: "Advanced to interview stage",
          },
        ]
      : []),
    ...(app.interviewDate
      ? [
          {
            status: "INTERVIEW_SCHEDULED",
            icon: "📞",
            date: new Date(app.interviewDate).toLocaleDateString("en-IN", {
              dateStyle: "long",
              timeStyle: "short",
            }),
            description: "Interview scheduled",
          },
        ]
      : []),
    ...(app.status === "HIRED"
      ? [
          {
            status: "HIRED",
            icon: "🎉",
            date: "",
            description: "Congratulations! You got the job",
          },
        ]
      : []),
    ...(app.status === "REJECTED"
      ? [
          {
            status: "REJECTED",
            icon: "❌",
            date: "",
            description: "Application did not move forward",
          },
        ]
      : []),
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.back()}
        className="flex items-center gap-2 px-3 py-2 text-[#8B8A99] hover:text-[#F1F0F5] hover:bg-white/[0.04] rounded-lg transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </motion.button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#13161E] border border-white/[0.06] rounded-2xl p-8"
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-[#F1F0F5] mb-2">
                  {app.job.title}
                </h1>
                <p className="text-lg text-[#7C5CFC] font-medium">
                  {app.job.company.name}
                </p>
              </div>
              <div
                className={`px-4 py-2 rounded-xl font-medium ${colorScheme.text} ${colorScheme.bg}`}
              >
                {colorScheme.icon} {app.status.replace(/_/g, " ")}
              </div>
            </div>

            {/* Job Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-[#8B8A99] font-medium mb-1">Department</p>
                <p className="text-[#F1F0F5]">{app.job.department}</p>
              </div>
              <div>
                <p className="text-xs text-[#8B8A99] font-medium mb-1">Location</p>
                <p className="text-[#F1F0F5] flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {app.job.location}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#8B8A99] font-medium mb-1">Type</p>
                <p className="text-[#F1F0F5]">{app.job.employmentType}</p>
              </div>
              {app.job.salaryMin && app.job.salaryMax && (
                <div>
                  <p className="text-xs text-[#8B8A99] font-medium mb-1">Salary</p>
                  <p className="text-[#F1F0F5] text-green-400">
                    {app.job.salaryMin} - {app.job.salaryMax}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#13161E] border border-white/[0.06] rounded-2xl p-8"
          >
            <h2 className="text-lg font-bold text-[#F1F0F5] mb-6">
              Application Timeline
            </h2>
            <div className="relative space-y-6">
              {timelineEvents.map((event, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="relative flex flex-col items-center">
                    <div className="text-2xl mb-2">{event.icon}</div>
                    {idx < timelineEvents.length - 1 && (
                      <div className="w-0.5 h-16 bg-[#7C5CFC]/20" />
                    )}
                  </div>
                  <div className="pt-1">
                    <h3 className="font-medium text-[#F1F0F5]">
                      {event.status.replace(/_/g, " ")}
                    </h3>
                    <p className="text-sm text-[#8B8A99]">{event.description}</p>
                    {event.date && (
                      <p className="text-xs text-[#52515E] mt-1">{event.date}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Notes */}
          {app.notes && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#13161E] border border-white/[0.06] rounded-2xl p-6"
            >
              <h3 className="font-bold text-[#F1F0F5] mb-3">HR Notes</h3>
              <p className="text-[#8B8A99]">{app.notes}</p>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Your Application */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#13161E] border border-white/[0.06] rounded-2xl p-6"
          >
            <h3 className="font-bold text-[#F1F0F5] mb-4">Your Application</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[#8B8A99] text-xs mb-1">Name</p>
                <p className="text-[#F1F0F5]">{app.name}</p>
              </div>
              <div>
                <p className="text-[#8B8A99] text-xs mb-1">Email</p>
                <p className="text-[#F1F0F5]">{app.email}</p>
              </div>
              <div>
                <p className="text-[#8B8A99] text-xs mb-1">Phone</p>
                <p className="text-[#F1F0F5]">{app.phone}</p>
              </div>
              <div>
                <p className="text-[#8B8A99] text-xs mb-1">Experience</p>
                <p className="text-[#F1F0F5]">{app.experience}</p>
              </div>

              {/* Documents */}
              <div className="pt-3 border-t border-white/[0.06]">
                <p className="text-[#8B8A99] text-xs font-medium mb-2">Documents</p>
                <div className="space-y-2">
                  <a
                    href={app.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-[#7C5CFC]/10 hover:bg-[#7C5CFC]/20 text-[#9F7FFF] rounded-lg transition-colors text-xs"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="truncate">{app.resumeName}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>
              </div>

              {/* Social Links */}
              {(app.linkedin || app.portfolio) && (
                <div className="pt-3 border-t border-white/[0.06]">
                  <p className="text-[#8B8A99] text-xs font-medium mb-2">Links</p>
                  <div className="space-y-2">
                    {app.linkedin && (
                      <a
                        href={app.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[#7C5CFC] hover:text-[#9F7FFF] text-xs"
                      >
                        <ExternalLink className="w-3 h-3" />
                        LinkedIn
                      </a>
                    )}
                    {app.portfolio && (
                      <a
                        href={app.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[#7C5CFC] hover:text-[#9F7FFF] text-xs"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Portfolio
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Application Metadata */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#13161E] border border-white/[0.06] rounded-2xl p-6"
          >
            <h3 className="font-bold text-[#F1F0F5] mb-4">Application Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-[#8B8A99]">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(app.createdAt).toLocaleDateString("en-IN", {
                    dateStyle: "long",
                  })}
                </span>
              </div>
              {app.isAutoApplied && (
                <div className="flex items-center gap-2 px-3 py-2 bg-[#7C5CFC]/10 text-[#9F7FFF] rounded-lg text-xs font-medium">
                  <span>⚡</span>
                  Auto-Applied
                </div>
              )}
            </div>
          </motion.div>

          {/* View Job Button */}
          <Link
            href={`/jobs/${app.job.company.slug}/${app.job.slug}`}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#7C5CFC] to-[#A855F7] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#7C5CFC]/50 transition-all"
          >
            View Job Description
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
