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
  Search,
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

const SECTION_ORDER = [
  "section1_preparation",
  "section2_introduction",
  "section3_hrQuestions",
  "section4_technicalQuestions",
  "section5_companySpecific",
  "section6_communication",
  "section7_cheatSheet",
  "section8_mockInterview",
] as const;

type SectionId = (typeof SECTION_ORDER)[number];

const SectionAccordion = ({
  title,
  icon: Icon,
  color,
  children,
  defaultOpen = false,
  isVisible = false,
  animationDelay = 0,
  isOpen = false,
  onToggle,
  sectionId,
}: {
  title: string;
  icon: React.ElementType;
  color: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isVisible?: boolean;
  animationDelay?: number;
  isOpen?: boolean;
  onToggle?: () => void;
  sectionId?: string;
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const isControlled = isOpen !== undefined;
  const currentIsOpen = isControlled ? isOpen : internalIsOpen;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  return (
    <div 
      className={`group bg-slate-900/40 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 overflow-hidden ${
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${animationDelay}ms`, transitionProperty: 'opacity, transform' }}
      data-section-id={sectionId}
    >
      <button
        onClick={handleToggle}
        className="w-full p-5 md:p-6 flex items-center justify-between hover:bg-white/5 transition-colors duration-300"
      >
        <div className="flex items-center gap-4 md:gap-5">
          <div
            className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500 flex-shrink-0`}
          >
            <Icon size={22} className="text-white drop-shadow-md md:size-26" />
          </div>
          <h2 className="text-lg md:text-2xl font-black text-white tracking-tight text-left">
            {title}
          </h2>
        </div>
        <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 transition-all duration-300 ${currentIsOpen ? "bg-indigo-500/20 border-indigo-500/30" : ""}`}>
           <ChevronUp size={18} className={`text-slate-400 transition-all duration-300 ${currentIsOpen ? "text-indigo-400 transform rotate-180" : ""} md:size-20`} />
        </div>
      </button>
      <div 
        className={`px-4 md:px-6 lg:px-8 overflow-hidden transition-all duration-500 ease-in-out ${currentIsOpen ? "max-h-[5000px] opacity-100 pb-6 md:pb-8 pt-2" : "max-h-0 opacity-0"}`}
      >
        <div className="border-t border-white/5 pt-4 md:pt-6">
          {children}
        </div>
      </div>
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
      className={`group/copy relative p-2.5 rounded-xl border transition-all duration-300 ${
        copied 
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
          : "bg-slate-800/40 border-white/5 text-slate-400 hover:border-blue-500/30 hover:bg-slate-800/60 hover:text-blue-400"
      }`}
      title="Copy to clipboard"
    >
      <div className="relative">
        {copied ? (
          <Check size={16} className="animate-in zoom-in duration-300" />
        ) : (
          <Copy size={16} className="group-hover/copy:scale-110 transition-transform" />
        )}
      </div>
      {copied && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-md animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-none">
          COPIED
        </span>
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
  <div className="group bg-slate-900/60 backdrop-blur-xl rounded-3xl p-7 border border-white/[0.08] hover:border-blue-500/40 hover:bg-slate-900/80 transition-all duration-500 shadow-xl hover:shadow-blue-500/10 relative overflow-hidden">
    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-start gap-5">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-lg font-black flex-shrink-0 border border-blue-500/20 group-hover:scale-110 transition-transform duration-500 shadow-inner">
          {index}
        </div>
        <h4 className="font-black text-white text-xl leading-tight group-hover:text-blue-50 transition-colors duration-300">
          {question}
        </h4>
      </div>
      <CopyButton text={answer} />
    </div>
    <div className="ml-16 space-y-5">
      <div className="relative">
        <div className="absolute -left-6 top-0 bottom-0 w-px bg-white/5" />
        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-base font-medium">
          {answer}
        </p>
      </div>
      {tips && (
        <div className="flex items-start gap-4 p-5 rounded-[1.4rem] bg-indigo-500/5 border border-indigo-500/10 text-sm text-indigo-200/90 leading-relaxed animate-in fade-in slide-in-from-left-4 duration-700">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
            <Lightbulb size={20} className="text-indigo-400" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Expert Advice</span>
            <p>{tips}</p>
          </div>
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
}) => {
  // Split content into lines/paragraphs for better readability
  const contentLines = content.split('\n').filter(line => line.trim());
  
  return (
    <div className="relative group bg-slate-900/60 backdrop-blur-2xl rounded-[2rem] p-6 md:p-8 border border-white/[0.08] hover:border-indigo-500/40 transition-all duration-500 overflow-hidden shadow-xl h-full flex flex-col">
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-[80px] -z-10 rounded-full group-hover:bg-indigo-500/10 transition-colors duration-700"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 blur-[60px] -z-10 rounded-full"></div>
      
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner flex-shrink-0">
            {icon}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-0.5">Duration</span>
            <span className="font-black text-white text-sm tracking-tight">{duration}</span>
          </div>
        </div>
        <CopyButton text={content} />
      </div>
      
      <div className="relative pl-4 md:pl-6 flex-grow">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-transparent opacity-30 rounded-full" />
        <div className="space-y-3 md:space-y-4">
          {contentLines.map((line, index) => (
            <p key={index} className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm md:text-base font-medium">
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["section1_preparation"])
  );
  const [unlockedSectionCount, setUnlockedSectionCount] = useState(1);
  const [visibleIntroCards, setVisibleIntroCards] = useState(1);

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

  useEffect(() => {
    if (!guide) return;
    setUnlockedSectionCount(1);
    setExpandedSections(new Set(["section1_preparation"]));
    setVisibleIntroCards(1);
  }, [guide]);

  const unlockNextSection = (sectionId: SectionId) => {
    const currentIndex = SECTION_ORDER.indexOf(sectionId);
    if (currentIndex < 0) return;

    setUnlockedSectionCount((prev) => {
      if (prev !== currentIndex + 1) {
        return prev;
      }
      return Math.min(prev + 1, SECTION_ORDER.length);
    });
  };

  const handleSectionToggle = (sectionId: SectionId) => {
    const shouldUnlockNext = !expandedSections.has(sectionId);

    setExpandedSections((prev) => {
      const next = new Set(prev);
      const isCurrentlyExpanded = next.has(sectionId);

      if (isCurrentlyExpanded) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }

      return next;
    });

    if (shouldUnlockNext) {
      unlockNextSection(sectionId);
    }
  };

  useEffect(() => {
    if (!guide) return;

    const currentSectionId = SECTION_ORDER[unlockedSectionCount - 1];
    if (!currentSectionId) return;

    const currentSectionElement = document.querySelector(
      `[data-section-id="${currentSectionId}"]`
    );

    if (!currentSectionElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const currentEntry = entries[0];
        if (currentEntry?.isIntersecting) {
          unlockNextSection(currentSectionId);
        }
      },
      {
        threshold: 0.4,
      }
    );

    observer.observe(currentSectionElement);

    return () => observer.disconnect();
  }, [guide, unlockedSectionCount]);

  const isSectionVisible = (sectionId: SectionId) =>
    SECTION_ORDER.indexOf(sectionId) < unlockedSectionCount;
  const isSectionExpanded = (sectionId: SectionId) => expandedSections.has(sectionId);

  useEffect(() => {
    if (!guide?.section2_introduction || !isSectionVisible("section2_introduction")) {
      return;
    }

    const introOrder = ["short30sec", "medium60sec", "long90sec"] as const;
    const availableIntroCards = introOrder.filter(
      (key) => !!guide.section2_introduction[key]
    );

    if (availableIntroCards.length === 0 || visibleIntroCards >= availableIntroCards.length) {
      return;
    }

    const currentCardKey = availableIntroCards[visibleIntroCards - 1];
    const currentCard = document.querySelector(`[data-intro-card="${currentCardKey}"]`);
    if (!currentCard) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setVisibleIntroCards((prev) => Math.min(prev + 1, availableIntroCards.length));
        }
      },
      { threshold: 0.65 }
    );

    observer.observe(currentCard);
    return () => observer.disconnect();
  }, [guide, visibleIntroCards, isSectionVisible("section2_introduction")]);

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
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Radial Glows - Oceanic Future Theme */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] -z-10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/10 blur-[120px] -z-10 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-center md:text-left">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 shadow-inner">
                  <Sparkles size={16} className="text-blue-400" />
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">
                    AI-Powered Expert Coaching
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                  Interview Strategy <br className="hidden md:block" />
                  <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 !bg-clip-text text-transparent">
                    Generator
                  </span>
                </h1>
                <p className="text-slate-400 md:text-lg max-w-2xl leading-relaxed">
                  Tailored preparation for your specific background and target role.
                  <span className="text-cyan-400 font-bold ml-1.5 italic">"Master your next big step."</span>
                </p>
              </div>
              <Link href="/interview-guide/history">
                <Button variant="ghost" className="h-12 px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-300 transition-all duration-300 hover:scale-105 active:scale-95">
                  <History size={18} className="mr-2.5 text-blue-400" />
                  View History
                </Button>
              </Link>
            </div>

          {/* Main Form Card */}
          <div className="relative group max-w-4xl mx-auto">
            {/* Premium Glow Aura */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 rounded-[3.5rem] blur opacity-15 group-hover:opacity-25 transition duration-1000 group-hover:duration-300"></div>
            
            <Card className="relative border-white/[0.08] bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] shadow-2xl overflow-hidden ring-1 ring-white/10">
              <CardHeader className="p-8 md:p-10 pb-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
                  <CardTitle className="flex items-center gap-5 text-white text-2xl font-black tracking-tight">
                    <div className="w-14 h-14 rounded-[1.4rem] bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20 ring-1 ring-white/20">
                      <Target className="text-white" size={28} />
                    </div>
                    Configure Preparation
                  </CardTitle>
                  <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-800/80 border border-white/10 shadow-inner">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Context Analyzer Active</span>
                  </div>
                </div>
                <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-lg mt-2">
                  Provide your target details below. Our AI will analyze the job description to build a custom-tailored interview roadmap.
                </p>
              </CardHeader>
              <CardContent className="p-8 md:p-10 pt-4 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3.5">
                    <label className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500 ml-1 flex items-center gap-2.5">
                       <div className="w-5 h-5 rounded-md bg-blue-500/10 flex items-center justify-center">
                         <Target size={12} className="text-blue-400" />
                       </div>
                       Target Role <span className="text-rose-500/80 font-bold">*</span>
                    </label>
                    <Input
                      placeholder="e.g., Senior Full Stack Engineer"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="bg-slate-950/50 border-white/[0.08] h-16 px-6 rounded-2xl text-white font-bold placeholder:text-slate-600 focus:bg-slate-950 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all duration-300 shadow-inner"
                    />
                  </div>
                  <div className="space-y-3.5">
                    <label className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500 ml-1 flex items-center gap-2.5">
                       <div className="w-5 h-5 rounded-md bg-slate-500/10 flex items-center justify-center">
                         <Building2 size={12} className="text-slate-400" />
                       </div>
                       Company <span className="text-slate-700 font-bold">(Optional)</span>
                    </label>
                    <Input
                      placeholder="e.g., Google, Stripe, Netflix"
                      value={targetCompany}
                      onChange={(e) => setTargetCompany(e.target.value)}
                      className="bg-slate-950/50 border-white/[0.08] h-16 px-6 rounded-2xl text-white font-bold placeholder:text-slate-600 focus:bg-slate-950 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all duration-300 shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-3.5">
                  <label className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500 ml-1 flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-cyan-500/10 flex items-center justify-center">
                      <Languages size={12} className="text-cyan-400" />
                    </div>
                    Communication Level
                  </label>
                  <Select
                    value={communicationLevel}
                    onValueChange={setCommunicationLevel}
                  >
                    <SelectTrigger className="bg-slate-950/50 border-white/[0.08] h-16 px-6 rounded-2xl text-white font-bold focus:bg-slate-950 focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/40 transition-all duration-300 shadow-inner group">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 rounded-[1.4rem] p-2 shadow-2xl backdrop-blur-xl">
                      {[
                        { val: "Beginner", label: "Beginner", sub: "Clear & simple communication style" },
                        { val: "Intermediate", label: "Intermediate", sub: "Professional workplace fluency" },
                        { val: "Advanced", label: "Advanced", sub: "Strategic & high-impact articulation" }
                      ].map((lvl) => (
                        <SelectItem key={lvl.val} value={lvl.val} className="rounded-xl py-3.5 px-4 focus:bg-white/5 data-[state=selected]:bg-blue-500/10 transition-colors">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-white text-base">{lvl.label}</span>
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{lvl.sub}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500 flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-md bg-indigo-500/10 flex items-center justify-center">
                        <FileText size={12} className="text-indigo-400" />
                      </div>
                      Job Description <span className="text-rose-500/80 font-bold">*</span>
                    </label>
                    <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2">
                      <Sparkles size={12} className="text-indigo-400" />
                      <span className="text-[10px] font-black uppercase tracking-tight text-indigo-300">Deep AI Analysis</span>
                    </div>
                  </div>
                  <Textarea
                    placeholder="Paste the full JD. The more detail you provide, the better your guide will be..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="bg-slate-950/50 border-white/[0.08] min-h-[220px] p-7 rounded-[2rem] text-white font-medium placeholder:text-slate-700 focus:bg-slate-950 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all duration-300 shadow-inner resize-none leading-relaxed text-lg"
                  />
                  <div className="flex items-center gap-3 ml-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40 shadow-glow shadow-indigo-500/20"></div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] leading-relaxed">
                      Pro Tip: Include specific requirements like <span className="text-slate-300">Tech Stack</span> or <span className="text-slate-300">Soft Skills</span>.
                    </p>
                  </div>
                </div>

                {/* Usage Card - Modern Dark UI */}
                {usage && (
                  <div className={`relative group/usage p-7 rounded-[2.2rem] border transition-all duration-700 overflow-hidden ${
                    !usage.canGenerate 
                      ? "bg-rose-500/5 border-rose-500/20 shadow-inner" 
                      : "bg-blue-500/5 border-white/[0.06] shadow-inner"
                  }`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] rounded-full group-hover/usage:bg-blue-500/10 transition-colors"></div>
                    
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-500 ${!usage.canGenerate ? "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30" : "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20"}`}>
                          <Star size={24} className={usage.plan === "PRO" ? "animate-pulse" : ""} />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">
                            Account Status
                          </span>
                          <p className="text-lg font-black text-white tracking-tight uppercase">{usage.plan} Tier</p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Quota Remaining</span>
                        <div className={`text-2xl font-black tracking-tighter ${!usage.canGenerate ? "text-rose-400" : "text-white"}`}>
                          {usage.remaining === "Unlimited" ? "∞" : usage.remaining}
                          <span className="text-xs font-black text-slate-600 ml-1 uppercase">Gen Left</span>
                        </div>
                      </div>
                    </div>
                    {!usage.canGenerate && (
                      <div className="relative mt-6 flex items-center gap-4 p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 animate-in bounce-in duration-500">
                        <AlertTriangle size={20} className="text-rose-500 shrink-0" />
                        <p className="text-xs text-rose-200 font-bold uppercase tracking-tight">
                          Limit Reached! <Link href="/pricing" className="text-blue-400 hover:text-blue-300 underline decoration-2 underline-offset-4 transition-colors">Upgrade for Unlimited Access</Link>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-4 text-sm font-bold animate-in slide-in-from-top-4 duration-500 shadow-lg">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
                      <AlertTriangle size={20} className="text-rose-400 animate-pulse" />
                    </div>
                    {error}
                  </div>
                )}

                <div className="pt-4">
                  {!usage?.canGenerate ? (
                    <Button
                      onClick={() => router.push("/pricing")}
                      className="w-full h-20 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] text-white font-black uppercase tracking-[0.25em] text-sm rounded-3xl shadow-[0_20px_40px_-10px_rgba(245,158,11,0.3)] transition-all duration-500 ring-1 ring-white/10"
                    >
                      <AlertTriangle className="w-6 h-6 mr-3.5" />
                      Upgrade Plan to Generate
                    </Button>
                  ) : (
                    <Button
                      onClick={generateGuide}
                      disabled={loading || !targetRole || !jobDescription || jobDescription.trim().length < 50}
                      className="w-full h-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:shadow-[0_20px_50px_-10px_rgba(37,99,235,0.4)] active:scale-[0.98] text-white font-black uppercase tracking-[0.25em] text-sm rounded-3xl transition-all duration-500 disabled:opacity-30 disabled:grayscale group ring-1 ring-white/10 relative overflow-hidden"
                    >
                       {/* Button Gloss Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      
                      {loading ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin mr-3.5" />
                          Crafting Your Strategy...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-6 h-6 mr-3.5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500" />
                          Generate Expert Strategy
                        </>
                      )}
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-center gap-10 pt-4">
                  <div className="flex flex-col items-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Trusted By</p>
                    <span className="text-sm font-black text-blue-500 tracking-tight">500,000+ Candidates</span>
                  </div>
                  <div className="w-px h-8 bg-white/5" />
                  <div className="flex flex-col items-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">AI Precision</p>
                    <span className="text-sm font-black text-cyan-500 tracking-tight">GPT-4 Optimized</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Premium Feature Icons Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-10">
            {[
              { icon: User, title: "Personalized", desc: "Strategy built around your specific projects and career path.", color: "blue" },
              { icon: Search, title: "JD Analysis", desc: "AI decodes what recruiters are actually looking for.", color: "cyan" },
              { icon: Download, title: "PDF Mastery", desc: "Download & carry your expert guidebook everywhere.", color: "indigo" }
            ].map((f, i) => (
              <div key={i} className="group bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/5 hover:border-white/10 hover:bg-slate-900/60 transition-all duration-500 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500 ring-1 ring-white/5 shadow-2xl relative ${
                  f.color === "blue" ? "bg-blue-500/10" : f.color === "cyan" ? "bg-cyan-500/10" : "bg-indigo-500/10"
                }`}>
                  <div className={`absolute inset-0 blur-xl opacity-0 group-hover:opacity-100 transition-opacity ${
                    f.color === "blue" ? "bg-blue-500/20" : f.color === "cyan" ? "bg-cyan-500/20" : "bg-indigo-500/20"
                  }`} />
                  <f.icon className={`relative z-10 ${
                    f.color === "blue" ? "text-blue-400" : f.color === "cyan" ? "text-cyan-400" : "text-indigo-400"
                  }`} size={30} />
                </div>
                <h4 className="text-white font-black text-sm uppercase tracking-[0.25em] mb-3">{f.title}</h4>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Guide display view
  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Radial Glows - Dynamic Oceanic Palette */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 blur-[130px] -z-10 rounded-full animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 blur-[130px] -z-10 rounded-full animate-pulse" style={{ animationDelay: '3s' }}></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-8 pb-4">
            <div className="space-y-5">
              <button
                onClick={() => {
                  setGuide(null);
                  setCurrentGuideId(null);
                  router.push("/interview-guide");
                }}
                className="group flex items-center gap-3 text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] hover:text-blue-400 transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center group-hover:border-blue-500/40 group-hover:bg-blue-500/10 transition-all">
                  <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                </div>
                Generate New Roadmap
              </button>
              <div className="space-y-2">
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                  Your Interview <br className="hidden md:block" />
                  <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 !bg-clip-text text-transparent">
                    Strategic Guide
                  </span>
                </h1>
                <p className="text-slate-400 text-lg font-medium max-w-3xl leading-relaxed">
                  Engineered for <span className="text-blue-400 font-bold">{userProfile?.name}</span> • 
                  Targeting <span className="text-indigo-400 font-bold">{userProfile?.targetRole}</span>
                  {userProfile?.targetCompany && (
                    <>
                      <span className="mx-2 text-slate-700">at</span>
                      <span className="text-cyan-400 font-black tracking-tight">{userProfile?.targetCompany}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link href="/interview-guide/history">
                <Button variant="ghost" className="h-14 px-6 bg-slate-900/40 hover:bg-slate-800/60 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-300 transition-all hover:scale-105 active:scale-95">
                  <History size={20} className="mr-3 text-indigo-400" />
                  Archive
                </Button>
              </Link>
              <Button
                onClick={downloadPDF}
                disabled={pdfLoading}
                className="h-14 px-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:shadow-[0_15px_30px_-10px_rgba(37,99,235,0.3)] rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ring-1 ring-white/10"
              >
                {pdfLoading ? (
                  <Loader2 size={18} className="animate-spin mr-3" />
                ) : (
                  <Download size={18} className="mr-3" />
                )}
                Export PDF
              </Button>
            </div>
          </div>

          {/* Contextual Badges */}
          <div className="flex flex-wrap items-center gap-3 p-1">
            {[
              { label: userProfile?.experienceLevel, color: "blue", icon: Target },
              { label: `${communicationLevel} Communication`, color: "cyan", icon: Languages },
              { label: "8 Multi-Dimensional Sections", color: "indigo", icon: Sparkles }
            ].map((badge, idx) => (
              <div key={idx} className={`flex items-center gap-2.5 px-4 py-2 rounded-xl ${
                badge.color === "blue" ? "bg-blue-500/5 border border-blue-500/20 text-blue-300" :
                badge.color === "cyan" ? "bg-cyan-500/5 border border-cyan-500/20 text-cyan-300" :
                "bg-indigo-500/5 border border-indigo-500/20 text-indigo-300"
              } text-[11px] font-black uppercase tracking-widest shadow-inner`}>
                <badge.icon size={14} className={badge.color === "blue" ? "text-blue-400" : badge.color === "cyan" ? "text-cyan-400" : "text-indigo-400"} />
                {badge.label}
              </div>
            ))}
          </div>

          {/* Guide Sections Grid */}
          <div className="grid grid-cols-1 gap-8 md:gap-10">
            {/* Section 1: Preparation */}
            {guide.section1_preparation && isSectionVisible("section1_preparation") && (
              <SectionAccordion
                title={guide.section1_preparation.title || "Pre-Interview Blueprint"}
                icon={BookOpen}
                color="from-blue-600 to-indigo-600"
                defaultOpen={true}
                sectionId="section1_preparation"
                isVisible={isSectionVisible("section1_preparation")}
                animationDelay={0}
                isOpen={isSectionExpanded("section1_preparation")}
                onToggle={() => handleSectionToggle("section1_preparation")}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-2">
                  {guide.section1_preparation.oneDayBefore && (
                    <div className="space-y-5 p-7 rounded-[2rem] bg-slate-950/40 border border-white/[0.05] shadow-inner relative overflow-hidden group/prep">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/30 group-hover/prep:bg-blue-500 transition-colors" />
                      <h3 className="font-black text-xl text-white flex items-center gap-3">
                        <Clock size={22} className="text-blue-400" />
                        24 Hours Remaining
                      </h3>
                      <ul className="space-y-4">
                        {guide.section1_preparation.oneDayBefore.map(
                          (tip: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-slate-400 text-sm font-medium leading-relaxed">
                              <CheckCircle2 size={18} className="text-blue-500/60 flex-shrink-0 mt-0.5" />
                              {tip}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {guide.section1_preparation.oneHourBefore && (
                    <div className="space-y-5 p-7 rounded-[2rem] bg-slate-950/40 border border-white/[0.05] shadow-inner relative overflow-hidden group/prep">
                      <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/30 group-hover/prep:bg-amber-500 transition-colors" />
                      <h3 className="font-black text-xl text-white flex items-center gap-3">
                        <Clock size={22} className="text-amber-400" />
                        Final Countdown
                      </h3>
                      <ul className="space-y-4">
                        {guide.section1_preparation.oneHourBefore.map(
                          (tip: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-slate-400 text-sm font-medium leading-relaxed">
                              <CheckCircle2 size={18} className="text-amber-400/60 flex-shrink-0 mt-0.5" />
                              {tip}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {guide.section1_preparation.duringInterview && (
                    <div className="md:col-span-2 space-y-6 pt-4">
                      <h3 className="font-black text-xl text-white flex items-center gap-3 ml-2">
                        <Sparkles size={22} className="text-cyan-400" />
                        In-The-Moment Strategies
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(guide.section1_preparation.duringInterview).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="bg-slate-900/40 rounded-3xl p-6 border border-white/[0.05] hover:border-cyan-500/30 transition-all duration-300"
                            >
                              <h4 className="font-black text-[10px] text-cyan-400 uppercase tracking-[0.2em] mb-3">{key}</h4>
                              <p className="text-slate-300 text-sm font-medium leading-relaxed">{value as string}</p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {guide.section1_preparation.commonMistakes && (
                    <div className="md:col-span-2 space-y-5 p-7 rounded-[2rem] bg-rose-500/5 border border-rose-500/10 shadow-inner group/prep">
                       <h3 className="font-black text-xl text-white flex items-center gap-3">
                        <AlertTriangle size={22} className="text-rose-500" />
                        Critical Pitfalls to Avoid
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                        {guide.section1_preparation.commonMistakes.map(
                          (mistake: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-slate-400 text-sm font-medium leading-relaxed list-none">
                              <span className="text-rose-500 font-bold">×</span>
                              {mistake}
                            </li>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {guide.section1_preparation.starMethod && (
                    <div className="md:col-span-2 space-y-6 pt-4">
                      <div className="flex items-center gap-4 mb-2">
                         <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                           <Star size={20} className="text-indigo-400" />
                         </div>
                        <h3 className="font-black text-2xl text-white tracking-tight">
                          STAR Framework Integration
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        {Object.entries(guide.section1_preparation.starMethod).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-white/[0.05] hover:border-indigo-500/30 transition-all duration-300 group/star"
                            >
                              <h4 className="font-black text-xs text-indigo-400 uppercase tracking-[0.2em] mb-3 group-hover/star:text-indigo-300">
                                {key}
                              </h4>
                              <p className="text-slate-300 text-sm font-medium leading-relaxed leading-snug">{value as string}</p>
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
            {guide.section2_introduction && isSectionVisible("section2_introduction") && (
              <SectionAccordion
                title={guide.section2_introduction.title || "The Narrative (Self-Intro)"}
                icon={User}
                color="from-indigo-600 to-indigo-700"
                sectionId="section2_introduction"
                isVisible={isSectionVisible("section2_introduction")}
                animationDelay={150}
                isOpen={isSectionExpanded("section2_introduction")}
                onToggle={() => handleSectionToggle("section2_introduction")}
              >
                <div className="grid grid-cols-1 gap-6 md:gap-8 py-2">
                  {/* Introduction Cards Grid */}
                  <div className="grid grid-cols-1 gap-6 md:gap-8">
                    {guide.section2_introduction.short30sec && visibleIntroCards >= 1 && (
                      <div
                        className="h-full animate-in fade-in slide-in-from-bottom-4 duration-500"
                        data-intro-card="short30sec"
                      >
                        <IntroductionCard
                          duration="30 Seconds"
                          content={guide.section2_introduction.short30sec}
                          icon={<Clock size={22} className="text-blue-400" />}
                        />
                      </div>
                    )}
                    {guide.section2_introduction.medium60sec && visibleIntroCards >= 2 && (
                      <div
                        className="h-full animate-in fade-in slide-in-from-bottom-4 duration-500"
                        data-intro-card="medium60sec"
                      >
                        <IntroductionCard
                          duration="1 Minute"
                          content={guide.section2_introduction.medium60sec}
                          icon={<Clock size={22} className="text-indigo-400" />}
                        />
                      </div>
                    )}
                    {guide.section2_introduction.long90sec && visibleIntroCards >= 3 && (
                      <div
                        className="h-full animate-in fade-in slide-in-from-bottom-4 duration-500"
                        data-intro-card="long90sec"
                      >
                        <IntroductionCard
                          duration="2 Minutes"
                          content={guide.section2_introduction.long90sec}
                          icon={<Clock size={22} className="text-cyan-400" />}
                        />
                      </div>
                    )}
                  </div>
                  
                  {guide.section2_introduction.tips && (
                    <div className="p-6 md:p-8 rounded-[2.5rem] bg-slate-900/60 border border-white/[0.08] shadow-2xl mt-4">
                      <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-6">
                         <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 flex-shrink-0">
                            <Lightbulb size={20} className="text-indigo-400 md:w-6 md:h-6" />
                         </div>
                        <h4 className="font-black text-lg md:text-xl text-white tracking-tight">Delivery Precision Tips</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 md:gap-x-12 gap-y-4 md:gap-y-6">
                        {guide.section2_introduction.tips.map((tip: string, i: number) => (
                          <div key={i} className="flex items-start gap-3 md:gap-4 text-slate-400 text-sm md:text-base font-medium leading-relaxed border-l-2 border-white/5 pl-4 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all rounded-r-lg p-2 -ml-2">
                            <span className="text-indigo-500 font-bold flex-shrink-0 w-5 h-5 flex items-center justify-center bg-indigo-500/10 rounded-full text-xs">{i + 1}</span>
                            <span className="flex-grow">{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </SectionAccordion>
            )}

            {/* Section 3: HR Questions */}
            {guide.section3_hrQuestions && isSectionVisible("section3_hrQuestions") && (
              <SectionAccordion
                title={guide.section3_hrQuestions.title || "HR Strategic Responses"}
                icon={MessageSquare}
                color="from-blue-600 to-indigo-600"
                sectionId="section3_hrQuestions"
                isVisible={isSectionVisible("section3_hrQuestions")}
                animationDelay={300}
                isOpen={isSectionExpanded("section3_hrQuestions")}
                onToggle={() => handleSectionToggle("section3_hrQuestions")}
              >
                <div className="grid grid-cols-1 gap-6 py-2">
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
            {guide.section4_technicalQuestions && isSectionVisible("section4_technicalQuestions") && (
              <SectionAccordion
                title={guide.section4_technicalQuestions.title || "Domain Expert Deep-Dive"}
                icon={Code}
                color="from-indigo-600 to-blue-600"
                sectionId="section4_technicalQuestions"
                isVisible={isSectionVisible("section4_technicalQuestions")}
                animationDelay={450}
                isOpen={isSectionExpanded("section4_technicalQuestions")}
                onToggle={() => handleSectionToggle("section4_technicalQuestions")}
              >
                <div className="space-y-10 py-2">
                  {["beginner", "intermediate", "advanced"].map(
                    (level) =>
                      guide.section4_technicalQuestions[level]?.length > 0 && (
                        <div key={level} className="space-y-6">
                          <div className="flex items-center gap-4 border-l-4 border-blue-500/30 pl-5">
                            <h3 className="font-black text-xl text-white tracking-tight uppercase">
                              {level} Proficiency
                            </h3>
                            <div className={`h-1 flex-1 bg-gradient-to-r ${level === 'beginner' ? 'from-blue-500/20 to-transparent' : level === 'intermediate' ? 'from-indigo-500/20 to-transparent' : 'from-cyan-500/20 to-transparent'}`} />
                          </div>
                          <div className="grid grid-cols-1 gap-6">
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
            {guide.section5_companySpecific && isSectionVisible("section5_companySpecific") && (
              <SectionAccordion
                title={guide.section5_companySpecific.title || "Institutional Alignment"}
                icon={Building2}
                color="from-indigo-700 to-blue-800"
                sectionId="section5_companySpecific"
                isVisible={isSectionVisible("section5_companySpecific")}
                animationDelay={600}
                isOpen={isSectionExpanded("section5_companySpecific")}
                onToggle={() => handleSectionToggle("section5_companySpecific")}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
                  {[    
                    { title: "Why This Company?", content: guide.section5_companySpecific.whyThisCompany, color: "blue", icon: Target },
                    { title: "Culture Integration", content: guide.section5_companySpecific.cultureFit, color: "indigo", icon: Sparkles },
                    { title: "Strategic Role Expectations", content: guide.section5_companySpecific.roleExpectations, color: "cyan", icon: Target },
                    { title: "Personal Value Addition", content: guide.section5_companySpecific.valueAddition, color: "blue", icon: Star }
                  ].map((item, idx) => item.content && (
                    <div key={idx} className="group/comp bg-slate-900/60 backdrop-blur-xl rounded-[2.2rem] p-8 border border-white/[0.08] hover:border-blue-500/30 transition-all duration-500 flex flex-col items-start gap-4">
                      <div className="w-full flex justify-between items-center mb-2">
                         <div className={`flex items-center gap-3 px-4 py-1.5 rounded-full ${
                           item.color === "blue" ? "bg-blue-500/10 border border-blue-500/20 text-blue-400" :
                           item.color === "indigo" ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400" :
                           "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"
                         }`}>
                            <item.icon size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{item.title}</span>
                         </div>
                         <CopyButton text={item.content} />
                      </div>
                      <p className="text-slate-300 text-base leading-relaxed font-medium italic">
                        "{item.content}"
                      </p>
                    </div>
                  ))}
                </div>
              </SectionAccordion>
            )}

            {/* Section 6: Communication */}
            {guide.section6_communication && isSectionVisible("section6_communication") && (
              <SectionAccordion
                title={guide.section6_communication.title || "Communication Refinement"}
                icon={Languages}
                color="from-cyan-600 to-indigo-600"
                sectionId="section6_communication"
                isVisible={isSectionVisible("section6_communication")}
                animationDelay={750}
                isOpen={isSectionExpanded("section6_communication")}
                onToggle={() => handleSectionToggle("section6_communication")}
              >
                <div className="grid grid-cols-1 gap-10 py-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {guide.section6_communication.fillerWordsToAvoid && (
                      <div className="space-y-4">
                        <h3 className="font-black text-lg text-white uppercase tracking-widest ml-1">Filler Suppression</h3>
                        <div className="flex flex-wrap gap-3">
                          {guide.section6_communication.fillerWordsToAvoid.map((word: string, i: number) => (
                            <span
                              key={i}
                              className="px-5 py-2 rounded-2xl bg-rose-500/5 text-rose-400 text-sm font-black border border-rose-500/10 shadow-inner group-hover:bg-rose-500/10 transition-colors"
                            >
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {guide.section6_communication.powerPhrases && (
                      <div className="space-y-4">
                        <h3 className="font-black text-lg text-white uppercase tracking-widest ml-1">High-Impact Phrasing</h3>
                        <div className="grid grid-cols-1 gap-3">
                          {guide.section6_communication.powerPhrases.map((phrase: string, i: number) => (
                            <div
                              key={i}
                              className="bg-indigo-500/5 hover:bg-indigo-500/10 rounded-2xl px-6 py-4 border border-indigo-500/20 text-indigo-300 text-sm font-medium transition-all"
                            >
                              &quot;{phrase}&quot;
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {guide.section6_communication.betterReplacements && (
                    <div className="space-y-6">
                      <h3 className="font-black text-lg text-white uppercase tracking-widest ml-1 text-center md:text-left">Strategic Vocabulary Upgrades</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {guide.section6_communication.betterReplacements.map((item: any, i: number) => (
                          <div
                            key={i}
                            className="bg-slate-900/60 rounded-2xl p-4 border border-white/[0.08] flex items-center justify-between group/vocab hover:border-blue-500/30 transition-all"
                          >
                            <span className="text-slate-500 line-through text-xs font-bold">{item.avoid}</span>
                            <div className="w-8 h-px bg-white/10" />
                            <span className="text-blue-400 text-sm font-black tracking-tight">{item.useInstead}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {guide.section6_communication.howToStartAnswers && (
                      <div className="p-8 rounded-[2.5rem] bg-slate-900/60 border border-white/[0.08] shadow-2xl">
                        <h4 className="font-black text-xl text-indigo-400 mb-6 uppercase tracking-widest">Mastering the Lead</h4>
                        <ul className="space-y-4">
                          {guide.section6_communication.howToStartAnswers.map((phrase: string, i: number) => (
                            <li key={i} className="text-slate-300 text-sm font-medium py-3 border-b border-white/[0.04] last:border-0">
                              • {phrase}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {guide.section6_communication.howToEndAnswers && (
                      <div className="p-8 rounded-[2.5rem] bg-slate-900/60 border border-white/[0.08] shadow-2xl">
                        <h4 className="font-black text-xl text-indigo-400 mb-6 uppercase tracking-widest">Closing for Impact</h4>
                        <ul className="space-y-4">
                          {guide.section6_communication.howToEndAnswers.map((phrase: string, i: number) => (
                            <li key={i} className="text-slate-300 text-sm font-medium py-3 border-b border-white/[0.04] last:border-0">
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
            {guide.section7_cheatSheet && isSectionVisible("section7_cheatSheet") && (
              <SectionAccordion
                title={guide.section7_cheatSheet.title || "Rapid Mastery Cheat Sheet"}
                icon={FileText}
                color="from-indigo-600 to-indigo-700"
                sectionId="section7_cheatSheet"
                isVisible={isSectionVisible("section7_cheatSheet")}
                animationDelay={900}
                isOpen={isSectionExpanded("section7_cheatSheet")}
                onToggle={() => handleSectionToggle("section7_cheatSheet")}
              >
                <div className="grid grid-cols-1 gap-10 py-2">
                  {guide.section7_cheatSheet.keyLinesToMemorize && (
                    <div className="space-y-5">
                      <h3 className="font-black text-lg text-white uppercase tracking-widest">High-Volume Retention Lines</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {guide.section7_cheatSheet.keyLinesToMemorize.map((line: string, i: number) => (
                          <div
                            key={i}
                            className="bg-indigo-500/5 hover:bg-indigo-500/10 rounded-2xl px-6 py-5 border border-indigo-500/20 flex items-center justify-between group/memo transition-all"
                          >
                            <p className="text-indigo-200 text-sm font-medium italic">&quot;{line}&quot;</p>
                            <CopyButton text={line} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {guide.section7_cheatSheet.oneLinerAnswers && (
                    <div className="space-y-5">
                      <h3 className="font-black text-lg text-white uppercase tracking-widest">Rapid Response Logic</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {guide.section7_cheatSheet.oneLinerAnswers.map((item: any, i: number) => (
                          <div key={i} className="bg-slate-950/40 rounded-3xl p-6 border border-white/[0.05] flex flex-col gap-4 group/logic hover:border-blue-500/30 transition-all">
                            <div className="flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                               <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Logic Point {i+1}</p>
                            </div>
                            <div>
                               <p className="text-slate-400 text-xs font-bold mb-2 group-hover/logic:text-slate-300 transition-colors">Q: {item.question}</p>
                               <p className="text-white text-sm font-black leading-snug">A: {item.answer}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {guide.section7_cheatSheet.finalChecklist && (
                    <div className="bg-gradient-to-br from-blue-600/10 to-indigo-600/5 backdrop-blur-xl rounded-[3rem] p-10 border border-white/10 shadow-3xl">
                      <h3 className="font-black text-2xl text-white mb-8 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                           <CheckCircle2 size={24} className="text-blue-400" />
                        </div>
                        The Executive Prep Checklist
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {guide.section7_cheatSheet.finalChecklist.map((item: string, i: number) => (
                          <div key={i} className="flex items-center gap-4 text-slate-300 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] transition-colors">
                            <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/30 shrink-0">
                               <CheckCircle2 size={12} className="text-blue-400" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-tight">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </SectionAccordion>
            )}

            {/* Section 8: Mock Interview */}
            {guide.section8_mockInterview && isSectionVisible("section8_mockInterview") && (
              <SectionAccordion
                title={guide.section8_mockInterview.title || "Rapid Fire Simulation"}
                icon={Target}
                color="from-rose-600 to-indigo-600"
                sectionId="section8_mockInterview"
                isVisible={isSectionVisible("section8_mockInterview")}
                animationDelay={1050}
                isOpen={isSectionExpanded("section8_mockInterview")}
                onToggle={() => handleSectionToggle("section8_mockInterview")}
              >
                <div className="grid grid-cols-1 gap-6 py-2">
                  <p className="text-slate-500 text-sm font-medium italic mb-2 px-1">
                    Execute these simulations through mental imagery. Check the Expert Analysis after formulating your response.
                  </p>
                  <div className="grid grid-cols-1 gap-6">
                    {guide.section8_mockInterview.questions?.map((q: any, i: number) => (
                      <div key={i} className="bg-slate-900/60 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/[0.08] shadow-2xl relative group/sim overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full" />
                        
                        <div className="flex items-start gap-5 mb-8">
                          <span className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-lg font-black shrink-0 border border-blue-500/20 ring-1 ring-white/10">
                            {i + 1}
                          </span>
                          <h4 className="font-black text-xl text-white tracking-tight pt-1 leading-snug">{q.question}</h4>
                        </div>
                        <div className="space-y-6 lg:ml-16">
                          <div className="p-6 rounded-3xl bg-slate-950/80 border border-white/[0.05] shadow-inner relative group/ideal">
                            <div className="absolute top-4 right-6 text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] opacity-40">Precision Answer</div>
                            <p className="text-slate-300 text-base leading-relaxed font-medium">{q.idealAnswer}</p>
                          </div>
                          {q.feedback && (
                            <div className="flex items-start gap-4 p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-sm text-blue-300/90 leading-relaxed font-medium italic">
                              <Lightbulb size={20} className="text-blue-400 shrink-0 mt-0.5" />
                              <span>{q.feedback}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionAccordion>
            )}
          </div>

          {/* Master Call to Action */}
          <div className="relative group/cta py-12 text-center max-w-4xl mx-auto rounded-[4rem] bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-transparent border border-white/[0.08] shadow-3xl overflow-hidden mt-12 mb-8">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none"></div>
            <div className="relative z-10 space-y-8 px-8">
              <div className="space-y-3">
                 <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Ready for Peak Performance?</h2>
                 <p className="text-slate-400 font-medium max-w-2xl mx-auto">
                   Bridge the gap between strategy and execution. Launch a real-time voice session with your AI Interview Coach.
                 </p>
              </div>
              <Link href="/train/hr" className="inline-block">
                <Button className="h-16 px-10 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 group/btn">
                  Launch Voice Training Session
                  <ArrowRight size={20} className="ml-3 group-hover/btn:translate-x-1.5 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InterviewGuidePage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 animate-pulse" />
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">Initializing Strategy Engine</p>
      </div>
    }>
      <InterviewGuidePageContent />
    </Suspense>
  );
};

export default InterviewGuidePage;
