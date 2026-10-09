"use client";

import React, { useState, useEffect } from "react";
import { DataTable, EmptyState, PortalStatusBadge } from "@/components/portal";
import { type ColumnDef } from "@tanstack/react-table";
import { History, Search, Mail, Eye, Calendar, CheckCircle2, Clock } from "lucide-react";

interface EmailLogItem {
  id: string;
  recipientEmail: string;
  senderEmail: string;
  subject: string;
  body: string;
  templateId?: string;
  status: string;
  sentAt: string;
}

export default function CompanyEmailHistoryPage() {
  const [logs, setLogs] = useState<EmailLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<EmailLogItem | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      setLoading(true);
      const res = await fetch("/api/company/email/history");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to fetch email history:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter(
    (l) =>
      l.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.senderEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: ColumnDef<EmailLogItem, any>[] = [
    {
      accessorKey: "recipientEmail",
      header: "Recipient Candidate",
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-white text-xs">{row.original.recipientEmail}</div>
          <div className="text-[11px] text-slate-500">Sent by: {row.original.senderEmail}</div>
        </div>
      ),
    },
    {
      accessorKey: "subject",
      header: "Subject",
      cell: ({ row }) => (
        <span className="text-xs text-slate-300 font-medium truncate max-w-xs block">
          {row.original.subject}
        </span>
      ),
    },
    {
      accessorKey: "sentAt",
      header: "Date Sent",
      cell: ({ row }) => (
        <span className="text-xs text-slate-400">
          {new Date(row.original.sentAt).toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <PortalStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedLog(row.original)}
          className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Content</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-purple-400" />
          Email History
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete history of communications sent to candidates by your company recruiters
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-white/5">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search candidate email or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Data Table / Empty State */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading email history...</div>
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          title="No email logs found"
          description="Emails sent to candidates from the Send Email page will be recorded here."
          icon={<Mail className="w-8 h-8 text-slate-500" />}
        />
      ) : (
        <DataTable data={filteredLogs} columns={columns} />
      )}

      {/* Content Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Email Log Details</h3>
                <p className="text-xs text-slate-400">To: {selectedLog.recipientEmail}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400 border-b border-white/5 pb-2">
                <span>Subject:</span>
                <span className="font-semibold text-white">{selectedLog.subject}</span>
              </div>
              <div className="flex justify-between text-slate-400 border-b border-white/5 pb-2">
                <span>Sender:</span>
                <span className="text-slate-200">{selectedLog.senderEmail}</span>
              </div>
              <div className="flex justify-between text-slate-400 border-b border-white/5 pb-2">
                <span>Sent At:</span>
                <span className="text-slate-200">
                  {new Date(selectedLog.sentAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-white/10 text-xs text-slate-200 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
              {selectedLog.body.replace(/<[^>]*>/g, "")}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
