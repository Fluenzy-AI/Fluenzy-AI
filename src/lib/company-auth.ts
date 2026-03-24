/**
 * Company Portal JWT Authentication Library
 * Handles JWT creation, verification and cookie management for External Company Portal
 * Separate from internal portal-auth and candidate-auth systems
 */

import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import prisma from "./prisma";

const ACCESS_SECRET = process.env.COMPANY_JWT_SECRET || process.env.NEXTAUTH_SECRET!;
const REFRESH_SECRET = process.env.COMPANY_JWT_REFRESH_SECRET || process.env.NEXTAUTH_SECRET! + "_company_refresh";
const ACCESS_EXPIRY = "15m";
const REFRESH_EXPIRY = "7d";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CompanyTokenPayload {
  memberId: string;
  email: string;
  companyId: string;
  companySlug: string;
  companyName: string;
  role: "ADMIN" | "HIRING_MANAGER" | "HR_RECRUITER";
  name: string;
}

export interface DecodedCompanyToken extends CompanyTokenPayload {
  iat: number;
  exp: number;
}

export type CompanyRole = "ADMIN" | "HIRING_MANAGER" | "HR_RECRUITER";

// ── Token Generation ─────────────────────────────────────────────────────────

export function generateCompanyAccessToken(payload: CompanyTokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
}

export function generateCompanyRefreshToken(payload: CompanyTokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
}

// ── Token Verification ───────────────────────────────────────────────────────

export function verifyCompanyAccessToken(token: string): DecodedCompanyToken | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as DecodedCompanyToken;
  } catch {
    return null;
  }
}

export function verifyCompanyRefreshToken(token: string): DecodedCompanyToken | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as DecodedCompanyToken;
  } catch {
    return null;
  }
}

// ── Cookie Helpers ───────────────────────────────────────────────────────────

export const COMPANY_ACCESS_COOKIE = "company_access_token";
export const COMPANY_REFRESH_COOKIE = "company_refresh_token";

export function setCompanyCookies(
  accessToken: string,
  refreshToken: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cookieStore?: any
) {
  const isProduction = process.env.NODE_ENV === "production";
  const opts = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
  };

  if (cookieStore) {
    cookieStore.set(COMPANY_ACCESS_COOKIE, accessToken, { ...opts, maxAge: 60 * 15 });
    cookieStore.set(COMPANY_REFRESH_COOKIE, refreshToken, { ...opts, maxAge: 60 * 60 * 24 * 7 });
  }
}

export function clearCompanyCookies(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cookieStore?: any
) {
  if (cookieStore) {
    cookieStore.delete(COMPANY_ACCESS_COOKIE);
    cookieStore.delete(COMPANY_REFRESH_COOKIE);
  }
}

// ── Request Auth Extraction ──────────────────────────────────────────────────

export function getCompanyAuthFromRequest(req: NextRequest): DecodedCompanyToken | null {
  // 1. Try cookie
  const cookieToken = req.cookies.get(COMPANY_ACCESS_COOKIE)?.value;
  if (cookieToken) {
    const decoded = verifyCompanyAccessToken(cookieToken);
    if (decoded) return decoded;
  }

  // 2. Try Authorization header
  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    return verifyCompanyAccessToken(token);
  }

  return null;
}

// Get full company member data from database
export async function getCompanyMemberFromRequest(
  req: NextRequest
): Promise<{
  id: string;
  email: string;
  name: string;
  role: CompanyRole;
  companyId: string;
  company: { id: string; name: string; slug: string; domain: string };
} | null> {
  const decoded = getCompanyAuthFromRequest(req);
  if (!decoded) return null;

  const member = await prisma.companyMember.findUnique({
    where: { id: decoded.memberId, status: "ACTIVE" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      companyId: true,
      company: {
        select: { id: true, name: true, slug: true, domain: true },
      },
    },
  });

  if (!member || member.company.slug !== decoded.companySlug) return null;

  return member as {
    id: string;
    email: string;
    name: string;
    role: CompanyRole;
    companyId: string;
    company: { id: string; name: string; slug: string; domain: string };
  };
}

// ── Route Guards ─────────────────────────────────────────────────────────────

// Overload 1: Async pattern for route handlers with NextRequest
export function requireCompanyRoles(
  req: NextRequest,
  roles: CompanyRole[]
): Promise<{
  authorized: boolean;
  error?: string;
  member?: {
    id: string;
    email: string;
    name: string;
    role: CompanyRole;
    companyId: string;
    company: { id: string; name: string; slug: string; domain: string };
  };
  company?: { id: string; name: string; slug: string; domain: string };
}>;

