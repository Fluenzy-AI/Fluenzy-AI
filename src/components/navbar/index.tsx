"use client";
import { signOut, useSession } from "next-auth/react";
import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Sparkles, X, User, CreditCard, LogOut, Bell, Search, ChevronRight, Building2, Briefcase } from "lucide-react";

interface CandidateSession { id: string; name: string; email: string }
interface CompanyMemberSession { id: string; name: string; email: string; role: string; companyName: string }
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import SidebarContent from "./SidebarContent";

// User type for passed user data
interface UserData {
  name: string;
  email: string;
  avatar?: string | null;
}

interface NavbarProps {
  showSidebar?: boolean;
  userData?: UserData | null;
}

const PAGE_TITLES: Record<string, { label: string; color: string }> = {
  '/train': { label: 'Train Now', color: 'text-purple-400' },
  '/train/hr': { label: 'HR Interview Coach', color: 'text-purple-400' },
  '/train/gd-coach': { label: 'GD Coach', color: 'text-teal-400' },
  '/train/gd': { label: 'GD Agent', color: 'text-indigo-400' },
  '/train/technical': { label: 'Technical Mastery', color: 'text-emerald-400' },
  '/train/company': { label: 'Company Track', color: 'text-amber-400' },
  '/train/daily': { label: 'Daily Conversation', color: 'text-sky-400' },
  '/train/latest-topics': { label: 'Latest Company Topics', color: 'text-lime-400' },
  '/train/english': { label: 'Essential Modules', color: 'text-blue-400' },
  '/train/vocabulary': { label: 'Vocabulary Booster', color: 'text-orange-400' },
  '/train/corporate-voice': { label: 'Voice Practice', color: 'text-cyan-400' },
  '/interview-guide': { label: 'Interview Guide', color: 'text-blue-400' },
  '/history': { label: 'History', color: 'text-amber-400' },
  '/analytics': { label: 'Analytics Dashboard', color: 'text-emerald-400' },
  '/features': { label: 'Features', color: 'text-orange-400' },
  '/pricing': { label: 'Pricing', color: 'text-pink-400' },
  '/profile': { label: 'My Profile', color: 'text-purple-400' },
  '/billing': { label: 'Subscription', color: 'text-blue-400' },
  '/ats': { label: 'Advanced ATS System', color: 'text-violet-400' },
  '/ats/upload-resume': { label: 'Upload Resume', color: 'text-violet-400' },
  '/ats/analysis': { label: 'ATS Analysis', color: 'text-violet-400' },
  '/ats/ranking': { label: 'ATS Leaderboard', color: 'text-amber-400' },
  '/ats/history': { label: 'ATS History', color: 'text-emerald-400' },
  '/ats/admin': { label: 'ATS Admin Dashboard', color: 'text-violet-400' },
};

