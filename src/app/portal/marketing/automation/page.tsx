"use client";

import { useState, useEffect } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import {
  Zap,
  Plus,
  Search,
  MoreVertical,
  Play,
  Pause,
  Trash2,
  Edit,
  Clock,
  Mail,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Target,
  TrendingDown,
  Activity,
  UserPlus,
  CreditCard,
  ArrowUpCircle,
  ArrowDownCircle,
  Settings,
} from "lucide-react";

interface Trigger {
  id: string;
  name: string;
  description?: string;
  conditionType: string;
  conditionParams?: any;
  senderType: string;
  emailSubject: string;
  emailBodyHtml?: string;
  isActive: boolean;
  cooldownHours: number;
  totalFired: number;
  lastFiredAt?: string;
  createdAt: string;
}

const triggerTypes = [
  { value: "quick_submit", label: "Quick Submitter", icon: Clock, description: "User submits interview in < 60 seconds" },
  { value: "incomplete_module", label: "Incomplete Module", icon: Activity, description: "User hasn't completed training" },
  { value: "inactive", label: "Inactive User", icon: AlertTriangle, description: "User inactive for X days" },
  { value: "upgrade", label: "Upgrade Reminder", icon: ArrowUpCircle, description: "Remind free users to upgrade" },
  { value: "low_score", label: "Low Score", icon: TrendingDown, description: "User scores below threshold" },
  { value: "completion", label: "Module Completion", icon: CheckCircle2, description: "User completes a module" },
  { value: "new_signup", label: "New Signup", icon: UserPlus, description: "New user registration" },
  { value: "plan_upgrade", label: "Plan Upgrade", icon: CreditCard, description: "User upgrades their plan" },
  { value: "plan_downgrade", label: "Plan Downgrade", icon: ArrowDownCircle, description: "User downgrades their plan" },
];

const senderTypes = [
  { value: "news", label: "News", email: "news@fluenzyai.app" },
  { value: "contact", label: "Contact", email: "contact@fluenzyai.app" },
  { value: "careers", label: "Careers", email: "careers@fluenzyai.app" },
  { value: "support", label: "Support", email: "support@fluenzyai.app" },
];

