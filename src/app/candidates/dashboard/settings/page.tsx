"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Settings,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Trash2,
  LogOut,
  Mail,
  CheckCircle,
  AlertTriangle,
  X,
} from "lucide-react";

interface NotificationSettings {
  emailApplicationUpdates: boolean;
  emailInterviewReminders: boolean;
  emailNewJobMatches: boolean;
  browserNotifications: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailApplicationUpdates: true,
    emailInterviewReminders: true,
    emailNewJobMatches: false,
    browserNotifications: true,
  });

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    // Fetch current settings
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/candidates/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.notifications) {
            setNotifications(data.notifications);
          }
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleNotificationChange = async (key: keyof NotificationSettings) => {
    const newValue = !notifications[key];
    setNotifications((prev) => ({ ...prev, [key]: newValue }));
    
    try {
      await fetch("/api/candidates/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notifications: { ...notifications, [key]: newValue },
        }),
      });
      setSuccess("Settings saved");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError("Failed to save settings");
      setNotifications((prev) => ({ ...prev, [key]: !newValue })); // Revert
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/candidates/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to change password");
      }

      setSuccess("Password changed successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordSection(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch("/api/candidates/me", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account");
      
      await fetch("/api/candidates/auth/logout", { method: "POST" });
      router.replace("/");
    } catch (err) {
      setError("Failed to delete account. Please try again.");
      setShowDeleteConfirm(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/candidates/auth/logout", { method: "POST" });
      router.replace("/candidates/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-pulse">
        <div className="h-8 sm:h-10 bg-white/5 rounded-xl w-36 sm:w-48" />
        <div className="h-56 sm:h-64 bg-white/5 rounded-xl" />
        <div className="h-40 sm:h-48 bg-white/5 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account preferences</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
        >
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{success}</span>
        </motion.div>
      )}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400"
        >
          <span className="text-sm flex-1 min-w-0">{error}</span>
          <button onClick={() => setError("")} className="flex-shrink-0 p-1">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Notification Settings */}
      <div className="bg-[#13161E] rounded-xl border border-white/5 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 flex-shrink-0" />
          Notifications
        </h2>
        <div className="space-y-0">
          <div className="flex items-center justify-between gap-3 py-3 border-b border-white/5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">Application Updates</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Get notified when your application status changes
              </p>
            </div>
            <button
              onClick={() => handleNotificationChange("emailApplicationUpdates")}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                notifications.emailApplicationUpdates ? "bg-violet-500" : "bg-white/10"
              }`}
              role="switch"
              aria-checked={notifications.emailApplicationUpdates}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  notifications.emailApplicationUpdates ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between gap-3 py-3 border-b border-white/5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">Interview Reminders</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Get reminded before scheduled interviews
              </p>
            </div>
            <button
              onClick={() => handleNotificationChange("emailInterviewReminders")}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                notifications.emailInterviewReminders ? "bg-violet-500" : "bg-white/10"
              }`}
              role="switch"
              aria-checked={notifications.emailInterviewReminders}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  notifications.emailInterviewReminders ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">New Job Matches</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Get notified about jobs matching your profile
              </p>
            </div>
            <button
              onClick={() => handleNotificationChange("emailNewJobMatches")}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                notifications.emailNewJobMatches ? "bg-violet-500" : "bg-white/10"
              }`}
              role="switch"
              aria-checked={notifications.emailNewJobMatches}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  notifications.emailNewJobMatches ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-[#13161E] rounded-xl border border-white/5 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 flex-shrink-0" />
          Security
        </h2>
        
        {!showPasswordSection ? (
          <button
            onClick={() => setShowPasswordSection(true)}
            className="flex items-center justify-between gap-3 w-full py-3 text-left active:bg-white/5 rounded-lg transition-colors -mx-2 px-2"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">Change Password</p>
              <p className="text-xs text-slate-500 mt-0.5">Update your account password</p>
            </div>
            <Eye className="w-5 h-5 text-slate-500 flex-shrink-0" />
          </button>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
                required
                className="w-full bg-[#0A0C10] border border-white/5 text-white rounded-xl px-3 sm:px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                required
                minLength={6}
                className="w-full bg-[#0A0C10] border border-white/5 text-white rounded-xl px-3 sm:px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                required
                className="w-full bg-[#0A0C10] border border-white/5 text-white rounded-xl px-3 sm:px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordSection(false);
                  setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                }}
                className="px-4 py-2.5 sm:py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white active:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2.5 sm:py-2 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400 active:bg-violet-600 disabled:opacity-60 transition-colors"
              >
                {saving ? "Saving..." : "Update Password"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Account Actions */}
      <div className="bg-[#13161E] rounded-xl border border-white/5 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 flex-shrink-0" />
          Account
        </h2>
        <div className="space-y-2 sm:space-y-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3 rounded-xl text-left hover:bg-white/5 active:bg-white/10 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <LogOut className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">Sign Out</p>
              <p className="text-xs text-slate-500">Log out of your account</p>
            </div>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-3 w-full p-3 rounded-xl text-left hover:bg-red-500/5 active:bg-red-500/10 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-4 h-4 text-red-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-red-400">Delete Account</p>
              <p className="text-xs text-slate-500">Permanently delete your account</p>
            </div>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#13161E] border border-white/10 rounded-2xl w-full max-w-md p-4 sm:p-6"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white text-center mb-2">Delete Account?</h3>
            <p className="text-sm text-slate-400 text-center mb-5 sm:mb-6">
              This action cannot be undone. All your data will be permanently deleted.
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white text-sm font-medium hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-400 active:bg-red-600 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
