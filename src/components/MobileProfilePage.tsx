'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTheme, themeConfig, ThemeName } from '@/contexts/ThemeContext';
import { toast } from 'sonner';
import {
  Menu, Bell, Home, Link2, BarChart3, User,
  Sun, Moon, Leaf, Coffee, Terminal, Sparkles, X, LogOut,
  BookMarked, History, Code, GraduationCap, Users, Building2,
  Radio, Trophy, UserSearch, FileCheck, UserCheck, BookOpen,
  Target, Brain, Pencil, Trash2, Plus, ExternalLink, Upload,
  Download, FileText, CheckCircle2, Globe, Github, Linkedin,
  Award, FolderKanban, Zap, Save, ChevronRight, Activity, Loader2,
  ArrowLeft, Copy, Eye, EyeOff, ShieldCheck, Check, ChevronLeft,
  Share2, Sparkle
} from 'lucide-react';

/* ─── Theme option list (exact same as MobileTrainPage) ─────────────────── */
const THEME_OPTIONS: { value: ThemeName; label: string; icon: typeof Moon }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'midnight', label: 'Night', icon: Moon },
  { value: 'forest', label: 'Forest', icon: Leaf },
  { value: 'parchment', label: 'Parchment', icon: Coffee },
  { value: 'codeterm', label: 'Code', icon: Terminal },
];

/* ─── Bottom tabs (exact same as MobileTrainPage — Profile highlighted) ─── */
const TABS = [
  { label: 'Quick Links', icon: Link2, href: '/train', tabColor: '#8B5CF6' },
  { label: 'Practice', icon: Target, href: '/train/hr', tabColor: '#10B981' },
  { label: 'Home', icon: Home, href: '/train', tabColor: '#7C3AED' },
  { label: 'Analytics', icon: BarChart3, href: '/analytics', tabColor: '#F97316' },
  { label: 'Profile', icon: User, href: '/profile', tabColor: '#0EA5E9' },
];

/* ─── Sidebar sections (exact same as MobileTrainPage) ──────────────────── */
const SIDEBAR_SECTIONS = [
  {
    title: 'MAIN',
    items: [
      { label: 'Dashboard', icon: Home, href: '/train' },
      { label: 'HR Interview', icon: UserCheck, href: '/train/hr' },
      { label: 'Technical', icon: Code, href: '/train/technical' },
      { label: 'GD Coach', icon: GraduationCap, href: '/train/gd-coach' },
      { label: 'GD Agent', icon: Users, href: '/train/gd-agent' },
      { label: 'Company Tracks', icon: Building2, href: '/train/company' },
      { label: 'Live GD', icon: Radio, href: '/train/live' },
      { label: 'Competitions', icon: Trophy, href: '/train/competitions' },
      { label: 'English Learning', icon: BookOpen, href: '/train/english' },
      { label: 'Vocabulary', icon: BookMarked, href: '/train/vocabulary' },
      { label: 'PromptIQ', icon: Brain, href: '/train/promptiq' },
    ],
  },
  {
    title: 'JOB & CAREER',
    items: [
      { label: 'AI Job Search', icon: UserSearch, href: '/train/job-search' },
      { label: 'My Applications', icon: FileCheck, href: '/train/applications' },
      { label: 'Resume ATS', icon: Target, href: '/ats' },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { label: 'Analytics', icon: BarChart3, href: '/analytics' },
      { label: 'History', icon: History, href: '/history' },
      { label: 'Profile', icon: User, href: '/profile' },
      { label: 'Billing', icon: Sparkles, href: '/billing' },
    ],
  },
];

export interface ProfileData {
  user: { name: string; email: string; image: string | null };
  profile: {
    id: string;
    username: string;
    headline?: string;
    bio?: string;
    socialLinks?: {
      github?: string;
      linkedin?: string;
      portfolio?: string;
      leetcode?: string;
    };
    openToWork: boolean;
    publicProfileEnabled: boolean;
    publicSections: Record<string, boolean>;
  };
  planInfo: {
    plan: string;
    planName: string;
    price: number;
    currency: string;
    monthlyLimit: number | null;
    isUnlimited: boolean;
    currentUsage: number;
    remainingUses: string | number;
    renewalDate: Date | null;
    subscription: any;
  };
  sections: {
    skills: any[];
    experiences: any[];
    educations: any[];
    certifications: any[];
    projects: any[];
    courses: any[];
    languages: any[];
  };
  activity: Record<string, number>;
  resumes: Array<{ id: string; fileName: string; fileUrl: string; uploadedAt: string }>;
  payments: any[];
}

export type SubViewType =
  | null
  | 'basic'
  | 'resumes'
  | 'socials'
  | 'skills'
  | 'experiences'
  | 'educations'
  | 'certifications'
  | 'projects'
  | 'plan'
  | 'public'
  | 'activity';

interface MobileProfilePageProps {
  loading?: boolean;
  profileData: ProfileData | null;
  onRefresh?: () => void;
  onSaveBasicInfo?: (data: any) => Promise<boolean | void>;
  onSaveSocialLinks?: (links: any) => Promise<boolean | void>;
  onSavePublicProfile?: (enabled: boolean, sections: Record<string, boolean>) => Promise<boolean | void>;
  onUploadResume?: (file: File) => Promise<boolean | void>;
  onDeleteResume?: (id: string) => Promise<boolean | void>;
  onAddSectionItem?: (type: string, data: any) => Promise<boolean | void>;
  onDeleteSectionItem?: (type: string, id: string) => Promise<boolean | void>;
}

