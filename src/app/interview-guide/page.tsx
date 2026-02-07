"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  User,
  MessageSquare,
  Code,
  Building2,
  Languages,
  FileText,
  Target,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Star,
  Lightbulb,
  AlertTriangle,
  Sparkles,
  Download,
  Copy,
  Check,
  History,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface GuideSection {
  title: string;
  [key: string]: any;
}

interface InterviewGuide {
  section1_preparation: GuideSection;
  section2_introduction: GuideSection;
  section3_hrQuestions: GuideSection;
  section4_technicalQuestions: GuideSection;
  section5_companySpecific: GuideSection;
  section6_communication: GuideSection;
  section7_cheatSheet: GuideSection;
  section8_mockInterview: GuideSection;
}

const SectionAccordion = ({
  title,
  icon: Icon,
  color,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ElementType;
  color: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-lg rounded-3xl border border-slate-700/50 shadow-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}
          >
            <Icon size={24} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        {isOpen ? (
          <ChevronUp size={24} className="text-slate-400" />
        ) : (
          <ChevronDown size={24} className="text-slate-400" />
        )}
      </button>
      {isOpen && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
};

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check size={16} className="text-green-400" />
      ) : (
        <Copy size={16} className="text-slate-400" />
      )}
    </button>
  );
};

const QuestionCard = ({
  question,
  answer,
  tips,
  index,
}: {
  question: string;
  answer: string;
  tips?: string;
  index: number;
}) => (
  <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
    <div className="flex items-start justify-between gap-4 mb-3">
      <div className="flex items-start gap-3">
        <span className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
          {index}
        </span>
        <h4 className="font-semibold text-white">{question}</h4>
      </div>
      <CopyButton text={answer} />
    </div>
    <div className="ml-11">
      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
        {answer}
      </p>
      {tips && (
        <div className="mt-3 flex items-start gap-2 text-sm text-amber-400">
          <Lightbulb size={16} className="flex-shrink-0 mt-0.5" />
          <span>{tips}</span>
        </div>
      )}
    </div>
  </div>
);

const IntroductionCard = ({
  duration,
  content,
  icon,
}: {
  duration: string;
  content: string;
  icon: React.ReactNode;
}) => (
  <div className="bg-gradient-to-br from-purple-900/30 to-slate-900/50 rounded-2xl p-5 border border-purple-500/30">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-bold text-purple-300">{duration}</span>
      </div>
      <CopyButton text={content} />
    </div>
    <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
      {content}
    </p>
  </div>
);

