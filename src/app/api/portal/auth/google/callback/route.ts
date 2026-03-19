/**
 * Portal Google OAuth Callback
 * GET /api/portal/auth/google/callback
 * Exchanges code for user info, verifies staff existence, issues JWT cookies
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateAccessToken,
  generateRefreshToken,
  PORTAL_ACCESS_COOKIE,
  PORTAL_REFRESH_COOKIE,
} from "@/lib/portal-auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  let baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  // Remove trailing slash to prevent double slashes
  baseUrl = baseUrl.replace(/\/+$/, "");

  const loginUrl = `${baseUrl}/portal/login`;

  // User denied consent
  if (errorParam) {
    return NextResponse.redirect(`${loginUrl}?error=google_denied`);
  }

  // Validate state (CSRF)
  const savedState = req.cookies.get("portal_oauth_state")?.value;
  if (!state || state !== savedState) {
    return NextResponse.redirect(`${loginUrl}?error=invalid_state`);
  }

  if (!code) {
    return NextResponse.redirect(`${loginUrl}?error=no_code`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${loginUrl}?error=oauth_not_configured`);
  }

  const callbackUrl = `${baseUrl}/api/portal/auth/google/callback`;

  try {
    // 1. Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      console.error("[Google OAuth] Token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(`${loginUrl}?error=token_exchange_failed`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Get user info from Google
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoRes.ok) {
      return NextResponse.redirect(`${loginUrl}?error=userinfo_failed`);
    }

    const googleUser = await userInfoRes.json();
    const email: string = (googleUser.email || "").toLowerCase();

    if (!email) {
      return NextResponse.redirect(`${loginUrl}?error=no_email`);
    }

    // 3. Look up in PortalStaff
    const staff = await prisma.portalStaff.findUnique({ where: { email } });

    if (!staff) {
      // Not a registered HR/Admin — redirect with specific error
      return NextResponse.redirect(`${loginUrl}?error=not_staff&email=${encodeURIComponent(email)}`);
    }

    if (staff.status === "SUSPENDED") {
      return NextResponse.redirect(`${loginUrl}?error=suspended`);
    }
    if (staff.status === "INACTIVE") {
      return NextResponse.redirect(`${loginUrl}?error=inactive`);
    }

    // 4. Issue JWT cookies (same logic as password login)
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

    const tokenPayload = {
      staffId: staff.id,
      email: staff.email,
      role: staff.role as "ADMIN" | "HR",
      name: staff.name,
      permissions: staff.permissions as Record<string, boolean> | undefined,
    };

    const jwtAccess = generateAccessToken(tokenPayload);
    const jwtRefresh = generateRefreshToken(tokenPayload);

    await prisma.portalRefreshToken.create({
      data: {
        staffId: staff.id,
        token: jwtRefresh,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: ip,
        userAgent: req.headers.get("user-agent") || undefined,
      },
    });

    await prisma.portalStaff.update({
      where: { id: staff.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      },
    });

    await prisma.portalAuditLog.create({
      data: {
        staffId: staff.id,
        actorEmail: staff.email,
        actorRole: staff.role,
        action: "LOGIN_SUCCESS",
        metadata: { ip, method: "google_oauth" },
        ipAddress: ip,
      },
    });

    // 5. Redirect to correct portal
    const destination =
      staff.role === "ADMIN" ? `${baseUrl}/portal/admin` : `${baseUrl}/portal/hr`;

    const isProduction = process.env.NODE_ENV === "production";
    const cookieOpts = {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax" as const,
      path: "/",
    };

    const response = NextResponse.redirect(destination);
    response.cookies.set(PORTAL_ACCESS_COOKIE, jwtAccess, { ...cookieOpts, maxAge: 60 * 15 });
    response.cookies.set(PORTAL_REFRESH_COOKIE, jwtRefresh, { ...cookieOpts, maxAge: 60 * 60 * 24 * 7 });
    // Clear the CSRF state cookie
    response.cookies.delete("portal_oauth_state");

    return response;
  } catch (err) {
    console.error("[Google OAuth Callback Error]", err);
    return NextResponse.redirect(`${loginUrl}?error=server_error`);
  }
}
