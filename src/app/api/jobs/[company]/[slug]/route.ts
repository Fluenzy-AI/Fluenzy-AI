/**
 * Public Job Detail API
 * GET /api/jobs/[company]/[slug] - Get job details
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ company: string; slug: string }> }
) {
  try {
    const { company: companySlug, slug: jobSlug } = await params;

    // Find company first
    const company = await prisma.company.findUnique({
      where: { slug: companySlug, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        logoUrl: true,
        website: true,
        description: true,
        industry: true,
        size: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Find job
    const job = await prisma.externalJob.findUnique({
      where: {
        companyId_slug: { companyId: company.id, slug: jobSlug },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        department: true,
        location: true,
        city: true,
        employmentType: true,
        description: true,
        requirements: true,
        responsibilities: true,
        skills: true,
        experienceYears: true,
        salaryMin: true,
        salaryMax: true,
        autoApplyEnabled: true,
        isActive: true,
        viewCount: true,
        createdAt: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (!job.isActive) {
      return NextResponse.json({ error: "This job posting is no longer active" }, { status: 410 });
    }

    // Increment view count
    await prisma.externalJob.update({
      where: { id: job.id },
      data: { viewCount: { increment: 1 } },
    });

    // Get similar jobs from same company
    const similarJobs = await prisma.externalJob.findMany({
      where: {
        companyId: company.id,
        isActive: true,
        id: { not: job.id },
      },
      take: 3,
      select: {
        id: true,
        title: true,
        slug: true,
        department: true,
        location: true,
        employmentType: true,
      },
    });

    return NextResponse.json({
      success: true,
      job: {
        ...job,
        createdAt: job.createdAt.toISOString(),
      },
      company,
      similarJobs,
    });
  } catch (error) {
    console.error("[PUBLIC_JOB_DETAIL]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
