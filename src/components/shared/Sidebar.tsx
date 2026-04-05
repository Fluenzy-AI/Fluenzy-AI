"use client";

import { useState, createContext, useContext, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Home,
  FileText,
  User,
  Briefcase,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Zap,
} from "lucide-react";

// Context for sidebar state
interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

interface SidebarProviderProps {
  children: React.ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  const pathname = usePathname();
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <SidebarContext.Provider
      value={{ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

// Navigation items - All routes unified under /train
const NAV_ITEMS = [
  {
    href: "/train",
    label: "Training Hub",
    icon: Home,
    exact: true,
  },
  {
    href: "/train/applications",
    label: "My Applications",
    icon: FileText,
  },
  {
    href: "/train/auto-apply-setup",
    label: "Auto-Apply Setup",
    icon: Zap,
    badge: true, // Will show setup status badge
  },
  {
    href: "/train/job-search",
    label: "AI Job Search",
    icon: Zap,
  },
  {
    href: "/jobs",
    label: "Browse Jobs",
    icon: Briefcase,
  },
  {
    href: "/profile",
    label: "My Profile",
    icon: User,
  },
  {
    href: "/train",
    label: "Training Hub",
    icon: GraduationCap,
    hidden: true, // Already listed as first item
  },
];

const BOTTOM_NAV_ITEMS = [
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
  {
    href: "/help",
    label: "Help",
    icon: HelpCircle,
  },
];

interface CandidateSidebarProps {
  candidate: {
    name: string;
    email: string;
    profileCompletion?: number;
  };
  onLogout: () => void;
}

export function CandidateSidebar({ candidate, onLogout }: CandidateSidebarProps) {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();

  const sidebarVariants = {
    expanded: { width: 240 },
    collapsed: { width: 64 },
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        initial={false}
        animate={isCollapsed ? "collapsed" : "expanded"}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-[#13161E] border-r border-white/[0.06] transition-transform duration-300 ease-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand + Collapse toggle */}
        <div className="px-4 pt-5 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <img
                src="/favicon/apple-touch-icon.png"
                alt="Fluenzy AI Logo"
                className="w-8 h-8 rounded-xl shadow-lg"
              />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-[#F1F0F5] font-bold text-sm tracking-tight"
                  >
                    Fluenzy AI
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 text-[#8B8A99] hover:text-[#F1F0F5] transition-colors"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] font-semibold text-[#52515E] uppercase tracking-wider px-3 py-2"
              >
                Menu
              </motion.p>
            )}
          </AnimatePresence>

          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  isActive
                    ? "bg-[#7C5CFC]/10 text-[#9F7FFF]"
                    : "text-[#8B8A99] hover:text-[#F1F0F5] hover:bg-white/[0.04]"
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#7C5CFC] rounded-r-full"
                  />
                )}

                <item.icon
                  className={cn(
                    "w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5",
                    isActive ? "text-[#9F7FFF]" : "text-[#8B8A99]"
                  )}
                />

                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="transition-transform group-hover:translate-x-0.5"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {isActive && !isCollapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#9F7FFF]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-white/[0.06] space-y-0.5">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  isActive
                    ? "bg-[#7C5CFC]/10 text-[#9F7FFF]"
                    : "text-[#8B8A99] hover:text-[#F1F0F5] hover:bg-white/[0.04]"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#8B8A99] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all group"
          >
            <LogOut className="w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>
    </>
  );
}

// Mobile navigation bar (for bottom nav on mobile)
export function MobileNavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-[#13161E] border-t border-white/[0.06] px-2 py-2">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[64px] transition-all",
                isActive
                  ? "text-[#9F7FFF] bg-[#7C5CFC]/10"
                  : "text-[#8B8A99] hover:text-[#F1F0F5]"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
