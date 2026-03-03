"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Send, Users, User, Search, X, CheckCircle2, RefreshCw, ChevronLeft, ChevronRight, Clock, Info, Megaphone, AlertTriangle, Pencil, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

interface UserOption { id: string; name: string; email: string; }

type NotifType   = "info" | "announcement" | "warning" | "success";
type TargetType  = "all" | "specific";
type SentNotif   = { id: string; title: string; message: string; type: string; sentTo: number; createdAt: string; };

const TYPE_OPTIONS: { value: NotifType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "info",         label: "Info",         icon: <Info size={14} />,          color: "blue" },
  { value: "announcement", label: "Announcement", icon: <Megaphone size={14} />,     color: "violet" },
  { value: "warning",      label: "Warning",      icon: <AlertTriangle size={14} />, color: "amber" },
  { value: "success",      label: "Success",      icon: <CheckCircle2 size={14} />,  color: "emerald" },
];

export default function SuperAdminNotifications() {
  const [activeTab, setActiveTab] = useState<"compose" | "history">("compose");

  /* compose state */
  const [target, setTarget]             = useState<TargetType>("all");
  const [title, setTitle]               = useState("");
  const [message, setMessage]           = useState("");
  const [type, setType]                 = useState<NotifType>("announcement");
  const [sending, setSending]           = useState(false);

  /* specific user search */
  const [users, setUsers]               = useState<UserOption[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([]);
  const [search, setSearch]             = useState("");
  const [searchOpen, setSearchOpen]     = useState(false);
  const searchRef                       = useRef<HTMLDivElement>(null);

  /* history */
  const [history, setHistory]           = useState<SentNotif[]>([]);
  const [histPage, setHistPage]         = useState(1);
  const [histTotal, setHistTotal]       = useState(0);
  const [histLoading, setHistLoading]   = useState(false);
  const HIST_LIMIT = 10;

  /* edit / delete */
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [editTitle, setEditTitle]       = useState("");
  const [editMessage, setEditMessage]   = useState("");
  const [savingEdit, setSavingEdit]     = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId]     = useState<string | null>(null);

  /* ── Fetch all users for specific select ─────────────────────────────── */
  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(Array.isArray(d) ? d : (d.users ?? [])))
      .catch(() => {});
  }, []);

  /* ── Outside click for search dropdown ──────────────────────────────── */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Edit a notification batch ─────────────────────────────────────────── */
  const handleEdit = async (id: string) => {
    if (!editTitle.trim() || !editMessage.trim()) { toast.error("Title and message required"); return; }
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, message: editMessage }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Update failed");
      toast.success("Notification updated!");
      setEditingId(null);
      fetchHistory(histPage);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingEdit(false);
    }
  };

  /* ── Delete a notification batch ────────────────────────────────────────── */
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Delete failed");
      toast.success(`Deleted ${d.deleted} notification${d.deleted !== 1 ? "s" : ""}`);
      setConfirmDeleteId(null);
      fetchHistory(histPage);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  /* ── History ─────────────────────────────────────────────────────────── */
  const fetchHistory = async (p: number) => {
    setHistLoading(true);
    try {
      const res = await fetch(`/api/notifications/send?page=${p}&limit=${HIST_LIMIT}`);
      if (res.ok) {
        const d = await res.json();
        setHistory(d.notifications ?? []);
        setHistTotal(d.total ?? 0);
      }
    } finally {
      setHistLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") fetchHistory(histPage);
  }, [activeTab, histPage]);

  /* ── Send ─────────────────────────────────────────────────────────────── */
  const handleSend = async () => {
    if (!title.trim() || !message.trim()) { toast.error("Title and message are required"); return; }
    if (target === "specific" && selectedUsers.length === 0) { toast.error("Select at least one user"); return; }

    setSending(true);
    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          type,
          target,
          userIds: target === "specific" ? selectedUsers.map((u) => u.id) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      toast.success(`Notification sent to ${data.sent} user${data.sent !== 1 ? "s" : ""}!`);
      setTitle(""); setMessage(""); setSelectedUsers([]); setTarget("all");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      !selectedUsers.find((s) => s.id === u.id) &&
      (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-3xl space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl border border-slate-700/30 w-fit">
        {(["compose", "history"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? "bg-violet-600/30 text-violet-300 border border-violet-500/30"
                : "text-slate-400 hover:text-white"
            }`}>
            {tab === "compose" ? "Compose" : "History"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "compose" && (
          <motion.div key="compose" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-6 space-y-5"
          >
            <div className="flex items-center gap-2 mb-1">
              <Bell size={18} className="text-violet-400" />
              <h2 className="text-base font-semibold text-slate-200">Send Notification</h2>
            </div>

            {/* Target */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-2 block">Recipients</label>
              <div className="flex gap-2">
                {([
                  { v: "all",      label: "All Users",       icon: <Users size={14} /> },
                  { v: "specific", label: "Specific Users",  icon: <User  size={14} /> },
                ] as const).map(({ v, label, icon }) => (
                  <button key={v} onClick={() => setTarget(v)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                      target === v
                        ? "bg-violet-600/20 text-violet-300 border-violet-500/30"
                        : "text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200"
                    }`}>
                    {icon}{label}
                  </button>
                ))}
              </div>
            </div>

            {/* Specific user picker */}
            {target === "specific" && (
              <div ref={searchRef}>
                <label className="text-xs text-slate-400 font-medium mb-2 block">Select Users</label>

                {/* Selected chips */}
                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {selectedUsers.map((u) => (
                      <span key={u.id} className="flex items-center gap-1 bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[11px] px-2 py-0.5 rounded-full">
                        {u.name}
                        <button onClick={() => setSelectedUsers((p) => p.filter((x) => x.id !== u.id))}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }}
                    onFocus={() => setSearchOpen(true)}
                    placeholder="Search users…"
                    className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 placeholder-slate-500 text-sm rounded-lg pl-8 pr-3 py-2 outline-none focus:border-violet-500"
                  />
                  {searchOpen && filteredUsers.length > 0 && (
                    <div className="absolute top-full mt-1 w-full bg-[#0d1424] border border-slate-700 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                      {filteredUsers.slice(0, 30).map((u) => (
                        <button key={u.id} onClick={() => { setSelectedUsers((p) => [...p, u]); setSearch(""); }}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800/60 text-left transition-colors">
                          <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-[10px] text-violet-300 font-bold">{u.name[0]?.toUpperCase()}</div>
                          <div>
                            <p className="text-xs text-slate-200 font-medium">{u.name}</p>
                            <p className="text-[10px] text-slate-500">{u.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Type */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-2 block">Notification Type</label>
              <div className="flex flex-wrap gap-2">
                {TYPE_OPTIONS.map(({ value, label, icon, color }) => (
                  <button key={value} onClick={() => setType(value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      type === value
                        ? `bg-${color}-500/20 text-${color}-300 border-${color}-500/30`
                        : "text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200"
                    }`}>
                    {icon}{label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title…"
                className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 placeholder-slate-500 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            {/* Message */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">Message</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                rows={4} placeholder="Write your notification message…"
                className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 placeholder-slate-500 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-violet-500 transition-colors resize-none"
              />
            </div>

            {/* Send */}
            <button onClick={handleSend} disabled={sending}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all">
              {sending
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending…</>
                : <><Send size={15} /> Send Notification</>
              }
            </button>
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-slate-800/30 border border-slate-700/30 rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/30">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-violet-400" />
                <span className="text-sm font-semibold text-slate-200">Sent Notifications History</span>
              </div>
              <button onClick={() => fetchHistory(histPage)} className="text-slate-400 hover:text-white transition-colors">
                <RefreshCw size={14} />
              </button>
            </div>

            {histLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Bell size={28} className="mb-2" />
                <p className="text-sm">No notifications sent yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/20">
                {history.map((n: any) => (
                  <div key={n.id}>
                    <div className="px-6 py-4 flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${
                        n.type === "announcement" ? "bg-violet-500/10 border-violet-500/20"
                        : n.type === "warning"    ? "bg-amber-500/10 border-amber-500/20"
                        : n.type === "success"    ? "bg-emerald-500/10 border-emerald-500/20"
                        : "bg-blue-500/10 border-blue-500/20"
                      }`}>
                        {n.type === "announcement" ? <Megaphone size={14} className="text-violet-400" />
                         : n.type === "warning"    ? <AlertTriangle size={14} className="text-amber-400" />
                         : n.type === "success"    ? <CheckCircle2 size={14} className="text-emerald-400" />
                         : <Info size={14} className="text-blue-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                        <span className="text-[10px] text-slate-600 mr-1">{new Date(n.createdAt).toLocaleDateString()}</span>
                        {/* Edit button */}
                        <button
                          onClick={() => {
                            if (editingId === n.id) { setEditingId(null); }
                            else { setEditingId(n.id); setEditTitle(n.title); setEditMessage(n.message); setConfirmDeleteId(null); }
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                          title="Edit notification"
                        >
                          <Pencil size={13} />
                        </button>
                        {/* Delete / Confirm delete */}
                        {confirmDeleteId === n.id ? (
                          <>
                            <button
                              onClick={() => handleDelete(n.id)}
                              disabled={deletingId === n.id}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-medium hover:bg-red-500/30 disabled:opacity-50 transition-colors"
                            >
                              {deletingId === n.id ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> : <Check size={11} />}
                              Confirm
                            </button>
                            <button onClick={() => setConfirmDeleteId(null)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
                              <X size={11} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => { setConfirmDeleteId(n.id); setEditingId(null); }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Inline edit form */}
                    {editingId === n.id && (
                      <div className="px-6 pb-4 space-y-3 bg-slate-800/20 border-t border-slate-700/20">
                        <p className="text-[11px] text-violet-400 font-medium pt-3">Edit Notification (updates for all recipients)</p>
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Title…"
                          className="w-full bg-slate-900/60 border border-slate-700 text-slate-200 placeholder-slate-500 text-sm rounded-lg px-3 py-2 outline-none focus:border-violet-500 transition-colors"
                        />
                        <textarea
                          value={editMessage}
                          onChange={(e) => setEditMessage(e.target.value)}
                          rows={3}
                          placeholder="Message…"
                          className="w-full bg-slate-900/60 border border-slate-700 text-slate-200 placeholder-slate-500 text-sm rounded-lg px-3 py-2 outline-none focus:border-violet-500 transition-colors resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(n.id)}
                            disabled={savingEdit}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 border border-violet-500/30 text-xs font-medium disabled:opacity-50 transition-colors"
                          >
                            {savingEdit ? <div className="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin" /> : <Check size={12} />}
                            Save
                          </button>
                          <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white border border-slate-700 text-xs transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {histTotal > HIST_LIMIT && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-slate-700/30">
                <button onClick={() => setHistPage((p) => Math.max(1, p - 1))} disabled={histPage === 1}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white disabled:opacity-40 transition-colors">
                  <ChevronLeft size={13} /> Prev
                </button>
                <span className="text-xs text-slate-500">Page {histPage}</span>
                <button onClick={() => setHistPage((p) => p + 1)} disabled={histPage * HIST_LIMIT >= histTotal}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white disabled:opacity-40 transition-colors">
                  Next <ChevronRight size={13} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
