"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import CompanyPortalLayout from "@/components/CompanyPortalLayout";
import {
  Building2,
  Mail,
  Globe,
  MapPin,
  Users,
  FileText,
  Zap,
  Save,
  Image as ImageIcon,
  Check,
  LayoutDashboard,
  Briefcase,
  UserPlus,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const COMPANY_NAV = [
  { label: "Dashboard", href: "/company/portal", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Job Postings", href: "/company/portal/jobs", icon: <Briefcase className="w-4 h-4" /> },
  { label: "Applications", href: "/company/portal/applications", icon: <Users className="w-4 h-4" /> },
  { label: "Assessments", href: "/company/portal/assessments", icon: <FileText className="w-4 h-4" /> },
  { label: "Team", href: "/company/portal/team", icon: <UserPlus className="w-4 h-4" />, adminOnly: true },
  { label: "Settings", href: "/company/portal/settings", icon: <Settings className="w-4 h-4" />, adminOnly: true },
];

interface CompanySettings {
  name: string;
  domain: string;
  website: string;
  location: string;
  size: string;
  description: string;
  logoUrl?: string;
  autoApplyEnabled: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<CompanySettings>({
    name: "",
    domain: "",
    website: "",
    location: "",
    size: "",
    description: "",
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
    const { name, value, type } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
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
      <CompanyPortalLayout navItems={COMPANY_NAV} title="Settings">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </CompanyPortalLayout>
    );
  }

  return (
    <CompanyPortalLayout navItems={COMPANY_NAV} title="Settings">
      <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Company Settings</h1>
        <p className="text-slate-400 mt-1">Manage your company profile and preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            Company Information
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Company Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={settings.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Domain
                </label>
                <input
                  type="text"
                  name="domain"
                  value={settings.domain}
                  disabled
                  className="w-full px-4 py-2 bg-slate-900/30 border border-slate-700 rounded-lg text-slate-500"
                />
                <p className="text-xs text-slate-500 mt-1">Domain cannot be changed</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Website
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="url"
                    name="website"
                    value={settings.website}
                    onChange={handleInputChange}
                    placeholder="https://yourcompany.com"
                    className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="location"
                    value={settings.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Bangalore, India"
                    className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Company Size
              </label>
              <select
                name="size"
                value={settings.size}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
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
              <label className="block text-sm font-medium text-slate-300 mb-2">
                About Company
              </label>
              <textarea
                name="description"
                value={settings.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Tell candidates about your company..."
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </div>
        </motion.div>

        {/* Company Branding */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-400" />
            Company Branding
          </h2>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Company Logo URL
            </label>
            <input
              type="url"
              name="logoUrl"
              value={settings.logoUrl || ""}
              onChange={handleInputChange}
              placeholder="https://yourcompany.com/logo.png"
              className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {settings.logoUrl && (
              <div className="mt-3 p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                <p className="text-xs text-slate-400 mb-2">Logo Preview:</p>
                <img
                  src={settings.logoUrl}
                  alt="Company logo"
                  className="w-24 h-24 object-contain rounded-lg bg-white/5"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Hiring Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            Hiring Preferences
          </h2>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="autoApplyEnabled"
                checked={settings.autoApplyEnabled}
                onChange={handleInputChange}
                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="text-white font-medium">Enable Auto-Apply</span>
                <p className="text-sm text-slate-400">
                  Allow candidates with matching profiles to automatically apply to your jobs
                </p>
              </div>
            </label>

            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-300 font-medium">About Auto-Apply</p>
                  <p className="text-xs text-slate-400 mt-1">
                    When enabled, candidates who meet your job requirements (skills, experience, location)
                    at the threshold matching level will be auto-applied to your positions, saving time for
                    both you and qualified candidates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8"
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
              className="flex items-center gap-2 text-emerald-400"
            >
              <Check className="w-5 h-5" />
              <span className="text-sm font-medium">Settings saved successfully!</span>
            </motion.div>
          )}
        </div>
      </form>
    </div>
    </CompanyPortalLayout>
  );
}
