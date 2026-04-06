"use client";

import { useState, useEffect } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  MousePointer2,
  AlertTriangle,
  Mail,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Calendar,
  Send,
  Ban,
} from "lucide-react";

interface EmailLog {
  id: string;
  campaignId?: string;
  campaignName?: string;
  triggerId?: string;
  triggerName?: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  status: "QUEUED" | "SENT" | "DELIVERED" | "OPENED" | "CLICKED" | "BOUNCED" | "UNSUBSCRIBED" | "FAILED";
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  bouncedAt?: string;
  bounceReason?: string;
  failureReason?: string;
  createdAt: string;
}

const statusConfig = {
  QUEUED: { label: "Queued", color: "bg-slate-500/20 text-slate-400", icon: Clock },
  SENT: { label: "Sent", color: "bg-blue-500/20 text-blue-400", icon: Send },
  DELIVERED: { label: "Delivered", color: "bg-green-500/20 text-green-400", icon: CheckCircle2 },
  OPENED: { label: "Opened", color: "bg-purple-500/20 text-purple-400", icon: Eye },
  CLICKED: { label: "Clicked", color: "bg-amber-500/20 text-amber-400", icon: MousePointer2 },
  BOUNCED: { label: "Bounced", color: "bg-red-500/20 text-red-400", icon: AlertTriangle },
  UNSUBSCRIBED: { label: "Unsubscribed", color: "bg-pink-500/20 text-pink-400", icon: Ban },
  FAILED: { label: "Failed", color: "bg-red-500/20 text-red-400", icon: XCircle },
};

export default function EmailLogsPage() {
  const { user, loading: authLoading } = usePortalAuth();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("7d");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    failed: 0,
  });
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchLogs();
    }
  }, [authLoading, user, page, statusFilter, dateFilter, searchQuery]);

  async function fetchLogs() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        range: dateFilter,
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchQuery && { email: searchQuery }),
      });
      const res = await fetch(`/api/admin/marketing/logs?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.total || 0);
      setStats(data.stats || {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        failed: 0,
      });
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Email Logs</h1>
          <p className="text-slate-400 mt-1">Track individual email deliveries and engagement</p>
        </div>
        <button
          onClick={() => fetchLogs()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        <StatCard label="Sent" value={stats.sent} icon={Send} color="blue" />
        <StatCard label="Delivered" value={stats.delivered} icon={CheckCircle2} color="green" />
        <StatCard label="Opened" value={stats.opened} icon={Eye} color="purple" />
        <StatCard label="Clicked" value={stats.clicked} icon={MousePointer2} color="amber" />
        <StatCard label="Bounced" value={stats.bounced} icon={AlertTriangle} color="red" />
        <StatCard label="Failed" value={stats.failed} icon={XCircle} color="red" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          >
            <option value="all">All Status</option>
            <option value="QUEUED">Queued</option>
            <option value="SENT">Sent</option>
            <option value="DELIVERED">Delivered</option>
            <option value="OPENED">Opened</option>
            <option value="CLICKED">Clicked</option>
            <option value="BOUNCED">Bounced</option>
            <option value="UNSUBSCRIBED">Unsubscribed</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Logs table */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
              <History className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">No logs found</h3>
            <p className="text-sm text-slate-400 mt-1">
              {searchQuery || statusFilter !== "all" ? "Try adjusting your filters" : "Email logs will appear here"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Recipient
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map((log) => {
                    const statusKey = log.status.toUpperCase() as keyof typeof statusConfig;
                    const status = statusConfig[statusKey] || statusConfig.QUEUED;
                    const StatusIcon = status.icon;
                    return (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-white">{log.recipientName || "—"}</p>
                            <p className="text-xs text-slate-400">{log.recipientEmail}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-white truncate max-w-[200px]">{log.subject}</p>
                        </td>
                        <td className="px-6 py-4">
                          {log.campaignName ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs">
                              <Mail className="h-3 w-3" />
                              {log.campaignName}
                            </span>
                          ) : log.triggerName ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs">
                              <History className="h-3 w-3" />
                              {log.triggerName}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-300">
                            {new Date(log.sentAt || log.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(log.sentAt || log.createdAt).toLocaleTimeString()}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
              <p className="text-sm text-slate-400">
                Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, totalCount)} of {totalCount.toLocaleString()}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-slate-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-white/10 shadow-2xl">
            <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Email Log Details</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Recipient</p>
                <p className="text-white">{selectedLog.recipientEmail}</p>
                {selectedLog.recipientName && (
                  <p className="text-sm text-slate-400">{selectedLog.recipientName}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Subject</p>
                <p className="text-white">{selectedLog.subject}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Status</p>
                {(() => {
                  const statusKey = selectedLog.status.toUpperCase() as keyof typeof statusConfig;
                  const status = statusConfig[statusKey] || statusConfig.QUEUED;
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  );
                })()}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {selectedLog.sentAt && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Sent At</p>
                    <p className="text-sm text-white">{new Date(selectedLog.sentAt).toLocaleString()}</p>
                  </div>
                )}
                {selectedLog.deliveredAt && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Delivered At</p>
                    <p className="text-sm text-white">{new Date(selectedLog.deliveredAt).toLocaleString()}</p>
                  </div>
                )}
                {selectedLog.openedAt && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Opened At</p>
                    <p className="text-sm text-white">{new Date(selectedLog.openedAt).toLocaleString()}</p>
                  </div>
                )}
                {selectedLog.clickedAt && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Clicked At</p>
                    <p className="text-sm text-white">{new Date(selectedLog.clickedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
              {selectedLog.bounceReason && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Bounce Reason</p>
                  <p className="text-sm text-red-400">{selectedLog.bounceReason}</p>
                </div>
              )}
              {selectedLog.failureReason && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Failure Reason</p>
                  <p className="text-sm text-red-400">{selectedLog.failureReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: "blue" | "green" | "purple" | "amber" | "red";
}) {
  const colorClasses = {
    blue: "bg-blue-500/20 text-blue-400",
    green: "bg-green-500/20 text-green-400",
    purple: "bg-purple-500/20 text-purple-400",
    amber: "bg-amber-500/20 text-amber-400",
    red: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="rounded-xl border border-white/5 bg-slate-900/50 p-4">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-lg font-semibold text-white">{value.toLocaleString()}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
