"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Sparkles, X, User, CreditCard, LogOut, Bell, Search, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import SidebarContent from "./SidebarContent";

const PAGE_TITLES: Record<string, { label: string; color: string }> = {
  '/train': { label: 'Train Now', color: 'text-purple-400' },
  '/train/hr': { label: 'HR Interview Coach', color: 'text-purple-400' },
  '/train/gd-coach': { label: 'GD Coach', color: 'text-teal-400' },
  '/train/gd': { label: 'GD Agent', color: 'text-indigo-400' },
  '/train/technical': { label: 'Technical Mastery', color: 'text-emerald-400' },
  '/train/company': { label: 'Company Track', color: 'text-amber-400' },
  '/train/mock': { label: 'Mock Interview', color: 'text-rose-400' },
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
};

const Navbar = ({ showSidebar }: { showSidebar?: boolean }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

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

  const handleSubmit = async () => {
    if (session?.user) {
      scrollToSection("editor");
    } else {
      await signIn("google", { callbackUrl: "/train" });
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
          ? 'bg-slate-900/95 backdrop-blur-2xl border-b border-white/10 shadow-lg shadow-black/20'
          : 'bg-slate-900/80 backdrop-blur-2xl border-b border-white/5'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 py-2">
        <div className="flex items-center justify-between h-12">
          {/* Left section */}
          <div className="flex items-center space-x-4">
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
                      <img src="/image/fluenzyAI.jpeg" alt="Logo" className="h-8 w-auto rounded-lg" />
                      <span className="text-xl font-black bg-gradient-primary !bg-clip-text text-transparent">Menu</span>
                    </SheetTitle>
                  </SheetHeader>
                  <SidebarContent session={session} pathname={pathname} />
                </SheetContent>
              </Sheet>
            </div>

            {/* Logo (Hidden on desktop when sidebar is persistent) */}
            <motion.div
              className={`flex items-center space-x-3 cursor-pointer ${showSidebar ? 'md:hidden' : ''}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = "/"}
            >
              <img 
                src="/image/fluenzyAI.jpeg" 
                alt="Fluenzy AI Logo" 
                className="h-8 w-auto rounded-lg object-contain shadow-lg shadow-purple-500/10"
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
          <div className="flex items-center space-x-2 sm:space-x-3">
            {session?.user ? (
              <>
                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full pr-3 sm:pr-4 p-1 transition-all duration-200 h-auto">
                       <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-[10px] font-black text-white overflow-hidden uppercase ring-2 ring-white/10">
                         {session.user.image ? (
                           <img 
                             src={session.user.image} 
                             alt="User" 
                             className="w-full h-full object-cover"
                             referrerPolicy="no-referrer"
                           />
                         ) : (
                           session.user.name?.charAt(0)
                         )}
                       </div>
                      <span className="hidden sm:inline-block text-xs font-bold text-slate-200 max-w-[80px] truncate">{session.user.name?.split(' ')[0]}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60 bg-slate-900/95 backdrop-blur-xl border-white/10 mt-2 rounded-xl p-1">
                    {/* User info header */}
                    <div className="px-3 py-2.5 mb-1">
                      <p className="text-sm font-semibold text-white truncate">{session.user.name}</p>
                      <p className="text-xs text-slate-400 truncate">{session.user.email}</p>
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
              <Button
                variant="hero"
                className="px-6 sm:px-8 font-black text-xs uppercase tracking-widest rounded-full h-9"
                onClick={handleSubmit}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
