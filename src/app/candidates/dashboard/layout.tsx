"use client";

import { useEffect, useState, lazy, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  CandidateSidebar,
  SidebarProvider,
  useSidebar,
  MobileNavBar,
} from "@/components/shared/Sidebar";
import { NotificationsPanel, NotificationBell } from "@/components/dashboard/NotificationsPanel";
import { Menu, ChevronDown } from "lucide-react";

// Lazy load notifications panel for performance
const LazyNotificationsPanel = lazy(() =>
  import("@/components/dashboard/NotificationsPanel").then((mod) => ({
    default: mod.NotificationsPanel,
  }))
);

interface CandidateUser {
  id: string;
  name: string;
  email: string;
  profile?: { profileCompletion: number };
}

interface Notification {
  id: string;
  message: string;
  type: "JOB_MATCH" | "STATUS_UPDATE" | "INTERVIEW" | "PROFILE_TIP" | "GENERAL";
  read: boolean;
  createdAt: string;
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setIsMobileOpen } = useSidebar();

  const [candidate, setCandidate] = useState<CandidateUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userDropOpen, setUserDropOpen] = useState(false);

  useEffect(() => {
    fetch("/api/candidates/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.candidate) {
          setCandidate(d.candidate);
          fetchNotifications();
        } else {
          router.replace("/candidates/login");
        }
      })
      .catch(() => router.replace("/candidates/login"))
      .finally(() => setLoading(false));
  }, [router]);

  function fetchNotifications() {
    fetch("/api/candidates/notifications")
      .then((r) => r.json())
      .then((d) =>
        setNotifications(Array.isArray(d.notifications) ? d.notifications : [])
      )
      .catch(() => {});
  }

  async function logout() {
    await fetch("/api/candidates/auth/logout", { method: "POST" });
    router.push("/candidates/login");
  }

  async function markAllRead() {
    await fetch("/api/candidates/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function markRead(id: string) {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    // API call
    await fetch(`/api/candidates/notifications/${id}`, { method: "PATCH" });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0F14] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-10 h-10 border-2 border-[#7C5CFC]/20 border-t-[#7C5CFC] rounded-full animate-spin" />
          <p className="text-sm text-[#8B8A99]">Loading dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (!candidate) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Get breadcrumb from pathname
  const getBreadcrumb = () => {
    if (pathname === "/candidates/dashboard") return null;
    const segment = pathname.split("/").pop()?.replace(/-/g, " ");
    return segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : null;
  };

  return (
    <div className="min-h-screen bg-[#0D0F14] flex">
      {/* Sidebar */}
      <CandidateSidebar
        candidate={{
          name: candidate.name,
          email: candidate.email,
          profileCompletion: candidate.profile?.profileCompletion ?? 0,
        }}
        onLogout={logout}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 h-14 border-b border-white/[0.06] bg-[#13161E]/90 backdrop-blur-md">
          {/* Left: hamburger + breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#8B8A99] hover:text-[#F1F0F5] hover:bg-white/[0.06] transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <nav className="hidden sm:flex items-center gap-2 text-sm">
              <Link
                href="/candidates/dashboard"
                className="text-[#8B8A99] hover:text-[#F1F0F5] transition-colors"
              >
                Dashboard
              </Link>
              {getBreadcrumb() && (
                <>
                  <span className="text-[#52515E]">/</span>
                  <span className="text-[#F1F0F5] font-medium">
                    {getBreadcrumb()}
                  </span>
                </>
              )}
            </nav>
          </div>

          {/* Right: notifications + user */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <NotificationBell
              count={unreadCount}
              onClick={() => setNotifOpen(true)}
              hasNew={unreadCount > 0}
            />

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropOpen(!userDropOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-white/[0.06] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C5CFC] to-[#A855F7] flex items-center justify-center text-white font-bold text-xs">
                  {candidate.name[0]?.toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm font-medium text-[#F1F0F5] max-w-[100px] truncate">
                  {candidate.name.split(" ")[0]}
                </span>
                <ChevronDown className="w-4 h-4 text-[#52515E]" />
              </button>

              <AnimatePresence>
                {userDropOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserDropOpen(false)}
                    />

                    {/* Dropdown */}
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-[#1A1D28] border border-white/[0.08] rounded-xl shadow-xl overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-white/[0.06]">
                        <p className="text-sm font-medium text-[#F1F0F5] truncate">
                          {candidate.name}
                        </p>
                        <p className="text-xs text-[#8B8A99] truncate">
                          {candidate.email}
                        </p>
                      </div>

                      <div className="p-1.5">
                        <Link
                          href="/candidates/dashboard/profile"
                          onClick={() => setUserDropOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#8B8A99] hover:text-[#F1F0F5] hover:bg-white/[0.04] transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          Edit Profile
                        </Link>

                        <Link
                          href="/candidates/dashboard/applications"
                          onClick={() => setUserDropOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#8B8A99] hover:text-[#F1F0F5] hover:bg-white/[0.04] transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                          My Applications
                        </Link>

                        <div className="h-px bg-white/[0.06] mx-3 my-1.5" />

                        <button
                          onClick={() => {
                            setUserDropOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNavBar />

      {/* Notifications Panel */}
      <Suspense fallback={null}>
        <LazyNotificationsPanel
          isOpen={notifOpen}
          onClose={() => setNotifOpen(false)}
          notifications={notifications}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
        />
      </Suspense>
    </div>
  );
}

export default function CandidateDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}
