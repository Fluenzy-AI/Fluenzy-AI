/**
 * HR Portal - Job Applications
 * GET /api/portal/hr/job-applications  - List all applications (HR/Admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";

export async function GET(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: Record<string, unknown> = {
    ...(jobId ? { jobId } : {}),
    ...(status ? { status: status as string } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, applications] = await Promise.all([
    prisma.jobApplication.count({ where }),
    prisma.jobApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        job: { select: { title: true, slug: true, department: true } },
      },
    }),
  ]);

  // Stats
  const stats = await prisma.jobApplication.groupBy({
    by: ["status"],
    _count: true,
    where: jobId ? { jobId } : {},
  });

  // All active jobs for filter dropdown
  const jobs = await prisma.job.findMany({
    select: { id: true, title: true, department: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ applications, total, page, stats, jobs });
}
