"use client";

import { useState, useEffect } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import {
  Mail,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Send,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  MousePointer2,
  Sparkles,
  Copy,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "PAUSED" | "FAILED";
  senderType: string;
  scheduledAt: string | null;
  sentAt: string | null;
  totalRecipients: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
  createdAt: string;
}

interface Segment {
  id: string;
  name: string;
  count: number;
}

const statusConfig = {
  DRAFT: { label: "Draft", color: "bg-slate-500/20 text-slate-400", icon: Edit },
  SCHEDULED: { label: "Scheduled", color: "bg-blue-500/20 text-blue-400", icon: Clock },
  SENDING: { label: "Sending", color: "bg-purple-500/20 text-purple-400", icon: Send },
  SENT: { label: "Sent", color: "bg-green-500/20 text-green-400", icon: CheckCircle2 },
  PAUSED: { label: "Paused", color: "bg-amber-500/20 text-amber-400", icon: AlertCircle },
  FAILED: { label: "Failed", color: "bg-red-500/20 text-red-400", icon: XCircle },
};

const senderTypes = [
  { value: "news", label: "News", email: "news@fluenzyai.app" },
  { value: "contact", label: "Contact", email: "contact@fluenzyai.app" },
  { value: "careers", label: "Careers", email: "careers@fluenzyai.app" },
  { value: "support", label: "Support", email: "support@fluenzyai.app" },
];

