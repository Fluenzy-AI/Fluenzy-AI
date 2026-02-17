"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { CalendarDays, Copy, Download, FileText, Pencil, Trash2 } from "lucide-react";
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

  const uploadResume = async () => {
    if (!resumeFile) return;
    setResumeUploading(true);
    setResumeError(null);

    try {
      const body = new FormData();
      body.append("file", resumeFile);

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-slate-900/60 to-slate-800/60 border-slate-700/50">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-4">
                {user.image ? (
                  <img 
                    src={user.image} 
                    alt={user.name} 
                    className="w-20 h-20 rounded-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-700" />
                )}
                <div>
                  <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                  <p className="text-slate-300">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">{planInfo.planName}</Badge>
                    <span className="text-sm text-slate-400">
                      {planInfo.price > 0 ? `₹${planInfo.price}/month` : "Free"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <CalendarDays className="h-4 w-4" />
                  Renewal: {planInfo.renewalDate ? new Date(planInfo.renewalDate).toLocaleDateString() : "N/A"}
                </div>
                <div className="text-sm text-slate-300">
                  Monthly usage: {planInfo.currentUsage} / {planInfo.isUnlimited ? "Unlimited" : planInfo.monthlyLimit}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" asChild>
                    <Link href="/billing">Manage Billing</Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/">Back to App</Link>
                  </Button>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-300">Full Name</label>
                  <Input
                    value={user.name || ""}
                    onChange={(e) => updateProfile({ name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300">Profile Photo</label>
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mt-1">
                    <Input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={uploadAvatar}
                      disabled={!avatarFile || avatarUploading}
                    >
                      {avatarUploading ? "Uploading..." : "Upload Photo"}
                    </Button>
                  </div>
                  {avatarError && <p className="text-xs text-red-400 mt-1">{avatarError}</p>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">Open to Work</span>
                  <Switch
                    checked={profile.openToWork}
                    onCheckedChange={(checked) => updateProfile({ openToWork: checked })}
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300">Headline</label>
                  <Input
                    value={profile.headline || ""}
                    onChange={(e) => updateProfile({ headline: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300">About</label>
                  <Textarea
                    value={profile.bio || ""}
                    onChange={(e) => updateProfile({ bio: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-300">Public Profile URL</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={publicProfileUrl} readOnly />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigator.clipboard.writeText(publicProfileUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-300">Username</label>
                  <Input
                    value={profile.username}
                    onChange={(e) => updateProfile({ username: e.target.value })}
                    className="mt-1"
                  />
                  {usernameError && <p className="text-xs text-red-400 mt-1">{usernameError}</p>}
                  {usernameSuggestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {usernameSuggestions.map((suggestion) => (
                        <Button
                          key={suggestion}
                          size="sm"
                          variant="outline"
                          className="border-slate-700/60"
                          onClick={() => updateProfile({ username: suggestion })}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Social Links</label>
                  <Input
                    placeholder="GitHub URL"
                    value={profile.socialLinks?.github || ""}
                    onChange={(e) =>
                      updateProfile({
                        socialLinks: {
                          ...profile.socialLinks,
                          github: e.target.value,
                        },
                      })
                    }
                  />
                  <Input
                    placeholder="LinkedIn URL"
                    value={profile.socialLinks?.linkedin || ""}
                    onChange={(e) =>
                      updateProfile({
                        socialLinks: {
                          ...profile.socialLinks,
                          linkedin: e.target.value,
                        },
                      })
                    }
                  />
                  <Input
                    placeholder="Portfolio URL"
                    value={profile.socialLinks?.portfolio || ""}
                    onChange={(e) =>
                      updateProfile({
                        socialLinks: {
                          ...profile.socialLinks,
                          portfolio: e.target.value,
                        },
                      })
                    }
                  />
                  <Input
                    placeholder="LeetCode URL"
                    value={profile.socialLinks?.leetcode || ""}
                    onChange={(e) =>
                      updateProfile({
                        socialLinks: {
                          ...profile.socialLinks,
                          leetcode: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Public Profile</span>
                  <Switch
                    checked={profile.publicProfileEnabled}
                    onCheckedChange={(checked) => updateProfile({ publicProfileEnabled: checked })}
                  />
                </div>
                <div className="text-xs text-slate-400">Choose visible sections</div>
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                  {[
                    { key: "skills", label: "Skills" },
                    { key: "experience", label: "Experience" },
                    { key: "education", label: "Education" },
                    { key: "certifications", label: "Certifications" },
                    { key: "projects", label: "Projects" },
                    { key: "courses", label: "Courses" },
                    { key: "languages", label: "Languages" },
                    { key: "analyticsReport", label: "Analytics Report" },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-2">
                      <Checkbox
                        checked={Boolean(profile.publicSections?.[item.key])}
                        onCheckedChange={(checked) =>
                          updateProfile({
                            publicSections: {
                              ...profile.publicSections,
                              [item.key]: Boolean(checked),
                            },
                          })
                        }
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-700/50">
          <CardHeader>
            <CardTitle>Practice Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-1">
              {heatmapDays.map((day) => (
                <div
                  key={day.key}
                  title={`${day.count} practice sessions on ${day.key}`}
                  className={`h-3 w-3 rounded-sm ${
                    day.count === 0
                      ? "bg-slate-800"
                      : day.count < 2
                      ? "bg-emerald-700"
                      : day.count < 4
                      ? "bg-emerald-500"
                      : "bg-emerald-300"
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-slate-900/60 border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Skills</CardTitle>
              <Button size="sm" onClick={() => openDialog("skill")}>Add</Button>
            </CardHeader>
            <CardContent>
              {sections.skills.length ? (
                <div className="flex flex-wrap gap-2">
                  {sections.skills.map((skill) => (
                    <span key={skill.id} className="flex items-center gap-2 bg-slate-800/80 text-slate-200 px-3 py-1 rounded-full text-xs">
                      {skill.name}
                      <button onClick={() => openDialog("skill", skill)}><Pencil className="h-3 w-3" /></button>
                      <button onClick={() => deleteSection("skill", skill.id)}><Trash2 className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Add your first skill.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Experience</CardTitle>
              <Button size="sm" onClick={() => openDialog("experience")}>Add</Button>
            </CardHeader>
            <CardContent>
              {sections.experiences.length ? (
                <div className="space-y-3">
                  {sections.experiences.map((exp) => (
                    <div key={exp.id} className="rounded-lg border border-slate-800 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-100">{exp.role}</p>
                          <p className="text-sm text-slate-400">{exp.company}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openDialog("experience", exp)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteSection("experience", exp.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">{new Date(exp.startDate).toLocaleDateString()} - {exp.endDate ? new Date(exp.endDate).toLocaleDateString() : "Present"}</p>
                      <p className="text-sm text-slate-300 mt-2">{exp.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Add your first role.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Education</CardTitle>
              <Button size="sm" onClick={() => openDialog("education")}>Add</Button>
            </CardHeader>
            <CardContent>
              {sections.educations.length ? (
                <div className="space-y-3">
                  {sections.educations.map((edu) => (
                    <div key={edu.id} className="rounded-lg border border-slate-800 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-100">{edu.degree}</p>
                          <p className="text-sm text-slate-400">{edu.institution}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openDialog("education", edu)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteSection("education", edu.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">{edu.startYear} - {edu.endYear || "Present"} {edu.grade ? `• ${edu.grade}` : ""}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Add your education history.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Certifications</CardTitle>
              <Button size="sm" onClick={() => openDialog("certification")}>Add</Button>
            </CardHeader>
            <CardContent>
              {sections.certifications.length ? (
                <div className="space-y-3">
                  {sections.certifications.map((cert) => (
                    <div key={cert.id} className="rounded-lg border border-slate-800 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {cert.imageUrl ? (
                            /\.pdf($|\?)/i.test(cert.imageUrl) ? (
                              <div className="h-12 w-12 rounded-md bg-slate-800 flex items-center justify-center border border-slate-800">
                                <FileText className="h-5 w-5 text-slate-300" />
                              </div>
                            ) : (
                              <img
                                src={cert.imageUrl}
                                alt={cert.name}
                                className="h-12 w-12 rounded-md object-cover border border-slate-800"
                              />
                            )
                          ) : (
                            <div className="h-12 w-12 rounded-md bg-slate-800" />
                          )}
                          <div>
                          <p className="font-semibold text-slate-100">{cert.name}</p>
                          <p className="text-sm text-slate-400">Issuer: {cert.issuer || "Microsoft"}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openDialog("certification", cert)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteSection("certification", cert.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-slate-300 space-y-1">
                        <p>Date: {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : "N/A"}</p>
                        <p>ID: {cert.credentialId || cert.id}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {cert.skills?.length ? (
                          cert.skills.map((skill: string) => (
                            <Badge key={skill} variant="secondary">{skill}</Badge>
                          ))
                        ) : (
                          <Badge variant="secondary">No skills added</Badge>
                        )}
                        <Button variant="outline" size="sm" asChild disabled={!cert.credentialUrl}>
                          <a href={cert.credentialUrl || "#"} target="_blank" rel="noreferrer">
                            Verify
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Add your certifications.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Projects</CardTitle>
              <Button size="sm" onClick={() => openDialog("project")}>Add</Button>
            </CardHeader>
            <CardContent>
              {sections.projects.length ? (
                <div className="space-y-3">
                  {sections.projects.map((project) => (
                    <div key={project.id} className="rounded-lg border border-slate-800 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-100">{project.title}</p>
                          <p className="text-sm text-slate-400">{project.techStack}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openDialog("project", project)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteSection("project", project.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 mt-2">{project.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" asChild disabled={!project.projectUrl}>
                          <a href={project.projectUrl || "#"} target="_blank" rel="noreferrer">
                            Show Project
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild disabled={!project.repoUrl}>
                          <a href={project.repoUrl || "#"} target="_blank" rel="noreferrer">
                            GitHub
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild disabled={!project.projectUrl && !project.repoUrl}>
                          <a href={project.projectUrl || project.repoUrl || "#"} target="_blank" rel="noreferrer">
                            Project Details
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Add your first project.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Courses</CardTitle>
              <Button size="sm" onClick={() => openDialog("course")}>Add</Button>
            </CardHeader>
            <CardContent>
              {sections.courses.length ? (
                <div className="space-y-3">
                  {sections.courses.map((course) => (
                    <div key={course.id} className="rounded-lg border border-slate-800 p-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-100">{course.name}</p>
                        <p className="text-sm text-slate-400">{course.platform} • {course.status}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openDialog("course", course)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteSection("course", course.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Add your first course.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Languages</CardTitle>
              <Button size="sm" onClick={() => openDialog("language")}>Add</Button>
            </CardHeader>
            <CardContent>
              {sections.languages.length ? (
                <div className="flex flex-wrap gap-2">
                  {sections.languages.map((lang) => (
                    <span key={lang.id} className="flex items-center gap-2 bg-slate-800/80 text-slate-200 px-3 py-1 rounded-full text-xs">
                      {lang.name} • {lang.proficiency}
                      <button onClick={() => openDialog("language", lang)}><Pencil className="h-3 w-3" /></button>
                      <button onClick={() => deleteSection("language", lang.id)}><Trash2 className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Add your languages.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-900/60 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Resume</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <a href="/api/resume-pdf" target="_blank" rel="noreferrer">
                <Download className="h-4 w-4 mr-2" /> Download Resume
              </a>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              />
              <Button
                size="sm"
                onClick={uploadResume}
                disabled={!resumeFile || resumeUploading}
              >
                {resumeUploading ? "Uploading..." : "Upload Resume"}
              </Button>
            </div>
            {resumeError && <p className="text-sm text-red-400">{resumeError}</p>}

            {resumes?.length ? (
              <div className="space-y-2">
                {resumes.map((resume) => (
                  <div key={resume.id} className="flex items-center justify-between rounded-lg border border-slate-800 p-3">
                    <div>
                      <p className="text-sm text-slate-200">{resume.fileName}</p>
                      <p className="text-xs text-slate-400">
                        Uploaded: {new Date(resume.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={resume.fileUrl} target="_blank" rel="noreferrer">
                        <Download className="h-4 w-4 mr-2" /> Download
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Upload your resume (PDF only, max 5MB).</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Billing & Payments</CardTitle>
            <div className="flex gap-2">
            </div>
          </CardHeader>
          <CardContent>
            {payments.length ? (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="rounded-lg border border-slate-800 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <p className="text-sm text-slate-400">{new Date(payment.date).toLocaleDateString()}</p>
                      <p className="font-semibold text-slate-100">{payment.plan || "Plan"} • ₹{payment.amount}</p>
                      {payment.couponUsed && <p className="text-xs text-emerald-400">Coupon: {payment.couponUsed}</p>}
                      {payment.invoiceId && <p className="text-xs text-slate-400">Invoice: {payment.invoiceId}</p>}
                    </div>
                    {payment.receiptUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={payment.receiptUrl} target="_blank" rel="noreferrer">
                          <Download className="h-4 w-4 mr-2" /> Download Invoice
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No billing history yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit" : "Add"} {activeSection}</DialogTitle>
            <DialogDescription>Update your profile section details.</DialogDescription>
          </DialogHeader>
          {activeSection === "skill" && (
            <div className="space-y-3">
              <Input
                placeholder="Skill name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          )}

          {activeSection === "experience" && (
            <div className="space-y-3">
              <Input placeholder="Role" value={formData.role || ""} onChange={(e) => setFormData({ ...formData, role: e.target.value })} />
              <Input placeholder="Company" value={formData.company || ""} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
              <Input type="date" value={formData.startDate ? formData.startDate.slice(0, 10) : ""} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
              <Input type="date" value={formData.endDate ? formData.endDate.slice(0, 10) : ""} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
              <Textarea placeholder="Description" value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
          )}

          {activeSection === "education" && (
            <div className="space-y-3">
              <Input placeholder="Degree" value={formData.degree || ""} onChange={(e) => setFormData({ ...formData, degree: e.target.value })} />
              <Input placeholder="Institution" value={formData.institution || ""} onChange={(e) => setFormData({ ...formData, institution: e.target.value })} />
              <Input placeholder="Start Year" value={formData.startYear || ""} onChange={(e) => setFormData({ ...formData, startYear: e.target.value })} />
              <Input placeholder="End Year" value={formData.endYear || ""} onChange={(e) => setFormData({ ...formData, endYear: e.target.value })} />
              <Input placeholder="Grade / CGPA" value={formData.grade || ""} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} />
            </div>
          )}

          {activeSection === "certification" && (
            <div className="space-y-3">
              <Input placeholder="Certificate name" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <Input placeholder="Issuer" value={formData.issuer || ""} onChange={(e) => setFormData({ ...formData, issuer: e.target.value })} />
              <Input type="date" value={formData.issueDate ? formData.issueDate.slice(0, 10) : ""} onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })} />
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Certificate PDF</label>
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={uploadCertificateImage}
                    disabled={!certificateFile || certificateUploading}
                  >
                    {certificateUploading ? "Uploading..." : "Upload PDF"}
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
              <Input placeholder="Credential URL" value={formData.credentialUrl || ""} onChange={(e) => setFormData({ ...formData, credentialUrl: e.target.value })} />
              <Input
                placeholder="Skills (comma separated)"
                value={formData.skillsText || ""}
                onChange={(e) => setFormData({ ...formData, skillsText: e.target.value })}
              />
            </div>
          )}

          {activeSection === "project" && (
            <div className="space-y-3">
              <Input placeholder="Project title" value={formData.title || ""} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              <Input placeholder="Tech stack" value={formData.techStack || ""} onChange={(e) => setFormData({ ...formData, techStack: e.target.value })} />
              <Textarea placeholder="Description" value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              <Input placeholder="GitHub URL" value={formData.repoUrl || ""} onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })} />
              <Input placeholder="Live URL" value={formData.projectUrl || ""} onChange={(e) => setFormData({ ...formData, projectUrl: e.target.value })} />
            </div>
          )}

          {activeSection === "course" && (
            <div className="space-y-3">
              <Input placeholder="Course name" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <Input placeholder="Platform" value={formData.platform || ""} onChange={(e) => setFormData({ ...formData, platform: e.target.value })} />
              <Select value={formData.status || "In Progress"} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {activeSection === "language" && (
            <div className="space-y-3">
              <Input placeholder="Language" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <Select value={formData.proficiency || "Basic"} onValueChange={(value) => setFormData({ ...formData, proficiency: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Proficiency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Basic">Basic</SelectItem>
                  <SelectItem value="Fluent">Fluent</SelectItem>
                  <SelectItem value="Native">Native</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveSection}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}