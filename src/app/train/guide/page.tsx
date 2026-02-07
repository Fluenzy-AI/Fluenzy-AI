"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  ArrowLeft,
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
} from "lucide-react";

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

const InterviewGuidePage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [guide, setGuide] = useState<InterviewGuide | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [communicationLevel, setCommunicationLevel] = useState("Intermediate");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const generateGuide = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/interview-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole,
          targetCompany,
          strengths,
          weaknesses,
          communicationLevel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate guide");
      }

      const data = await response.json();
      setGuide(data.guide);
      setUserProfile(data.userProfile);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
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
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/train")}
            className="flex items-center gap-2 text-slate-400 font-bold text-sm hover:text-slate-300 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Modules
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-4">
            <Sparkles size={18} className="text-purple-400" />
            <span className="text-sm font-medium text-purple-300">
              AI-Powered Interview Preparation
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Ultimate Interview Guide
          </h1>
          <p className="text-slate-300 mt-3 text-base md:text-lg max-w-2xl mx-auto">
            Generate a personalized, memorizable interview preparation guide
            tailored to your background, skills, and target role.
          </p>
        </div>

        <Card className="max-w-2xl mx-auto border-slate-700/50 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <Target className="text-purple-400" />
              Configure Your Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Target Role *
                </label>
                <Input
                  placeholder="e.g., Software Engineer, Data Analyst"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Target Company (Optional)
                </label>
                <Input
                  placeholder="e.g., Google, Amazon, TCS"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  className="bg-slate-800/50 border-slate-700"
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
                <SelectTrigger className="bg-slate-800/50 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">
                    Beginner - Learning basics
                  </SelectItem>
                  <SelectItem value="Intermediate">
                    Intermediate - Comfortable speaking
                  </SelectItem>
                  <SelectItem value="Advanced">
                    Advanced - Fluent communicator
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Your Strengths (Optional)
              </label>
              <Textarea
                placeholder="e.g., Quick learner, team player, problem-solving skills..."
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                className="bg-slate-800/50 border-slate-700 min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Your Weaknesses (Optional)
              </label>
              <Textarea
                placeholder="e.g., Public speaking, time management..."
                value={weaknesses}
                onChange={(e) => setWeaknesses(e.target.value)}
                className="bg-slate-800/50 border-slate-700 min-h-[80px]"
              />
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-900/30 border border-red-500/30 text-red-300 flex items-center gap-3">
                <AlertTriangle size={20} />
                {error}
              </div>
            )}

            <div className="pt-2">
              <Button
                onClick={generateGuide}
                disabled={loading || !targetRole}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6 text-lg"
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
            </div>

            <p className="text-xs text-center text-slate-500">
              Note: Make sure your profile is complete with education, skills, projects, and
              experience for best results.{" "}
              <a
                href="/profile"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                Update Profile
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Guide display view
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <button
            onClick={() => setGuide(null)}
            className="flex items-center gap-2 text-slate-400 font-bold text-sm mb-4 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft size={16} />
            Generate New Guide
          </button>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Your Interview Guide
          </h1>
          <p className="text-slate-300 mt-2">
            Personalized for <span className="text-purple-400 font-semibold">{userProfile?.name}</span> |{" "}
            <span className="text-pink-400">{userProfile?.targetRole}</span>
            {userProfile?.targetCompany && (
              <> @ <span className="text-amber-400">{userProfile?.targetCompany}</span></>
            )}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-slate-700 hover:bg-slate-800"
            onClick={() => {
              const guideText = JSON.stringify(guide, null, 2);
              const blob = new Blob([guideText], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `interview-guide-${Date.now()}.json`;
              a.click();
            }}
          >
            <Download size={18} className="mr-2" />
            Download Guide
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
              {/* One Day Before */}
              {guide.section1_preparation.oneDayBefore && (
                <div>
                  <h3 className="font-bold text-lg text-white mb-3 flex items-center gap-2">
                    <Clock size={18} className="text-indigo-400" />
                    One Day Before Interview
                  </h3>
                  <ul className="space-y-2">
                    {guide.section1_preparation.oneDayBefore.map(
                      (tip: string, i: number) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-slate-300"
                        >
                          <CheckCircle2
                            size={18}
                            className="text-indigo-400 flex-shrink-0 mt-0.5"
                          />
                          {tip}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {/* One Hour Before */}
              {guide.section1_preparation.oneHourBefore && (
                <div>
                  <h3 className="font-bold text-lg text-white mb-3 flex items-center gap-2">
                    <Clock size={18} className="text-amber-400" />
                    One Hour Before Interview
                  </h3>
                  <ul className="space-y-2">
                    {guide.section1_preparation.oneHourBefore.map(
                      (tip: string, i: number) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-slate-300"
                        >
                          <CheckCircle2
                            size={18}
                            className="text-amber-400 flex-shrink-0 mt-0.5"
                          />
                          {tip}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {/* During Interview */}
              {guide.section1_preparation.duringInterview && (
                <div>
                  <h3 className="font-bold text-lg text-white mb-3">
                    During the Interview
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(guide.section1_preparation.duringInterview).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
                        >
                          <h4 className="font-semibold text-purple-300 capitalize mb-2">
                            {key}
                          </h4>
                          <p className="text-slate-300 text-sm">{value as string}</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Common Mistakes */}
              {guide.section1_preparation.commonMistakes && (
                <div>
                  <h3 className="font-bold text-lg text-white mb-3 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-red-400" />
                    Common Mistakes to Avoid
                  </h3>
                  <ul className="space-y-2">
                    {guide.section1_preparation.commonMistakes.map(
                      (mistake: string, i: number) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-slate-300"
                        >
                          <span className="text-red-400">✗</span>
                          {mistake}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {/* STAR Method */}
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
            title={guide.section2_introduction.title || "Personal Introduction"}
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
              {["beginner", "intermediate", "advanced"].map((level) => (
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
                      {guide.section4_technicalQuestions[level].map(
                        (q: any, i: number) => (
                          <QuestionCard
                            key={i}
                            question={q.question}
                            answer={q.answer}
                            index={i + 1}
                          />
                        )
                      )}
                    </div>
                  </div>
                )
              ))}
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
                  <h4 className="font-bold text-amber-300 mb-3">
                    Why This Company?
                  </h4>
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
                  <h4 className="font-bold text-purple-300 mb-3">
                    Culture Fit
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    {guide.section5_companySpecific.cultureFit}
                  </p>
                </div>
              )}
              {guide.section5_companySpecific.roleExpectations && (
                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                  <h4 className="font-bold text-emerald-300 mb-3">
                    Role Expectations
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    {guide.section5_companySpecific.roleExpectations}
                  </p>
                </div>
              )}
              {guide.section5_companySpecific.valueAddition && (
                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                  <h4 className="font-bold text-pink-300 mb-3">
                    How You Add Value
                  </h4>
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
              {/* Filler Words */}
              {guide.section6_communication.fillerWordsToAvoid && (
                <div>
                  <h3 className="font-bold text-lg text-white mb-3">
                    Filler Words to Avoid
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {guide.section6_communication.fillerWordsToAvoid.map(
                      (word: string, i: number) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full bg-red-900/30 text-red-300 text-sm border border-red-500/30"
                        >
                          {word}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Better Replacements */}
              {guide.section6_communication.betterReplacements && (
                <div>
                  <h3 className="font-bold text-lg text-white mb-3">
                    Better Replacements
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {guide.section6_communication.betterReplacements.map(
                      (item: any, i: number) => (
                        <div
                          key={i}
                          className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 flex items-center gap-3"
                        >
                          <span className="text-red-400 line-through text-sm">
                            {item.avoid}
                          </span>
                          <span className="text-slate-500">→</span>
                          <span className="text-emerald-400 text-sm font-medium">
                            {item.useInstead}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Power Phrases */}
              {guide.section6_communication.powerPhrases && (
                <div>
                  <h3 className="font-bold text-lg text-white mb-3 flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-400" />
                    Power Phrases
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {guide.section6_communication.powerPhrases.map(
                      (phrase: string, i: number) => (
                        <div
                          key={i}
                          className="bg-gradient-to-r from-amber-900/20 to-slate-900/50 rounded-xl px-4 py-3 border border-amber-500/30 text-amber-200 text-sm"
                        >
                          "{phrase}"
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* How to Start/End Answers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {guide.section6_communication.howToStartAnswers && (
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <h4 className="font-semibold text-emerald-300 mb-3">
                      How to Start Answers
                    </h4>
                    <ul className="space-y-2">
                      {guide.section6_communication.howToStartAnswers.map(
                        (phrase: string, i: number) => (
                          <li key={i} className="text-slate-300 text-sm">
                            • {phrase}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
                {guide.section6_communication.howToEndAnswers && (
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <h4 className="font-semibold text-purple-300 mb-3">
                      How to End Answers
                    </h4>
                    <ul className="space-y-2">
                      {guide.section6_communication.howToEndAnswers.map(
                        (phrase: string, i: number) => (
                          <li key={i} className="text-slate-300 text-sm">
                            • {phrase}
                          </li>
                        )
                      )}
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
              {/* Key Lines */}
              {guide.section7_cheatSheet.keyLinesToMemorize && (
                <div>
                  <h3 className="font-bold text-lg text-white mb-3">
                    Key Lines to Memorize
                  </h3>
                  <div className="space-y-2">
                    {guide.section7_cheatSheet.keyLinesToMemorize.map(
                      (line: string, i: number) => (
                        <div
                          key={i}
                          className="bg-gradient-to-r from-violet-900/30 to-slate-900/50 rounded-xl px-4 py-3 border border-violet-500/30 flex items-center justify-between"
                        >
                          <p className="text-violet-200 text-sm">"{line}"</p>
                          <CopyButton text={line} />
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* One-liner Answers */}
              {guide.section7_cheatSheet.oneLinerAnswers && (
                <div>
                  <h3 className="font-bold text-lg text-white mb-3">
                    Quick One-Liner Answers
                  </h3>
                  <div className="space-y-3">
                    {guide.section7_cheatSheet.oneLinerAnswers.map(
                      (item: any, i: number) => (
                        <div
                          key={i}
                          className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
                        >
                          <p className="text-slate-400 text-sm mb-1">
                            Q: {item.question}
                          </p>
                          <p className="text-white font-medium">
                            A: {item.answer}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Final Checklist */}
              {guide.section7_cheatSheet.finalChecklist && (
                <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900/50 rounded-2xl p-5 border border-emerald-500/30">
                  <h3 className="font-bold text-lg text-emerald-300 mb-4 flex items-center gap-2">
                    <CheckCircle2 size={20} />
                    Final Revision Checklist
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {guide.section7_cheatSheet.finalChecklist.map(
                      (item: string, i: number) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 text-slate-300"
                        >
                          <CheckCircle2
                            size={16}
                            className="text-emerald-400 flex-shrink-0 mt-0.5"
                          />
                          <span className="text-sm">{item}</span>
                        </div>
                      )
                    )}
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
                Practice these rapid-fire questions. Think of your answer first,
                then check the ideal response.
              </p>
              {guide.section8_mockInterview.questions?.map((q: any, i: number) => (
                <div
                  key={i}
                  className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <h4 className="font-semibold text-white">{q.question}</h4>
                  </div>
                  <div className="ml-11 space-y-3">
                    <div className="bg-emerald-900/20 rounded-xl p-4 border border-emerald-500/30">
                      <p className="text-xs text-emerald-400 font-semibold uppercase mb-2">
                        Ideal Answer
                      </p>
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
        <Button
          onClick={() => router.push("/train/hr")}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          Start HR Interview Practice →
        </Button>
      </div>
    </div>
  );
};

export default InterviewGuidePage;
