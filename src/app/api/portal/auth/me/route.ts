/**
 * GET /api/portal/auth/me - Get current portal user info
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";

export async function GET(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const staff = await prisma.portalStaff.findUnique({
    where: { id: decoded.staffId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      department: true,
      phone: true,
      avatar: true,
      permissions: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  if (!staff || staff.status !== "ACTIVE") {
    return NextResponse.json({ error: "Account not found or inactive" }, { status: 404 });
  }

  return NextResponse.json({ user: staff });
}