const Navbar = ({ showSidebar, userData }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [candidate, setCandidate] = useState<CandidateSession | null>(null);
  const [companyMember, setCompanyMember] = useState<CompanyMemberSession | null>(null);
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // Check candidate session on careers / candidates pages
  useEffect(() => {
    if (pathname.startsWith("/careers") || pathname.startsWith("/candidates")) {
      fetch("/api/candidates/me")
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.candidate) setCandidate(d.candidate); })
        .catch(() => {});
    }
  }, [pathname]);

  // Check company member session on company/jobs pages
  useEffect(() => {
    if (pathname.startsWith("/company") || pathname.startsWith("/jobs")) {
      fetch("/api/company/auth/me")
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d?.user && d?.company) {
            setCompanyMember({
              id: d.user.id,
              name: d.user.name,
              email: d.user.email,
              role: d.user.role,
              companyName: d.company.name,
            });
          }
        })
        .catch(() => {});
    }
  }, [pathname]);

  // Use userData from props (from LayoutWrapper) or fall back to session
  const user = userData || (session?.user ? {
    name: session.user.name || '',
    email: session.user.email || '',
    avatar: session.user.image
  } : null);

  // Get the display name and initial
  const displayName = user?.name || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();
  
  // Get the best avatar URL - use custom avatar, then session image, then null
  const avatarUrl = user?.avatar || session?.user?.image || null;
  
  // Determine if we should show the image or fallback
  const showAvatarImage = avatarUrl && !imageError;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const pageInfo = useMemo(() => {
    // Try exact match first, then prefix match
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
    const match = Object.keys(PAGE_TITLES)
      .filter((k) => k !== '/' && pathname.startsWith(k))
      .sort((a, b) => b.length - a.length)[0];
    return match ? PAGE_TITLES[match] : null;
  }, [pathname]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  // Hide navbar for superadmin
  if (pathname.startsWith('/superadmin')) {
    return null;
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 right-0 z-40 transition-all duration-300 ${showSidebar ? 'md:left-[280px] left-0' : 'left-0'} ${
        isScrolled
          ? 'bg-slate-900/85 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/10 shadow-lg shadow-black/30'
          : 'bg-slate-900/65 backdrop-blur-xl border-b border-white/5'
      }`}
    >
      <div className="container mx-auto px-3 sm:px-4 md:px-8 xl:px-16 py-2">
        <div className="flex items-center justify-between h-12">
          {/* Left section */}
          <div className="flex min-w-0 items-center space-x-2 sm:space-x-4">
            {/* Mobile Sidebar Trigger */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-xl h-9 w-9">
                    <Menu className="h-5 w-5 text-slate-300" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] bg-slate-950 border-r border-white/5 p-0 overflow-y-auto">
                  <SheetHeader className="p-3 border-b border-white/5 bg-slate-900/50">
                    <SheetTitle className="flex items-center space-x-3">
                      <img src="/favicon/apple-touch-icon.png" alt="Logo" className="h-10 w-auto rounded-lg" />
                      <span className="text-xl font-black bg-gradient-primary !bg-clip-text text-transparent">Menu</span>
                    </SheetTitle>
                  </SheetHeader>
                  <SidebarContent session={session} pathname={pathname} />
                </SheetContent>
              </Sheet>
            </div>

            {/* Logo (Hidden on desktop when sidebar is persistent) */}
            <motion.div
              className={`flex min-w-0 items-center space-x-2 sm:space-x-3 cursor-pointer ${showSidebar ? 'md:hidden' : ''}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = "/"}
            >
              <img
                src="/favicon/apple-touch-icon.png"
                alt="Fluenzy AI Logo"
                className="h-10 w-auto rounded-lg shadow-lg shadow-purple-500/10"
              />
              <span className="text-xl font-black bg-gradient-primary !bg-clip-text text-transparent tracking-tight hidden sm:block">
                Fluenzy AI
              </span>
            </motion.div>

            {/* Breadcrumb / Page Title (desktop with sidebar) */}
            {showSidebar && pageInfo && (
              <div className="hidden md:flex items-center gap-2 text-sm">
                <div className="h-4 w-px bg-white/10" />
                <span className={`font-semibold ${pageInfo.color}`}>{pageInfo.label}</span>
              </div>
            )}
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-1.5 sm:space-x-3">
            {session?.user ? (
              <>
                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full pr-3 sm:pr-4 p-1 transition-all duration-200 h-auto">
                       <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-[10px] font-black text-white overflow-hidden uppercase ring-2 ring-white/10">
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
                      <span className="hidden sm:inline-block text-xs font-bold text-slate-200 max-w-[80px] truncate">{displayName.split(' ')[0]}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60 bg-slate-900/95 backdrop-blur-xl border-white/10 mt-2 rounded-xl p-1">
                    {/* User info header */}
                    <div className="px-3 py-2.5 mb-1">
                      <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                      <p className="text-xs text-slate-400 truncate">{user?.email || session.user.email}</p>
                    </div>
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-purple-400" />
                        </div>
                        <div>
                          <span className="text-sm font-medium">My Profile</span>
                          <p className="text-[10px] text-slate-500">Account settings</p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/billing" className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                          <span className="text-sm font-medium">Subscription</span>
                          <p className="text-[10px] text-slate-500">Manage your plan</p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem onClick={() => signOut()} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 focus:text-red-300 cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <LogOut className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              // Not logged in via NextAuth
              (pathname.startsWith("/careers") || pathname.startsWith("/candidates")) ? (
                // Candidate auth buttons on careers/candidates pages
                candidate ? (
                  <div className="flex items-center gap-2">
                    <Link href="/candidates/dashboard"
                      className="flex items-center gap-2 text-[11px] font-bold px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 hover:bg-violet-500/20 transition-all uppercase tracking-wide">
                      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-[9px] flex items-center justify-center font-black">
                        {candidate.name.charAt(0).toUpperCase()}
                      </span>
                      Dashboard
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href="/candidates/login"
                      className="hidden sm:inline-flex h-9 items-center px-4 rounded-full text-[11px] font-bold uppercase tracking-widest border border-white/15 text-slate-300 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all">
                      Login
                    </Link>
                    <Link href="/candidates/signup"
                      className="inline-flex h-9 items-center px-4 rounded-full text-[11px] font-black uppercase tracking-widest bg-gradient-to-r from-violet-600 to-purple-500 text-white hover:from-violet-500 hover:to-purple-400 transition-all shadow-lg shadow-violet-500/20">
                      Register
                    </Link>
                  </div>
                )
              ) : (pathname.startsWith("/company") || pathname.startsWith("/jobs")) ? (
                // Company auth buttons on company/jobs pages
                companyMember ? (
                  <div className="flex items-center gap-2">
                    <Link href="/company/portal"
                      className="flex items-center gap-2 text-[11px] font-bold px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 transition-all uppercase tracking-wide">
                      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-[9px] flex items-center justify-center font-black">
                        {companyMember.name.charAt(0).toUpperCase()}
                      </span>
                      Portal
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href="/company/login"
                      className="hidden sm:inline-flex h-9 items-center px-4 rounded-full text-[11px] font-bold uppercase tracking-widest border border-white/15 text-slate-300 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all">
                      Login
                    </Link>
                    <Link href="/company/signup"
                      className="inline-flex h-9 items-center px-4 rounded-full text-[11px] font-black uppercase tracking-widest bg-gradient-to-r from-indigo-600 to-purple-500 text-white hover:from-indigo-500 hover:to-purple-400 transition-all shadow-lg shadow-indigo-500/20">
                      <Building2 className="w-3.5 h-3.5 mr-1.5" />
                      For Companies
                    </Link>
                  </div>
                )
              ) : (
                // Default: Landing page - show only Sign In button
                <Button
                  variant="hero"
                  className="h-9 rounded-full px-4 text-[11px] font-black uppercase tracking-[0.2em] sm:px-8 sm:text-xs sm:tracking-widest"
                  onClick={() => router.push("/login")}
                >
                  Sign In
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
