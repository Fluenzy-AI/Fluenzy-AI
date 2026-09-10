"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, Info, Megaphone, AlertTriangle, CheckCircle2, X, ExternalLink, Calendar, ArrowLeft } from "lucide-react";
import NotificationBadge from "@/components/NotificationBadge";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  sentByRole: string;
  createdAt: string;
}

const TYPE_ICON = {
  info:         <Info        size={16} className="text-blue-400  flex-shrink-0" />,
  announcement: <Megaphone   size={16} className="text-violet-400 flex-shrink-0" />,
  warning:      <AlertTriangle size={16} className="text-amber-400  flex-shrink-0" />,
  success:      <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />,
};

const TYPE_BG = {
  info:         "border-blue-500/20   bg-blue-500/5 text-blue-400",
  announcement: "border-violet-500/20 bg-violet-500/5 text-violet-400",
  warning:      "border-amber-500/20  bg-amber-500/5 text-amber-400",
  success:      "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

interface NotificationBellProps {
  isDark?: boolean;
  className?: string;
  iconSize?: number;
  navigateOnMobile?: boolean;
}

export default function NotificationBell({
  isDark = true,
  className = "",
  iconSize = 20,
  navigateOnMobile = false,
}: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen]                       = useState(false);
  const [items, setItems]                     = useState<Notification[]>([]);
  const [unread, setUnread]                   = useState(0);
  const [loading, setLoading]                 = useState(false);
  const [page, setPage]                       = useState(1);
  const [total, setTotal]                     = useState(0);
  const [isMobile, setIsMobile]               = useState(false);
  const [selectedItem, setSelectedItem]       = useState<Notification | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  /* ── Fetch unread count (polling every 30 s) ───────────────────────────── */
  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/count");
      if (res.ok) {
        const data = await res.json();
        setUnread(data.unread ?? 0);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => clearInterval(id);
  }, [fetchCount]);

  /* ── Fetch notifications when dropdown opens ───────────────────────────── */
  const fetchNotifications = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?page=${p}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setItems(p === 1 ? data.notifications : (prev) => [...prev, ...data.notifications]);
        setTotal(data.total);
        setUnread(data.unread ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) { setPage(1); fetchNotifications(1); }
  }, [open, fetchNotifications]);

  /* ── Close on outside click ────────────────────────────────────────────── */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node) && !selectedItem) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selectedItem]);

  /* ── Mark single as read ───────────────────────────────────────────────── */
  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setUnread((c) => Math.max(0, c - 1));
  };

  /* ── Mark all as read ──────────────────────────────────────────────────── */
  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead) {
      markRead(n.id);
    }
    setSelectedItem(n);
  };

  const handleBellClick = (e: React.MouseEvent) => {
    if (navigateOnMobile && isMobile) {
      e.preventDefault();
      router.push("/notifications");
      return;
    }
    setOpen((v) => !v);
  };

  const iconCls = className || (isDark
    ? "text-slate-400 hover:text-white hover:bg-white/5"
    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100");

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={handleBellClick}
        className={`p-2 rounded-lg transition-colors ${iconCls} relative flex items-center justify-center`}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      >
        <Bell size={iconSize} />
        <NotificationBadge count={unread} />
      </button>

      {/* Dropdown Panel positioned directly under bell icon */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className={
                isMobile
                  ? "fixed left-3 right-3 top-16 z-50 bg-[#0d1424] border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden max-h-[75vh] flex flex-col max-w-md mx-auto"
                  : "absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#0d1424] border border-slate-700/60 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[520px] flex flex-col"
              }
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-700/40 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-violet-400" />
                  <span className="text-sm font-bold text-slate-100">Notifications</span>
                  {unread > 0 && (
                    <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/30">
                      {unread} unread
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
                    >
                      <CheckCheck size={14} />
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-700/20">
                {items.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                    <div className="w-12 h-12 rounded-full bg-slate-800/60 flex items-center justify-center mb-3">
                      <Bell size={24} className="text-slate-500" />
                    </div>
                    <p className="text-slate-400 font-medium text-sm">No notifications yet</p>
                    <p className="text-slate-500 text-xs mt-1">We'll notify you when exciting updates arrive!</p>
                  </div>
                )}

                {items.map((n) => (
                  <div
                    key={n.id}
                    className={`group flex gap-3 px-4 py-3.5 transition-colors cursor-pointer ${
                      n.isRead ? "opacity-60" : "bg-slate-800/40"
                    } hover:bg-slate-800/70`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    {/* Type icon */}
                    <div className={`mt-0.5 w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 ${TYPE_BG[n.type as keyof typeof TYPE_BG] ?? TYPE_BG.info}`}>
                      {TYPE_ICON[n.type as keyof typeof TYPE_ICON] ?? TYPE_ICON.info}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-bold truncate ${n.isRead ? "text-slate-400" : "text-slate-200"}`}>
                          {n.title}
                        </p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] text-slate-500">{timeAgo(n.createdAt)}</span>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">{n.message}</p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className={`inline-block text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                          n.sentByRole === "SUPER_ADMIN"
                            ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                            : "border-blue-500/30 bg-blue-500/10 text-blue-300"
                        }`}>
                          {n.sentByRole === "SUPER_ADMIN" ? "Platform" : "College"}
                        </span>
                        <span className="text-[10px] text-violet-400 group-hover:underline font-medium">Read details &rarr;</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Load more */}
                {items.length < total && (
                  <div className="py-3 flex justify-center">
                    <button
                      onClick={() => { const nextPage = page + 1; setPage(nextPage); fetchNotifications(nextPage); }}
                      disabled={loading}
                      className="text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors disabled:opacity-50"
                    >
                      {loading ? "Loading..." : "Load more notifications"}
                    </button>
                  </div>
                )}

                {loading && items.length === 0 && (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-slate-700/40 bg-slate-900/60 flex items-center justify-between">
                <Link
                  href="/notifications"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-bold transition-colors w-full justify-center py-1"
                >
                  <span>View all notifications</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Detailed Full Notification View Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setSelectedItem(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-[#0d1424] border border-slate-700/70 rounded-3xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Detail Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/40 bg-slate-900/50">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${TYPE_BG[selectedItem.type as keyof typeof TYPE_BG] ?? TYPE_BG.info}`}>
                    {TYPE_ICON[selectedItem.type as keyof typeof TYPE_ICON] ?? TYPE_ICON.info}
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      selectedItem.sentByRole === "SUPER_ADMIN"
                        ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                        : "border-blue-500/30 bg-blue-500/10 text-blue-300"
                    }`}>
                      {selectedItem.sentByRole === "SUPER_ADMIN" ? "Platform Notification" : "College Announcement"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-8 h-8 rounded-full bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Detail Body */}
              <div className="p-6 overflow-y-auto space-y-4">
                <h3 className="text-lg font-black text-slate-100 leading-snug">
                  {selectedItem.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-slate-400 border-b border-slate-800 pb-3">
                  <Calendar size={14} className="text-violet-400" />
                  <span>{formatDate(selectedItem.createdAt)}</span>
                </div>

                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap space-y-2 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60">
                  {selectedItem.message}
                </div>
              </div>

              {/* Detail Footer */}
              <div className="p-4 border-t border-slate-700/40 bg-slate-900/80 flex items-center justify-between gap-3">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all active:scale-95 text-center"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