export default function MobileProfilePage({
  loading = false,
  profileData,
  onRefresh,
  onSaveBasicInfo,
  onSaveSocialLinks,
  onSavePublicProfile,
  onUploadResume,
  onDeleteResume,
  onAddSectionItem,
  onDeleteSectionItem,
}: MobileProfilePageProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [activeSubView, setActiveSubView] = useState<SubViewType>(null);

  // Form states for Sub-Views
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editHeadline, setEditHeadline] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editOpenToWork, setEditOpenToWork] = useState(false);
  const [savingBasic, setSavingBasic] = useState(false);

  const [editGithub, setEditGithub] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [editPortfolio, setEditPortfolio] = useState('');
  const [editLeetcode, setEditLeetcode] = useState('');
  const [savingSocials, setSavingSocials] = useState(false);

  const [publicEnabled, setPublicEnabled] = useState(false);
  const [publicSections, setPublicSections] = useState<Record<string, boolean>>({});
  const [savingPublic, setSavingPublic] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [selectedResumeFile, setSelectedResumeFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  const [addItemType, setAddItemType] = useState<string | null>(null);
  const [itemTitle, setItemTitle] = useState('');
  const [itemSubTitle, setItemSubTitle] = useState('');
  const [addingItem, setAddingItem] = useState(false);

  // ── Perfect Theme Resolution (matching MobileTrainPage exactly) ──────────
  const activeTheme = theme || resolvedTheme || 'dark';
  const t = activeTheme as string;
  const isLight = t === 'light' || t === 'parchment';

  const firstName = session?.user?.name?.split(' ')[0] || 'there';
  const avatarUrl = profileData?.user?.image || session?.user?.image;

  /* ── Per-theme colour tokens (identical to MobileTrainPage) ───────────── */
  const ACCENT: Record<string, string> = {
    light: '#5A2D82',
    parchment: '#5A2D82',
    dark: '#7C3AED',
    midnight: '#7C3AED',
    forest: '#F59E0B',
    codeterm: '#CC4125',
  };
  const CARD_BG: Record<string, string> = {
    light: '#F8FAFC',
    parchment: '#FFFFFF',
    dark: '#161B2E',
    midnight: 'rgba(15,39,68,0.95)',
    forest: 'rgba(17,28,20,0.95)',
    codeterm: '#141414',
  };
  const PAGE_BG: Record<string, string> = {
    light: '#FFFFFF',
    parchment: 'hsl(42 18% 93%)',
    dark: '#0D0F1A',
    midnight: '#0a1929',
    forest: '#0b140e',
    codeterm: '#0D0D0D',
  };
  const TEXT_HEX: Record<string, string> = {
    light: '#0F0B2E',
    parchment: '#212529',
    dark: '#F1F5F9',
    midnight: '#F1F5F9',
    forest: '#e8e4d9',
    codeterm: '#F0EDE8',
  };
  const MUTED_HEX: Record<string, string> = {
    light: '#475569',
    parchment: '#525860',
    dark: '#94A3B8',
    midnight: '#94A3B8',
    forest: '#9aad8e',
    codeterm: '#888580',
  };
  const BORDER_HEX: Record<string, string> = {
    light: '#E5E7EB',
    parchment: '#E9ECEF',
    dark: 'rgba(255,255,255,0.08)',
    midnight: 'rgba(255,255,255,0.08)',
    forest: 'rgba(180,120,30,0.2)',
    codeterm: 'rgba(204,65,37,0.25)',
  };

  const accentHex = ACCENT[t] ?? (isLight ? '#5A2D82' : '#7C3AED');
  const cardBgHex = CARD_BG[t] ?? (isLight ? '#FFFFFF' : '#161B2E');
  const pageBgHex = PAGE_BG[t] ?? (isLight ? 'hsl(42 18% 93%)' : '#0D0F1A');
  const textHex = TEXT_HEX[t] ?? (isLight ? '#212529' : '#F1F5F9');
  const mutedHex = MUTED_HEX[t] ?? (isLight ? '#525860' : '#94A3B8');
  const borderHex = BORDER_HEX[t] ?? (isLight ? '#E9ECEF' : 'rgba(255,255,255,0.08)');

  /* ── Logo container helper ───────────────────────────────────────────── */
  const LogoContainer = () => (
    <div className="flex items-center justify-center shrink-0">
      <img
        src="/white-removebg-preview1.png"
        alt="Fluenzy AI Logo"
        className="w-9 h-9 object-contain filter drop-shadow-sm active:scale-95 transition-transform"
      />
    </div>
  );

  /* ── Theme Icon Helper ────────────────────────────────────────────────── */
  const ThemeIcon = () => {
    const iconColor = isLight ? '#1C1917' : '#F8FAFC';
    const icons: Record<ThemeName, React.ReactNode> = {
      light: <Sun size={18} style={{ color: iconColor, stroke: iconColor }} />,
      dark: <Moon size={18} style={{ color: iconColor, stroke: iconColor }} />,
      midnight: <Sparkles size={18} style={{ color: iconColor, stroke: iconColor }} />,
      forest: <Leaf size={18} style={{ color: iconColor, stroke: iconColor }} />,
      parchment: <Coffee size={18} style={{ color: iconColor, stroke: iconColor }} />,
      codeterm: <Terminal size={18} style={{ color: iconColor, stroke: iconColor }} />,
    };
    return <>{icons[theme] || <Moon size={18} style={{ color: iconColor, stroke: iconColor }} />}</>;
  };

  // Heatmap days calculation
  const heatmapDays = useMemo(() => {
    const activityMap = profileData?.activity ?? {};
    const days: { key: string; count: number }[] = [];
    const start = new Date();
    start.setDate(start.getDate() - 119);
    for (let i = 0; i <= 119; i += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const key = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      days.push({ key, count: activityMap[key] || 0 });
    }
    return days;
  }, [profileData?.activity]);

  // Profile Strength Progress
  const profileStrength = useMemo(() => {
    if (!profileData) return { score: 0, label: 'Basic' };
    let points = 20;
    if (profileData.user.name) points += 10;
    if (profileData.profile.headline) points += 10;
    if (profileData.profile.bio) points += 10;
    if (profileData.resumes.length > 0) points += 15;
    if (profileData.profile.socialLinks?.github || profileData.profile.socialLinks?.linkedin) points += 10;
    if (profileData.sections.skills.length > 0) points += 10;
    if (profileData.sections.experiences.length > 0) points += 15;
    const finalScore = Math.min(points, 100);
    const label = finalScore > 85 ? 'All Star' : finalScore > 65 ? 'Strong' : 'Intermediate';
    return { score: finalScore, label };
  }, [profileData]);

  // Open Sub-View with pre-populated fields
  const openSubView = (type: SubViewType) => {
    if (!profileData) return;
    if (type === 'basic') {
      setEditName(profileData.user.name || '');
      setEditUsername(profileData.profile.username || '');
      setEditHeadline(profileData.profile.headline || '');
      setEditBio(profileData.profile.bio || '');
      setEditOpenToWork(profileData.profile.openToWork || false);
    } else if (type === 'socials') {
      setEditGithub(profileData.profile.socialLinks?.github || '');
      setEditLinkedin(profileData.profile.socialLinks?.linkedin || '');
      setEditPortfolio(profileData.profile.socialLinks?.portfolio || '');
      setEditLeetcode(profileData.profile.socialLinks?.leetcode || '');
    } else if (type === 'public') {
      setPublicEnabled(profileData.profile.publicProfileEnabled || false);
      setPublicSections(profileData.profile.publicSections || {});
    }
    setActiveSubView(type);
  };

  // Save Handlers
  const handleSaveBasic = async () => {
    setSavingBasic(true);
    try {
      if (onSaveBasicInfo) {
        await onSaveBasicInfo({
          name: editName,
          username: editUsername,
          headline: editHeadline,
          bio: editBio,
          openToWork: editOpenToWork,
        });
      } else {
        const res = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: editName, username: editUsername, headline: editHeadline, bio: editBio, openToWork: editOpenToWork }),
        });
        if (res.ok) {
          toast.success('Basic information updated');
          if (onRefresh) onRefresh();
        }
      }
      setActiveSubView(null);
    } catch {
      toast.error('Error saving basic info');
    } finally {
      setSavingBasic(false);
    }
  };

  const handleSaveSocials = async () => {
    setSavingSocials(true);
    try {
      if (onSaveSocialLinks) {
        await onSaveSocialLinks({ github: editGithub, linkedin: editLinkedin, portfolio: editPortfolio, leetcode: editLeetcode });
      } else {
        const res = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ socialLinks: { github: editGithub, linkedin: editLinkedin, portfolio: editPortfolio, leetcode: editLeetcode } }),
        });
        if (res.ok) {
          toast.success('Social links updated');
          if (onRefresh) onRefresh();
        }
      }
      setActiveSubView(null);
    } catch {
      toast.error('Error saving social links');
    } finally {
      setSavingSocials(false);
    }
  };

  const handleSavePublic = async () => {
    setSavingPublic(true);
    try {
      if (onSavePublicProfile) {
        await onSavePublicProfile(publicEnabled, publicSections);
      } else {
        const res = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicProfileEnabled: publicEnabled, publicSections }),
        });
        if (res.ok) {
          toast.success('Public profile settings updated');
          if (onRefresh) onRefresh();
        }
      }
      setActiveSubView(null);
    } catch {
      toast.error('Error updating public settings');
    } finally {
      setSavingPublic(false);
    }
  };

  const handleUploadResumeSubmit = async () => {
    if (!selectedResumeFile) return;
    setUploadingResume(true);
    try {
      if (onUploadResume) {
        await onUploadResume(selectedResumeFile);
      } else {
        const formData = new FormData();
        formData.append('file', selectedResumeFile);
        const res = await fetch('/api/profile/resume', { method: 'POST', body: formData });
        if (res.ok) {
          toast.success('Resume uploaded successfully');
          if (onRefresh) onRefresh();
        }
      }
      setSelectedResumeFile(null);
    } catch {
      toast.error('Error uploading resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleDeleteResumeClick = async (id: string) => {
    try {
      if (onDeleteResume) {
        await onDeleteResume(id);
      } else {
        const res = await fetch(`/api/profile/resume?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success('Resume deleted');
          if (onRefresh) onRefresh();
        }
      }
    } catch {
      toast.error('Error deleting resume');
    }
  };

  const handleAddSectionSubmit = async () => {
    if (!addItemType || !itemTitle) return;
    setAddingItem(true);
    try {
      if (onAddSectionItem) {
        await onAddSectionItem(addItemType, { name: itemTitle, title: itemTitle, description: itemSubTitle, subtitle: itemSubTitle });
      } else {
        const res = await fetch('/api/profile/sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sectionType: addItemType,
            data: { name: itemTitle, title: itemTitle, description: itemSubTitle, subtitle: itemSubTitle },
          }),
        });
        if (res.ok) {
          toast.success(`Added ${addItemType}`);
          if (onRefresh) onRefresh();
        }
      }
      setItemTitle('');
      setItemSubTitle('');
    } catch {
      toast.error('Error adding item');
    } finally {
      setAddingItem(false);
    }
  };

  const handleDeleteSectionClick = async (type: string, id: string) => {
    try {
      if (onDeleteSectionItem) {
        await onDeleteSectionItem(type, id);
      } else {
        const res = await fetch(`/api/profile/sections?type=${type}&id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success('Item deleted');
          if (onRefresh) onRefresh();
        }
      }
    } catch {
      toast.error('Error deleting item');
    }
  };

  const copyPublicLink = () => {
    if (!profileData?.profile.username) return;
    const url = `${window.location.origin}/u/${profileData.profile.username}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success('Public link copied to clipboard');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  /* ── ENTERPRISE CATEGORY GROUPS ─────────────────────────────────────── */
  const CATEGORY_GROUPS = [
    {
      groupTitle: 'IDENTITY & CONTACT',
      items: [
        {
          id: 'basic',
          title: 'Basic Information',
          desc: 'Name, username, headline & hiring status',
          icon: User,
          gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
          badge: profileData?.profile.openToWork ? 'HIRING' : undefined,
        },
        {
          id: 'resumes',
          title: 'Resumes & ATS CVs',
          desc: `${profileData?.resumes.length || 0} PDF resume files uploaded`,
          icon: FileText,
          gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
        },
        {
          id: 'socials',
          title: 'Social & Portfolio Links',
          desc: 'GitHub, LinkedIn, Portfolio & LeetCode',
          icon: Globe,
          gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        },
      ],
    },
    {
      groupTitle: 'CAREER & EXPERTISE',
      items: [
        {
          id: 'skills',
          title: 'Skills & Technical Strengths',
          desc: `${profileData?.sections.skills.length || 0} skills added`,
          icon: Award,
          gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        },
        {
          id: 'experiences',
          title: 'Work Experience',
          desc: `${profileData?.sections.experiences.length || 0} positions & internships`,
          icon: Building2,
          gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
        },
        {
          id: 'educations',
          title: 'Education & Degrees',
          desc: `${profileData?.sections.educations.length || 0} degrees & colleges`,
          icon: GraduationCap,
          gradient: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
        },
        {
          id: 'certifications',
          title: 'Certifications & Licenses',
          desc: `${profileData?.sections.certifications.length || 0} accredited certificates`,
          icon: CheckCircle2,
          gradient: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
        },
        {
          id: 'projects',
          title: 'Projects & Portfolio Showcase',
          desc: `${profileData?.sections.projects.length || 0} personal projects`,
          icon: FolderKanban,
          gradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
        },
      ],
    },
    {
      groupTitle: 'ACCOUNT & PRIVACY',
      items: [
        {
          id: 'plan',
          title: 'Subscription & Plan Status',
          desc: `${profileData?.planInfo.planName || 'Free'} — ${profileData?.planInfo.isUnlimited ? 'Unlimited' : profileData?.planInfo.remainingUses} uses left`,
          icon: Zap,
          gradient: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
        },
        {
          id: 'public',
          title: 'Public Profile Privacy',
          desc: profileData?.profile.publicProfileEnabled ? 'Public link enabled' : 'Profile is private',
          icon: ShieldCheck,
          gradient: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
          badge: profileData?.profile.publicProfileEnabled ? 'PUBLIC' : 'PRIVATE',
        },
        {
          id: 'activity',
          title: 'Practice Activity History',
          desc: '120-day activity matrix & practice streak',
          icon: Activity,
          gradient: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex flex-col sm:hidden" style={{ background: pageBgHex }}>
      {/* ── TOP HEADER (identical to MobileTrainPage) ──────────────────── */}
      <header
        className="flex items-center justify-between px-4 shrink-0"
        style={{
          height: '56px',
          background: isLight ? pageBgHex : cardBgHex,
          borderBottom: isLight ? 'none' : `1px solid ${borderHex}`,
          boxShadow: isLight ? 'none' : '0 1px 6px rgba(0,0,0,0.12)',
        }}
      >
        <div className="flex items-center gap-2.5">
          {activeSubView ? (
            <button
              onClick={() => setActiveSubView(null)}
              className="flex items-center justify-center w-9 h-9 rounded-xl active:opacity-70"
              style={{ background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}
              aria-label="Back to Profile"
            >
              <ArrowLeft size={20} style={{ color: isLight ? '#0F172A' : '#F8FAFC', stroke: isLight ? '#0F172A' : '#F8FAFC' }} />
            </button>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center justify-center w-9 h-9 rounded-xl active:opacity-70"
              style={{ background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}
              aria-label="Menu"
            >
              <Menu size={22} style={{ color: isLight ? '#0F172A' : '#F8FAFC', stroke: isLight ? '#0F172A' : '#F8FAFC' }} />
            </button>
          )}

          <LogoContainer />

          <span
            className="text-base font-black tracking-tight"
            style={{
              background: 'linear-gradient(90deg,#7C3AED,#C084FC)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Fluenzy AI
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Selector */}
          <div className="relative">
            <button
              onClick={() => setThemeMenuOpen((o) => !o)}
              className="p-2 rounded-xl active:opacity-60 flex items-center justify-center border shadow-sm transition-transform active:scale-95"
              style={{
                color: isLight ? '#1C1917' : '#F8FAFC',
                background: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.08)',
                borderColor: isLight ? '#CBD5E1' : borderHex,
              }}
              aria-label="Theme"
            >
              <ThemeIcon />
            </button>

            <AnimatePresence>
              {themeMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[300]" onClick={() => setThemeMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-11 z-[310] w-40 rounded-xl overflow-hidden shadow-2xl py-1"
                    style={{
                      background: isLight ? '#FFFFFF' : cardBgHex,
                      border: `1px solid ${isLight ? '#CBD5E1' : borderHex}`,
                    }}
                  >
                    {THEME_OPTIONS.map((opt) => {
                      const active = theme === opt.value;
                      const itemTextColor = active ? accentHex : (isLight ? '#1C1917' : '#E2E8F0');
                      const itemIconColor = active ? accentHex : (isLight ? '#475569' : '#94A3B8');

                      return (
                        <button
                          key={opt.value}
                          onClick={() => { setTheme(opt.value); setThemeMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-extrabold transition-colors"
                          style={{
                            color: itemTextColor,
                            WebkitTextFillColor: itemTextColor,
                            background: active ? `${accentHex}18` : 'transparent',
                          }}
                        >
                          <opt.icon size={15} style={{ color: itemIconColor }} />
                          {opt.label}
                        </button>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              className="flex items-center justify-center w-9 h-9 rounded-xl active:opacity-70"
              style={{
                color: isLight ? '#0F172A' : '#F8FAFC',
                background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${borderHex}`,
              }}
              aria-label="Notifications"
            >
              <Bell size={18} style={{ color: isLight ? '#0F172A' : '#F8FAFC', stroke: isLight ? '#0F172A' : '#F8FAFC' }} />
            </button>
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[9px] font-black text-white">
              3
            </span>
          </div>

          {/* Profile Avatar */}
          <button
            onClick={() => { setActiveSubView(null); router.push('/profile'); }}
            className="w-9 h-9 rounded-xl overflow-hidden border-2 flex items-center justify-center active:opacity-80 shrink-0"
            style={{ borderColor: '#C4B5FD', background: 'linear-gradient(135deg,#7C3AED,#4F46E5)' }}
            aria-label="Profile"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-white font-black text-sm">{firstName[0]?.toUpperCase()}</span>
            )}
          </button>
        </div>
      </header>

      {/* ── SCROLLABLE BODY ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-4" style={{ paddingBottom: '90px' }}>

        {/* LOADING SKELETON */}
        {loading || !profileData ? (
          <div className="space-y-4 animate-pulse">
            <div className="rounded-3xl p-5 space-y-3" style={{ background: cardBgHex, border: `1px solid ${borderHex}` }}>
              <div className="flex items-center gap-3.5">
                <div className="w-16 h-16 rounded-2xl bg-current opacity-10 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-36 rounded bg-current opacity-10" />
                  <div className="h-3.5 w-48 rounded bg-current opacity-10" />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 w-full rounded-3xl bg-current opacity-10" />
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* ═════════════════════════════════════════════════════════════
               MAIN VIEW: Enterprise Hero Card + Inset Grouped Section Lists
               ═════════════════════════════════════════════════════════════ */}
            {activeSubView === null && (
              <motion.div
                key="main-profile-theme-aware"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {/* ── ENTERPRISE HERO PROFILE CARD ───────────────────────── */}
                <div
                  className="rounded-3xl overflow-hidden relative shadow-md p-4 space-y-4"
                  style={{
                    background: cardBgHex,
                    border: `1px solid ${borderHex}`,
                  }}
                >
                  {/* Top Gradient Ribbon */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ background: 'linear-gradient(90deg,#7C3AED,#3B82F6,#10B981)' }}
                  />

                  {/* Header Row: Avatar + User Info */}
                  <div className="flex items-start justify-between gap-3 pt-1">
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div
                          className="w-16 h-16 rounded-2xl overflow-hidden border-2 shadow-sm flex items-center justify-center"
                          style={{
                            borderColor: profileData.profile.openToWork ? '#10B981' : accentHex,
                            background: 'linear-gradient(135deg,#7C3AED,#4F46E5)',
                          }}
                        >
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={profileData.user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-white font-black text-xl">{profileData.user.name?.[0]?.toUpperCase()}</span>
                          )}
                        </div>
                        {profileData.profile.openToWork && (
                          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-[8px] font-black text-white shadow-md border-2" style={{ borderColor: cardBgHex }}>
                            HIRING
                          </span>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h2 className="text-base font-black tracking-tight" style={{ color: textHex, WebkitTextFillColor: textHex }}>
                            {profileData.user.name}
                          </h2>
                          <CheckCircle2 size={16} className="shrink-0" style={{ color: accentHex, stroke: accentHex }} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs font-semibold" style={{ color: mutedHex, WebkitTextFillColor: mutedHex }}>
                            @{profileData.profile.username || 'user'}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded-lg text-[9px] font-black shrink-0 shadow-sm flex items-center gap-1 text-white"
                            style={{ background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
                          >
                            <Zap size={10} style={{ color: '#FFFFFF', stroke: '#FFFFFF', fill: '#FFFFFF' }} />
                            {profileData.planInfo.planName}
                          </span>
                        </div>
                        {profileData.profile.headline && (
                          <p className="text-xs font-medium leading-tight mt-1 line-clamp-2" style={{ color: textHex, WebkitTextFillColor: textHex }}>
                            {profileData.profile.headline}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Profile Strength Progress Bar */}
                  <div
                    className="p-3 rounded-2xl space-y-1.5 shadow-inner"
                    style={{ background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)' }}
                  >
                    <div className="flex items-center justify-between text-[11px] font-extrabold">
                      <span className="flex items-center gap-1.5" style={{ color: textHex, WebkitTextFillColor: textHex }}>
                        <Sparkle size={13} style={{ color: accentHex, stroke: accentHex }} />
                        Profile Strength: {profileStrength.label}
                      </span>
                      <span style={{ color: accentHex, WebkitTextFillColor: accentHex }}>{profileStrength.score}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: isLight ? '#CBD5E1' : 'rgba(255,255,255,0.1)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${profileStrength.score}%`,
                          background: 'linear-gradient(90deg, #7C3AED 0%, #3B82F6 50%, #10B981 100%)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Quick Actions Bar */}
                  <div className="grid grid-cols-3 gap-2 pt-1.5 border-t" style={{ borderColor: borderHex }}>
                    <button
                      onClick={copyPublicLink}
                      className="py-2.5 px-2 rounded-2xl text-[10px] font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                      style={{
                        background: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.06)',
                        color: textHex,
                        WebkitTextFillColor: textHex,
                        border: `1px solid ${isLight ? '#CBD5E1' : borderHex}`,
                      }}
                    >
                      <Share2 size={13} style={{ color: accentHex, stroke: accentHex }} />
                      Share Link
                    </button>

                    {profileData.profile.username && (
                      <Link
                        href={`/u/${profileData.profile.username}`}
                        target="_blank"
                        className="py-2.5 px-2 rounded-2xl text-[10px] font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                        style={{
                          background: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.06)',
                          color: textHex,
                          WebkitTextFillColor: textHex,
                          border: `1px solid ${isLight ? '#CBD5E1' : borderHex}`,
                        }}
                      >
                        <ExternalLink size={13} style={{ color: accentHex, stroke: accentHex }} />
                        Public View
                      </Link>
                    )}

                    <button
                      onClick={() => openSubView('basic')}
                      className="py-2.5 px-2 rounded-2xl text-[10px] font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                      style={{
                        background: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.06)',
                        color: textHex,
                        WebkitTextFillColor: textHex,
                        border: `1px solid ${isLight ? '#CBD5E1' : borderHex}`,
                      }}
                    >
                      <Pencil size={13} style={{ color: accentHex, stroke: accentHex }} />
                      Edit Bio
                    </button>
                  </div>
                </div>

                {/* ── ENTERPRISE INSET GROUPED SECTIONS ───────────────────── */}
                <div className="space-y-4">
                  {CATEGORY_GROUPS.map((group) => (
                    <div key={group.groupTitle} className="space-y-1.5">
                      <p
                        className="text-[10px] font-black uppercase tracking-widest px-2"
                        style={{ color: isLight ? accentHex : mutedHex, WebkitTextFillColor: isLight ? accentHex : mutedHex }}
                      >
                        {group.groupTitle}
                      </p>

                      {/* Group Container */}
                      <div
                        className="rounded-3xl overflow-hidden shadow-md"
                        style={{
                          background: cardBgHex,
                          border: `1px solid ${borderHex}`,
                        }}
                      >
                        {group.items.map((item, idx) => {
                          const Icon = item.icon;
                          const isLast = idx === group.items.length - 1;
                          return (
                            <button
                              key={item.id}
                              onClick={() => openSubView(item.id as SubViewType)}
                              className={`w-full flex items-center justify-between p-3.5 text-left active:opacity-75 transition-all ${!isLast ? 'border-b' : ''
                                }`}
                              style={{
                                borderColor: isLight ? '#E9ECEF' : borderHex,
                                background: 'transparent',
                              }}
                            >
                              <div className="flex items-center gap-3.5 min-w-0 pr-2">
                                {/* Small Circular Outline Icon Badge (matching reference UI) */}
                                <div
                                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform group-active:scale-95"
                                  style={{
                                    background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                                    border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : borderHex}`,
                                  }}
                                >
                                  <Icon size={17} style={{ color: textHex, stroke: textHex }} />
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h3
                                      className="text-xs font-extrabold truncate"
                                      style={{ color: textHex, WebkitTextFillColor: textHex }}
                                    >
                                      {item.title}
                                    </h3>
                                    {item.badge && (
                                      <span
                                        className="px-1.5 py-0.2 rounded text-[8px] font-black"
                                        style={{ background: `${accentHex}20`, color: accentHex, WebkitTextFillColor: accentHex }}
                                      >
                                        {item.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p
                                    className="text-[10px] font-medium truncate mt-0.5"
                                    style={{ color: mutedHex, WebkitTextFillColor: mutedHex }}
                                  >
                                    {item.desc}
                                  </p>
                                </div>
                              </div>

                              <ChevronRight size={16} className="shrink-0" style={{ color: isLight ? '#64748B' : mutedHex, stroke: isLight ? '#64748B' : mutedHex }} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ═════════════════════════════════════════════════════════════
               SUB-VIEW 1: BASIC INFORMATION
               ═════════════════════════════════════════════════════════════ */}
            {activeSubView === 'basic' && (
              <motion.div
                key="subview-basic"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: borderHex }}>
                  <button onClick={() => setActiveSubView(null)} className="flex items-center gap-1 text-xs font-extrabold" style={{ color: accentHex }}>
                    <ChevronLeft size={16} /> Back to Sections
                  </button>
                  <h3 className="text-sm font-black" style={{ color: textHex, WebkitTextFillColor: textHex }}>Basic Information</h3>
                </div>

                <div className="rounded-3xl p-4 space-y-3.5 shadow-md" style={{ background: cardBgHex, border: `1px solid ${borderHex}` }}>
                  <div>
                    <label className="font-bold text-xs block mb-1" style={{ color: textHex }}>Full Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none"
                      style={{ background: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.06)', color: textHex, border: `1px solid ${isLight ? '#CBD5E1' : borderHex}` }}
                    />
                  </div>
                  <div>
                    <label className="font-bold text-xs block mb-1" style={{ color: textHex }}>Username</label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none"
                      style={{ background: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.06)', color: textHex, border: `1px solid ${isLight ? '#CBD5E1' : borderHex}` }}
                    />
                  </div>
                  <div>
                    <label className="font-bold text-xs block mb-1" style={{ color: textHex }}>Headline</label>
                    <input
                      type="text"
                      value={editHeadline}
                      onChange={(e) => setEditHeadline(e.target.value)}
                      placeholder="e.g. Aspiring Data Scientist | Python Dev"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none"
                      style={{ background: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.06)', color: textHex, border: `1px solid ${isLight ? '#CBD5E1' : borderHex}` }}
                    />
                  </div>
                  <div>
                    <label className="font-bold text-xs block mb-1" style={{ color: textHex }}>Bio</label>
                    <textarea
                      rows={4}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Brief bio about your professional career..."
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none resize-none"
                      style={{ background: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.06)', color: textHex, border: `1px solid ${isLight ? '#CBD5E1' : borderHex}` }}
                    />
                  </div>
                  <div className="flex items-center gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      id="subOpenToWorkCb"
                      checked={editOpenToWork}
                      onChange={(e) => setEditOpenToWork(e.target.checked)}
                      className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
                    />
                    <label htmlFor="subOpenToWorkCb" className="font-bold text-xs cursor-pointer" style={{ color: textHex }}>
                      Show Open to Work / Hiring Badge
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleSaveBasic}
                  disabled={savingBasic}
                  className="w-full py-3.5 rounded-2xl font-black text-xs text-white flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                  style={{ background: accentHex }}
                >
                  {savingBasic ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Basic Info
                </button>
              </motion.div>
            )}

            {/* ═════════════════════════════════════════════════════════════
               SUB-VIEW 2: RESUMES & ATS CV
               ═════════════════════════════════════════════════════════════ */}
            {activeSubView === 'resumes' && (
              <motion.div
                key="subview-resumes"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: borderHex }}>
                  <button onClick={() => setActiveSubView(null)} className="flex items-center gap-1 text-xs font-extrabold" style={{ color: accentHex }}>
                    <ChevronLeft size={16} /> Back to Sections
                  </button>
                  <h3 className="text-sm font-black" style={{ color: textHex, WebkitTextFillColor: textHex }}>Resumes & ATS CV</h3>
                </div>

                <div className="rounded-3xl p-4 space-y-3 shadow-md" style={{ background: cardBgHex, border: `1px dashed ${borderHex}` }}>
                  <p className="text-xs font-bold" style={{ color: textHex }}>Upload New Resume (PDF)</p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSelectedResumeFile(e.target.files?.[0] || null)}
                    className="w-full text-xs"
                    style={{ color: textHex }}
                  />
                  {selectedResumeFile && (
                    <button
                      onClick={handleUploadResumeSubmit}
                      disabled={uploadingResume}
                      className="w-full py-2.5 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5"
                      style={{ background: accentHex }}
                    >
                      {uploadingResume ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      Upload {selectedResumeFile.name}
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {profileData.resumes.length === 0 ? (
                    <p className="text-xs italic text-center py-4" style={{ color: mutedHex }}>No resumes uploaded yet.</p>
                  ) : (
                    profileData.resumes.map((res) => (
                      <div
                        key={res.id}
                        className="rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-sm"
                        style={{ background: cardBgHex, border: `1px solid ${borderHex}` }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accentHex}18`, color: accentHex }}>
                            <FileText size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate" style={{ color: textHex }}>{res.fileName}</p>
                            <p className="text-[10px]" style={{ color: mutedHex }}>
                              Uploaded {new Date(res.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={res.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl active:opacity-70"
                            style={{ background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', color: textHex }}
                            aria-label="Download"
                          >
                            <Download size={15} />
                          </a>
                          <button
                            onClick={() => handleDeleteResumeClick(res.id)}
                            className="p-2 rounded-xl active:opacity-70"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
                            aria-label="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* ═════════════════════════════════════════════════════════════
               SUB-VIEW 3: SOCIAL & PORTFOLIO LINKS
               ═════════════════════════════════════════════════════════════ */}
            {activeSubView === 'socials' && (
              <motion.div
                key="subview-socials"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: borderHex }}>
                  <button onClick={() => setActiveSubView(null)} className="flex items-center gap-1 text-xs font-extrabold" style={{ color: accentHex }}>
                    <ChevronLeft size={16} /> Back to Sections
                  </button>
                  <h3 className="text-sm font-black" style={{ color: textHex, WebkitTextFillColor: textHex }}>Social Links</h3>
                </div>

                <div className="rounded-3xl p-4 space-y-3.5 shadow-md" style={{ background: cardBgHex, border: `1px solid ${borderHex}` }}>
                  <div>
                    <label className="font-bold text-xs flex items-center gap-1.5 mb-1" style={{ color: textHex }}>
                      <Github size={14} style={{ color: isLight ? accentHex : textHex, stroke: isLight ? accentHex : textHex }} /> GitHub Profile URL
                    </label>
                    <input
                      type="text"
                      value={editGithub}
                      onChange={(e) => setEditGithub(e.target.value)}
                      placeholder="https://github.com/username"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none"
                      style={{ background: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.06)', color: textHex, border: `1px solid ${isLight ? '#CBD5E1' : borderHex}` }}
                    />
                  </div>

                  <div>
                    <label className="font-bold text-xs flex items-center gap-1.5 mb-1" style={{ color: textHex }}>
                      <Linkedin size={14} style={{ color: isLight ? accentHex : textHex, stroke: isLight ? accentHex : textHex }} /> LinkedIn Profile URL
                    </label>
                    <input
                      type="text"
                      value={editLinkedin}
                      onChange={(e) => setEditLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none"
                      style={{ background: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.06)', color: textHex, border: `1px solid ${isLight ? '#CBD5E1' : borderHex}` }}
                    />
                  </div>

                  <div>
                    <label className="font-bold text-xs flex items-center gap-1.5 mb-1" style={{ color: textHex }}>
                      <Globe size={14} style={{ color: isLight ? accentHex : textHex, stroke: isLight ? accentHex : textHex }} /> Personal Portfolio URL
                    </label>
                    <input
                      type="text"
                      value={editPortfolio}
                      onChange={(e) => setEditPortfolio(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none"
                      style={{ background: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.06)', color: textHex, border: `1px solid ${isLight ? '#CBD5E1' : borderHex}` }}
                    />
                  </div>

                  <div>
                    <label className="font-bold text-xs flex items-center gap-1.5 mb-1" style={{ color: textHex }}>
                      <Code size={14} style={{ color: isLight ? accentHex : textHex, stroke: isLight ? accentHex : textHex }} /> LeetCode Profile URL
                    </label>
                    <input
                      type="text"
                      value={editLeetcode}
                      onChange={(e) => setEditLeetcode(e.target.value)}
                      placeholder="https://leetcode.com/username"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none"
                      style={{ background: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.06)', color: textHex, border: `1px solid ${isLight ? '#CBD5E1' : borderHex}` }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveSocials}
                  disabled={savingSocials}
                  className="w-full py-3.5 rounded-2xl font-black text-xs text-white flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                  style={{ background: accentHex }}
                >
                  {savingSocials ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Social Links
                </button>
              </motion.div>
            )}

            {/* ═════════════════════════════════════════════════════════════
               SUB-VIEW 4, 5, 6, 7, 8: SECTIONS (Skills, Experiences, Educations, Certs, Projects)
               ═════════════════════════════════════════════════════════════ */}
            {['skills', 'experiences', 'educations', 'certifications', 'projects'].includes(activeSubView || '') && (
              <motion.div
                key={`subview-${activeSubView}`}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: borderHex }}>
                  <button onClick={() => setActiveSubView(null)} className="flex items-center gap-1 text-xs font-extrabold" style={{ color: accentHex }}>
                    <ChevronLeft size={16} /> Back to Sections
                  </button>
                  <h3 className="text-sm font-black capitalize" style={{ color: textHex, WebkitTextFillColor: textHex }}>{activeSubView}</h3>
                </div>

                <div className="rounded-3xl p-4 space-y-3 shadow-md" style={{ background: cardBgHex, border: `1px solid ${borderHex}` }}>
                  <p className="text-xs font-bold capitalize" style={{ color: textHex }}>Add New {activeSubView?.slice(0, -1)}</p>
                  <input
                    type="text"
                    value={itemTitle}
                    onChange={(e) => setItemTitle(e.target.value)}
                    placeholder="Title / Name"
                    className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                    style={{ background: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.06)', color: textHex, border: `1px solid ${isLight ? '#CBD5E1' : borderHex}` }}
                  />
                  <input
                    type="text"
                    value={itemSubTitle}
                    onChange={(e) => setItemSubTitle(e.target.value)}
                    placeholder="Subtitle / Description"
                    className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                    style={{ background: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.06)', color: textHex, border: `1px solid ${isLight ? '#CBD5E1' : borderHex}` }}
                  />
                  <button
                    onClick={() => { setAddItemType(activeSubView as string); handleAddSectionSubmit(); }}
                    disabled={!itemTitle || addingItem}
                    className="w-full py-2.5 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
                    style={{ background: accentHex }}
                  >
                    {addingItem ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {((profileData.sections as any)?.[activeSubView as string] || []).length === 0 ? (
                    <p className="text-xs italic text-center py-4" style={{ color: mutedHex }}>No {activeSubView} added yet.</p>
                  ) : (
                    ((profileData.sections as any)?.[activeSubView as string] || []).map((it: any, idx: number) => (
                      <div
                        key={it.id || idx}
                        className="flex items-center justify-between p-3.5 rounded-2xl shadow-sm"
                        style={{ background: cardBgHex, border: `1px solid ${borderHex}` }}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold truncate" style={{ color: textHex }}>
                            {it.name || it.title || 'Untitled'}
                          </p>
                          {(it.subtitle || it.description) && (
                            <p className="text-[11px] truncate mt-0.5" style={{ color: mutedHex }}>
                              {it.subtitle || it.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteSectionClick(activeSubView as string, it.id)}
                          className="p-2 rounded-xl active:opacity-70 shrink-0"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
                          aria-label="Delete item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* ═════════════════════════════════════════════════════════════
               SUB-VIEW 9: PLAN & SUBSCRIPTIONS
               ═════════════════════════════════════════════════════════════ */}
            {activeSubView === 'plan' && (
              <motion.div
                key="subview-plan"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: borderHex }}>
                  <button onClick={() => setActiveSubView(null)} className="flex items-center gap-1 text-xs font-extrabold" style={{ color: accentHex }}>
                    <ChevronLeft size={16} /> Back to Sections
                  </button>
                  <h3 className="text-sm font-black" style={{ color: textHex, WebkitTextFillColor: textHex }}>Plan & Billing</h3>
                </div>

                <div className="rounded-3xl p-4 space-y-3 shadow-md" style={{ background: cardBgHex, border: `1px solid ${borderHex}` }}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-wider" style={{ color: mutedHex }}>Current Plan</p>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-purple-600 text-white">
                      {profileData.planInfo.planName}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="p-3 rounded-xl" style={{ background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)' }}>
                      <p className="text-[10px] font-bold" style={{ color: mutedHex }}>Monthly Limit</p>
                      <p className="text-sm font-black mt-0.5" style={{ color: textHex }}>
                        {profileData.planInfo.isUnlimited ? 'Unlimited' : profileData.planInfo.monthlyLimit}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl" style={{ background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)' }}>
                      <p className="text-[10px] font-bold" style={{ color: mutedHex }}>Remaining Uses</p>
                      <p className="text-sm font-black mt-0.5" style={{ color: accentHex }}>
                        {profileData.planInfo.isUnlimited ? 'Unlimited' : profileData.planInfo.remainingUses}
                      </p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/billing"
                  className="w-full py-3.5 rounded-2xl font-black text-xs text-white flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                  style={{ background: 'linear-gradient(135deg,#7C3AED,#4F46E5)' }}
                >
                  <Zap size={16} /> Upgrade / Manage Subscription
                </Link>
              </motion.div>
            )}

            {/* ═════════════════════════════════════════════════════════════
               SUB-VIEW 10: PUBLIC PROFILE SETTINGS
               ═════════════════════════════════════════════════════════════ */}
            {activeSubView === 'public' && (
              <motion.div
                key="subview-public"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: borderHex }}>
                  <button onClick={() => setActiveSubView(null)} className="flex items-center gap-1 text-xs font-extrabold" style={{ color: accentHex }}>
                    <ChevronLeft size={16} /> Back to Sections
                  </button>
                  <h3 className="text-sm font-black" style={{ color: textHex, WebkitTextFillColor: textHex }}>Public Privacy</h3>
                </div>

                <div className="rounded-3xl p-4 space-y-3.5 shadow-md" style={{ background: cardBgHex, border: `1px solid ${borderHex}` }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-extrabold" style={{ color: textHex }}>Enable Public Profile</p>
                      <p className="text-[11px]" style={{ color: mutedHex }}>Make profile accessible via public URL</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={publicEnabled}
                      onChange={(e) => setPublicEnabled(e.target.checked)}
                      className="w-5 h-5 rounded accent-purple-600 cursor-pointer"
                    />
                  </div>

                  {profileData.profile.username && (
                    <div className="p-3 rounded-xl space-y-2" style={{ background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)' }}>
                      <p className="text-[10px] font-bold" style={{ color: mutedHex }}>Shareable Profile URL</p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold truncate" style={{ color: accentHex }}>
                          {`/u/${profileData.profile.username}`}
                        </span>
                        <button
                          onClick={copyPublicLink}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0"
                          style={{ background: `${accentHex}20`, color: accentHex }}
                        >
                          {copiedLink ? <Check size={12} /> : <Copy size={12} />}
                          {copiedLink ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSavePublic}
                  disabled={savingPublic}
                  className="w-full py-3.5 rounded-2xl font-black text-xs text-white flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                  style={{ background: accentHex }}
                >
                  {savingPublic ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Privacy Settings
                </button>
              </motion.div>
            )}

            {/* ═════════════════════════════════════════════════════════════
               SUB-VIEW 11: PRACTICE ACTIVITY HISTORY
               ═════════════════════════════════════════════════════════════ */}
            {activeSubView === 'activity' && (
              <motion.div
                key="subview-activity"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: borderHex }}>
                  <button onClick={() => setActiveSubView(null)} className="flex items-center gap-1 text-xs font-extrabold" style={{ color: accentHex }}>
                    <ChevronLeft size={16} /> Back to Sections
                  </button>
                  <h3 className="text-sm font-black" style={{ color: textHex, WebkitTextFillColor: textHex }}>Activity Matrix</h3>
                </div>

                <div className="rounded-3xl p-4 space-y-3 shadow-md" style={{ background: cardBgHex, border: `1px solid ${borderHex}` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider" style={{ color: mutedHex }}>
                      Last 120 Days Activity
                    </span>
                  </div>

                  <div className="grid grid-cols-12 gap-1.5 pt-1">
                    {heatmapDays.map((day) => {
                      const count = day.count;
                      const bg =
                        count === 0
                          ? isLight ? '#CBD5E1' : 'rgba(255,255,255,0.08)'
                          : count < 3
                            ? '#A78BFA'
                            : count < 6
                              ? '#8B5CF6'
                              : '#6D28D9';
                      return (
                        <div
                          key={day.key}
                          className="h-3.5 rounded-sm transition-transform active:scale-125"
                          style={{ background: bg }}
                          title={`${day.key}: ${count} sessions`}
                        />
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ── ASK AI FAB ─────────────────────────────────────────────────── */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 20 }}
        onClick={() => router.push('/train/chat')}
        className="fixed right-5 z-[210] sm:hidden w-14 h-14 rounded-full flex flex-col items-center justify-center gap-0.5 active:scale-95 shadow-xl"
        style={{
          bottom: '80px',
          background: 'linear-gradient(135deg,#7C3AED 0%,#4F46E5 100%)',
          boxShadow: '0 8px 24px rgba(124,58,237,0.45)',
          border: '1.5px solid rgba(255,255,255,0.3)',
        }}
        aria-label="Ask AI"
      >
        <Sparkles size={18} style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
        <span className="font-black tracking-wide" style={{ fontSize: '9px', color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>
          Ask AI
        </span>
      </motion.button>

      {/* ── BOTTOM TAB BAR (identical to MobileTrainPage — Profile highlighted) ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[210] sm:hidden flex items-end justify-around"
        style={{ height: '64px', paddingBottom: 'env(safe-area-inset-bottom, 4px)' }}
      >
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
          <svg
            viewBox="0 0 375 64"
            preserveAspectRatio="none"
            className="w-full h-full"
            style={{ filter: isLight ? 'drop-shadow(0px -4px 12px rgba(0,0,0,0.08))' : 'drop-shadow(0px -4px 16px rgba(0,0,0,0.3))' }}
          >
            <path
              d="M 0,0 L 132,0 C 152,0 160,24 187.5,24 C 215,24 223,0 243,0 L 375,0 L 375,64 L 0,64 Z"
              fill={isLight ? '#FFFFFF' : cardBgHex}
              stroke={isLight ? '#E2E8F0' : borderHex}
              strokeWidth="1"
            />
          </svg>
        </div>

        <div className="relative z-10 flex items-center justify-around w-full h-full pt-1 px-1">
          {TABS.map((tab) => {
            const isHome = tab.label === 'Home';
            const isActive = tab.label === 'Profile';
            const activeColor = isLight ? '#7C3AED' : accentHex;
            const inactiveIconColor = isLight ? '#475569' : mutedHex;
            const inactiveTextColor = isLight ? '#334155' : mutedHex;

            const iconColor = (isHome || isActive) ? activeColor : inactiveIconColor;
            const textColor = (isHome || isActive) ? activeColor : inactiveTextColor;

            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[54px] flex-1 active:opacity-75 ${isHome ? '-mt-5' : 'pb-1'
                  }`}
                aria-label={tab.label}
              >
                {isHome ? (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 shrink-0"
                    style={{ backgroundColor: '#7C3AED', boxShadow: '0 6px 16px rgba(124, 58, 237, 0.45)' }}
                  >
                    <Home size={22} strokeWidth={2.2} style={{ color: '#FFFFFF', stroke: '#FFFFFF', fill: 'none' }} />
                  </div>
                ) : (
                  <tab.icon size={22} style={{ color: iconColor, stroke: iconColor }} />
                )}
                <span
                  className="font-extrabold"
                  style={{ fontSize: '10px', color: textColor, WebkitTextFillColor: textColor, marginTop: isHome ? '1px' : '0px' }}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── SIDEBAR DRAWER (identical to MobileTrainPage) ─────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/55 z-[300]"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 left-0 bottom-0 z-[310] flex flex-col shadow-2xl"
              style={{ width: '280px', background: cardBgHex, borderRight: `1px solid ${borderHex}` }}
            >
              <div className="flex items-center justify-between px-4 shrink-0" style={{ height: '56px', borderBottom: `1px solid ${borderHex}` }}>
                <div className="flex items-center gap-2.5">
                  <LogoContainer />
                  <span className="font-black text-lg tracking-tight" style={{ background: 'linear-gradient(90deg,#7C3AED,#4F46E5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Fluenzy AI
                  </span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg active:opacity-60" style={{ color: mutedHex }} aria-label="Close menu">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
                {SIDEBAR_SECTIONS.map((section) => (
                  <div key={section.title}>
                    <p className="font-black uppercase px-3 mb-1" style={{ fontSize: '10px', letterSpacing: '0.12em', color: mutedHex }}>
                      {section.title}
                    </p>
                    <div className="space-y-0.5">
                      {section.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors active:opacity-70"
                          style={{ color: mutedHex }}
                        >
                          <item.icon size={17} className="shrink-0" />
                          <span className="text-sm font-medium" style={{ color: textHex }}>{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 shrink-0" style={{ borderTop: `1px solid ${borderHex}` }}>
                <div className="flex items-center gap-3 p-3 rounded-xl mb-2" style={{ background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)' }}>
                  <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#7C3AED,#4F46E5)' }}>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-white font-black text-sm">{firstName[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate" style={{ color: textHex }}>{profileData?.user?.name || 'User'}</p>
                    <p className="truncate" style={{ fontSize: '11px', color: mutedHex }}>{profileData?.user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setSidebarOpen(false); signOut({ callbackUrl: '/' }); }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-semibold active:opacity-70"
                  style={{ color: '#EF4444' }}
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
