"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, Info, Megaphone, AlertTriangle, CheckCircle2, X } from "lucide-react";
import NotificationBadge from "@/components/NotificationBadge";

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
  info:         <Info        size={14} className="text-blue-400  flex-shrink-0" />,
  announcement: <Megaphone   size={14} className="text-violet-400 flex-shrink-0" />,
  warning:      <AlertTriangle size={14} className="text-amber-400  flex-shrink-0" />,
  success:      <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />,
};

const TYPE_BG = {
  info:         "border-blue-500/20   bg-blue-500/5",
  announcement: "border-violet-500/20 bg-violet-500/5",
  warning:      "border-amber-500/20  bg-amber-500/5",
  success:      "border-emerald-500/20 bg-emerald-500/5",
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

export default function NotificationBell({
  isDark = true,
}: {
  isDark?: boolean;
}) {
  const [open, setOpen]         = useState(false);
  const [items, setItems]       = useState<Notification[]>([]);
  const [unread, setUnread]     = useState(0);
  const [loading, setLoading]   = useState(false);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const ref = useRef<HTMLDivElement>(null);

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
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

  const iconCls = isDark
    ? "text-slate-400 hover:text-white hover:bg-white/5"
    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100";

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`p-2 rounded-lg transition-colors ${iconCls} relative`}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      >
        <Bell size={20} />
        <NotificationBadge count={unread} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#0d1424] border border-slate-700/60 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[520px] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/40 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Bell size={15} className="text-violet-400" />
                  <span className="text-sm font-semibold text-slate-200">Notifications</span>
                  {unread > 0 && (
                    <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/30">
                      {unread} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      <CheckCheck size={13} />
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-700/20">
                {items.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                    <Bell size={32} className="text-slate-600 mb-3" />
                    <p className="text-slate-500 text-sm">No notifications yet</p>
                  </div>
                )}

                {items.map((n) => (
                  <div
                    key={n.id}
                    className={`group flex gap-3 px-4 py-3 transition-colors cursor-pointer ${
                      n.isRead ? "opacity-60" : "bg-slate-800/20"
                    } hover:bg-slate-800/40`}
                    onClick={() => { if (!n.isRead) markRead(n.id); }}
                  >
                    {/* Type icon */}
                    <div className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0 ${TYPE_BG[n.type as keyof typeof TYPE_BG] ?? TYPE_BG.info}`}>
                      {TYPE_ICON[n.type as keyof typeof TYPE_ICON] ?? TYPE_ICON.info}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-semibold truncate ${n.isRead ? "text-slate-400" : "text-slate-200"}`}>
                          {n.title}
                        </p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] text-slate-500">{timeAgo(n.createdAt)}</span>
                          {!n.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <span className={`mt-1 inline-block text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${
                        n.sentByRole === "SUPER_ADMIN"
                          ? "border-violet-500/30 bg-violet-500/10 text-violet-400"
                          : "border-blue-500/30 bg-blue-500/10 text-blue-400"
                      }`}>
                        {n.sentByRole === "SUPER_ADMIN" ? "Platform" : "College"}
                      </span>
                    </div>

                    {/* Mark read button */}
                    {!n.isRead && (
                      <button
                        className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-slate-600 hover:text-violet-400 transition-all mt-0.5"
                        onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                        title="Mark as read"
                      >
                        <Check size={13} />
                      </button>
                    )}
                  </div>
                ))}

                {/* Load more */}
                {items.length < total && (
                  <div className="py-3 flex justify-center">
                    <button
                      onClick={() => { const nextPage = page + 1; setPage(nextPage); fetchNotifications(nextPage); }}
                      disabled={loading}
                      className="text-xs text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50"
                    >
                      {loading ? "Loading..." : "Load more"}
                    </button>
                  </div>
                )}

                {loading && items.length === 0 && (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
