/*
"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarDays, Code, Download, ExternalLink, FileText, Github, Globe, Linkedin, MapPin } from "lucide-react";

type ResumeItem = {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  fileSize?: number | null;
};

type PublicProfileData = {
  profile: {
    username: string;
    headline?: string;
    bio?: string;
    openToWork: boolean;
    user: { name: string; email: string; image?: string | null };
    socialLinks?: { github?: string; linkedin?: string; portfolio?: string; leetcode?: string } | null;
    publicSections?: Record<string, boolean>;
  };
  sections: {
    skills: Array<{ id: string; name: string; level: string }>;
    experiences: Array<{ id: string; role: string; company: string; startDate: string; endDate?: string | null; description?: string | null }>;
    educations: Array<{ id: string; degree: string; institution: string; startYear: number; endYear?: number | null; grade?: string | null }>;
    certifications: Array<{
      id: string;
      name: string;
      issuer: string;
      issueDate: string;
      imageUrl?: string | null;
      credentialUrl?: string | null;
      skills?: string[];
    }>;
    projects: Array<{ id: string; title: string; description?: string | null; techStack?: string | null; projectUrl?: string | null; repoUrl?: string | null }>;
    courses: Array<{ id: string; name: string; platform: string; status: string }>;
    languages: Array<{ id: string; name: string; proficiency: string }>;
  };
  activity: Record<string, number>;
  resumes: ResumeItem[];
};

const formatDate = (value?: string | Date | null) => {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

const formatFileSize = (bytes?: number | null) => {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
};

const splitBullets = (text?: string | null) => {
  if (!text) return [];
  const raw = text
    .split(/\n|•|\u2022|\r/)
    .map((item) => item.replace(/^[-*]\s?/, "").trim())
    .filter(Boolean);
  if (raw.length) return raw.slice(0, 4);
  return text
    .split(/\.|\;/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
};

const categorizeSkill = (name: string) => {
  const value = name.toLowerCase();
  if (/(ai|ml|machine|deep|nlp|llm|pytorch|tensorflow|vision|genai)/.test(value)) return "AI";
  if (/(data|sql|pandas|numpy|analytics|power bi|tableau|excel|spark|warehouse)/.test(value)) return "Data";
  if (/(react|next|node|express|html|css|javascript|typescript|frontend|backend|api|web)/.test(value)) return "Web";
  if (/(git|docker|aws|azure|gcp|linux|tools|postman|figma|jira|github)/.test(value)) return "Tools";
  return "Other";
};

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [data, setData] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<{ title: string; url: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/public-profile/${username}`);
        if (res.ok) {
          setData(await res.json());
        }
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username]);

  const activityMap = data?.activity || {};
  const skillsList = data?.sections?.skills || [];

  const heatmapDays = useMemo(() => {
    const days: { key: string; count: number }[] = [];
    const start = new Date();
    start.setDate(start.getDate() - 140);
    for (let i = 0; i <= 140; i += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const key = date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      days.push({ key, count: activityMap?.[key] || 0 });
    }
    return days;
  }, [activityMap]);

  const skillGroups = useMemo(() => {
    const map = new Map<string, typeof skillsList>();
    skillsList.forEach((skill) => {
      const category = categorizeSkill(skill.name);
      if (!map.has(category)) map.set(category, []);
      map.get(category)?.push(skill);
    });
    return Array.from(map.entries());
  }, [skillsList]);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!data) {
    return <div className="container mx-auto px-4 py-8">Profile not available.</div>;
  }

  const { profile, sections, activity, resumes } = data;
  const primaryResume = resumes?.[0];
  const socialLinks = profile.socialLinks || {};
  const fallbackGithub = sections.projects.find((project) => Boolean(project.repoUrl))?.repoUrl;
  const fallbackPortfolio = sections.projects.find((project) => Boolean(project.projectUrl))?.projectUrl;
  const githubUrl = socialLinks.github || fallbackGithub;
  const linkedinUrl = socialLinks.linkedin;
  const portfolioUrl = socialLinks.portfolio || fallbackPortfolio;
  const leetcodeUrl = (socialLinks as any)?.leetcode as string | undefined;
  const socialItems = [
    { key: "github", url: githubUrl, icon: Github },
    { key: "linkedin", url: linkedinUrl, icon: Linkedin },
    { key: "portfolio", url: portfolioUrl, icon: Globe },
    { key: "leetcode", url: leetcodeUrl, icon: Code },
  ];
  const location = (profile as any).location as string | undefined;
  const analyticsReportEnabled = Boolean(profile.publicSections?.analyticsReport);


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container mx-auto px-4 py-10 space-y-8 scroll-smooth">
        <Card className="border-slate-800/70 bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-slate-800/70 shadow-2xl shadow-slate-900/40">
          <CardContent className="p-6 md:p-10 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="relative">
                {profile.user?.image ? (
                  <img
                    src={profile.user.image}
                    alt={profile.user.name}
                    className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border border-slate-700/60 shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-slate-800 border border-slate-700/60" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
                    {profile.user?.name}
                  </h1>
                  {profile.openToWork && (
                    <Badge className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">
                      Open to Work
                    </Badge>
                  )}
                </div>
                {profile.headline && <p className="mt-2 text-lg text-slate-300">{profile.headline}</p>}
                {location && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                    <MapPin className="h-4 w-4" />
                    <span>{location}</span>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-3 text-slate-300">
                    {socialItems.map((item) => {
                      const Icon = item.icon;
                      return item.url ? (
                        <a
                          key={item.key}
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-slate-700/60 p-2 transition hover:border-slate-400 hover:text-white"
                        >
                          <Icon className="h-4 w-4" />
                        </a>
                      ) : (
                        <span
                          key={item.key}
                          className="rounded-full border border-slate-700/60 p-2 opacity-40"
                          aria-disabled
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 min-w-[200px]">
                <Button
                  className="w-full bg-emerald-500/90 hover:bg-emerald-500 text-slate-950"
                  asChild
                  disabled={!primaryResume}
                >
                  <a href={primaryResume?.fileUrl || "#"} download>
                    <Download className="mr-2 h-4 w-4" />
                    Download Resume
                  </a>
                </Button>
                {analyticsReportEnabled && (
                  <Button variant="outline" className="w-full border-slate-700/60" asChild>
                    <a
                      href={`/analytics/report?public=1&username=${encodeURIComponent(profile.username)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Analytics Report
                    </a>
                  </Button>
                )}
                {primaryResume && (
                  <Button
                    variant="outline"
                    className="w-full border-slate-700/60"
                    onClick={() =>
                      setPreview({
                        title: "Resume Preview",
                        url: primaryResume.fileUrl,
                      })
                    }
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Preview Resume
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {profile.bio && (
          <Card className="border-slate-800/70 bg-slate-900/60 shadow-lg shadow-slate-900/40">
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-slate-300 max-w-3xl">
                {profile.bio}
              </p>
            </CardContent>
          </Card>
        )}

        {sections.skills.length > 0 && (
          <Card className="border-slate-800/70 bg-gradient-to-br from-slate-900/60 to-slate-900/30 shadow-lg">
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {skillsList.map((skill) => (
                  <span
                    key={skill.id}
                    className="rounded-full bg-slate-800/80 px-3 py-1 text-xs text-slate-200 border border-slate-700/60"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {sections.experiences.length > 0 && (
          <Card className="border-slate-800/70 bg-slate-900/60 shadow-lg">
            <CardHeader>
              <CardTitle>Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sections.experiences.map((exp) => (
                <div
                  key={exp.id}
                  className="rounded-2xl border border-slate-800/70 bg-slate-900/80 p-4 transition hover:-translate-y-0.5 hover:border-slate-600/60"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <p className="text-base font-semibold text-white">{exp.role}</p>
                      <p className="text-sm text-slate-400">{exp.company}</p>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      <span>
                        {formatDate(exp.startDate)} - {exp.endDate ? formatDate(exp.endDate) : "Present"}
                      </span>
                    </div>
                  </div>
                  {splitBullets(exp.description).length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm text-slate-300 list-disc list-inside">
                      {splitBullets(exp.description).map((item) => (
                        <li key={`${exp.id}-${item}`}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {sections.projects.length > 0 && (
          <Card className="border-slate-800/70 bg-gradient-to-br from-slate-900/70 to-slate-900/30 shadow-lg">
            <CardHeader>
              <CardTitle>Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {sections.projects.map((project, index) => {
                  const techStack = project.techStack
                    ? project.techStack.split(",").map((item) => item.trim()).filter(Boolean)
                    : [];
                  return (
                    <div
                      key={project.id}
                      className={`rounded-2xl border border-slate-800/70 bg-slate-900/80 p-4 transition hover:-translate-y-0.5 hover:border-slate-600/60 ${
                        index < 2 ? "ring-1 ring-emerald-400/30" : ""
                      }`}
                    >
                      <h3 className="text-base font-semibold text-white">{project.title}</h3>
                      {project.description && <p className="mt-2 text-sm text-slate-300">{project.description}</p>}
                      {techStack.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {techStack.map((tech) => (
                            <Badge key={tech} variant="secondary" className="bg-slate-800/80 text-slate-200">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {project.projectUrl && (
                          <Button size="sm" variant="outline" className="border-slate-700/60" asChild>
                            <a href={project.projectUrl} target="_blank" rel="noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Live / Demo
                            </a>
                          </Button>
                        )}
                        {project.repoUrl && (
                          <Button size="sm" variant="outline" className="border-slate-700/60" asChild>
                            <a href={project.repoUrl} target="_blank" rel="noreferrer">
                              <Github className="mr-2 h-4 w-4" />
                              GitHub
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {sections.educations.length > 0 && (
          <Card className="border-slate-800/70 bg-slate-900/60 shadow-lg">
            <CardHeader>
              <CardTitle>Education</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sections.educations.map((edu) => (
                <div key={edu.id} className="rounded-2xl border border-slate-800/70 bg-slate-900/80 p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <p className="text-base font-semibold text-white">{edu.degree}</p>
                      <p className="text-sm text-slate-400">{edu.institution}</p>
                    </div>
                    <p className="text-xs text-slate-400">
                      {edu.startYear} - {edu.endYear || "Present"}
                    </p>
                  </div>
                  {edu.grade && <p className="mt-2 text-xs text-slate-300">Grade/CGPA: {edu.grade}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {sections.certifications.length > 0 && (
          <Card className="border-slate-800/70 bg-gradient-to-br from-slate-900/70 to-slate-900/30 shadow-lg">
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {sections.certifications.map((cert) => (
                  <div key={cert.id} className="rounded-2xl border border-slate-800/70 bg-slate-900/80 p-4">
                    <div className="flex items-start gap-4">
                      {cert.imageUrl ? (
                        /\.pdf($|\?)/i.test(cert.imageUrl) ? (
                          <div className="h-16 w-16 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-200 font-semibold">
                            PDF
                          </div>
                        ) : (
                          <img
                            src={cert.imageUrl}
                            alt={cert.name}
                            className="h-16 w-16 rounded-xl object-cover border border-slate-700/60"
                          />
                        )
                      ) : (
                        <div className="h-16 w-16 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-200 font-semibold">
                          {cert.issuer?.slice(0, 2)?.toUpperCase() || "CR"}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-base font-semibold text-white">{cert.name}</p>
                        <p className="text-sm text-slate-400">{cert.issuer}</p>
                        <p className="text-xs text-slate-400 mt-1">{formatDate(cert.issueDate)}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {cert.credentialUrl && (
                        <Button size="sm" variant="outline" className="border-slate-700/60" asChild>
                          <a href={cert.credentialUrl} target="_blank" rel="noreferrer">
                            Verify
                          </a>
                        </Button>
                      )}
                      {(cert.imageUrl || cert.credentialUrl) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-700/60"
                          onClick={() => setPreview({ title: cert.name, url: cert.imageUrl || cert.credentialUrl || "" })}
                        >
                          Preview Certificate
                        </Button>
                      )}
                      {(cert.imageUrl || cert.credentialUrl) && (
                        <Button size="sm" variant="outline" className="border-slate-700/60" asChild>
                          <a href={cert.imageUrl || cert.credentialUrl || "#"} target="_blank" rel="noreferrer" download>
                            Download
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {sections.courses.length > 0 && (
          <Card className="border-slate-800/70 bg-slate-900/60 shadow-lg">
            <CardHeader>
              <CardTitle>Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {sections.courses.map((course) => (
                  <div key={course.id} className="rounded-2xl border border-slate-800/70 bg-slate-900/80 p-4">
                    <p className="text-base font-semibold text-white">{course.name}</p>
                    <p className="text-sm text-slate-400">{course.platform}</p>
                    <p className="text-xs text-emerald-300 mt-2">{course.status}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {sections.languages.length > 0 && (
          <Card className="border-slate-800/70 bg-slate-900/60 shadow-lg">
            <CardHeader>
              <CardTitle>Languages</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {sections.languages.map((language) => (
                <div key={language.id} className="rounded-full border border-slate-700/60 bg-slate-800/70 px-4 py-2 text-sm">
                  <span className="text-white font-medium">{language.name}</span>
                  <span className="text-slate-400"> • {language.proficiency}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {Object.values(activity || {}).some((value) => value > 0) && (
          <Card className="border-slate-800/70 bg-gradient-to-br from-slate-900/70 to-slate-900/30 shadow-lg">
            <CardHeader>
              <CardTitle>Practice Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-14 gap-1">
                {heatmapDays.map((day) => {
                  const intensity =
                    day.count > 6 ? "bg-emerald-500" : day.count > 3 ? "bg-emerald-400/80" : day.count > 0 ? "bg-emerald-300/60" : "bg-slate-800";
                  return (
                    <div key={day.key} className="h-3 w-3 rounded-sm" title={`${day.key} • ${day.count} sessions`}>
                      <div className={`h-full w-full rounded-sm ${intensity}`} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-slate-800/70 bg-slate-900/60 shadow-lg">
          <CardHeader>
            <CardTitle>Resume</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {primaryResume ? (
              <div className="rounded-2xl border border-slate-800/70 bg-slate-900/80 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-white">{primaryResume.fileName}</p>
                  <p className="text-xs text-slate-400">
                    Uploaded {new Date(primaryResume.uploadedAt).toLocaleDateString()} {primaryResume.fileSize ? `• ${formatFileSize(primaryResume.fileSize)}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="border-slate-700/60"
                    onClick={() => setPreview({ title: "Resume Preview", url: primaryResume.fileUrl })}
                  >
                    Preview Resume
                  </Button>
                  <Button className="bg-emerald-500/90 hover:bg-emerald-500 text-slate-950" asChild>
                    <a href={primaryResume.fileUrl} download>
                      <Download className="mr-2 h-4 w-4" />
                      Download Resume
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Resume not shared yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-4xl bg-slate-950 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">{preview?.title}</DialogTitle>
          </DialogHeader>
          {preview?.url && (
            <div className="mt-2 rounded-xl border border-slate-800 overflow-hidden">
              {preview.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img src={preview.url} alt={preview.title} className="w-full h-auto max-h-[70vh] object-contain" />
              ) : (
                <iframe src={preview.url} title={preview.title} className="h-[70vh] w-full" />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
*/

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import path from "path";
import { stat } from "fs/promises";
import prisma from "@/lib/prisma";
import { getPublicFileUrl } from "@/lib/file-url-helper";
import PublicProfileClient, { PublicProfileData } from "./PublicProfileClient";

