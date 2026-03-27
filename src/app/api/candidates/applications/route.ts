/**
 * GET /api/candidates/applications
 * Returns job applications for the logged-in candidate
 * 
 * Query params:
 * - type: 'external' (default) | 'internal' | 'all'
 *   - external: Jobs from external companies (for /train/applications)
 *   - internal: Jobs from Fluenzy AI careers (for /candidates/dashboard)
 *   - all: Both external and internal jobs
 * - status: Filter by application status
 * - source: 'manual' | 'auto_apply'
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getCandidateFromRequest } from "@/lib/candidate-auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Try candidate JWT auth first (for /candidates/* routes)
    const candidateAuth = getCandidateFromRequest(req);
    
    // Fallback to NextAuth session (for /train/* routes)
    const session = candidateAuth ? null : await getServerSession(authOptions);

    // Must be authenticated via either method
    if (!candidateAuth && !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Determine user identity
    const userId = candidateAuth?.id || session?.user?.id;
    const userEmail = candidateAuth?.email || session?.user?.email;

    // Get URL parameters for filtering
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const source = searchParams.get('source'); // 'manual' or 'auto_apply'
    const type = searchParams.get('type') || 'external'; // 'external' | 'internal' | 'all'

    // Build filter conditions for internal jobs
    const internalWhereClause: any = {
      OR: [
        { candidateId: userId },
        { email: userEmail },
      ],
    };

    // Add status filter if provided
    if (status && status !== 'all') {
      internalWhereClause.status = status;
    }

    // Get user's linked candidate account to match by candidateId
    const linkedCandidate = await prisma.candidateUser.findFirst({
      where: {
        email: {
          equals: userEmail,
          mode: "insensitive"
        }
      },
      select: { id: true, email: true }
    });

    console.log('[CANDIDATES_APPLICATIONS_GET] User:', {
      id: userId,
      email: userEmail,
      type,
      authMethod: candidateAuth ? 'JWT' : 'NextAuth'
    });
    console.log('[CANDIDATES_APPLICATIONS_GET] Linked candidate:', linkedCandidate);

    // Build filter conditions for external jobs
    const externalWhereClause: any = {
      OR: [
        ...(linkedCandidate ? [{ candidateId: linkedCandidate.id }] : []),
        { email: { equals: userEmail, mode: "insensitive" } },
      ],
    };

    if (status && status !== 'all') {
      externalWhereClause.status = status;
    }

    if (source && source !== 'all') {
      externalWhereClause.isAutoApplied = source === 'auto_apply';
    }

    console.log('[CANDIDATES_APPLICATIONS_GET] Query where clause:', JSON.stringify(externalWhereClause, null, 2));

    let formattedInternalApplications: any[] = [];
    let formattedExternalApplications: any[] = [];

    // Fetch internal applications (Fluenzy AI careers) if requested
    if (type === 'internal' || type === 'all') {
      const jobApplications = await prisma.jobApplication.findMany({
        where: internalWhereClause,
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
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Format internal applications (Fluenzy internal careers)
      formattedInternalApplications = jobApplications.map((app) => ({
        id: app.id,
        jobId: app.jobId,
        jobTitle: app.job?.title || 'Unknown Job',
        companyName: 'Fluenzy AI',
        companyLogo: null,
        location: app.job?.location || 'Location not specified',
        salary: app.job?.salaryRange,
        appliedAt: app.createdAt.toISOString(),
        status: app.status || 'APPLIED',
        source: 'MANUAL',
        jobType: app.job?.employmentType || 'Full-time',
        experienceLevel: null,
        lastUpdated: app.updatedAt?.toISOString() || app.createdAt.toISOString(),
        isInternal: true, // Flag to identify Fluenzy AI jobs
        jobSlug: app.job?.slug,
      }));
    }

    // Fetch external applications (external company jobs) if requested
    if (type === 'external' || type === 'all') {
      const externalApplications = await prisma.externalJobApplication.findMany({
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
      }).catch(() => []);

      // Format external applications
      formattedExternalApplications = externalApplications.map((app) => ({
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
        isInternal: false, // Flag to identify external jobs
      }));
    }

    console.log('[CANDIDATES_APPLICATIONS_GET] Found applications:', {
      internalApplications: formattedInternalApplications.length,
      externalApplications: formattedExternalApplications.length,
      type,
    });

    // Combine and sort all applications
    const allApplications = [...formattedInternalApplications, ...formattedExternalApplications];
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
