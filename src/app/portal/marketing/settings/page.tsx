"use client";

import { useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import {
  Settings,
  Mail,
  Bell,
  Shield,
  Palette,
  Globe,
  Save,
  CheckCircle2,
  AlertTriangle,
  Key,
  Link2,
} from "lucide-react";

export default function SettingsPage() {
  const { user, loading: authLoading } = usePortalAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    // General
    defaultSenderType: "news",
    defaultCooldownHours: 24,
    trackOpens: true,
    trackClicks: true,

    // Notifications
    notifyOnCampaignSent: true,
    notifyOnHighBounce: true,
    notifyOnLowOpen: true,
    bounceThreshold: 5,
    openThreshold: 10,

    // API
    geminiApiKey: "",
    emailProvider: "brevo",
  });

  async function handleSave() {
    setSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "integrations", label: "Integrations", icon: Link2 },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 mt-1">Configure your marketing portal preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-purple-500/25"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm p-3 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeTab === tab.id
                    ? "bg-purple-500/20 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? "text-purple-400" : ""}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
          {activeTab === "general" && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">General Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Default Sender Type
                    </label>
                    <select
                      value={settings.defaultSenderType}
                      onChange={(e) => setSettings(prev => ({ ...prev, defaultSenderType: e.target.value }))}
                      className="w-full max-w-xs px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    >
                      <option value="news">News (news@fluenzyai.app)</option>
                      <option value="contact">Contact (contact@fluenzyai.app)</option>
                      <option value="careers">Careers (careers@fluenzyai.app)</option>
                      <option value="support">Support (support@fluenzyai.app)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Default Cooldown (hours)
                    </label>
                    <input
                      type="number"
                      value={settings.defaultCooldownHours}
                      onChange={(e) => setSettings(prev => ({ ...prev, defaultCooldownHours: parseInt(e.target.value) || 24 }))}
                      min={1}
                      className="w-32 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Minimum time between automated emails to the same user
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/5 pt-6">
                <h3 className="text-md font-medium text-white mb-4">Tracking</h3>
                <div className="space-y-4">
                  <ToggleSetting
                    label="Track Email Opens"
                    description="Add tracking pixel to monitor open rates"
                    checked={settings.trackOpens}
                    onChange={(checked) => setSettings(prev => ({ ...prev, trackOpens: checked }))}
                  />
                  <ToggleSetting
                    label="Track Link Clicks"
                    description="Wrap links to monitor click-through rates"
                    checked={settings.trackClicks}
                    onChange={(checked) => setSettings(prev => ({ ...prev, trackClicks: checked }))}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">Notification Preferences</h2>
                <div className="space-y-4">
                  <ToggleSetting
                    label="Campaign Sent Notifications"
                    description="Get notified when a campaign finishes sending"
                    checked={settings.notifyOnCampaignSent}
                    onChange={(checked) => setSettings(prev => ({ ...prev, notifyOnCampaignSent: checked }))}
                  />
                  <ToggleSetting
                    label="High Bounce Rate Alerts"
                    description="Get alerted when bounce rate exceeds threshold"
                    checked={settings.notifyOnHighBounce}
                    onChange={(checked) => setSettings(prev => ({ ...prev, notifyOnHighBounce: checked }))}
                  />
                  {settings.notifyOnHighBounce && (
                    <div className="ml-6">
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Bounce Rate Threshold (%)
                      </label>
                      <input
                        type="number"
                        value={settings.bounceThreshold}
                        onChange={(e) => setSettings(prev => ({ ...prev, bounceThreshold: parseInt(e.target.value) || 5 }))}
                        min={1}
                        max={100}
                        className="w-24 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                      />
                    </div>
                  )}
                  <ToggleSetting
                    label="Low Open Rate Alerts"
                    description="Get alerted when open rate falls below threshold"
                    checked={settings.notifyOnLowOpen}
                    onChange={(checked) => setSettings(prev => ({ ...prev, notifyOnLowOpen: checked }))}
                  />
                  {settings.notifyOnLowOpen && (
                    <div className="ml-6">
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Open Rate Threshold (%)
                      </label>
                      <input
                        type="number"
                        value={settings.openThreshold}
                        onChange={(e) => setSettings(prev => ({ ...prev, openThreshold: parseInt(e.target.value) || 10 }))}
                        min={1}
                        max={100}
                        className="w-24 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">Integrations</h2>
                <div className="space-y-6">
                  <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Key className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Gemini AI API</p>
                        <p className="text-xs text-slate-400">For AI email generation</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        API Key
                      </label>
                      <input
                        type="password"
                        value={settings.geminiApiKey}
                        onChange={(e) => setSettings(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                        placeholder="Enter your Gemini API key"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Get your API key from{" "}
                        <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                          Google AI Studio
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Email Provider</p>
                        <p className="text-xs text-slate-400">For sending marketing emails</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Provider
                      </label>
                      <select
                        value={settings.emailProvider}
                        onChange={(e) => setSettings(prev => ({ ...prev, emailProvider: e.target.value }))}
                        className="w-full max-w-xs px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                      >
                        <option value="brevo">Brevo (Sendinblue)</option>
                        <option value="resend">Resend</option>
                        <option value="sendgrid">SendGrid</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">Security Settings</h2>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="h-5 w-5 text-purple-400" />
                      <p className="text-white font-medium">Account Security</p>
                    </div>
                    <p className="text-sm text-slate-400 mb-4">
                      Your account is protected with password authentication
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-colors">
                        Change Password
                      </button>
                      <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-colors">
                        View Login History
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/10">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white font-medium">Permissions</p>
                        <p className="text-sm text-slate-400 mt-1">
                          Your current permissions are managed by the Super Admin. Contact them to request changes.
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {user?.permissions && Object.entries(user.permissions)
                            .filter(([_, v]) => v)
                            .map(([key]) => (
                              <span key={key} className="text-xs bg-white/10 text-white px-2 py-1 rounded">
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </span>
                            ))
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
      </label>
    </div>
  );
}
