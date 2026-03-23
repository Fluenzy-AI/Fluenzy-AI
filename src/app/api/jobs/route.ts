/**
 * Public Jobs API
 * GET /api/jobs - List all active external jobs
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Filters
    const search = searchParams.get("search") || "";
    const department = searchParams.get("department") || "";
    const location = searchParams.get("location") || "";
    const employmentType = searchParams.get("employmentType") || "";
    const company = searchParams.get("company") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build where clause
    const where: Record<string, unknown> = {
      isActive: true,
      company: {
        status: "ACTIVE",
      },
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { skills: { hasSome: [search] } },
      ];
    }

    if (department) {
      where.department = { equals: department, mode: "insensitive" };
    }

    if (location) {
      where.location = location;
    }

    if (employmentType) {
      where.employmentType = employmentType;
    }

    if (company) {
      where.company = { ...where.company as object, slug: company };
    }

    // Fetch jobs
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
          autoApplyEnabled: true,
          createdAt: true,
          company: {
            select: {
              name: true,
              slug: true,
              logoUrl: true,
              domain: true,
            },
          },
        },
      }),
      prisma.externalJob.count({ where }),
    ]);

    // Get unique departments and companies for filters
    const [departments, companies] = await Promise.all([
      prisma.externalJob.groupBy({
        by: ["department"],
        where: { isActive: true, company: { status: "ACTIVE" } },
        _count: true,
      }),
      prisma.company.findMany({
        where: { status: "ACTIVE", jobs: { some: { isActive: true } } },
        select: { name: true, slug: true },
        take: 50,
      }),
    ]);

    return NextResponse.json({
      success: true,
      jobs: jobs.map((job) => ({
        id: job.id,
        title: job.title,
        slug: job.slug,
        department: job.department,
        location: job.location,
        city: job.city,
        employmentType: job.employmentType,
        experienceYears: job.experienceYears,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        skills: job.skills,
        autoApplyEnabled: job.autoApplyEnabled,
        createdAt: job.createdAt.toISOString(),
        company: job.company,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        departments: departments.map((d) => ({ name: d.department, count: d._count })),
        companies: companies,
        locations: ["REMOTE", "HYBRID", "ONSITE"],
        employmentTypes: ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"],
      },
    });
  } catch (error) {
    console.error("[PUBLIC_JOBS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
