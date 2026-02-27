"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";
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
  ChevronLeft,
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
  Upload,
  BadgeCheck,
  PanelTopClose,
  PanelTopOpen,
  BarChart3,
  Calendar,
  Printer,
  LayoutGrid,
  Rows3,
  Circle,
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
type WizardStep = 1 | 2 | 3;

const FORM_DRAFT_STORAGE_KEY = "interview-guide-draft-v2";

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
      className={`group rounded-2xl border border-white/10 bg-slate-900/70 shadow-sm backdrop-blur-xl transition-all duration-300 overflow-hidden ${
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${animationDelay}ms`, transitionProperty: 'opacity, transform' }}
      data-section-id={sectionId}
    >
      <button
        onClick={handleToggle}
        className="w-full p-4 md:p-5 flex items-center justify-between hover:bg-white/5 transition-colors duration-200"
      >
        <div className="flex items-center gap-4 md:gap-5">
          <div
            className={`w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center transition-transform duration-300 flex-shrink-0`}
          >
            <Icon size={19} className="text-white" />
          </div>
          <h2 className="text-base md:text-lg font-semibold text-white tracking-tight text-left">
            {title}
          </h2>
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 transition-all duration-200 ${currentIsOpen ? "bg-indigo-500/15 border-indigo-500/30" : ""}`}>
           <ChevronUp size={16} className={`text-slate-400 transition-all duration-200 ${currentIsOpen ? "text-indigo-300 transform rotate-180" : ""}`} />
        </div>
      </button>
      <div 
        className={`px-4 md:px-5 lg:px-6 overflow-hidden transition-all duration-300 ease-in-out ${currentIsOpen ? "max-h-[5000px] opacity-100 pb-5 md:pb-6 pt-1" : "max-h-0 opacity-0"}`}
      >
        <div className="border-t border-white/10 pt-4 md:pt-5">
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
          : "bg-slate-800/40 border-white/5 text-slate-400 hover:border-blue-500/30 hover:bg-slate-800/60 hover:text-blue-300"
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
  <div className="group rounded-2xl bg-slate-950/40 p-5 border border-white/10 transition-colors duration-200 hover:border-blue-500/30">
    
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex items-start gap-4">
        <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-300 flex items-center justify-center text-sm font-semibold flex-shrink-0 border border-blue-500/20">
          {index}
        </div>
        <h4 className="font-semibold text-white text-base leading-snug">
          {question}
        </h4>
      </div>
      <CopyButton text={answer} />
    </div>
    <div className="ml-13 space-y-4">
      <div>
        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">
          {answer}
        </p>
      </div>
      {tips && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-100 leading-relaxed">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
            <Lightbulb size={16} className="text-indigo-300" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-300">Expert Advice</span>
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
    <div className="rounded-2xl p-5 md:p-6 border border-white/10 bg-slate-950/40 h-full flex flex-col">
      
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-indigo-300 uppercase tracking-[0.12em] mb-0.5">Duration</span>
            <span className="font-semibold text-white text-sm tracking-tight">{duration}</span>
          </div>
        </div>
        <CopyButton text={content} />
      </div>
      
      <div className="relative pl-4 md:pl-5 flex-grow">
        <div className="absolute left-0 top-0 bottom-0 w-px bg-indigo-500/40 rounded-full" />
        <div className="space-y-3 md:space-y-4">
          {contentLines.map((line, index) => (
            <p key={index} className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">
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
  const [experienceContext, setExperienceContext] = useState("");
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [jdAnalysisOpen, setJdAnalysisOpen] = useState(true);
  const [jdAnalyzing, setJdAnalyzing] = useState(false);
  const [jdSummary, setJdSummary] = useState("");
  const [jdInsights, setJdInsights] = useState<string[]>([]);
  const [jdFileName, setJdFileName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [activeIntroTab, setActiveIntroTab] = useState<"30" | "60" | "90">("30");
  const [expandedHrItems, setExpandedHrItems] = useState<Set<number>>(new Set());
  const [technicalFilter, setTechnicalFilter] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [expandedTechItems, setExpandedTechItems] = useState<Set<string>>(new Set());
  const [flippedMemoItems, setFlippedMemoItems] = useState<Set<number>>(new Set());
  const [checklistCompleted, setChecklistCompleted] = useState<Set<number>>(new Set());
  const [activeGuideSection, setActiveGuideSection] = useState<string>("preparation");
  const [completedGuideSections, setCompletedGuideSections] = useState<Set<string>>(new Set());
  const [compactView, setCompactView] = useState(false);
  const [lastPracticedAt, setLastPracticedAt] = useState<string>("");

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
    setChecklistCompleted(new Set());
    setCompletedGuideSections(new Set());
    setActiveGuideSection("preparation");
    setActiveIntroTab("30");
    setExpandedHrItems(new Set());
    setExpandedTechItems(new Set());
    setFlippedMemoItems(new Set());
    setTechnicalFilter("beginner");
    setLastPracticedAt(new Date().toLocaleString());
  }, [guide]);

  const guideNavSections = useMemo(
    () =>
      [
        { id: "preparation", label: "Preparation Strategy", visible: !!guide?.section1_preparation },
        { id: "star-method", label: "STAR Method", visible: !!guide?.section1_preparation?.starMethod },
        { id: "introduction", label: "Personal Introduction", visible: !!guide?.section2_introduction },
        { id: "hr-questions", label: "HR Questions", visible: !!guide?.section3_hrQuestions?.questions?.length },
        { id: "technical-questions", label: "Technical Questions", visible: !!guide?.section4_technicalQuestions },
        { id: "company-fit", label: "Company Fit", visible: !!guide?.section5_companySpecific },
        { id: "communication-upgrade", label: "Communication Upgrade", visible: !!guide?.section6_communication },
        { id: "rapid-memorization", label: "Rapid Memorization", visible: !!guide?.section7_cheatSheet },
        { id: "final-checklist", label: "Final Checklist", visible: !!guide?.section7_cheatSheet?.finalChecklist?.length },
      ].filter((item) => item.visible),
    [guide]
  );

  useEffect(() => {
    if (!guide || guideNavSections.length === 0) return;

    const observers: IntersectionObserver[] = [];
    guideNavSections.forEach((item) => {
      const sectionNode = document.getElementById(item.id);
      if (!sectionNode) return;

      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry?.isIntersecting) return;
          setActiveGuideSection(item.id);
          setCompletedGuideSections((prev) => {
            if (prev.has(item.id)) return prev;
            const next = new Set(prev);
            next.add(item.id);
            return next;
          });
        },
        { threshold: 0.4, rootMargin: "-20% 0px -40% 0px" }
      );

      observer.observe(sectionNode);
      observers.push(observer);
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, [guide, guideNavSections]);

  useEffect(() => {
    if (typeof window === "undefined" || guide) return;

    try {
      const savedDraft = window.localStorage.getItem(FORM_DRAFT_STORAGE_KEY);
      if (!savedDraft) return;

      const parsed = JSON.parse(savedDraft);
      if (parsed.targetRole) setTargetRole(parsed.targetRole);
      if (parsed.targetCompany) setTargetCompany(parsed.targetCompany);
      if (parsed.jobDescription) setJobDescription(parsed.jobDescription);
      if (parsed.communicationLevel) setCommunicationLevel(parsed.communicationLevel);
      if (parsed.experienceContext) setExperienceContext(parsed.experienceContext);
      if (parsed.currentStep && parsed.currentStep >= 1 && parsed.currentStep <= 3) {
        setCurrentStep(parsed.currentStep as WizardStep);
      }
    } catch (draftError) {
      console.error("Draft restore failed:", draftError);
    }
  }, [guide]);

  useEffect(() => {
    if (typeof window === "undefined" || guide) return;

    window.localStorage.setItem(
      FORM_DRAFT_STORAGE_KEY,
      JSON.stringify({
        targetRole,
        targetCompany,
        communicationLevel,
        experienceContext,
        jobDescription,
        currentStep,
      })
    );
  }, [
    targetRole,
    targetCompany,
    communicationLevel,
    experienceContext,
    jobDescription,
    currentStep,
    guide,
  ]);

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

  const markFieldTouched = (field: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  const processUploadedFile = (file: File) => {
    if (!file) return;

    const allowedTextExtensions = [".txt", ".md", ".json"];
    const lowerName = file.name.toLowerCase();
    const isPlainText = file.type.startsWith("text/") ||
      allowedTextExtensions.some((ext) => lowerName.endsWith(ext));

    setJdFileName(file.name);

    if (!isPlainText) {
      setError("Please upload a text-based JD file (.txt, .md, .json) or paste content manually.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setJobDescription(text);
      setError(null);
      markFieldTouched("jobDescription");
    };
    reader.onerror = () => {
      setError("Unable to read uploaded file. Please try another file.");
    };
    reader.readAsText(file);
  };

  const runJdAnalysis = async () => {
    if (!jobDescription.trim()) {
      setError("Add job description first to run Deep AI Analysis.");
      return;
    }

    setJdAnalyzing(true);
    setError(null);

    const jdText = jobDescription.trim();
    await new Promise((resolve) => setTimeout(resolve, 900));

    const normalized = jdText.replace(/\s+/g, " ").trim();
    const sentences = normalized
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    const summaryText =
      sentences.slice(0, 2).join(" ").slice(0, 220) ||
      normalized.slice(0, 220);

    const requirementMatches = [
      { label: "Responsibilities", regex: /(responsibilit|own|lead|deliver|execute)/i },
      { label: "Technical Skills", regex: /(react|node|python|java|sql|aws|cloud|api|typescript|docker)/i },
      { label: "Soft Skills", regex: /(communication|stakeholder|collaborat|leadership|team|problem)/i },
      { label: "Seniority Signals", regex: /(senior|lead|manager|principal|architect|years of experience)/i },
    ]
      .filter((item) => item.regex.test(normalized))
      .map((item) => item.label);

    setJdSummary(summaryText);
    setJdInsights(
      requirementMatches.length > 0
        ? requirementMatches
        : ["General Responsibilities", "Technical Expectations", "Communication Expectations"]
    );
    setJdAnalyzing(false);
  };

  const goNextStep = () => {
    if (currentStep === 1 && !targetRole.trim()) {
      markFieldTouched("targetRole");
      setError("Target role is required to continue.");
      return;
    }

    if (currentStep === 3 && (!jobDescription.trim() || jobDescription.trim().length < 50)) {
      markFieldTouched("jobDescription");
      setError("Please provide a complete job description (minimum 50 characters).");
      return;
    }

    setError(null);
    setCurrentStep((prev) => Math.min(3, prev + 1) as WizardStep);
  };

  const goPreviousStep = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(1, prev - 1) as WizardStep);
  };

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
        setLastPracticedAt(
          data.createdAt
            ? new Date(data.createdAt).toLocaleString()
            : new Date().toLocaleString()
        );
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
      setLastPracticedAt(new Date().toLocaleString());
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(FORM_DRAFT_STORAGE_KEY);
      }

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

  if (!guide) {
    const roleInvalid = touchedFields.targetRole && !targetRole.trim();
    const jdInvalid = touchedFields.jobDescription && jobDescription.trim().length < 50;
    const stepProgress = Math.round((currentStep / 3) * 100);
    const canSubmit = !!usage?.canGenerate && !!targetRole.trim() && jobDescription.trim().length >= 50;

    return (
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div className="space-y-6">
          <header className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 backdrop-blur-xl md:p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-300">
                  <Sparkles size={12} />
                  AI Powered
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                  Interview Strategy Generator
                </h1>
                <p className="text-sm text-slate-400">
                  Build an interview plan in 3 guided steps with role context and deep JD analysis.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/interview-guide/history">
                  <Button variant="ghost" className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-slate-200 hover:bg-white/10">
                    <History size={16} className="mr-2" />
                    History
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button variant="ghost" className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-slate-200 hover:bg-white/10">
                    <BarChart3 size={16} className="mr-2" />
                    Analytics
                  </Button>
                </Link>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Trusted by</p>
              <p className="mt-1 text-lg font-semibold text-white">500,000+ Candidates</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Model Precision</p>
              <p className="mt-1 text-lg font-semibold text-cyan-300">GPT-4 Optimized</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Analytics Badge</p>
              <p className="mt-1 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                <BadgeCheck size={14} />
                Live Success Tracking
              </p>
            </div>
          </div>

          <Card className="overflow-hidden rounded-2xl border-white/10 bg-slate-900/75 shadow-xl backdrop-blur-2xl">
            <CardHeader className="space-y-3 border-b border-white/10 p-5 md:p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-white md:text-lg">
                  Step {currentStep} of 3
                </CardTitle>
                <span className="text-xs font-medium text-slate-400">
                  {stepProgress}% complete
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/80">
                <div
                  className={`h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 ${
                    currentStep === 1 ? "w-1/3" : currentStep === 2 ? "w-2/3" : "w-full"
                  }`}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400">
                <div className={currentStep === 1 ? "text-white" : ""}>Role & Company</div>
                <div className={currentStep === 2 ? "text-white" : ""}>Communication Context</div>
                <div className={currentStep === 3 ? "text-white" : ""}>JD & Analysis</div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-5 md:p-6">
              {currentStep === 1 && (
                <section className="space-y-5 rounded-xl border border-white/10 bg-slate-950/40 p-4 md:p-5">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-white">Role & Company</h2>
                    <p className="text-sm text-slate-400">Set your target role and hiring context.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-300">
                        Target Role <span className="text-rose-400">*</span>
                      </label>
                      <Input
                        aria-required="true"
                        aria-invalid={roleInvalid}
                        placeholder="Senior Full Stack Engineer"
                        value={targetRole}
                        onBlur={() => markFieldTouched("targetRole")}
                        onChange={(e) => setTargetRole(e.target.value)}
                        className={`h-12 rounded-xl border bg-slate-900/80 text-white placeholder:text-slate-500 focus-visible:ring-2 ${
                          roleInvalid ? "border-rose-500/70 focus-visible:ring-rose-500/40" : "border-white/10 focus-visible:ring-blue-500/40"
                        }`}
                      />
                      {roleInvalid && <p className="text-xs text-rose-300">Target role is required.</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-300">
                        Company <span className="text-slate-500">(Optional)</span>
                      </label>
                      <Input
                        placeholder="Stripe, Google, Netflix"
                        value={targetCompany}
                        onChange={(e) => setTargetCompany(e.target.value)}
                        className="h-12 rounded-xl border border-white/10 bg-slate-900/80 text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500/40"
                      />
                    </div>
                  </div>
                </section>
              )}

              {currentStep === 2 && (
                <section className="space-y-5 rounded-xl border border-white/10 bg-slate-950/40 p-4 md:p-5">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-white">Communication & Experience Context</h2>
                    <p className="text-sm text-slate-400">Tune strategy depth for your interview narrative.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-300">Communication Level</label>
                      <Select value={communicationLevel} onValueChange={setCommunicationLevel}>
                        <SelectTrigger className="h-12 rounded-xl border border-white/10 bg-slate-900/80 text-white focus:ring-2 focus:ring-cyan-500/40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-white/10 bg-slate-900 text-white">
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-medium text-slate-300">Experience Context</label>
                      <Textarea
                        placeholder="Mention years of experience, domain projects, strengths, and goals..."
                        value={experienceContext}
                        onChange={(e) => setExperienceContext(e.target.value)}
                        className="min-h-[110px] rounded-xl border border-white/10 bg-slate-900/80 text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-cyan-500/40"
                      />
                    </div>
                  </div>
                </section>
              )}

              {currentStep === 3 && (
                <section className="space-y-5 rounded-xl border border-white/10 bg-slate-950/40 p-4 md:p-5">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-white">Job Description + AI Analysis</h2>
                    <p className="text-sm text-slate-400">
                      Add complete JD for better strategy quality. Minimum 50 characters required.
                    </p>
                  </div>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragActive(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) processUploadedFile(file);
                    }}
                    className={`rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
                      dragActive ? "border-blue-400 bg-blue-500/10" : "border-white/15 bg-slate-900/50"
                    }`}
                  >
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                      <Upload size={18} className="text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-200">Drag and drop JD file or upload text file</p>
                    <p className="mt-1 text-xs text-slate-500">Supported: .txt, .md, .json</p>
                    <label className="mt-3 inline-flex cursor-pointer items-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10">
                      Choose File
                      <input
                        type="file"
                        className="sr-only"
                        accept=".txt,.md,.json,text/plain,application/json"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) processUploadedFile(file);
                        }}
                      />
                    </label>
                    {jdFileName && <p className="mt-2 text-xs text-emerald-300">Loaded: {jdFileName}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-300">
                        Job Description <span className="text-rose-400">*</span>
                      </label>
                      <span className={`text-xs ${jobDescription.length < 50 ? "text-amber-300" : "text-emerald-300"}`}>
                        {jobDescription.length} characters
                      </span>
                    </div>
                    <Textarea
                      aria-required="true"
                      aria-invalid={jdInvalid}
                      value={jobDescription}
                      onBlur={() => markFieldTouched("jobDescription")}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste complete job description here..."
                      className={`min-h-[220px] rounded-xl border bg-slate-900/80 text-white placeholder:text-slate-500 focus-visible:ring-2 ${
                        jdInvalid ? "border-rose-500/70 focus-visible:ring-rose-500/40" : "border-white/10 focus-visible:ring-indigo-500/40"
                      }`}
                    />
                    {jdInvalid && (
                      <p className="text-xs text-rose-300">Add at least 50 characters to continue.</p>
                    )}
                  </div>

                  <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/70">
                    <button
                      onClick={() => setJdAnalysisOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between p-4 text-left"
                    >
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-white">
                        <Sparkles size={16} className="text-indigo-300" />
                        Deep AI Analysis
                      </span>
                      {jdAnalysisOpen ? (
                        <PanelTopClose size={16} className="text-slate-400" />
                      ) : (
                        <PanelTopOpen size={16} className="text-slate-400" />
                      )}
                    </button>
                    {jdAnalysisOpen && (
                      <div className="space-y-3 border-t border-white/10 p-4">
                        <Button
                          onClick={runJdAnalysis}
                          disabled={jdAnalyzing || !jobDescription.trim()}
                          className="h-10 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
                        >
                          {jdAnalyzing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Search className="mr-2 h-4 w-4" />
                              Analyze JD
                            </>
                          )}
                        </Button>
                        {jdSummary && (
                          <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                            <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Preview Summary</p>
                            <p className="mt-2 text-sm text-slate-300">{jdSummary}</p>
                          </div>
                        )}
                        {jdInsights.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {jdInsights.map((item) => (
                              <span key={item} className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-200">
                                {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {usage && (
                <div className={`rounded-xl border p-4 ${usage.canGenerate ? "border-white/10 bg-slate-900/50" : "border-rose-500/20 bg-rose-500/10"}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Account Tier</p>
                      <p className="text-sm font-semibold text-white">{usage.plan}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Quota Remaining</p>
                      <p className={`text-lg font-semibold ${usage.canGenerate ? "text-white" : "text-rose-300"}`}>
                        {usage.remaining === "Unlimited" ? "âˆž" : usage.remaining}
                      </p>
                    </div>
                  </div>
                  {!usage.canGenerate && (
                    <p className="mt-3 text-xs text-rose-200">
                      Limit reached. <Link href="/pricing" className="underline underline-offset-2">Upgrade plan</Link> to continue.
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="hidden items-center justify-between border-t border-white/10 pt-2 md:flex">
                <Button
                  variant="ghost"
                  onClick={goPreviousStep}
                  disabled={currentStep === 1}
                  className="h-10 rounded-lg border border-white/10 bg-white/5 px-4 text-slate-200 hover:bg-white/10 disabled:opacity-40"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  {currentStep < 3 ? (
                    <Button onClick={goNextStep} className="h-10 rounded-lg bg-blue-600 px-4 text-white hover:bg-blue-500">
                      Next
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  ) : !usage?.canGenerate ? (
                    <Button onClick={() => router.push("/pricing")} className="h-10 rounded-lg bg-amber-600 px-4 text-white hover:bg-amber-500">
                      Upgrade Plan
                    </Button>
                  ) : (
                    <Button
                      onClick={generateGuide}
                      disabled={loading || !canSubmit}
                      className="h-10 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-5 text-white hover:opacity-90 disabled:opacity-40"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Expert Strategy
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-sm font-medium text-white">Personalized</p>
              <p className="mt-1 text-xs text-slate-400">Role-specific strategy mapped to your context.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-sm font-medium text-white">JD Analysis</p>
              <p className="mt-1 text-xs text-slate-400">Extracts recruiter expectations and skill signals.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-sm font-medium text-white">PDF Ready</p>
              <p className="mt-1 text-xs text-slate-400">Export your generated strategy in one click.</p>
            </div>
          </div>

          <footer className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
            Fluenzy AI Interview Intelligence Suite
          </footer>
        </div>

        {currentStep === 3 && (
          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-slate-950/95 p-3 backdrop-blur md:hidden">
            <div className="mx-auto flex max-w-6xl items-center gap-2">
              <Button
                variant="ghost"
                onClick={goPreviousStep}
                className="h-11 rounded-lg border border-white/10 bg-white/5 px-4 text-slate-200"
              >
                Back
              </Button>
              {!usage?.canGenerate ? (
                <Button onClick={() => router.push("/pricing")} className="h-11 flex-1 rounded-lg bg-amber-600 text-white hover:bg-amber-500">
                  Upgrade Plan
                </Button>
              ) : (
                <Button
                  onClick={generateGuide}
                  disabled={loading || !canSubmit}
                  className="h-11 flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white disabled:opacity-40"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate Expert Strategy"}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Guide display view
  const checklistItems = guide.section7_cheatSheet?.finalChecklist || [];
  const checklistProgress = checklistItems.length
    ? Math.round((checklistCompleted.size / checklistItems.length) * 100)
    : 0;
  const sectionProgress = guideNavSections.length
    ? Math.round((completedGuideSections.size / guideNavSections.length) * 100)
    : 0;
  const readinessScore = Math.round(sectionProgress * 0.65 + checklistProgress * 0.35);

  const introTabs = [
    { key: "30" as const, label: "30 sec", value: guide.section2_introduction?.short30sec },
    { key: "60" as const, label: "60 sec", value: guide.section2_introduction?.medium60sec },
    { key: "90" as const, label: "90 sec", value: guide.section2_introduction?.long90sec },
  ].filter((tab) => !!tab.value);

  const activeIntroContent = introTabs.find((tab) => tab.key === activeIntroTab)?.value || introTabs[0]?.value || "";

  const technicalQuestionsByLevel = {
    beginner: guide.section4_technicalQuestions?.beginner || [],
    intermediate: guide.section4_technicalQuestions?.intermediate || [],
    advanced: guide.section4_technicalQuestions?.advanced || [],
  };

  const technicalItems = technicalQuestionsByLevel[technicalFilter] || [];
  const sectionBoxClass = `scroll-mt-24 rounded-2xl border border-slate-700/70 bg-slate-900/75 ${compactView ? "p-3 md:p-4" : "p-4 md:p-5"}`;
  const mainGapClass = compactView ? "space-y-3" : "space-y-4";

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100">
      <div className="mx-auto w-full max-w-[1320px] px-4 py-6 md:px-6 md:py-8">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-700/70 bg-slate-900/80 p-4 shadow-sm md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Candidate</p>
                    <p className="font-semibold text-white">{userProfile?.name || session?.user?.name || "Candidate"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Target Role</p>
                    <p className="font-semibold text-white">{userProfile?.targetRole || targetRole || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Company</p>
                    <p className="font-semibold text-white">{userProfile?.targetCompany || targetCompany || "General"}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 font-medium text-blue-200">
                    {communicationLevel} level
                  </span>
                  <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 font-medium text-violet-200">
                    {guideNavSections.length} sections
                  </span>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-medium text-emerald-200">
                    Readiness {readinessScore}%
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setGuide(null);
                    setCurrentGuideId(null);
                    router.push("/interview-guide");
                  }}
                  className="h-10 rounded-xl border border-slate-700 bg-slate-800/80 px-3 text-xs font-medium text-slate-200 hover:bg-slate-800"
                >
                  <ArrowRight className="mr-1 h-4 w-4 rotate-180" />
                  New Roadmap
                </Button>
                <Link href="/interview-guide/history">
                  <Button variant="ghost" className="h-10 rounded-xl border border-slate-700 bg-slate-800/80 px-3 text-xs font-medium text-slate-200 hover:bg-slate-800">
                    <History className="mr-1 h-4 w-4" />
                    Archive
                  </Button>
                </Link>
                <Button
                  onClick={() => window.print()}
                  variant="ghost"
                  className="h-10 rounded-xl border border-slate-700 bg-slate-800/80 px-3 text-xs font-medium text-slate-200 hover:bg-slate-800"
                >
                  <Printer className="mr-1 h-4 w-4" />
                  Print
                </Button>
                <Button
                  onClick={() => setCompactView((prev) => !prev)}
                  variant="ghost"
                  className="h-10 rounded-xl border border-slate-700 bg-slate-800/80 px-3 text-xs font-medium text-slate-200 hover:bg-slate-800"
                >
                  {compactView ? <LayoutGrid className="mr-1 h-4 w-4" /> : <Rows3 className="mr-1 h-4 w-4" />}
                  {compactView ? "Expanded" : "Compact"}
                </Button>
                <Button
                  onClick={downloadPDF}
                  disabled={pdfLoading}
                  className="h-10 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 text-xs font-medium uppercase tracking-[0.12em] text-white hover:opacity-90 disabled:opacity-50"
                >
                  {pdfLoading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />}
                  Export PDF
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <article className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Readiness Level</p>
                <p className="mt-2 text-2xl font-semibold text-white">{readinessScore}%</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-blue-500 transition-all duration-700" style={{ width: `${readinessScore}%` }} />
                </div>
              </article>

              <article className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Key Focus Areas</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(jdInsights.length ? jdInsights : ["Preparation", "Communication", "Role Fit"]).slice(0, 4).map((item) => (
                    <span key={item} className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs text-violet-200">
                      {item}
                    </span>
                  ))}
                </div>
              </article>

              <article className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Preparation Status</p>
                  <span className="text-xs text-emerald-300">{checklistCompleted.size}/{checklistItems.length || 0}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${checklistProgress}%` }} />
                </div>
              </article>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Last practiced: {lastPracticedAt || "Just now"}</span>
              <span>Last updated: {new Date().toLocaleDateString()}</span>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
            <main className={mainGapClass} style={{ scrollBehavior: "smooth" }}>
              <section id="preparation" className={sectionBoxClass}>
                <h2 className="text-[22px] font-semibold text-white">Preparation Strategy</h2>
                <p className="mt-1 text-sm text-slate-400">Time-boxed actions before your interview day.</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {guide.section1_preparation?.oneDayBefore && (
                    <Card className="rounded-xl border-slate-700 bg-slate-950/50 p-0">
                      <CardHeader className="pb-2"><CardTitle className="text-base text-white">24 Hours Before</CardTitle></CardHeader>
                      <CardContent className="space-y-2 text-sm text-slate-300">
                        {guide.section1_preparation.oneDayBefore.map((item: string, idx: number) => (
                          <div key={idx} className="flex gap-2"><Circle className="mt-1 h-3 w-3 text-blue-300" />{item}</div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {guide.section1_preparation?.oneHourBefore && (
                    <Card className="rounded-xl border-slate-700 bg-slate-950/50 p-0">
                      <CardHeader className="pb-2"><CardTitle className="text-base text-white">One Hour Before</CardTitle></CardHeader>
                      <CardContent className="space-y-2 text-sm text-slate-300">
                        {guide.section1_preparation.oneHourBefore.map((item: string, idx: number) => (
                          <div key={idx} className="flex gap-2"><Circle className="mt-1 h-3 w-3 text-violet-300" />{item}</div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {guide.section1_preparation?.commonMistakes && (
                    <Card className="rounded-xl border-red-500/30 bg-red-500/10 p-0 md:col-span-2">
                      <CardHeader className="pb-2"><CardTitle className="text-base text-red-100">Common Mistakes</CardTitle></CardHeader>
                      <CardContent className="grid gap-2 text-sm text-red-100 md:grid-cols-2">
                        {guide.section1_preparation.commonMistakes.map((item: string, idx: number) => (
                          <div key={idx} className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 text-red-300" />{item}</div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {guide.section1_preparation?.duringInterview && (
                    <Card className="rounded-xl border-slate-700 bg-slate-950/50 p-0 md:col-span-2">
                      <CardHeader className="pb-2"><CardTitle className="text-base text-white">Final Countdown Checklist</CardTitle></CardHeader>
                      <CardContent className="grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                        {Object.entries(guide.section1_preparation.duringInterview).map(([key, value]) => (
                          <div key={key} className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
                            <p className="text-[11px] uppercase tracking-[0.12em] text-blue-300">{key}</p>
                            <p className="mt-1">{value as string}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </section>

              {guide.section1_preparation?.starMethod && (
                <section id="star-method" className={sectionBoxClass}>
                  <h2 className="text-[22px] font-semibold text-white">STAR Method</h2>
                  <p className="mt-1 text-sm text-slate-400">Framework flow for behavior-based answers.</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {Object.entries(guide.section1_preparation.starMethod).map(([key, value], idx) => {
                      const stepLabel = ["S", "T", "A", "R"][idx] || "•";
                      return (
                        <div key={key} className="relative rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                          <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 text-xs font-semibold text-blue-200">
                            {stepLabel}
                          </div>
                          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{key}</p>
                          <p className="mt-1 text-sm text-slate-300">{value as string}</p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {guide.section2_introduction && (
                <section id="introduction" className={sectionBoxClass}>
                  <h2 className="text-[22px] font-semibold text-white">Personal Introduction</h2>
                  <p className="mt-1 text-sm text-slate-400">Switch between concise and detailed introduction lengths.</p>
                  <div className="mt-4 inline-flex rounded-xl border border-slate-700 bg-slate-950/60 p-1">
                    {introTabs.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveIntroTab(tab.key)}
                        className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
                          activeIntroTab === tab.key ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                    <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">{activeIntroContent}</p>
                  </div>
                  {guide.section2_introduction?.tips?.length > 0 && (
                    <div className="mt-4 grid gap-2 md:grid-cols-2">
                      {guide.section2_introduction.tips.map((tip: string, idx: number) => (
                        <div key={idx} className="rounded-lg border border-slate-700 bg-slate-950/40 p-3 text-sm text-slate-300">
                          <span className="mr-2 text-blue-300">{idx + 1}.</span>{tip}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {guide.section3_hrQuestions?.questions?.length > 0 && (
                <section id="hr-questions" className={sectionBoxClass}>
                  <h2 className="text-[22px] font-semibold text-white">HR Questions</h2>
                  <p className="mt-1 text-sm text-slate-400">Collapsible Q&A cards with strategy tips.</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {guide.section3_hrQuestions.questions.map((q: any, idx: number) => {
                      const isOpen = expandedHrItems.has(idx);
                      return (
                        <div key={idx} className="rounded-xl border border-slate-700 bg-slate-950/50">
                          <button
                            onClick={() =>
                              setExpandedHrItems((prev) => {
                                const next = new Set(prev);
                                if (next.has(idx)) next.delete(idx);
                                else next.add(idx);
                                return next;
                              })
                            }
                            className="flex w-full items-center justify-between gap-3 p-4 text-left"
                          >
                            <div>
                              <p className="font-medium text-white">{q.question}</p>
                              <span className="mt-1 inline-block rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-violet-200">
                                Behavioral
                              </span>
                            </div>
                            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          </button>
                          {isOpen && (
                            <div className="border-t border-slate-700 p-4 text-sm text-slate-300 space-y-3">
                              <p className="whitespace-pre-wrap">{q.answer}</p>
                              {q.tips && <p className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-blue-100">{q.tips}</p>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {guide.section4_technicalQuestions && (
                <section id="technical-questions" className={sectionBoxClass}>
                  <h2 className="text-[22px] font-semibold text-white">Technical Questions</h2>
                  <p className="mt-1 text-sm text-slate-400">Filter by proficiency and expand answers.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(["beginner", "intermediate", "advanced"] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setTechnicalFilter(level)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                          technicalFilter === level
                            ? "bg-blue-600 text-white"
                            : "border border-slate-700 bg-slate-950/60 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {technicalItems.map((q: any, idx: number) => {
                      const key = `${technicalFilter}-${idx}`;
                      const isOpen = expandedTechItems.has(key);
                      return (
                        <div key={key} className="rounded-xl border border-slate-700 bg-slate-950/50">
                          <button
                            onClick={() =>
                              setExpandedTechItems((prev) => {
                                const next = new Set(prev);
                                if (next.has(key)) next.delete(key);
                                else next.add(key);
                                return next;
                              })
                            }
                            className="flex w-full items-center justify-between gap-2 p-4 text-left"
                          >
                            <p className="font-medium text-white">{q.question}</p>
                            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          </button>
                          {isOpen && (
                            <div className="border-t border-slate-700 p-4 text-sm text-slate-300 whitespace-pre-wrap">{q.answer}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {guide.section5_companySpecific && (
                <section id="company-fit" className={sectionBoxClass}>
                  <h2 className="text-[22px] font-semibold text-white">Company Fit</h2>
                  <p className="mt-1 text-sm text-slate-400">Institutional alignment narratives in modular cards.</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {[
                      { title: "Why This Company", content: guide.section5_companySpecific.whyThisCompany },
                      { title: "Culture Integration", content: guide.section5_companySpecific.cultureFit },
                      { title: "Role Expectations", content: guide.section5_companySpecific.roleExpectations },
                      { title: "Value Addition", content: guide.section5_companySpecific.valueAddition },
                    ]
                      .filter((item) => item.content)
                      .map((item) => (
                        <div key={item.title} className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-xs uppercase tracking-[0.12em] text-blue-300">{item.title}</p>
                            <CopyButton text={item.content as string} />
                          </div>
                          <p className="text-sm text-slate-300">{item.content as string}</p>
                        </div>
                      ))}
                  </div>
                </section>
              )}

              {guide.section6_communication && (
                <section id="communication-upgrade" className={sectionBoxClass}>
                  <h2 className="text-[22px] font-semibold text-white">Communication Upgrade</h2>
                  <p className="mt-1 text-sm text-slate-400">Improve clarity, vocabulary and response control.</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Filler Replacement Grid</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(guide.section6_communication.fillerWordsToAvoid || []).map((word: string, idx: number) => (
                          <span key={idx} className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs text-red-100">
                            {word}
                          </span>
                        ))}
                        {(guide.section6_communication.betterReplacements || []).map((item: any, idx: number) => (
                          <span key={idx} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-100">
                            {item.useInstead}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Power Phrases</p>
                      <div className="mt-3 grid gap-2">
                        {(guide.section6_communication.powerPhrases || []).map((phrase: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => navigator.clipboard.writeText(phrase)}
                            className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-left text-sm text-blue-100 hover:bg-blue-500/15"
                          >
                            {phrase}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {guide.section7_cheatSheet && (
                <section id="rapid-memorization" className={sectionBoxClass}>
                  <h2 className="text-[22px] font-semibold text-white">Rapid Memorization</h2>
                  <p className="mt-1 text-sm text-slate-400">Flashcard style memory anchors for quick recall.</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {(guide.section7_cheatSheet.keyLinesToMemorize || []).map((line: string, idx: number) => {
                      const flipped = flippedMemoItems.has(idx);
                      return (
                        <button
                          key={idx}
                          onClick={() =>
                            setFlippedMemoItems((prev) => {
                              const next = new Set(prev);
                              if (next.has(idx)) next.delete(idx);
                              else next.add(idx);
                              return next;
                            })
                          }
                          className="min-h-[140px] rounded-xl border border-slate-700 bg-slate-950/50 p-4 text-left transition-colors hover:bg-slate-900"
                        >
                          {!flipped ? (
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Front</p>
                              <p className="mt-2 text-sm text-white">{line}</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Back</p>
                              <p className="mt-2 text-sm text-slate-300">Why it matters: reinforces concise, high-confidence recall under pressure.</p>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {checklistItems.length > 0 && (
                <section id="final-checklist" className={sectionBoxClass}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-[22px] font-semibold text-white">Final Checklist</h2>
                      <p className="mt-1 text-sm text-slate-400">Interactive completion tracker.</p>
                    </div>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-100">
                      Progress: {checklistCompleted.size}/{checklistItems.length} Completed
                    </span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${checklistProgress}%` }} />
                  </div>
                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    {checklistItems.map((item: string, idx: number) => {
                      const done = checklistCompleted.has(idx);
                      return (
                        <button
                          key={idx}
                          onClick={() =>
                            setChecklistCompleted((prev) => {
                              const next = new Set(prev);
                              if (next.has(idx)) next.delete(idx);
                              else next.add(idx);
                              return next;
                            })
                          }
                          className={`flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                            done
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                              : "border-slate-700 bg-slate-950/50 text-slate-300 hover:bg-slate-900"
                          }`}
                        >
                          <span className={`mt-0.5 h-4 w-4 rounded border ${done ? "border-emerald-300 bg-emerald-400" : "border-slate-500"}`} />
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}
            </main>

            <aside className="hidden lg:block">
              <div className="sticky top-20 rounded-2xl border border-slate-700/70 bg-slate-900/80 p-3">
                <p className="px-2 pb-2 text-[11px] uppercase tracking-[0.14em] text-slate-400">Guide Navigator</p>
                <nav className="space-y-1">
                  {guideNavSections.map((item) => {
                    const active = activeGuideSection === item.id;
                    const done = completedGuideSections.has(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                          active
                            ? "bg-blue-600/20 text-blue-100"
                            : "text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <span>{item.label}</span>
                        {done && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </aside>
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





