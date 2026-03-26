/**
 * GET /api/candidates/applications/[id]
 * Returns single application details with job and company info
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: { id: string };
  }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    console.log('[APPLICATION_DETAIL] Fetching application:', id, 'for user:', session.user.email);

    // Try ExternalJobApplication first (external company jobs)
    let oldApplication: any = await prisma.externalJobApplication.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    }).catch(() => null);

    // If not found, try JobApplication (Fluenzy internal jobs - no company relation)
    if (!oldApplication) {
      oldApplication = await prisma.jobApplication.findUnique({
        where: { id },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              requirements: true,
              location: true,
              employmentType: true,
              salaryRange: true,
            },
          },
        },
      }).catch(() => null);

      // For JobApplication, set company as Fluenzy
      if (oldApplication) {
        oldApplication._isFluenzyJob = true;
      }
    }

    if (!oldApplication) {
      console.log('[APPLICATION_DETAIL] Application not found:', id);
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Verify ownership
    const userEmail = session.user.email.toLowerCase();
    const appEmail = oldApplication.email?.toLowerCase();
    const hasAccess = appEmail === userEmail;

    console.log('[APPLICATION_DETAIL] Access check:', { userEmail, appEmail, hasAccess });

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Format the application
    const isFluenzyJob = oldApplication._isFluenzyJob === true;
    
    const formattedApplication = {
      id: oldApplication.id,
      jobId: oldApplication.jobId,
      jobTitle: oldApplication.job?.title || 'Unknown Job',
      companyName: isFluenzyJob ? 'Fluenzy AI' : (oldApplication.job?.company?.name || 'Unknown Company'),
      companyLogo: isFluenzyJob ? '/logo.png' : (oldApplication.job?.company?.logoUrl || null),
      location: oldApplication.job?.location || oldApplication.job?.city || 'Location not specified',
      salary: oldApplication.job?.salaryRange || oldApplication.job?.salary || null,
      jobDescription: oldApplication.job?.description || 'No description available',
      requirements: oldApplication.job?.requirements ?
        (Array.isArray(oldApplication.job.requirements) ?
          oldApplication.job.requirements :
          [oldApplication.job.requirements]) : [],
      appliedAt: oldApplication.createdAt.toISOString(),
      status: oldApplication.status || 'APPLIED',
      source: oldApplication.source || 'MANUAL',
      jobType: oldApplication.job?.employmentType || oldApplication.job?.jobType || 'Full-time',
      experienceLevel: oldApplication.job?.experienceLevel || null,
      lastUpdated: oldApplication.updatedAt?.toISOString() || oldApplication.createdAt.toISOString(),
      jobUrl: isFluenzyJob ? 
        `/jobs/fluenzy/${oldApplication.job?.slug}` : 
        (oldApplication.job?.company?.slug && oldApplication.job?.slug ? 
          `/jobs/${oldApplication.job.company.slug}/${oldApplication.job.slug}` : null),
      resume: oldApplication.resumeUrl ? {
        name: oldApplication.resumeName || 'Resume.pdf',
        url: oldApplication.resumeUrl
      } : null,
      coverLetter: oldApplication.coverLetter || null,
      matchScore: oldApplication.fluenzyScore || null,
      timeline: [
        {
          id: '1',
          type: 'APPLICATION_SUBMITTED',
          title: 'Application Submitted',
          description: 'Your application has been successfully submitted',
          timestamp: oldApplication.createdAt.toISOString(),
          data: null,
        }
      ]
    };

    // Add status-specific timeline events
    if (oldApplication.status === 'VIEWED' || oldApplication.status === 'REVIEWED') {
      formattedApplication.timeline.push({
        id: '2',
        type: 'APPLICATION_VIEWED',
        title: 'Application Reviewed',
        description: 'Your application has been reviewed by the hiring team',
        timestamp: oldApplication.updatedAt?.toISOString() || oldApplication.createdAt.toISOString(),
        data: null,
      });
    }
    
    if (oldApplication.status === 'SHORTLISTED') {
      formattedApplication.timeline.push({
        id: '2',
        type: 'APPLICATION_VIEWED',
        title: 'Application Reviewed',
        description: 'Your application has been reviewed',
        timestamp: oldApplication.updatedAt?.toISOString() || oldApplication.createdAt.toISOString(),
        data: null,
      });
      formattedApplication.timeline.push({
        id: '3',
        type: 'SHORTLISTED',
        title: 'Shortlisted',
        description: 'Congratulations! You have been shortlisted',
        timestamp: oldApplication.updatedAt?.toISOString() || oldApplication.createdAt.toISOString(),
        data: null,
      });
    }

    console.log('[APPLICATION_DETAIL] Returning application:', formattedApplication.id);

    return NextResponse.json({
      success: true,
      application: formattedApplication
    });

  } catch (error) {
    console.error("[GET_APPLICATION]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
