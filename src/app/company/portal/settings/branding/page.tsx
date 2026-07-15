"use client";

import React, { useState, useEffect } from "react";
import { useCompanyAuth } from "@/contexts/CompanyAuthContext";
import { Button } from "@/components/ui/button";
import { Save, Check, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";

interface BrandingSettings {
  logoUrl?: string;
  name: string;
}

export default function BrandingSettingsPage() {
  const { refresh } = useCompanyAuth();
  const [settings, setSettings] = useState<BrandingSettings>({
    logoUrl: "",
    name: "",
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
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
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
        alert(data.error || "Failed to save branding");
      }
    } catch (error) {
      console.error("Failed to save branding:", error);
      alert("Failed to save branding");
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
          <ImageIcon className="w-5 h-5" style={{ color: "var(--portal-primary)" }} />
          Company Branding
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--portal-text-muted)" }}>
          Customize company logo and visualization parameters
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--portal-text-secondary)" }}>
            Company Logo URL
          </label>
          <input
            type="url"
            name="logoUrl"
            value={settings.logoUrl || ""}
            onChange={handleInputChange}
            placeholder="https://yourcompany.com/logo.png"
            className="w-full px-4 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: "var(--portal-bg-base)",
              border: "1px solid var(--portal-border)",
              color: "var(--portal-text-primary)",
            }}
          />
          {settings.logoUrl && (
            <div className="mt-4 p-4 rounded-lg border flex flex-col items-start gap-2" style={{
              backgroundColor: "var(--portal-bg-base)",
              borderColor: "var(--portal-border)",
            }}>
              <p className="text-xs font-medium" style={{ color: "var(--portal-text-muted)" }}>Logo Preview:</p>
              <img
                src={settings.logoUrl}
                alt="Company logo preview"
                className="w-20 h-20 object-contain rounded bg-white/5 border border-[var(--portal-border)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
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
              Save Branding
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
            <span className="text-sm font-semibold">Branding saved</span>
          </motion.div>
        )}
      </div>
    </form>
  );
}
