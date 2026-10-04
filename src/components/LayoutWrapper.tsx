'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import SideChatBot from '@/components/chat/SideChatBot';
import NotificationBell from '@/components/NotificationBell';
import NotificationBadge from '@/components/NotificationBadge';
import {
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Zap,
  BarChart3,
  History,
  Sun,
  Moon,
  Monitor,
  Sparkles,
  Bell,
  User,
  CreditCard,
  LogOut,
  Building2,
  Briefcase,
  MessageSquare,
  BookOpen,
  Code,
  GraduationCap,
  Users,
  Phone,
  BookMarked,
  LayoutDashboard,
  Radio,
  Lock,
  Shuffle,
  Crown,
  ShieldCheck,
  CheckCircle,
  Clock,
  Award,
  Bookmark,
  Leaf,
  Coffee,
  Terminal,
  Trophy,
  Home,
  Search,
  Flame
} from 'lucide-react';
import { useTheme, ThemeName, themeConfig } from '@/contexts/ThemeContext';

const navItems = [
  { href: '/train', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/train/competitions', label: 'Competitions', icon: Trophy, badge: 'New' },
  { href: '/train/live', label: 'Live GD', icon: Radio },
  { href: '/train/hr', label: 'HR Interview', icon: User },
  { href: '/train/gd-coach', label: 'GD Coach', icon: GraduationCap },
  { href: '/train/gd-agent', label: 'GD Agent', icon: Users },
  { href: '/train/technical', label: 'Technical', icon: Code },
  { href: '/train/company', label: 'Company', icon: Building2 },
  { href: '/train/daily', label: 'Daily Practice', icon: MessageSquare },
  { href: '/train/latest-topics', label: 'Latest Topics', icon: Zap },
  { href: '/train/english', label: 'English Learning', icon: BookOpen },
  { href: '/train/vocabulary', label: 'Vocabulary', icon: BookMarked },
  { href: '/train/corporate-voice', label: 'Voice Practice', icon: Phone },
];

const jobCareerItems = [
  { href: '/train/auto-apply-setup', label: 'Auto-Apply Setup', icon: ShieldCheck },
  { href: '/train/job-search', label: 'AI Job Search', icon: Zap },
  { href: '/train/saved-jobs', label: 'Saved Jobs', icon: Bookmark },
  { href: '/train/applications', label: 'My Applications', icon: Briefcase },
  { href: '/train/assessments', label: 'My Assessments', icon: Award },
  { href: '/train/auto-apply-activity', label: 'Auto-Apply Activity', icon: BarChart3 },
  { href: '/jobs', label: 'Browse Jobs', icon: Briefcase },
];

const secondaryNavItems = [
  { href: '/interview-guide', label: 'Interview Guide', icon: GraduationCap },
  { href: '/ats', label: 'Advanced ATS System', icon: ShieldCheck },
  { href: '/history', label: 'History', icon: History },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/billing', label: 'Billing', icon: CreditCard },
];
const topQuickLinks = [
  { href: '/history', label: 'History' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/interview-guide', label: 'Interview Guide' },
];

const themeOptions: { value: ThemeName; label: string; icon: typeof Moon }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'midnight', label: 'Night', icon: Moon },
  { value: 'forest', label: 'Forest', icon: Leaf },
  { value: 'parchment', label: 'Parchment', icon: Coffee },
  { value: 'codeterm', label: 'Code', icon: Terminal },
];

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [isMobileViewport, setIsMobileViewport] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [planInfo, setPlanInfo] = useState<any>(null);
  const [imageError, setImageError] = useState(false);
  const [isPracticeOpen, setIsPracticeOpen] = useState(true);
  const [autoApplyStatus, setAutoApplyStatus] = useState<{ completed: boolean; enabled: boolean }>({
    completed: false,
    enabled: false,
  });
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingFriends, setPendingFriends] = useState(0);

  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;
  const isLight = resolvedTheme === 'parchment' || resolvedTheme === 'light';

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 640px)');
    const updateViewport = (event?: MediaQueryListEvent) => {
      setIsMobileViewport(event ? event.matches : mediaQuery.matches);
    };

    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  // Extract user info from planInfo
  const userData = planInfo?.user ? {
    name: planInfo.user.name,
    email: planInfo.user.email,
    avatar: planInfo.user.avatar
  } : null;

  // Get the best avatar URL
  const avatarUrl = userData?.avatar || session?.user?.image || null;
  const showAvatarImage = avatarUrl && !imageError;
  const displayName = userData?.name || session?.user?.name || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();

  // Reset image error when avatar URL changes
  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  // Poll unread messages and pending friend requests (every 30s)
  const fetchSocialCounts = useCallback(async () => {
    try {
      const [msgRes, friendRes] = await Promise.all([
        fetch('/api/chat/conversations?unreadCount=true'),
        fetch('/api/chat/friends?type=count'),
      ]);
      if (msgRes.ok) {
        const data = await msgRes.json();
        setUnreadMessages(data.unreadCount ?? 0);
      }
      if (friendRes.ok) {
        const data = await friendRes.json();
        setPendingFriends(data.count ?? 0);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    fetchSocialCounts();
    const id = setInterval(fetchSocialCounts, 30000);
    return () => clearInterval(id);
  }, [session, fetchSocialCounts]);

  // Fetch user plan info and auto-apply status
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [planRes, autoApplyRes] = await Promise.all([
          fetch('/api/user-plan'),
          fetch('/api/candidates/preferences')
        ]);

        if (planRes.ok) {
          const data = await planRes.json();
          setPlanInfo(data);
        }

        if (autoApplyRes.ok) {
          const autoApplyData = await autoApplyRes.json();
          if (autoApplyData.preferences) {
            setAutoApplyStatus({
              completed: !!autoApplyData.preferences.targetRoles?.length || !!autoApplyData.preferences.preferredLocations?.length,
              enabled: autoApplyData.preferences.autoApplyEnabled || false,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (session?.user) {
      fetchData();
    }
  }, [session]);

  const [isEmbeddedFromLocation, setIsEmbeddedFromLocation] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const value = new URLSearchParams(window.location.search).get("embed") === "1";
    setIsEmbeddedFromLocation(value);
  }, [pathname, searchParams]);

  const isEmbedded = searchParams.get("embed") === "1" || isEmbeddedFromLocation;
  const isReportPrintMode = pathname.startsWith('/analytics/report') && searchParams.get("print") === "1";
  const hideFooter =
    !!session?.user ||
    ['/train', '/history', '/features', '/pricing', '/analytics', '/interview-guide'].some(path => pathname.startsWith(path)) ||
    pathname.startsWith('/analytics/report') ||
    isEmbedded;
  const isLiveTrainingRoute =
    pathname.startsWith('/train/live') || pathname.startsWith('/train/live-gd');
  const isAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname === '/company/login' ||
    pathname === '/college/login' ||
    pathname === '/company/signup' ||
    pathname === '/college/signup';
  const hideNav =
    isEmbedded ||
    isReportPrintMode ||
    isAuthPage ||
    (isLiveTrainingRoute && isMobileViewport !== false) ||
    (pathname.startsWith('/install') && isMobileViewport !== false);

  const isMobilePageWithOwnHeader = isMobileViewport !== false && [
    '/train', '/analytics', '/profile', '/billing', '/ats', '/interview-guide', '/history', '/practice'
  ].some(path => pathname.startsWith(path));

  const isSuperAdminPage = pathname.startsWith('/superadmin');
  const isCollegePage = pathname.startsWith('/college');
  const isCompanyPortalLanding = pathname === '/company-portal';
  const isPortalPage = pathname.startsWith('/portal');
  const isCandidatePage = pathname.startsWith('/candidates');

  // ── Candidate Portal: completely separate layout (has its own CandidatePortalLayout) ──
  if (isCandidatePage) {
    return <>{children}</>;
  }

  // ── Super Admin: completely separate clean layout ──────────────────────────
  if (isSuperAdminPage) {
    return (
      <div className={`min-h-screen flex flex-col ${currentTheme.background}`}>
        {/* Minimal Super Admin top bar */}
        <header className={`h-14 border-b ${currentTheme.cardBorder} ${currentTheme.background} flex items-center justify-between px-6 sticky top-0 z-30`}>
          <div className="flex items-center gap-3">
            <div className={`p-1 rounded-xl transition-all ${isLight
              ? 'bg-[#F0EDFF] border border-[#C4B5FD]'
              : 'bg-gradient-to-br from-indigo-600 to-purple-600 shadow-md'
              }`}>
              <img
                src="/favicon/apple-touch-icon.png"
                alt="Fluenzy AI Logo"
                className="w-9 h-9 rounded-lg object-contain"
              />
            </div>
            <span className={`font-bold ${currentTheme.text}`}>
              Fluenzy <span className={currentTheme.accent}>AI</span>
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 ml-1">SUPER ADMIN</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <div className="relative">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className={`p-2 rounded-lg ${currentTheme.textMuted} hover:${currentTheme.text} hover:bg-white/5 transition-colors`}
              >
                {theme === 'dark' && <Moon size={18} />}
                {theme === 'midnight' && <Sparkles size={18} />}
                {theme === 'forest' && <Leaf size={18} />}
                {theme === 'parchment' && <Coffee size={18} />}
                {theme === 'codeterm' && <Terminal size={18} />}
                {theme === 'light' && <Sun size={18} />}
              </button>
              <AnimatePresence>
                {showThemeMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowThemeMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className={`absolute right-0 top-full mt-2 w-44 rounded-xl overflow-hidden shadow-2xl z-50 border ${isLight
                        ? 'bg-white border-[#E5E0FF] text-[#1E1B3A]'
                        : 'bg-slate-900 border-slate-700 text-white'
                        }`}
                    >
                      {themeOptions.map((option) => {
                        const isSelected = theme === option.value;
                        const OptionIcon = option.icon;
                        const itemTextColor = isSelected
                          ? '#7C3AED'
                          : (isLight ? '#1C1917' : '#E2E8F0');
                        const itemIconColor = isSelected
                          ? '#7C3AED'
                          : (isLight ? '#475569' : '#94A3B8');

                        return (
                          <button
                            key={option.value}
                            onClick={() => {
                              setTheme(option.value as any);
                              setShowThemeMenu(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-extrabold transition-colors ${isSelected
                              ? (isLight ? 'bg-purple-100/80' : 'bg-purple-900/30')
                              : (isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800')
                              }`}
                            style={{
                              color: itemTextColor,
                              WebkitTextFillColor: itemTextColor,
                            }}
                          >
                            <OptionIcon size={16} style={{ color: itemIconColor, stroke: itemIconColor }} />
                            <span>{option.label}</span>
                          </button>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar + sign out */}
            {session?.user && (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${currentTheme.cardBg} border ${currentTheme.cardBorder} hover:border-red-500/30 transition-colors`}
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-bold text-xs overflow-hidden">
                    {showAvatarImage ? (
                      <img src={avatarUrl!} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={() => setImageError(true)} />
                    ) : userInitial}
                  </div>
                  <span className={`text-sm font-medium ${currentTheme.text} hidden sm:block`}>{displayName}</span>
                  <ChevronDown size={13} className={currentTheme.textMuted} />
                </button>
                <AnimatePresence>
                  {showProfileMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className={`absolute right-0 top-full mt-2 w-52 ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-xl overflow-hidden shadow-xl z-50`}
                      >
                        <div className={`px-4 py-3 border-b ${currentTheme.cardBorder}`}>
                          <p className={`text-sm font-semibold ${currentTheme.text} truncate`}>{displayName}</p>
                          <p className={`text-xs ${currentTheme.textMuted} truncate`}>{session.user.email}</p>
                        </div>
                        <div className="p-2">
                          <Link
                            href="/train"
                            onClick={() => setShowProfileMenu(false)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${currentTheme.textMuted} hover:${currentTheme.text} hover:bg-white/5 transition-colors`}
                          >
                            <LayoutDashboard size={15} />
                            Go to App
                          </Link>
                          <button
                            onClick={() => { setShowProfileMenu(false); signOut({ callbackUrl: '/' }); }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <LogOut size={15} />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </header>

        {/* Full-width content, no sidebar */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    );
  }
  // ────────────────────────────────────────────────────────────────────────────

  // ── College Portal: completely separate layout (no main-site nav) ──────────
  if (isCollegePage) {
    return <>{children}</>;
  }
  if (isCompanyPortalLanding) {
    return <>{children}</>;
  }
  // ────────────────────────────────────────────────────────────────────────────

  // ── HR / Admin Portal: completely separate layout (no main-site nav) ───────
  if (isPortalPage) {
    return <>{children}</>;
  }
  // ────────────────────────────────────────────────────────────────────────────

  // Show persistent sidebar if logged in and not on a special page
  const showSidebar = !!session?.user && !hideNav && !isAuthPage;
  const shouldExpandSidebar = sidebarOpen || sidebarHovered;

  // Don't render sidebar wrapper on pages without sidebar
  if (!showSidebar) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <div className="flex flex-1">
          <main className="flex-1">
            {!hideNav && <Navbar showSidebar={false} userData={userData} />}
            <div className="pt-10">
              {children}
            </div>
            {!hideFooter && !hideNav && <Footer />}
          </main>
        </div>
      </div>
    );
  }

  const Sidebar = ({ collapsed = false, mobile = false }: { collapsed?: boolean; mobile?: boolean }) => {
    const practiceSubItems = [
      { href: '/train', label: 'Practice Modules', icon: Home },
      { href: '/train/company', label: 'Company Interview', icon: Building2 },
      { href: '/train/hr', label: 'HR Interview', icon: User },
      { href: '/train/gd-agent', label: 'AI Interview', icon: MessageSquare },
      { href: '/train/gd-coach', label: 'Group Discussion', icon: Users },
      { href: '/train/technical', label: 'Technical Interview', icon: Code },
      { href: '/train/english', label: 'English Practice', icon: BookOpen },
    ];

    const isPracticeActive = pathname.startsWith('/train');

    return (
      <div className={`flex flex-col h-full ${isLight ? 'bg-[#FAFAFB]' : 'bg-[#0B0E14]'} ${mobile ? 'w-full' : ''}`}>
        {/* Logo */}
        <div className={`p-4 border-b ${currentTheme.cardBorder} flex items-center justify-between`}>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <img
                src={isLight ? '/favicon/apple-touch-icon.png' : '/white-removebg-preview1.png'}
                alt="Fluenzy AI Logo"
                className="w-5 h-5 object-contain"
              />
            </div>
            {!collapsed && (
              <span className={`font-extrabold text-xl tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Fluenzy <span className="text-orange-500">AI</span>
              </span>
            )}
          </Link>
          {mobile && (
            <button onClick={() => setMobileMenuOpen(false)} className={`p-2 rounded-lg transition-colors ${currentTheme.textMuted} hover:${currentTheme.text} ${isLight ? 'hover:bg-slate-100' : 'hover:bg-white/10'}`}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 scrollbar-thin">
          {/* Home Link */}
          <Link
            href="/"
            onClick={() => mobile && setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              pathname === '/'
                ? isLight
                  ? 'bg-amber-500/10 text-amber-700 font-semibold'
                  : 'bg-orange-500/15 text-orange-400 font-semibold'
                : isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            } ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Home' : undefined}
          >
            <Home size={18} />
            {!collapsed && <span>Home</span>}
          </Link>

          {/* Practice Section with Subpart Accordion */}
          <div>
            <button
              onClick={() => setIsPracticeOpen(!isPracticeOpen)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isPracticeActive
                  ? isLight
                    ? 'bg-amber-500/10 text-amber-700'
                    : 'bg-orange-500/15 text-orange-400'
                  : isLight
                  ? 'text-slate-700 hover:bg-slate-100'
                  : 'text-slate-300 hover:bg-white/5'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? 'Practice' : undefined}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1 rounded-lg ${isLight ? 'bg-amber-500/15 text-amber-600' : 'bg-orange-500/20 text-orange-400'}`}>
                  <Briefcase size={16} />
                </div>
                {!collapsed && <span>Practice</span>}
              </div>
              {!collapsed && (
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${isPracticeOpen ? 'rotate-180 text-orange-500' : 'text-slate-400'}`}
                />
              )}
            </button>

            {/* Subpart List */}
            {!collapsed && isPracticeOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-1 ml-3 pl-3 border-l-2 border-orange-500/30 space-y-1"
              >
                {practiceSubItems.map((sub) => {
                  const isSubActive = pathname === sub.href;
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={() => mobile && setMobileMenuOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        isSubActive
                          ? isLight
                            ? 'bg-amber-600/15 text-amber-800 font-bold shadow-sm'
                            : 'bg-gradient-to-r from-orange-500/30 to-amber-500/20 text-orange-300 font-bold border border-orange-500/30 shadow-md'
                          : isLight
                          ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <sub.icon size={15} className={isSubActive ? (isLight ? 'text-amber-700' : 'text-orange-400') : 'opacity-70'} />
                      <span>{sub.label}</span>
                    </Link>
                  );
                })}
              </motion.div>
            )}
          </div>

          {/* History */}
          <Link
            href="/history"
            onClick={() => mobile && setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              pathname.startsWith('/history')
                ? isLight
                  ? 'bg-amber-500/10 text-amber-700 font-semibold'
                  : 'bg-orange-500/15 text-orange-400 font-semibold'
                : isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            } ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'History' : undefined}
          >
            <History size={18} />
            {!collapsed && <span>History</span>}
          </Link>

          {/* Analytics */}
          <Link
            href="/analytics"
            onClick={() => mobile && setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              pathname.startsWith('/analytics')
                ? isLight
                  ? 'bg-amber-500/10 text-amber-700 font-semibold'
                  : 'bg-orange-500/15 text-orange-400 font-semibold'
                : isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            } ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Analytics' : undefined}
          >
            <BarChart3 size={18} />
            {!collapsed && <span>Analytics</span>}
          </Link>

          {/* Interview Guide */}
          <Link
            href="/interview-guide"
            onClick={() => mobile && setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              pathname.startsWith('/interview-guide')
                ? isLight
                  ? 'bg-amber-500/10 text-amber-700 font-semibold'
                  : 'bg-orange-500/15 text-orange-400 font-semibold'
                : isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            } ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Interview Guide' : undefined}
          >
            <BookMarked size={18} />
            {!collapsed && <span>Interview Guide</span>}
          </Link>
        </div>

        {/* Sidebar Bottom Cards: Usage ring & Upgrade Plan */}
        {!collapsed && (
          <div className={`p-3 border-t ${currentTheme.cardBorder} space-y-3`}>
            {/* Session Usage Progress Ring */}
            <div className={`p-3.5 rounded-2xl ${isLight ? 'bg-amber-500/5 border border-amber-200/60' : 'bg-slate-900/80 border border-white/5'} flex items-center gap-3`}>
              <div className="relative w-10 h-10 flex items-center justify-center">
                <svg className="w-10 h-10 transform -rotate-90">
                  <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" className={isLight ? 'text-amber-200' : 'text-slate-800'} />
                  <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" strokeDasharray={100} strokeDashoffset={40} className="text-orange-500" strokeLinecap="round" />
                </svg>
                <span className={`absolute text-[10px] font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>60%</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-white'} truncate`}>12 / 20</p>
                <p className={`text-[11px] ${currentTheme.textMuted} truncate`}>Sessions used</p>
              </div>
            </div>

            {/* Upgrade Plan Button */}
            <button
              onClick={() => {
                if (mobile) setMobileMenuOpen(false);
                window.location.href = '/billing';
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-500 via-amber-600 to-orange-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <Crown size={14} className="text-amber-200" />
              <span>Upgrade Plan</span>
            </button>

            {/* Profile User Pill */}
            {session?.user && (
              <div className={`p-2 rounded-xl flex items-center justify-between ${isLight ? 'hover:bg-slate-100' : 'hover:bg-white/5'} transition-colors cursor-pointer`} onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold text-xs overflow-hidden shadow-sm">
                    {showAvatarImage ? (
                      <img src={avatarUrl!} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={() => setImageError(true)} />
                    ) : userInitial}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'} truncate`}>{displayName}</p>
                    <p className={`text-[10px] ${currentTheme.textMuted} truncate`}>{planInfo?.plan || 'Free'} Plan</p>
                  </div>
                </div>
                <ChevronRight size={14} className={currentTheme.textMuted} />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen flex flex-col ${currentTheme.background}`}>
      <div className="flex flex-1 min-w-0 overflow-x-hidden">
        {/* Desktop Sidebar */}
        <aside
          onMouseEnter={() => !sidebarOpen && setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
          className={`hidden lg:flex flex-col border-r ${currentTheme.cardBorder} ${isLight ? 'bg-white shadow-[2px_0_12px_rgba(0,0,0,0.06)]' : currentTheme.background} transition-all duration-300 ${shouldExpandSidebar ? 'w-64' : 'w-20'} relative`}
        >
          <Sidebar collapsed={!shouldExpandSidebar} />

          {/* Collapse Toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`absolute top-1/2 -right-3 transform -translate-y-1/2 w-6 h-6 rounded-full ${currentTheme.cardBg} border ${currentTheme.cardBorder} flex items-center justify-center ${currentTheme.textMuted} hover:${currentTheme.text} transition-colors z-10`}
          >
            <ChevronRight size={14} className={`transition-transform ${shouldExpandSidebar ? 'rotate-180' : ''}`} />
          </button>
        </aside>

        {/* Mobile Sidebar */}
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/60 z-40 lg:hidden ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          style={{ transition: 'opacity 0.6s ease' }}
          onClick={() => setMobileMenuOpen(false)}
        />
        {/* Drawer */}
        <div
          className="fixed top-0 left-0 bottom-0 w-72 z-50 lg:hidden shadow-2xl"
          style={{ transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.75s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
        >
          <Sidebar mobile />
        </div>

        {/* Main Content */}
        <main className={`flex-1 min-w-0 overflow-x-hidden flex flex-col min-h-screen ${showSidebar ? 'lg:pl-0' : ''}`}>
          {/* Top Navbar */}
          {!isMobilePageWithOwnHeader && (
            <header className={`h-16 border-b ${currentTheme.cardBorder} ${currentTheme.background} flex items-center justify-between px-6 sticky top-0 z-30`}>
              {/* Left - Mobile Menu + Top Search Bar */}
              <div className="flex items-center gap-4 flex-1 max-w-xl">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className={`lg:hidden p-2 rounded-lg transition-colors ${currentTheme.textMuted} hover:${currentTheme.text} ${isLight ? 'hover:bg-slate-100' : 'hover:bg-white/5'}`}
                >
                  <Menu size={20} />
                </button>

                {/* Search Bar Input */}
                <div className="relative w-full max-w-md hidden sm:block">
                  <Search size={16} className={`absolute left-3.5 top-1/2 transform -translate-y-1/2 ${currentTheme.textMuted}`} />
                  <input
                    type="text"
                    placeholder="Search for a module, topic or company..."
                    className={`w-full pl-10 pr-16 py-2 rounded-xl text-xs font-medium border transition-all outline-none ${
                      isLight
                        ? 'bg-slate-100/80 border-slate-200 text-slate-800 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                        : 'bg-slate-900/80 border-white/10 text-white focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20'
                    }`}
                  />
                  <span className={`absolute right-3 top-1/2 transform -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                    isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    Ctrl K
                  </span>
                </div>
              </div>

              {/* Right - Actions */}
              <div className="flex items-center gap-2">
                {/* Quick Links */}
                <div className="hidden lg:flex items-center gap-1 mr-1">
                  {/* Live Link */}
                  <Link
                    href="/train/live"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pathname.startsWith('/train/live')
                      ? `${currentTheme.accent} ${currentTheme.activeNavBg}`
                      : isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : `${currentTheme.textMuted} hover:${currentTheme.text} hover:bg-white/5`
                      }`}
                  >
                    <Radio size={14} />
                    Live
                  </Link>

                  {topQuickLinks.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive
                          ? `${currentTheme.accent} ${currentTheme.activeNavBg}`
                          : isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : `${currentTheme.textMuted} hover:${currentTheme.text} hover:bg-white/5`
                          }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                {/* Theme Toggle */}
                <div className="relative">
                  <button
                    onClick={() => setShowThemeMenu(!showThemeMenu)}
                    style={{
                      color: isLight ? '#5B21E6' : '#f8fafc',
                    }}
                    className={`theme-toggle-trigger p-2 rounded-lg ${currentTheme.textMuted} hover:${currentTheme.text} ${isLight ? 'hover:bg-[#5B21E6]/10' : 'hover:bg-white/5'} transition-colors`}
                    title="Change theme"
                  >
                    {theme === 'dark' && <Moon size={20} />}
                    {theme === 'midnight' && <Sparkles size={20} />}
                    {theme === 'forest' && <Leaf size={20} />}
                    {theme === 'parchment' && <Coffee size={20} style={{ color: '#ef4444', stroke: '#ef4444' }} />}
                    {theme === 'codeterm' && <Terminal size={20} />}
                    {theme === 'light' && <Sun size={20} style={{ color: '#5B21E6', stroke: '#5B21E6' }} />}
                  </button>

                  <AnimatePresence>
                    {showThemeMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowThemeMenu(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className={`theme-toggle-dropdown absolute right-0 top-full mt-2 w-44 rounded-xl overflow-hidden shadow-2xl z-50 border ${isLight
                            ? 'bg-white border-[#E5E0FF]'
                            : 'bg-slate-900 border-slate-700'
                            }`}
                        >
                          {themeOptions.map((option) => {
                            const isSelected = theme === option.value;
                            const colorStyle = isLight
                              ? { color: isSelected ? '#5B21E6' : '#374151' }
                              : { color: isSelected ? '#e9d5ff' : '#f1f5f9' };

                            return (
                              <button
                                key={option.value}
                                data-theme-option="true"
                                onClick={() => {
                                  setTheme(option.value);
                                  setShowThemeMenu(false);
                                }}
                                style={colorStyle}
                                className={`theme-toggle-item w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all cursor-pointer ${isSelected ? 'theme-toggle-item-selected' : ''
                                  } ${isLight
                                    ? isSelected ? 'bg-[#5B21E6]/10 text-[#5B21E6]' : 'text-slate-700 hover:bg-slate-100'
                                    : isSelected ? 'bg-purple-600/30 text-purple-200' : 'hover:text-white hover:bg-slate-800'
                                  }`}
                              >
                                <option.icon size={18} style={colorStyle} />
                                <span style={{ ...colorStyle, WebkitTextFillColor: colorStyle.color }}>{option.label}</span>
                              </button>
                            );
                          })}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Messages */}
                <Link
                  href="/train/chat"
                  className={`p-2 rounded-lg transition-colors relative ${currentTheme.textMuted} hover:${currentTheme.text} ${isLight ? 'hover:bg-slate-100' : 'hover:bg-white/5'}`}
                  aria-label={unreadMessages > 0 ? `Messages, ${unreadMessages} unread` : 'Messages'}
                >
                  <MessageSquare size={20} />
                  <NotificationBadge count={unreadMessages} />
                </Link>

                {/* Friends */}
                <Link
                  href="/train/friends"
                  className={`p-2 rounded-lg transition-colors relative ${currentTheme.textMuted} hover:${currentTheme.text} ${isLight ? 'hover:bg-slate-100' : 'hover:bg-white/5'}`}
                  aria-label={pendingFriends > 0 ? `Friends, ${pendingFriends} pending` : 'Friends'}
                >
                  <Users size={20} />
                  <NotificationBadge count={pendingFriends} />
                </Link>

                {/* Notifications */}
                <NotificationBell isDark={!isLight} />

                {/* Profile Menu - Advanced SaaS Panel */}
                {session?.user && (
                  <div className="relative">
                    <button
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className={`flex items-center gap-2 p-1.5 rounded-xl ${currentTheme.cardBg} border ${currentTheme.cardBorder} ${isLight ? 'hover:border-indigo-300 hover:shadow-md' : 'hover:border-[#5B6CFF]/30'} transition-all duration-200`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5B6CFF] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                        {showAvatarImage ? (
                          <img
                            src={avatarUrl!}
                            alt={displayName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={() => setImageError(true)}
                          />
                        ) : (
                          userInitial
                        )}
                      </div>
                      <ChevronDown size={14} className={`hidden sm:block ${currentTheme.textMuted}`} />
                    </button>

                    <AnimatePresence>
                      {showProfileMenu && (
                        <>
                          {/* Backdrop */}
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowProfileMenu(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className={`absolute right-0 top-full mt-3 w-80 lg:w-96 ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-2xl overflow-hidden shadow-2xl z-50`}
                          >
                            {/* User Info Section */}
                            <div className={`p-5 border-b ${currentTheme.cardBorder} bg-gradient-to-r from-[#5B6CFF]/10 to-[#8B5CF6]/10`}>
                              <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5B6CFF] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-2xl shadow-lg overflow-hidden">
                                  {showAvatarImage ? (
                                    <img
                                      src={avatarUrl!}
                                      alt={displayName}
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                      onError={() => setImageError(true)}
                                    />
                                  ) : (
                                    userInitial
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className={`font-bold ${currentTheme.text} text-lg truncate`}>{displayName}</p>
                                    {planInfo?.isUnlimited && (
                                      <Crown size={18} className="text-amber-400 flex-shrink-0" />
                                    )}
                                  </div>
                                  <p className={`text-sm ${currentTheme.textMuted} truncate`}>{userData?.email || session?.user?.email}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${planInfo?.plan === 'Pro' ? 'bg-[#5B6CFF]/20 text-[#5B6CFF] border border-[#5B6CFF]/30' :
                                      planInfo?.plan === 'Standard' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                        'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                                      }`}>
                                      {planInfo?.plan || 'Free'} Plan
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Quick Actions */}
                            {planInfo?.plan !== 'Free' && (
                              <div className={`p-5 border-b ${isLight ? 'border-slate-200 border-dashed' : 'border-dashed border-white/10'}`}>
                                <h4 className={`text-xs font-semibold uppercase tracking-wider ${currentTheme.textMuted} mb-3`}>
                                  Subscription
                                </h4>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className={`font-semibold ${currentTheme.text}`}>
                                      {planInfo?.planName || 'Pro Plan'}
                                    </p>
                                    <p className={`text-xs ${currentTheme.textMuted}`}>
                                      {planInfo?.isUnlimited ? 'Unlimited sessions' : `₹${planInfo?.price}/month`}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setShowProfileMenu(false);
                                      window.location.href = '/billing';
                                    }}
                                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-semibold hover:from-cyan-600 hover:to-purple-600 transition-all"
                                  >
                                    Manage
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className={`p-3 ${isLight ? 'bg-slate-50 border-t border-slate-100' : 'bg-black/20'}`}>
                              <div className="grid grid-cols-2 gap-2">
                                <Link
                                  href="/profile"
                                  onClick={() => setShowProfileMenu(false)}
                                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isLight ? 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50' : `${currentTheme.textMuted} hover:${currentTheme.text} hover:bg-white/5`}`}
                                >
                                  <User size={16} />
                                  Profile
                                </Link>
                                <Link
                                  href="/billing"
                                  onClick={() => setShowProfileMenu(false)}
                                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isLight ? 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50' : `${currentTheme.textMuted} hover:${currentTheme.text} hover:bg-white/5`}`}
                                >
                                  <CreditCard size={16} />
                                  Billing
                                </Link>
                                <Link
                                  href="/history"
                                  onClick={() => setShowProfileMenu(false)}
                                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isLight ? 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50' : `${currentTheme.textMuted} hover:${currentTheme.text} hover:bg-white/5`}`}
                                >
                                  <History size={16} />
                                  History
                                </Link>
                                <button
                                  onClick={() => {
                                    setShowProfileMenu(false);
                                    signOut();
                                  }}
                                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                  <LogOut size={16} />
                                  Logout
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </header>
          )}
          {/* Page Content */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>

          {!hideFooter && !hideNav && <Footer />}
        </main>
      </div>
      <SideChatBot />
    </div>
  );
}
