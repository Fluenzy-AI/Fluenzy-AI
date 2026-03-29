"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast, Toaster } from "sonner";
import {
  CalendarDays, Copy, Download, FileText, Pencil, Trash2,
  User, Camera, Globe, Github, Linkedin, ExternalLink, Code2,
  Briefcase, GraduationCap, Award, FolderKanban, BookOpen,
  Languages, CreditCard, Upload, Link2, Eye, EyeOff,
  Shield, TrendingUp, Zap, CheckCircle2, Plus, MapPin,
  Star, Activity, Loader2, AlertCircle, Save
} from "lucide-react";
import Link from "next/link";

interface PlanInfo {
  plan: string;
  planName: string;
  price: number;
  currency: string;
  monthlyLimit: number | null;
  isUnlimited: boolean;
  currentUsage: number;
  remainingUses: string | number;
  renewalDate: Date | null;
  subscription: any;
}

interface ProfileData {
  user: { name: string; email: string; image: string | null };
  profile: {
    id: string;
    username: string;
    headline?: string;
    bio?: string;
    socialLinks?: {
      github?: string;
      linkedin?: string;
      portfolio?: string;
      leetcode?: string;
    };
    openToWork: boolean;
    publicProfileEnabled: boolean;
    publicSections: Record<string, boolean>;
  };
  planInfo: PlanInfo;
  sections: {
    skills: any[];
    experiences: any[];
    educations: any[];
    certifications: any[];
    projects: any[];
    courses: any[];
    languages: any[];
  };
  activity: Record<string, number>;
  resumes: Array<{ id: string; fileName: string; fileUrl: string; uploadedAt: string }>;
  payments: any[];
}

