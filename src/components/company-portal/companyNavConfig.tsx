"use client";

import React from "react";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Users,
  Calendar,
  CheckSquare,
  ScanFace,
  Award,
  BarChart3,
  UserCheck,
  Settings,
  Mail,
  History,
} from "lucide-react";

export type NavSection =
  | "WORKSPACE"
  | "RECRUITMENT"
  | "INSIGHTS"
  | "ORGANIZATION"
  | "COMMUNICATION";

export interface CompanyNavItem {
  id: string;
  label: string;
  href: string;
  aliases?: string[];
  icon: React.ReactNode;
  section: NavSection;
  adminOnly?: boolean;
  badge?: number;
}

export const COMPANY_NAV_SECTIONS: { id: NavSection; title: string }[] = [
  { id: "WORKSPACE", title: "WORKSPACE" },
  { id: "RECRUITMENT", title: "RECRUITMENT" },
  { id: "INSIGHTS", title: "INSIGHTS" },
  { id: "ORGANIZATION", title: "ORGANIZATION" },
  { id: "COMMUNICATION", title: "COMMUNICATION" },
];

export const COMPANY_NAV_ITEMS: CompanyNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/company/portal",
    icon: <LayoutDashboard className="w-4 h-4" />,
    section: "WORKSPACE",
  },
  {
    id: "jobs",
    label: "Job Postings",
    href: "/company/portal/jobs",
    aliases: ["/company/portal/jobs/new"],
    icon: <Briefcase className="w-4 h-4" />,
    section: "RECRUITMENT",
  },
  {
    id: "applications",
    label: "Applications",
    href: "/company/portal/applications",
    icon: <FileText className="w-4 h-4" />,
    section: "RECRUITMENT",
  },
  {
    id: "candidates",
    label: "Candidates",
    href: "/company/portal/candidates",
    icon: <Users className="w-4 h-4" />,
    section: "RECRUITMENT",
  },
  {
    id: "interviews",
    label: "Interviews",
    href: "/company/portal/interviews",
    icon: <Calendar className="w-4 h-4" />,
    section: "RECRUITMENT",
  },
  {
    id: "assessments",
    label: "Assessments",
    href: "/company/portal/assessments",
    aliases: ["/company/portal/assessments/new"],
    icon: <CheckSquare className="w-4 h-4" />,
    section: "RECRUITMENT",
  },
  {
    id: "hirelens",
    label: "HireLens AI",
    href: "/company/portal/hirelens",
    aliases: ["/company/portal/hirelens/setup", "/company/portal/hirelens/hardware"],
    icon: <ScanFace className="w-4 h-4" />,
    section: "RECRUITMENT",
  },
  {
    id: "certificates",
    label: "Certificates",
    href: "/company/portal/certificates",
    icon: <Award className="w-4 h-4" />,
    section: "RECRUITMENT",
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/company/portal/analytics",
    icon: <BarChart3 className="w-4 h-4" />,
    section: "INSIGHTS",
  },
  {
    id: "team",
    label: "Team & Permissions",
    href: "/company/portal/team",
    icon: <UserCheck className="w-4 h-4" />,
    section: "ORGANIZATION",
    adminOnly: true,
  },
  {
    id: "settings",
    label: "Company Settings",
    href: "/company/portal/settings",
    aliases: [
      "/company/portal/settings/company",
      "/company/portal/settings/branding",
      "/company/portal/settings/hiring",
      "/company/portal/settings/hirelens",
      "/company/portal/settings/billing",
      "/company/portal/settings/api",
    ],
    icon: <Settings className="w-4 h-4" />,
    section: "ORGANIZATION",
    adminOnly: true,
  },
  {
    id: "send-email",
    label: "Send Email",
    href: "/company/portal/send-email",
    icon: <Mail className="w-4 h-4" />,
    section: "COMMUNICATION",
  },
  {
    id: "email-history",
    label: "Email History",
    href: "/company/portal/email-history",
    icon: <History className="w-4 h-4" />,
    section: "COMMUNICATION",
  },
];

export function isCompanyNavItemActive(pathname: string, item: CompanyNavItem): boolean {
  if (!pathname) return false;
  const cleanPath = pathname.replace(/\/$/, "");
  const cleanHref = item.href.replace(/\/$/, "");

  if (item.id === "dashboard") {
    return cleanPath === "/company/portal";
  }

  if (cleanPath === cleanHref) return true;

  if (item.aliases && item.aliases.some((alias) => cleanPath === alias.replace(/\/$/, ""))) {
    return true;
  }

  if (cleanHref !== "/company/portal" && cleanPath.startsWith(cleanHref + "/")) {
    return true;
  }

  return false;
}

export function getPageTitleFromPath(pathname: string): string {
  if (!pathname) return "Company Portal";
  const cleanPath = pathname.replace(/\/$/, "");

  for (const item of COMPANY_NAV_ITEMS) {
    if (isCompanyNavItemActive(cleanPath, item)) {
      if (cleanPath === "/company/portal/jobs/new") return "Post New Job";
      if (cleanPath.startsWith("/company/portal/jobs/")) return "Job Details";
      if (cleanPath.startsWith("/company/portal/assessments/new")) return "Create Assessment";
      if (cleanPath.startsWith("/company/portal/settings/")) return `Company Settings — ${item.label}`;
      return item.label;
    }
  }

  return "Company Portal";
}