const InterviewGuidePageContent = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const guideId = searchParams.get("id");
  
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [guide, setGuide] = useState<InterviewGuide | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentGuideId, setCurrentGuideId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Usage tracking
  const [usage, setUsage] = useState<{
    plan: string;
    limit: number | string;
    used: number;
    remaining: number | string;
    canGenerate: boolean;
  } | null>(null);

  // Form state
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [communicationLevel, setCommunicationLevel] = useState("Intermediate");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Fetch usage limits
  useEffect(() => {
    if (session?.user) {
      fetch("/api/interview-guide")
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) {
            setUsage(data);
          }
        })
        .catch(console.error);
    }
  }, [session]);

  // Load guide from history if ID is provided
  useEffect(() => {
    if (guideId && session?.user) {
      loadGuideFromHistory(guideId);
    }
  }, [guideId, session]);

  const loadGuideFromHistory = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/interview-guide/history/${id}`);
      if (response.ok) {
        const data = await response.json();
        setGuide(data.generatedContent);
        setUserProfile({
          name: session?.user?.name,
          experienceLevel: data.experienceLevel,
          targetRole: data.targetRole,
          targetCompany: data.targetCompany,
        });
        setCurrentGuideId(id);
        setTargetRole(data.targetRole);
        setTargetCompany(data.targetCompany || "");
        setCommunicationLevel(data.communicationLevel);
        setJobDescription(data.jobDescription || "");
      }
    } catch (err) {
      console.error("Failed to load guide:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateGuide = async () => {
    if (!usage?.canGenerate) {
      // Redirect to pricing page when limit exceeded
      router.push("/pricing");
      return;
    }

    if (!jobDescription || jobDescription.trim().length < 50) {
      setError("Please paste the full Job Description (minimum 50 characters)");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/interview-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole,
          targetCompany,
          jobDescription,
          communicationLevel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // If usage limit reached, redirect to pricing
        if (response.status === 403 && errorData.redirectToPricing) {
          router.push("/pricing");
          return;
        }
        
        throw new Error(errorData.message || errorData.error || "Failed to generate guide");
      }

      const data = await response.json();
      setGuide(data.guide);
      setUserProfile(data.userProfile);
      setCurrentGuideId(data.guideId);

      // Update usage after successful generation
      if (data.usage) {
        setUsage((prev) => prev ? { ...prev, ...data.usage, canGenerate: data.usage.remaining > 0 || data.usage.remaining === "Unlimited" } : prev);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!currentGuideId) return;
    
    setPdfLoading(true);
    try {
      // Open PDF HTML in a new window with print functionality
      const printWindow = window.open(`/api/interview-guide/pdf/${currentGuideId}`, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          // Auto-trigger print dialog after page loads
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      }
    } catch (err) {
      console.error("PDF download error:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  if (status === "loading" || (loading && guideId)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  // Input form view
  if (!guide) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-4">
                  <Sparkles size={18} className="text-purple-400" />
                  <span className="text-sm font-medium text-purple-300">
                    AI-Powered Interview Preparation
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">
                  Interview Guide Generator
                </h1>
                <p className="text-slate-300 mt-3 text-base md:text-lg max-w-2xl">
                  Generate a personalized, memorizable interview guide tailored to your background.
                  <span className="text-purple-400 font-medium"> "Rat ke interview nikal!"</span>
                </p>
              </div>
              <Link href="/interview-guide/history">
                <Button variant="outline" className="border-slate-700 hover:bg-slate-800">
                  <History size={18} className="mr-2" />
                  View History
                </Button>
              </Link>
            </div>

            {/* Main Form Card */}
            <Card className="max-w-3xl mx-auto border-slate-700/50 bg-slate-900/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-white text-2xl">
                  <Target className="text-purple-400" />
                  Configure Your Guide
                </CardTitle>
                <p className="text-slate-400 text-sm mt-2">
                  Fill in your details to generate a personalized interview guide
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Target Role <span className="text-red-400">*</span>
                    </label>
                    <Input
                      placeholder="e.g., Software Engineer, Data Analyst"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Target Company <span className="text-slate-500">(Optional)</span>
                    </label>
                    <Input
                      placeholder="e.g., Google, Amazon, TCS"
                      value={targetCompany}
                      onChange={(e) => setTargetCompany(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Communication Level
                  </label>
                  <Select
                    value={communicationLevel}
                    onValueChange={setCommunicationLevel}
                  >
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">
                        Beginner - Learning basics, need simple language
                      </SelectItem>
                      <SelectItem value="Intermediate">
                        Intermediate - Comfortable speaking English
                      </SelectItem>
                      <SelectItem value="Advanced">
                        Advanced - Fluent, professional communicator
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Full Job Description - MANDATORY */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Full Job Description <span className="text-red-400">*</span>
                  </label>
                  <Textarea
                    placeholder="Paste the complete job description here. This helps us tailor your interview answers to exactly what the employer is looking for..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 min-h-[200px]"
                  />
                  <p className="text-xs text-slate-500">
                    Copy-paste the full JD from the job posting. We'll analyze it to match your skills and prepare targeted answers.
                  </p>
                </div>

                {/* Usage Display */}
                {usage && (
                  <div className={`p-4 rounded-xl border ${
                    !usage.canGenerate 
                      ? "bg-red-900/30 border-red-500/50" 
                      : "bg-slate-800/50 border-slate-700/50"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText size={18} className={!usage.canGenerate ? "text-red-400" : "text-purple-400"} />
                        <span className="text-sm text-slate-300">
                          {usage.plan} Plan
                        </span>
                      </div>
                      <span className={`text-sm font-medium ${
                        usage.remaining === "Unlimited" 
                          ? "text-green-400" 
                          : (usage.remaining as number) > 0 
                            ? "text-purple-400" 
                            : "text-red-400"
                      }`}>
                        {usage.remaining === "Unlimited" 
                          ? "Unlimited Guides" 
                          : `${usage.remaining} guides remaining`}
                      </span>
                    </div>
                    {!usage.canGenerate ? (
                      <p className="text-sm text-red-300 mt-2">
                        You've used all {usage.limit} guides this month.{" "}
                        <Link href="/pricing" className="text-amber-400 underline font-medium">
                          Upgrade your plan
                        </Link>{" "}
                        for more!
                      </p>
                    ) : usage.remaining !== "Unlimited" && (usage.remaining as number) <= 1 && (
                      <p className="text-xs text-amber-400 mt-2">
                        Running low? <Link href="/pricing" className="underline">Upgrade your plan</Link> for more guides!
                      </p>
                    )}
                  </div>
                )}

                {error && (
                  <div className="p-4 rounded-xl bg-red-900/30 border border-red-500/30 text-red-300 flex items-center gap-3">
                    <AlertTriangle size={20} />
                    {error}
                  </div>
                )}

                <div className="pt-4">
                  {!usage?.canGenerate ? (
                    <Button
                      onClick={() => router.push("/pricing")}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-6 text-lg"
                    >
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      Usage Limit Reached - Upgrade Now
                    </Button>
                  ) : (
                    <Button
                      onClick={generateGuide}
                      disabled={loading || !targetRole || !jobDescription || jobDescription.trim().length < 50}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6 text-lg disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Generating Your Personalized Guide...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Generate Interview Guide
                        </>
                      )}
                    </Button>
                  )}
                </div>

                <p className="text-xs text-center text-slate-500">
                  Tip: Complete your{" "}
                  <Link href="/profile" className="text-purple-400 hover:text-purple-300 underline">
                    Profile
                  </Link>{" "}
                  with education, skills, projects, and experience for better personalized answers.
                </p>
              </CardContent>
            </Card>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                  <User className="text-purple-400" size={24} />
                </div>
                <h3 className="font-bold text-white mb-2">Personalized Answers</h3>
                <p className="text-slate-400 text-sm">
                  All answers are based on YOUR profile, education, and experience.
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                  <FileText className="text-emerald-400" size={24} />
                </div>
                <h3 className="font-bold text-white mb-2">Download as PDF</h3>
                <p className="text-slate-400 text-sm">
                  Get a printable PDF guide to review before your interview.
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4">
                  <History className="text-amber-400" size={24} />
                </div>
                <h3 className="font-bold text-white mb-2">Save & Access Later</h3>
                <p className="text-slate-400 text-sm">
                  All generated guides are saved in your history for future reference.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Guide display view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <button
                onClick={() => {
                  setGuide(null);
                  setCurrentGuideId(null);
                  router.push("/interview-guide");
                }}
                className="flex items-center gap-2 text-slate-400 font-bold text-sm mb-4 hover:text-slate-300 transition-colors"
              >
                <ArrowRight size={16} className="rotate-180" />
                Generate New Guide
              </button>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight">
                Your Interview Guide
              </h1>
              <p className="text-slate-300 mt-2">
                Personalized for{" "}
                <span className="text-purple-400 font-semibold">{userProfile?.name}</span> |{" "}
                <span className="text-pink-400">{userProfile?.targetRole}</span>
                {userProfile?.targetCompany && (
                  <>
                    {" "}@ <span className="text-amber-400">{userProfile?.targetCompany}</span>
                  </>
                )}
              </p>
            </div>

            <div className="flex gap-3">
              <Link href="/interview-guide/history">
                <Button variant="outline" className="border-slate-700 hover:bg-slate-800">
                  <History size={18} className="mr-2" />
                  History
                </Button>
              </Link>
              <Button
                onClick={downloadPDF}
                disabled={pdfLoading}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                {pdfLoading ? (
                  <Loader2 size={18} className="animate-spin mr-2" />
                ) : (
                  <Download size={18} className="mr-2" />
                )}
                Download PDF
              </Button>
            </div>
          </div>

          {/* Badge strip */}
          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm font-medium border border-purple-500/30">
              {userProfile?.experienceLevel}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-medium border border-emerald-500/30">
              {communicationLevel} Communication
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-sm font-medium border border-amber-500/30">
              8 Comprehensive Sections
            </span>
          </div>

          {/* Sections */}
          <div className="space-y-4">
            {/* Section 1: Preparation */}
            {guide.section1_preparation && (
              <SectionAccordion
                title={guide.section1_preparation.title || "Before the Interview"}
                icon={BookOpen}
                color="from-indigo-500 to-indigo-600"
                defaultOpen={true}
              >
                <div className="space-y-6">
                  {guide.section1_preparation.oneDayBefore && (
                    <div>
                      <h3 className="font-bold text-lg text-white mb-3 flex items-center gap-2">
                        <Clock size={18} className="text-indigo-400" />
                        One Day Before Interview
                      </h3>
                      <ul className="space-y-2">
                        {guide.section1_preparation.oneDayBefore.map(
                          (tip: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-slate-300">
                              <CheckCircle2 size={18} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                              {tip}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {guide.section1_preparation.oneHourBefore && (
                    <div>
                      <h3 className="font-bold text-lg text-white mb-3 flex items-center gap-2">
                        <Clock size={18} className="text-amber-400" />
                        One Hour Before Interview
                      </h3>
                      <ul className="space-y-2">
                        {guide.section1_preparation.oneHourBefore.map(
                          (tip: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-slate-300">
                              <CheckCircle2 size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
                              {tip}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {guide.section1_preparation.duringInterview && (
                    <div>
                      <h3 className="font-bold text-lg text-white mb-3">During the Interview</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(guide.section1_preparation.duringInterview).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
                            >
                              <h4 className="font-semibold text-purple-300 capitalize mb-2">{key}</h4>
                              <p className="text-slate-300 text-sm">{value as string}</p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {guide.section1_preparation.commonMistakes && (
                    <div>
                      <h3 className="font-bold text-lg text-white mb-3 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-red-400" />
                        Common Mistakes to Avoid
                      </h3>
                      <ul className="space-y-2">
                        {guide.section1_preparation.commonMistakes.map(
                          (mistake: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-slate-300">
                              <span className="text-red-400">✗</span>
                              {mistake}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {guide.section1_preparation.starMethod && (
                    <div>
                      <h3 className="font-bold text-lg text-white mb-3 flex items-center gap-2">
                        <Star size={18} className="text-amber-400" />
                        STAR Method (with Your Examples)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(guide.section1_preparation.starMethod).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="bg-gradient-to-br from-amber-900/20 to-slate-900/50 rounded-xl p-4 border border-amber-500/30"
                            >
                              <h4 className="font-bold text-amber-300 uppercase mb-2">
                                {key.charAt(0).toUpperCase() + key.slice(1)}
                              </h4>
                              <p className="text-slate-300 text-sm">{value as string}</p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </SectionAccordion>
            )}

            {/* Section 2: Introduction */}
            {guide.section2_introduction && (
              <SectionAccordion
                title={guide.section2_introduction.title || "Tell Me About Yourself"}
                icon={User}
                color="from-purple-500 to-purple-600"
              >
                <div className="space-y-4">
                  {guide.section2_introduction.short30sec && (
                    <IntroductionCard
                      duration="30 Seconds (Short)"
                      content={guide.section2_introduction.short30sec}
                      icon={<Clock size={18} className="text-emerald-400" />}
                    />
                  )}
                  {guide.section2_introduction.medium60sec && (
                    <IntroductionCard
                      duration="60 Seconds (Medium)"
                      content={guide.section2_introduction.medium60sec}
                      icon={<Clock size={18} className="text-amber-400" />}
                    />
                  )}
                  {guide.section2_introduction.long90sec && (
                    <IntroductionCard
                      duration="90 Seconds (Detailed)"
                      content={guide.section2_introduction.long90sec}
                      icon={<Clock size={18} className="text-purple-400" />}
                    />
                  )}
                  {guide.section2_introduction.tips && (
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                      <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                        <Lightbulb size={16} className="text-amber-400" />
                        Delivery Tips
                      </h4>
                      <ul className="space-y-1">
                        {guide.section2_introduction.tips.map((tip: string, i: number) => (
                          <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                            <span className="text-amber-400">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </SectionAccordion>
            )}

            {/* Section 3: HR Questions */}
            {guide.section3_hrQuestions && (
              <SectionAccordion
                title={guide.section3_hrQuestions.title || "HR Interview Questions"}
                icon={MessageSquare}
                color="from-pink-500 to-pink-600"
              >
                <div className="space-y-4">
                  {guide.section3_hrQuestions.questions?.map((q: any, i: number) => (
                    <QuestionCard
                      key={i}
                      question={q.question}
                      answer={q.answer}
                      tips={q.tips}
                      index={i + 1}
                    />
                  ))}
                </div>
              </SectionAccordion>
            )}

            {/* Section 4: Technical Questions */}
            {guide.section4_technicalQuestions && (
              <SectionAccordion
                title={guide.section4_technicalQuestions.title || "Technical Questions"}
                icon={Code}
                color="from-emerald-500 to-emerald-600"
              >
                <div className="space-y-6">
                  {["beginner", "intermediate", "advanced"].map(
                    (level) =>
                      guide.section4_technicalQuestions[level]?.length > 0 && (
                        <div key={level}>
                          <h3 className="font-bold text-lg text-white mb-3 capitalize flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                level === "beginner"
                                  ? "bg-emerald-400"
                                  : level === "intermediate"
                                  ? "bg-amber-400"
                                  : "bg-red-400"
                              }`}
                            />
                            {level} Level
                          </h3>
                          <div className="space-y-3">
                            {guide.section4_technicalQuestions[level].map((q: any, i: number) => (
                              <QuestionCard key={i} question={q.question} answer={q.answer} index={i + 1} />
                            ))}
                          </div>
                        </div>
                      )
                  )}
                </div>
              </SectionAccordion>
            )}

            {/* Section 5: Company Specific */}
            {guide.section5_companySpecific && (
              <SectionAccordion
                title={guide.section5_companySpecific.title || "Company-Specific Questions"}
                icon={Building2}
                color="from-amber-500 to-amber-600"
              >
                <div className="space-y-4">
                  {guide.section5_companySpecific.whyThisCompany && (
                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                      <h4 className="font-bold text-amber-300 mb-3">Why This Company?</h4>
                      <p className="text-slate-300 leading-relaxed">
                        {guide.section5_companySpecific.whyThisCompany}
                      </p>
                      <div className="mt-3 flex justify-end">
                        <CopyButton text={guide.section5_companySpecific.whyThisCompany} />
                      </div>
                    </div>
                  )}
                  {guide.section5_companySpecific.cultureFit && (
                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                      <h4 className="font-bold text-purple-300 mb-3">Culture Fit</h4>
                      <p className="text-slate-300 leading-relaxed">
                        {guide.section5_companySpecific.cultureFit}
                      </p>
                    </div>
                  )}
                  {guide.section5_companySpecific.roleExpectations && (
                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                      <h4 className="font-bold text-emerald-300 mb-3">Role Expectations</h4>
                      <p className="text-slate-300 leading-relaxed">
                        {guide.section5_companySpecific.roleExpectations}
                      </p>
                    </div>
                  )}
                  {guide.section5_companySpecific.valueAddition && (
                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                      <h4 className="font-bold text-pink-300 mb-3">How You Add Value</h4>
                      <p className="text-slate-300 leading-relaxed">
                        {guide.section5_companySpecific.valueAddition}
                      </p>
                    </div>
                  )}
                </div>
              </SectionAccordion>
            )}

            {/* Section 6: Communication */}
            {guide.section6_communication && (
              <SectionAccordion
                title={guide.section6_communication.title || "Communication Polishing"}
                icon={Languages}
                color="from-sky-500 to-sky-600"
              >
                <div className="space-y-6">
                  {guide.section6_communication.fillerWordsToAvoid && (
                    <div>
                      <h3 className="font-bold text-lg text-white mb-3">Filler Words to Avoid</h3>
                      <div className="flex flex-wrap gap-2">
                        {guide.section6_communication.fillerWordsToAvoid.map((word: string, i: number) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-full bg-red-900/30 text-red-300 text-sm border border-red-500/30"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {guide.section6_communication.betterReplacements && (
                    <div>
                      <h3 className="font-bold text-lg text-white mb-3">Better Replacements</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {guide.section6_communication.betterReplacements.map((item: any, i: number) => (
                          <div
                            key={i}
                            className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 flex items-center gap-3"
                          >
                            <span className="text-red-400 line-through text-sm">{item.avoid}</span>
                            <span className="text-slate-500">→</span>
                            <span className="text-emerald-400 text-sm font-medium">{item.useInstead}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {guide.section6_communication.powerPhrases && (
                    <div>
                      <h3 className="font-bold text-lg text-white mb-3 flex items-center gap-2">
                        <Sparkles size={18} className="text-amber-400" />
                        Power Phrases
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {guide.section6_communication.powerPhrases.map((phrase: string, i: number) => (
                          <div
                            key={i}
                            className="bg-gradient-to-r from-amber-900/20 to-slate-900/50 rounded-xl px-4 py-3 border border-amber-500/30 text-amber-200 text-sm"
                          >
                            &quot;{phrase}&quot;
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {guide.section6_communication.howToStartAnswers && (
                      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <h4 className="font-semibold text-emerald-300 mb-3">How to Start Answers</h4>
                        <ul className="space-y-2">
                          {guide.section6_communication.howToStartAnswers.map((phrase: string, i: number) => (
                            <li key={i} className="text-slate-300 text-sm">
                              • {phrase}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {guide.section6_communication.howToEndAnswers && (
                      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <h4 className="font-semibold text-purple-300 mb-3">How to End Answers</h4>
                        <ul className="space-y-2">
                          {guide.section6_communication.howToEndAnswers.map((phrase: string, i: number) => (
                            <li key={i} className="text-slate-300 text-sm">
                              • {phrase}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </SectionAccordion>
            )}

            {/* Section 7: Cheat Sheet */}
            {guide.section7_cheatSheet && (
              <SectionAccordion
                title={guide.section7_cheatSheet.title || "Rapid Memorization Cheat Sheet"}
                icon={FileText}
                color="from-violet-500 to-violet-600"
              >
                <div className="space-y-6">
                  {guide.section7_cheatSheet.keyLinesToMemorize && (
                    <div>
                      <h3 className="font-bold text-lg text-white mb-3">Key Lines to Memorize</h3>
                      <div className="space-y-2">
                        {guide.section7_cheatSheet.keyLinesToMemorize.map((line: string, i: number) => (
                          <div
                            key={i}
                            className="bg-gradient-to-r from-violet-900/30 to-slate-900/50 rounded-xl px-4 py-3 border border-violet-500/30 flex items-center justify-between"
                          >
                            <p className="text-violet-200 text-sm">&quot;{line}&quot;</p>
                            <CopyButton text={line} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {guide.section7_cheatSheet.oneLinerAnswers && (
                    <div>
                      <h3 className="font-bold text-lg text-white mb-3">Quick One-Liner Answers</h3>
                      <div className="space-y-3">
                        {guide.section7_cheatSheet.oneLinerAnswers.map((item: any, i: number) => (
                          <div key={i} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                            <p className="text-slate-400 text-sm mb-1">Q: {item.question}</p>
                            <p className="text-white font-medium">A: {item.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {guide.section7_cheatSheet.finalChecklist && (
                    <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900/50 rounded-2xl p-5 border border-emerald-500/30">
                      <h3 className="font-bold text-lg text-emerald-300 mb-4 flex items-center gap-2">
                        <CheckCircle2 size={20} />
                        Final Revision Checklist
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {guide.section7_cheatSheet.finalChecklist.map((item: string, i: number) => (
                          <div key={i} className="flex items-start gap-3 text-slate-300">
                            <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </SectionAccordion>
            )}

            {/* Section 8: Mock Interview */}
            {guide.section8_mockInterview && (
              <SectionAccordion
                title={guide.section8_mockInterview.title || "Mock Interview Simulation"}
                icon={Target}
                color="from-rose-500 to-rose-600"
              >
                <div className="space-y-4">
                  <p className="text-slate-400 text-sm mb-4">
                    Practice these rapid-fire questions. Think of your answer first, then check the ideal response.
                  </p>
                  {guide.section8_mockInterview.questions?.map((q: any, i: number) => (
                    <div key={i} className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {i + 1}
                        </span>
                        <h4 className="font-semibold text-white">{q.question}</h4>
                      </div>
                      <div className="ml-11 space-y-3">
                        <div className="bg-emerald-900/20 rounded-xl p-4 border border-emerald-500/30">
                          <p className="text-xs text-emerald-400 font-semibold uppercase mb-2">Ideal Answer</p>
                          <p className="text-slate-200 text-sm">{q.idealAnswer}</p>
                        </div>
                        {q.feedback && (
                          <div className="flex items-start gap-2 text-sm text-amber-400">
                            <Lightbulb size={16} className="flex-shrink-0 mt-0.5" />
                            <span>{q.feedback}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionAccordion>
            )}
          </div>

          {/* Bottom CTA */}
          <div className="text-center py-8">
            <p className="text-slate-400 mb-4">
              Ready to practice? Start a voice session with our AI Interview Coach.
            </p>
            <Link href="/train/hr">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Start HR Interview Practice →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const InterviewGuidePage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    }>
      <InterviewGuidePageContent />
    </Suspense>
  );
};

export default InterviewGuidePage;
