/**
 * Careers - Job Listings
 * GET  /api/careers/jobs  - List all active jobs (public)
 * POST /api/careers/jobs  - Create job (HR/Admin only via portal JWT)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";
import { z } from "zod";

const JobSchema = z.object({
  title: z.string().min(3),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  department: z.string().min(2),
  location: z.enum(["REMOTE", "HYBRID", "ONSITE"]).default("REMOTE"),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]).default("FULL_TIME"),
  description: z.string().min(20),
  requirements: z.array(z.string()),
  responsibilities: z.array(z.string()),
  skills: z.array(z.string()),
  experienceYears: z.string(),
  salaryRange: z.string().optional(),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const department = searchParams.get("department");
  const location = searchParams.get("location");
  const type = searchParams.get("type");
  const search = searchParams.get("search");
  const all = searchParams.get("all") === "true"; // HR/Admin: include inactive

  // Check if request is from HR/admin (optional — include inactive)
  const decoded = getPortalAuthFromRequest(req);
  const isPortal = !!decoded;

  const where: Record<string, unknown> = {
    ...(!isPortal || !all ? { isActive: true } : {}),
    ...(department ? { department } : {}),
    ...(location ? { location: location as "REMOTE" | "HYBRID" | "ONSITE" } : {}),
    ...(type ? { employmentType: type as "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { department: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const jobs = await prisma.job.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      department: true,
      location: true,
      employmentType: true,
      experienceYears: true,
      salaryRange: true,
      skills: true,
      isActive: true,
      createdAt: true,
      _count: { select: { applications: true } },
    },
  });

  // Extract unique departments/locations for filters
  const meta = {
    departments: [...new Set(jobs.map((j) => j.department))],
    locations: [...new Set(jobs.map((j) => j.location))],
  };

  return NextResponse.json({ jobs, meta, total: jobs.length });
}

export async function POST(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = JobSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });

  // Check slug uniqueness
  const existing = await prisma.job.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });

  const job = await prisma.job.create({
    data: { ...parsed.data, createdBy: decoded.email },
  });

  return NextResponse.json({ success: true, job }, { status: 201 });
}
