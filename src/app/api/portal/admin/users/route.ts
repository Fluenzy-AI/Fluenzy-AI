/**
 * Admin Portal - User Management API
 * GET  /api/portal/admin/users        - List all users
 * PATCH /api/portal/admin/users       - Bulk actions
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";

export async function GET(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded || decoded.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const plan = searchParams.get("plan");
  const disabled = searchParams.get("disabled");

  const where = {
    ...(search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
    ...(plan ? { plan: plan as "Free" | "Pro" | "Standard" } : {}),
    ...(disabled !== null && disabled !== undefined ? { disabled: disabled === "true" } : {}),
  };

  const [total, users] = await Promise.all([
    prisma.users.count({ where }),
    prisma.users.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        role: true,
        disabled: true,
        usageCount: true,
        usageLimit: true,
        createdAt: true,
        renewalDate: true,
        billingCycle: true,
        _count: { select: { paymentHistories: true, sessions: true } },
      },
    }),
  ]);

  return NextResponse.json({ users, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function PATCH(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded || decoded.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { userId, action } = await req.json();
    if (!userId || !action) return NextResponse.json({ error: "userId and action required" }, { status: 400 });

    if (action === "disable") {
      await prisma.users.update({ where: { id: userId }, data: { disabled: true } });
    } else if (action === "enable") {
      await prisma.users.update({ where: { id: userId }, data: { disabled: false } });
    } else if (action === "reset_usage") {
      await prisma.users.update({
        where: { id: userId },
        data: { usageCount: 0, englishUsage: 0, hrUsage: 0, gdUsage: 0, technicalUsage: 0, companyUsage: 0, mockUsage: 0, dailyUsage: 0 },
      });
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    await prisma.portalAuditLog.create({
      data: {
        staffId: decoded.staffId,
        actorEmail: decoded.email,
        actorRole: decoded.role,
        action: `USER_${action.toUpperCase()}`,
        entityType: "User",
        entityId: userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[ADMIN_USERS_PATCH]", err);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
