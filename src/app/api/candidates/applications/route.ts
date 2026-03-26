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

    // Get user's linked candidate account to match by candidateId
    const linkedCandidate = await prisma.candidateUser.findFirst({
      where: {
        email: {
          equals: session.user.email,
          mode: "insensitive"
        }
      },
      select: { id: true, email: true }
    });

    console.log('[CANDIDATES_APPLICATIONS_GET] Session user:', {
      id: session.user.id,
      email: session.user.email,
    });
    console.log('[CANDIDATES_APPLICATIONS_GET] Linked candidate:', linkedCandidate);

    // Build filter conditions for external jobs
    const externalWhereClause: any = {
      OR: [
        ...(linkedCandidate ? [{ candidateId: linkedCandidate.id }] : []),
        { email: { equals: session.user.email, mode: "insensitive" } },
      ],
    };

    if (status && status !== 'all') {
      externalWhereClause.status = status;
    }

    if (source && source !== 'all') {
      externalWhereClause.isAutoApplied = source === 'auto_apply';
    }

    console.log('[CANDIDATES_APPLICATIONS_GET] Query where clause:', JSON.stringify(externalWhereClause, null, 2));

    // Support both old and new application structures
    const [jobApplications, externalApplications] = await Promise.all([
      // Old structure - internal jobs (Fluenzy careers)
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
              // Note: Job model doesn't have company relation - it's Fluenzy's own jobs
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),

      // New structure - external jobs with application tracking
      prisma.externalJobApplication.findMany({
        where: externalWhereClause,
        include: {
          job: {
            include: {
              company: {
                select: {
                  name: true,
                  logoUrl: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }).catch(() => []) // Fallback to empty array if error
    ]);

    // Format old applications (Fluenzy internal careers)
    const formattedOldApplications = jobApplications.map((app) => ({
      id: app.id,
      jobId: app.jobId,
      jobTitle: app.job?.title || 'Unknown Job',
      companyName: 'Fluenzy AI', // Fluenzy's own jobs
      companyLogo: null, // Fluenzy logo can be added here
      location: app.job?.location || 'Location not specified',
      salary: app.job?.salaryRange,
      appliedAt: app.createdAt.toISOString(),
      status: app.status || 'APPLIED',
      source: 'MANUAL',
      jobType: app.job?.employmentType || 'Full-time',
      experienceLevel: null,
      lastUpdated: app.updatedAt?.toISOString() || app.createdAt.toISOString(),
    }));

    // Format new applications (external jobs)
    const formattedNewApplications = externalApplications.map((app) => ({
      id: app.id,
      jobId: app.jobId,
      jobTitle: app.job?.title || 'Unknown Job',
      companyName: app.job?.company?.name || 'Unknown Company',
      companyLogo: app.job?.company?.logoUrl,
      companySlug: app.job?.company?.slug,
      location: app.job?.city || app.job?.location || 'Remote',
      salary: app.job?.salaryMin && app.job?.salaryMax 
        ? `₹${app.job.salaryMin} - ₹${app.job.salaryMax}` 
        : 'Not disclosed',
      appliedAt: app.createdAt.toISOString(),
      status: app.status,
      source: app.isAutoApplied ? 'AUTO_APPLY' : 'MANUAL',
      jobType: app.job?.employmentType || 'FULL_TIME',
      experienceLevel: app.job?.experienceYears || 'Not specified',
      lastUpdated: app.updatedAt.toISOString(),
      isAutoApplied: app.isAutoApplied,
      fluenzyScore: app.fluenzyScore,
      confidenceScore: app.confidenceScore,
    }));

    console.log('[CANDIDATES_APPLICATIONS_GET] Found applications:', {
      oldApplications: jobApplications.length,
      externalApplications: externalApplications.length,
      total: jobApplications.length + externalApplications.length,
      externalSample: externalApplications[0] ? {
        id: externalApplications[0].id,
        email: externalApplications[0].email,
        candidateId: externalApplications[0].candidateId,
        jobTitle: externalApplications[0].job?.title,
      } : 'none'
    });

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
