"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  Info,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import HeaderOffset from "@/components/HeaderOffset";

interface AnalysisResult {
  atsScore: number;
  keywordScore: number;
  skillsScore: number;
  formatScore: number;
  experienceScore: number;
  educationScore: number;
  extractedSkills: string[];
  missingKeywords: string[];
  suggestions: string[];
  strengths: string[];
  jobTitleMatch: string;
  experienceYears: number;
  // JD-aware extras
  jdSkillMatch: number;
  jdMatchedSkills: string[];
  jdMissingSkills: string[];
  resumeQuality: string;
  recommendation: string;
  parsedData: {
    name: string;
    email: string;
    phone: string;
    missingSections: string[];
  };
}

export default function UploadResumePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [parseWarning, setParseWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const handleFile = (f: File) => {
    setError(null);
    setResult(null);
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (!allowed.includes(f.type)) {
      setError("Invalid file type. Please upload a PDF or DOCX file.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("File too large. Maximum size is 5 MB.");
      return;
    }
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);
    setParseWarning(null);

    const formData = new FormData();
    formData.append("resume", file);
    if (jobDescription.trim()) formData.append("jobDescription", jobDescription);

    try {
      const res = await fetch("/api/ats/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed. Please try again.");
        return;
      }
      setResult(data.scores);
      setAnalysisId(data.analysisId);
      if (data.parseWarning) setParseWarning(data.parseWarning);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setUploading(false);
    }
  };

  const ScoreBar = ({
    label,
    score,
    color,
  }: {
    label: string;
    score: number;
    color: string;
  }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm font-semibold text-slate-400">
        <span>{label}</span>
        <span style={{ color }}>{Math.round(score)}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );

  const scoreColor = (s: number) =>
    s >= 70 ? "#34d399" : s >= 45 ? "#fbbf24" : "#f87171";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <HeaderOffset />

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Back */}
        <Link
          href="/ats"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to ATS Dashboard
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-6 w-6 text-purple-400" />
            <h1 className="text-2xl font-black">Upload Resume</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Upload your PDF or DOCX resume. Our AI engine will parse and score it in real-time.
          </p>
        </div>

        {/* Upload Zone */}
        {!result && (
          <Card className="bg-slate-900/80 border-white/5 mb-6">
            <CardContent className="pt-6">
              {/* Drop zone */}
              <div
                className={`rounded-xl border-2 border-dashed p-12 flex flex-col items-center text-center cursor-pointer transition-all ${
                  dragging
                    ? "border-purple-500 bg-purple-500/10"
                    : file
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-white/10 hover:border-white/20"
                }`}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
                {file ? (
                  <>
                    <FileText className="h-14 w-14 text-emerald-400 mb-3" />
                    <p className="font-bold text-white">{file.name}</p>
                    <p className="text-sm text-slate-400 mt-1">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      className="mt-3 text-xs text-slate-500 hover:text-slate-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setError(null);
                      }}
                    >
                      Remove file
                    </button>
                  </>
                ) : (
                  <>
                    <Upload className="h-14 w-14 text-slate-600 mb-3" />
                    <p className="font-bold text-white">
                      Drag &amp; drop your resume here
                    </p>
                    <p className="text-sm text-slate-400 mt-1">or click to browse</p>
                    <p className="text-xs text-slate-500 mt-3">
                      PDF or DOCX • Max 5 MB
                    </p>
                  </>
                )}
              </div>

              {/* Job Description */}
              <div className="mt-5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                  Job Description <span className="text-slate-600 font-normal normal-case">(optional – for JD-based scoring)</span>
                </label>
                <textarea
                  className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  rows={4}
                  placeholder="Paste the job description here to get a tailored ATS match score…"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="mt-4 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg px-4 py-3">
                  <XCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Analyze button */}
              <div className="mt-5 flex justify-end">
                <Button
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2 min-w-[160px]"
                  disabled={!file || uploading}
                  onClick={handleAnalyze}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Analyze Resume
                    </>
                  )}
                </Button>
              </div>

              {/* Info note */}
              <div className="mt-4 flex items-start gap-2 text-xs text-slate-500 bg-slate-800/50 rounded-lg px-3 py-2">
                <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                Your resume text is processed server-side and never shared. Only extracted
                text and scores are stored.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="font-bold text-emerald-400 text-sm">
                  Resume analyzed successfully!
                </p>
                <p className="text-xs text-slate-400">
                  Quality:{" "}
                  <span className={result.resumeQuality === "Excellent" ? "text-emerald-400" : result.resumeQuality === "Good" ? "text-blue-400" : result.resumeQuality === "Average" ? "text-yellow-400" : "text-red-400"}>
                    {result.resumeQuality}
                  </span>
                  {" – "}{result.recommendation}
                </p>
              </div>
            </div>

            {/* Parse warning */}
            {parseWarning && (
              <div className="flex items-start gap-2 text-amber-400 text-sm bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span><strong>Note:</strong> {parseWarning}</span>
              </div>
            )}

            {/* Big score */}
            <Card className="bg-slate-900/80 border-white/5">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  Your ATS Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-8">
                  {/* Large number */}
                  <div className="flex flex-col items-center">
                    <span
                      className="text-7xl font-black"
                      style={{ color: scoreColor(result.atsScore) }}
                    >
                      {Math.round(result.atsScore)}
                    </span>
                    <span className="text-slate-400 text-sm">out of 100</span>
                    {result.jobTitleMatch && (
                      <span className="mt-2 text-xs bg-white/5 border border-white/10 px-2 py-1 rounded-full text-slate-400">
                        Detected: {result.jobTitleMatch}
                      </span>
                    )}
                  </div>

                  {/* Bars */}
                  <div className="flex-1 space-y-3 w-full">
                    <ScoreBar label="Keyword Match" score={result.keywordScore} color="#a78bfa" />
                    <ScoreBar label="Skills Relevance" score={result.skillsScore} color="#60a5fa" />
                    <ScoreBar label="Experience" score={result.experienceScore} color="#34d399" />
                    <ScoreBar label="Education" score={result.educationScore} color="#fbbf24" />
                    <ScoreBar label="Formatting" score={result.formatScore} color="#f472b6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* JD Skill Match */}
            {result.jdSkillMatch > 0 && (
              <Card className="bg-slate-900/80 border-white/5">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    📄 JD Skill Match — {Math.round(result.jdSkillMatch)}%
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ScoreBar label="JD Skill Match" score={result.jdSkillMatch} color={scoreColor(result.jdSkillMatch)} />
                  {result.jdMatchedSkills.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-2">✅ Skills found in your resume</p>
                      <div className="flex flex-wrap gap-2">
                        {result.jdMatchedSkills.map((sk) => (
                          <span key={sk} className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">{sk}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.jdMissingSkills.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-2">❌ Missing JD skills</p>
                      <div className="flex flex-wrap gap-2">
                        {result.jdMissingSkills.slice(0, 15).map((sk) => (
                          <span key={sk} className="px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-semibold border border-red-500/20">{sk}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Skills detected */}
            <Card className="bg-slate-900/80 border-white/5">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Detected Skills ({result.extractedSkills.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.extractedSkills.slice(0, 20).map((sk) => (
                    <span
                      key={sk}
                      className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20"
                    >
                      {sk}
                    </span>
                  ))}
                  {result.extractedSkills.length === 0 && (
                    <p className="text-slate-500 text-sm">No skills detected.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Suggestions */}
            <Card className="bg-slate-900/80 border-white/5">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  Improvement Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.suggestions.map((s, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-slate-300 bg-white/3 rounded-lg px-3 py-2"
                    >
                      <Info className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2"
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setError(null);
                  setAnalysisId(null);
                  setParseWarning(null);
                }}
              >
                <Upload className="h-4 w-4" /> Upload Another Resume
              </Button>
              <Link href="/ats">
                <Button
                  variant="outline"
                  className="border-white/10 text-slate-300 hover:text-white gap-2"
                >
                  View Full Dashboard
                </Button>
              </Link>
              <Link href="/ats/ranking">
                <Button
                  variant="outline"
                  className="border-white/10 text-slate-300 hover:text-white gap-2"
                >
                  View Leaderboard
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
