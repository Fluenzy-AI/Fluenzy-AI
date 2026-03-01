"use client";
import { useState, useEffect } from "react";
import CollegeProtectedLayout from "../components/CollegeProtectedLayout";
import { useCollegeAdmin } from "@/contexts/CollegeAdminContext";
import {
  Settings, Building2, Globe, Phone, MapPin, Lock, Save, Loader2, CheckCircle, Eye, EyeOff, User
} from "lucide-react";

interface ProfileForm {
  collegeName: string;
  adminName: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

interface PwdForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
      <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-5">
        <span className="text-indigo-400">{icon}</span> {title}
      </h2>
      {children}
    </div>
  );
}

function SuccessAlert({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
      <CheckCircle className="w-4 h-4 flex-shrink-0" /> {message}
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{message}</div>
  );
}

export default function SettingsPage() {
  const { admin, refreshAdmin } = useCollegeAdmin();

  const [profile, setProfile] = useState<ProfileForm>({
    collegeName: "", adminName: "", phone: "", website: "",
    address: "", city: "", state: "", country: "India", pincode: "",
  });
  const [pwd, setPwd] = useState<PwdForm>({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (admin) {
      setProfile((p) => ({
        ...p,
        collegeName: admin.collegeName ?? "",
        adminName: admin.adminName ?? "",
        phone: (admin as { phone?: string }).phone ?? "",
        website: (admin as { website?: string }).website ?? "",
        address: (admin as { address?: string }).address ?? "",
        city: (admin as { city?: string }).city ?? "",
        state: (admin as { state?: string }).state ?? "",
        country: (admin as { country?: string }).country ?? "India",
        pincode: (admin as { pincode?: string }).pincode ?? "",
      }));
    }
  }, [admin]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.collegeName.trim()) { setProfileMsg({ type: "error", text: "College name is required." }); return; }
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const token = localStorage.getItem("college_token");
      const res = await fetch("/api/college/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) { setProfileMsg({ type: "error", text: data.error ?? "Save failed." }); return; }
      setProfileMsg({ type: "success", text: "Profile updated successfully!" });
      refreshAdmin?.();
    } catch {
      setProfileMsg({ type: "error", text: "Network error." });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePwdSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.newPassword.length < 8) { setPwdMsg({ type: "error", text: "New password must be at least 8 characters." }); return; }
    if (pwd.newPassword !== pwd.confirmPassword) { setPwdMsg({ type: "error", text: "Passwords do not match." }); return; }
    setSavingPwd(true);
    setPwdMsg(null);
    try {
      const token = localStorage.getItem("college_token");
      const res = await fetch("/api/college/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setPwdMsg({ type: "error", text: data.error ?? "Password change failed." }); return; }
      setPwdMsg({ type: "success", text: "Password changed successfully!" });
      setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      setPwdMsg({ type: "error", text: "Network error." });
    } finally {
      setSavingPwd(false);
    }
  };

  const inp = (label: string, id: keyof ProfileForm, placeholder = "", icon?: React.ReactNode) => (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
        <input
          value={profile[id]}
          onChange={(e) => setProfile((f) => ({ ...f, [id]: e.target.value }))}
          placeholder={placeholder}
          className={`w-full bg-slate-800/60 border border-slate-600/60 rounded-lg ${icon ? "pl-10" : "pl-4"} pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all`}
        />
      </div>
    </div>
  );

  return (
    <CollegeProtectedLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-400" /> Settings
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your college profile and account security.</p>
        </div>

        {/* Read-only info */}
        {admin && (
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 text-sm text-indigo-300">
            <span className="font-medium">Domain:</span> <span className="font-mono text-indigo-200">{admin.domain}</span>
            &nbsp;&nbsp;|&nbsp;&nbsp;<span className="font-medium">Status:</span>{" "}
            <span className={`font-semibold ${admin.status === "APPROVED" ? "text-green-400" : admin.status === "PENDING" ? "text-yellow-400" : "text-red-400"}`}>
              {admin.status}
            </span>
          </div>
        )}

        {/* Profile */}
        <Section title="College Profile" icon={<Building2 className="w-5 h-5" />}>
          <form onSubmit={handleProfileSave} className="space-y-4">
            {profileMsg && (profileMsg.type === "success"
              ? <SuccessAlert message={profileMsg.text} />
              : <ErrorAlert message={profileMsg.text} />)}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {inp("College Name *", "collegeName", "Your institution's full name", <Building2 className="w-4 h-4" />)}
              {inp("Admin Contact Name", "adminName", "Your full name", <User className="w-4 h-4" />)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {inp("Phone Number", "phone", "+91 99999 99999", <Phone className="w-4 h-4" />)}
              {inp("Website", "website", "https://college.edu.in", <Globe className="w-4 h-4" />)}
            </div>
            {inp("Street Address", "address", "Building / Street", <MapPin className="w-4 h-4" />)}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {inp("City", "city", "City")}
              {inp("State", "state", "State")}
              {inp("Country", "country", "Country")}
              {inp("Pincode", "pincode", "Pincode")}
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={savingProfile}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/25">
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {savingProfile ? "Saving…" : "Save Profile"}
              </button>
            </div>
          </form>
        </Section>

        {/* Change Password */}
        <Section title="Change Password" icon={<Lock className="w-5 h-5" />}>
          <form onSubmit={handlePwdSave} className="space-y-4">
            {pwdMsg && (pwdMsg.type === "success"
              ? <SuccessAlert message={pwdMsg.text} />
              : <ErrorAlert message={pwdMsg.text} />)}
            {(["currentPassword", "newPassword", "confirmPassword"] as const).map((key) => {
              const labels: Record<typeof key, string> = { currentPassword: "Current Password", newPassword: "New Password (min. 8 chars)", confirmPassword: "Confirm New Password" };
              const isVisible = key === "currentPassword" ? showCur : showNew;
              const toggle = key === "currentPassword" ? () => setShowCur(!showCur) : () => setShowNew(!showNew);
              return (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">{labels[key]}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={isVisible ? "text" : "password"}
                      value={pwd[key]}
                      onChange={(e) => setPwd((p) => ({ ...p, [key]: e.target.value }))}
                      required
                      className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg pl-10 pr-10 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                    />
                    {key !== "confirmPassword" && (
                      <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                        {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={savingPwd}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/25">
                {savingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {savingPwd ? "Updating…" : "Update Password"}
              </button>
            </div>
          </form>
        </Section>

        {/* Danger Zone */}
        <div className="bg-[#111827]/80 border border-red-500/20 rounded-2xl p-6 backdrop-blur-sm mb-8">
          <h2 className="text-base font-semibold text-red-400 mb-2">Danger Zone</h2>
          <p className="text-slate-400 text-sm mb-4">These actions are irreversible. Please be certain.</p>
          <button
            type="button"
            onClick={() => alert("Contact support@fluenzy.ai to delete your college account.")}
            className="px-5 py-2.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-sm transition-all"
          >
            Request Account Deletion
          </button>
        </div>
      </div>
    </CollegeProtectedLayout>
  );
}
