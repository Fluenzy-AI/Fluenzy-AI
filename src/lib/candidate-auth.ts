/**
 * Candidate JWT Auth Helpers
 * Cookie: candidate_token (HTTP-only)
 * Secret: CANDIDATE_JWT_SECRET env var
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.CANDIDATE_JWT_SECRET || "candidate-fallback-secret-change-in-prod";
const COOKIE_NAME = "candidate_token";
const EXPIRES_IN = 7 * 24 * 60 * 60; // 7 days in seconds

export interface CandidateTokenPayload {
  id: string;
  email: string;
  name: string;
  role: "CANDIDATE";
}

export function signCandidateToken(payload: CandidateTokenPayload): string {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: EXPIRES_IN });
}

export function verifyCandidateToken(token: string): CandidateTokenPayload | null {
  try {
    return jwt.verify(token, SECRET_KEY) as CandidateTokenPayload;
  } catch {
    return null;
  }
}

/** Call from Server Component or API route (server-side) */
export async function getCandidateSession(): Promise<CandidateTokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyCandidateToken(token);
  } catch {
    return null;
  }
}

/** Call from API route handler (reads from request cookies) */
export function getCandidateFromRequest(req: NextRequest): CandidateTokenPayload | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyCandidateToken(token);
}

/** Set the cookie on a response */
export function setCandidateCookie(res: NextResponse, token: string): NextResponse {
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: EXPIRES_IN,
    path: "/",
  });
  return res;
}

/** Clear the cookie */
export function clearCandidateCookie(res: NextResponse): NextResponse {
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return res;
}

/** Calculate profile completion % */
export function calcProfileCompletion(profile: {
  phone?: string | null;
  education?: string | null;
  experience?: string | null;
  skills?: string[];
  resumeUrl?: string | null;
  linkedin?: string | null;
  portfolio?: string | null;
  address?: string | null;
}): number {
  const fields = [
    !!profile.phone,
    !!profile.education,
    !!profile.experience,
    (profile.skills?.length ?? 0) > 0,
    !!profile.resumeUrl,
    !!profile.linkedin,
    !!profile.portfolio,
    !!profile.address,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}