export const dynamic = "force-dynamic";

const baseUrl = "https://www.fluenzyai.app";

type Params = { params: Promise<{ username: string }> };

const toIstDateKey = (date: Date) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
};

const getPublicProfile = async (username: string): Promise<PublicProfileData | null> => {
  const profile = await (prisma as any).userProfile.findFirst({
    where: { username: username.toLowerCase() },
    include: {
      skills: true,
      experiences: true,
      educations: true,
      certifications: true,
      projects: true,
      courses: true,
      languages: true,
      user: true,
    },
  });

  if (!profile || !profile.publicProfileEnabled) {
    return null;
  }

  const allowed = (profile.publicSections as any) || {
    skills: true,
    experience: true,
    education: true,
    certifications: true,
    projects: true,
    courses: true,
    languages: true,
    analyticsReport: false,
  };

  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);

  const sessions = await prisma.session.findMany({
    where: {
      userId: profile.userId,
      startTime: { gte: oneYearAgo },
    },
    select: { startTime: true },
  });

  const activity: Record<string, number> = {};
  sessions.forEach((sessionItem) => {
    const key = toIstDateKey(sessionItem.startTime);
    activity[key] = (activity[key] || 0) + 1;
  });

  const resumes = await (prisma as any).resume.findMany({
    where: { userId: profile.userId },
    orderBy: { uploadedAt: "desc" },
    take: 5,
  });

  const resumesWithSize = await Promise.all(
    resumes.map(async (resume: any) => {
      let fileSize: number | null = null;
      try {
        const localPath = path.join(process.cwd(), "public", resume.fileUrl.replace(/^\/+/, ""));
        const stats = await stat(localPath);
        fileSize = stats.size;
      } catch (error) {
        fileSize = null;
      }
      
      // Transform URL to public/signed URL
      const publicFileUrl = await getPublicFileUrl(resume.fileUrl);
      
      return {
        id: resume.id,
        fileName: resume.fileName,
        fileUrl: publicFileUrl || resume.fileUrl,
        uploadedAt: resume.uploadedAt,
        fileSize,
      };
    })
  );

  return {
    profile: {
      username: profile.username,
      headline: profile.headline,
      bio: profile.bio,
      openToWork: profile.openToWork,
      user: {
        name: profile.user.name,
        email: profile.user.email,
        image: profile.user.avatar,
      },
      socialLinks: (profile as any).socialLinks || null,
      publicSections: allowed,
    },
    sections: {
      skills: allowed.skills ? profile.skills : [],
      experiences: allowed.experience ? profile.experiences : [],
      educations: allowed.education ? profile.educations : [],
      certifications: allowed.certifications 
        ? await Promise.all(profile.certifications.map(async (cert: any) => {
            let imageUrl = cert.imageUrl;
            let credentialUrl = cert.credentialUrl;
            
            if (imageUrl) {
              imageUrl = await getPublicFileUrl(imageUrl);
            }
            if (credentialUrl) {
              credentialUrl = await getPublicFileUrl(credentialUrl);
            }
            
            return {
              ...cert,
              imageUrl: imageUrl || cert.imageUrl,
              credentialUrl: credentialUrl || cert.credentialUrl,
            };
          }))
        : [],
      projects: allowed.projects ? profile.projects : [],
      courses: allowed.courses ? profile.courses : [],
      languages: allowed.languages ? profile.languages : [],
    },
    activity,
    resumes: resumesWithSize,
  };
};


