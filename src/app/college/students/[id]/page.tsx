"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CollegeProtectedLayout from "../../components/CollegeProtectedLayout";
import {
  ArrowLeft, User, Mail, Building2, Calendar, Tag, AlertTriangle,
  BookOpen, Mic, TrendingUp, Activity, Clock, Edit3, Loader2,
  CheckCircle, XCircle, Shield, Star, FileText
} from "lucide-react";

interface StudentDetail {
  id: string;
  studentName: string;
  email: string;
  department?: string;
  yearOfStudy?: string;
  rollNumber?: string;
  status: string;
  onboardedAt?: string;
  tags: string[];
  warningFlags: string[];
  adminNotes?: string;
  batch?: { id: string; batchName: string };
  performance?: {
    totalSessions: number;
    avgScore: number;
    moduleUsage: Record<string, number>;
    lastActive?: string;
    recentSessions: Array<{
      id: string; module: string; score: number; duration: number; createdAt: string;
    }>;
  };
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-500/20 text-green-400 border-green-500/30",
  INACTIVE: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  SUSPENDED: "bg-red-500/20 text-red-400 border-red-500/30",
};

const moduleIcons: Record<string, React.ReactNode> = {
  INTERVIEW_PREP: <Mic className="w-4 h-4" />,
  VOCABULARY_BOOSTER: <BookOpen className="w-4 h-4" />,
  GROUP_DISCUSSION: <Activity className="w-4 h-4" />,
  CORPORATE_VOICE: <Building2 className="w-4 h-4" />,
};

function ScoreBar({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.min(100, (score / max) * 100);
  const color = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-300 w-8 text-right">{Math.round(score)}</span>
    </div>
  );
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("college_token");
    if (!token) return;
    fetch(`/api/college/students/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load");
        return res.json();
      })
      .then((d) => setStudent(d.student))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <CollegeProtectedLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      </CollegeProtectedLayout>
    );
  }

  if (error || !student) {
    return (
      <CollegeProtectedLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <XCircle className="w-10 h-10 text-red-400" />
          <p className="text-slate-300">{error || "Student not found."}</p>
          <button onClick={() => router.back()} className="text-indigo-400 hover:text-indigo-300 text-sm underline">Go back</button>
        </div>
      </CollegeProtectedLayout>
    );
  }

  const { performance } = student;

  return (
    <CollegeProtectedLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={() => router.push(`/college/students/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30 text-sm transition-all"
          >
            <Edit3 className="w-4 h-4" /> Edit Student
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-white">{student.studentName}</h1>
                <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${statusColors[student.status] ?? "bg-slate-700 text-slate-400"}`}>
                  {student.status}
                </span>
                {!student.onboardedAt && (
                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400">
                    Invite Pending
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-slate-400 mt-1">
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {student.email}</span>
                {student.department && <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> {student.department}</span>}
                {student.yearOfStudy && <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Year {student.yearOfStudy}</span>}
                {student.rollNumber && <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> {student.rollNumber}</span>}
                {student.batch && <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> {student.batch.batchName}</span>}
              </div>
              {student.onboardedAt && (
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  Activated on {new Date(student.onboardedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              )}
            </div>
          </div>

          {/* Tags */}
          {student.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {student.tags.map((t) => (
                <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                  <Tag className="w-3 h-3" /> {t}
                </span>
              ))}
            </div>
          )}

          {/* Warning Flags */}
          {student.warningFlags.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
              <p className="text-xs font-medium text-red-400 flex items-center gap-1.5 mb-2"><AlertTriangle className="w-3.5 h-3.5" /> Warning Flags</p>
              <div className="flex flex-wrap gap-2">
                {student.warningFlags.map((f) => (
                  <span key={f} className="px-2 py-0.5 text-xs bg-red-500/20 text-red-300 rounded-full">{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* Admin Notes */}
          {student.adminNotes && (
            <div className="mt-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
              <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1"><FileText className="w-3.5 h-3.5" /> Admin Notes</p>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{student.adminNotes}</p>
            </div>
          )}
        </div>

        {/* Performance Stats */}
        {performance ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Sessions", value: performance.totalSessions, icon: <Activity className="w-5 h-5" />, color: "indigo" },
                { label: "Avg Score", value: `${Math.round(performance.avgScore)}%`, icon: <TrendingUp className="w-5 h-5" />, color: "green" },
                { label: "Modules Used", value: Object.keys(performance.moduleUsage).length, icon: <BookOpen className="w-5 h-5" />, color: "purple" },
                { label: "Last Active", value: performance.lastActive ? new Date(performance.lastActive).toLocaleDateString("en-IN") : "N/A", icon: <Clock className="w-5 h-5" />, color: "yellow" },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="bg-[#111827]/80 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm">
                  <div className={`w-8 h-8 rounded-lg bg-${color}-500/20 flex items-center justify-center text-${color}-400 mb-3`}>{icon}</div>
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Module Breakdown */}
            {Object.keys(performance.moduleUsage).length > 0 && (
              <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
                <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-400" /> Module Usage</h2>
                <div className="space-y-3">
                  {Object.entries(performance.moduleUsage).map(([mod, count]) => (
                    <div key={mod} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        {moduleIcons[mod] ?? <Activity className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm text-slate-300">{mod.replace(/_/g, " ")}</p>
                          <span className="text-xs text-slate-400">{count} sessions</span>
                        </div>
                        <ScoreBar score={count} max={Math.max(...Object.values(performance.moduleUsage))} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Sessions */}
            {performance.recentSessions.length > 0 && (
              <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
                <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-400" /> Recent Sessions</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-500 border-b border-slate-700/50">
                        <th className="text-left pb-3 font-medium">Module</th>
                        <th className="text-left pb-3 font-medium">Score</th>
                        <th className="text-left pb-3 font-medium">Duration</th>
                        <th className="text-left pb-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                      {performance.recentSessions.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 text-slate-300">{s.module.replace(/_/g, " ")}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <ScoreBar score={s.score} />
                            </div>
                          </td>
                          <td className="py-3 text-slate-400">{Math.round(s.duration / 60)}m</td>
                          <td className="py-3 text-slate-400 whitespace-nowrap">{new Date(s.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-10 text-center backdrop-blur-sm">
            <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No activity data yet — student hasn&apos;t started any sessions.</p>
          </div>
        )}
      </div>
    </CollegeProtectedLayout>
  );
}
