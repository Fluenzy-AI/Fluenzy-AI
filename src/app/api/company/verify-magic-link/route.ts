/**
 * Company Magic Link Verification API
 * POST /api/company/verify-magic-link
 * Body: { token }
 *
 * Verifies the magic link token and logs in the user.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import {
  generateCompanyAccessToken,
  generateCompanyRefreshToken,
  COMPANY_ACCESS_COOKIE,
  COMPANY_REFRESH_COOKIE,
  CompanyTokenPayload,
} from "@/lib/company-auth";
import { z } from "zod";

const VerifySchema = z.object({
  token: z.string().min(1),
});

const MAGIC_LINK_SECRET = process.env.COMPANY_MAGIC_LINK_SECRET || process.env.NEXTAUTH_SECRET! + "_magic";

interface MagicLinkPayload {
  memberId: string;
  email: string;
  companyId: string;
  type: "magic_link";
  iat: number;
  exp: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = VerifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const { token } = parsed.data;

    // Verify JWT token
    let payload: MagicLinkPayload;
    try {
      payload = jwt.verify(token, MAGIC_LINK_SECRET) as MagicLinkPayload;
    } catch {
      return NextResponse.json({ error: "Invalid or expired magic link." }, { status: 401 });
    }

    if (payload.type !== "magic_link") {
      return NextResponse.json({ error: "Invalid token type." }, { status: 401 });
    }

    // Find the member and verify token matches
    const member = await prisma.companyMember.findUnique({
      where: { id: payload.memberId },
      include: {
        company: {
          select: { id: true, name: true, slug: true, status: true },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    // Verify the token matches what's stored (prevents token reuse after it's been used)
    if (member.magicLinkToken !== token) {
      return NextResponse.json({ error: "Magic link has already been used or is invalid." }, { status: 401 });
    }

    // Check expiry
    if (member.magicLinkExpiry && member.magicLinkExpiry < new Date()) {
      return NextResponse.json({ error: "Magic link has expired." }, { status: 401 });
    }

    // Check company status
    if (member.company.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Your company account has been suspended." },
        { status: 403 }
      );
    }

    // Check member status
    if (member.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Your account has been suspended." },
        { status: 403 }
      );
    }
    if (member.status === "PENDING") {
      return NextResponse.json(
        { error: "Your account is pending approval." },
        { status: 403 }
      );
    }

    // Success: clear magic link token and generate session tokens
    const tokenPayload: CompanyTokenPayload = {
      memberId: member.id,
      email: member.email,
      companyId: member.company.id,
      companySlug: member.company.slug,
      companyName: member.company.name,
      role: member.role as "ADMIN" | "HIRING_MANAGER" | "HR_RECRUITER",
      name: member.name,
    };

    const accessToken = generateCompanyAccessToken(tokenPayload);
    const refreshToken = generateCompanyRefreshToken(tokenPayload);

    // Update member: clear magic link, set refresh token, reset login attempts
    await prisma.companyMember.update({
      where: { id: member.id },
      data: {
        magicLinkToken: null,
        magicLinkExpiry: null,
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        refreshToken,
      },
    });

    const isProduction = process.env.NODE_ENV === "production";
    const cookieOpts = {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax" as const,
      path: "/",
    };

    const response = NextResponse.json({
      success: true,
      company: {
        id: member.company.id,
        name: member.company.name,
        slug: member.company.slug,
      },
      user: {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
      },
    });

    response.cookies.set(COMPANY_ACCESS_COOKIE, accessToken, { ...cookieOpts, maxAge: 60 * 15 });
    response.cookies.set(COMPANY_REFRESH_COOKIE, refreshToken, { ...cookieOpts, maxAge: 60 * 60 * 24 * 7 });

    return response;
  } catch (err) {
    console.error("[VERIFY_MAGIC_LINK]", err);
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 500 });
  }
}