export default function AutomationPage() {
  const { user, loading: authLoading } = usePortalAuth();
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState<Trigger | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create trigger form state
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    conditionType: string;
    conditionParams: Record<string, number>;
    senderType: string;
    emailSubject: string;
    emailBodyHtml: string;
    cooldownHours: number;
  }>({
    name: "",
    description: "",
    conditionType: "inactive",
    conditionParams: { days: 7 },
    senderType: "news",
    emailSubject: "",
    emailBodyHtml: "",
    cooldownHours: 24,
  });

  useEffect(() => {
    if (!authLoading && user) {
      fetchTriggers();
    }
  }, [authLoading, user]);

  async function fetchTriggers() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/marketing/triggers", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch triggers");
      const data = await res.json();
      setTriggers(data.triggers || []);
    } catch (err) {
      console.error("Error fetching triggers:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTrigger() {
    try {
      setActionLoading("create");
      const res = await fetch("/api/admin/marketing/triggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create trigger");
      }
      setShowCreateModal(false);
      resetForm();
      fetchTriggers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create trigger");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleTrigger(trigger: Trigger) {
    try {
      setActionLoading(trigger.id);
      const res = await fetch(`/api/admin/marketing/triggers/${trigger.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "toggle" }),
      });
      if (!res.ok) throw new Error("Failed to toggle trigger");
      fetchTriggers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to toggle trigger");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteTrigger() {
    if (!selectedTrigger) return;
    try {
      setActionLoading("delete");
      const res = await fetch(`/api/admin/marketing/triggers/${selectedTrigger.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete trigger");
      setShowDeleteConfirm(false);
      setSelectedTrigger(null);
      fetchTriggers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete trigger");
    } finally {
      setActionLoading(null);
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      description: "",
      conditionType: "inactive",
      conditionParams: { days: 7 },
      senderType: "news",
      emailSubject: "",
      emailBodyHtml: "",
      cooldownHours: 24,
    });
  }

  const filteredTriggers = triggers.filter((trigger) =>
    trigger.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-white">Automation Triggers</h1>
          <p className="text-slate-400 mt-1">Send automated emails based on user behavior</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25"
        >
          <Plus className="h-4 w-4" />
          Create Trigger
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/5 bg-slate-900/50 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{triggers.length}</p>
              <p className="text-xs text-slate-400">Total Triggers</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-slate-900/50 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Play className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{triggers.filter(t => t.isActive).length}</p>
              <p className="text-xs text-slate-400">Active</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-slate-900/50 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Pause className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{triggers.filter(t => !t.isActive).length}</p>
              <p className="text-xs text-slate-400">Paused</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-slate-900/50 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Mail className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {triggers.reduce((sum, t) => sum + t.totalFired, 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-400">Emails Sent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search triggers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
        />
      </div>

      {/* Triggers list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
        </div>
      ) : filteredTriggers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-white/5 bg-slate-900/50">
          <div className="h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
            <Zap className="h-8 w-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">No triggers found</h3>
          <p className="text-sm text-slate-400 mt-1 mb-4">
            {searchQuery ? "Try adjusting your search" : "Create your first automation trigger"}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Trigger
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTriggers.map((trigger) => {
            const triggerType = triggerTypes.find(t => t.value === trigger.conditionType);
            const TriggerIcon = triggerType?.icon || Zap;
            
            return (
              <div
                key={trigger.id}
                className="rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm overflow-hidden"
              >
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                      trigger.isActive ? "bg-green-500/20" : "bg-slate-500/20"
                    }`}>
                      <TriggerIcon className={`h-6 w-6 ${trigger.isActive ? "text-green-400" : "text-slate-400"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">{trigger.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          trigger.isActive ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"
                        }`}>
                          {trigger.isActive ? "Active" : "Paused"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-0.5">
                        {triggerType?.label || trigger.conditionType} • {trigger.cooldownHours}h cooldown
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center hidden md:block">
                      <p className="text-lg font-semibold text-white">{trigger.totalFired.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Times Fired</p>
                    </div>
                    {trigger.lastFiredAt && (
                      <div className="text-center hidden lg:block">
                        <p className="text-sm text-white">{new Date(trigger.lastFiredAt).toLocaleDateString()}</p>
                        <p className="text-xs text-slate-500">Last Fired</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleTrigger(trigger)}
                        disabled={actionLoading === trigger.id}
                        className={`p-2 rounded-lg transition-colors ${
                          trigger.isActive
                            ? "text-amber-400 hover:bg-amber-500/10"
                            : "text-green-400 hover:bg-green-500/10"
                        } disabled:opacity-50`}
                        title={trigger.isActive ? "Pause" : "Activate"}
                      >
                        {trigger.isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTrigger(trigger);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                <div className="border-t border-white/5 px-5 py-4 bg-white/[0.02]">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 mb-1">Email Subject</p>
                      <p className="text-white truncate">{trigger.emailSubject}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Sender</p>
                      <p className="text-white">
                        {senderTypes.find(s => s.value === trigger.senderType)?.email || trigger.senderType}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Condition</p>
                      <p className="text-white">
                        {triggerType?.description || trigger.conditionType}
                        {trigger.conditionParams?.days && ` (${trigger.conditionParams.days} days)`}
                        {trigger.conditionParams?.threshold && ` (${trigger.conditionParams.threshold}%)`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Trigger Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-white/10 shadow-2xl">
            <div className="sticky top-0 bg-slate-900 border-b border-white/5 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Create Automation Trigger</h2>
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

            <div className="p-6 space-y-6">
              {/* Basic info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Trigger Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Re-engage Inactive Users"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this trigger"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  />
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Trigger Condition *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {triggerTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        const params: Record<string, number> = type.value === "inactive" ? { days: 7 } :
                                        type.value === "low_score" ? { threshold: 40 } : {};
                        setFormData(prev => ({
                          ...prev,
                          conditionType: type.value,
                          conditionParams: params,
                        }));
                      }}
                      className={`p-3 rounded-xl border text-left transition-colors ${
                        formData.conditionType === type.value
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-white/10 bg-white/5 hover:bg-white/[0.07]"
                      }`}
                    >
                      <type.icon className={`h-5 w-5 mb-2 ${
                        formData.conditionType === type.value ? "text-purple-400" : "text-slate-400"
                      }`} />
                      <p className="text-sm font-medium text-white">{type.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{type.description}</p>
                    </button>
                  ))}
                </div>

                {/* Condition params */}
                {formData.conditionType === "inactive" && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Days of Inactivity</label>
                    <input
                      type="number"
                      value={formData.conditionParams.days || 7}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        conditionParams: { ...prev.conditionParams, days: parseInt(e.target.value) || 7 },
                      }))}
                      min={1}
                      className="w-32 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    />
                  </div>
                )}
                {formData.conditionType === "low_score" && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Score Threshold (%)</label>
                    <input
                      type="number"
                      value={formData.conditionParams.threshold || 40}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        conditionParams: { ...prev.conditionParams, threshold: parseInt(e.target.value) || 40 },
                      }))}
                      min={1}
                      max={100}
                      className="w-32 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    />
                  </div>
                )}
              </div>

              {/* Email settings */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Sender Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {senderTypes.map((sender) => (
                      <button
                        key={sender.value}
                        onClick={() => setFormData(prev => ({ ...prev, senderType: sender.value }))}
                        className={`p-3 rounded-xl border transition-colors text-left ${
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
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Subject *</label>
                  <input
                    type="text"
                    value={formData.emailSubject}
                    onChange={(e) => setFormData(prev => ({ ...prev, emailSubject: e.target.value }))}
                    placeholder="e.g., We miss you! Come back and practice"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Body (HTML)</label>
                  <textarea
                    value={formData.emailBodyHtml}
                    onChange={(e) => setFormData(prev => ({ ...prev, emailBodyHtml: e.target.value }))}
                    placeholder="<p>Hello {{first_name}},</p><p>We noticed you haven't been active...</p>"
                    rows={6}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Use variables: {"{{first_name}}"}, {"{{name}}"}, {"{{email}}"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Cooldown Period (hours)</label>
                  <input
                    type="number"
                    value={formData.cooldownHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, cooldownHours: parseInt(e.target.value) || 24 }))}
                    min={1}
                    className="w-32 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  />
                  <p className="text-xs text-slate-500 mt-1">Minimum time between emails to the same user</p>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-900 border-t border-white/5 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTrigger}
                disabled={!formData.name || !formData.emailSubject || actionLoading === "create"}
                className="px-4 py-2 rounded-lg bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
              >
                {actionLoading === "create" ? "Creating..." : "Create Trigger"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedTrigger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 shadow-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete Trigger</h3>
                <p className="text-sm text-slate-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete &quot;{selectedTrigger.name}&quot;?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedTrigger(null);
                }}
                className="px-4 py-2 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTrigger}
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
