/**
 * Careers - Single Job
 * GET    /api/careers/jobs/[slug]   - Get job by slug (public, supports internal & external company jobs)
 * PATCH  /api/careers/jobs/[slug]   - Update job (HR/Admin)
 * DELETE /api/careers/jobs/[slug]   - Delete job (HR/Admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;

  // 1. Try finding internal Fluenzy job first
  let job: any = await prisma.job.findUnique({
    where: { slug },
    include: { _count: { select: { applications: true } } },
  });

  // 2. If not internal, try finding external company job by slug
  if (!job) {
    const ext = await prisma.externalJob.findFirst({
      where: { slug },
      include: {
        company: {
          select: { name: true, slug: true, logoUrl: true, description: true, industry: true, size: true },
        },
        _count: { select: { applications: true } },
      },
    });

    if (ext) {
      job = {
        id: ext.id,
        title: ext.title,
        slug: ext.slug,
        department: ext.department,
        location: ext.location,
        employmentType: ext.employmentType,
        experienceLevel: ext.experienceYears || "0-1 years",
        experienceYears: ext.experienceYears,
        salaryRange:
          ext.salaryMin || ext.salaryMax
            ? `₹${ext.salaryMin || ""} - ₹${ext.salaryMax || ""}`
            : undefined,
        description: ext.description,
        responsibilities: ext.responsibilities || [],
        requirements: ext.requirements || [],
        skills: ext.skills || [],
        benefits: [],
        isActive: ext.isActive,
        postedAt: ext.createdAt.toISOString(),
        createdAt: ext.createdAt.toISOString(),
        isExternal: true,
        company: ext.company,
        _count: { applications: ext._count?.applications || 0 },
      };
    }
  }

  if (!job || !job.isActive) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  return NextResponse.json({ job });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const body = await req.json();

  const job = await prisma.job.findUnique({ where: { slug } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.job.update({
    where: { slug },
    data: { ...body, updatedAt: new Date() },
  });

  return NextResponse.json({ success: true, job: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const decoded = getPortalAuthFromRequest(_req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;

  await prisma.job.delete({ where: { slug } });
  return NextResponse.json({ success: true });
}
