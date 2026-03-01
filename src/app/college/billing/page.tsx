"use client";
import { useEffect, useState } from "react";
import { useCollegeAdmin } from "@/contexts/CollegeAdminContext";
import CollegeProtectedLayout from "../components/CollegeProtectedLayout";
import { CreditCard, Users, Calendar, CheckCircle, AlertTriangle } from "lucide-react";

const PLANS = [
  {
    id: "Free",
    name: "Free",
    desc: "Basic access for small groups",
    price: "Contact Sales",
    features: ["Up to 50 students", "3 sessions/month per student", "Basic analytics", "Email support"],
    color: "slate",
  },
  {
    id: "Standard",
    name: "Standard",
    desc: "For growing institutions",
    price: "Contact Sales",
    features: ["Up to 200 students", "15 sessions/month per student", "Full analytics", "Priority email support", "CSV export"],
    color: "indigo",
    popular: true,
  },
  {
    id: "Pro",
    name: "Pro",
    desc: "Full-featured institutional access",
    price: "Contact Sales",
    features: ["Unlimited students", "Unlimited sessions", "Advanced analytics", "Department-level tracking", "Dedicated support", "Custom module limits", "API access"],
    color: "purple",
  },
  {
    id: "Enterprise",
    name: "Enterprise",
    desc: "Custom partnership for large universities",
    price: "Custom Pricing",
    features: ["Everything in Pro", "Custom domain SSO", "SLA guarantee", "On-site training", "Custom integrations", "White-label options"],
    color: "amber",
  },
];

export default function CollegeBillingPage() {
  const { admin, token, refreshAdmin } = useCollegeAdmin();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState(false);
  const [seats, setSeats] = useState("");
  const [expiry, setExpiry] = useState("");

  useEffect(() => {
    if (admin) {
      setSeats(String(admin.totalSeats));
      setExpiry(admin.planExpiresAt ? new Date(admin.planExpiresAt).toISOString().slice(0, 10) : "");
    }
  }, [admin]);

  const handleSaveSeats = async () => {
    if (!token) return;
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/college/assign-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          plan: admin?.allocatedPlan,
          totalSeats: parseInt(seats),
          planExpiresAt: expiry || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg("Plan details updated.");
        setEditing(false);
        await refreshAdmin();
      } else {
        setMsg(data.error ?? "Failed to update.");
      }
    } finally {
      setLoading(false);
    }
  };

  const daysUntilExpiry = admin?.planExpiresAt
    ? Math.ceil((new Date(admin.planExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <CollegeProtectedLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-400" /> Billing & Plan
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your institutional subscription and seat allocation</p>
        </div>

        {/* Current Plan Summary */}
        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 rounded-2xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Current Plan</p>
              <h2 className="text-3xl font-bold text-white">{admin?.allocatedPlan}</h2>
              <p className="text-slate-400 text-sm mt-1">Centrally billed institutional plan</p>
            </div>
            {daysUntilExpiry !== null && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${
                daysUntilExpiry <= 7
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : daysUntilExpiry <= 30
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-green-500/10 border-green-500/30 text-green-400"
              }`}>
                {daysUntilExpiry <= 0 ? <AlertTriangle className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                {daysUntilExpiry <= 0
                  ? "Expired"
                  : `${daysUntilExpiry} days remaining`}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 mt-5">
            {[
              { label: "Total Seats", value: admin?.totalSeats === 0 ? "∞" : admin?.totalSeats },
              { label: "Used Seats", value: admin?.usedSeats ?? 0 },
              { label: "Available Seats", value: (admin?.totalSeats ?? 0) > 0 ? Math.max(0, (admin?.totalSeats ?? 0) - (admin?.usedSeats ?? 0)) : "∞" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-800/40 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {admin && admin.totalSeats > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>Seat Usage</span>
                <span>{Math.round(((admin.usedSeats) / (admin.totalSeats)) * 100)}%</span>
              </div>
              <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    (admin.usedSeats / admin.totalSeats) > 0.9
                      ? "bg-gradient-to-r from-red-500 to-red-600"
                      : (admin.usedSeats / admin.totalSeats) > 0.7
                      ? "bg-gradient-to-r from-amber-500 to-amber-600"
                      : "bg-gradient-to-r from-indigo-500 to-purple-500"
                  }`}
                  style={{ width: `${Math.min(100, (admin.usedSeats / admin.totalSeats) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Edit seats/expiry (admin can request adjustments) */}
          <div className="mt-4 pt-4 border-t border-slate-700/30">
            {!editing ? (
              <div className="flex items-center justify-between text-sm">
                <div className="text-slate-400">
                  {admin?.planExpiresAt
                    ? `Plan valid until: ${new Date(admin.planExpiresAt).toLocaleDateString()}`
                    : "No expiry date set"}
                </div>
                <button onClick={() => setEditing(true)} className="text-indigo-400 hover:text-indigo-300 text-sm">Edit Details</button>
              </div>
            ) : (
              <div className="space-y-3">
                {msg && <p className={`text-sm ${msg.includes("updated") ? "text-green-400" : "text-red-400"}`}>{msg}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Total Seats (0 = unlimited)</label>
                    <input type="number" value={seats} onChange={(e) => setSeats(e.target.value)} min="0"
                      className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Plan Expiry Date</label>
                    <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveSeats} disabled={loading}
                    className="px-4 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm hover:bg-indigo-500/30 transition-all disabled:opacity-50">
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                  <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-slate-300 text-sm hover:bg-slate-700 transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Plan Comparison */}
        <div>
          <h3 className="text-white font-semibold mb-4">Available Plans — Contact sales@fluenzyai.app to upgrade</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((plan) => {
              const isActive = admin?.allocatedPlan === plan.id;
              return (
                <div key={plan.id}
                  className={`relative rounded-2xl border p-5 transition-all ${
                    plan.popular
                      ? "border-indigo-500/50 bg-indigo-500/5"
                      : "border-slate-700/50 bg-[#111827]/60"
                  } ${isActive ? "ring-2 ring-indigo-500/50" : ""}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-medium">
                      Most Popular
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 text-green-400 text-xs font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> Active
                    </div>
                  )}
                  <h4 className={`text-lg font-bold text-${plan.color === "slate" ? "slate-300" : plan.color + "-300"} mb-1`}>{plan.name}</h4>
                  <p className="text-slate-500 text-xs mb-3">{plan.desc}</p>
                  <p className={`text-${plan.color === "slate" ? "slate" : plan.color}-400 font-semibold text-sm mb-4`}>{plan.price}</p>
                  <ul className="space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-slate-400">
                        <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-white font-semibold">Need a custom plan?</h3>
            <p className="text-slate-400 text-sm mt-1">Contact our enterprise team for custom pricing, SLA, and integrations.</p>
          </div>
          <a href="mailto:sales@fluenzyai.app?subject=College Partnership Inquiry"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25">
            Contact Sales →
          </a>
        </div>
      </div>
    </CollegeProtectedLayout>
  );
}
