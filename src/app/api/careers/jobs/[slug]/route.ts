/**
 * Careers - Single Job
 * GET    /api/careers/jobs/[slug]   - Get job by slug (public)
 * PATCH  /api/careers/jobs/[slug]   - Update job (HR/Admin)
 * DELETE /api/careers/jobs/[slug]   - Delete job (HR/Admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;

  const job = await prisma.job.findUnique({
    where: { slug },
    include: { _count: { select: { applications: true } } },
  });

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
