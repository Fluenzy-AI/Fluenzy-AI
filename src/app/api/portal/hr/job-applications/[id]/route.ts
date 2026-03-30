/**
 * HR Portal - Single Job Application
 * PATCH  /api/portal/hr/job-applications/[id]  - Update status / notes
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";
import { getPublicFileUrl } from "@/lib/file-url-helper";
import { z } from "zod";

const UpdateSchema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "SHORTLISTED", "INTERVIEW_SCHEDULED", "REJECTED", "HIRED"]).optional(),
  notes: z.string().max(2000).optional(),
  interviewDate: z.string().optional().nullable(), // ISO date string or null
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
  
  // Convert resumeUrl from fileKey to CDN URL for lifetime access
  const appWithCdnUrl = {
    ...app,
    resumeUrl: app.resumeUrl ? await getPublicFileUrl(app.resumeUrl, { usePublicCDN: true }) : null,
  };
  
  return NextResponse.json({ application: appWithCdnUrl });
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
    data: {
      ...(parsed.data.status && { status: parsed.data.status }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
      ...(parsed.data.interviewDate !== undefined && {
        interviewDate: parsed.data.interviewDate ? new Date(parsed.data.interviewDate) : null,
        status: parsed.data.status || (parsed.data.interviewDate ? "INTERVIEW_SCHEDULED" : undefined),
      }),
      updatedAt: new Date(),
    },
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
