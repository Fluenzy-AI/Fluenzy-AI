"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CollegeProtectedLayout from "../../components/CollegeProtectedLayout";
import {
  ArrowLeft, User, Mail, Building2, Calendar, Tag, AlertTriangle,
  BookOpen, Mic, Activity, Clock, Edit3, Loader2,
  XCircle, Shield, Star, FileText, CreditCard,
  MessageSquare, Briefcase, Globe, LayoutDashboard, LogIn,
  GraduationCap, Users, Settings, Newspaper, BookMarked,
  Monitor, Smartphone, Tablet, ChevronDown, ChevronRight,
  CheckCircle2, Eye,
} from "lucide-react";

// â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";
const fmtTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";
const fmtMins = (secs?: number | null) => {
  if (secs == null) return "-";
  const m = Math.round(secs / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
};
const fmtSecs = (secs?: number | null) => {
  if (secs == null) return "-";
  return secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}m ${secs % 60}s`;
};
const scoreColor = (s?: number | null) =>
  !s ? "text-slate-400" : s >= 80 ? "text-green-400" : s >= 60 ? "text-yellow-400" : "text-red-400";

const PLAN_COLORS: Record<string, string> = {
  Free:       "bg-slate-500/20 text-slate-400 border-slate-500/30",
  Standard:   "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Pro:        "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Enterprise: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};
const STATUS_COLORS: Record<string, string> = {
  ACTIVE:    "bg-green-500/20 text-green-400 border-green-500/30",
  INACTIVE:  "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  SUSPENDED: "bg-red-500/20 text-red-400 border-red-500/30",
};

// â”€â”€ sidebar sections â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SECTIONS = [
  { key: "overview",        label: "Overview",          Icon: LayoutDashboard },
  { key: "login",           label: "Login History",     Icon: LogIn },
  { key: "modules",         label: "Module Activity",   Icon: BookOpen },
  { key: "interview-guide", label: "Interview Guides",  Icon: FileText },
  { key: "gd-history",      label: "GD History",        Icon: Mic },
  { key: "payments",        label: "Payments",          Icon: CreditCard },
];

const MODULES = [
  { key: "hr",           label: "HR Interview",       Icon: Briefcase },
  { key: "gdCoach",      label: "GD Coach",           Icon: GraduationCap },
  { key: "gd",           label: "GD Agent",           Icon: Users },
  { key: "technical",    label: "Technical Mastery",  Icon: Settings },
  { key: "company",      label: "Company Tracks",     Icon: Building2 },
  { key: "daily",        label: "Daily Conversation", Icon: MessageSquare },
  { key: "latestTopics", label: "Latest Topics",      Icon: Newspaper },
  { key: "english",      label: "English Learning",   Icon: BookMarked },
  { key: "vocabulary",   label: "Vocabulary Booster", Icon: BookOpen },
  { key: "voice",        label: "Voice Practice",     Icon: Globe },
];

// â”€â”€ reusable components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ExpandSection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-700/50 rounded-xl overflow-hidden">
      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/40 hover:bg-slate-700/40 transition-colors text-left">
        <span className="font-medium text-sm text-slate-200">{title}</span>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full border border-slate-600 text-xs text-slate-400">{count}</span>
          {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </div>
      </button>
      {open && <div className="p-4 overflow-x-auto">{children}</div>}
    </div>
  );
}

function StatCard({ label, value, sub, color = "text-white" }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-sm font-medium text-slate-300 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function THead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="border-b border-slate-700/50">
        {cols.map((c) => <th key={c} className="text-left px-3 py-2.5 text-xs font-medium text-slate-400 whitespace-nowrap">{c}</th>)}
      </tr>
    </thead>
  );
}
function TR({ children }: { children: React.ReactNode }) {
  return <tr className="border-b border-slate-700/20 hover:bg-slate-800/30 transition-colors">{children}</tr>;
}
function TD({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 text-sm text-slate-300 whitespace-nowrap ${className}`}>{children}</td>;
}

