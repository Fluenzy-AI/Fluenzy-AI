"use client";

import { useEffect, useState, useCallback } from "react";
import PortalLayout from "@/components/PortalLayout";
import { usePortalAuth } from "@/contexts/PortalAuthContext";

const ADMIN_NAV = [
  { label: "Dashboard", href: "/portal/admin" },
  { label: "User Management", href: "/portal/admin/users" },
  { label: "Subscriptions", href: "/portal/admin/subscriptions" },
  { label: "Payment Logs", href: "/portal/admin/payments" },
  { label: "Support Tickets", href: "/portal/admin/tickets" },
  { label: "Broadcast Email", href: "/portal/admin/broadcast-email" },
  { label: "Feature Toggles", href: "/portal/admin/feature-toggles" },
  { label: "Email History", href: "/portal/admin/email-logs" },
  { label: "Audit Logs", href: "/portal/admin/audit-logs" },
  { label: "Analytics", href: "/portal/admin/analytics" },
];

interface FeatureToggle {
  id: string;
  key: string;
  label: string;
  description?: string;
  enabled: boolean;
  affectedRoles: string[];
  updatedAt: string;
}

export default function FeatureTogglesPage() {
  const { user } = usePortalAuth();
  const [toggles, setToggles] = useState<FeatureToggle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [form, setForm] = useState({ key: "", label: "", description: "", affectedRoles: [] as string[], enabled: true });

  const fetchToggles = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/portal/admin/feature-toggles", { credentials: "include" });
    if (res.ok) { const d = await res.json(); setToggles(Array.isArray(d.toggles) ? d.toggles : d.featureToggles ?? []); }
    setLoading(false);
  }, []);

  useEffect(() => { if (user) fetchToggles(); }, [user, fetchToggles]);

  async function toggle(key: string, enabled: boolean) {
    setToggling(key);
    await fetch(`/api/portal/admin/feature-toggles/${key}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    await fetchToggles();
    setToggling(null);
  }

  async function createToggle() {
    if (!form.key.trim() || !form.label.trim()) return alert("Key and label are required.");
    const res = await fetch("/api/portal/admin/feature-toggles", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { await fetchToggles(); setShowCreate(false); setForm({ key: "", label: "", description: "", affectedRoles: [], enabled: true }); }
    else { const d = await res.json(); alert(d.error); }
  }

  const ALL_ROLES = ["USER", "PRO", "STANDARD", "FREE", "PORTAL_HR", "PORTAL_ADMIN"];

  return (
    <PortalLayout navItems={ADMIN_NAV} title="Feature Toggles" roleLabel="Admin Portal" roleColor="text-blue-400">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Feature Toggles</h2>
            <p className="text-slate-400 text-sm">{toggles.length} features configured</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl transition">+ Add Feature</button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        ) : toggles.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="text-lg mb-2">No feature toggles yet</p>
            <p className="text-sm">Create your first feature flag to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {toggles.map(ft => (
              <div key={ft.key} className={`bg-slate-900 rounded-2xl border ${ft.enabled ? "border-green-500/20" : "border-white/5"} p-5 transition`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-semibold text-white truncate">{ft.label}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{ft.key}</p>
                  </div>
                  <button
                    onClick={() => toggle(ft.key, ft.enabled)}
                    disabled={toggling === ft.key}
                    className={`relative w-12 h-6 rounded-full flex-shrink-0 transition-colors ${ft.enabled ? "bg-green-500" : "bg-slate-700"} ${toggling === ft.key ? "opacity-50" : ""}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${ft.enabled ? "translate-x-7" : "translate-x-1"}`} />
                  </button>
                </div>
                {ft.description && <p className="text-xs text-slate-500 mb-3">{ft.description}</p>}
                {ft.affectedRoles && ft.affectedRoles.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {ft.affectedRoles.map(r => <span key={r} className="text-xs bg-white/5 text-slate-400 px-2 py-0.5 rounded-full">{r}</span>)}
                  </div>
                )}
                <p className="text-xs text-slate-600 mt-2">Updated {new Date(ft.updatedAt).toLocaleDateString("en-IN")}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="font-semibold text-white">Add Feature Toggle</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Key * <span className="text-slate-600">(unique identifier)</span></label>
                <input value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value.toLowerCase().replace(/\s+/g, "_") }))}
                  placeholder="e.g. voice_practice_v2" className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Label *</label>
                <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. Voice Practice V2" className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  placeholder="What does this feature toggle control?" className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-sm text-white resize-none" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Affected Roles</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_ROLES.map(r => (
                    <button key={r} type="button"
                      onClick={() => setForm(f => ({ ...f, affectedRoles: f.affectedRoles.includes(r) ? f.affectedRoles.filter(x => x !== r) : [...f.affectedRoles, r] }))}
                      className={`text-xs px-2.5 py-1 rounded-lg transition ${form.affectedRoles.includes(r) ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>{r}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-300">Enable immediately</label>
                <button onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.enabled ? "bg-green-500" : "bg-slate-700"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
              <button onClick={createToggle} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl transition font-medium">Add Feature Toggle</button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
