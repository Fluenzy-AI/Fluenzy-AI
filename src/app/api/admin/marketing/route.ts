/**
 * Marketing Dashboard API
 * GET - Get marketing analytics overview
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkMarketingAuth, unauthorizedResponse } from "@/lib/marketing-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await checkMarketingAuth(req);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    // Get date range (last 30 days by default)
    const searchParams = req.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get total stats
    const [
      totalCampaigns,
      activeCampaigns,
      totalEmailsSent,
      totalUsers,
      recentCampaigns,
      emailStats,
    ] = await Promise.all([
      // Total campaigns
      prisma.marketingCampaign.count(),
      
      // Active campaigns (sending or scheduled)
      prisma.marketingCampaign.count({
        where: {
          status: { in: ["sending", "scheduled"] },
        },
      }),

      // Total emails sent in period
      prisma.marketingEmailLog.count({
        where: {
          sentAt: { gte: startDate },
          status: { not: "queued" },
        },
      }),

      // Total users
      prisma.users.count({
        where: { disabled: false },
      }),

      // Recent campaigns
      prisma.marketingCampaign.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          subject: true,
          status: true,
          totalSent: true,
          totalOpened: true,
          totalClicked: true,
          createdAt: true,
          sentAt: true,
        },
      }),

      // Email stats aggregation
      prisma.marketingEmailLog.groupBy({
        by: ["status"],
        where: {
          createdAt: { gte: startDate },
        },
        _count: true,
      }),
    ]);

    // Calculate email metrics
    const statusCounts: Record<string, number> = {};
    emailStats.forEach((stat) => {
      statusCounts[stat.status] = stat._count;
    });

    const totalDelivered = (statusCounts.delivered || 0) + (statusCounts.opened || 0) + (statusCounts.clicked || 0);
    const totalOpened = (statusCounts.opened || 0) + (statusCounts.clicked || 0);
    const totalClicked = statusCounts.clicked || 0;
    const totalBounced = statusCounts.bounced || 0;
    const totalUnsubscribed = statusCounts.unsubscribed || 0;

    // Calculate rates
    const deliveryRate = totalEmailsSent > 0 ? (totalDelivered / totalEmailsSent) * 100 : 0;
    const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
    const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
    const bounceRate = totalEmailsSent > 0 ? (totalBounced / totalEmailsSent) * 100 : 0;
    const unsubscribeRate = totalDelivered > 0 ? (totalUnsubscribed / totalDelivered) * 100 : 0;

    // Get daily email stats for chart
    const dailyStats = await prisma.marketingEmailLog.groupBy({
      by: ["sentAt"],
      where: {
        sentAt: { gte: startDate },
        status: { not: "queued" },
      },
      _count: true,
      orderBy: {
        sentAt: "asc",
      },
    });

    // Process daily stats into chart format
    const chartData: Array<{ date: string; sent: number; opened: number; clicked: number }> = [];
    const dateMap = new Map<string, { sent: number; opened: number; clicked: number }>();

    // Initialize all dates in range
    for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      dateMap.set(dateStr, { sent: 0, opened: 0, clicked: 0 });
    }

    // Aggregate by date (need separate queries for accurate stats)
    const dailySent = await prisma.marketingEmailLog.groupBy({
      by: ["sentAt"],
      where: {
        sentAt: { gte: startDate },
      },
      _count: true,
    });

    dailySent.forEach((stat) => {
      if (stat.sentAt) {
        const dateStr = stat.sentAt.toISOString().split("T")[0];
        const existing = dateMap.get(dateStr) || { sent: 0, opened: 0, clicked: 0 };
        existing.sent += stat._count;
        dateMap.set(dateStr, existing);
      }
    });

    dateMap.forEach((value, key) => {
      chartData.push({ date: key, ...value });
    });

    // Get segment summary
    const segments = await prisma.userSegment.findMany({
      take: 5,
      orderBy: { userCount: "desc" },
      select: {
        id: true,
        name: true,
        userCount: true,
      },
    });

    // Get active triggers
    const activeTriggers = await prisma.automationTrigger.count({
      where: { isActive: true },
    });

    // Get unsubscribed users count
    const unsubscribedUsers = await prisma.emailPreferences.count({
      where: { unsubscribed: true },
    });

    return NextResponse.json({
      overview: {
        totalCampaigns,
        activeCampaigns,
        totalEmailsSent,
        totalUsers,
        activeTriggers,
        unsubscribedUsers,
      },
      metrics: {
        deliveryRate: deliveryRate.toFixed(2),
        openRate: openRate.toFixed(2),
        clickRate: clickRate.toFixed(2),
        bounceRate: bounceRate.toFixed(2),
        unsubscribeRate: unsubscribeRate.toFixed(2),
      },
      statusBreakdown: {
        sent: totalEmailsSent,
        delivered: totalDelivered,
        opened: totalOpened,
        clicked: totalClicked,
        bounced: totalBounced,
        unsubscribed: totalUnsubscribed,
      },
      recentCampaigns,
      chartData,
      segments,
    });
  } catch (error) {
    console.error("Marketing dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch marketing analytics" },
      { status: 500 }
    );
  }
}
