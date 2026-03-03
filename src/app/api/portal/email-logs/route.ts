/**
 * Portal Email Logs API
 * GET /api/portal/email-logs
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  let authorized = false;
  let staffId: string | undefined;
  let role: string | undefined;

  const portalDecoded = getPortalAuthFromRequest(req);
  if (portalDecoded) {
    authorized = true;
    staffId = portalDecoded.staffId;
    role = portalDecoded.role;
  }

  if (!authorized) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role === "SUPER_ADMIN") { authorized = true; role = "SUPER_ADMIN"; }
  }

  if (!authorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "30");
  const status = searchParams.get("status");

  const where = {
    // HR/Admin sees only their own emails
    ...(role === "HR" || role === "ADMIN" ? { staffId } : {}),
    ...(status ? { status: status as "PENDING" | "SENT" | "FAILED" | "RETRYING" } : {}),
  };

  const [total, logs] = await Promise.all([
    prisma.portalEmailLog.count({ where }),
    prisma.portalEmailLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        senderEmail: true,
        senderRole: true,
        recipientEmail: true,
        subject: true,
        status: true,
        retryCount: true,
        errorMsg: true,
        sentAt: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({ logs, total, page, limit, totalPages: Math.ceil(total / limit) });
}
