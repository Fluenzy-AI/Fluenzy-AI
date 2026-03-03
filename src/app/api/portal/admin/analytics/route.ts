/**
 * Admin Portal - Analytics Dashboard
 * GET /api/portal/admin/analytics
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";

export async function GET(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (decoded.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const now = new Date();
    const thisMonth = { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    const last30Days = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };

    const [
      totalUsers,
      newUsersThisMonth,
      activeSubscriptions,
      totalRevenue,
      ticketsByStatus,
      openTickets,
      recentPayments,
      usersByPlan,
      totalEmails,
      failedEmails,
      featureToggles,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.users.count({ where: { disabled: false } }),
      prisma.users.count({ where: { createdAt: thisMonth } }),
      prisma.subscriptions.count({ where: { status: "active" } }),
      prisma.paymentHistory.aggregate({
        where: { status: "paid", date: last30Days },
        _sum: { finalAmount: true },
      }),
      prisma.supportTicket.groupBy({ by: ["status"], _count: { id: true } }),
      prisma.supportTicket.count({ where: { status: "OPEN" } }),
      prisma.paymentHistory.findMany({
        where: { status: "paid" },
        take: 10,
        orderBy: { date: "desc" },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.users.groupBy({ by: ["plan"], _count: { id: true } }),
      prisma.portalEmailLog.count(),
      prisma.portalEmailLog.count({ where: { status: "FAILED" } }),
      prisma.featureToggle.findMany({ take: 20 }),
      prisma.portalAuditLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { staff: { select: { name: true, email: true, role: true } } },
      }),
    ]);

    return NextResponse.json({
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
        activeSubscriptions,
        byPlan: usersByPlan.map(p => ({ plan: p.plan, count: p._count.id })),
      },
      revenue: {
        last30Days: totalRevenue._sum.finalAmount || 0,
        recentPayments,
      },
      tickets: {
        total: ticketsByStatus.reduce((acc, t) => acc + t._count.id, 0),
        open: openTickets,
        byStatus: ticketsByStatus.map(t => ({ status: t.status, count: t._count.id })),
      },
      emails: {
        total: totalEmails,
        failed: failedEmails,
        successRate: totalEmails > 0 ? (((totalEmails - failedEmails) / totalEmails) * 100).toFixed(1) : "100",
      },
      featureToggles: featureToggles.map(ft => ({ key: ft.key, label: ft.label, enabled: ft.enabled })),
      recentActivity: recentAuditLogs,
    });
  } catch (err) {
    console.error("[ADMIN_ANALYTICS]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
