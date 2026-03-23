/**
 * Company Jobs API
 * GET /api/company/jobs - List company's jobs
 * POST /api/company/jobs - Create new job
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCompanyAuthFromRequest, requireCompanyRoles } from "@/lib/company-auth";
import { z } from "zod";

const CreateJobSchema = z.object({
  title: z.string().min(3).max(100),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/),
  department: z.string().min(2).max(50),
  location: z.enum(["REMOTE", "HYBRID", "ONSITE"]),
  city: z.string().optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]),
  description: z.string().min(50),
  requirements: z.array(z.string()),
  responsibilities: z.array(z.string()),
  skills: z.array(z.string()),
  experienceYears: z.string(),
  salaryMin: z.string().optional(),
  salaryMax: z.string().optional(),
  autoApplyEnabled: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const decoded = getCompanyAuthFromRequest(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = decoded;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // active, closed, all
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = { companyId };
    if (status === "active") where.isActive = true;
    else if (status === "closed") where.isActive = false;

    const [jobs, total] = await Promise.all([
      prisma.externalJob.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          department: true,
          location: true,
          city: true,
          employmentType: true,
          experienceYears: true,
          salaryMin: true,
          salaryMax: true,
          skills: true,
          isActive: true,
          autoApplyEnabled: true,
          viewCount: true,
          createdAt: true,
          _count: {
            select: { applications: true },
          },
        },
      }),
      prisma.externalJob.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      jobs: jobs.map((job) => ({
        ...job,
        applicationsCount: job._count.applications,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[COMPANY_JOBS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const decoded = getCompanyAuthFromRequest(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and HIRING_MANAGER can create jobs
    const roleCheck = requireCompanyRoles("ADMIN", "HIRING_MANAGER")(decoded);
    if (!roleCheck.authorized) {
      return NextResponse.json({ error: roleCheck.error }, { status: 403 });
    }

    const body = await req.json();
    const parsed = CreateJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }

    const { companyId } = decoded;
    const data = parsed.data;

    // Check slug uniqueness within company
    const existing = await prisma.externalJob.findUnique({
      where: { companyId_slug: { companyId, slug: data.slug } },
    });
    if (existing) {
      return NextResponse.json({ error: "A job with this URL slug already exists. Please use a different slug." }, { status: 409 });
    }

    const job = await prisma.externalJob.create({
      data: {
        companyId,
        title: data.title,
        slug: data.slug,
        department: data.department,
        location: data.location,
        city: data.city,
        employmentType: data.employmentType,
        description: data.description,
        requirements: data.requirements,
        responsibilities: data.responsibilities,
        skills: data.skills,
        experienceYears: data.experienceYears,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        autoApplyEnabled: data.autoApplyEnabled,
        isActive: true,
        createdBy: decoded.memberId,
        createdByEmail: decoded.email,
      },
    });

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        title: job.title,
        slug: job.slug,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[COMPANY_JOBS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
