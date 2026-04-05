// src/app/api/job-search/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { job, status, notes } = await req.json();
    if (!job?.id) {
      return NextResponse.json({ error: "Invalid job data" }, { status: 400 });
    }

    const application = await prisma.jobSearchApplication.upsert({
      where: { userId_jobId: { userId: session.user.id, jobId: job.id } },
      create: {
        userId: session.user.id, 
        jobId: job.id, 
        jobData: job,
        status: status ?? "applied", 
        appliedAt: new Date(), 
        notes,
        matchScore: job.matchScore,
      },
      update: { 
        status, 
        notes, 
        appliedAt: status === "applied" ? new Date() : undefined 
      },
    });

    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error("Apply error:", error);
    return NextResponse.json({ error: "Application failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applications = await prisma.jobSearchApplication.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Get applications error:", error);
    return NextResponse.json({ error: "Failed to get applications" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, status, notes } = await req.json();
    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    const application = await prisma.jobSearchApplication.update({
      where: { userId_jobId: { userId: session.user.id, jobId } },
      data: { status, notes },
    });

    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error("Update application error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
