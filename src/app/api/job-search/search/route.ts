// src/app/api/job-search/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { searchJobs } from "@/lib/jobs/jobService";
import { canConsumeSession, consumeSession } from "@/lib/jobs/sessionTracker";
import { canSearchJobs } from "@/lib/jobs/planGate";
import { UserPlan, PLAN_LIMITS } from "@/types/jobs";

// Map database plan enum to UserPlan type
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

export async function GET(req: NextRequest) {
  try {
    // Step 1: Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    // Step 2: Get user and plan
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      include: { jobSearchResume: true },
    });

    if (!user) {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
    }

    const plan = mapPlanToUserPlan(user.plan);

    // Step 3: ENFORCE SESSION LIMIT BEFORE ANYTHING ELSE
    if (!canSearchJobs(plan)) {
      return NextResponse.json({
        error: "SESSION_LIMIT_REACHED",
        message: "Free plan doesn't include job searches. Please upgrade.",
        upgradeRequired: true,
        plan,
        sessionsRemaining: 0,
        sessionsUsed: 0,
        sessionsLimit: 0,
      }, { status: 403 });
    }

    const sessionCheck = await canConsumeSession(session.user.id, plan);
    if (!sessionCheck.allowed) {
      return NextResponse.json({
        error: "SESSION_LIMIT_REACHED",
        message: "Daily search limit reached. Please upgrade your plan.",
        upgradeRequired: true,
        plan,
        sessionsRemaining: 0,
        sessionsUsed: sessionCheck.used,
        sessionsLimit: sessionCheck.limit,
      }, { status: 429 });
    }

    // Step 4: Parse search params
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim();
    const location = searchParams.get("location")?.trim() || "";
    const experienceLevel = searchParams.get("experience_level") || "all";
    const jobType = searchParams.get("job_type") || "all";
    const workMode = searchParams.get("work_mode") || "all";

    if (!query) {
      return NextResponse.json({
        error: "MISSING_PARAMS",
        message: "Search query is required",
      }, { status: 400 });
    }

    console.log(`[Search] User: ${user.email}, Plan: ${plan}`);
    console.log(`[Search] Query: "${query}", Location: "${location}", Type: ${jobType}, Mode: ${workMode}`);

    // Step 5: Run job search (cache → fetch → dedupe → match)
    const userSkills = user.jobSearchResume?.skills ?? [];
    
    const results = await searchJobs({
      query,
      location,
      jobType,
      experienceLevel,
      workMode,
      plan,
      userSkills,
    });

    // Step 6: Consume session ONLY after successful search
    const consumeResult = await consumeSession(session.user.id, plan);

    // Step 7: Save search to history with job results (30 days retention)
    try {
      await prisma.jobSearchHistory.create({
        data: {
          userId: session.user.id,
          query,
          location: location || null,
          jobType: jobType !== "all" ? jobType : null,
          workMode: workMode !== "all" ? workMode : null,
          resultsCount: results.jobs.length,
          fromCache: results.fromCache,
          jobs: results.jobs as any, // Save actual job results
        },
      });
      console.log(`[Search] Saved ${results.jobs.length} jobs to history`);
    } catch (historyError) {
      // Don't fail the request if history save fails
      console.warn("[Search] Failed to save search history:", historyError);
    }

    console.log(`[Search] Success - ${results.jobs.length} jobs, fromCache: ${results.fromCache}`);

    return NextResponse.json({
      success: true,
      jobs: results.jobs,
      total: results.jobs.length,
      fromCache: results.fromCache,
      sessionsRemaining: consumeResult.remaining,
      sessionsUsed: sessionCheck.used + 1,
      sessionsLimit: PLAN_LIMITS[plan].sessions,
      plan,
    });
  } catch (error: any) {
    console.error("[Search] Fatal error:", error);
    
    return NextResponse.json({
      error: "SEARCH_FAILED",
      message: error.message || "Job search failed. Please try again.",
    }, { status: 500 });
  }
}
