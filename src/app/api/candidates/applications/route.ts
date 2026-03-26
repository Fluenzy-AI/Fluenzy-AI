/**
 * GET /api/candidates/applications
 * Returns all job applications for the logged-in candidate
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get URL parameters for filtering
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const source = searchParams.get('source'); // 'manual' or 'auto_apply'

    // Build filter conditions
    const whereClause: any = {
      OR: [
        { candidateId: session.user.id },
        { email: session.user.email },
      ],
    };

    // Add status filter if provided
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // Support both old and new application structures
    const [jobApplications, externalApplications] = await Promise.all([
      // Old structure - internal jobs
      prisma.jobApplication.findMany({
        where: whereClause,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              slug: true,
              department: true,
              location: true,
              employmentType: true,
              salaryRange: true,
              company: {
                select: {
                  name: true,
                  logo: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),

      // New structure - external jobs with application tracking
      prisma.application.findMany({
        where: {
          userId: session.user.id,
          ...(status && status !== 'all' && { status: status }),
          ...(source && source !== 'all' && { source: source.toUpperCase() }),
        },
        include: {
          externalJob: {
            include: {
              company: {
                select: {
                  name: true,
                  logo: true,
                },
              },
            },
          },
        },
        orderBy: {
          appliedAt: 'desc',
        },
      }).catch(() => []) // Fallback to empty array if table doesn't exist
    ]);

    // Format old applications
    const formattedOldApplications = jobApplications.map((app) => ({
      id: app.id,
      jobId: app.jobId,
      jobTitle: app.job?.title || 'Unknown Job',
      companyName: app.job?.company?.name || 'Unknown Company',
      companyLogo: app.job?.company?.logo,
      location: app.job?.location || 'Location not specified',
      salary: app.job?.salaryRange,
      appliedAt: app.createdAt.toISOString(),
      status: app.status || 'APPLIED',
      source: 'MANUAL',
      jobType: app.job?.employmentType || 'Full-time',
      experienceLevel: null,
      lastUpdated: app.updatedAt?.toISOString() || app.createdAt.toISOString(),
    }));

    // Format new applications
    const formattedNewApplications = externalApplications.map((app) => ({
      id: app.id,
      jobId: app.jobId,
      jobTitle: app.externalJob?.title || 'Unknown Job',
      companyName: app.externalJob?.company?.name || 'Unknown Company',
      companyLogo: app.externalJob?.company?.logo,
      location: app.externalJob?.location || 'Location not specified',
      salary: app.externalJob?.salary,
      appliedAt: app.appliedAt.toISOString(),
      status: app.status,
      source: app.source || 'MANUAL',
      jobType: app.externalJob?.jobType || 'Full-time',
      experienceLevel: app.externalJob?.experienceLevel,
      lastUpdated: app.updatedAt.toISOString(),
    }));

    // Combine and sort all applications
    const allApplications = [...formattedOldApplications, ...formattedNewApplications];
    allApplications.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());

    return NextResponse.json({
      success: true,
      applications: allApplications
    });

  } catch (error) {
    console.error("[CANDIDATES_APPLICATIONS_GET] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
