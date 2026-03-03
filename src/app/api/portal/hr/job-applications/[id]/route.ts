/**
 * HR Portal - Single Job Application
 * PATCH  /api/portal/hr/job-applications/[id]  - Update status / notes
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";
import { z } from "zod";

const UpdateSchema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "SHORTLISTED", "REJECTED", "HIRED"]).optional(),
  notes: z.string().max(2000).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const decoded = getPortalAuthFromRequest(_req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const app = await prisma.jobApplication.findUnique({
    where: { id },
    include: { job: true },
  });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ application: app });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.jobApplication.update({
    where: { id },
    data: { ...parsed.data, updatedAt: new Date() },
    include: { job: { select: { title: true } } },
  });

  return NextResponse.json({ success: true, application: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const decoded = getPortalAuthFromRequest(_req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.jobApplication.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