export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username: rawUsername } = await params;
  const username = rawUsername?.toLowerCase();
  if (!username) {
    return {
      title: "Public Profile - FluenzyAI",
      robots: { index: false, follow: false },
    };
  }

  const data = await getPublicProfile(username);
  if (!data) {
    return {
      title: "Profile Not Available - FluenzyAI",
      description: "This public profile is not available on FluenzyAI.",
      robots: { index: false, follow: false },
    };
  }

  const name = data.profile.user?.name || data.profile.username;
  const description = data.profile.headline
    ? `${data.profile.headline} · Public profile on FluenzyAI.`
    : `View ${name}'s public profile on FluenzyAI.`;
  const canonical = `${baseUrl}/u/${data.profile.username}`;

  return {
    title: `${name} | Public Profile - FluenzyAI`,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${name} | Public Profile - FluenzyAI`,
      description,
      url: canonical,
      type: "profile",
      images: [
        {
          url: "https://www.fluenzyai.app/og-image.jpg",
          width: 1200,
          height: 630,
          alt: `${name} on FluenzyAI`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | Public Profile - FluenzyAI`,
      description,
      images: ["https://www.fluenzyai.app/og-image.jpg"],
    },
  };
}

export default async function PublicProfilePage({ params }: Params) {
  const { username: rawUsername } = await params;
  const username = rawUsername?.toLowerCase();
  if (!username) {
    notFound();
  }

  const data = await getPublicProfile(username);
  if (!data) {
    notFound();
  }

  const canonical = `${baseUrl}/u/${data.profile.username}`;
  const name = data.profile.user?.name || data.profile.username;

  return (
    <>
      <PublicProfileClient initialData={data} username={username} />
      <section className="bg-slate-950 text-slate-200">
        <div className="container mx-auto px-4 py-12 space-y-8">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-400">
            <ol className="flex flex-wrap gap-2">
              <li>
                <a href="/" className="hover:text-slate-200">Home</a>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-slate-300">Public Profile</li>
            </ol>
          </nav>

          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-5 md:p-6 shadow-lg shadow-slate-900/30">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base md:text-lg font-semibold text-white">
                <span>What this Fluenzy AI public profile represents</span>
                <span className="text-slate-400 transition group-open:rotate-90">▸</span>
              </summary>
              <p className="mt-3 text-sm md:text-base leading-relaxed text-slate-300">
                Fluenzy AI public profiles provide a structured, recruiter-friendly snapshot of a learner&apos;s interview preparation
                journey. Each section is generated from verified training data, project work, and skill progress within the platform.
                Recruiters can use this profile to evaluate readiness across communication, HR, and technical interview preparation.
                Learners can publish their profile from Fluenzy AI to share measurable progress with hiring teams.
              </p>
            </details>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Profile FAQs</h2>
            <div className="space-y-4">
              <details className="group rounded-2xl border border-slate-800/70 bg-slate-900/50 p-4 md:p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm md:text-base font-semibold text-slate-100">
                  <span>What does a public profile show?</span>
                  <span className="text-slate-400 transition group-open:rotate-90">▸</span>
                </summary>
                <p className="mt-3 text-sm text-slate-300">
                  Public profiles summarize interview readiness with verified skills, projects, and achievements supported by FluenzyAI
                  training sessions.
                </p>
              </details>
              <details className="group rounded-2xl border border-slate-800/70 bg-slate-900/50 p-4 md:p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm md:text-base font-semibold text-slate-100">
                  <span>Is this profile related to FluenzyAI analytics?</span>
                  <span className="text-slate-400 transition group-open:rotate-90">▸</span>
                </summary>
                <p className="mt-3 text-sm text-slate-300">
                  When enabled, the profile can link to the analytics report that tracks communication, confidence, and technical
                  interview training progress.
                </p>
              </details>
              <details className="group rounded-2xl border border-slate-800/70 bg-slate-900/50 p-4 md:p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm md:text-base font-semibold text-slate-100">
                  <span>Can recruiters use this to evaluate interview readiness?</span>
                  <span className="text-slate-400 transition group-open:rotate-90">▸</span>
                </summary>
                <p className="mt-3 text-sm text-slate-300">
                  Yes. The profile provides a structured view of skills, projects, and learning milestones that support HR interview
                  preparation and technical interview evaluation.
                </p>
              </details>
              <details className="group rounded-2xl border border-slate-800/70 bg-slate-900/50 p-4 md:p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm md:text-base font-semibold text-slate-100">
                  <span>How can I build a similar profile?</span>
                  <span className="text-slate-400 transition group-open:rotate-90">▸</span>
                </summary>
                <p className="mt-3 text-sm text-slate-300">
                  Start with mock interviews with AI, complete training modules, and publish your profile from your FluenzyAI account.
                </p>
              </details>
            </div>
          </div>
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "mainEntity": {
              "@type": "Person",
              "name": name,
              "description": data.profile.headline || data.profile.bio || "FluenzyAI public profile",
              "url": canonical
            }
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What does a public profile show?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Public profiles summarize interview readiness with verified skills, projects, and achievements supported by FluenzyAI training sessions."
                }
              },
              {
                "@type": "Question",
                "name": "Is this profile related to FluenzyAI analytics?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "When enabled, the profile can link to the analytics report that tracks communication, confidence, and technical interview training progress."
                }
              },
              {
                "@type": "Question",
                "name": "Can recruiters use this to evaluate interview readiness?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. The profile provides a structured view of skills, projects, and learning milestones that support HR interview preparation and technical interview evaluation."
                }
              },
              {
                "@type": "Question",
                "name": "How can I build a similar profile?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Start with mock interviews with AI, complete training modules, and publish your profile from your FluenzyAI account."
                }
              }
            ]
          })
        }}
      />
    </>
  );
}
