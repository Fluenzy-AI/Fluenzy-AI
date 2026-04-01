/**
 * Marketing Email Logs API
 * GET - List email logs with filters
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

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");
    const campaignId = searchParams.get("campaignId");
    const email = searchParams.get("email");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (campaignId) {
      where.campaignId = campaignId;
    }

    if (email) {
      where.recipientEmail = { contains: email, mode: "insensitive" };
    }

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }

    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }

    const [logs, total, statusCounts] = await Promise.all([
      prisma.marketingEmailLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          campaignId: true,
          userId: true,
          recipientEmail: true,
          recipientName: true,
          senderEmail: true,
          subject: true,
          status: true,
          messageId: true,
          sentAt: true,
          openedAt: true,
          clickedAt: true,
          bouncedAt: true,
          unsubscribedAt: true,
          bounceReason: true,
          failureReason: true,
          retryCount: true,
          triggerName: true,
          createdAt: true,
          campaign: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.marketingEmailLog.count({ where }),
      // Get status breakdown for filters
      prisma.marketingEmailLog.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    // Format status counts
    const statusBreakdown: Record<string, number> = {};
    statusCounts.forEach((sc) => {
      statusBreakdown[sc.status] = sc._count;
    });

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      statusBreakdown,
    });
  } catch (error) {
    console.error("Email logs fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch email logs" },
      { status: 500 }
    );
  }
}
