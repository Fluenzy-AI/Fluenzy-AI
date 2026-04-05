// src/app/api/job-search/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getSessionRemaining } from "@/lib/jobs/sessionTracker";
import { canSearchJobs } from "@/lib/jobs/planGate";
import { UserPlan, PLAN_LIMITS } from "@/types/jobs";

function mapPlanToUserPlan(plan: string): UserPlan {
  const planMap: Record<string, UserPlan> = {
    'Free': 'free',
    'Pro': 'pro',
    'Standard': 'standard',
    'Premium': 'standard',
    'Enterprise': 'standard',
    'LifetimeAccess': 'standard',
    'College': 'pro',
  };
  return planMap[plan] || 'free';
}

/**
 * GET /api/job-search/session
 * Returns current session usage for the user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const plan = mapPlanToUserPlan(user.plan);
    const canSearch = canSearchJobs(plan);
    const sessionInfo = await getSessionRemaining(session.user.id, plan);

    return NextResponse.json({
      plan,
      canSearch,
      sessionsUsed: sessionInfo.used,
      sessionsRemaining: sessionInfo.remaining,
      sessionsLimit: sessionInfo.limit,
      features: {
        aiMatching: PLAN_LIMITS[plan].aiMatching,
        maxJobs: PLAN_LIMITS[plan].maxJobs,
        maxSaved: PLAN_LIMITS[plan].maxSaved,
      },
    });
  } catch (error) {
    console.error("[Session] Error:", error);
    return NextResponse.json({ error: "Failed to get session info" }, { status: 500 });
  }
}
