/**
 * Portal Audit Logs API
 * GET /api/portal/audit-logs  - Accessible by SUPER_ADMIN via NextAuth + ADMIN via portal token
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  // Allow SUPER_ADMIN via NextAuth OR ADMIN via portal JWT
  let authorized = false;
  const portalDecoded = getPortalAuthFromRequest(req);
  if (portalDecoded?.role === "ADMIN") authorized = true;

  if (!authorized) {
    const session = await getServerSession(authOptions);
    // @ts-expect-error role
    if (session?.user?.role === "SUPER_ADMIN") authorized = true;
  }

  if (!authorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "30");
  const staffId = searchParams.get("staffId");
  const action = searchParams.get("action");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where = {
    ...(staffId ? { staffId } : {}),
    ...(action ? { action: { contains: action, mode: "insensitive" as const } } : {}),
    ...(from || to ? {
      createdAt: {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      },
    } : {}),
  };

  const [total, logs] = await Promise.all([
    prisma.portalAuditLog.count({ where }),
    prisma.portalAuditLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { staff: { select: { name: true, email: true, role: true } } },
    }),
  ]);

  return NextResponse.json({ logs, total, page, limit, totalPages: Math.ceil(total / limit) });
}