// Overload 2: Curried pattern for manual token validation
export function requireCompanyRoles(
  ...roles: CompanyRole[]
): (
  decoded: DecodedCompanyToken | null
) => {
  authorized: boolean;
  error?: string;
};

// Implementation
export function requireCompanyRoles(
  reqOrRole?: NextRequest | CompanyRole,
  ...rest: CompanyRole[]
): any {
  // If first argument is NextRequest, it's the async pattern
  if (reqOrRole instanceof NextRequest) {
    return requireCompanyRolesAsync(reqOrRole, rest || []);
  }

  // Otherwise it's the curried pattern - collect all role arguments
  const roles = [reqOrRole as CompanyRole, ...rest].filter(
    (r): r is CompanyRole => typeof r === "string"
  );

  return function (decoded: DecodedCompanyToken | null) {
    if (!decoded)
      return { authorized: false, error: "Unauthorized: not authenticated" };
    if (!roles.includes(decoded.role)) {
      return {
        authorized: false,
        error: `Forbidden: requires one of [${roles.join(", ")}]`,
      };
    }
    return { authorized: true };
  };
}

async function requireCompanyRolesAsync(
  req: NextRequest,
  roles: CompanyRole[]
): Promise<{
  authorized: boolean;
  error?: string;
  member?: {
    id: string;
    email: string;
    name: string;
    role: CompanyRole;
    companyId: string;
    company: { id: string; name: string; slug: string; domain: string };
  };
  company?: { id: string; name: string; slug: string; domain: string };
}> {
  const member = await getCompanyMemberFromRequest(req);
  if (!member) {
    return { authorized: false, error: "Unauthorized: not authenticated" };
  }
  if (!roles.includes(member.role)) {
    return {
      authorized: false,
      error: `Forbidden: requires one of [${roles.join(", ")}]`,
    };
  }
  return { authorized: true, member, company: member.company };
}

// ── Work Email Validation ────────────────────────────────────────────────────

const BLOCKED_DOMAINS = [
  // Gmail & Google
  "gmail.com",
  "googlemail.com",
  // Microsoft
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  // Yahoo
  "yahoo.com",
  "ymail.com",
  // Apple
  "icloud.com",
  "me.com",
  "mac.com",
  // Other popular
  "protonmail.com",
  "proton.me",
  "zoho.com",
  "aol.com",
  "mail.com",
  "gmx.com",
  "gmx.net",
  // India specific
  "rediffmail.com",
  "rediff.com",
  // Temporary/disposable
  "tempmail.com",
  "guerrillamail.com",
  "mailinator.com",
  "10minutemail.com",
  "throwaway.email",
];

export function isWorkEmail(email: string): { valid: boolean; domain: string; error?: string } {
  const parts = email.toLowerCase().split("@");
  if (parts.length !== 2) {
    return { valid: false, domain: "", error: "Invalid email format" };
  }

  const domain = parts[1];

  // Must have at least one dot in domain
  if (!domain.includes(".")) {
    return { valid: false, domain, error: "Invalid domain format" };
  }

  // Check against blocked domains
  if (BLOCKED_DOMAINS.includes(domain)) {
    return {
      valid: false,
      domain,
      error: "Personal email addresses are not allowed. Please use your work email.",
    };
  }

  return { valid: true, domain };
}

// ── Helper: Extract domain from email ────────────────────────────────────────

export function extractDomain(email: string): string {
  const parts = email.toLowerCase().split("@");
  return parts.length === 2 ? parts[1] : "";
}

// ── Helper: Generate company slug from name ──────────────────────────────────

export function generateCompanySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

// ── Helper: Generate unique slug by checking database ────────────────────────

export async function generateUniqueCompanySlug(name: string): Promise<string> {
  const baseSlug = generateCompanySlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.company.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing) break;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

// ── Helper: Generate OTP ─────────────────────────────────────────────────────

export function generateOtp(length: number = 6): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

// ── Auto-apply limit by plan ─────────────────────────────────────────────────

export function getAutoApplyLimitByPlan(plan: string): number {
  switch (plan) {
    case "Free":
      return 0; // Manual only
    case "Standard":
      return 150;
    case "Pro":
      return 30; // High-quality targeted
    case "Enterprise":
      return 999999;
    default:
      return 0;
  }
}

export function getSkillMatchThresholdByPlan(plan: string): number {
  switch (plan) {
    case "Standard":
      return 60; // 60% skill match
    case "Pro":
      return 80; // 80% skill match (higher quality)
    default:
      return 100; // No auto-apply
  }
}
