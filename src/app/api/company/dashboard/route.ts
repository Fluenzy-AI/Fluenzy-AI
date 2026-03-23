/**
 * Company Dashboard API
 * GET /api/company/dashboard
 * Returns dashboard statistics and recent data
 */

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

    // Get job statistics
    const [totalJobs, activeJobs] = await Promise.all([
      prisma.externalJob.count({ where: { companyId } }),
      prisma.externalJob.count({ where: { companyId, isActive: true } }),
    ]);

    // Get application statistics
    const [
      totalApplications,
      pendingApplications,
      shortlistedApplications,
      hiredApplications,
      rejectedApplications,
    ] = await Promise.all([
      prisma.externalJobApplication.count({
        where: { job: { companyId } },
      }),
      prisma.externalJobApplication.count({
        where: { job: { companyId }, status: "PENDING" },
      }),
      prisma.externalJobApplication.count({
        where: { job: { companyId }, status: "SHORTLISTED" },
      }),
      prisma.externalJobApplication.count({
        where: { job: { companyId }, status: "HIRED" },
      }),
      prisma.externalJobApplication.count({
        where: { job: { companyId }, status: "REJECTED" },
      }),
    ]);

    // Get this month's stats
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const applicationsThisMonth = await prisma.externalJobApplication.count({
      where: {
        job: { companyId },
        createdAt: { gte: startOfMonth },
      },
    });

    // Get total views this month
    const jobs = await prisma.externalJob.findMany({
      where: { companyId },
      select: { viewCount: true },
    });
    const viewsThisMonth = jobs.reduce((acc, job) => acc + job.viewCount, 0);

    // Get recent applications
    const recentApplications = await prisma.externalJobApplication.findMany({
      where: { job: { companyId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        isAutoApplied: true,
        createdAt: true,
        job: {
          select: { title: true },
        },
      },
    });

    // Get recent jobs
    const recentJobs = await prisma.externalJob.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        department: true,
        viewCount: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { applications: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalJobs,
        activeJobs,
        totalApplications,
        pendingApplications,
        shortlistedApplications,
        hiredApplications,
        rejectedApplications,
        viewsThisMonth,
        applicationsThisMonth,
      },
      recentApplications: recentApplications.map((app) => ({
        id: app.id,
        name: app.name,
        email: app.email,
        jobTitle: app.job.title,
        status: app.status,
        isAutoApplied: app.isAutoApplied,
        createdAt: app.createdAt.toISOString(),
      })),
      recentJobs: recentJobs.map((job) => ({
        id: job.id,
        title: job.title,
        department: job.department,
        viewCount: job.viewCount,
        applicationsCount: job._count.applications,
        isActive: job.isActive,
        createdAt: job.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[COMPANY_DASHBOARD]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
