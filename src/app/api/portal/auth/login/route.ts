/**
 * Portal Login API
 * POST /api/portal/auth/login
 * Body: { email, password }
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  generateAccessToken,
  generateRefreshToken,
  PORTAL_ACCESS_COOKIE,
  PORTAL_REFRESH_COOKIE,
} from "@/lib/portal-auth";
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
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

    const staff = await prisma.portalStaff.findUnique({ where: { email: email.toLowerCase() } });

    if (!staff) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Check account status
    if (staff.status === "SUSPENDED") {
      return NextResponse.json({ error: "Account suspended. Contact Super Admin." }, { status: 403 });
    }
    if (staff.status === "INACTIVE") {
      return NextResponse.json({ error: "Account is inactive. Contact Super Admin." }, { status: 403 });
    }

    // Check lock
    if (staff.lockedUntil && staff.lockedUntil > new Date()) {
      const minutes = Math.ceil((staff.lockedUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Account locked. Try again in ${minutes} minutes.` },
        { status: 423 }
      );
    }

    const isValid = await bcrypt.compare(password, staff.password);

    if (!isValid) {
      const newAttempts = (staff.loginAttempts || 0) + 1;
      const shouldLock = newAttempts >= MAX_ATTEMPTS;

      await prisma.portalStaff.update({
        where: { id: staff.id },
        data: {
          loginAttempts: newAttempts,
          ...(shouldLock ? { lockedUntil: new Date(Date.now() + LOCK_DURATION_MS) } : {}),
        },
      });

      // Audit log
      await prisma.portalAuditLog.create({
        data: {
          staffId: staff.id,
          actorEmail: email,
          actorRole: staff.role,
          action: "LOGIN_FAILED",
          metadata: { attempts: newAttempts, ip },
          ipAddress: ip,
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

    // Success: reset attempts
    const tokenPayload = {
      staffId: staff.id,
      email: staff.email,
      role: staff.role as "ADMIN" | "HR" | "MARKETING_ADMIN",
      name: staff.name,
      permissions: staff.permissions as Record<string, boolean> | undefined,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token in DB
    await prisma.portalRefreshToken.create({
      data: {
        staffId: staff.id,
        token: refreshToken,
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

    // Audit log: success
    await prisma.portalAuditLog.create({
      data: {
        staffId: staff.id,
        actorEmail: staff.email,
        actorRole: staff.role,
        action: "LOGIN_SUCCESS",
        metadata: { ip },
        ipAddress: ip,
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
      user: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        department: staff.department,
        avatar: staff.avatar,
        permissions: staff.permissions,
      },
    });

    response.cookies.set(PORTAL_ACCESS_COOKIE, accessToken, { ...cookieOpts, maxAge: 60 * 15 });
    response.cookies.set(PORTAL_REFRESH_COOKIE, refreshToken, { ...cookieOpts, maxAge: 60 * 60 * 24 * 7 });

    return response;
  } catch (err) {
    console.error("[PORTAL_LOGIN]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
