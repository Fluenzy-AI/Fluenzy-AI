"use client";

import React, { useState, useEffect } from "react";
import { useCompanyAuth } from "@/contexts/CompanyAuthContext";
import { Button } from "@/components/ui/button";
import { Save, Check, Building2, Globe, MapPin } from "lucide-react";
import { motion } from "framer-motion";

interface CompanySettings {
  name: string;
  domain: string;
  website: string;
  location: string;
  size: string;
  description: string;
}

export default function CompanySettingsPage() {
  const { refresh } = useCompanyAuth();
  const [settings, setSettings] = useState<CompanySettings>({
    name: "",
    domain: "",
    website: "",
    location: "",
    size: "",
    description: "",
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
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
        alert(data.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings");
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
          <Building2 className="w-5 h-5" style={{ color: "var(--portal-primary)" }} />
          Company Information
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--portal-text-muted)" }}>
          General settings for your company profile
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--portal-text-secondary)" }}>
              Company Name <span className="text-[var(--portal-danger)]">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={settings.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 rounded-lg text-sm outline-none transition-colors"
              style={{
                backgroundColor: "var(--portal-bg-base)",
                border: "1px solid var(--portal-border)",
                color: "var(--portal-text-primary)",
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--portal-text-secondary)" }}>
              Domain
            </label>
            <input
              type="text"
              name="domain"
              value={settings.domain}
              disabled
              className="w-full px-4 py-2 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: "var(--portal-disabled-bg)",
                border: "1px solid var(--portal-disabled-border)",
                color: "var(--portal-text-muted)",
              }}
            />
            <p className="text-[10px] mt-1" style={{ color: "var(--portal-text-muted)" }}>Domain cannot be changed</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--portal-text-secondary)" }}>
              Website
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--portal-text-muted)" }} />
              <input
                type="url"
                name="website"
                value={settings.website || ""}
                onChange={handleInputChange}
                placeholder="https://yourcompany.com"
                className="w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none"
                style={{
                  backgroundColor: "var(--portal-bg-base)",
                  border: "1px solid var(--portal-border)",
                  color: "var(--portal-text-primary)",
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--portal-text-secondary)" }}>
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--portal-text-muted)" }} />
              <input
                type="text"
                name="location"
                value={settings.location || ""}
                onChange={handleInputChange}
                placeholder="e.g., Bangalore, India"
                className="w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none"
                style={{
                  backgroundColor: "var(--portal-bg-base)",
                  border: "1px solid var(--portal-border)",
                  color: "var(--portal-text-primary)",
                }}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--portal-text-secondary)" }}>
            Company Size
          </label>
          <select
            name="size"
            value={settings.size || ""}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: "var(--portal-bg-base)",
              border: "1px solid var(--portal-border)",
              color: "var(--portal-text-primary)",
            }}
          >
            <option value="">Select size</option>
            <option value="1-10">1-10 employees</option>
            <option value="11-50">11-50 employees</option>
            <option value="51-200">51-200 employees</option>
            <option value="201-500">201-500 employees</option>
            <option value="501-1000">501-1000 employees</option>
            <option value="1000+">1000+ employees</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--portal-text-secondary)" }}>
            About Company
          </label>
          <textarea
            name="description"
            value={settings.description || ""}
            onChange={handleInputChange}
            rows={4}
            placeholder="Tell candidates about your company..."
            className="w-full px-4 py-2 rounded-lg text-sm outline-none resize-none"
            style={{
              backgroundColor: "var(--portal-bg-base)",
              border: "1px solid var(--portal-border)",
              color: "var(--portal-text-primary)",
            }}
          />
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
              Save Changes
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
            <span className="text-sm font-semibold">Saved successfully</span>
          </motion.div>
        )}
      </div>
    </form>
  );
}
