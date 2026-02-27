"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
} from "recharts";

interface AnalyticsResponse {
  summary: {
    communicationScore: number;
    confidenceScore: number;
    grammarScore: number;
    vocabularyScore: number;
    technicalScore: number;
    overallScore: number;
    overallStatus: string;
    totalQuestions: number;
    totalSessions: number;
    totalDurationMinutes: number;
    avgTimePerQuestion: number;
    totalCompanies: number;
    completionRate: number;
  };
  distributions: {
    module: Array<{ name: string; count: number }>;
  };
  trends: Array<{ date: string; communication: number; confidence: number; grammar: number; technical: number }>;
  insights: {
    commonGrammarIssues: string[];
    tips: string[];
    mostPracticed: Array<{ name: string; count: number }>;
    leastPracticed: Array<{ name: string; count: number }>;
    focusAreas: string[];
  };
  charts: {
    accuracyVsSpeed: Array<{ duration: number; score: number }>;
  };
  advanced: {
    communication: {
      fillerRate: number;
      fillerWords: Array<{ word: string; count: number }>;
      speakingWpm: number;
      idealWpmRange: [number, number];
      speakingPaceScore: number;
      sentenceStructureScore: number;
      toneConsistency: number;
      hesitationIndex: number;
      confidenceTimeline: Array<{ turn: number; confidence: number }>;
      sessionConfidenceTrend: Array<{ date: string; confidence: number }>;
    };
    questions: {
      difficultyDistribution: Array<{ label: string; count: number }>;
      accuracyByType: Array<{ type: string; accuracy: number }>;
      reattemptSuccessRate: number;
    };
    company: {
      readiness: Array<{ name: string; score: number; missingSkills: string[] }>;
      recommendations: string[];
      readinessTimelineWeeks: number | null;
    };
    coach: {
      readinessSummary: string;
      strengths: string[];
      weaknesses: string[];
      plan7Day: string[];
      nextSessionFocus: string;
    };
  };
}

