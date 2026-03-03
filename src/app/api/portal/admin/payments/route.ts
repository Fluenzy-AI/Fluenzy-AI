/**
 * Admin Portal - Payment Logs API
 * GET /api/portal/admin/payments
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
  const search = searchParams.get("search") || "";

  const where = {
    ...(status ? { status } : {}),
    ...(search ? {
      user: {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      },
    } : {}),
  };

  const [total, payments, stats] = await Promise.all([
    prisma.paymentHistory.count({ where }),
    prisma.paymentHistory.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.paymentHistory.aggregate({
      _sum: { finalAmount: true },
      _count: { id: true },
      where: { status: "paid" },
    }),
  ]);

  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  const revenue30d = await prisma.paymentHistory.aggregate({
    _sum: { finalAmount: true },
    where: { status: "paid", date: { gte: last30Days } },
  });

  return NextResponse.json({
    payments, total, page, limit,
    totalPages: Math.ceil(total / limit),
    stats: {
      totalRevenue: stats._sum.finalAmount || 0,
      totalTransactions: stats._count.id,
      revenue30d: revenue30d._sum.finalAmount || 0,
    },
  });
}