// â”€â”€ main page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const [student, setStudent]       = useState<any>(null);
  const [data, setData]             = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [section, setSection]       = useState("overview");
  const [activeModule, setActiveModule] = useState("hr");

  useEffect(() => {
    const token = localStorage.getItem("college_token");
    if (!token) { setError("Not authenticated"); setLoading(false); return; }
    fetch(`/api/college/students/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load");
        return res.json();
      })
      .then((d) => { setStudent(d.student); setData(d.activity ?? null); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <CollegeProtectedLayout>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    </CollegeProtectedLayout>
  );

  if (error || !student) return (
    <CollegeProtectedLayout>
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <XCircle className="w-10 h-10 text-red-400" />
        <p className="text-slate-300">{error || "Student not found."}</p>
        <button onClick={() => router.back()} className="text-indigo-400 hover:text-indigo-300 text-sm underline">Go back</button>
      </div>
    </CollegeProtectedLayout>
  );

  const u   = data?.user ?? {};
  const mc  = u.moduleUsageCounts ?? {};
  const moduleData: Record<string, any> = {
    hr:           { sessions: data?.hrInterview?.sessions           ?? [], time: data?.hrInterview?.totalTimeSpent,      score: data?.hrInterview?.averageScore,      pct: data?.hrInterview?.completionPercentage },
    gdCoach:      { sessions: data?.gdCoach?.sessions               ?? [], time: data?.gdCoach?.totalTimeSpent,          pct: data?.gdCoach?.completionPercentage },
    gd:           { sessions: data?.gdAgent?.sessions               ?? [], time: data?.gdAgent?.totalTimeSpent,          score: data?.gdAgent?.averageScore },
    technical:    { sessions: data?.technicalMastery?.sessions       ?? [], time: data?.technicalMastery?.totalTimeSpent, score: data?.technicalMastery?.averageScore },
    company:      { sessions: data?.companyTracks?.sessions          ?? [], time: data?.companyTracks?.totalTimeSpent,    score: data?.companyTracks?.averageScore },
    daily:        { sessions: data?.dailyConversation?.sessions      ?? [], time: data?.dailyConversation?.totalTimeSpent,score: data?.dailyConversation?.averageScore },
    latestTopics: { sessions: data?.latestTopics?.sessions           ?? [], time: 0 },
    english:      { sessions: data?.englishLearning?.sessionList     ?? [], time: data?.englishLearning?.totalTimeSpent,  pct: data?.englishLearning?.completionPercentage },
    vocabulary:   { sessions: data?.vocabularyBooster?.sessions      ?? [], time: data?.vocabularyBooster?.totalTimeSpent },
    voice:        { sessions: data?.voicePractice?.sessions          ?? [], time: data?.voicePractice?.totalTimeSpent },
  };

  const allocatedPlan = student.customPlan ?? "Free";
  const validTill     = student.customPlanExpiresAt ? fmtDate(student.customPlanExpiresAt) : "-";

  // â”€â”€ Overview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderOverview = () => (
    <div className="space-y-5">
      {/* profile */}
      <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <User className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-white">{student.studentName}</h2>
              <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${STATUS_COLORS[student.status] ?? "bg-slate-700 text-slate-400"}`}>{student.status}</span>
              {!student.onboardedAt && <span className="px-2.5 py-0.5 text-xs font-medium rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400">Invite Pending</span>}
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${PLAN_COLORS[allocatedPlan] ?? ""}`}>{allocatedPlan}</span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{student.email}</span>
              {student.department && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{student.department}</span>}
              {student.year && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Year {student.year}</span>}
              {student.rollNumber && <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{student.rollNumber}</span>}
              {student.batch && <span className="flex items-center gap-1"><Star className="w-3 h-3" />{student.batch.batchName}</span>}
            </div>
            {student.onboardedAt && <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" />Activated {fmtDate(student.onboardedAt)}</p>}
          </div>
        </div>
        {student.tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {student.tags.map((t: string) => (
              <span key={t} className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-indigo-500/15 border border-indigo-500/30 text-indigo-300"><Tag className="w-3 h-3" />{t}</span>
            ))}
          </div>
        )}
        {student.warningFlags?.length > 0 && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
            <p className="text-xs font-medium text-red-400 flex items-center gap-1.5 mb-1.5"><AlertTriangle className="w-3.5 h-3.5" />Warning Flags</p>
            <div className="flex flex-wrap gap-2">{student.warningFlags.map((f: string) => <span key={f} className="px-2 py-0.5 text-xs bg-red-500/20 text-red-300 rounded-full">{f}</span>)}</div>
          </div>
        )}
        {student.adminNotes && (
          <div className="mt-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
            <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1"><FileText className="w-3.5 h-3.5" />Admin Notes</p>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{student.adminNotes}</p>
          </div>
        )}
      </div>

      {/* plan */}
      <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-indigo-400" />Plan &amp; Access</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Allocated Plan", val: <span className={`px-2.5 py-1 text-sm font-semibold rounded-full border ${PLAN_COLORS[allocatedPlan] ?? ""}`}>{allocatedPlan}</span> },
            { label: "Platform Plan",  val: <span className={`px-2.5 py-1 text-sm font-semibold rounded-full border ${PLAN_COLORS[u.plan] ?? "bg-slate-700 text-slate-300 border-slate-600"}`}>{u.plan ?? "-"}</span> },
            { label: "Valid Till",     val: <span className="text-sm font-semibold text-white">{validTill}</span> },
          ].map(({ label, val }) => (
            <div key={label} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/40">
              <p className="text-xs text-slate-400 mb-2">{label}</p>{val}
            </div>
          ))}
        </div>
      </div>

      {/* stats */}
      {data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Sessions"  value={u.totalSessions ?? 0} sub="All modules combined" />
            <StatCard label="Total Time"      value={fmtMins(u.totalTimeSpent)} sub="Across all modules" />
            <StatCard label="Avg Score"       value={u.avgScore ? `${u.avgScore.toFixed(1)}%` : "-"} color={scoreColor(u.avgScore)} />
            <StatCard label="Last Active"     value={fmtDate(u.lastActive)} sub={u.lastActive ? "Last login" : "Never logged in"} />
          </div>

          <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Account Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-sm">
              {([
                ["Name",          student.studentName],
                ["Email",         student.email],
                ["Department",    student.department || "-"],
                ["Year",          student.year ? `Year ${student.year}` : "-"],
                ["Roll No.",      student.rollNumber || "-"],
                ["Batch",         student.batch?.batchName || "-"],
                ["Platform Plan", u.plan || "-"],
                ["Renewal Date",  fmtDate(u.renewalDate)],
                ["Joined",        fmtDate(u.createdAt)],
              ] as [string, any][]).map(([k, v]) => (
                <div key={k}>
                  <div className="text-slate-500 text-xs">{k}</div>
                  <div className="font-medium text-slate-200 mt-0.5 break-all">{String(v)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Module Usage Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "HR Interview",   key: "hr",       sessions: data.hrInterview?.totalSessions || 0,       pct: data.hrInterview?.completionPercentage },
                { label: "GD Coach",       key: "gdCoach",  sessions: data.gdCoach?.totalSessions || 0,           pct: data.gdCoach?.completionPercentage },
                { label: "GD Agent",       key: "gd",       sessions: data.gdAgent?.totalSessions || 0 },
                { label: "Technical",      key: "technical",sessions: data.technicalMastery?.totalSessions || 0 },
                { label: "Company Tracks", key: "company",  sessions: data.companyTracks?.totalSessions || 0 },
                { label: "Daily Conv.",    key: "daily",    sessions: data.dailyConversation?.totalSessions || 0 },
                { label: "English",        key: "english",  sessions: data.englishLearning?.sessions || 0,        pct: data.englishLearning?.completionPercentage },
                { label: "Interview Guide",key: "interviewGuide", sessions: data.interviewGuides?.length || 0 },
              ].map((m) => (
                <div key={m.label} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/40">
                  <div className="font-semibold text-xs mb-2 text-white">{m.label}</div>
                  <div className="text-xs text-slate-400 space-y-0.5">
                    <div className="flex justify-between"><span>Times opened</span><span className="text-white font-medium">{mc[m.key] ?? 0}</span></div>
                    <div className="flex justify-between"><span>Sessions</span><span className="text-white font-medium">{m.sessions}</span></div>
                  </div>
                  {m.pct !== undefined && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, m.pct ?? 0)}%` }} />
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{(m.pct ?? 0).toFixed(0)}% complete</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-10 text-center">
          <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No activity data yet - student hasn&apos;t started any sessions.</p>
        </div>
      )}
    </div>
  );

  // â”€â”€ Login History â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderLoginHistory = () => {
    const logs = data?.loginHistory ?? [];
    return (
      <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Full Login History ({logs.length} records)</h3>
        {logs.length === 0 ? <p className="text-slate-500 text-sm">No login records found.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <THead cols={["Login Time","Logout Time","Duration","Device","OS","Browser","IP / Location","Status"]} />
              <tbody>
                {logs.map((l: any) => (
                  <TR key={l.id}>
                    <TD>{fmtTime(l.loginTime)}</TD>
                    <TD>{fmtTime(l.logoutTime)}</TD>
                    <TD>{fmtSecs(l.sessionDuration)}</TD>
                    <TD><div className="flex items-center gap-1">{l.deviceType==="Mobile"?<Smartphone className="w-3 h-3"/>:l.deviceType==="Tablet"?<Tablet className="w-3 h-3"/>:<Monitor className="w-3 h-3"/>}{l.deviceType||"-"}</div></TD>
                    <TD>{l.os||"-"}</TD>
                    <TD>{l.browser||"-"}</TD>
                    <TD>{l.location||l.ip||"-"}</TD>
                    <TD><span className={`px-2 py-0.5 text-xs rounded-full border ${l.status==="success"?"bg-green-500/15 text-green-400 border-green-500/30":"bg-red-500/15 text-red-400 border-red-500/30"}`}>{l.status||"-"}</span></TD>
                  </TR>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // â”€â”€ Module Activity â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderModules = () => {
    const modInfo = MODULES.find((m) => m.key === activeModule)!;
    const md      = moduleData[activeModule] ?? {};
    const sessions: any[] = md.sessions ?? [];
    const ModIcon = modInfo.Icon;
    return (
      <div className="flex gap-4">
        <div className="w-48 flex-shrink-0 space-y-0.5">
          {MODULES.map((m) => {
            const d = moduleData[m.key] ?? {};
            const MIcon = m.Icon;
            return (
              <button key={m.key} onClick={() => setActiveModule(m.key)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2 ${activeModule===m.key?"bg-indigo-600/20 text-indigo-300 border border-indigo-500/30":"text-slate-400 hover:text-white hover:bg-slate-800/60"}`}>
                <MIcon className="w-4 h-4 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="truncate font-medium">{m.label}</div>
                  <div className="text-[10px] text-slate-500">{d.sessions?.length||0} sessions</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center gap-2">
            <ModIcon className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">{modInfo.label}</h2>
            <span className="px-2 py-0.5 text-xs rounded-full border border-slate-600 text-slate-400">{sessions.length} sessions</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
              <div className="text-xs text-slate-400">Times Opened</div>
              <div className="font-bold text-2xl mt-0.5 text-white">{mc[activeModule]??sessions.length}</div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
              <div className="text-xs text-slate-400">Total Time</div>
              <div className="font-bold text-2xl mt-0.5 text-white">{fmtMins(md.time)}</div>
            </div>
            {md.score !== undefined && (
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                <div className="text-xs text-slate-400">Avg Score</div>
                <div className={`font-bold text-2xl mt-0.5 ${scoreColor(md.score)}`}>{md.score?md.score.toFixed(1):"-"}</div>
              </div>
            )}
            {md.pct !== undefined && (
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                <div className="text-xs text-slate-400">Completion</div>
                <div className="font-bold text-2xl mt-0.5 text-white">{(md.pct??0).toFixed(0)}%</div>
                <div className="h-1.5 bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{width:`${Math.min(100,md.pct??0)}%`}}/>
                </div>
              </div>
            )}
          </div>

          {activeModule==="hr" && data?.hrInterview?.hrProgress?.length>0 && (
            <ExpandSection title="HR Coach Steps Progress" count={data.hrInterview.hrProgress.length}>
              <table className="w-full text-sm"><THead cols={["Step ID","Status","Score","Completed At"]}/>
                <tbody>{data.hrInterview.hrProgress.map((h:any)=>(
                  <TR key={h.lessonId}><TD className="font-mono text-xs">{h.lessonId}</TD><TD><div className="flex items-center gap-1">{h.isCompleted?<CheckCircle2 className="w-3.5 h-3.5 text-green-400"/>:<XCircle className="w-3.5 h-3.5 text-slate-500"/>}<span>{h.isCompleted?"Done":"Pending"}</span></div></TD><TD className={scoreColor(h.score)}>{h.score??"-"}</TD><TD>{fmtDate(h.completedAt)}</TD></TR>
                ))}</tbody>
              </table>
            </ExpandSection>
          )}

          {activeModule==="gdCoach" && data?.gdCoach?.progress?.length>0 && (
            <ExpandSection title="GD Coach Progress Steps" count={data.gdCoach.progress.length}>
              <table className="w-full text-sm"><THead cols={["Step ID","Status","Score","Completed At"]}/>
                <tbody>{data.gdCoach.progress.map((h:any)=>(
                  <TR key={h.lessonId}><TD className="font-mono text-xs">{h.lessonId}</TD><TD><div className="flex items-center gap-1">{h.isCompleted?<CheckCircle2 className="w-3.5 h-3.5 text-green-400"/>:<XCircle className="w-3.5 h-3.5 text-slate-500"/>}<span>{h.isCompleted?"Done":"Pending"}</span></div></TD><TD className={scoreColor(h.score)}>{h.score??"-"}</TD><TD>{fmtDate(h.completedAt)}</TD></TR>
                ))}</tbody>
              </table>
            </ExpandSection>
          )}

          {activeModule==="english" && data?.englishLearning?.lessons?.length>0 && (
            <ExpandSection title="Lesson Progress" count={data.englishLearning.lessons.length}>
              <table className="w-full text-sm"><THead cols={["Lesson ID","Status","Score","Completed At"]}/>
                <tbody>{data.englishLearning.lessons.map((l:any)=>(
                  <TR key={l.lessonId}><TD className="font-mono text-xs">{l.lessonId}</TD><TD><div className="flex items-center gap-1">{l.isCompleted?<CheckCircle2 className="w-3.5 h-3.5 text-green-400"/>:<XCircle className="w-3.5 h-3.5 text-slate-500"/>}<span>{l.isCompleted?"Done":"Pending"}</span></div></TD><TD className={scoreColor(l.score)}>{l.score??"-"}</TD><TD>{fmtDate(l.completedAt)}</TD></TR>
                ))}</tbody>
              </table>
            </ExpandSection>
          )}

          <ExpandSection title={`${modInfo.label} Sessions`} count={sessions.length}>
            {sessions.length===0?<p className="text-slate-500 text-sm">No sessions recorded yet.</p>:(
              <table className="w-full text-sm">
                <THead cols={["Date",...(["hr","company"].includes(activeModule)?["Company"]:[]),...(["hr","technical","company"].includes(activeModule)?["Role"]:[]),"Duration",...(!["vocabulary","voice","latestTopics"].includes(activeModule)?["Score"]:[]),"Status"]}/>
                <tbody>
                  {sessions.map((s:any)=>(
                    <TR key={s.id}>
                      <TD>{fmtDate(s.startTime)}</TD>
                      {["hr","company"].includes(activeModule)&&<TD>{s.targetCompany||"-"}</TD>}
                      {["hr","technical","company"].includes(activeModule)&&<TD>{s.role||"-"}</TD>}
                      <TD>{fmtMins(s.duration)}</TD>
                      {!["vocabulary","voice","latestTopics"].includes(activeModule)&&<TD className={scoreColor(s.aggregateScore)}>{s.aggregateScore?.toFixed(1)??"-"}</TD>}
                      <TD><span className={`px-2 py-0.5 text-xs rounded-full border ${s.status==="PASS"||s.status==="COMPLETED"?"bg-green-500/15 text-green-400 border-green-500/30":s.status==="FAIL"?"bg-red-500/15 text-red-400 border-red-500/30":"bg-slate-700 text-slate-400 border-slate-600"}`}>{s.status||"Completed"}</span></TD>
                    </TR>
                  ))}
                </tbody>
              </table>
            )}
          </ExpandSection>
        </div>
      </div>
    );
  };

  // â”€â”€ Interview Guides â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderInterviewGuides = () => {
    const guides = data?.interviewGuides ?? [];
    return (
      <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Interview Guides Generated ({guides.length})</h3>
        {guides.length===0?<p className="text-slate-500 text-sm">No interview guides generated yet.</p>:(
          <div className="space-y-3">
            {guides.map((g:any,i:number)=>(
              <div key={g.id} className="border border-slate-700/50 rounded-xl p-4 bg-slate-800/40">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs text-slate-500 font-mono">#{i+1}</span>
                      {g.experienceLevel&&<span className="px-2 py-0.5 text-xs rounded-full border border-slate-600 text-slate-300">{g.experienceLevel}</span>}
                      {g.communicationLevel&&<span className="px-2 py-0.5 text-xs rounded-full bg-slate-700 text-slate-300">{g.communicationLevel}</span>}
                    </div>
                    <div className="font-semibold text-white">{g.targetRole}</div>
                    {g.targetCompany&&<div className="text-sm text-slate-400 mt-0.5 flex items-center gap-1"><Building2 className="w-3.5 h-3.5"/>{g.targetCompany}</div>}
                    {g.jobDescription&&<div className="text-xs text-slate-500 mt-1.5 line-clamp-2">{g.jobDescription}</div>}
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-2"><Clock className="w-3 h-3"/>Generated on {fmtDate(g.createdAt)}</div>
                  </div>
                  {g.pdfUrl&&<a href={g.pdfUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/60 border border-slate-600 text-slate-300 hover:text-white text-xs transition-all"><Eye className="w-3.5 h-3.5"/>View PDF</a>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // â”€â”€ GD History â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderGDHistory = () => {
    const ghList = data?.gdAgent?.gdHistory ?? [];
    return (
      <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">GD Session History ({ghList.length})</h3>
        {ghList.length===0?<p className="text-slate-500 text-sm">No GD sessions completed yet.</p>:(
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <THead cols={["Topic","Category","Role","Duration","Overall","Comm.","Confidence","Grammar","Leadership","Date"]}/>
              <tbody>
                {ghList.map((h:any)=>(
                  <TR key={h.id}>
                    <TD className="max-w-[160px]"><div className="truncate" title={h.topic}>{h.topic}</div></TD>
                    <TD><span className="px-2 py-0.5 text-xs rounded-full border border-slate-600 text-slate-300">{h.topicCategory||"-"}</span></TD>
                    <TD><span className="px-2 py-0.5 text-xs rounded-full bg-slate-700 text-slate-300">{h.role||"-"}</span></TD>
                    <TD>{fmtSecs(h.duration)}</TD>
                    <TD className={`font-semibold ${scoreColor(h.overallScore)}`}>{h.overallScore?.toFixed(1)??"-"}</TD>
                    <TD className={scoreColor(h.communicationScore)}>{h.communicationScore?.toFixed(1)??"-"}</TD>
                    <TD className={scoreColor(h.confidenceScore)}>{h.confidenceScore?.toFixed(1)??"-"}</TD>
                    <TD className={scoreColor(h.grammarScore)}>{h.grammarScore?.toFixed(1)??"-"}</TD>
                    <TD className={scoreColor(h.leadershipScore)}>{h.leadershipScore?.toFixed(1)??"-"}</TD>
                    <TD>{fmtDate(h.createdAt)}</TD>
                  </TR>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // â”€â”€ Payments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderPayments = () => {
    const payments = data?.payments ?? [];
    return (
      <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Payment History ({payments.length})</h3>
        {payments.length===0?<p className="text-slate-500 text-sm">No payment records found.</p>:(
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <THead cols={["Date","Plan","Cycle","Original","Discount","Final Paid","Method","Coupon","Status","Invoice"]}/>
              <tbody>
                {payments.map((p:any)=>(
                  <TR key={p.id}>
                    <TD>{fmtDate(p.date)}</TD>
                    <TD><span className="px-2 py-0.5 text-xs rounded-full border border-slate-600 text-slate-300">{p.plan||"-"}</span></TD>
                    <TD className="capitalize">{p.billingCycle||"-"}</TD>
                    <TD>Rs.{p.originalAmount??"-"}</TD>
                    <TD className="text-green-400">{p.discountAmount?`-Rs.${p.discountAmount}`:"-"}</TD>
                    <TD className="font-semibold text-white">Rs.{p.finalAmount}</TD>
                    <TD className="capitalize">{p.paymentMethod||"-"}</TD>
                    <TD>{p.couponUsed?<span className="font-mono text-xs bg-slate-700 px-2 py-0.5 rounded">{p.couponUsed}</span>:"-"}</TD>
                    <TD><span className={`px-2 py-0.5 text-xs rounded-full border capitalize ${p.status==="paid"?"bg-green-500/15 text-green-400 border-green-500/30":p.status==="failed"?"bg-red-500/15 text-red-400 border-red-500/30":"bg-slate-700 text-slate-400 border-slate-600"}`}>{p.status}</span></TD>
                    <TD>{p.receiptUrl?<a href={p.receiptUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300"><Eye className="w-3 h-3"/>{p.invoiceNumber||"View"}</a>:<span className="text-slate-500 text-xs">{p.invoiceNumber||"-"}</span>}</TD>
                  </TR>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // â”€â”€ layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <CollegeProtectedLayout>
      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="w-52 flex-shrink-0 sticky top-16 self-start h-[calc(100vh-4rem)] overflow-y-auto border-r border-slate-700/50 bg-[#0d1117]/60">
          <div className="px-4 py-3 border-b border-slate-700/50">
            <button onClick={() => router.back()} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Students
            </button>
            <div className="font-semibold text-sm text-white truncate">{student.studentName}</div>
            <div className="text-xs text-slate-500 truncate">{student.email}</div>
            <div className="flex gap-1 mt-1.5 flex-wrap">
              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${PLAN_COLORS[allocatedPlan]??""}`}>{allocatedPlan}</span>
              <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${STATUS_COLORS[student.status]??""}`}>{student.status}</span>
            </div>
          </div>
          <nav className="p-2 space-y-0.5 py-3">
            {SECTIONS.map(({key,label,Icon:SIcon})=>(
              <button key={key} onClick={()=>setSection(key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${section===key?"bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-medium":"text-slate-400 hover:text-white hover:bg-slate-800/60"}`}>
                <SIcon className="w-4 h-4 flex-shrink-0"/><span className="truncate">{label}</span>
              </button>
            ))}
            <div className="pt-2 border-t border-slate-700/50 mt-2">
              <button onClick={()=>router.push(`/college/students/${id}/edit`)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-amber-300 hover:bg-amber-400/10 transition-all text-left">
                <Edit3 className="w-4 h-4 flex-shrink-0"/><span>Edit Student</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 p-5 overflow-auto min-w-0">
          {section==="overview"        && renderOverview()}
          {section==="login"           && renderLoginHistory()}
          {section==="modules"         && renderModules()}
          {section==="interview-guide" && renderInterviewGuides()}
          {section==="gd-history"      && renderGDHistory()}
          {section==="payments"        && renderPayments()}
        </div>
      </div>
    </CollegeProtectedLayout>
  );
}

