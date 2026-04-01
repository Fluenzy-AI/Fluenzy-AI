/**
 * Portal JWT Authentication Library
 * Handles JWT creation, verification and cookie management for HR/Admin Portal
 * Separate from the main NextAuth system
 */

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const ACCESS_SECRET = process.env.PORTAL_ACCESS_SECRET || process.env.NEXTAUTH_SECRET!;
const REFRESH_SECRET = process.env.PORTAL_REFRESH_SECRET || process.env.NEXTAUTH_SECRET! + "_refresh";
const ACCESS_EXPIRY = "15m";
const REFRESH_EXPIRY = "7d";

export interface PortalTokenPayload {
  staffId: string;
  email: string;
  role: "ADMIN" | "HR" | "MARKETING_ADMIN";
  name: string;
  permissions?: Record<string, boolean>;
}

export interface DecodedPortalToken extends PortalTokenPayload {
  iat: number;
  exp: number;
}

// ── Token Generation ────────────────────────────────────────────────────────

export function generateAccessToken(payload: PortalTokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
}

export function generateRefreshToken(payload: PortalTokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
}

// ── Token Verification ──────────────────────────────────────────────────────

export function verifyAccessToken(token: string): DecodedPortalToken | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as DecodedPortalToken;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): DecodedPortalToken | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as DecodedPortalToken;
  } catch {
    return null;
  }
}

// ── Cookie Helpers ──────────────────────────────────────────────────────────

export const PORTAL_ACCESS_COOKIE = "portal_access_token";
export const PORTAL_REFRESH_COOKIE = "portal_refresh_token";

export function setPortalCookies(
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
    cookieStore.set(PORTAL_ACCESS_COOKIE, accessToken, { ...opts, maxAge: 60 * 15 });
    cookieStore.set(PORTAL_REFRESH_COOKIE, refreshToken, { ...opts, maxAge: 60 * 60 * 24 * 7 });
  }
}

export function clearPortalCookies(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cookieStore?: any
) {
  if (cookieStore) {
    cookieStore.delete(PORTAL_ACCESS_COOKIE);
    cookieStore.delete(PORTAL_REFRESH_COOKIE);
  }
}

// ── Request Auth Extraction ─────────────────────────────────────────────────

export function getPortalAuthFromRequest(req: NextRequest): DecodedPortalToken | null {
  // 1. Try cookie
  const cookieToken = req.cookies.get(PORTAL_ACCESS_COOKIE)?.value;
  if (cookieToken) {
    const decoded = verifyAccessToken(cookieToken);
    if (decoded) return decoded;
  }

  // 2. Try Authorization header
  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    return verifyAccessToken(token);
  }

  return null;
}

// ── Route Guards ────────────────────────────────────────────────────────────

export type PortalRole = "ADMIN" | "HR" | "MARKETING_ADMIN" | "SUPER_ADMIN";

export function requirePortalRoles(...roles: PortalRole[]) {
  return function (decoded: DecodedPortalToken | null): {
    authorized: boolean;
    error?: string;
  } {
    if (!decoded) return { authorized: false, error: "Unauthorized: not authenticated" };
    if (!roles.includes(decoded.role as PortalRole)) {
      return { authorized: false, error: `Forbidden: requires one of [${roles.join(", ")}]` };
    }
    return { authorized: true };
  };
}