const formatDuration = (minutes: number) => {
  if (!minutes) return "0m";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

const getStatusColor = (status: string) => {
  if (status === "Excellent") return "bg-emerald-100 text-emerald-700";
  if (status === "Good") return "bg-sky-100 text-sky-700";
  return "bg-amber-100 text-amber-700";
};

function ProfessionalPrintReport({
  data,
  candidateName,
  reportDate,
}: {
  data: AnalyticsResponse;
  candidateName: string;
  reportDate: string;
}) {
  const totalPages = 5;
  const score = Math.round(data.summary.overallScore);
  const risk = score >= 75 ? "Low" : score >= 55 ? "Moderate" : "High";
  const reliability = Math.max(0, Math.min(100, Math.round(100 - data.advanced.communication.fillerRate)));
  const anyData = data as any;
  const behavioral = anyData?.advanced?.behavioral || {};
  const wpm = Number(data.advanced.communication.speakingWpm ?? 0);
  const [idealLow, idealHigh] = data.advanced.communication.idealWpmRange;
  const speakingPaceRadarValue = (() => {
    if (!Number.isFinite(wpm) || wpm <= 0) return 0;
    if (wpm >= idealLow && wpm <= idealHigh) return 100;
    if (wpm < idealLow) return Math.max(0, Math.min(100, (wpm / idealLow) * 100));
    return Math.max(0, Math.min(100, 100 - ((wpm - idealHigh) / idealHigh) * 100));
  })();
  const bodyLanguageRadarData =
    Array.isArray(behavioral?.compositeRadar) && behavioral.compositeRadar.length > 0
      ? behavioral.compositeRadar.map((item: any) => ({
          metric: String(item?.metric ?? ""),
          score: Number(item?.score ?? 0),
        }))
      : [
          { metric: "Eye Contact", score: Number(behavioral?.eyeContactScore ?? 0) },
          { metric: "Posture", score: Number(behavioral?.postureScore ?? 0) },
          { metric: "Smile", score: Number(behavioral?.smileScore ?? 0) },
          { metric: "Engagement", score: Number(behavioral?.engagementScore ?? 0) },
          { metric: "Stress Control", score: Math.max(0, 100 - Number(behavioral?.stressLevel ?? 0)) },
          { metric: "Face Detection", score: Number(behavioral?.faceDetectionRate ?? 0) },
        ];
  const communicationRadarData = [
    { metric: "Communication", score: Number(data.summary.communicationScore ?? 0) },
    { metric: "Confidence", score: Number(data.summary.confidenceScore ?? 0) },
    { metric: "Grammar", score: Number(data.summary.grammarScore ?? 0) },
    { metric: "Speaking Pace", score: Number(speakingPaceRadarValue ?? 0) },
    { metric: "Sentence Structure", score: Number(data.advanced.communication.sentenceStructureScore ?? 0) },
    { metric: "Tone Consistency", score: Number(data.advanced.communication.toneConsistency ?? 0) },
  ];

  const PageShell = ({ page, title, children }: { page: number; title: string; children: React.ReactNode }) => (
    <section className="pdf-page bg-white text-slate-900">
      <header className="pdf-header flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <Image src="/image/final_logo-removebg-preview.png" alt="Flunez AI" width={22} height={22} />
          <span className="text-sm font-semibold text-slate-900">Flunez AI</span>
        </div>
        <div className="text-xs text-slate-600">{candidateName}</div>
        <div className="text-xs text-slate-600">Page {page}/{totalPages}</div>
      </header>
      <div className="pt-3 pdf-main">
        <h2 className="text-[18px] font-semibold mb-3">{title}</h2>
        {children}
      </div>
      <footer className="pdf-footer mt-1 flex items-center justify-between border-t border-slate-200 pt-2 text-[10px]">
        <span className="font-semibold text-indigo-700">Confidential</span>
        <span className="font-semibold text-sky-700">Generated: {reportDate}</span>
        <span className="font-semibold text-violet-700">Flunez AI Analytics</span>
      </footer>
    </section>
  );

  return (
    <div className="bg-slate-100 p-4 print:p-0" data-analytics-report-ready="1">
      <section className="pdf-page bg-gradient-to-br from-white to-slate-100 text-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/image/final_logo-removebg-preview.png" alt="Flunez AI" width={34} height={34} />
            <div className="text-sm font-bold tracking-wide text-sky-900">Flunez AI</div>
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Confidential</div>
        </div>
        <div className="mt-8 text-center">
          <h1 className="text-[24px] font-bold">AI Interview Intelligence Performance Report</h1>
          <p className="mt-2 text-sm text-slate-600">Corporate Candidate Evaluation</p>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">Candidate Name</p>
            <p className="mt-1 text-sm font-semibold">{candidateName}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">Total Sessions</p>
            <p className="mt-1 text-sm font-semibold">{data.summary.totalSessions}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">Total Practice Time</p>
            <p className="mt-1 text-sm font-semibold">{formatDuration(data.summary.totalDurationMinutes)}</p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-center">
          <div className="h-28 w-28 rounded-full border-8 border-sky-500/30 bg-white flex items-center justify-center">
            <div className="text-center">
              <div className="text-[10px] text-slate-500 uppercase">Overall</div>
              <div className="text-3xl font-bold text-sky-700">{score}</div>
            </div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-slate-300 bg-white p-3 font-semibold text-rose-700">
            Risk Level: <strong className="text-rose-800">{risk}</strong>
          </div>
          <div className="rounded-lg border border-slate-300 bg-white p-3 font-semibold text-emerald-700">
            AI Confidence Reliability: <strong className="text-emerald-800">{reliability}%</strong>
          </div>
        </div>
        <footer className="pdf-footer mt-3 flex items-center justify-between border-t border-slate-300 pt-2 text-[10px]">
          <span className="font-semibold text-indigo-700">Confidential</span>
          <span className="font-semibold text-sky-700">Generated: {reportDate}</span>
          <span className="font-semibold text-violet-700">Flunez AI | Page 1/{totalPages}</span>
        </footer>
      </section>

      <PageShell page={2} title="Executive Summary">
        <div className="grid grid-cols-2 gap-3">
          {[
            ["Overall Score", Math.round(data.summary.overallScore)],
            ["Communication", Math.round(data.summary.communicationScore)],
            ["Confidence", Math.round(data.summary.confidenceScore)],
            ["Grammar", Math.round(data.summary.grammarScore)],
            ["Speaking Pace", `${data.advanced.communication.speakingWpm} WPM`],
            ["Body Language", "From AI Video Section"],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg border border-slate-200 p-3 bg-white">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Card className="border-slate-200 bg-white">
            <CardHeader><CardTitle className="text-sm">Skill Progress Over Time</CardTitle></CardHeader>
            <CardContent className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" fontSize={10} />
                  <YAxis fontSize={10} />
                  <ChartTooltip />
                  <Line dataKey="communication" stroke="#0284c7" dot={false} isAnimationActive={false} />
                  <Line dataKey="confidence" stroke="#7c3aed" dot={false} isAnimationActive={false} />
                  <Line dataKey="grammar" stroke="#16a34a" dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white">
            <CardHeader><CardTitle className="text-sm">Accuracy vs Speed</CardTitle></CardHeader>
            <CardContent className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.charts.accuracyVsSpeed}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="duration" fontSize={10} />
                  <YAxis fontSize={10} />
                  <ChartTooltip />
                  <Line dataKey="score" stroke="#ea580c" dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Priority Chart Order</h3>
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-slate-200 bg-white">
              <CardHeader><CardTitle className="text-sm">Body Language Composite Radar</CardTitle></CardHeader>
              <CardContent className="h-[230px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={bodyLanguageRadarData}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "#334155", fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} />
                    <Radar dataKey="score" stroke="#06b6d4" fill="#67e8f9" fillOpacity={0.35} isAnimationActive={false} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-white">
              <CardHeader><CardTitle className="text-sm">Communication Composite Radar</CardTitle></CardHeader>
              <CardContent className="h-[230px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={communicationRadarData}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "#334155", fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} />
                    <Radar dataKey="score" stroke="#0284c7" fill="#38bdf8" fillOpacity={0.35} isAnimationActive={false} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageShell>

      <PageShell page={3} title="Speech & Communication Intelligence">
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-slate-200 bg-white">
            <CardHeader><CardTitle className="text-sm">Filler Word Frequency</CardTitle></CardHeader>
            <CardContent className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.advanced.communication.fillerWords.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="word" fontSize={10} />
                  <YAxis fontSize={10} />
                  <ChartTooltip />
                  <Bar dataKey="count" fill="#0ea5e9" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white">
            <CardHeader><CardTitle className="text-sm">Speaking Pace vs Ideal</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Current Pace: <strong>{data.advanced.communication.speakingWpm} WPM</strong></p>
              <p>Ideal Range: {data.advanced.communication.idealWpmRange[0]}-{data.advanced.communication.idealWpmRange[1]} WPM</p>
              <p>Pace Quality: <strong>{data.advanced.communication.speakingPaceScore}</strong></p>
              <p>Sentence Structure: <strong>{data.advanced.communication.sentenceStructureScore}</strong></p>
              <p>Tone Consistency: <strong>{data.advanced.communication.toneConsistency}</strong></p>
              <p>Hesitation Index: <strong>{data.advanced.communication.hesitationIndex}</strong></p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white col-span-2">
            <CardHeader><CardTitle className="text-sm">Confidence Tracking</CardTitle></CardHeader>
            <CardContent className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.advanced.communication.sessionConfidenceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" fontSize={10} />
                  <YAxis fontSize={10} />
                  <ChartTooltip />
                  <Area dataKey="confidence" stroke="#16a34a" fill="#bbf7d0" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white">
            <CardHeader><CardTitle className="text-sm">Confidence Timeline (Turns)</CardTitle></CardHeader>
            <CardContent className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.advanced.communication.confidenceTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="turn" fontSize={10} />
                  <YAxis fontSize={10} domain={[0, 100]} />
                  <ChartTooltip />
                  <Line dataKey="confidence" stroke="#0ea5e9" dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white">
            <CardHeader><CardTitle className="text-sm">Practice by Module (Mini)</CardTitle></CardHeader>
            <CardContent className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.distributions.module.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" fontSize={9} />
                  <YAxis fontSize={10} />
                  <ChartTooltip />
                  <Bar dataKey="count" fill="#6366f1" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </PageShell>

      <PageShell page={4} title="Interview Accuracy & Company Readiness">
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-slate-200 bg-white">
            <CardHeader><CardTitle className="text-sm">Question Difficulty Distribution</CardTitle></CardHeader>
            <CardContent className="h-[210px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.advanced.questions.difficultyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" fontSize={10} />
                  <YAxis fontSize={10} />
                  <ChartTooltip />
                  <Bar dataKey="count" fill="#38bdf8" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white">
            <CardHeader><CardTitle className="text-sm">Accuracy by Interview Type</CardTitle></CardHeader>
            <CardContent className="h-[210px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.advanced.questions.accuracyByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="type" fontSize={9} />
                  <YAxis fontSize={10} domain={[0, 100]} />
                  <ChartTooltip />
                  <Bar dataKey="accuracy" fill="#22c55e" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white">
            <CardHeader><CardTitle className="text-sm">Company-wise Readiness</CardTitle></CardHeader>
            <CardContent className="h-[210px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.advanced.company.readiness}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" fontSize={9} />
                  <YAxis fontSize={10} domain={[0, 100]} />
                  <ChartTooltip />
                  <Bar dataKey="score" fill="#f97316" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white">
            <CardHeader><CardTitle className="text-sm">Most Needed Skill Gaps</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {data.advanced.company.readiness.slice(0, 5).map((company) => (
                <div key={company.name}>
                  <p className="font-semibold">{company.name}</p>
                  <p className="text-slate-600">{company.missingSkills.join(", ") || "No major gaps"}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </PageShell>

      <PageShell page={5} title="Practice Distribution & AI Coach Recommendations">
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-slate-200 bg-white">
            <CardHeader><CardTitle className="text-sm">Practice Distribution by Module</CardTitle></CardHeader>
            <CardContent className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.distributions.module}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" fontSize={9} />
                  <YAxis fontSize={10} />
                  <ChartTooltip />
                  <Bar dataKey="count" fill="#0ea5e9" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white">
            <CardHeader><CardTitle className="text-sm">AI Coach Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{data.advanced.coach.readinessSummary}</p>
              <p><strong>Focus:</strong> {data.advanced.coach.nextSessionFocus}</p>
              <p><strong>Top Strengths:</strong> {data.advanced.coach.strengths.join(", ")}</p>
              <p><strong>Needs Focus:</strong> {data.advanced.coach.weaknesses.join(", ")}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white col-span-2">
            <CardHeader><CardTitle className="text-sm">7-Day Improvement Plan</CardTitle></CardHeader>
            <CardContent className="text-sm">
              <ul className="space-y-1">
                {data.advanced.coach.plan7Day.map((step) => (
                  <li key={step}>- {step}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </PageShell>

      <style jsx global>{`
        .pdf-page {
          width: min(210mm, 100%);
          min-height: auto;
          margin: 0 auto 2px auto;
          padding: 6mm;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          color: #0f172a;
        }
        .pdf-main {
          flex: 1;
        }
        .pdf-page:last-child {
          margin-bottom: 0;
        }
        .pdf-page p,
        .pdf-page span,
        .pdf-page li,
        .pdf-page h1,
        .pdf-page h2,
        .pdf-page h3 {
          color: #0f172a !important;
          opacity: 1 !important;
        }
        .pdf-page .text-slate-400,
        .pdf-page .text-slate-500,
        .pdf-page .text-slate-600 {
          color: #1f2937 !important;
        }
        .pdf-page .border-slate-200 {
          border-color: #cbd5e1 !important;
        }
        .pdf-page .bg-white {
          background: #ffffff !important;
        }
        .pdf-page .recharts-cartesian-grid line {
          stroke: #dbe3ee !important;
          stroke-opacity: 1 !important;
        }
        .pdf-page .recharts-text,
        .pdf-page .recharts-cartesian-axis-tick-value {
          fill: #0f172a !important;
          color: #0f172a !important;
          opacity: 1 !important;
          font-weight: 500 !important;
        }
        .pdf-page .recharts-legend-item-text {
          color: #0f172a !important;
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm;
          }
          html,
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .pdf-page {
            width: auto !important;
            margin: 0 !important;
            min-height: calc(297mm - 12mm) !important;
            display: flex !important;
            flex-direction: column !important;
            page-break-after: auto;
            break-after: auto;
            page-break-inside: avoid;
            break-inside: avoid-page;
            box-shadow: none !important;
            background: #ffffff !important;
            padding: 4mm !important;
          }
          .pdf-main {
            flex: 1;
          }
          .pdf-page + .pdf-page {
            page-break-before: always;
            break-before: page;
          }
        }
      `}</style>
    </div>
  );
}

function AnalyticsReportContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [data, setData] = useState<AnalyticsResponse | null>(null);

  useEffect(() => {
    const previousBackground = document.body.style.background;
    const previousColor = document.body.style.color;
    document.body.style.background = "#0b1220";
    document.body.style.color = "#e2e8f0";
    return () => {
      document.body.style.background = previousBackground;
      document.body.style.color = previousColor;
    };
  }, []);

  useEffect(() => {
    const isPublic = searchParams.get("public") === "1";
    const username = searchParams.get("username");

    const load = async () => {
      const params = new URLSearchParams();
      const range = searchParams.get("range");
      if (isPublic && username) {
        params.set("public", "1");
        params.set("username", username);
      }
      if (range) params.set("range", range);
      const query = params.toString();
      const res = await fetch(`/api/analytics${query ? `?${query}` : ""}`);
      if (res.ok) {
        setData(await res.json());
      }
    };
    load();
  }, [searchParams]);

  useEffect(() => {
    if (!data) return undefined;
    if (searchParams.get("print") === "1") {
      const timeout = setTimeout(() => window.print(), 800);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [searchParams, data]);

  const summaryCards = useMemo(() => {
    if (!data) return [];
    return [
      { label: "Overall Score", value: Math.round(data.summary.overallScore) },
      { label: "Communication", value: Math.round(data.summary.communicationScore) },
      { label: "Confidence", value: Math.round(data.summary.confidenceScore) },
      { label: "Grammar", value: Math.round(data.summary.grammarScore) },
      { label: "Speaking Pace", value: `${data.advanced.communication.speakingWpm} WPM` },
    ];
  }, [data]);

  if (!data) {
    return <div className="min-h-screen bg-slate-950 p-10 text-slate-100">Preparing report...</div>;
  }
  const isPublic = searchParams.get("public") === "1";
  const username = searchParams.get("username");
  const isPrintMode = searchParams.get("print") === "1";
  const candidateName = isPublic ? (username || "Public Candidate") : (session?.user?.name || session?.user?.email || "Candidate");
  const primaryCompany = data.advanced.company.readiness[0]?.name || "General";
  const reportDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });

  if (isPublic && !isPrintMode) {
    const params = new URLSearchParams();
    params.set("public", "1");
    if (username) params.set("username", username);
    const range = searchParams.get("range");
    if (range) params.set("range", range);
    params.set("embed", "1");

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-4">
          <iframe
            title="Public Analytics Dashboard"
            src={`/analytics?${params.toString()}`}
            className="h-[calc(100vh-40px)] w-full rounded-xl border border-slate-800 bg-slate-950"
          />
        </div>
      </div>
    );
  }

  if (isPrintMode) {
    return (
      <ProfessionalPrintReport
        data={data}
        candidateName={candidateName}
        reportDate={reportDate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 print:bg-slate-950">
      <div className="mx-auto max-w-5xl px-6 py-10 print:max-w-none print:px-2 print:py-4">
        <header className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <Image src="/image/final_logo-removebg-preview.png" alt="Fluenzy AI" width={36} height={36} />
            <div>
              <p className="text-sm font-semibold text-slate-400">Fluenzy AI</p>
              <h1 className="text-2xl font-bold">Analytics Dashboard - Communication Performance Report</h1>
            </div>
          </div>
          <Badge className={`${getStatusColor(data.summary.overallStatus)} border-0 px-3 py-1 text-xs font-semibold`}
          >
            {data.summary.overallStatus}
          </Badge>
        </header>

        <section className="mt-4 grid gap-3 md:grid-cols-3 print:break-inside-avoid">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Candidate</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">{candidateName}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Primary Company</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">{primaryCompany}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Report Date</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">{reportDate}</p>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-5 print:break-inside-avoid">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">{card.value}</p>
            </div>
          ))}
        </section>
        <p className="mt-2 text-xs text-slate-400">Ideal speaking pace: {data.advanced.communication.idealWpmRange[0]}-{data.advanced.communication.idealWpmRange[1]} WPM</p>

        <section className="mt-8 grid gap-4 md:grid-cols-4 print:break-inside-avoid">
          {[
            { label: "Overall Performance", value: Math.round(data.summary.overallScore) },
            { label: "Communication Score", value: Math.round(data.summary.communicationScore) },
            { label: "Technical Knowledge", value: Math.round(data.summary.technicalScore) },
            { label: "Avg Time per Question", value: `${data.summary.avgTimePerQuestion}m` },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">{card.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3 print:break-inside-avoid">
          {[
            { label: "Confidence", value: Math.round(data.summary.confidenceScore), color: "#0ea5e9" },
            { label: "Grammar Accuracy", value: Math.round(data.summary.grammarScore), color: "#22c55e" },
            { label: "Vocabulary Usage", value: Math.round(data.summary.vocabularyScore), color: "#a855f7" },
          ].map((metric) => (
            <div key={metric.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{metric.label}</p>
              <div className="mt-3 h-2 rounded-full bg-slate-800">
                <div className="h-2 rounded-full" style={{ width: `${metric.value}%`, background: metric.color }} />
              </div>
              <p className="mt-2 text-lg font-semibold text-slate-100">{metric.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 grid gap-6 print:break-inside-avoid print-page-break">
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle>Skill Progress Over Time</CardTitle>
            </CardHeader>
            <CardContent className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <ChartTooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0" }} />
                  <Line type="monotone" dataKey="communication" stroke="#0ea5e9" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="confidence" stroke="#a855f7" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="grammar" stroke="#22c55e" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="technical" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2 print:break-inside-avoid">
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle>Confidence Timeline (Latest Session)</CardTitle>
            </CardHeader>
            <CardContent className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.advanced.communication.confidenceTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="turn" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <ChartTooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0" }} />
                  <Line type="monotone" dataKey="confidence" stroke="#0ea5e9" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle>Session Confidence Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.advanced.communication.sessionConfidenceTrend}>
                  <defs>
                    <linearGradient id="confTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <ChartTooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0" }} />
                  <Area type="monotone" dataKey="confidence" stroke="#22c55e" fill="url(#confTrend)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2 print:break-inside-avoid">
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle>Communication Skills Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: "Communication", value: Math.round(data.summary.communicationScore) },
                    { name: "Confidence", value: Math.round(data.summary.confidenceScore) },
                    { name: "Grammar", value: Math.round(data.summary.grammarScore) },
                    { name: "Vocabulary", value: Math.round(data.summary.vocabularyScore) },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <ChartTooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0" }} />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle>Accuracy vs Speed</CardTitle>
            </CardHeader>
            <CardContent className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.charts.accuracyVsSpeed}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="duration" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <ChartTooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0" }} />
                  <Line type="monotone" dataKey="score" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2 print:break-inside-avoid print-page-break">
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle>Filler Word Detector</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">Filler rate: <strong>{data.advanced.communication.fillerRate}%</strong></div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.advanced.communication.fillerWords.slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="word" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <ChartTooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0" }} />
                    <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle>Speaking Speed vs Ideal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>Current pace: <strong>{data.advanced.communication.speakingWpm} WPM</strong></div>
              <div>Ideal range: {data.advanced.communication.idealWpmRange[0]}-{data.advanced.communication.idealWpmRange[1]} WPM</div>
              <div>Pace quality score: <strong>{data.advanced.communication.speakingPaceScore}</strong></div>
              <div className="rounded-full bg-slate-800 h-2 relative">
                <div
                  className="absolute h-2 bg-emerald-500/50 rounded-full"
                  style={{ left: `${(data.advanced.communication.idealWpmRange[0] / 220) * 100}%`, width: `${((data.advanced.communication.idealWpmRange[1] - data.advanced.communication.idealWpmRange[0]) / 220) * 100}%` }}
                />
                <div
                  className="absolute -top-1 h-4 w-1 rounded-full bg-sky-500"
                  style={{ left: `${(data.advanced.communication.speakingWpm / 220) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-3 print:break-inside-avoid">
          {[
            { label: "Sentence Structure", value: data.advanced.communication.sentenceStructureScore },
            { label: "Tone Consistency", value: data.advanced.communication.toneConsistency },
            { label: "Hesitation Index", value: data.advanced.communication.hesitationIndex },
          ].map((metric) => (
            <Card key={metric.label} className="border-slate-800 bg-slate-900">
              <CardHeader>
                <CardTitle>{metric.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{Math.round(metric.value)}</div>
                <div className="mt-3 h-2 rounded-full bg-slate-800">
                  <div className="h-2 rounded-full bg-slate-400" style={{ width: `${metric.value}%` }} />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-2 print:break-inside-avoid print-page-break">
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle>Practice Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Total questions</span>
                <span className="font-semibold">{data.summary.totalQuestions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total sessions</span>
                <span className="font-semibold">{data.summary.totalSessions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Completion consistency</span>
                <span className="font-semibold">{data.summary.completionRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total practice time</span>
                <span className="font-semibold">{formatDuration(data.summary.totalDurationMinutes)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Companies practiced</span>
                <span className="font-semibold">{data.summary.totalCompanies}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle>Practice Distribution by Module</CardTitle>
            </CardHeader>
            <CardContent className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.distributions.module}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <ChartTooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0" }} />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle>AI Insights & Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Common Grammar Patterns</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(data.insights.commonGrammarIssues.length ? data.insights.commonGrammarIssues : ["Not enough data"])
                    .slice(0, 4)
                    .map((issue) => (
                      <span key={issue} className="rounded-full border border-slate-700 px-3 py-1 text-xs">
                        {issue}
                      </span>
                    ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Personalized Tips</p>
                <ul className="mt-2 space-y-2">
                  {data.insights.tips.map((tip) => (
                    <li key={tip} className="flex gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2 print:break-inside-avoid">
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle>Strengths & Focus Areas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Most Practiced</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {data.insights.mostPracticed.map((item) => (
                    <span key={item.name} className="rounded-full border border-slate-700 px-3 py-1 text-xs">
                      {item.name} ({item.count})
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Least Practiced</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {data.insights.leastPracticed.map((item) => (
                    <span key={item.name} className="rounded-full border border-slate-700 px-3 py-1 text-xs">
                      {item.name} ({item.count})
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Focus Areas</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {data.insights.focusAreas.map((area) => (
                    <span key={area} className="rounded-full border border-slate-700 px-3 py-1 text-xs">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle>Overall Status & Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p><strong>Status:</strong> {data.summary.overallStatus}</p>
              <p><strong>Total Questions:</strong> {data.summary.totalQuestions}</p>
              <p><strong>Total Sessions:</strong> {data.summary.totalSessions}</p>
              <p><strong>Completion Consistency:</strong> {data.summary.completionRate}%</p>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2 print:break-inside-avoid print-page-break">
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle>Question Difficulty Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.advanced.questions.difficultyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <ChartTooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0" }} />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle>Accuracy by Question Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>Reattempt success rate: <strong>{data.advanced.questions.reattemptSuccessRate}%</strong></div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.advanced.questions.accuracyByType}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="type" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <ChartTooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0" }} />
                    <Bar dataKey="accuracy" fill="#22c55e" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2 print:break-inside-avoid">
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle>Company-wise Readiness</CardTitle>
            </CardHeader>
            <CardContent className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.advanced.company.readiness}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <ChartTooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0" }} />
                  <Bar dataKey="score" fill="#f97316" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle>Company Gaps & Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {data.advanced.company.readiness.slice(0, 3).map((company) => (
                <div key={company.name}>
                  <p className="font-semibold">{company.name}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {company.missingSkills.map((skill) => (
                      <span key={skill} className="rounded-full border border-slate-700 px-3 py-1 text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {data.advanced.company.readinessTimelineWeeks != null && (
                <p>Estimated readiness timeline: {data.advanced.company.readinessTimelineWeeks} weeks</p>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2 print:break-inside-avoid">
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle>AI Coach Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>{data.advanced.coach.readinessSummary}</p>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Strengths</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {data.advanced.coach.strengths.map((item) => (
                    <span key={item} className="rounded-full border border-slate-700 px-3 py-1 text-xs">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Focus Areas</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {data.advanced.coach.weaknesses.map((item) => (
                    <span key={item} className="rounded-full border border-slate-700 px-3 py-1 text-xs">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle>7-Day Improvement Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ul className="space-y-2">
                {data.advanced.coach.plan7Day.map((step) => (
                  <li key={step} className="flex gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                    {step}
                  </li>
                ))}
              </ul>
              <p className="pt-2 text-sm">Next session focus: <strong>{data.advanced.coach.nextSessionFocus}</strong></p>
              <div className="pt-2">
                {data.advanced.company.recommendations.map((rec) => (
                  <div key={rec} className="flex gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-sky-500" />
                    {rec}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-12 space-y-10 text-slate-200 print:hidden">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-400">
            <ol className="flex flex-wrap gap-2">
              <li>
                <a href="/" className="hover:text-slate-200">Home</a>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-slate-300">Analytics Report</li>
            </ol>
          </nav>
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-white">How to use your interview analytics report</h2>
            <p className="text-base leading-relaxed text-slate-300 max-w-3xl">
              The FluenzyAI analytics report turns each mock interview with AI into actionable coaching insights. Instead of guessing
              whether you are improving, this report highlights progress in communication, confidence, grammar, and technical interview
              training. Use the overview scores to understand your current readiness, then drill into the trend charts to see which
              skills are improving over time. This is especially valuable for candidates preparing for FAANG interview practice or
              high-volume recruiting cycles, because measurable improvement helps you prioritize where to focus next.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-purple-500/10">
              <h3 className="text-lg font-semibold text-white">Connect communication to outcomes</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                The report is also a practical tool for HR interview preparation. Communication scores, vocabulary usage, and filler word
                metrics reveal how clearly you convey behavioral stories. When paired with English speaking practice with AI, you can
                refine pacing, tone, and structure to deliver stronger answers. For technical interview training, look for consistency in
                accuracy versus speed and identify sessions where confidence dips. These indicators help you plan the next round of
                practice with the AI Interview Coach.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-purple-500/10">
              <h3 className="text-lg font-semibold text-white">Build a complete preparation plan</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                If you want to build a complete preparation plan, combine this report with the feature modules and pricing options.
                Visit the features page for a module overview, or review pricing to select a plan that supports consistent practice.
                Every improvement cycle should end with a review of these analytics so you can adjust goals and track measurable gains.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a href="/train" className="rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950">
              Start Training
            </a>
            <a href="/features" className="rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-400">
              Explore Features
            </a>
            <a href="/pricing" className="rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-400">
              View Pricing
            </a>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Analytics report FAQs</h2>
            <div className="space-y-4">
              {[
                {
                  q: "What does the overall score represent?",
                  a: "The overall score summarizes communication, confidence, grammar accuracy, and technical performance across your recent mock interviews with AI.",
                },
                {
                  q: "How should I use the trends?",
                  a: "Trends show how your skills move over time, making it easier to decide whether to focus on English speaking practice with AI or deeper technical interview training in your next sessions.",
                },
                {
                  q: "Is this report useful for HR interview preparation?",
                  a: "Yes. The communication and confidence metrics directly map to HR interview preparation and behavioral interview clarity.",
                },
                {
                  q: "How often should I review my analytics?",
                  a: "Review after every few sessions to track improvements and set the next practice goal within the AI Interview Coach.",
                },
              ].map((item) => (
                <details key={item.q} className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-5">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-100">{item.q}</summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-10 flex justify-end print:hidden">
          <button
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium"
            onClick={() => window.print()}
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          html,
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: #0b1220 !important;
          }
          .print-page-break {
            break-before: page;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What does the overall score represent?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The overall score summarizes communication, confidence, grammar accuracy, and technical performance across your recent mock interviews with AI."
                }
              },
              {
                "@type": "Question",
                "name": "How should I use the trends?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Trends show how your skills move over time, making it easier to decide whether to focus on English speaking practice with AI or deeper technical interview training in your next sessions."
                }
              },
              {
                "@type": "Question",
                "name": "Is this report useful for HR interview preparation?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. The communication and confidence metrics directly map to HR interview preparation and behavioral interview clarity."
                }
              },
              {
                "@type": "Question",
                "name": "How often should I review my analytics?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Review after every few sessions to track improvements and set the next practice goal within the AI Interview Coach."
                }
              }
            ]
          })
        }}
      />



      <style jsx global>{`
        @media print {
          @page {
            margin: 16mm;
          }
          body {
            background: #0b1220 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          html, body {
            margin: 0;
            padding: 0;
          }
          .print\:break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .print-page-break {
            break-before: page;
            page-break-before: always;
          }
          .recharts-wrapper {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

export default function AnalyticsReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" /> }>
      <AnalyticsReportContent />
    </Suspense>
  );
}

