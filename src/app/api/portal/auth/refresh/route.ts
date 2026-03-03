/**
 * Portal Token Refresh API
 * POST /api/portal/auth/refresh
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  PORTAL_ACCESS_COOKIE,
  PORTAL_REFRESH_COOKIE,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "@/lib/portal-auth";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get(PORTAL_REFRESH_COOKIE)?.value;
    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
    }

    // Verify it exists in DB (not revoked)
    const dbToken = await prisma.portalRefreshToken.findUnique({ where: { token: refreshToken } });
    if (!dbToken || dbToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "Refresh token revoked or expired" }, { status: 401 });
    }

    // Check staff still active
    const staff = await prisma.portalStaff.findUnique({ where: { id: decoded.staffId } });
    if (!staff || staff.status !== "ACTIVE") {
      await prisma.portalRefreshToken.delete({ where: { token: refreshToken } });
      return NextResponse.json({ error: "Account is not active" }, { status: 403 });
    }

    const payload = {
      staffId: staff.id,
      email: staff.email,
      role: staff.role as "ADMIN" | "HR",
      name: staff.name,
      permissions: staff.permissions as Record<string, boolean> | undefined,
    };

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    // Rotate: delete old, create new
    await prisma.portalRefreshToken.delete({ where: { token: refreshToken } });
    await prisma.portalRefreshToken.create({
      data: {
        staffId: staff.id,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: req.headers.get("x-forwarded-for") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      },
    });

    const isProduction = process.env.NODE_ENV === "production";
    const cookieOpts = { httpOnly: true, secure: isProduction, sameSite: "lax" as const, path: "/" };
    const response = NextResponse.json({ success: true });
    response.cookies.set(PORTAL_ACCESS_COOKIE, newAccessToken, { ...cookieOpts, maxAge: 60 * 15 });
    response.cookies.set(PORTAL_REFRESH_COOKIE, newRefreshToken, { ...cookieOpts, maxAge: 60 * 60 * 24 * 7 });

    return response;
  } catch {
    return NextResponse.json({ error: "Token refresh failed" }, { status: 500 });
  }
}
