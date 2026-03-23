"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Zap, Settings, Briefcase, MapPin, DollarSign, Building2, X, Plus,
  ChevronLeft, AlertCircle, Check, Loader2, Crown
} from "lucide-react";

interface Preferences {
  autoApplyEnabled: boolean;
  targetRoles: string[];
  targetLocations: string[];
  targetTypes: string[];
  minSalary: string;
  maxExperience: string;
  excludeCompanies: string[];
  autoApplyCount: number;
  monthlyLimit: number;
}

const COMMON_ROLES = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Analyst",
  "Product Manager",
  "UI/UX Designer",
  "DevOps Engineer",
  "QA Engineer",
  "Data Scientist",
];

const LOCATIONS = ["REMOTE", "HYBRID", "ONSITE"];
const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"];

const LOC_LABELS: Record<string, string> = {
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  ONSITE: "On-site",
};

const TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

export default function AutoApplySettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canAutoApply, setCanAutoApply] = useState(false);
  const [plan, setPlan] = useState("Free");
  const [preferences, setPreferences] = useState<Preferences>({
    autoApplyEnabled: false,
    targetRoles: [],
    targetLocations: [],
    targetTypes: [],
    minSalary: "",
    maxExperience: "",
    excludeCompanies: [],
    autoApplyCount: 0,
    monthlyLimit: 0,
  });
  const [newRole, setNewRole] = useState("");
  const [newCompany, setNewCompany] = useState("");

  useEffect(() => {
    fetchPreferences();
  }, []);

  async function fetchPreferences() {
    try {
      const res = await fetch("/api/candidates/preferences", { credentials: "include" });
      if (res.status === 401) {
        router.push("/candidates/login");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setPreferences(data.preferences);
        setCanAutoApply(data.canAutoApply);
        setPlan(data.plan);
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
    } finally {
      setLoading(false);
    }
  }

  async function savePreferences() {
    setSaving(true);
    try {
      const res = await fetch("/api/candidates/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(preferences),
      });
      if (res.ok) {
        // Show success
      }
    } catch (error) {
      console.error("Failed to save preferences:", error);
    } finally {
      setSaving(false);
    }
  }

  const toggleLocation = (loc: string) => {
    setPreferences((p) => ({
      ...p,
      targetLocations: p.targetLocations.includes(loc)
        ? p.targetLocations.filter((l) => l !== loc)
        : [...p.targetLocations, loc],
    }));
  };

  const toggleType = (type: string) => {
    setPreferences((p) => ({
      ...p,
      targetTypes: p.targetTypes.includes(type)
        ? p.targetTypes.filter((t) => t !== type)
        : [...p.targetTypes, type],
    }));
  };

  const addRole = (role: string) => {
    if (role && !preferences.targetRoles.includes(role)) {
      setPreferences((p) => ({ ...p, targetRoles: [...p.targetRoles, role] }));
      setNewRole("");
    }
  };

  const removeRole = (role: string) => {
    setPreferences((p) => ({ ...p, targetRoles: p.targetRoles.filter((r) => r !== role) }));
  };

  const addExcludedCompany = () => {
    if (newCompany && !preferences.excludeCompanies.includes(newCompany)) {
      setPreferences((p) => ({ ...p, excludeCompanies: [...p.excludeCompanies, newCompany] }));
      setNewCompany("");
    }
  };

  const removeExcludedCompany = (company: string) => {
    setPreferences((p) => ({ ...p, excludeCompanies: p.excludeCompanies.filter((c) => c !== company) }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <Link
          href="/candidates/dashboard"
          className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Auto-Apply Settings</h1>
            <p className="text-slate-400 text-sm">Configure your job preferences for automatic applications</p>
          </div>
        </div>

        {/* Plan Status */}
        {!canAutoApply ? (
          <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Crown className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">Upgrade to Enable Auto-Apply</h3>
                <p className="text-slate-400 text-sm mb-4">
                  You&apos;re on the {plan} plan. Upgrade to Standard or Pro to enable automatic job applications.
                </p>
                <div className="flex gap-4">
                  <div className="flex-1 bg-white/5 rounded-xl p-4">
                    <p className="text-sm font-medium text-white mb-1">Standard Plan</p>
                    <p className="text-xs text-slate-400 mb-2">150 auto-applications/month</p>
                    <p className="text-xs text-slate-500">60% skill match threshold</p>
                  </div>
                  <div className="flex-1 bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                    <p className="text-sm font-medium text-purple-300 mb-1">Pro Plan</p>
                    <p className="text-xs text-slate-400 mb-2">30 targeted applications/month</p>
                    <p className="text-xs text-slate-500">80% skill match + priority ranking</p>
                  </div>
                </div>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Auto-Apply Usage This Month</p>
                <p className="text-2xl font-bold text-white">
                  {preferences.autoApplyCount} / {preferences.monthlyLimit}
                </p>
              </div>
              <div className="flex-1 max-w-xs ml-8">
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${Math.min((preferences.autoApplyCount / preferences.monthlyLimit) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1 text-right">
                  Resets on the 1st of next month
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Auto-Apply */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">Enable Auto-Apply</h3>
              <p className="text-sm text-slate-400 mt-1">
                Automatically apply to matching jobs based on your preferences
              </p>
            </div>
            <button
              onClick={() => {
                if (!canAutoApply) return;
                setPreferences((p) => ({ ...p, autoApplyEnabled: !p.autoApplyEnabled }));
              }}
              disabled={!canAutoApply}
              className={`relative w-14 h-7 rounded-full transition ${
                preferences.autoApplyEnabled
                  ? "bg-indigo-600"
                  : "bg-slate-700"
              } ${!canAutoApply ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.autoApplyEnabled ? "translate-x-7" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div className="space-y-6">
          {/* Target Roles */}
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-white">Target Roles</h3>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Select or add the roles you&apos;re interested in
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {COMMON_ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => addRole(role)}
                  disabled={preferences.targetRoles.includes(role)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    preferences.targetRoles.includes(role)
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRole(newRole)}
                placeholder="Add custom role..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
              <button
                onClick={() => addRole(newRole)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {preferences.targetRoles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {preferences.targetRoles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-sm"
                  >
                    {role}
                    <button onClick={() => removeRole(role)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Location Preferences */}
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold text-white">Location Preferences</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  onClick={() => toggleLocation(loc)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    preferences.targetLocations.includes(loc)
                      ? "bg-green-600/20 text-green-300 border border-green-500/30"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {LOC_LABELS[loc]}
                </button>
              ))}
            </div>
          </div>

          {/* Employment Types */}
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-white">Employment Types</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {EMPLOYMENT_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    preferences.targetTypes.includes(type)
                      ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Salary */}
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-yellow-400" />
              <h3 className="font-semibold text-white">Minimum Salary</h3>
            </div>
            <input
              type="text"
              value={preferences.minSalary}
              onChange={(e) => setPreferences((p) => ({ ...p, minSalary: e.target.value }))}
              placeholder="e.g., 5 LPA or $50000"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Excluded Companies */}
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-red-400" />
              <h3 className="font-semibold text-white">Excluded Companies</h3>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Add companies you don&apos;t want to auto-apply to
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addExcludedCompany()}
                placeholder="Company name..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
              <button
                onClick={addExcludedCompany}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {preferences.excludeCompanies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {preferences.excludeCompanies.map((company) => (
                  <span
                    key={company}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm"
                  >
                    {company}
                    <button onClick={() => removeExcludedCompany(company)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={savePreferences}
            disabled={saving}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-medium flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Preferences
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
