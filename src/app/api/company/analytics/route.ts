import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCompanyAuthFromRequest } from "@/lib/company-auth";

export async function GET(req: NextRequest) {
  try {
    const decoded = getCompanyAuthFromRequest(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = decoded;

    // Get overview stats
    const [totalApplications, activeJobs, shortlistedApplications, hiredApplications] = await Promise.all([
      prisma.externalJobApplication.count({ where: { job: { companyId } } }),
      prisma.externalJob.count({ where: { companyId, isActive: true } }),
      prisma.externalJobApplication.count({ where: { job: { companyId }, status: "SHORTLISTED" } }),
      prisma.externalJobApplication.count({
        where: {
          job: { companyId },
          status: "HIRED",
        },
      }),
    ]);

    // Group candidates by status
    const statusCounts = await prisma.externalJobApplication.groupBy({
      by: ["status"],
      where: { job: { companyId } },
      _count: { id: true },
    });

    const candidatesByStatus = statusCounts.map((s) => ({
      status: s.status,
      count: s._count.id,
    }));

    // Group jobs by department
    const deptCounts = await prisma.externalJob.groupBy({
      by: ["department"],
      where: { companyId },
      _count: { id: true },
    });

    const departmentBreakdown = deptCounts.map((d) => ({
      department: d.department || "General",
      count: d._count.id,
    }));

    // Get actual applications over time (grouped by creation date)
    const recentApps = await prisma.externalJobApplication.findMany({
      where: { job: { companyId } },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    // Group applications by date (formatted)
    const appsByDate: Record<string, { date: string; applications: number; hires: number }> = {};
    recentApps.forEach((app) => {
      const dateStr = new Date(app.createdAt).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      });
      if (!appsByDate[dateStr]) {
        appsByDate[dateStr] = { date: dateStr, applications: 0, hires: 0 };
      }
      appsByDate[dateStr].applications += 1;
      if (app.status === "HIRED") {
        appsByDate[dateStr].hires += 1;
      }
    });

    const trendData = Object.values(appsByDate);

    return NextResponse.json({
      success: true,
      overview: {
        totalApplications,
        activeJobs,
        shortlistedApplications,
        hiredApplications,
      },
      candidatesByStatus,
      departmentBreakdown,
      trendData,
    });
  } catch (error) {
    console.error("[COMPANY_ANALYTICS]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
