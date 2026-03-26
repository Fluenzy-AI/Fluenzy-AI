/**
 * Company Job API
 * PATCH/DELETE /api/company/jobs/[id]
 * Update or delete a specific job
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCompanyRoles } from "@/lib/company-auth";

/**
 * GET /api/company/jobs/[id]
 * Get a specific job's details
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireCompanyRoles(req, ["ADMIN", "HR_RECRUITER", "HIRING_MANAGER"]);
    if (!authResult.authorized || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const job = await prisma.externalJob.findFirst({
      where: {
        id: id,
        companyId: authResult.company.id,
      },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      job: {
        ...job,
        applicationsCount: job._count.applications,
      },
    });
  } catch (error) {
    console.error("[COMPANY_JOB_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/company/jobs/[id]
 * Update a job (toggle active status, update details)
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireCompanyRoles(req, ["ADMIN", "HR_RECRUITER", "HIRING_MANAGER"]);
    if (!authResult.authorized || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify job belongs to company
    const existingJob = await prisma.externalJob.findFirst({
      where: {
        id: id,
        companyId: authResult.company.id,
      },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const body = await req.json();
    const { isActive, title, department, location, city, employmentType, description, requirements, responsibilities, skills, experienceYears, salaryMin, salaryMax, autoApplyEnabled } = body;

    const job = await prisma.externalJob.update({
      where: { id: id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(title !== undefined && { title }),
        ...(department !== undefined && { department }),
        ...(location !== undefined && { location }),
        ...(city !== undefined && { city }),
        ...(employmentType !== undefined && { employmentType }),
        ...(description !== undefined && { description }),
        ...(requirements !== undefined && { requirements }),
        ...(responsibilities !== undefined && { responsibilities }),
        ...(skills !== undefined && { skills }),
        ...(experienceYears !== undefined && { experienceYears }),
        ...(salaryMin !== undefined && { salaryMin }),
        ...(salaryMax !== undefined && { salaryMax }),
        ...(autoApplyEnabled !== undefined && { autoApplyEnabled }),
      },
    });

    return NextResponse.json({ job });
  } catch (error) {
    console.error("[COMPANY_JOB_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/company/jobs/[id]
 * Delete a job posting
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Only ADMIN can delete jobs
    const authResult = await requireCompanyRoles(req, ["ADMIN"]);
    if (!authResult.authorized || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify job belongs to company
    const existingJob = await prisma.externalJob.findFirst({
      where: {
        id: id,
        companyId: authResult.company.id,
      },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Delete associated applications first (or use cascading delete if configured)
    await prisma.externalJobApplication.deleteMany({
      where: { jobId: id },
    });

    // Delete the job
    await prisma.externalJob.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[COMPANY_JOB_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
