/**
 * GET /api/candidates/applications/[id]
 * Returns single application details with job and company info
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getCandidateFromRequest } from "@/lib/candidate-auth";
import prisma from "@/lib/prisma";
import { getPublicUrl } from "@/lib/r2-service";
import { isR2Configured } from "@/lib/r2";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Try candidate JWT auth first (for /candidates/* routes)
    const candidateAuth = getCandidateFromRequest(req);
    
    // Fallback to NextAuth session (for /train/* routes)
    const session = candidateAuth ? null : await getServerSession(authOptions);

    // Must be authenticated via either method
    if (!candidateAuth && !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Determine user identity
    const userEmail = candidateAuth?.email || session?.user?.email;

    const { id } = await params;
    console.log('[APPLICATION_DETAIL] Fetching application:', id, 'for user:', userEmail, 'authMethod:', candidateAuth ? 'JWT' : 'NextAuth');

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
    const appEmail = oldApplication.email?.toLowerCase();
    const hasAccess = appEmail === userEmail?.toLowerCase();

    console.log('[APPLICATION_DETAIL] Access check:', { userEmail, appEmail, hasAccess });

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Format the application
    const isFluenzyJob = oldApplication._isFluenzyJob === true;
    
    // Convert R2 key to CDN URL for lifetime access
    let resumeUrl = oldApplication.resumeUrl || null;
    if (resumeUrl && !resumeUrl.startsWith('http') && !resumeUrl.startsWith('/') && isR2Configured()) {
      resumeUrl = getPublicUrl(resumeUrl) || resumeUrl;
    }
    
    const formattedApplication = {
      id: oldApplication.id,
      jobId: oldApplication.jobId,
      status: oldApplication.status || 'APPLIED',
      createdAt: oldApplication.createdAt.toISOString(),
      updatedAt: oldApplication.updatedAt?.toISOString() || oldApplication.createdAt.toISOString(),
      name: oldApplication.name || 'Applicant',
      email: oldApplication.email,
      phone: oldApplication.phone,
      experience: oldApplication.experience,
      coverLetter: oldApplication.coverLetter || null,
      resumeUrl,
      resumeName: oldApplication.resumeName || 'Resume.pdf',
      linkedin: oldApplication.linkedin || null,
      portfolio: oldApplication.portfolio || null,
      job: {
        id: oldApplication.job?.id || oldApplication.jobId,
        title: oldApplication.job?.title || 'Unknown Job',
        slug: oldApplication.job?.slug || '',
        department: oldApplication.job?.department || 'General',
        location: oldApplication.job?.location || oldApplication.job?.city || 'Location not specified',
        employmentType: oldApplication.job?.employmentType || oldApplication.job?.jobType || 'Full-time',
        description: oldApplication.job?.description || 'No description available',
        salaryRange: oldApplication.job?.salaryRange || oldApplication.job?.salary || null,
      },
      companyName: isFluenzyJob ? 'Fluenzy AI' : (oldApplication.job?.company?.name || 'Unknown Company'),
      companyLogo: isFluenzyJob ? '/logo.png' : (oldApplication.job?.company?.logoUrl || null),
      interviews: [], // TODO: Add interviews when Interview model is created
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
