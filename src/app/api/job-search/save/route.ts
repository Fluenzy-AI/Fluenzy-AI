// src/app/api/job-search/save/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canSaveMore } from "@/lib/jobs/planGate";
import { UserPlan } from "@/types/jobs";

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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { job } = await req.json();
    if (!job?.id) {
      return NextResponse.json({ error: "Invalid job data" }, { status: 400 });
    }

    const user = await prisma.users.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const plan = mapPlanToUserPlan(user.plan);
    const savedCount = await prisma.jobSearchSaved.count({ 
      where: { userId: session.user.id } 
    });

    if (!canSaveMore(plan, savedCount)) {
      return NextResponse.json({ 
        error: "Save limit reached. Upgrade your plan." 
      }, { status: 403 });
    }

    const saved = await prisma.jobSearchSaved.upsert({
      where: { userId_jobId: { userId: session.user.id, jobId: job.id } },
      create: { userId: session.user.id, jobId: job.id, jobData: job },
      update: {},
    });

    return NextResponse.json({ success: true, saved });
  } catch (error) {
    console.error("Save job error:", error);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await req.json();
    await prisma.jobSearchSaved.deleteMany({ 
      where: { userId: session.user.id, jobId } 
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unsave job error:", error);
    return NextResponse.json({ error: "Unsave failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const saved = await prisma.jobSearchSaved.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ jobs: saved.map(s => s.jobData) });
  } catch (error) {
    console.error("Get saved jobs error:", error);
    return NextResponse.json({ error: "Failed to get saved jobs" }, { status: 500 });
  }
}
