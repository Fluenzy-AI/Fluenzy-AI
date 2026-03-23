/**
 * Company Portal Login API
 * POST /api/company/auth/login
 * Body: { email, password }
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import {
  generateCompanyAccessToken,
  generateCompanyRefreshToken,
  COMPANY_ACCESS_COOKIE,
  COMPANY_REFRESH_COOKIE,
  CompanyTokenPayload,
  isWorkEmail,
} from "@/lib/company-auth";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid credentials format" }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const lowerEmail = email.toLowerCase();

    // Validate work email
    const emailCheck = isWorkEmail(email);
    if (!emailCheck.valid) {
      return NextResponse.json(
        { error: "Please use your work email to login." },
        { status: 400 }
      );
    }

    const member = await prisma.companyMember.findUnique({
      where: { email: lowerEmail },
      include: {
        company: {
          select: { id: true, name: true, slug: true, domain: true, status: true },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Check company status
    if (member.company.status === "SUSPENDED") {
      return NextResponse.json({ error: "Your company account has been suspended. Please contact support." }, { status: 403 });
    }

    // Check member status
    if (member.status === "SUSPENDED") {
      return NextResponse.json({ error: "Your account has been suspended. Contact your company admin." }, { status: 403 });
    }
    if (member.status === "PENDING") {
      return NextResponse.json({ error: "Your account is pending approval. Contact your company admin." }, { status: 403 });
    }

    // Check lock
    if (member.lockedUntil && member.lockedUntil > new Date()) {
      const minutes = Math.ceil((member.lockedUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Account locked. Try again in ${minutes} minutes.` },
        { status: 423 }
      );
    }

    const isValid = await bcrypt.compare(password, member.password);

    if (!isValid) {
      const newAttempts = (member.loginAttempts || 0) + 1;
      const shouldLock = newAttempts >= MAX_ATTEMPTS;

      await prisma.companyMember.update({
        where: { id: member.id },
        data: {
          loginAttempts: newAttempts,
          ...(shouldLock ? { lockedUntil: new Date(Date.now() + LOCK_DURATION_MS) } : {}),
        },
      });

      if (shouldLock) {
        return NextResponse.json({ error: "Too many failed attempts. Account locked for 30 minutes." }, { status: 423 });
      }
      return NextResponse.json(
        { error: `Invalid email or password. ${MAX_ATTEMPTS - newAttempts} attempts remaining.` },
        { status: 401 }
      );
    }

    // Success: reset attempts and generate tokens
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

    await prisma.companyMember.update({
      where: { id: member.id },
      data: {
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
        avatar: member.avatar,
      },
    });

    response.cookies.set(COMPANY_ACCESS_COOKIE, accessToken, { ...cookieOpts, maxAge: 60 * 15 });
    response.cookies.set(COMPANY_REFRESH_COOKIE, refreshToken, { ...cookieOpts, maxAge: 60 * 60 * 24 * 7 });

    return response;
  } catch (err) {
    console.error("[COMPANY_LOGIN]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
