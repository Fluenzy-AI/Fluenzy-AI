"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Download, Eye, Monitor, Smartphone, Tablet, Globe, Clock,
  ChevronDown, ChevronRight, LayoutDashboard, LogIn, BookOpen,
  FileText, Users, CreditCard, Building2, Mic, GraduationCap,
  MessageSquare, Newspaper, BookMarked, Briefcase, Settings,
  CheckCircle2, XCircle,
} from "lucide-react";

// helpers
const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";
const fmtTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";
const fmtMins = (mins?: number | null) =>
  mins == null ? "-" : mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
const fmtSecs = (secs?: number | null) =>
  secs == null ? "-" : secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}m ${secs % 60}s`;
const scoreColor = (s?: number | null) =>
  !s ? "text-slate-400" : s >= 80 ? "text-green-400" : s >= 60 ? "text-yellow-400" : "text-red-400";

// sidebar navigation sections
const SECTIONS = [
  { key: "overview",        label: "Overview",          Icon: LayoutDashboard },
  { key: "login",           label: "Login History",     Icon: LogIn },
  { key: "modules",         label: "Module Activity",   Icon: BookOpen },
  { key: "interview-guide", label: "Interview Guides",  Icon: FileText },
  { key: "gd-history",      label: "GD History",        Icon: Mic },
  { key: "payments",        label: "Payments",          Icon: CreditCard },
];

// module list
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
  { key: "voice",        label: "Voice Practice",     Icon: Mic },
];

// collapsible section
function ExpandableSection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors text-left"
      >
        <span className="font-medium text-sm">{title}</span>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{count}</Badge>
          {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </div>
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

// stat card
function StatCard({ label, value, sub, color = "" }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <Card className="bg-slate-900/60 border-white/10">
      <CardContent className="pt-5 pb-4">
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        <div className="text-sm font-medium mt-0.5">{label}</div>
        {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

// main page
export default function UserDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState("overview");
  const [activeModule, setActiveModule] = useState("hr");

  useEffect(() => {
    if (status === "loading") return;
    if (!session || (session.user.role as any) !== "SUPER_ADMIN") {
      router.push("/");
      return;
    }
    fetch(`/api/admin/users/${userId}/activity`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session, status, userId, router]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading user details...</p>
        </div>
      </div>
    );
  }
  if (!data || data.error) return <div className="p-8 text-red-400">User not found</div>;

  const u = data.user;
  const mc = u.moduleUsageCounts || {};

  const moduleData: Record<string, any> = {
    hr:           { sessions: data.hrInterview?.sessions || [],         time: data.hrInterview?.totalTimeSpent,       score: data.hrInterview?.averageScore,       pct: data.hrInterview?.completionPercentage },
    gdCoach:      { sessions: data.gdCoach?.sessions || [],             time: data.gdCoach?.totalTimeSpent,           pct: data.gdCoach?.completionPercentage },
    gd:           { sessions: data.gdAgent?.sessions || [],             time: data.gdAgent?.totalTimeSpent,           score: data.gdAgent?.averageScore },
    technical:    { sessions: data.technicalMastery?.sessions || [],    time: data.technicalMastery?.totalTimeSpent,  score: data.technicalMastery?.averageScore },
    company:      { sessions: data.companyTracks?.sessions || [],       time: data.companyTracks?.totalTimeSpent,     score: data.companyTracks?.averageScore },
    daily:        { sessions: data.dailyConversation?.sessions || [],   time: data.dailyConversation?.totalTimeSpent, score: data.dailyConversation?.averageScore },
    latestTopics: { sessions: data.latestTopics?.sessions || [],        time: 0 },
    english:      { sessions: data.englishLearning?.sessionList || [],  time: data.englishLearning?.totalTimeSpent,   pct: data.englishLearning?.completionPercentage },
    vocabulary:   { sessions: data.vocabularyBooster?.sessions || [],   time: data.vocabularyBooster?.totalTimeSpent },
    voice:        { sessions: data.voicePractice?.sessions || [],       time: data.voicePractice?.totalTimeSpent },
  };

  // Overview
  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Sessions"   value={u.totalSessions}                      sub="All modules combined" />
        <StatCard label="Total Time Spent" value={fmtMins(u.totalTimeSpent)}            sub="Across all modules" />
        <StatCard label="Last Active"      value={fmtDate(u.lastActive)}               sub={u.lastActive ? "Last login date" : "Never logged in"} />
        <StatCard label="Interview Guides" value={data.interviewGuides?.length || 0}   sub="Generated guides" />
      </div>

      <Card className="bg-slate-900/60 border-white/10">
        <CardHeader><CardTitle className="text-base">Account Details</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-sm">
            {([
              ["Name", u.name], ["Email", u.email], ["Plan", u.plan], ["Role", u.role],
              ["Joined", fmtDate(u.createdAt)], ["Renewal Date", fmtDate(u.renewalDate)],
              ["Billing Cycle", u.billingCycle || "-"], ["Account Status", u.disabled ? "Disabled" : "Active"],
              ["Companies Practised", u.uniqueCompanies?.length || 0],
            ] as [string, any][]).map(([k, v]) => (
              <div key={k}>
                <div className="text-slate-500 text-xs">{k}</div>
                <div className={`font-medium mt-0.5 break-all ${k === "Account Status" ? (u.disabled ? "text-red-400" : "text-green-400") : ""}`}>{String(v)}</div>
              </div>
            ))}
          </div>
          {u.uniqueCompanies?.length > 0 && (
            <div className="mt-4">
              <div className="text-xs text-slate-500 mb-2">Companies practised for:</div>
              <div className="flex flex-wrap gap-1.5">
                {u.uniqueCompanies.map((c: string) => (
                  <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900/60 border-white/10">
        <CardHeader><CardTitle className="text-base">Module Usage Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "HR Interview",      usedKey: "hr",             sessions: data.hrInterview?.totalSessions || 0,       pctVal: data.hrInterview?.completionPercentage },
              { label: "GD Coach",          usedKey: "gdCoach",        sessions: data.gdCoach?.totalSessions || 0,            pctVal: data.gdCoach?.completionPercentage },
              { label: "GD Agent",          usedKey: "gd",             sessions: data.gdAgent?.totalSessions || 0 },
              { label: "Technical",         usedKey: "technical",      sessions: data.technicalMastery?.totalSessions || 0 },
              { label: "Company Tracks",    usedKey: "company",        sessions: data.companyTracks?.totalSessions || 0 },
              { label: "Daily Conv.",       usedKey: "daily",          sessions: data.dailyConversation?.totalSessions || 0 },
              { label: "English Learning",  usedKey: "english",        sessions: data.englishLearning?.sessions || 0,         pctVal: data.englishLearning?.completionPercentage },
              { label: "Interview Guide",   usedKey: "interviewGuide", sessions: data.interviewGuides?.length || 0 },
            ].map((m) => (
              <div key={m.label} className="bg-white/5 rounded-lg p-3 border border-white/10 text-sm">
                <div className="font-semibold text-xs mb-2 text-white">{m.label}</div>
                <div className="text-xs text-slate-400 space-y-0.5">
                  <div className="flex justify-between"><span>Times opened</span><span className="text-white font-medium">{mc[m.usedKey] ?? 0}</span></div>
                  <div className="flex justify-between"><span>Sessions</span><span className="text-white font-medium">{m.sessions}</span></div>
                </div>
                {m.pctVal !== undefined && (
                  <div className="mt-2">
                    <Progress value={m.pctVal} className="h-1" />
                    <div className="text-[10px] text-slate-500 mt-0.5">{(m.pctVal ?? 0).toFixed(0)}% complete</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {data.resume && (
        <Card className="bg-slate-900/60 border-white/10">
          <CardHeader><CardTitle className="text-base">Resume</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{data.resume.fileName}</div>
                <div className="text-xs text-slate-500 mt-0.5">Uploaded {fmtDate(data.resume.uploadedAt)}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a href={data.resume.fileUrl} target="_blank" rel="noreferrer"><Eye className="w-4 h-4 mr-1" />View</a>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={data.resume.fileUrl} download><Download className="w-4 h-4 mr-1" />Download</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {data.loginHistory?.length > 0 && (
        <Card className="bg-slate-900/60 border-white/10">
          <CardHeader><CardTitle className="text-base">Recent Logins (Last 3)</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date and Time</TableHead><TableHead>Device</TableHead>
                  <TableHead>Browser / OS</TableHead><TableHead>Location</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.loginHistory.slice(0, 3).map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell>{fmtTime(l.loginTime)}</TableCell>
                    <TableCell>{l.deviceType || "-"}</TableCell>
                    <TableCell>{[l.browser, l.os].filter(Boolean).join(" / ") || "-"}</TableCell>
                    <TableCell>{l.location || l.ip || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={l.status === "success" ? "default" : "destructive"} className="text-xs">{l.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Login History
  const renderLoginHistory = () => (
    <Card className="bg-slate-900/60 border-white/10">
      <CardHeader><CardTitle className="text-base">Full Login History ({data.loginHistory?.length || 0} records)</CardTitle></CardHeader>
      <CardContent>
        {!data.loginHistory || data.loginHistory.length === 0 ? (
          <p className="text-slate-500 text-sm">No login records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Login Time</TableHead><TableHead>Logout Time</TableHead><TableHead>Duration</TableHead>
                  <TableHead>Device</TableHead><TableHead>OS</TableHead><TableHead>Browser</TableHead>
                  <TableHead>IP / Location</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.loginHistory.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="whitespace-nowrap">{fmtTime(l.loginTime)}</TableCell>
                    <TableCell className="whitespace-nowrap">{fmtTime(l.logoutTime)}</TableCell>
                    <TableCell>{fmtSecs(l.sessionDuration)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {l.deviceType === "Mobile" ? <Smartphone className="w-3 h-3" /> : l.deviceType === "Tablet" ? <Tablet className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                        {l.deviceType || "-"}
                      </div>
                    </TableCell>
                    <TableCell>{l.os || "-"}</TableCell>
                    <TableCell>{l.browser || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs">
                        <Globe className="w-3 h-3 text-slate-500" />{l.location || l.ip || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={l.status === "success" ? "default" : "destructive"} className="text-xs">{l.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Module Activity
  const renderModules = () => {
    const modInfo = MODULES.find((m) => m.key === activeModule)!;
    const md = moduleData[activeModule] || {};
    const sessions: any[] = md.sessions || [];
    const ModIcon = modInfo.Icon;
    return (
      <div className="flex gap-5">
        <div className="w-52 flex-shrink-0 space-y-0.5">
          {MODULES.map((m) => {
            const d = moduleData[m.key] || {};
            const MIcon = m.Icon;
            return (
              <button
                key={m.key}
                onClick={() => setActiveModule(m.key)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2 ${activeModule === m.key ? "bg-violet-600/20 text-violet-300 border border-violet-500/30" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
              >
                <MIcon className="w-4 h-4 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="truncate font-medium">{m.label}</div>
                  <div className="text-[10px] text-slate-500">{d.sessions?.length || 0} sessions</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <ModIcon className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-bold">{modInfo.label}</h2>
            <Badge variant="outline">{sessions.length} sessions</Badge>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-sm">
              <div className="text-slate-400 text-xs">Times Opened</div>
              <div className="font-bold text-xl mt-0.5">{mc[activeModule] ?? sessions.length}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-sm">
              <div className="text-slate-400 text-xs">Total Time</div>
              <div className="font-bold text-xl mt-0.5">{fmtMins(md.time)}</div>
            </div>
            {md.score !== undefined && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-sm">
                <div className="text-slate-400 text-xs">Avg Score</div>
                <div className={`font-bold text-xl mt-0.5 ${scoreColor(md.score)}`}>{md.score ? md.score.toFixed(1) : "-"}</div>
              </div>
            )}
            {md.pct !== undefined && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-sm">
                <div className="text-slate-400 text-xs">Completion</div>
                <div className="font-bold text-xl mt-0.5">{(md.pct ?? 0).toFixed(0)}%</div>
                <Progress value={md.pct} className="h-1 mt-1" />
              </div>
            )}
          </div>

          {activeModule === "hr" && data.hrInterview?.hrProgress?.length > 0 && (
            <ExpandableSection title="HR Coach Steps Progress" count={data.hrInterview.hrProgress.length}>
              <Table>
                <TableHeader><TableRow><TableHead>Step ID</TableHead><TableHead>Status</TableHead><TableHead>Score</TableHead><TableHead>Completed At</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data.hrInterview.hrProgress.map((h: any) => (
                    <TableRow key={h.lessonId}>
                      <TableCell className="font-mono text-xs">{h.lessonId}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {h.isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-500" />}
                          <span className="text-xs">{h.isCompleted ? "Done" : "Pending"}</span>
                        </div>
                      </TableCell>
                      <TableCell className={scoreColor(h.score)}>{h.score ?? "-"}</TableCell>
                      <TableCell>{fmtDate(h.completedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ExpandableSection>
          )}

          {activeModule === "gdCoach" && data.gdCoach?.progress?.length > 0 && (
            <ExpandableSection title="GD Coach Progress Steps" count={data.gdCoach.progress.length}>
              <Table>
                <TableHeader><TableRow><TableHead>Step ID</TableHead><TableHead>Status</TableHead><TableHead>Score</TableHead><TableHead>Completed At</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data.gdCoach.progress.map((h: any) => (
                    <TableRow key={h.lessonId}>
                      <TableCell className="font-mono text-xs">{h.lessonId}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {h.isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-500" />}
                          <span className="text-xs">{h.isCompleted ? "Done" : "Pending"}</span>
                        </div>
                      </TableCell>
                      <TableCell className={scoreColor(h.score)}>{h.score ?? "-"}</TableCell>
                      <TableCell>{fmtDate(h.completedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ExpandableSection>
          )}

          {activeModule === "english" && data.englishLearning?.lessons?.length > 0 && (
            <ExpandableSection title="Lesson Progress" count={data.englishLearning.lessons.length}>
              <Table>
                <TableHeader><TableRow><TableHead>Lesson ID</TableHead><TableHead>Status</TableHead><TableHead>Score</TableHead><TableHead>Completed At</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data.englishLearning.lessons.map((l: any) => (
                    <TableRow key={l.lessonId}>
                      <TableCell className="font-mono text-xs">{l.lessonId}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {l.isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-500" />}
                          <span className="text-xs">{l.isCompleted ? "Done" : "Pending"}</span>
                        </div>
                      </TableCell>
                      <TableCell className={scoreColor(l.score)}>{l.score ?? "-"}</TableCell>
                      <TableCell>{fmtDate(l.completedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ExpandableSection>
          )}

          <ExpandableSection title={`${modInfo.label} Sessions`} count={sessions.length}>
            {sessions.length === 0 ? (
              <p className="text-slate-500 text-sm">No sessions recorded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    {["hr", "company"].includes(activeModule) && <TableHead>Company</TableHead>}
                    {["hr", "technical", "company"].includes(activeModule) && <TableHead>Role</TableHead>}
                    <TableHead>Duration</TableHead>
                    {!["vocabulary", "voice", "latestTopics"].includes(activeModule) && <TableHead>Score</TableHead>}
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="whitespace-nowrap">{fmtDate(s.startTime)}</TableCell>
                      {["hr", "company"].includes(activeModule) && <TableCell>{s.targetCompany || "-"}</TableCell>}
                      {["hr", "technical", "company"].includes(activeModule) && <TableCell>{s.role || "-"}</TableCell>}
                      <TableCell>{fmtMins(s.duration)}</TableCell>
                      {!["vocabulary", "voice", "latestTopics"].includes(activeModule) && (
                        <TableCell className={scoreColor(s.aggregateScore)}>
                          {s.aggregateScore ? s.aggregateScore.toFixed(1) : "-"}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge
                          variant={s.status === "PASS" ? "default" : s.status === "FAIL" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {s.status || "Completed"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ExpandableSection>
        </div>
      </div>
    );
  };

  // Interview Guides
  const renderInterviewGuides = () => (
    <Card className="bg-slate-900/60 border-white/10">
      <CardHeader><CardTitle className="text-base">Interview Guides Generated ({data.interviewGuides?.length || 0})</CardTitle></CardHeader>
      <CardContent>
        {!data.interviewGuides || data.interviewGuides.length === 0 ? (
          <p className="text-slate-500 text-sm">No interview guides generated yet.</p>
        ) : (
          <div className="space-y-3">
            {data.interviewGuides.map((g: any, i: number) => (
              <div key={g.id} className="border border-white/10 rounded-xl p-4 bg-white/5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs text-slate-500 font-mono">#{i + 1}</span>
                      <Badge variant="outline" className="text-xs">{g.experienceLevel}</Badge>
                      <Badge variant="secondary" className="text-xs">{g.communicationLevel}</Badge>
                    </div>
                    <div className="font-semibold">{g.targetRole}</div>
                    {g.targetCompany && (
                      <div className="text-sm text-slate-400 mt-0.5 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" /> {g.targetCompany}
                      </div>
                    )}
                    {g.jobDescription && (
                      <div className="text-xs text-slate-500 mt-1.5 line-clamp-2">{g.jobDescription}</div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                      <Clock className="w-3 h-3" /> Generated on {fmtDate(g.createdAt)}
                    </div>
                  </div>
                  {g.pdfUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={g.pdfUrl} target="_blank" rel="noreferrer"><Eye className="w-4 h-4 mr-1" />View PDF</a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // GD History
  const renderGDHistory = () => {
    const ghList = data.gdAgent?.gdHistory || [];
    return (
      <Card className="bg-slate-900/60 border-white/10">
        <CardHeader><CardTitle className="text-base">GD Session History ({ghList.length})</CardTitle></CardHeader>
        <CardContent>
          {ghList.length === 0 ? (
            <p className="text-slate-500 text-sm">No GD sessions completed yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Topic</TableHead><TableHead>Category</TableHead><TableHead>Role</TableHead>
                    <TableHead>Duration</TableHead><TableHead>Overall</TableHead><TableHead>Comm.</TableHead>
                    <TableHead>Confidence</TableHead><TableHead>Grammar</TableHead><TableHead>Leadership</TableHead>
                    <TableHead>Date</TableHead><TableHead>Highlights</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ghList.map((h: any) => (
                    <TableRow key={h.id}>
                      <TableCell className="max-w-[180px]">
                        <div className="truncate text-sm" title={h.topic}>{h.topic}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{h.topicCategory}</Badge></TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{h.role}</Badge></TableCell>
                      <TableCell>{fmtSecs(h.duration)}</TableCell>
                      <TableCell className={`font-semibold ${scoreColor(h.overallScore)}`}>{h.overallScore?.toFixed(1) ?? "-"}</TableCell>
                      <TableCell className={scoreColor(h.communicationScore)}>{h.communicationScore?.toFixed(1) ?? "-"}</TableCell>
                      <TableCell className={scoreColor(h.confidenceScore)}>{h.confidenceScore?.toFixed(1) ?? "-"}</TableCell>
                      <TableCell className={scoreColor(h.grammarScore)}>{h.grammarScore?.toFixed(1) ?? "-"}</TableCell>
                      <TableCell className={scoreColor(h.leadershipScore)}>{h.leadershipScore?.toFixed(1) ?? "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{fmtDate(h.createdAt)}</TableCell>
                      <TableCell>
                        <div className="text-xs space-y-0.5 max-w-[160px]">
                          {h.strengths?.slice(0, 2).map((s: string, idx: number) => (
                            <div key={idx} className="text-green-400 truncate">+ {s}</div>
                          ))}
                          {h.improvements?.slice(0, 1).map((s: string, idx: number) => (
                            <div key={idx} className="text-amber-400 truncate">^ {s}</div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Payments
  const renderPayments = () => (
    <Card className="bg-slate-900/60 border-white/10">
      <CardHeader><CardTitle className="text-base">Payment History ({data.payments?.length || 0})</CardTitle></CardHeader>
      <CardContent>
        {!data.payments || data.payments.length === 0 ? (
          <p className="text-slate-500 text-sm">No payment records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead><TableHead>Plan</TableHead><TableHead>Cycle</TableHead>
                  <TableHead>Original</TableHead><TableHead>Discount</TableHead><TableHead>Final Paid</TableHead>
                  <TableHead>Method</TableHead><TableHead>Coupon</TableHead><TableHead>Status</TableHead><TableHead>Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.payments.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="whitespace-nowrap">{fmtDate(p.date)}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{p.plan || "-"}</Badge></TableCell>
                    <TableCell className="capitalize">{p.billingCycle || "-"}</TableCell>
                    <TableCell>Rs.{p.originalAmount ?? "-"}</TableCell>
                    <TableCell className="text-green-400">{p.discountAmount ? `-Rs.${p.discountAmount}` : "-"}</TableCell>
                    <TableCell className="font-semibold">Rs.{p.finalAmount}</TableCell>
                    <TableCell className="capitalize">{p.paymentMethod || "-"}</TableCell>
                    <TableCell>
                      {p.couponUsed ? (
                        <Badge variant="secondary" className="text-xs font-mono">{p.couponUsed}</Badge>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={p.status === "paid" ? "default" : p.status === "failed" ? "destructive" : "secondary"}
                        className="text-xs capitalize"
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {p.receiptUrl ? (
                        <Button size="sm" variant="ghost" asChild className="h-6 px-2 text-xs">
                          <a href={p.receiptUrl} target="_blank" rel="noreferrer">
                            <Eye className="w-3 h-3 mr-1" />{p.invoiceNumber || "View"}
                          </a>
                        </Button>
                      ) : (
                        <span className="text-slate-500 text-xs">{p.invoiceNumber || "-"}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Layout
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 flex-shrink-0 sticky top-14 self-start h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-white/10 bg-slate-900/50">
        <div className="px-4 py-3 border-b border-white/10">
          <button
            onClick={() => router.back()}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            Back to Users
          </button>
          <div className="mt-2 font-semibold text-sm truncate">{u.name}</div>
          <div className="text-xs text-slate-500 truncate">{u.email}</div>
          <div className="flex gap-1 mt-1.5 flex-wrap">
            <Badge variant={u.plan === "Pro" ? "default" : "secondary"} className="text-[10px] h-4">{u.plan}</Badge>
            {u.role === "SUPER_ADMIN" && <Badge variant="destructive" className="text-[10px] h-4">SUPER ADMIN</Badge>}
            {u.disabled && <Badge variant="destructive" className="text-[10px] h-4">Disabled</Badge>}
          </div>
        </div>
        <nav className="p-2 space-y-0.5 py-3">
          {SECTIONS.map((s) => {
            const SIcon = s.Icon;
            return (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${section === s.key ? "bg-violet-600/20 text-violet-300 border border-violet-500/30 font-medium" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
              >
                <SIcon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 p-6 overflow-auto min-w-0">
        {section === "overview"        && renderOverview()}
        {section === "login"           && renderLoginHistory()}
        {section === "modules"         && renderModules()}
        {section === "interview-guide" && renderInterviewGuides()}
        {section === "gd-history"      && renderGDHistory()}
        {section === "payments"        && renderPayments()}
      </div>
    </div>
  );
}