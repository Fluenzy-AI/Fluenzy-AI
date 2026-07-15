"use client";

import React, { useState, useEffect } from "react";
import { useCompanyAuth } from "@/contexts/CompanyAuthContext";
import { Button } from "@/components/ui/button";
import { Save, Check, Zap, FileText } from "lucide-react";
import { motion } from "framer-motion";

interface HiringSettings {
  autoApplyEnabled: boolean;
}

export default function HiringSettingsPage() {
  const { refresh } = useCompanyAuth();
  const [settings, setSettings] = useState<HiringSettings>({
    autoApplyEnabled: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/company/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings({
          autoApplyEnabled: !!data.settings?.autoApplyEnabled,
        });
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    setSettings({ autoApplyEnabled: checked });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/company/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaveSuccess(true);
        refresh(); // Refresh Auth Context company info
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save hiring preferences");
      }
    } catch (error) {
      console.error("Failed to save hiring preferences:", error);
      alert("Failed to save hiring preferences");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="w-6 h-6 border-2 border-[var(--portal-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--portal-text-primary)" }}>
          <Zap className="w-5 h-5" style={{ color: "var(--portal-primary)" }} />
          Hiring Preferences
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--portal-text-muted)" }}>
          Configure smart options for recruiter automation pipelines
        </p>
      </div>

      <div className="space-y-5">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            name="autoApplyEnabled"
            checked={settings.autoApplyEnabled}
            onChange={handleCheckboxChange}
            className="w-4 h-4 mt-0.5 rounded border-[var(--portal-border)] bg-[var(--portal-bg-base)] text-[var(--portal-primary)] focus:ring-[var(--portal-primary)]"
          />
          <div>
            <span className="text-sm font-semibold transition-colors group-hover:text-[var(--portal-text-primary)]" style={{ color: "var(--portal-text-secondary)" }}>
              Enable Auto-Apply
            </span>
            <p className="text-xs leading-relaxed mt-1" style={{ color: "var(--portal-text-muted)" }}>
              Allow candidates with matching profiles to automatically apply to your jobs.
            </p>
          </div>
        </label>

        <div className="p-4 rounded-lg flex items-start gap-3" style={{
          backgroundColor: "var(--portal-primary-muted)",
          border: "1px solid var(--portal-primary-muted)",
        }}>
          <FileText className="w-4.5 h-4.5 mt-0.5 flex-shrink-0" style={{ color: "var(--portal-primary)" }} />
          <div>
            <p className="text-xs font-bold" style={{ color: "var(--portal-primary)" }}>About Auto-Apply</p>
            <p className="text-[11px] leading-relaxed mt-1" style={{ color: "var(--portal-text-secondary)" }}>
              When enabled, candidates whose profiles (skills, experience, location) match the requirements for an active job posting above a threshold will be automatically forwarded to your active review queue.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button
          type="submit"
          disabled={isSaving}
          className="font-semibold text-white transition-colors"
          style={{
            backgroundColor: "var(--portal-primary)",
          }}
        >
          {isSaving ? (
            "Saving..."
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>

        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
            style={{ color: "var(--portal-success)" }}
          >
            <Check className="w-4 h-4" />
            <span className="text-sm font-semibold">Preferences saved</span>
          </motion.div>
        )}
      </div>
    </form>
  );
}
