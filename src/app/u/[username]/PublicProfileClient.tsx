"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  CalendarDays, Code2, Download, ExternalLink, FileText, Github, Globe,
  Linkedin, MapPin, Award, Briefcase, GraduationCap, BookOpen, Languages,
  FolderKanban, Activity, TrendingUp, Zap, Star, Eye, Share2, Copy, Check,
} from "lucide-react";

type ResumeItem = {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  fileSize?: number | null;
};

export type PublicProfileData = {
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

const activityCellClass = (count: number) => {
  if (!count) return "bg-slate-800/80";
  if (count <= 1) return "bg-emerald-900/70";
  if (count <= 2) return "bg-emerald-700/80";
  if (count <= 4) return "bg-emerald-500/80";
  return "bg-emerald-400/90";
};

const categorizeSkill = (name: string) => {
  const value = name.toLowerCase();
  if (/(ai|ml|machine|deep|nlp|llm|pytorch|tensorflow|vision|genai)/.test(value)) return "AI";
  if (/(data|sql|pandas|numpy|analytics|power bi|tableau|excel|spark|warehouse)/.test(value)) return "Data";
  if (/(react|next|node|express|html|css|javascript|typescript|frontend|backend|api|web)/.test(value)) return "Web";
  if (/(git|docker|aws|azure|gcp|linux|tools|postman|figma|jira|github)/.test(value)) return "Tools";
  return "Other";
};

type PublicProfileClientProps = {
  initialData: PublicProfileData | null;
  username: string;
};

export default function PublicProfileClient({ initialData, username }: PublicProfileClientProps) {
  const [data, setData] = useState<PublicProfileData | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
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

    if (username && !initialData) {
      fetchProfile();
    }
  }, [username, initialData]);

  const activityMap = data?.activity || {};
  const skillsList = data?.sections?.skills || [];

  const heatmapMonths = useMemo(() => {
    const months: Array<{ label: string; days: { key: string; count: number }[] }> = [];
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    for (let m = 0; m < 12; m += 1) {
      const monthDate = new Date(start.getFullYear(), start.getMonth() + m, 1);
      const monthLabel = monthDate.toLocaleString("en-US", { month: "short" });
      const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
      const days: { key: string; count: number }[] = [];

      for (let d = 1; d <= daysInMonth; d += 1) {
        const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), d);
        const key = date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        days.push({ key, count: activityMap?.[key] || 0 });
      }

      months.push({ label: monthLabel, days });
    }

    return months;
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
    { key: "leetcode", url: leetcodeUrl, icon: Code2 },
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
                  <p className="text-base font-semibold text-white">{edu.degree}</p>
                  <p className="text-sm text-slate-400">{edu.institution}</p>
                  <p className="text-xs text-slate-500">
                    {edu.startYear} - {edu.endYear ?? "Present"}
                  </p>
                  {edu.grade && <p className="text-xs text-slate-400">Grade: {edu.grade}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {sections.certifications.length > 0 && (
          <Card className="border-slate-800/70 bg-gradient-to-br from-slate-900/70 to-slate-900/40 shadow-lg">
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {sections.certifications.map((cert) => (
                  <div key={cert.id} className="rounded-2xl border border-slate-800/70 bg-slate-900/80 p-4">
                    <p className="text-base font-semibold text-white">{cert.name}</p>
                    <p className="text-sm text-slate-400">{cert.issuer}</p>
                    <p className="text-xs text-slate-500">Issued {formatDate(cert.issueDate)}</p>
                    {cert.skills?.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {cert.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="bg-slate-800/80 text-slate-200">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {cert.imageUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-700/60"
                          onClick={() =>
                            setPreview({
                              title: `${cert.name} Certificate`,
                              url: cert.imageUrl as string,
                            })
                          }
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Preview Certificate
                        </Button>
                      )}
                      {cert.credentialUrl && (
                        <Button size="sm" variant="outline" className="border-slate-700/60" asChild>
                          <a href={cert.credentialUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Credential
                          </a>
                        </Button>
                      )}
                      {cert.imageUrl && (
                        <Button size="sm" variant="outline" className="border-slate-700/60" asChild>
                          <a href={cert.imageUrl} download>
                            <Download className="mr-2 h-4 w-4" />
                            Download Certificate
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
              <div className="grid gap-4 md:grid-cols-2">
                {sections.courses.map((course) => (
                  <div key={course.id} className="rounded-2xl border border-slate-800/70 bg-slate-900/80 p-4">
                    <p className="text-base font-semibold text-white">{course.name}</p>
                    <p className="text-sm text-slate-400">{course.platform}</p>
                    <p className="text-xs text-slate-500">Status: {course.status}</p>
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
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {sections.languages.map((lang) => (
                  <span
                    key={lang.id}
                    className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200"
                  >
                    {lang.name} · {lang.proficiency}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-slate-800/70 bg-slate-900/60 shadow-lg">
          <CardHeader>
            <CardTitle>Practice Consistency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mx-auto w-fit">
              <div className="flex flex-wrap justify-center gap-6">
                {heatmapMonths.map((month, monthIndex) => (
                  <div key={`month-${month.label}-${monthIndex}`} className="flex flex-col items-center gap-2">
                    <span className="text-[11px] text-slate-500">{month.label}</span>
                    <div className="grid grid-cols-5 gap-1">
                      {month.days.map((day) => (
                        <div
                          key={day.key}
                          className={`h-2.5 w-2.5 rounded-[3px] ${activityCellClass(day.count)}`}
                          title={`${day.key}: ${day.count} session${day.count === 1 ? "" : "s"}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">Activity for the last 12 months.</p>
          </CardContent>
        </Card>

        <Dialog open={Boolean(preview)} onOpenChange={() => setPreview(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{preview?.title}</DialogTitle>
            </DialogHeader>
            {preview?.url ? (
              <iframe title={preview.title} src={preview.url} className="w-full h-[70vh] rounded-md" />
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
