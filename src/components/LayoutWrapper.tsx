'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import NotificationBell from '@/components/NotificationBell';
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
  Crown
} from 'lucide-react';
import { useTheme, ThemeName, themeConfig } from '@/contexts/ThemeContext';

const navItems = [
  { href: '/train', label: 'Dashboard', icon: LayoutDashboard },
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

const secondaryNavItems = [
  { href: '/interview-guide', label: 'Interview Guide', icon: GraduationCap },
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
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'midnight', label: 'Night', icon: Moon },
];

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [planInfo, setPlanInfo] = useState<any>(null);
  const [imageError, setImageError] = useState(false);

  const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;
  const isLight = resolvedTheme === 'light';

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

  // Fetch user plan info
  useEffect(() => {
    const fetchData = async () => {
      try {
        const planRes = await fetch('/api/user-plan');
        
        if (planRes.ok) {
          const data = await planRes.json();
          setPlanInfo(data);
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
  const hideNav = isEmbedded || isReportPrintMode;
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isSuperAdminPage = pathname.startsWith('/superadmin');
  const isCollegePage = pathname.startsWith('/college');
  const isPortalPage = pathname.startsWith('/portal');

  // ── Super Admin: completely separate clean layout ──────────────────────────
  if (isSuperAdminPage) {
    return (
      <div className={`min-h-screen flex flex-col ${currentTheme.background}`}>
        {/* Minimal Super Admin top bar */}
        <header className={`h-14 border-b ${currentTheme.cardBorder} ${currentTheme.background} flex items-center justify-between px-6 sticky top-0 z-30`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5B6CFF] to-[#8B5CF6] flex items-center justify-center">
              <span className="text-white font-black text-sm">F</span>
            </div>
            <span className={`font-bold ${currentTheme.text}`}>Fluenzy AI</span>
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
                {theme === 'light' && <Sun size={18} />}
                {theme === 'system' && <Monitor size={18} />}
                {theme === 'midnight' && <Sparkles size={18} />}
              </button>
              <AnimatePresence>
                {showThemeMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowThemeMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className={`absolute right-0 top-full mt-2 w-36 ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-xl overflow-hidden shadow-xl z-50`}
                    >
                      {themeOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => { setTheme(option.value); setShowThemeMenu(false); }}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors
                            ${theme === option.value ? 'bg-[#5B6CFF]/20 text-[#5B6CFF]' : `${currentTheme.textMuted} hover:${currentTheme.text} hover:bg-white/5`}`}
                        >
                          <option.icon size={15} />
                          {option.label}
                        </button>
                      ))}
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

  const Sidebar = ({ collapsed = false, mobile = false }: { collapsed?: boolean; mobile?: boolean }) => (
    <div className={`flex flex-col h-full ${isLight ? 'bg-white' : currentTheme.background} ${mobile ? 'w-full' : ''}`}>
      {/* Logo */}
      <div className={`p-4 border-b ${currentTheme.cardBorder} flex items-center justify-between`}>
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5B6CFF] to-[#8B5CF6] flex items-center justify-center">
            <span className="text-white font-black text-lg">F</span>
          </div>
          {!collapsed && (
            <span className={`font-bold ${currentTheme.text} text-lg`}>Fluenzy AI</span>
          )}
        </Link>
        {mobile && (
          <button onClick={() => setMobileMenuOpen(false)} className={`p-2 rounded-lg transition-colors ${currentTheme.textMuted} hover:${currentTheme.text} ${isLight ? 'hover:bg-slate-100' : 'hover:bg-white/10'}`}>
            <X size={20} />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-3 mb-2">
          <span className={`text-xs font-semibold uppercase tracking-wider ${currentTheme.textMuted}`}>
            {collapsed ? 'M' : 'Main'}
          </span>
        </div>
        
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/train' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => mobile && setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                  ${isActive
                    ? isLight
                      ? 'text-indigo-600 bg-indigo-50 font-semibold border-l-2 border-indigo-400'
                      : `${currentTheme.accent} bg-cyan-500/10`
                    : isLight
                      ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      : `${currentTheme.textMuted} hover:${currentTheme.text} hover:bg-white/5`
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={20} className={isActive ? isLight ? 'text-indigo-500' : 'text-cyan-400' : ''} />
                {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
                {isActive && (
                  <motion.div
                    layoutId={mobile ? 'activeIndicator-mobile' : 'activeIndicator-desktop'}
                    className={`ml-auto w-1.5 h-1.5 rounded-full ${isLight ? 'bg-indigo-500' : 'bg-[#5B6CFF]'}`}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className={`px-3 mt-6 mb-2`}>
          <span className={`text-xs font-semibold uppercase tracking-wider ${currentTheme.textMuted}`}>
            {collapsed ? 'S' : 'Support'}
          </span>
        </div>

        <nav className="space-y-1 px-3">
          {secondaryNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => mobile && setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                  ${isActive
                    ? isLight
                      ? 'text-indigo-600 bg-indigo-50 font-semibold border-l-2 border-indigo-400'
                      : `${currentTheme.accent} bg-cyan-500/10`
                    : isLight
                      ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      : `${currentTheme.textMuted} hover:${currentTheme.text} hover:bg-white/5`
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={20} className={isActive ? isLight ? 'text-indigo-500' : 'text-cyan-400' : ''} />
                {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Theme Selector (Bottom) */}
      {!collapsed && (
        <div className={`p-4 border-t ${currentTheme.cardBorder}`}>
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg ${currentTheme.cardBg} border ${currentTheme.cardBorder} ${isLight ? 'hover:border-indigo-300 hover:bg-indigo-50/60 shadow-sm' : 'hover:border-cyan-500/30'} transition-all duration-200`}
            >
              <div className="flex items-center gap-2">
                {React.createElement(themeOptions.find(t => t.value === theme)?.icon || Moon, { size: 16, className: currentTheme.text })}
                <span className={`text-sm ${currentTheme.text}`}>{themeOptions.find(t => t.value === theme)?.label}</span>
              </div>
              <ChevronDown size={16} className={currentTheme.textMuted} />
            </button>

            <AnimatePresence>
              {showThemeMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`absolute bottom-full left-0 right-0 mb-2 ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-lg overflow-hidden shadow-xl`}
                >
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setTheme(option.value);
                        setShowThemeMenu(false);
                      }}
                      className={`
                        w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors
                        ${theme === option.value
                          ? isLight ? 'bg-indigo-50 text-indigo-600 font-medium' : 'bg-cyan-500/20 text-cyan-400'
                          : isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : `${currentTheme.textMuted} hover:${currentTheme.text} hover:bg-white/5`
                        }
                      `}
                    >
                      <option.icon size={16} />
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );

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
          <header className={`h-16 border-b ${currentTheme.cardBorder} ${currentTheme.background} flex items-center justify-between px-4 sticky top-0 z-30`}>
            {/* Left - Mobile Menu + Breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className={`lg:hidden p-2 rounded-lg transition-colors ${currentTheme.textMuted} hover:${currentTheme.text} ${isLight ? 'hover:bg-slate-100' : 'hover:bg-white/5'}`}
              >
                <Menu size={20} />
              </button>
              
              {/* Breadcrumb */}
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <Link href="/train" className={`${currentTheme.textMuted} hover:${currentTheme.text} transition-colors`}>
                  Train
                </Link>
                {pathname !== '/train' && (
                  <>
                    <ChevronRight size={14} className={currentTheme.textMuted} />
                    <span className={`${currentTheme.text} font-medium`}>
                      {navItems.find(n => n.href === pathname)?.label || 'Page'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-2">
              {/* Quick Links */}
              <div className="hidden lg:flex items-center gap-1 mr-1">
                {/* Live Link */}
                <Link
                  href="/train/live"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/train/live')
                      ? isLight ? 'text-indigo-600 bg-indigo-50 font-semibold' : `${currentTheme.text} bg-white/10`
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
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? isLight ? 'text-indigo-600 bg-indigo-50 font-semibold' : `${currentTheme.text} bg-white/10`
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
                  className={`p-2 rounded-lg ${currentTheme.textMuted} hover:${currentTheme.text} ${isLight ? 'hover:bg-slate-100' : 'hover:bg-white/5'} transition-colors`}
                  title="Change theme"
                >
                  {theme === 'dark' && <Moon size={20} />}
                  {theme === 'light' && <Sun size={20} />}
                  {theme === 'system' && <Monitor size={20} />}
                  {theme === 'midnight' && <Sparkles size={20} />}
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
                        className={`absolute right-0 top-full mt-2 w-40 ${currentTheme.cardBg} border ${currentTheme.cardBorder} rounded-xl overflow-hidden shadow-xl z-50`}
                      >
                        {themeOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setTheme(option.value);
                              setShowThemeMenu(false);
                            }}
                            className={`
                              w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors
                              ${theme === option.value
                                ? isLight ? 'bg-indigo-50 text-indigo-600 font-medium' : 'bg-[#5B6CFF]/20 text-[#5B6CFF]'
                                : isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : `${currentTheme.textMuted} hover:${currentTheme.text} hover:bg-white/5`
                              }
                            `}
                          >
                            <option.icon size={18} />
                            {option.label}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

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
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    planInfo?.plan === 'Pro' ? 'bg-[#5B6CFF]/20 text-[#5B6CFF] border border-[#5B6CFF]/30' :
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

          {/* Page Content */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
          
          {!hideFooter && !hideNav && <Footer />}
        </main>
      </div>
    </div>
  );
}

