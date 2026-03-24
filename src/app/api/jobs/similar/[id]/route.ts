/**
 * GET /api/jobs/similar/[id]
 * Returns similar jobs based on company or skills
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the current job
    const currentJob = await prisma.externalJob.findUnique({
      where: { id },
      select: {
        id: true,
        companyId: true,
        skills: true,
        department: true,
      },
    });

    if (!currentJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Find similar jobs:
    // 1. Same company (different job)
    // 2. Similar skills
    // 3. Same department

    const similarJobs = await prisma.externalJob.findMany({
      where: {
        id: { not: id },
        isActive: true,
        OR: [
          // Same company
          { companyId: currentJob.companyId },
          // Similar skills (at least one matching skill)
          { skills: { hasSome: currentJob.skills } },
          // Same department
          { department: currentJob.department },
        ],
      },
      take: 3,
      orderBy: [
        // Prioritize same company
        { companyId: currentJob.companyId ? "asc" : "desc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        title: true,
        slug: true,
        location: true,
        employmentType: true,
        skills: true,
        salaryMin: true,
        salaryMax: true,
        createdAt: true,
        company: {
          select: {
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ jobs: similarJobs });
  } catch (error) {
    console.error("[SIMILAR_JOBS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
