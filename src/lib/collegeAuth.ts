import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "./prisma";

const COLLEGE_JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret";

export interface CollegeJWTPayload {
  collegeAdminId: string;
  email: string;
  domain: string;
  collegeName: string;
  iat?: number;
  exp?: number;
}

export function signCollegeToken(payload: Omit<CollegeJWTPayload, "iat" | "exp">): string {
  return jwt.sign(payload, COLLEGE_JWT_SECRET, { expiresIn: "7d" });
}

export function verifyCollegeToken(token: string): CollegeJWTPayload | null {
  try {
    return jwt.verify(token, COLLEGE_JWT_SECRET) as CollegeJWTPayload;
  } catch {
    return null;
  }
}

export async function getCollegeAdminFromRequest(
  req: NextRequest
): Promise<{ id: string; email: string; domain: string; collegeName: string } | null> {
  const authHeader = req.headers.get("authorization");
  const cookieToken = req.cookies.get("college_token")?.value;

  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : cookieToken;

  if (!token) return null;

  const payload = verifyCollegeToken(token);
  if (!payload) return null;

  const admin = await prisma.collegeAdmin.findUnique({
    where: { id: payload.collegeAdminId, status: "APPROVED" },
    select: { id: true, email: true, domain: true, collegeName: true },
  });

  return admin;
}

// Block personal email domains
const BLOCKED_DOMAINS = [
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com",
  "icloud.com", "protonmail.com", "zoho.com", "aol.com",
  "live.com", "msn.com", "rediffmail.com", "ymail.com",
];

export function isInstitutionalEmail(email: string): { valid: boolean; domain: string } {
  const parts = email.split("@");
  if (parts.length !== 2) return { valid: false, domain: "" };
  const domain = parts[1].toLowerCase();
  if (BLOCKED_DOMAINS.includes(domain)) return { valid: false, domain };
  // Must have at least one dot in domain
  if (!domain.includes(".")) return { valid: false, domain };
  return { valid: true, domain };
}
