"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AutoApplySetupModal from "@/components/AutoApplySetupModal";
import { Zap, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

interface Preferences {
  autoApplyEnabled: boolean;
  targetRoles: string[];
  targetLocations: string[];
  targetTypes: string[];
  minSalary: string;
  monthlyLimit: number;
  autoApplyCount: number;
  plan: string;
}

interface UserPlan {
  plan: string;
}

export default function AutoApplySetupPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch preferences on mount
  useEffect(() => {
    fetchPreferences();
    fetchUserPlan();
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await fetch("/api/candidates/preferences");
      if (res.ok) {
        const data = await res.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPlan = async () => {
    try {
      const res = await fetch("/api/candidates/me");
      if (res.ok) {
        const data = await res.json();
        setUserPlan({ plan: data.user?.plan || "Free" });
      }
    } catch (error) {
      console.error("Failed to fetch plan:", error);
    }
  };

  const isSetupComplete =
    preferences &&
    preferences.targetRoles.length > 0 &&
    preferences.autoApplyEnabled;

  const planLimits: Record<string, number> = {
    Free: 0,
    Standard: 150,
    Pro: 30,
  };

  const skillThresholds: Record<string, number> = {
    Free: 0,
    Standard: 60,
    Pro: 80,
  };

  const limit = planLimits[userPlan?.plan || "Free"];
  const threshold = skillThresholds[userPlan?.plan || "Free"];
  const used = preferences?.autoApplyCount || 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-8 h-8 text-[#7C5CFC]" />
          <h1 className="text-3xl font-bold text-[#F1F0F5]">Auto-Apply Setup</h1>
        </div>
        <p className="text-[#8B8A99]">
          Set up your auto-apply preferences once, and let AI do the work
        </p>
      </motion.div>

      {/* Plan Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-[#7C5CFC]/10 to-[#A855F7]/10 border border-[#7C5CFC]/20 rounded-2xl p-6 mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Plan */}
          <div>
            <p className="text-[#8B8A99] text-sm font-medium mb-1">Current Plan</p>
            <p className="text-2xl font-bold text-[#F1F0F5]">
              {userPlan?.plan || "Free"}
            </p>
          </div>

          {/* Limit */}
          <div>
            <p className="text-[#8B8A99] text-sm font-medium mb-1">Monthly Limit</p>
            <p className="text-2xl font-bold text-[#F1F0F5]">
              {limit === 0 ? "Manual Only" : `${limit} applications`}
            </p>
            {limit > 0 && (
              <p className="text-xs text-[#8B8A99] mt-1">
                Used: {used}/{limit}
              </p>
            )}
          </div>

          {/* Threshold */}
          <div>
            <p className="text-[#8B8A99] text-sm font-medium mb-1">
              Skill Match Threshold
            </p>
            <p className="text-2xl font-bold text-[#F1F0F5]">
              {threshold === 0 ? "N/A" : `${threshold}%`}
            </p>
          </div>
        </div>

        {limit === 0 && (
          <div className="mt-4 flex items-gap gap-2 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
            <p className="text-sm text-[#EF4444]">
              Auto-apply is available on Standard ($X/month) and Pro ($Y/month)
              plans only
            </p>
          </div>
        )}
      </motion.div>

      {/* Setup Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#13161E] border border-white/[0.06] rounded-2xl p-8 mb-8"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#F1F0F5] mb-2">
              {isSetupComplete ? "✅ Setup Complete" : "⚙️ Complete Your Setup"}
            </h2>
            {isSetupComplete ? (
              <p className="text-[#8B8A99]">
                Your auto-apply is configured and active. Company jobs matching your
                preferences will automatically be applied to.
              </p>
            ) : (
              <p className="text-[#8B8A99]">
                Configure your job preferences to enable auto-apply functionality
              </p>
            )}
          </div>

          {isSetupComplete && (
            <CheckCircle2 className="w-8 h-8 text-[#10B981] flex-shrink-0" />
          )}
        </div>

        {/* Current Configuration */}
        {preferences && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Roles */}
            <div>
              <p className="text-sm font-medium text-[#8B8A99] mb-2">Target Roles:</p>
              {preferences.targetRoles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {preferences.targetRoles.map((role, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-[#7C5CFC]/20 text-[#9F7FFF] text-sm rounded-lg"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[#52515E] text-sm italic">Not configured</p>
              )}
            </div>

            {/* Locations */}
            <div>
              <p className="text-sm font-medium text-[#8B8A99] mb-2">Locations:</p>
              {preferences.targetLocations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {preferences.targetLocations.map((loc, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-[#7C5CFC]/20 text-[#9F7FFF] text-sm rounded-lg"
                    >
                      {loc}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[#52515E] text-sm italic">Not configured</p>
              )}
            </div>

            {/* Employment Types */}
            <div>
              <p className="text-sm font-medium text-[#8B8A99] mb-2">Employment Types:</p>
              {preferences.targetTypes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {preferences.targetTypes.map((type, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-[#7C5CFC]/20 text-[#9F7FFF] text-sm rounded-lg"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[#52515E] text-sm italic">Not configured</p>
              )}
            </div>

            {/* Min Salary */}
            <div>
              <p className="text-sm font-medium text-[#8B8A99] mb-2">Minimum Salary:</p>
              {preferences.minSalary ? (
                <span className="px-3 py-1.5 bg-[#7C5CFC]/20 text-[#9F7FFF] text-sm rounded-lg inline-block">
                  {preferences.minSalary}
                </span>
              ) : (
                <p className="text-[#52515E] text-sm italic">Not configured</p>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={limit === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#7C5CFC] to-[#A855F7] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#7C5CFC]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
        >
          {isSetupComplete ? "Update Preferences" : "Set Up Auto-Apply"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#13161E] border border-white/[0.06] rounded-2xl p-8"
      >
        <h3 className="text-lg font-bold text-[#F1F0F5] mb-4">How Auto-Apply Works</h3>
        <div className="space-y-3">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#7C5CFC]/20 flex items-center justify-center text-[#9F7FFF] font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-[#F1F0F5]">Complete Your Setup</p>
              <p className="text-sm text-[#8B8A99]">Configure your target roles, locations, and preferences</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#7C5CFC]/20 flex items-center justify-center text-[#9F7FFF] font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-[#F1F0F5]">Enable Auto-Apply</p>
              <p className="text-sm text-[#8B8A99]">Turn on the auto-apply toggle to start automatic submissions</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#7C5CFC]/20 flex items-center justify-center text-[#9F7FFF] font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-[#F1F0F5]">Smart Matching</p>
              <p className="text-sm text-[#8B8A99]">
                When companies post jobs, we match them against your preferences and submit applications automatically
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#7C5CFC]/20 flex items-center justify-center text-[#9F7FFF] font-bold flex-shrink-0">
              4
            </div>
            <div>
              <p className="font-medium text-[#F1F0F5]">Track Progress</p>
              <p className="text-sm text-[#8B8A99]">
                Monitor your applications and see submission status in your dashboard
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modal */}
      <AutoApplySetupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComplete={() => {
          setIsModalOpen(false);
          fetchPreferences();
        }}
        plan={userPlan?.plan || "Free"}
      />
    </div>
  );
}
