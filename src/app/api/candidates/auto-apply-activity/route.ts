/**
 * GET /api/candidates/auto-apply-activity
 * Returns auto-apply activity log (skipped, applied, failed jobs)
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCandidateSession } from "@/lib/candidate-auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getCandidateSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status"); // APPLIED, SKIPPED, FAILED

    // Build query
    const where: any = {
      candidateId: session.id,
    };
    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await prisma.autoApplyLog.count({ where });

    // Get logs with job and company details
    const logs = await prisma.autoApplyLog.findMany({
      where,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    return NextResponse.json({
      success: true,
      logs,
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
