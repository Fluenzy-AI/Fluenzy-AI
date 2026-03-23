/**
 * Company Signup - Verify OTP
 * POST /api/company/verify-otp
 * Body: { email, otp }
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  generateCompanyAccessToken,
  generateCompanyRefreshToken,
  COMPANY_ACCESS_COOKIE,
  COMPANY_REFRESH_COOKIE,
  CompanyTokenPayload,
} from "@/lib/company-auth";

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = body as { email: string; otp: string };

    if (!email || !otp || otp.length !== 6) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase();

    const record = await prisma.companyOtp.findFirst({
      where: {
        email: lowerEmail,
        type: "company_signup",
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json(
        { error: "OTP has expired or does not exist. Please request a new one." },
        { status: 410 }
      );
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      await prisma.companyOtp.delete({ where: { id: record.id } });
      return NextResponse.json(
        { error: "Too many incorrect attempts. Please request a new OTP." },
        { status: 429 }
      );
    }

    if (record.otp !== otp.trim()) {
      await prisma.companyOtp.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      const remaining = MAX_ATTEMPTS - record.attempts - 1;
      return NextResponse.json(
        {
          error: `Incorrect OTP. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : "No attempts remaining."}`,
          attemptsRemaining: remaining,
        },
        { status: 400 }
      );
    }

    // Check if member was already created (race condition)
    const existingMember = await prisma.companyMember.findUnique({
      where: { email: lowerEmail },
    });

    if (existingMember) {
      await prisma.companyOtp.update({ where: { id: record.id }, data: { verified: true } });
      return NextResponse.json({ success: true, message: "Account already exists. Please login." });
    }

    const meta = record.pendingMeta as {
      companyName: string;
      companySlug: string;
      domain: string;
      orgType: string;
      memberRole: string;
      phone: string | null;
    };

    // Map memberRole to CompanyMemberRole enum
    const roleMap: Record<string, "ADMIN" | "HIRING_MANAGER" | "HR_RECRUITER"> = {
      "HR Recruiter": "HR_RECRUITER",
      "Hiring Manager": "HIRING_MANAGER",
      "Talent Acquisition Lead": "HIRING_MANAGER",
      "Admin / Founder": "ADMIN",
    };
    const role = roleMap[meta.memberRole] || "ADMIN";

    // Create Company and CompanyMember in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the company
      const company = await tx.company.create({
        data: {
          name: meta.companyName,
          slug: meta.companySlug,
          domain: meta.domain,
          industry: meta.orgType,
          status: "ACTIVE",
          verifiedAt: new Date(),
        },
      });

      // Create the first company member (owner/admin)
      // First signup from domain is always ADMIN
      const member = await tx.companyMember.create({
        data: {
          companyId: company.id,
          email: lowerEmail,
          name: record.pendingName ?? "",
          password: record.pendingPassword ?? "",
          role: "ADMIN", // First signup is always admin
          status: "ACTIVE",
          phone: meta.phone,
          joinedAt: new Date(),
        },
      });

      return { company, member };
    });

    // Mark OTP as verified
    await prisma.companyOtp.update({
      where: { id: record.id },
      data: { verified: true },
    });

    // Generate tokens and login the user
    const tokenPayload: CompanyTokenPayload = {
      memberId: result.member.id,
      email: result.member.email,
      companyId: result.company.id,
      companySlug: result.company.slug,
      companyName: result.company.name,
      role: "ADMIN",
      name: result.member.name,
    };

    const accessToken = generateCompanyAccessToken(tokenPayload);
    const refreshToken = generateCompanyRefreshToken(tokenPayload);

    // Store refresh token
    await prisma.companyMember.update({
      where: { id: result.member.id },
      data: { refreshToken, lastLoginAt: new Date() },
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
      message: "Company registered successfully! Welcome to Fluenzy AI Career Portal.",
      company: {
        id: result.company.id,
        name: result.company.name,
        slug: result.company.slug,
        domain: result.company.domain,
      },
      user: {
        id: result.member.id,
        name: result.member.name,
        email: result.member.email,
        role: result.member.role,
      },
    });

    response.cookies.set(COMPANY_ACCESS_COOKIE, accessToken, { ...cookieOpts, maxAge: 60 * 15 });
    response.cookies.set(COMPANY_REFRESH_COOKIE, refreshToken, { ...cookieOpts, maxAge: 60 * 60 * 24 * 7 });

    return response;
  } catch (error) {
    console.error("[company/verify-otp]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
