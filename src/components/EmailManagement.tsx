"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Send,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  User,
  UsersRound,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Types                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface EmailLog {
  id: string;
  subject: string;
  message: string;
  recipients: string[];
  recipientType: string;
  sentBy: string;
  status: string;
  errorMsg?: string | null;
  createdAt: string;
}

type RecipientType = "single" | "multiple" | "all";
type ActiveTab = "compose" | "history";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Component                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

export default function EmailManagement() {
  /* ── Tab ─────────────────────────────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState<ActiveTab>("compose");

  /* ── User list (for dropdowns) ───────────────────────────────────────────── */
  const [users, setUsers] = useState<UserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  /* ── Compose form state ──────────────────────────────────────────────────── */
  const [recipientType, setRecipientType] = useState<RecipientType>("single");
  const [selectedSingle, setSelectedSingle] = useState<UserOption | null>(null);
  const [selectedMultiple, setSelectedMultiple] = useState<UserOption[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  /* ── Single-user search dropdown ─────────────────────────────────────────── */
  const [singleSearch, setSingleSearch] = useState("");
  const [singleOpen, setSingleOpen] = useState(false);
  const singleRef = useRef<HTMLDivElement>(null);

  /* ── Multi-user search dropdown ──────────────────────────────────────────── */
  const [multiSearch, setMultiSearch] = useState("");
  const [multiOpen, setMultiOpen] = useState(false);
  const multiRef = useRef<HTMLDivElement>(null);

  /* ── History ─────────────────────────────────────────────────────────────── */
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsLoading, setLogsLoading] = useState(false);
  const LOGS_LIMIT = 10;

  /* ─────────────────────────────────────────────────────────────────────────  */
  /*  Data fetching                                                             */
  /* ─────────────────────────────────────────────────────────────────────────  */

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === "history") fetchLogs(logsPage);
  }, [activeTab, logsPage]);

  async function fetchUsers() {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data: UserOption[] = await res.json();
      setUsers(data);
    } catch {
      toast.error("Could not fetch user list");
    } finally {
      setUsersLoading(false);
    }
  }

  async function fetchLogs(page: number) {
    setLogsLoading(true);
    try {
      const res = await fetch(
        `/api/superadmin/email-logs?page=${page}&limit=${LOGS_LIMIT}`
      );
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      setLogs(data.logs);
      setLogsTotal(data.total);
    } catch {
      toast.error("Could not fetch email history");
    } finally {
      setLogsLoading(false);
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────  */
  /*  Close dropdowns on outside click                                         */
  /* ─────────────────────────────────────────────────────────────────────────  */

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (singleRef.current && !singleRef.current.contains(e.target as Node)) {
        setSingleOpen(false);
      }
      if (multiRef.current && !multiRef.current.contains(e.target as Node)) {
        setMultiOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ─────────────────────────────────────────────────────────────────────────  */
  /*  Send email                                                                */
  /* ─────────────────────────────────────────────────────────────────────────  */

  async function handleSend() {
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    if (recipientType === "single" && !selectedSingle) {
      toast.error("Please select a recipient");
      return;
    }
    if (recipientType === "multiple" && selectedMultiple.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }

    let emails: string[] = [];
    if (recipientType === "single" && selectedSingle) {
      emails = [selectedSingle.email];
    } else if (recipientType === "multiple") {
      emails = selectedMultiple.map((u) => u.email);
    }

    setSending(true);
    try {
      const res = await fetch("/api/superadmin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: recipientType, emails, subject, message }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");

      toast.success(data.message ?? "Email sent successfully!");
      handleReset();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to send email");
    } finally {
      setSending(false);
    }
  }

  function handleReset() {
    setRecipientType("single");
    setSelectedSingle(null);
    setSelectedMultiple([]);
    setSubject("");
    setMessage("");
    setSingleSearch("");
    setMultiSearch("");
  }

  /* ─────────────────────────────────────────────────────────────────────────  */
  /*  Resend helper (pre-fill compose form)                                    */
  /* ─────────────────────────────────────────────────────────────────────────  */

  function handleResend(log: EmailLog) {
    setSubject(log.subject);
    setMessage(log.message);
    const type = log.recipientType as RecipientType;
    setRecipientType(type);

    if (type === "single" && log.recipients.length === 1) {
      const match = users.find((u) => u.email === log.recipients[0]);
      if (match) setSelectedSingle(match);
    } else if (type === "multiple") {
      const matches = users.filter((u) => log.recipients.includes(u.email));
      setSelectedMultiple(matches);
    }

    setActiveTab("compose");
    toast.info("Form pre-filled with previous email. Edit and resend.");
  }

  /* ─────────────────────────────────────────────────────────────────────────  */
  /*  Filtered user lists                                                       */
  /* ─────────────────────────────────────────────────────────────────────────  */

  const filteredSingle = users.filter(
    (u) =>
      u.name.toLowerCase().includes(singleSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(singleSearch.toLowerCase())
  );

  const filteredMulti = users.filter(
    (u) =>
      (u.name.toLowerCase().includes(multiSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(multiSearch.toLowerCase())) &&
      !selectedMultiple.find((s) => s.id === u.id)
  );

  /* ─────────────────────────────────────────────────────────────────────────  */
  /*  Helpers                                                                   */
  /* ─────────────────────────────────────────────────────────────────────────  */

  function removeMulti(id: string) {
    setSelectedMultiple((prev) => prev.filter((u) => u.id !== id));
  }

  const totalLogsPages = Math.max(1, Math.ceil(logsTotal / LOGS_LIMIT));

  /* ─────────────────────────────────────────────────────────────────────────  */
  /*  Recipient type option card                                                */
  /* ─────────────────────────────────────────────────────────────────────────  */

  function RecipientTypeCard({
    value,
    label,
    description,
    icon: Icon,
  }: {
    value: RecipientType;
    label: string;
    description: string;
    icon: React.ElementType;
  }) {
    const active = recipientType === value;
    return (
      <button
        type="button"
        onClick={() => {
          setRecipientType(value);
          setSelectedSingle(null);
          setSelectedMultiple([]);
          setSingleSearch("");
          setMultiSearch("");
        }}
        className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-left ${
          active
            ? "border-violet-500 bg-violet-600/15 text-violet-300"
            : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200"
        }`}
      >
        <Icon size={22} className={active ? "text-violet-400" : "text-slate-500"} />
        <div>
          <p className="text-sm font-semibold text-center">{label}</p>
          <p className="text-[11px] text-center text-slate-500 mt-0.5">{description}</p>
        </div>
        {active && (
          <span className="w-2 h-2 rounded-full bg-violet-500 mt-1" />
        )}
      </button>
    );
  }

  /* ─────────────────────────────────────────────────────────────────────────  */
  /*  Render                                                                    */
  /* ─────────────────────────────────────────────────────────────────────────  */

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* ── Tab switcher ──────────────────────────────────────────────────── */}
      <div className="flex gap-2 border border-white/10 rounded-xl p-1 bg-slate-900/60 backdrop-blur w-fit">
        {(["compose", "history"] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab === "compose" ? <Mail size={15} /> : <Clock size={15} />}
            {tab === "compose" ? "Compose Email" : "Email History"}
            {tab === "history" && logsTotal > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-violet-500/30 text-violet-300">
                {logsTotal}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ══════════════════════════════════════════════════════════════════ */}
        {/*  COMPOSE TAB                                                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "compose" && (
          <motion.div
            key="compose"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 xl:grid-cols-3 gap-6"
          >
            {/* ── Left column: Recipient Selection ──────────────────────── */}
            <Card className="xl:col-span-1 bg-slate-900/60 border-white/10 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users size={16} className="text-violet-400" />
                  Recipient Selection
                </CardTitle>
                <CardDescription>Choose who to send this email to</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Type cards */}
                <div className="flex gap-2 flex-col sm:flex-row xl:flex-col">
                  <RecipientTypeCard
                    value="single"
                    label="Single User"
                    description="One specific user"
                    icon={User}
                  />
                  <RecipientTypeCard
                    value="multiple"
                    label="Multiple Users"
                    description="Select several users"
                    icon={UsersRound}
                  />
                  <RecipientTypeCard
                    value="all"
                    label="All Users"
                    description="Broadcast to everyone"
                    icon={Users}
                  />
                </div>

                {/* ── Single user dropdown ─────────────────────────────── */}
                {recipientType === "single" && (
                  <div className="space-y-2" ref={singleRef}>
                    <Label className="text-xs text-slate-400">Select User</Label>
                    <div className="relative">
                      <div
                        onClick={() => setSingleOpen((v) => !v)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-slate-800 cursor-pointer min-h-[38px] hover:border-violet-500/50 transition-colors"
                      >
                        <Search size={13} className="text-slate-500 shrink-0" />
                        {selectedSingle ? (
                          <span className="text-sm text-slate-200 truncate flex-1">
                            {selectedSingle.name}{" "}
                            <span className="text-slate-500 text-xs">
                              ({selectedSingle.email})
                            </span>
                          </span>
                        ) : (
                          <span className="text-sm text-slate-500 flex-1">
                            Search users…
                          </span>
                        )}
                        {selectedSingle && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSingle(null);
                              setSingleSearch("");
                            }}
                            className="text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>

                      {singleOpen && (
                        <div className="absolute z-50 top-[calc(100%+4px)] left-0 right-0 bg-slate-850 border border-white/10 rounded-lg shadow-2xl overflow-hidden">
                          <div className="p-2 border-b border-white/10">
                            <input
                              autoFocus
                              value={singleSearch}
                              onChange={(e) => setSingleSearch(e.target.value)}
                              placeholder="Type to search…"
                              className="w-full text-sm bg-transparent text-slate-200 placeholder-slate-500 outline-none px-1"
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {usersLoading ? (
                              <p className="p-3 text-xs text-slate-500">Loading…</p>
                            ) : filteredSingle.length === 0 ? (
                              <p className="p-3 text-xs text-slate-500">No users found</p>
                            ) : (
                              filteredSingle.slice(0, 50).map((u) => (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSingle(u);
                                    setSingleOpen(false);
                                    setSingleSearch("");
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-violet-600/15 transition-colors"
                                >
                                  <p className="text-sm text-slate-200">{u.name}</p>
                                  <p className="text-[11px] text-slate-500">{u.email}</p>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Multiple user multi-select ───────────────────────── */}
                {recipientType === "multiple" && (
                  <div className="space-y-2" ref={multiRef}>
                    <Label className="text-xs text-slate-400">
                      Select Users{" "}
                      {selectedMultiple.length > 0 && (
                        <span className="text-violet-400">({selectedMultiple.length} selected)</span>
                      )}
                    </Label>

                    {/* Selected chips */}
                    {selectedMultiple.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-lg bg-slate-800/50 border border-white/10">
                        {selectedMultiple.map((u) => (
                          <span
                            key={u.id}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-violet-600/20 text-violet-300 border border-violet-500/30"
                          >
                            {u.name}
                            <button
                              type="button"
                              onClick={() => removeMulti(u.id)}
                              className="text-violet-400 hover:text-red-400 transition-colors"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="relative">
                      <div
                        onClick={() => setMultiOpen((v) => !v)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-slate-800 cursor-pointer min-h-[38px] hover:border-violet-500/50 transition-colors"
                      >
                        <Search size={13} className="text-slate-500 shrink-0" />
                        <span className="text-sm text-slate-500">Add users…</span>
                      </div>

                      {multiOpen && (
                        <div className="absolute z-50 top-[calc(100%+4px)] left-0 right-0 bg-slate-850 border border-white/10 rounded-lg shadow-2xl overflow-hidden">
                          <div className="p-2 border-b border-white/10">
                            <input
                              autoFocus
                              value={multiSearch}
                              onChange={(e) => setMultiSearch(e.target.value)}
                              placeholder="Type to search…"
                              className="w-full text-sm bg-transparent text-slate-200 placeholder-slate-500 outline-none px-1"
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {usersLoading ? (
                              <p className="p-3 text-xs text-slate-500">Loading…</p>
                            ) : filteredMulti.length === 0 ? (
                              <p className="p-3 text-xs text-slate-500">No more users</p>
                            ) : (
                              filteredMulti.slice(0, 50).map((u) => (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedMultiple((prev) => [...prev, u]);
                                    setMultiSearch("");
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-violet-600/15 transition-colors"
                                >
                                  <p className="text-sm text-slate-200">{u.name}</p>
                                  <p className="text-[11px] text-slate-500">{u.email}</p>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── All users notice ─────────────────────────────────── */}
                {recipientType === "all" && (
                  <div className="rounded-xl p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex gap-2">
                    <Users size={16} className="shrink-0 mt-0.5" />
                    <span>
                      This will send the email to <strong>all active users</strong> on the
                      platform (max 200 per send).
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Right column: Email Form ───────────────────────────────── */}
            <Card className="xl:col-span-2 bg-slate-900/60 border-white/10 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail size={16} className="text-violet-400" />
                  Compose Email
                </CardTitle>
                <CardDescription>Write your email subject and message</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Subject */}
                <div className="space-y-1.5">
                  <Label htmlFor="subject" className="text-xs text-slate-400">
                    Subject <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject…"
                    className="bg-slate-800 border-white/10 focus:border-violet-500/50 text-slate-200 placeholder-slate-500"
                  />
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-xs text-slate-400">
                    Message <span className="text-red-400">*</span>
                  </Label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={10}
                    placeholder="Write your message here…"
                    className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors resize-y min-h-[160px]"
                  />
                  <p className="text-[11px] text-slate-500 text-right">
                    {message.length} characters
                  </p>
                </div>

                {/* Preview summary */}
                {(selectedSingle || selectedMultiple.length > 0 || recipientType === "all") &&
                  subject && (
                    <div className="rounded-xl p-3 bg-violet-600/10 border border-violet-500/20 text-sm space-y-1">
                      <p className="text-violet-300 font-medium text-xs uppercase tracking-wide">
                        Send Summary
                      </p>
                      <p className="text-slate-300">
                        <span className="text-slate-500">To: </span>
                        {recipientType === "all"
                          ? "All active users"
                          : recipientType === "single"
                          ? `${selectedSingle?.name} (${selectedSingle?.email})`
                          : `${selectedMultiple.length} selected user(s)`}
                      </p>
                      <p className="text-slate-300">
                        <span className="text-slate-500">Subject: </span>
                        {subject}
                      </p>
                    </div>
                  )}

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <Button
                    onClick={handleSend}
                    disabled={sending}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white gap-2 transition-all"
                  >
                    {sending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        Send Email
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={sending}
                    className="gap-2 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                  >
                    <RotateCcw size={14} />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/*  HISTORY TAB                                                         */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="bg-slate-900/60 border-white/10 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock size={16} className="text-violet-400" />
                    Email History
                  </CardTitle>
                  <CardDescription>
                    {logsTotal} email{logsTotal !== 1 ? "s" : ""} sent in total
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchLogs(logsPage)}
                  className="gap-2 border-white/10 text-slate-400 hover:text-white"
                >
                  <RotateCcw size={13} />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
                    <div className="w-5 h-5 border-2 border-slate-600 border-t-violet-500 rounded-full animate-spin" />
                    Loading history…
                  </div>
                ) : logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
                    <Mail size={40} className="opacity-30" />
                    <p>No emails sent yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-white/8 bg-white/3 p-4 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-medium text-slate-200 text-sm truncate">
                                {log.subject}
                              </p>
                              <Badge
                                className={`text-[10px] px-2 py-0.5 border-0 ${
                                  log.status === "sent"
                                    ? "bg-emerald-500/15 text-emerald-400"
                                    : "bg-red-500/15 text-red-400"
                                }`}
                              >
                                {log.status === "sent" ? (
                                  <CheckCircle2 size={10} className="mr-1" />
                                ) : (
                                  <XCircle size={10} className="mr-1" />
                                )}
                                {log.status}
                              </Badge>
                              <Badge className="text-[10px] px-2 py-0.5 bg-slate-700/60 text-slate-400 border-0">
                                {log.recipientType}
                              </Badge>
                            </div>

                            <p className="text-xs text-slate-500 line-clamp-1 mb-2">
                              {log.message}
                            </p>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                              <span>
                                <span className="text-slate-600">Recipients: </span>
                                <span className="text-slate-400">
                                  {log.recipientType === "all"
                                    ? "All users"
                                    : `${log.recipients.length}`}
                                </span>
                              </span>
                              <span>
                                <span className="text-slate-600">Sent by: </span>
                                <span className="text-slate-400">{log.sentBy}</span>
                              </span>
                              <span>
                                <span className="text-slate-600">At: </span>
                                <span className="text-slate-400">
                                  {new Date(log.createdAt).toLocaleString()}
                                </span>
                              </span>
                            </div>

                            {log.errorMsg && (
                              <p className="mt-1.5 text-[11px] text-red-400 bg-red-500/10 rounded px-2 py-1">
                                Error: {log.errorMsg}
                              </p>
                            )}
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResend(log)}
                            className="shrink-0 text-[11px] gap-1.5 border-white/10 text-slate-400 hover:text-violet-300 hover:border-violet-500/40"
                          >
                            <Send size={11} />
                            Resend
                          </Button>
                        </div>

                        {/* Recipients list preview */}
                        {log.recipientType !== "all" && log.recipients.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {log.recipients.slice(0, 5).map((email) => (
                              <span
                                key={email}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/8"
                              >
                                {email}
                              </span>
                            ))}
                            {log.recipients.length > 5 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-white/8">
                                +{log.recipients.length - 5} more
                              </span>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {/* Pagination */}
                    {totalLogsPages > 1 && (
                      <div className="flex items-center justify-center gap-3 pt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={logsPage <= 1}
                          onClick={() => setLogsPage((p) => p - 1)}
                          className="gap-1.5 border-white/10 text-slate-400 hover:text-white disabled:opacity-30"
                        >
                          <ChevronLeft size={14} />
                          Prev
                        </Button>
                        <span className="text-sm text-slate-400">
                          Page {logsPage} of {totalLogsPages}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={logsPage >= totalLogsPages}
                          onClick={() => setLogsPage((p) => p + 1)}
                          className="gap-1.5 border-white/10 text-slate-400 hover:text-white disabled:opacity-30"
                        >
                          Next
                          <ChevronRight size={14} />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