type SectionType =
  | "skill"
  | "experience"
  | "education"
  | "certification"
  | "project"
  | "course"
  | "language";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionType | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificateUploading, setCertificateUploading] = useState(false);
  const [certificateError, setCertificateError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);

  // Local form states for controlled forms
  const [basicInfoForm, setBasicInfoForm] = useState({
    name: "",
    username: "",
    headline: "",
    bio: "",
    openToWork: false,
  });
  const [socialLinksForm, setSocialLinksForm] = useState({
    github: "",
    linkedin: "",
    portfolio: "",
    leetcode: "",
  });
  const [publicProfileForm, setPublicProfileForm] = useState({
    publicProfileEnabled: false,
    publicSections: {} as Record<string, boolean>,
  });

  // Saving states
  const [savingBasicInfo, setSavingBasicInfo] = useState(false);
  const [savingSocialLinks, setSavingSocialLinks] = useState(false);
  const [savingPublicProfile, setSavingPublicProfile] = useState(false);

  // Dirty states
  const [basicInfoDirty, setBasicInfoDirty] = useState(false);
  const [socialLinksDirty, setSocialLinksDirty] = useState(false);
  const [publicProfileDirty, setPublicProfileDirty] = useState(false);

  // Navigation guard state
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  // Populate local form states from server data
  useEffect(() => {
    if (profileData) {
      const { user, profile } = profileData;
      setBasicInfoForm({
        name: user.name || "",
        username: profile.username || "",
        headline: profile.headline || "",
        bio: profile.bio || "",
        openToWork: profile.openToWork || false,
      });
      setSocialLinksForm({
        github: profile.socialLinks?.github || "",
        linkedin: profile.socialLinks?.linkedin || "",
        portfolio: profile.socialLinks?.portfolio || "",
        leetcode: profile.socialLinks?.leetcode || "",
      });
      setPublicProfileForm({
        publicProfileEnabled: profile.publicProfileEnabled || false,
        publicSections: profile.publicSections || {},
      });
    }
  }, [profileData]);

  // Track dirty state for Basic Info
  useEffect(() => {
    if (!profileData) return;
    const { user, profile } = profileData;
    const isDirty =
      basicInfoForm.name !== (user.name || "") ||
      basicInfoForm.username !== (profile.username || "") ||
      basicInfoForm.headline !== (profile.headline || "") ||
      basicInfoForm.bio !== (profile.bio || "") ||
      basicInfoForm.openToWork !== (profile.openToWork || false);
    setBasicInfoDirty(isDirty);
  }, [basicInfoForm, profileData]);

  // Track dirty state for Social Links
  useEffect(() => {
    if (!profileData) return;
    const { profile } = profileData;
    const isDirty =
      socialLinksForm.github !== (profile.socialLinks?.github || "") ||
      socialLinksForm.linkedin !== (profile.socialLinks?.linkedin || "") ||
      socialLinksForm.portfolio !== (profile.socialLinks?.portfolio || "") ||
      socialLinksForm.leetcode !== (profile.socialLinks?.leetcode || "");
    setSocialLinksDirty(isDirty);
  }, [socialLinksForm, profileData]);

  // Track dirty state for Public Profile
  useEffect(() => {
    if (!profileData) return;
    const { profile } = profileData;
    const isDirty =
      publicProfileForm.publicProfileEnabled !== (profile.publicProfileEnabled || false) ||
      JSON.stringify(publicProfileForm.publicSections) !== JSON.stringify(profile.publicSections || {});
    setPublicProfileDirty(isDirty);
  }, [publicProfileForm, profileData]);

  // Navigation guard
  useEffect(() => {
    const anyDirty = basicInfoDirty || socialLinksDirty || publicProfileDirty;
    if (!anyDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [basicInfoDirty, socialLinksDirty, publicProfileDirty]);

  // Keyboard shortcut (Ctrl/Cmd + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (basicInfoDirty) {
          handleSaveBasicInfo();
        } else if (socialLinksDirty) {
          handleSaveSocialLinks();
        } else if (publicProfileDirty) {
          handleSavePublicProfile();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [basicInfoDirty, socialLinksDirty, publicProfileDirty, basicInfoForm, socialLinksForm, publicProfileForm]);

  const activityMap = profileData?.activity ?? {};

  const heatmapDays = useMemo(() => {
    const days: { key: string; count: number }[] = [];
    const start = new Date();
    start.setDate(start.getDate() - 140);
    for (let i = 0; i <= 140; i += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const key = date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      days.push({ key, count: activityMap[key] || 0 });
    }
    return days;
  }, [activityMap]);

  if (status === "loading" || loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!session?.user) {
    return null;
  }

  if (!profileData) {
    return <div className="container mx-auto px-4 py-8">Loading profile information...</div>;
  }

  const { user, profile, planInfo, sections, activity, payments, resumes } = profileData;

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const normalizedBaseUrl = appBaseUrl.replace(/\/+$/, "");
  const publicProfileUrl = normalizedBaseUrl
    ? `${normalizedBaseUrl}/u/${profile.username}`
    : `/u/${profile.username}`;

  const uploadResume = async (replaceExisting = false) => {
    if (!resumeFile) return;
    setResumeUploading(true);
    setResumeError(null);

    try {
      const body = new FormData();
      body.append("file", resumeFile);
      body.append("replace", replaceExisting ? "true" : "false");

      const res = await fetch("/api/profile/resume", {
        method: "POST",
        body,
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        setResumeError(error?.error || "Failed to upload resume");
      } else {
        setResumeFile(null);
        const refreshed = await fetch("/api/profile");
        if (refreshed.ok) {
          setProfileData(await refreshed.json());
        }
      }
    } catch (error) {
      console.error("Resume upload error:", error);
      setResumeError("Failed to upload resume");
    } finally {
      setResumeUploading(false);
    }
  };

  const openDialog = (type: SectionType, item: any = null) => {
    const prefilled = item ? { ...item } : {};
    if (type === "certification" && item?.skills?.length) {
      prefilled.skillsText = item.skills.join(", ");
    }
    if (type !== "certification") {
      setCertificateFile(null);
      setCertificateUploading(false);
      setCertificateError(null);
    }
    setActiveSection(type);
    setEditingItem(item);
    setFormData(prefilled);
    setDialogOpen(true);
  };

  const uploadCertificateImage = async () => {
    if (!certificateFile) return;
    setCertificateUploading(true);
    setCertificateError(null);

    try {
      const body = new FormData();
      body.append("file", certificateFile);

      const res = await fetch("/api/profile/certifications/upload", {
        method: "POST",
        body,
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        setCertificateError(error?.error || "Failed to upload certificate image");
      } else {
        const payload = await res.json();
        setFormData((prev) => ({ ...prev, imageUrl: payload.imageUrl }));
      }
    } catch (error) {
      console.error("Certificate image upload error:", error);
      setCertificateError("Failed to upload certificate image");
    } finally {
      setCertificateUploading(false);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return;
    setAvatarUploading(true);
    setAvatarError(null);

    try {
      const body = new FormData();
      body.append("file", avatarFile);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body,
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        setAvatarError(error?.error || "Failed to upload profile image");
      } else {
        const payload = await res.json();
        setProfileData((prev) =>
          prev
            ? {
                ...prev,
                user: {
                  ...prev.user,
                  image: payload.imageUrl,
                },
              }
            : prev
        );
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      setAvatarError("Failed to upload profile image");
    } finally {
      setAvatarUploading(false);
    }
  };

  const saveSection = async () => {
    if (!activeSection) return;
    const method = editingItem ? "PUT" : "POST";
    const payloadData = { ...formData };

    if (activeSection === "certification") {
      const raw = (formData.skillsText || "") as string;
      payloadData.skills = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (activeSection === "skill" && !payloadData.level) {
      payloadData.level = "Beginner";
    }

    const payload = {
      type: activeSection,
      id: editingItem?.id,
      data: payloadData,
    };

    const res = await fetch("/api/profile/sections", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const refreshed = await fetch("/api/profile");
      if (refreshed.ok) {
        setProfileData(await refreshed.json());
      }
      setDialogOpen(false);
    }
  };

  const deleteSection = async (type: SectionType, id: string) => {
    await fetch("/api/profile/sections", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id }),
    });
    const refreshed = await fetch("/api/profile");
    if (refreshed.ok) {
      setProfileData(await refreshed.json());
    }
  };

  const updateProfile = async (
    updates: Partial<ProfileData["profile"]> & { name?: string; image?: string | null }
  ) => {
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: updates.username ?? profile.username,
          headline: updates.headline ?? profile.headline,
          bio: updates.bio ?? profile.bio,
          socialLinks: updates.socialLinks ?? profile.socialLinks,
          openToWork: updates.openToWork ?? profile.openToWork,
          publicProfileEnabled: updates.publicProfileEnabled ?? profile.publicProfileEnabled,
          publicSections: updates.publicSections ?? profile.publicSections,
          name: updates.name ?? user.name,
          image: updates.image ?? user.image,
        }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        if (updates.username) {
          setUsernameError(payload?.error || "Username not available");
          setUsernameSuggestions(payload?.suggestions || []);
        }
        return;
      }
      if (res.ok) {
        if (updates.username) {
          setUsernameError(null);
          setUsernameSuggestions([]);
        }
        const refreshed = await fetch("/api/profile");
        if (refreshed.ok) {
          setProfileData(await refreshed.json());
        }
      }
    } catch (error) {
      console.error("Profile update error:", error);
    }
  };

  // Save handlers for controlled forms
  const handleSaveBasicInfo = async () => {
    if (!profileData) return;
    setSavingBasicInfo(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: basicInfoForm.username,
          headline: basicInfoForm.headline,
          bio: basicInfoForm.bio,
          openToWork: basicInfoForm.openToWork,
          name: basicInfoForm.name,
          // Preserve other fields
          socialLinks: profileData.profile.socialLinks,
          publicProfileEnabled: profileData.profile.publicProfileEnabled,
          publicSections: profileData.profile.publicSections,
          image: profileData.user.image,
        }),
      });
      
      const payload = await res.json().catch(() => null);
      
      if (!res.ok) {
        if (basicInfoForm.username !== profileData.profile.username) {
          setUsernameError(payload?.error || "Username not available");
          setUsernameSuggestions(payload?.suggestions || []);
        }
        toast.error("Failed to save. Please try again.");
        console.error("Save error:", payload);
        return;
      }
      
      // Clear username errors on success
      setUsernameError(null);
      setUsernameSuggestions([]);
      
      // Refresh profile data
      const refreshed = await fetch("/api/profile");
      if (refreshed.ok) {
        const updatedData = await refreshed.json();
        setProfileData(updatedData);
        toast.success("Profile updated successfully ✓");
      }
    } catch (error) {
      console.error("Save basic info error:", error);
      toast.error("Failed to save. Please try again.");
    } finally {
      setSavingBasicInfo(false);
    }
  };

  const handleSaveSocialLinks = async () => {
    if (!profileData) return;
    setSavingSocialLinks(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socialLinks: socialLinksForm,
          // Preserve other fields
          username: profileData.profile.username,
          headline: profileData.profile.headline,
          bio: profileData.profile.bio,
          openToWork: profileData.profile.openToWork,
          publicProfileEnabled: profileData.profile.publicProfileEnabled,
          publicSections: profileData.profile.publicSections,
          name: profileData.user.name,
          image: profileData.user.image,
        }),
      });
      
      if (!res.ok) {
        toast.error("Failed to save. Please try again.");
        return;
      }
      
      // Refresh profile data
      const refreshed = await fetch("/api/profile");
      if (refreshed.ok) {
        const updatedData = await refreshed.json();
        setProfileData(updatedData);
        toast.success("Social links updated successfully ✓");
      }
    } catch (error) {
      console.error("Save social links error:", error);
      toast.error("Failed to save. Please try again.");
    } finally {
      setSavingSocialLinks(false);
    }
  };

  const handleSavePublicProfile = async () => {
    if (!profileData) return;
    setSavingPublicProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicProfileEnabled: publicProfileForm.publicProfileEnabled,
          publicSections: publicProfileForm.publicSections,
          // Preserve other fields
          username: profileData.profile.username,
          headline: profileData.profile.headline,
          bio: profileData.profile.bio,
          socialLinks: profileData.profile.socialLinks,
          openToWork: profileData.profile.openToWork,
          name: profileData.user.name,
          image: profileData.user.image,
        }),
      });
      
      if (!res.ok) {
        toast.error("Failed to save. Please try again.");
        return;
      }
      
      // Refresh profile data
      const refreshed = await fetch("/api/profile");
      if (refreshed.ok) {
        const updatedData = await refreshed.json();
        setProfileData(updatedData);
        toast.success("Public profile settings updated successfully ✓");
      }
    } catch (error) {
      console.error("Save public profile error:", error);
      toast.error("Failed to save. Please try again.");
    } finally {
      setSavingPublicProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-6xl space-y-8">

        {/* ─── Hero Profile Card ─── */}
        <Card className="relative overflow-hidden border-slate-700/50 bg-slate-900/60">
          {/* Gradient banner */}
          <div className="h-32 sm:h-40 bg-gradient-to-r from-purple-600/40 via-blue-600/40 to-pink-600/40 relative">
            <div className="absolute inset-0 bg-[url('/image/grid-pattern.svg')] opacity-10" />
            {profile.openToWork && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-emerald-500/90 text-white border-0 shadow-lg shadow-emerald-500/20 gap-1.5 px-3 py-1">
                  <CheckCircle2 className="h-3 w-3" /> Open to Work
                </Badge>
              </div>
            )}
          </div>
          <CardContent className="px-6 sm:px-8 pb-8 -mt-14 relative">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-28 h-28 rounded-2xl border-4 border-slate-900 overflow-hidden bg-slate-800 shadow-xl">
                  {user.image ? (
                    <img src={user.image} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-3xl font-black text-white">
                      {user.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <label className="absolute bottom-1.5 right-1.5 w-8 h-8 rounded-lg bg-slate-800/90 border border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors group-hover:scale-110">
                  <Camera className="h-3.5 w-3.5 text-slate-300" />
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAvatarFile(file);
                        // Auto-upload
                        const doUpload = async () => {
                          setAvatarUploading(true);
                          setAvatarError(null);
                          try {
                            const body = new FormData();
                            body.append("file", file);
                            const res = await fetch("/api/profile/avatar", { method: "POST", body });
                            if (!res.ok) { const err = await res.json().catch(() => null); setAvatarError(err?.error || "Failed to upload"); }
                            else {
                              const payload = await res.json();
                              setProfileData((prev) => prev ? { ...prev, user: { ...prev.user, image: payload.imageUrl } } : prev);
                            }
                          } catch { setAvatarError("Failed to upload profile image"); }
                          finally { setAvatarUploading(false); }
                        };
                        doUpload();
                      }
                    }}
                  />
                </label>
                {avatarUploading && (
                  <div className="absolute inset-0 rounded-2xl bg-slate-900/70 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {avatarError && <p className="text-xs text-red-400">{avatarError}</p>}

              {/* Name + Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{user.name}</h1>
                {profile.headline && (
                  <p className="text-sm text-slate-400 mt-0.5">{profile.headline}</p>
                )}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="text-sm text-slate-400">{user.email}</span>
                  <Badge variant="secondary" className="gap-1 text-[10px] font-bold uppercase tracking-wider">
                    <Zap className="h-3 w-3" /> {planInfo.planName}
                  </Badge>
                  {planInfo.price > 0 && (
                    <span className="text-xs text-slate-500">₹{planInfo.price}/month</span>
                  )}
                </div>
              </div>

              {/* Plan stats (right side on desktop) */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Usage</p>
                    <p className="font-semibold text-white">{planInfo.currentUsage} / {planInfo.isUnlimited ? "∞" : planInfo.monthlyLimit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Renewal</p>
                    <p className="font-semibold text-white">{planInfo.renewalDate ? new Date(planInfo.renewalDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A"}</p>
                  </div>
                </div>
                {/* Progress bar */}
                {!planInfo.isUnlimited && planInfo.monthlyLimit && (
                  <div className="w-40 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (planInfo.currentUsage / planInfo.monthlyLimit) * 100)}%` }}
                    />
                  </div>
                )}
                <div className="flex gap-2 mt-1">
                  <Button size="sm" className="gap-1.5 h-8 text-xs" asChild>
                    <Link href="/billing"><CreditCard className="h-3 w-3" /> Billing</Link>
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" asChild>
                    <Link href={publicProfileUrl} target="_blank"><Globe className="h-3 w-3" /> Public Profile</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Two-Column: Basic Info + Settings ─── */}
        <div className="grid lg:grid-cols-5 gap-6">

          {/* Left: Profile Details (3 cols) */}
          <div className="lg:col-span-3 space-y-6">

            {/* Basic Info Card */}
            <Card className="border-slate-700/50 bg-slate-900/60">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2 justify-between">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-400" /> Basic Information
                  </span>
                  {basicInfoDirty && (
                    <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30 gap-1.5">
                      <AlertCircle className="h-3 w-3" />
                      Unsaved changes
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Full Name</label>
                    <Input
                      value={basicInfoForm.name}
                      onChange={(e) => setBasicInfoForm({ ...basicInfoForm, name: e.target.value })}
                      className="bg-slate-800/50 border-slate-700/50 h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Username</label>
                    <Input
                      value={basicInfoForm.username}
                      onChange={(e) => setBasicInfoForm({ ...basicInfoForm, username: e.target.value })}
                      className="bg-slate-800/50 border-slate-700/50 h-9"
                    />
                    {usernameError && <p className="text-xs text-red-400">{usernameError}</p>}
                    {usernameSuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {usernameSuggestions.map((s) => (
                          <Button 
                            key={s} 
                            size="sm" 
                            variant="outline" 
                            className="h-6 text-[10px] px-2" 
                            onClick={() => setBasicInfoForm({ ...basicInfoForm, username: s })}
                          >
                            {s}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Headline</label>
                  <Input
                    placeholder="e.g. Full-Stack Developer | AI Enthusiast"
                    value={basicInfoForm.headline}
                    onChange={(e) => setBasicInfoForm({ ...basicInfoForm, headline: e.target.value })}
                    className="bg-slate-800/50 border-slate-700/50 h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">About</label>
                  <Textarea
                    placeholder="Write a short bio about yourself..."
                    value={basicInfoForm.bio}
                    onChange={(e) => setBasicInfoForm({ ...basicInfoForm, bio: e.target.value })}
                    className="bg-slate-800/50 border-slate-700/50 min-h-[80px] resize-y"
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-emerald-500/5 border border-emerald-500/10 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-medium text-slate-200">Open to Work</span>
                  </div>
                  <Switch
                    checked={basicInfoForm.openToWork}
                    onCheckedChange={(checked) => setBasicInfoForm({ ...basicInfoForm, openToWork: checked })}
                  />
                </div>
                {basicInfoDirty && (
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleSaveBasicInfo}
                      disabled={savingBasicInfo}
                      className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                    >
                      {savingBasicInfo ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Social Links Card */}
            <Card className="border-slate-700/50 bg-slate-900/60">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2 justify-between">
                  <span className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-blue-400" /> Social Links
                  </span>
                  {socialLinksDirty && (
                    <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30 gap-1.5">
                      <AlertCircle className="h-3 w-3" />
                      Unsaved changes
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { key: "github", icon: Github, label: "GitHub", placeholder: "https://github.com/username", color: "text-slate-300" },
                    { key: "linkedin", icon: Linkedin, label: "LinkedIn", placeholder: "https://linkedin.com/in/username", color: "text-blue-400" },
                    { key: "portfolio", icon: Globe, label: "Portfolio", placeholder: "https://yoursite.com", color: "text-emerald-400" },
                    { key: "leetcode", icon: Code2, label: "LeetCode", placeholder: "https://leetcode.com/username", color: "text-amber-400" },
                  ].map((link) => (
                    <div key={link.key} className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                        <link.icon className={`h-3 w-3 ${link.color}`} /> {link.label}
                      </label>
                      <Input
                        placeholder={link.placeholder}
                        value={(socialLinksForm as any)[link.key] || ""}
                        onChange={(e) =>
                          setSocialLinksForm({ ...socialLinksForm, [link.key]: e.target.value })
                        }
                        className="bg-slate-800/50 border-slate-700/50 h-9 text-sm"
                      />
                    </div>
                  ))}
                </div>
                {socialLinksDirty && (
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleSaveSocialLinks}
                      disabled={savingSocialLinks}
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                      {savingSocialLinks ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Public Profile URL Card */}
            <Card className="border-slate-700/50 bg-slate-900/60">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2 justify-between">
                  <span className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-cyan-400" /> Public Profile
                  </span>
                  {publicProfileDirty && (
                    <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30 gap-1.5">
                      <AlertCircle className="h-3 w-3" />
                      Unsaved changes
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input value={publicProfileUrl} readOnly className="bg-slate-800/50 border-slate-700/50 h-9 text-sm font-mono" />
                  <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => navigator.clipboard.writeText(publicProfileUrl)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" asChild>
                    <a href={publicProfileUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
                  </Button>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-800/30 px-4 py-3">
                  <div className="flex items-center gap-2">
                    {publicProfileForm.publicProfileEnabled ? <Eye className="h-4 w-4 text-blue-400" /> : <EyeOff className="h-4 w-4 text-slate-500" />}
                    <span className="text-sm font-medium text-slate-200">Profile Visible to Public</span>
                  </div>
                  <Switch
                    checked={publicProfileForm.publicProfileEnabled}
                    onCheckedChange={(checked) => setPublicProfileForm({ ...publicProfileForm, publicProfileEnabled: checked })}
                  />
                </div>
                {publicProfileForm.publicProfileEnabled && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Visible Sections</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { key: "skills", label: "Skills", icon: Star },
                        { key: "experience", label: "Experience", icon: Briefcase },
                        { key: "education", label: "Education", icon: GraduationCap },
                        { key: "certifications", label: "Certs", icon: Award },
                        { key: "projects", label: "Projects", icon: FolderKanban },
                        { key: "courses", label: "Courses", icon: BookOpen },
                        { key: "languages", label: "Languages", icon: Languages },
                        { key: "analyticsReport", label: "Analytics", icon: Activity },
                      ].map((item) => (
                        <label key={item.key} className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors text-xs ${
                          publicProfileForm.publicSections?.[item.key]
                            ? 'border-purple-500/30 bg-purple-500/5 text-slate-200'
                            : 'border-slate-700/50 bg-slate-800/30 text-slate-400'
                        }`}>
                          <Checkbox
                            checked={Boolean(publicProfileForm.publicSections?.[item.key])}
                            onCheckedChange={(checked) =>
                              setPublicProfileForm({ 
                                ...publicProfileForm, 
                                publicSections: { ...publicProfileForm.publicSections, [item.key]: Boolean(checked) } 
                              })
                            }
                            className="h-3.5 w-3.5"
                          />
                          <item.icon className="h-3 w-3" />
                          {item.label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {publicProfileDirty && (
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleSavePublicProfile}
                      disabled={savingPublicProfile}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2"
                    >
                      {savingPublicProfile ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Activity + Quick Stats (2 cols) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Practice Activity Heatmap */}
            <Card className="border-slate-700/50 bg-slate-900/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" /> Practice Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-[repeat(20,1fr)] gap-[3px]">
                  {heatmapDays.map((day) => (
                    <div
                      key={day.key}
                      title={`${day.count} session${day.count !== 1 ? 's' : ''} on ${day.key}`}
                      className={`aspect-square rounded-[2px] transition-colors ${
                        day.count === 0
                          ? "bg-slate-800/80"
                          : day.count < 2
                          ? "bg-emerald-700/70"
                          : day.count < 4
                          ? "bg-emerald-500/80"
                          : "bg-emerald-400"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-slate-500">
                  <span>Less</span>
                  <div className="w-2.5 h-2.5 rounded-[2px] bg-slate-800/80" />
                  <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-700/70" />
                  <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500/80" />
                  <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400" />
                  <span>More</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Skills", count: sections.skills.length, icon: Star, color: "text-amber-400", bg: "bg-amber-500/10" },
                { label: "Projects", count: sections.projects.length, icon: FolderKanban, color: "text-blue-400", bg: "bg-blue-500/10" },
                { label: "Certifications", count: sections.certifications.length, icon: Award, color: "text-purple-400", bg: "bg-purple-500/10" },
                { label: "Resumes", count: resumes?.length || 0, icon: FileText, color: "text-emerald-400", bg: "bg-emerald-500/10" },
              ].map((stat) => (
                <Card key={stat.label} className="border-slate-700/50 bg-slate-900/60">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">{stat.count}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Resume Card */}
            <Card className="border-slate-700/50 bg-slate-900/60">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-rose-400" /> Resume
                </CardTitle>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
                  <a href="/api/resume-pdf" target="_blank" rel="noreferrer">
                    <Download className="h-3 w-3" /> Generate
                  </a>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    className="h-9 text-sm bg-slate-800/50 border-slate-700/50"
                  />
                  {resumes?.length > 0 ? (
                    <Button 
                      size="sm" 
                      className="h-9 gap-1 shrink-0 bg-amber-500/90 hover:bg-amber-500 text-slate-950" 
                      onClick={() => uploadResume(true)} 
                      disabled={!resumeFile || resumeUploading}
                      title="Replace existing resume(s) with new one"
                    >
                      <Upload className="h-3 w-3" /> {resumeUploading ? "..." : "Replace"}
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      className="h-9 gap-1 shrink-0" 
                      onClick={() => uploadResume(false)} 
                      disabled={!resumeFile || resumeUploading}
                    >
                      <Upload className="h-3 w-3" /> {resumeUploading ? "..." : "Upload"}
                    </Button>
                  )}
                </div>
                {resumeError && <p className="text-xs text-red-400">{resumeError}</p>}
                {resumes?.length ? (
                  <div className="space-y-2">
                    {resumes.map((resume) => (
                      <div key={resume.id} className="flex items-center justify-between rounded-lg bg-slate-800/40 border border-slate-700/30 p-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-slate-200 truncate">{resume.fileName}</p>
                            <p className="text-[10px] text-slate-500">{new Date(resume.uploadedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                          <a href={resume.fileUrl} target="_blank" rel="noreferrer"><Download className="h-3.5 w-3.5" /></a>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-2">PDF only, max 5MB</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ─── Sections Grid ─── */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Skills */}
          <Card className="border-slate-700/50 bg-slate-900/60">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-400" /> Skills
              </CardTitle>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openDialog("skill")}>
                <Plus className="h-3 w-3" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              {sections.skills.length ? (
                <div className="flex flex-wrap gap-2">
                  {sections.skills.map((skill) => (
                    <span key={skill.id} className="group/skill flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-slate-700/30">
                      {skill.name}
                      {skill.level && <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 ml-1">{skill.level}</Badge>}
                      <div className="hidden group-hover/skill:flex items-center gap-0.5 ml-1">
                        <button onClick={() => openDialog("skill", skill)} className="hover:text-purple-400 transition-colors"><Pencil className="h-2.5 w-2.5" /></button>
                        <button onClick={() => deleteSection("skill", skill.id)} className="hover:text-red-400 transition-colors"><Trash2 className="h-2.5 w-2.5" /></button>
                      </div>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">Add your skills to showcase your expertise</p>
              )}
            </CardContent>
          </Card>

          {/* Experience */}
          <Card className="border-slate-700/50 bg-slate-900/60">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-400" /> Experience
              </CardTitle>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openDialog("experience")}>
                <Plus className="h-3 w-3" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              {sections.experiences.length ? (
                <div className="space-y-3">
                  {sections.experiences.map((exp) => (
                    <div key={exp.id} className="rounded-xl bg-slate-800/40 border border-slate-700/30 p-4 group/exp">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Briefcase className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100">{exp.role}</p>
                            <p className="text-sm text-slate-400">{exp.company}</p>
                            <p className="text-xs text-slate-500 mt-1">{new Date(exp.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })} — {exp.endDate ? new Date(exp.endDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Present"}</p>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover/exp:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDialog("experience", exp)}><Pencil className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteSection("experience", exp.id)}><Trash2 className="h-3 w-3 text-red-400" /></Button>
                        </div>
                      </div>
                      {exp.description && <p className="text-sm text-slate-300 mt-2 ml-[52px] leading-relaxed">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">Add your work experience</p>
              )}
            </CardContent>
          </Card>

          {/* Education */}
          <Card className="border-slate-700/50 bg-slate-900/60">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-emerald-400" /> Education
              </CardTitle>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openDialog("education")}>
                <Plus className="h-3 w-3" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              {sections.educations.length ? (
                <div className="space-y-3">
                  {sections.educations.map((edu) => (
                    <div key={edu.id} className="rounded-xl bg-slate-800/40 border border-slate-700/30 p-4 group/edu">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                            <GraduationCap className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100">{edu.degree}</p>
                            <p className="text-sm text-slate-400">{edu.institution}</p>
                            <p className="text-xs text-slate-500 mt-1">{edu.startYear} — {edu.endYear || "Present"} {edu.grade ? <span className="text-emerald-400/80">• {edu.grade}</span> : ""}</p>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover/edu:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDialog("education", edu)}><Pencil className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteSection("education", edu.id)}><Trash2 className="h-3 w-3 text-red-400" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">Add your education history</p>
              )}
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card className="border-slate-700/50 bg-slate-900/60">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-purple-400" /> Certifications
              </CardTitle>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openDialog("certification")}>
                <Plus className="h-3 w-3" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              {sections.certifications.length ? (
                <div className="space-y-3">
                  {sections.certifications.map((cert) => (
                    <div key={cert.id} className="rounded-xl bg-slate-800/40 border border-slate-700/30 p-4 group/cert">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {cert.imageUrl ? (
                            /\.pdf($|\?)/i.test(cert.imageUrl) ? (
                              <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700/50 shrink-0">
                                <FileText className="h-5 w-5 text-slate-400" />
                              </div>
                            ) : (
                              <img src={cert.imageUrl} alt={cert.name} className="h-12 w-12 rounded-xl object-cover border border-slate-700/50 shrink-0" />
                            )
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                              <Award className="h-5 w-5 text-purple-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-100">{cert.name}</p>
                            <p className="text-sm text-slate-400">{cert.issuer || "—"}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              {cert.issueDate && <span>{new Date(cert.issueDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>}
                              {cert.credentialId && <span>ID: {cert.credentialId}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover/cert:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDialog("certification", cert)}><Pencil className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteSection("certification", cert.id)}><Trash2 className="h-3 w-3 text-red-400" /></Button>
                        </div>
                      </div>
                      <div className="mt-3 ml-[60px] flex flex-wrap gap-1.5">
                        {cert.skills?.length ? (
                          cert.skills.map((skill: string) => (
                            <Badge key={skill} variant="secondary" className="text-[10px]">{skill}</Badge>
                          ))
                        ) : null}
                        {cert.credentialUrl && (
                          <Button variant="outline" size="sm" className="h-5 text-[10px] px-2 gap-0.5" asChild>
                            <a href={cert.credentialUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-2.5 w-2.5" /> Verify</a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">Add your certifications</p>
              )}
            </CardContent>
          </Card>

          {/* Projects */}
          <Card className="border-slate-700/50 bg-slate-900/60">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-cyan-400" /> Projects
              </CardTitle>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openDialog("project")}>
                <Plus className="h-3 w-3" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              {sections.projects.length ? (
                <div className="space-y-3">
                  {sections.projects.map((project) => (
                    <div key={project.id} className="rounded-xl bg-slate-800/40 border border-slate-700/30 p-4 group/proj">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-100">{project.title}</p>
                          {project.techStack && <p className="text-xs text-slate-500 mt-0.5 font-mono">{project.techStack}</p>}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover/proj:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDialog("project", project)}><Pencil className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteSection("project", project.id)}><Trash2 className="h-3 w-3 text-red-400" /></Button>
                        </div>
                      </div>
                      {project.description && <p className="text-sm text-slate-300 mt-2 leading-relaxed">{project.description}</p>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {project.projectUrl && (
                          <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" asChild>
                            <a href={project.projectUrl} target="_blank" rel="noreferrer"><Globe className="h-2.5 w-2.5" /> Live Demo</a>
                          </Button>
                        )}
                        {project.repoUrl && (
                          <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" asChild>
                            <a href={project.repoUrl} target="_blank" rel="noreferrer"><Github className="h-2.5 w-2.5" /> GitHub</a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">Showcase your projects</p>
              )}
            </CardContent>
          </Card>

          {/* Courses */}
          <Card className="border-slate-700/50 bg-slate-900/60">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-orange-400" /> Courses
              </CardTitle>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openDialog("course")}>
                <Plus className="h-3 w-3" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              {sections.courses.length ? (
                <div className="space-y-2">
                  {sections.courses.map((course) => (
                    <div key={course.id} className="flex items-center justify-between rounded-xl bg-slate-800/40 border border-slate-700/30 p-3 group/course">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                          <BookOpen className="h-4 w-4 text-orange-400" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-100">{course.name}</p>
                          <p className="text-xs text-slate-500">{course.platform} • <span className={course.status === 'Completed' ? 'text-emerald-400' : 'text-amber-400'}>{course.status}</span></p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover/course:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDialog("course", course)}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteSection("course", course.id)}><Trash2 className="h-3 w-3 text-red-400" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">Track your learning journey</p>
              )}
            </CardContent>
          </Card>

          {/* Languages */}
          <Card className="border-slate-700/50 bg-slate-900/60">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Languages className="h-4 w-4 text-teal-400" /> Languages
              </CardTitle>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openDialog("language")}>
                <Plus className="h-3 w-3" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              {sections.languages.length ? (
                <div className="flex flex-wrap gap-2">
                  {sections.languages.map((lang) => (
                    <span key={lang.id} className="group/lang flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-slate-700/30">
                      {lang.name}
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">{lang.proficiency}</Badge>
                      <div className="hidden group-hover/lang:flex items-center gap-0.5 ml-1">
                        <button onClick={() => openDialog("language", lang)} className="hover:text-purple-400 transition-colors"><Pencil className="h-2.5 w-2.5" /></button>
                        <button onClick={() => deleteSection("language", lang.id)} className="hover:text-red-400 transition-colors"><Trash2 className="h-2.5 w-2.5" /></button>
                      </div>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">Add languages you speak</p>
              )}
            </CardContent>
          </Card>

          {/* Billing & Payments */}
          <Card className="border-slate-700/50 bg-slate-900/60">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-pink-400" /> Billing & Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length ? (
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div key={payment.id} className="rounded-xl bg-slate-800/40 border border-slate-700/30 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-slate-100">{payment.plan || "Plan"}</p>
                          <Badge variant="secondary" className="text-[10px]">₹{payment.amount}</Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{new Date(payment.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                        {payment.couponUsed && <p className="text-[10px] text-emerald-400 mt-0.5">Coupon: {payment.couponUsed}</p>}
                      </div>
                      {payment.receiptUrl && (
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1 shrink-0" asChild>
                          <a href={payment.receiptUrl} target="_blank" rel="noreferrer"><Download className="h-3 w-3" /> Invoice</a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No billing history yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-700/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {activeSection === "skill" && <Star className="h-4 w-4 text-amber-400" />}
              {activeSection === "experience" && <Briefcase className="h-4 w-4 text-blue-400" />}
              {activeSection === "education" && <GraduationCap className="h-4 w-4 text-emerald-400" />}
              {activeSection === "certification" && <Award className="h-4 w-4 text-purple-400" />}
              {activeSection === "project" && <FolderKanban className="h-4 w-4 text-cyan-400" />}
              {activeSection === "course" && <BookOpen className="h-4 w-4 text-orange-400" />}
              {activeSection === "language" && <Languages className="h-4 w-4 text-teal-400" />}
              {editingItem ? "Edit" : "Add"} {activeSection && activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
            </DialogTitle>
            <DialogDescription>Fill in the details below.</DialogDescription>
          </DialogHeader>
          {activeSection === "skill" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Skill Name</label>
                <Input
                  placeholder="e.g. React, Python, Figma..."
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-800/50 border-slate-700/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Level</label>
                <Select value={formData.level || "Beginner"} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700/50"><SelectValue placeholder="Level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                    <SelectItem value="Expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {activeSection === "experience" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Role</label>
                <Input placeholder="e.g. Software Engineer" value={formData.role || ""} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="bg-slate-800/50 border-slate-700/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Company</label>
                <Input placeholder="e.g. Google" value={formData.company || ""} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="bg-slate-800/50 border-slate-700/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Start Date</label>
                  <Input type="date" value={formData.startDate ? formData.startDate.slice(0, 10) : ""} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="bg-slate-800/50 border-slate-700/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">End Date</label>
                  <Input type="date" value={formData.endDate ? formData.endDate.slice(0, 10) : ""} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="bg-slate-800/50 border-slate-700/50" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Description</label>
                <Textarea placeholder="Describe your role and achievements..." value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-slate-800/50 border-slate-700/50" />
              </div>
            </div>
          )}

          {activeSection === "education" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Degree</label>
                <Input placeholder="e.g. B.Tech in Computer Science" value={formData.degree || ""} onChange={(e) => setFormData({ ...formData, degree: e.target.value })} className="bg-slate-800/50 border-slate-700/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Institution</label>
                <Input placeholder="e.g. IIT Delhi" value={formData.institution || ""} onChange={(e) => setFormData({ ...formData, institution: e.target.value })} className="bg-slate-800/50 border-slate-700/50" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Start Year</label>
                  <Input placeholder="2020" value={formData.startYear || ""} onChange={(e) => setFormData({ ...formData, startYear: e.target.value })} className="bg-slate-800/50 border-slate-700/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">End Year</label>
                  <Input placeholder="2024" value={formData.endYear || ""} onChange={(e) => setFormData({ ...formData, endYear: e.target.value })} className="bg-slate-800/50 border-slate-700/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Grade / CGPA</label>
                  <Input placeholder="8.5" value={formData.grade || ""} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} className="bg-slate-800/50 border-slate-700/50" />
                </div>
              </div>
            </div>
          )}

          {activeSection === "certification" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Certificate Name</label>
                  <Input placeholder="e.g. AWS Solutions Architect" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-slate-800/50 border-slate-700/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Issuer</label>
                  <Input placeholder="e.g. Amazon" value={formData.issuer || ""} onChange={(e) => setFormData({ ...formData, issuer: e.target.value })} className="bg-slate-800/50 border-slate-700/50" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Issue Date</label>
                <Input type="date" value={formData.issueDate ? formData.issueDate.slice(0, 10) : ""} onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })} className="bg-slate-800/50 border-slate-700/50" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Certificate PDF</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                    className="bg-slate-800/50 border-slate-700/50"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 gap-1"
                    onClick={uploadCertificateImage}
                    disabled={!certificateFile || certificateUploading}
                  >
                    <Upload className="h-3 w-3" /> {certificateUploading ? "..." : "Upload"}
                  </Button>
                </div>
                {certificateError && <p className="text-xs text-red-400">{certificateError}</p>}
                {formData.imageUrl && (
                  <div className="flex items-center gap-3">
                    {/\.pdf($|\?)/i.test(formData.imageUrl) ? (
                      <div className="h-16 w-24 rounded-md bg-slate-800 flex items-center justify-center border border-slate-800">
                        <FileText className="h-6 w-6 text-slate-300" />
                      </div>
                    ) : (
                      <img src={formData.imageUrl} alt="Certificate preview" className="h-16 w-24 rounded-md object-cover border border-slate-800" />
                    )}
                    <p className="text-xs text-slate-400">File uploaded</p>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Credential URL</label>
                <Input placeholder="https://..." value={formData.credentialUrl || ""} onChange={(e) => setFormData({ ...formData, credentialUrl: e.target.value })} className="bg-slate-800/50 border-slate-700/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Skills (comma separated)</label>
                <Input
                  placeholder="e.g. AWS, Cloud, DevOps"
                  value={formData.skillsText || ""}
                  onChange={(e) => setFormData({ ...formData, skillsText: e.target.value })}
                  className="bg-slate-800/50 border-slate-700/50"
                />
              </div>
            </div>
          )}

          {activeSection === "project" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Project Title</label>
                <Input placeholder="e.g. AI Chat Application" value={formData.title || ""} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="bg-slate-800/50 border-slate-700/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tech Stack</label>
                <Input placeholder="e.g. React, Node.js, MongoDB" value={formData.techStack || ""} onChange={(e) => setFormData({ ...formData, techStack: e.target.value })} className="bg-slate-800/50 border-slate-700/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Description</label>
                <Textarea placeholder="What does this project do?" value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-slate-800/50 border-slate-700/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">GitHub URL</label>
                  <Input placeholder="https://github.com/..." value={formData.repoUrl || ""} onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })} className="bg-slate-800/50 border-slate-700/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Live URL</label>
                  <Input placeholder="https://..." value={formData.projectUrl || ""} onChange={(e) => setFormData({ ...formData, projectUrl: e.target.value })} className="bg-slate-800/50 border-slate-700/50" />
                </div>
              </div>
            </div>
          )}

          {activeSection === "course" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Course Name</label>
                <Input placeholder="e.g. Machine Learning Specialization" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-slate-800/50 border-slate-700/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Platform</label>
                  <Input placeholder="e.g. Coursera, Udemy" value={formData.platform || ""} onChange={(e) => setFormData({ ...formData, platform: e.target.value })} className="bg-slate-800/50 border-slate-700/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Status</label>
                  <Select value={formData.status || "In Progress"} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700/50"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {activeSection === "language" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Language</label>
                  <Input placeholder="e.g. English, Hindi" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-slate-800/50 border-slate-700/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Proficiency</label>
                  <Select value={formData.proficiency || "Basic"} onValueChange={(value) => setFormData({ ...formData, proficiency: value })}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700/50"><SelectValue placeholder="Proficiency" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Basic">Basic</SelectItem>
                      <SelectItem value="Fluent">Fluent</SelectItem>
                      <SelectItem value="Native">Native</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="px-6">Cancel</Button>
            <Button onClick={saveSection} className="px-6 gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Save</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Toaster richColors position="top-right" />
    </div>
  );
}