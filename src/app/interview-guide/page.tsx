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
import { useTheme } from "@/contexts/ThemeContext";
import InterviewGuideDisplay from "@/components/InterviewGuideDisplay";
import MobileInterviewGuide from "@/components/MobileInterviewGuide";

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
            <Icon size={19} className="text-[color:var(--ig-heading)]" />
          </div>
          <h2 className="text-base md:text-lg font-semibold text-[color:var(--ig-heading)] tracking-tight text-left">
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
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-emerald-500 text-[color:var(--ig-heading)] text-[10px] font-black rounded-md animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-none">
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
        <h4 className="font-semibold text-[color:var(--ig-heading)] text-base leading-snug">
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
            <span className="font-semibold text-[color:var(--ig-heading)] text-sm tracking-tight">{duration}</span>
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
  const { resolvedTheme } = useTheme();
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
  const [viewMode, setViewMode] = useState<"ui" | "pdf">("ui");
  const [recentGuides, setRecentGuides] = useState<Array<{
    id: string;
    targetRole: string;
    targetCompany: string | null;
    experienceLevel: string;
    communicationLevel: string;
    createdAt: string;
  }>>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 641);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const igThemeVars =
    resolvedTheme === "light"
      ? ({
          "--ig-bg": "#f3f5f8",
          "--ig-surface": "#ffffff",
          "--ig-surface-soft": "#f8fafc",
          "--ig-surface-alt": "#f1f5f9",
          "--ig-border": "#dbe3ee",
          "--ig-heading": "#0f172a",
          "--ig-text": "#1e293b",
          "--ig-muted": "#64748b",
          "--ig-accent": "#2563eb",
          "--ig-accent-soft": "#dbeafe",
          "--ig-accent-hover": "#1d4ed8",
        } as React.CSSProperties)
      : resolvedTheme === "midnight"
        ? ({
            "--ig-bg": "#121826",
            "--ig-surface": "#1a2233",
            "--ig-surface-soft": "#1f2937",
            "--ig-surface-alt": "#273244",
            "--ig-border": "#334155",
            "--ig-heading": "#e5e7eb",
            "--ig-text": "#cbd5e1",
            "--ig-muted": "#94a3b8",
            "--ig-accent": "#4f46e5",
            "--ig-accent-soft": "#312e81",
            "--ig-accent-hover": "#6366f1",
          } as React.CSSProperties)
        : ({
            "--ig-bg": "#111827",
            "--ig-surface": "#1f2937",
            "--ig-surface-soft": "#253346",
            "--ig-surface-alt": "#2a3b52",
            "--ig-border": "#334155",
            "--ig-heading": "#e2e8f0",
            "--ig-text": "#cbd5e1",
            "--ig-muted": "#94a3b8",
            "--ig-accent": "#3b82f6",
            "--ig-accent-soft": "#1e3a8a",
            "--ig-accent-hover": "#60a5fa",
          } as React.CSSProperties);

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

  // Fetch recent guides for history section on form page
  useEffect(() => {
    if (session?.user) {
      fetch("/api/interview-guide/history")
        .then((r) => r.json())
        .then((data) => { if (data.guides) setRecentGuides(data.guides.slice(0, 3)); })
        .catch(() => {});
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
      <div style={igThemeVars} className="interview-guide-page relative z-10 min-h-screen bg-[color:var(--ig-bg)] text-[color:var(--ig-text)]">
        <div className="mx-auto max-w-6xl px-4 py-6 pb-24 md:py-8 md:pb-10">
        <div className="space-y-5">

          {/* === PAGE HEADER === */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-[color:var(--ig-heading)] tracking-tight">Interview Strategy Builder</h1>
              <p className="text-xs md:text-sm text-[color:var(--ig-muted)] mt-0.5">AI-powered personalized interview roadmap</p>
            </div>
            <Link href="/interview-guide/history">
              <Button variant="ghost" className="flex items-center gap-2 h-9 px-3 rounded-xl border border-[color:var(--ig-border)] bg-[color:var(--ig-surface)] text-xs font-semibold text-[color:var(--ig-text)] hover:bg-[color:var(--ig-surface-soft)] transition-colors">
                <History size={14} />
                <span className="hidden sm:inline">All History</span>
              </Button>
            </Link>
          </div>

          {/* === RECENT GUIDES (history at top) === */}
          {recentGuides.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ig-muted)] mb-3 font-semibold flex items-center gap-1.5">
                <History size={12} />
                Recent Guides
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentGuides.map((g) => (
                  <Link key={g.id} href={`/interview-guide?id=${g.id}`}>
                    <div className="rounded-xl border border-[color:var(--ig-border)] bg-[color:var(--ig-surface)] p-4 hover:border-blue-500/40 hover:shadow-md transition-all cursor-pointer group">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                          <Target size={16} className="text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-[color:var(--ig-heading)] truncate group-hover:text-blue-400 transition-colors">{g.targetRole}</p>
                          {g.targetCompany && (
                            <p className="text-xs text-[color:var(--ig-muted)] truncate flex items-center gap-1">
                              <Building2 size={10} />{g.targetCompany}
                            </p>
                          )}
                          <p className="text-[10px] text-[color:var(--ig-muted)] mt-1 flex items-center gap-1">
                            <Calendar size={10} />{new Date(g.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <ArrowRight size={14} className="text-[color:var(--ig-muted)] flex-shrink-0 mt-1 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Card className="overflow-hidden rounded-2xl border-white/10 bg-slate-900/75 shadow-xl backdrop-blur-2xl">
            <CardHeader className="space-y-3 border-b border-white/10 p-5 md:p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-[color:var(--ig-heading)] md:text-lg">
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
                <div className={currentStep === 1 ? "text-[color:var(--ig-heading)]" : ""}>Role & Company</div>
                <div className={currentStep === 2 ? "text-[color:var(--ig-heading)]" : ""}>Communication Context</div>
                <div className={currentStep === 3 ? "text-[color:var(--ig-heading)]" : ""}>JD & Analysis</div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-5 md:p-6">
              {currentStep === 1 && (
                <section className="space-y-5 rounded-xl border border-white/10 bg-slate-950/40 p-4 md:p-5">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-[color:var(--ig-heading)]">Role & Company</h2>
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
                        className={`h-12 rounded-xl border bg-slate-900/80 text-[color:var(--ig-heading)] placeholder:text-slate-500 focus-visible:ring-2 ${
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
                        className="h-12 rounded-xl border border-white/10 bg-slate-900/80 text-[color:var(--ig-heading)] placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500/40"
                      />
                    </div>
                  </div>
                </section>
              )}

              {currentStep === 2 && (
                <section className="space-y-5 rounded-xl border border-white/10 bg-slate-950/40 p-4 md:p-5">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-[color:var(--ig-heading)]">Communication & Experience Context</h2>
                    <p className="text-sm text-slate-400">Tune strategy depth for your interview narrative.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-300">Communication Level</label>
                      <Select value={communicationLevel} onValueChange={setCommunicationLevel}>
                        <SelectTrigger className="h-12 rounded-xl border border-white/10 bg-slate-900/80 text-[color:var(--ig-heading)] focus:ring-2 focus:ring-cyan-500/40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-white/10 bg-slate-900 text-[color:var(--ig-heading)]">
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
                        className="min-h-[110px] rounded-xl border border-white/10 bg-slate-900/80 text-[color:var(--ig-heading)] placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-cyan-500/40"
                      />
                    </div>
                  </div>
                </section>
              )}

              {currentStep === 3 && (
                <section className="space-y-5 rounded-xl border border-white/10 bg-slate-950/40 p-4 md:p-5">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-[color:var(--ig-heading)]">Job Description + AI Analysis</h2>
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
                    <p className="text-sm font-medium text-[color:var(--ig-text)]">Drag and drop JD file or upload text file</p>
                    <p className="mt-1 text-xs text-slate-500">Supported: .txt, .md, .json</p>
                    <label className="mt-3 inline-flex cursor-pointer items-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-[color:var(--ig-text)] hover:bg-white/10">
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
                      className={`min-h-[220px] rounded-xl border bg-slate-900/80 text-[color:var(--ig-heading)] placeholder:text-slate-500 focus-visible:ring-2 ${
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
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--ig-heading)]">
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
                          className="h-10 rounded-lg bg-indigo-600 text-sm font-medium text-[color:var(--ig-heading)] hover:bg-indigo-500 disabled:opacity-60"
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
                      <p className="text-sm font-semibold text-[color:var(--ig-heading)]">{usage.plan}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Quota Remaining</p>
                      <p className={`text-lg font-semibold ${usage.canGenerate ? "text-[color:var(--ig-heading)]" : "text-rose-300"}`}>
                        {usage.remaining === "Unlimited" ? "Unlimited" : usage.remaining}
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
                  className="h-10 rounded-lg border border-white/10 bg-white/5 px-4 text-[color:var(--ig-text)] hover:bg-white/10 disabled:opacity-40"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  {currentStep < 3 ? (
                    <Button onClick={goNextStep} className="h-10 rounded-lg bg-blue-600 px-4 text-[color:var(--ig-heading)] hover:bg-blue-500">
                      Next
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  ) : !usage?.canGenerate ? (
                    <Button onClick={() => router.push("/pricing")} className="h-10 rounded-lg bg-amber-600 px-4 text-[color:var(--ig-heading)] hover:bg-amber-500">
                      Upgrade Plan
                    </Button>
                  ) : (
                    <Button
                      onClick={generateGuide}
                      disabled={loading || !canSubmit}
                      className="h-10 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-5 text-[color:var(--ig-heading)] hover:opacity-90 disabled:opacity-40"
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

          <section className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
            <p className="text-sm font-medium text-[color:var(--ig-heading)]">Keep Your Profile Updated</p>
            <p className="mt-2 text-sm text-slate-400 leading-6">
              For the best output, keep your profile updated with projects, education, experience, skills, and other relevant details.
              Your interview strategy is personalized based on this profile data. For better context, regularly review your previous{" "}
              <Link href="/interview-guide/history" className="underline underline-offset-2">
                History
              </Link>{" "}
              and{" "}
              <Link href="/analytics" className="underline underline-offset-2">
                Analytics
              </Link>{" "}
              as well.
            </p>
            <div className="mt-3">
              <Link href="/profile">
                <Button variant="ghost" className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-[color:var(--ig-text)] hover:bg-white/10">
                  Go to Profile
                </Button>
              </Link>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-sm font-medium text-[color:var(--ig-heading)]">Personalized</p>
              <p className="mt-1 text-xs text-slate-400">Role-specific strategy mapped to your context.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-sm font-medium text-[color:var(--ig-heading)]">JD Analysis</p>
              <p className="mt-1 text-xs text-slate-400">Extracts recruiter expectations and skill signals.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-sm font-medium text-[color:var(--ig-heading)]">PDF Ready</p>
              <p className="mt-1 text-xs text-slate-400">Export your generated strategy in one click.</p>
            </div>
          </div>

          <footer className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
            Fluenzy AI Interview Intelligence Suite
          </footer>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-slate-950/95 p-3 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-6xl items-center gap-2">
            <Button
              variant="ghost"
              onClick={goPreviousStep}
              disabled={currentStep === 1}
              className="h-11 rounded-lg border border-white/10 bg-white/5 px-4 text-[color:var(--ig-text)] disabled:opacity-40"
            >
              Back
            </Button>
            {currentStep < 3 ? (
              <Button onClick={goNextStep} className="h-11 flex-1 rounded-lg bg-blue-600 text-[color:var(--ig-heading)] hover:bg-blue-500">
                Next →
              </Button>
            ) : !usage?.canGenerate ? (
              <Button onClick={() => router.push("/pricing")} className="h-11 flex-1 rounded-lg bg-amber-600 text-[color:var(--ig-heading)] hover:bg-amber-500">
                Upgrade Plan
              </Button>
            ) : (
              <Button
                onClick={generateGuide}
                disabled={loading || !canSubmit}
                className="h-11 flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-[color:var(--ig-heading)] disabled:opacity-40"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate Expert Strategy"}
              </Button>
            )}
          </div>
        </div>
        </div>
      </div>
    );
  }

  // Guide display view — dispatches to responsive components
  const sharedGuideProps = {
    guide,
    targetRole: userProfile?.targetRole || targetRole || "",
    targetCompany: userProfile?.targetCompany || targetCompany || "",
    communicationLevel,
    pdfLoading,
    downloadPDF,
    onNewRoadmap: () => {
      router.push("/interview-guide");
      setGuide(null);
    },
    lastPracticedAt,
  };

  if (isMobile) {
    return <MobileInterviewGuide {...sharedGuideProps} />;
  }
  return <InterviewGuideDisplay {...sharedGuideProps} />;
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






