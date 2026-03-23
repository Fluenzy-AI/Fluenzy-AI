/**
 * Monthly Quota Reset Cron Job
 * POST /api/cron/reset-quotas
 *
 * This endpoint should be called on the 1st of each month
 * to reset all candidates' auto-apply counters to 0.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Verify cron secret to prevent unauthorized calls
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Reset all auto-apply counts to 0
    const result = await prisma.candidateJobPreferences.updateMany({
      where: {
        autoApplyCount: { gt: 0 },
      },
      data: {
        autoApplyCount: 0,
      },
    });

    // Log the reset
    console.log(`[CRON_RESET_QUOTAS] Reset ${result.count} candidates' auto-apply counts at ${now.toISOString()}`);

    return NextResponse.json({
      success: true,
      message: `Reset auto-apply quotas for ${result.count} candidates`,
      resetCount: result.count,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("[CRON_RESET_QUOTAS]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/cron/reset-quotas",
    description: "Monthly quota reset cron job endpoint",
    schedule: "Should run on 1st of each month at 00:00 UTC",
  });
}
