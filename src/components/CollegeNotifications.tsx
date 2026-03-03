"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Send, Users, User, Search, X, CheckCircle2, RefreshCw, ChevronLeft, ChevronRight, Clock, Info, Megaphone, AlertTriangle, Pencil, Trash2, Check } from "lucide-react";
import { useCollegeAdmin } from "@/contexts/CollegeAdminContext";
import { toast } from "sonner";

interface StudentOption { id: string; studentName: string; email: string; }

type NotifType  = "info" | "announcement" | "warning" | "success";
type TargetType = "all" | "specific";

const TYPE_OPTIONS: { value: NotifType; label: string; icon: React.ReactNode }[] = [
  { value: "info",         label: "Info",         icon: <Info size={13} /> },
  { value: "announcement", label: "Announcement", icon: <Megaphone size={13} /> },
  { value: "warning",      label: "Warning",      icon: <AlertTriangle size={13} /> },
  { value: "success",      label: "Success",      icon: <CheckCircle2 size={13} /> },
];

export default function CollegeNotifications() {
  const { token, admin } = useCollegeAdmin();
  const [activeTab, setActiveTab] = useState<"compose" | "history">("compose");

  /* compose */
  const [target, setTarget]               = useState<TargetType>("all");
  const [title, setTitle]                 = useState("");
  const [message, setMessage]             = useState("");
  const [type, setType]                   = useState<NotifType>("announcement");
  const [sending, setSending]             = useState(false);

  /* student picker */
  const [students, setStudents]           = useState<StudentOption[]>([]);
  const [selectedStudents, setSelected]   = useState<StudentOption[]>([]);
  const [search, setSearch]               = useState("");
  const [searchOpen, setSearchOpen]       = useState(false);

  /* history */
  const [history, setHistory]             = useState<any[]>([]);
  const [histPage, setHistPage]           = useState(1);
  const [histTotal, setHistTotal]         = useState(0);
  const [histLoading, setHistLoading]     = useState(false);
  const HIST_LIMIT = 10;

  /* edit / delete */
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [editTitle, setEditTitle]         = useState("");
  const [editMessage, setEditMessage]     = useState("");
  const [savingEdit, setSavingEdit]       = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId]       = useState<string | null>(null);

  /* fetch registered students */
  useEffect(() => {
    if (!token) return;
    fetch("/api/college/students?limit=200&status=ACTIVE", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        const onboarded = (d.students ?? []).filter((s: any) => s.userId);
        setStudents(onboarded);
      })
      .catch(() => {});
  }, [token]);

  /* fetch history */
  const fetchHistory = async (p: number) => {
    if (!token) return;
    setHistLoading(true);
    try {
      const res = await fetch(`/api/college/notifications/send?page=${p}&limit=${HIST_LIMIT}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setHistory(d.notifications ?? []);
        setHistTotal(d.total ?? 0);
      }
    } finally {
      setHistLoading(false);
    }
  };

  /* edit a notification batch */
  const handleEdit = async (id: string) => {
    if (!editTitle.trim() || !editMessage.trim()) { toast.error("Title and message required"); return; }
    if (!token) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/college/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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

  /* delete a notification batch */
  const handleDelete = async (id: string) => {
    if (!token) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/college/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
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

  useEffect(() => {
    if (activeTab === "history") fetchHistory(histPage);
  }, [activeTab, histPage, token]);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) { toast.error("Title and message are required"); return; }
    if (target === "specific" && selectedStudents.length === 0) { toast.error("Select at least one student"); return; }
    if (!token) return;

    setSending(true);
    try {
      const res = await fetch("/api/college/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title,
          message,
          type,
          target,
          studentIds: target === "specific" ? selectedStudents.map((s) => s.id) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      toast.success(`Notification sent to ${data.sent} student${data.sent !== 1 ? "s" : ""}!`);
      setTitle(""); setMessage(""); setSelected([]); setTarget("all");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      !selectedStudents.find((x) => x.id === s.id) &&
      (s.studentName.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-400" /> Notifications
        </h1>
        <p className="text-sm text-slate-400 mt-1">Send in-app notifications to registered students</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0d1424]/80 p-1 rounded-xl border border-slate-700/40 w-fit">
        {(["compose", "history"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : "text-slate-400 hover:text-white"
            }`}>
            {tab === "compose" ? "Compose" : "Sent History"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "compose" && (
          <motion.div key="compose" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-[#0d1424]/60 border border-slate-700/40 rounded-2xl p-6 space-y-5"
          >
            {/* Target */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-2 block">Send To</label>
              <div className="flex gap-2">
                {([
                  { v: "all",      label: "All Registered Students", icon: <Users size={13} /> },
                  { v: "specific", label: "Specific Students",       icon: <User  size={13} /> },
                ] as const).map(({ v, label, icon }) => (
                  <button key={v} onClick={() => setTarget(v)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                      target === v
                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                        : "text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-200"
                    }`}>
                    {icon}{label}
                  </button>
                ))}
              </div>
              {target === "all" && (
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Will notify all onboarded students of {admin?.collegeName ?? "your college"} ({students.length} registered)
                </p>
              )}
            </div>

            {/* Specific student picker */}
            {target === "specific" && (
              <div>
                <label className="text-xs text-slate-400 font-medium mb-2 block">Select Students</label>
                {selectedStudents.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {selectedStudents.map((s) => (
                      <span key={s.id} className="flex items-center gap-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] px-2 py-0.5 rounded-full">
                        {s.studentName}
                        <button onClick={() => setSelected((p) => p.filter((x) => x.id !== s.id))}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input value={search} onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }}
                    onFocus={() => setSearchOpen(true)}
                    placeholder="Search registered students…"
                    className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 placeholder-slate-500 text-sm rounded-lg pl-8 pr-3 py-2 outline-none focus:border-indigo-500 transition-colors"
                  />
                  {searchOpen && filteredStudents.length > 0 && (
                    <div className="absolute top-full mt-1 w-full bg-[#0d1424] border border-slate-700 rounded-xl shadow-2xl z-50 max-h-44 overflow-y-auto">
                      {filteredStudents.slice(0, 20).map((s) => (
                        <button key={s.id} onClick={() => { setSelected((p) => [...p, s]); setSearch(""); setSearchOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800/60 text-left transition-colors">
                          <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[10px] text-indigo-300 font-bold">{s.studentName[0]?.toUpperCase()}</div>
                          <div>
                            <p className="text-xs text-slate-200 font-medium">{s.studentName}</p>
                            <p className="text-[10px] text-slate-500">{s.email}</p>
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
              <label className="text-xs text-slate-400 font-medium mb-2 block">Type</label>
              <div className="flex flex-wrap gap-2">
                {TYPE_OPTIONS.map(({ value, label, icon }) => (
                  <button key={value} onClick={() => setType(value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      type === value
                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                        : "text-slate-400 border-slate-700 hover:border-slate-600"
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
                className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 placeholder-slate-500 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Message */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">Message</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                rows={4} placeholder="Write your message to students…"
                className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 placeholder-slate-500 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>

            <button onClick={handleSend} disabled={sending}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all">
              {sending
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending…</>
                : <><Send size={14} /> Send to Students</>
              }
            </button>
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-[#0d1424]/60 border border-slate-700/40 rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/30">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-indigo-400" />
                <span className="text-sm font-semibold text-slate-200">Sent Notifications</span>
              </div>
              <button onClick={() => fetchHistory(histPage)} className="text-slate-400 hover:text-white transition-colors">
                <RefreshCw size={13} />
              </button>
            </div>

            {histLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
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
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <Megaphone size={14} className="text-indigo-400" />
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
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
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
                      <div className="px-6 pb-4 space-y-3 bg-[#0d1424]/40 border-t border-slate-700/20">
                        <p className="text-[11px] text-indigo-400 font-medium pt-3">Edit Notification (updates for all recipients)</p>
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Title…"
                          className="w-full bg-slate-900/60 border border-slate-700 text-slate-200 placeholder-slate-500 text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-colors"
                        />
                        <textarea
                          value={editMessage}
                          onChange={(e) => setEditMessage(e.target.value)}
                          rows={3}
                          placeholder="Message…"
                          className="w-full bg-slate-900/60 border border-slate-700 text-slate-200 placeholder-slate-500 text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-colors resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(n.id)}
                            disabled={savingEdit}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 text-xs font-medium disabled:opacity-50 transition-colors"
                          >
                            {savingEdit ? <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin" /> : <Check size={12} />}
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