export default function CampaignsPage() {
  const { user, loading: authLoading } = usePortalAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create campaign form state
  const [createStep, setCreateStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    senderType: "news",
    bodyHtml: "",
    bodyText: "",
    segmentIds: [] as string[],
    scheduledAt: "",
    useAI: false,
    aiPrompt: "",
    aiTone: "professional",
  });

  useEffect(() => {
    if (!authLoading && user) {
      fetchCampaigns();
      fetchSegments();
    }
  }, [authLoading, user, page, statusFilter, searchQuery]);

  async function fetchCampaigns() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
      });
      const res = await fetch(`/api/admin/marketing/campaigns?${params}`);
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      const data = await res.json();
      setCampaigns(data.campaigns || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSegments() {
    try {
      const res = await fetch("/api/admin/marketing/segments?predefined=true");
      if (!res.ok) throw new Error("Failed to fetch segments");
      const data = await res.json();
      setSegments(data.segments || []);
    } catch (err) {
      console.error("Error fetching segments:", err);
    }
  }

  async function handleCreateCampaign(action: "draft" | "schedule" | "send") {
    try {
      setActionLoading("create");
      const payload = {
        ...formData,
        status: action === "draft" ? "DRAFT" : action === "schedule" ? "SCHEDULED" : "SENDING",
      };
      const res = await fetch("/api/admin/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create campaign");
      }
      setShowCreateModal(false);
      resetForm();
      fetchCampaigns();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteCampaign() {
    if (!selectedCampaign) return;
    try {
      setActionLoading("delete");
      const res = await fetch(`/api/admin/marketing/campaigns/${selectedCampaign.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete campaign");
      setShowDeleteConfirm(false);
      setSelectedCampaign(null);
      fetchCampaigns();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete campaign");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSendCampaign(campaign: Campaign) {
    if (!confirm(`Are you sure you want to send "${campaign.name}" now?`)) return;
    try {
      setActionLoading(campaign.id);
      const res = await fetch(`/api/admin/marketing/campaigns/${campaign.id}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to send campaign");
      fetchCampaigns();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send campaign");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDuplicateCampaign(campaign: Campaign) {
    setFormData({
      name: `${campaign.name} (Copy)`,
      subject: campaign.subject,
      senderType: campaign.senderType,
      bodyHtml: "",
      bodyText: "",
      segmentIds: [],
      scheduledAt: "",
      useAI: false,
      aiPrompt: "",
      aiTone: "professional",
    });
    setShowCreateModal(true);
  }

  async function generateAIContent() {
    if (!formData.aiPrompt) {
      alert("Please enter a prompt for AI generation");
      return;
    }
    try {
      setActionLoading("ai");
      const res = await fetch("/api/admin/marketing/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          prompt: formData.aiPrompt,
          tone: formData.aiTone,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate content");
      const data = await res.json();
      setFormData(prev => ({
        ...prev,
        subject: data.subject || prev.subject,
        bodyHtml: data.bodyHtml || "",
        bodyText: data.bodyText || "",
      }));
      setCreateStep(3);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate AI content");
    } finally {
      setActionLoading(null);
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      subject: "",
      senderType: "news",
      bodyHtml: "",
      bodyText: "",
      segmentIds: [],
      scheduledAt: "",
      useAI: false,
      aiPrompt: "",
      aiTone: "professional",
    });
    setCreateStep(1);
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
          <h1 className="text-2xl font-bold text-white">Campaigns</h1>
          <p className="text-slate-400 mt-1">Create and manage email campaigns</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25"
        >
          <Plus className="h-4 w-4" />
          New Campaign
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          >
            <option value="all">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="SENDING">Sending</option>
            <option value="SENT">Sent</option>
            <option value="PAUSED">Paused</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Campaigns table */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">No campaigns found</h3>
            <p className="text-sm text-slate-400 mt-1 mb-4">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first campaign to get started"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Campaign
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Recipients
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Performance
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
                  {campaigns.map((campaign) => {
                    const status = statusConfig[campaign.status];
                    const StatusIcon = status.icon;
                    return (
                      <tr key={campaign.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                              <Mail className="h-5 w-5 text-purple-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{campaign.name}</p>
                              <p className="text-xs text-slate-400 truncate max-w-[200px]">{campaign.subject}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-slate-300">
                            <Users className="h-4 w-4 text-slate-500" />
                            {campaign.totalRecipients.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {campaign.status === "SENT" ? (
                            <div className="flex items-center gap-4 text-xs">
                              <div className="flex items-center gap-1">
                                <Eye className="h-3.5 w-3.5 text-green-400" />
                                <span className="text-green-400 font-medium">{campaign.openRate.toFixed(1)}%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MousePointer2 className="h-3.5 w-3.5 text-amber-400" />
                                <span className="text-amber-400 font-medium">{campaign.clickRate.toFixed(1)}%</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-300">
                            {campaign.sentAt
                              ? new Date(campaign.sentAt).toLocaleDateString()
                              : campaign.scheduledAt
                              ? new Date(campaign.scheduledAt).toLocaleDateString()
                              : new Date(campaign.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-slate-500">
                            {campaign.sentAt
                              ? "Sent"
                              : campaign.scheduledAt
                              ? "Scheduled"
                              : "Created"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {campaign.status === "DRAFT" && (
                              <button
                                onClick={() => handleSendCampaign(campaign)}
                                disabled={actionLoading === campaign.id}
                                className="p-2 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                                title="Send Now"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDuplicateCampaign(campaign)}
                              className="p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                              title="Duplicate"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            {campaign.status === "DRAFT" && (
                              <button
                                onClick={() => {
                                  setSelectedCampaign(campaign);
                                  setShowDeleteConfirm(true);
                                }}
                                className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                <p className="text-sm text-slate-400">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-white/10 shadow-2xl">
            <div className="sticky top-0 bg-slate-900 border-b border-white/5 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Create New Campaign</h2>
                <p className="text-sm text-slate-400">Step {createStep} of 4</p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Step indicators */}
              <div className="flex items-center gap-2 mb-8">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex-1 flex items-center gap-2">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        createStep >= step
                          ? "bg-purple-500 text-white"
                          : "bg-white/5 text-slate-400"
                      }`}
                    >
                      {step}
                    </div>
                    {step < 4 && (
                      <div className={`flex-1 h-0.5 ${createStep > step ? "bg-purple-500" : "bg-white/10"}`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step 1: Basic Info */}
              {createStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Campaign Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Re-engagement Campaign Q1"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Sender Type *</label>
                    <div className="grid grid-cols-2 gap-3">
                      {senderTypes.map((sender) => (
                        <button
                          key={sender.value}
                          onClick={() => setFormData(prev => ({ ...prev, senderType: sender.value }))}
                          className={`p-4 rounded-xl border transition-colors text-left ${
                            formData.senderType === sender.value
                              ? "border-purple-500 bg-purple-500/10"
                              : "border-white/10 bg-white/5 hover:bg-white/[0.07]"
                          }`}
                        >
                          <p className="text-sm font-medium text-white">{sender.label}</p>
                          <p className="text-xs text-slate-400">{sender.email}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <Sparkles className="h-5 w-5 text-purple-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Use AI to generate content?</p>
                      <p className="text-xs text-slate-400">Let AI create your email subject and body</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.useAI}
                        onChange={(e) => setFormData(prev => ({ ...prev, useAI: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 2: AI or Manual */}
              {createStep === 2 && (
                <div className="space-y-4">
                  {formData.useAI ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                          Describe your email *
                        </label>
                        <textarea
                          value={formData.aiPrompt}
                          onChange={(e) => setFormData(prev => ({ ...prev, aiPrompt: e.target.value }))}
                          placeholder="e.g., Write a re-engagement email for users who haven't logged in for 7 days. Encourage them to try our new interview practice feature."
                          rows={4}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Tone</label>
                        <select
                          value={formData.aiTone}
                          onChange={(e) => setFormData(prev => ({ ...prev, aiTone: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                        >
                          <option value="professional">Professional</option>
                          <option value="friendly">Friendly</option>
                          <option value="urgent">Urgent</option>
                          <option value="motivational">Motivational</option>
                          <option value="casual">Casual</option>
                        </select>
                      </div>
                      <button
                        onClick={generateAIContent}
                        disabled={actionLoading === "ai" || !formData.aiPrompt}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {actionLoading === "ai" ? (
                          <>
                            <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Generate Email Content
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Subject Line *</label>
                        <input
                          type="text"
                          value={formData.subject}
                          onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                          placeholder="e.g., We miss you! Come back and ace your next interview"
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Body (HTML)</label>
                        <textarea
                          value={formData.bodyHtml}
                          onChange={(e) => setFormData(prev => ({ ...prev, bodyHtml: e.target.value }))}
                          placeholder="<p>Hello {{first_name}},</p><p>We noticed you haven't visited in a while...</p>"
                          rows={8}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none font-mono text-sm"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Use variables: {"{{first_name}}"}, {"{{name}}"}, {"{{email}}"}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 3: Preview/Edit */}
              {createStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Subject Line *</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Body</label>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 min-h-[200px] overflow-auto">
                      {formData.bodyHtml ? (
                        <div
                          className="prose prose-invert prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: formData.bodyHtml }}
                        />
                      ) : (
                        <p className="text-slate-500 text-sm">No content yet...</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Edit HTML</label>
                    <textarea
                      value={formData.bodyHtml}
                      onChange={(e) => setFormData(prev => ({ ...prev, bodyHtml: e.target.value }))}
                      rows={6}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none font-mono text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Recipients & Schedule */}
              {createStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Select Segments *</label>
                    <p className="text-xs text-slate-500 mb-3">Choose which user segments should receive this campaign</p>
                    <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto">
                      {segments.map((segment) => (
                        <button
                          key={segment.id}
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              segmentIds: prev.segmentIds.includes(segment.id)
                                ? prev.segmentIds.filter(id => id !== segment.id)
                                : [...prev.segmentIds, segment.id]
                            }));
                          }}
                          className={`p-3 rounded-xl border transition-colors text-left ${
                            formData.segmentIds.includes(segment.id)
                              ? "border-purple-500 bg-purple-500/10"
                              : "border-white/10 bg-white/5 hover:bg-white/[0.07]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-white">{segment.name}</p>
                            {formData.segmentIds.includes(segment.id) && (
                              <CheckCircle2 className="h-4 w-4 text-purple-400" />
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{segment.count.toLocaleString()} users</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Schedule (Optional)</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="datetime-local"
                        value={formData.scheduledAt}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Leave empty to save as draft or send immediately</p>
                  </div>
                  {formData.segmentIds.length > 0 && (
                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                      <p className="text-sm text-white">
                        <strong>Estimated recipients:</strong>{" "}
                        {segments
                          .filter(s => formData.segmentIds.includes(s.id))
                          .reduce((sum, s) => sum + s.count, 0)
                          .toLocaleString()}{" "}
                        users
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-slate-900 border-t border-white/5 px-6 py-4 flex items-center justify-between">
              <button
                onClick={() => setCreateStep(s => Math.max(1, s - 1))}
                disabled={createStep === 1}
                className="px-4 py-2 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <div className="flex items-center gap-2">
                {createStep < 4 ? (
                  <button
                    onClick={() => setCreateStep(s => s + 1)}
                    disabled={
                      (createStep === 1 && !formData.name) ||
                      (createStep === 2 && !formData.useAI && !formData.subject) ||
                      (createStep === 3 && !formData.subject)
                    }
                    className="px-4 py-2 rounded-lg bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
                  >
                    Next
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleCreateCampaign("draft")}
                      disabled={actionLoading === "create" || formData.segmentIds.length === 0}
                      className="px-4 py-2 rounded-lg bg-white/5 text-white font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                      Save Draft
                    </button>
                    {formData.scheduledAt ? (
                      <button
                        onClick={() => handleCreateCampaign("schedule")}
                        disabled={actionLoading === "create" || formData.segmentIds.length === 0}
                        className="px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <Clock className="h-4 w-4" />
                        Schedule
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCreateCampaign("send")}
                        disabled={actionLoading === "create" || formData.segmentIds.length === 0}
                        className="px-4 py-2 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <Send className="h-4 w-4" />
                        Send Now
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 shadow-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete Campaign</h3>
                <p className="text-sm text-slate-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete &quot;{selectedCampaign.name}&quot;?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedCampaign(null);
                }}
                className="px-4 py-2 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCampaign}
                disabled={actionLoading === "delete"}
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {actionLoading === "delete" ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
