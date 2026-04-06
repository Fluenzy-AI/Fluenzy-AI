"use client";

import { useState, useEffect } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import {
  Users,
  Eye,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Target,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Mail,
  Calendar,
  Activity,
  Star,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

interface Segment {
  id: string;
  name: string;
  description?: string;
  count: number;
  isSystem: boolean;
  lastSyncedAt?: string;
  filterRules?: any;
  createdAt?: string;
}

interface SegmentUser {
  id: string;
  name: string;
  email: string;
  plan: string;
  lastLoginAt?: string;
  createdAt: string;
}

const segmentIcons: Record<string, React.ElementType> = {
  "All Users": Users,
  "Free Plan Users": Users,
  "Pro Plan Users": Star,
  "Inactive (7 days)": Clock,
  "Inactive (30 days)": AlertTriangle,
  "New Users (7 days)": Sparkles,
  "Low Scorers": TrendingDown,
  "Power Users": TrendingUp,
  "Incomplete Modules": Activity,
  "Quick Submitters": Clock,
};

const segmentColors: Record<string, string> = {
  "All Users": "from-purple-500 to-purple-600",
  "Free Plan Users": "from-blue-500 to-blue-600",
  "Pro Plan Users": "from-amber-500 to-amber-600",
  "Inactive (7 days)": "from-orange-500 to-orange-600",
  "Inactive (30 days)": "from-red-500 to-red-600",
  "New Users (7 days)": "from-green-500 to-green-600",
  "Low Scorers": "from-pink-500 to-pink-600",
  "Power Users": "from-cyan-500 to-cyan-600",
  "Incomplete Modules": "from-indigo-500 to-indigo-600",
  "Quick Submitters": "from-teal-500 to-teal-600",
};

export default function SegmentsPage() {
  const { user, loading: authLoading } = usePortalAuth();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "system" | "custom">("all");
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [segmentUsers, setSegmentUsers] = useState<SegmentUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  // Create segment form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    filterRules: [
      { field: "plan", operator: "equals", value: "Free" },
    ],
  });

  useEffect(() => {
    if (!authLoading && user) {
      fetchSegments();
    }
  }, [authLoading, user]);

  async function fetchSegments() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/marketing/segments?predefined=true", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch segments");
      const data = await res.json();
      setSegments(data.segments || []);
    } catch (err) {
      console.error("Error fetching segments:", err);
    } finally {
      setLoading(false);
    }
  }

  async function previewSegmentUsers(segment: Segment) {
    try {
      setUsersLoading(true);
      setSelectedSegment(segment);
      
      let payload;
      if (segment.isSystem) {
        // For predefined segments, map name to filter
        const filterMap: Record<string, any> = {
          "All Users": { type: "all_users" },
          "Free Plan Users": { type: "plan_type", plan: "Free" },
          "Pro Plan Users": { type: "plan_type", plan: "Pro" },
          "Inactive (7 days)": { type: "inactive_users", days: 7 },
          "Inactive (30 days)": { type: "inactive_users", days: 30 },
          "New Users (7 days)": { type: "new_users", days: 7 },
          "Low Scorers": { type: "low_score", threshold: 40 },
          "Power Users": { type: "power_users" },
          "Incomplete Modules": { type: "incomplete_module" },
          "Quick Submitters": { type: "quick_submit" },
        };
        payload = { filters: filterMap[segment.name] || { type: "all_users" }, limit: 20 };
      } else {
        payload = { segmentId: segment.id, limit: 20 };
      }

      const res = await fetch("/api/admin/marketing/segments/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to preview segment");
      const data = await res.json();
      setSegmentUsers(data.users || []);
    } catch (err) {
      console.error("Error previewing segment:", err);
      setSegmentUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }

  async function handleCreateSegment() {
    try {
      setRefreshing("create");
      const res = await fetch("/api/admin/marketing/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create segment");
      }
      setShowCreateModal(false);
      setFormData({
        name: "",
        description: "",
        filterRules: [{ field: "plan", operator: "equals", value: "Free" }],
      });
      fetchSegments();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create segment");
    } finally {
      setRefreshing(null);
    }
  }

  const filteredSegments = segments.filter((segment) => {
    const matchesSearch = segment.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      filterType === "all" ||
      (filterType === "system" && segment.isSystem) ||
      (filterType === "custom" && !segment.isSystem);
    return matchesSearch && matchesType;
  });

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
          <h1 className="text-2xl font-bold text-white">User Segments</h1>
          <p className="text-slate-400 mt-1">Target specific user groups for campaigns</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25"
        >
          <Plus className="h-4 w-4" />
          Create Segment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/5 bg-slate-900/50 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Target className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{segments.length}</p>
              <p className="text-xs text-slate-400">Total Segments</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-slate-900/50 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {segments.find(s => s.name === "All Users")?.count.toLocaleString() || "0"}
              </p>
              <p className="text-xs text-slate-400">Total Users</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-slate-900/50 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {segments.find(s => s.name === "Power Users")?.count.toLocaleString() || "0"}
              </p>
              <p className="text-xs text-slate-400">Power Users</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-slate-900/50 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {segments.find(s => s.name === "Inactive (7 days)")?.count.toLocaleString() || "0"}
              </p>
              <p className="text-xs text-slate-400">Inactive Users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search segments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          >
            <option value="all">All Segments</option>
            <option value="system">System Segments</option>
            <option value="custom">Custom Segments</option>
          </select>
        </div>
      </div>

      {/* Segments Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
        </div>
      ) : filteredSegments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
            <Target className="h-8 w-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">No segments found</h3>
          <p className="text-sm text-slate-400 mt-1">
            {searchQuery ? "Try adjusting your search" : "Create your first custom segment"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSegments.map((segment) => {
            const Icon = segmentIcons[segment.name] || Users;
            const gradient = segmentColors[segment.name] || "from-slate-500 to-slate-600";
            
            return (
              <div
                key={segment.id}
                className="group rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm overflow-hidden hover:border-purple-500/30 transition-colors"
              >
                <div className={`h-2 bg-gradient-to-r ${gradient}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} bg-opacity-20 flex items-center justify-center shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    {segment.isSystem && (
                      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded">
                        System
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{segment.name}</h3>
                  {segment.description && (
                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">{segment.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-white">{segment.count.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">users</p>
                    </div>
                    <button
                      onClick={() => previewSegmentUsers(segment)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 text-sm font-medium hover:bg-purple-500/30 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>
                  </div>
                  {segment.lastSyncedAt && (
                    <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Synced {new Date(segment.lastSyncedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Segment Preview Modal */}
      {selectedSegment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-slate-900 border border-white/10 shadow-2xl">
            <div className="sticky top-0 bg-slate-900 border-b border-white/5 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${segmentColors[selectedSegment.name] || "from-slate-500 to-slate-600"} flex items-center justify-center`}>
                  {(() => {
                    const Icon = segmentIcons[selectedSegment.name] || Users;
                    return <Icon className="h-5 w-5 text-white" />;
                  })()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{selectedSegment.name}</h2>
                  <p className="text-sm text-slate-400">{selectedSegment.count.toLocaleString()} users</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedSegment(null);
                  setSegmentUsers([]);
                }}
                className="p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-10 w-10 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
                </div>
              ) : segmentUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-slate-500/10 flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">No users in this segment</h3>
                  <p className="text-sm text-slate-400 mt-1">This segment is currently empty</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-400 mb-4">
                    Showing {segmentUsers.length} of {selectedSegment.count.toLocaleString()} users
                  </p>
                  <div className="space-y-3">
                    {segmentUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/[0.07] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                            {user.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{user.name || "Unknown"}</p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.plan === "Pro" ? "bg-amber-500/20 text-amber-400" :
                            user.plan === "Free" ? "bg-blue-500/20 text-blue-400" :
                            "bg-slate-500/20 text-slate-400"
                          }`}>
                            {user.plan || "Free"}
                          </span>
                          {user.lastLoginAt && (
                            <span className="text-xs text-slate-500">
                              Last login: {new Date(user.lastLoginAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center justify-center">
                    <button
                      onClick={() => {/* Navigate to campaigns with segment selected */}}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                      Send Campaign to this Segment
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Segment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-white/10 shadow-2xl">
            <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Create Custom Segment</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Segment Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., High Value Prospects"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe who belongs in this segment..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Filter Rules</label>
                <p className="text-xs text-slate-500 mb-3">Define conditions to filter users</p>
                {formData.filterRules.map((rule, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <select
                      value={rule.field}
                      onChange={(e) => {
                        const newRules = [...formData.filterRules];
                        newRules[index].field = e.target.value;
                        setFormData(prev => ({ ...prev, filterRules: newRules }));
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    >
                      <option value="plan">Plan Type</option>
                      <option value="lastLoginDays">Last Login (days ago)</option>
                      <option value="createdDays">Signed Up (days ago)</option>
                      <option value="lessonsCompleted">Lessons Completed</option>
                    </select>
                    <select
                      value={rule.operator}
                      onChange={(e) => {
                        const newRules = [...formData.filterRules];
                        newRules[index].operator = e.target.value;
                        setFormData(prev => ({ ...prev, filterRules: newRules }));
                      }}
                      className="w-32 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    >
                      <option value="equals">Equals</option>
                      <option value="not_equals">Not Equals</option>
                      <option value="greater_than">Greater Than</option>
                      <option value="less_than">Less Than</option>
                    </select>
                    <input
                      type="text"
                      value={rule.value}
                      onChange={(e) => {
                        const newRules = [...formData.filterRules];
                        newRules[index].value = e.target.value;
                        setFormData(prev => ({ ...prev, filterRules: newRules }));
                      }}
                      placeholder="Value"
                      className="w-24 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    />
                    {formData.filterRules.length > 1 && (
                      <button
                        onClick={() => {
                          const newRules = formData.filterRules.filter((_, i) => i !== index);
                          setFormData(prev => ({ ...prev, filterRules: newRules }));
                        }}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      filterRules: [...prev.filterRules, { field: "plan", operator: "equals", value: "" }],
                    }));
                  }}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Rule
                </button>
              </div>
            </div>

            <div className="border-t border-white/5 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSegment}
                disabled={!formData.name || refreshing === "create"}
                className="px-4 py-2 rounded-lg bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
              >
                {refreshing === "create" ? "Creating..." : "Create Segment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
