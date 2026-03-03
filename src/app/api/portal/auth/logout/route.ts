/**
 * Portal Logout API
 * POST /api/portal/auth/logout
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PORTAL_ACCESS_COOKIE, PORTAL_REFRESH_COOKIE, verifyRefreshToken } from "@/lib/portal-auth";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get(PORTAL_REFRESH_COOKIE)?.value;

    if (refreshToken) {
      // Revoke refresh token in DB
      await prisma.portalRefreshToken.deleteMany({ where: { token: refreshToken } });

      const decoded = verifyRefreshToken(refreshToken);
      if (decoded) {
        await prisma.portalAuditLog.create({
          data: {
            staffId: decoded.staffId,
            actorEmail: decoded.email,
            actorRole: decoded.role,
            action: "LOGOUT",
            ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          },
        });
      }
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete(PORTAL_ACCESS_COOKIE);
    response.cookies.delete(PORTAL_REFRESH_COOKIE);
    return response;
  } catch {
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
