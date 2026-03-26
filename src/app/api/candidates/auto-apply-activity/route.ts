/**
 * GET /api/candidates/auto-apply-activity
 * Returns auto-apply activity log (skipped, applied, failed jobs)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const action = searchParams.get("action") || searchParams.get("status"); // APPLIED, SKIPPED, FAILED
    const period = searchParams.get("period") || '7days'; // '1day', '7days', '30days', 'all'

    // Build date filter
    let dateFilter: Date | undefined;
    const now = new Date();

    switch (period) {
      case '1day':
        dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7days':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        dateFilter = undefined;
        break;
    }

    // Build query - support both old and new column names
    const where: any = {
      OR: [
        { candidateId: session.user.id }, // Old structure
        { userId: session.user.id },      // New structure
      ],
    };

    if (action && action !== 'all') {
      // Support both 'status' and 'action' column names
      where.OR = where.OR.map((condition: any) => ({
        ...condition,
        AND: [
          condition,
          {
            OR: [
              { status: action },
              { action: action }
            ]
          }
        ]
      }));
    }

    if (dateFilter) {
      // Support both 'createdAt' and 'timestamp' column names
      const dateCondition = {
        OR: [
          { createdAt: { gte: dateFilter } },
          { timestamp: { gte: dateFilter } }
        ]
      };
      where.OR = where.OR.map((condition: any) => ({
        ...condition.AND?.[0] || condition,
        AND: [
          ...(condition.AND || [condition]),
          dateCondition
        ]
      }));
    }

    // Get total count
    const total = await prisma.autoApplyLog.count({ where }).catch(() => 0);

    // Get logs (no relations in schema, just IDs)
    const logs = await prisma.autoApplyLog.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      take: limit,
      skip: offset,
    }).catch(() => []);

    // Calculate statistics
    const allActivities = await prisma.autoApplyLog.findMany({
      where: {
        candidateId: session.user.id,
      },
      select: {
        status: true,
        createdAt: true,
      },
    }).catch(() => []);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const stats = {
      totalProcessed: allActivities.length,
      applied: allActivities.filter(a => a.status === 'APPLIED').length,
      skipped: allActivities.filter(a => a.status === 'SKIPPED').length,
      failed: allActivities.filter(a => a.status === 'FAILED').length,
      todayActivity: allActivities.filter(a =>
        a.createdAt >= todayStart
      ).length,
    };

    // Format the response - simplified without relations (they don't exist in schema)
    const formattedActivities = logs.map((log) => ({
      id: log.id,
      jobId: log.jobId,
      companyId: log.companyId,
      jobTitle: 'Job Details', // Relations not available in schema
      companyName: 'Company Details', // Relations not available in schema
      companyLogo: null,
      location: 'N/A',
      salary: null,
      action: log.status,
      reason: log.failureReason,
      timestamp: log.createdAt.toISOString(),
      appliedAt: log.appliedAt?.toISOString(),
      matchScore: null,
      jobUrl: null,
    }));

    return NextResponse.json({
      success: true,
      activities: formattedActivities, // Use 'activities' for consistency with frontend
      logs: formattedActivities, // Keep 'logs' for backward compatibility
      stats,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[AUTO_APPLY_ACTIVITY]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
