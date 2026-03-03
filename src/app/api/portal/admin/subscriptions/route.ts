/**
 * Admin Portal - Subscriptions API
 * GET /api/portal/admin/subscriptions
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
  const status = searchParams.get("status");
  const plan = searchParams.get("plan");
  const search = searchParams.get("search") || "";

  const where = {
    ...(status ? { status } : {}),
    ...(plan ? { plan: plan as "Free" | "Pro" | "Standard" } : {}),
    ...(search ? {
      user: {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      },
    } : {}),
  };

  const [total, subscriptions] = await Promise.all([
    prisma.subscriptions.count({ where }),
    prisma.subscriptions.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, plan: true } },
      },
    }),
  ]);

  // Summary stats
  const [activeCount, cancelledCount, totalRevenue] = await Promise.all([
    prisma.subscriptions.count({ where: { status: "active" } }),
    prisma.subscriptions.count({ where: { status: "cancelled" } }),
    prisma.subscriptions.aggregate({ _sum: { amount: true } }),
  ]);

  return NextResponse.json({
    subscriptions, total, page, limit,
    totalPages: Math.ceil(total / limit),
    stats: {
      active: activeCount,
      cancelled: cancelledCount,
      totalRevenue: totalRevenue._sum.amount || 0,
    },
  });
}
