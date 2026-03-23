/**
 * Company Portal - Refresh Token
 * POST /api/company/auth/refresh
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyCompanyRefreshToken,
  generateCompanyAccessToken,
  generateCompanyRefreshToken,
  COMPANY_ACCESS_COOKIE,
  COMPANY_REFRESH_COOKIE,
  CompanyTokenPayload,
} from "@/lib/company-auth";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get(COMPANY_REFRESH_COOKIE)?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    const decoded = verifyCompanyRefreshToken(refreshToken);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
    }

    // Verify the refresh token matches what's stored in DB
    const member = await prisma.companyMember.findUnique({
      where: { id: decoded.memberId, status: "ACTIVE" },
      include: {
        company: {
          select: { id: true, name: true, slug: true, domain: true, status: true },
        },
      },
    });

    if (!member || member.refreshToken !== refreshToken) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    if (member.company.status === "SUSPENDED") {
      return NextResponse.json({ error: "Company account suspended" }, { status: 403 });
    }

    // Generate new tokens
    const tokenPayload: CompanyTokenPayload = {
      memberId: member.id,
      email: member.email,
      companyId: member.company.id,
      companySlug: member.company.slug,
      companyName: member.company.name,
      role: member.role as "ADMIN" | "HIRING_MANAGER" | "HR_RECRUITER",
      name: member.name,
    };

    const newAccessToken = generateCompanyAccessToken(tokenPayload);
    const newRefreshToken = generateCompanyRefreshToken(tokenPayload);

    // Update refresh token in DB
    await prisma.companyMember.update({
      where: { id: member.id },
      data: { refreshToken: newRefreshToken },
    });

    const isProduction = process.env.NODE_ENV === "production";
    const cookieOpts = {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax" as const,
      path: "/",
    };

    const response = NextResponse.json({ success: true });

    response.cookies.set(COMPANY_ACCESS_COOKIE, newAccessToken, { ...cookieOpts, maxAge: 60 * 15 });
    response.cookies.set(COMPANY_REFRESH_COOKIE, newRefreshToken, { ...cookieOpts, maxAge: 60 * 60 * 24 * 7 });

    return response;
  } catch (err) {
    console.error("[COMPANY_REFRESH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
