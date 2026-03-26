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

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // First try to find in new Application structure
    let application = await prisma.application.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
      include: {
        externalJob: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                logo: true,
                description: true,
              },
            },
          },
        },
      },
    }).catch(() => null);

    // If not found, try old structures
    if (!application) {
      // Try ExternalJobApplication first
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

      // If still not found, try JobApplication
      if (!oldApplication) {
        oldApplication = await prisma.jobApplication.findUnique({
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
        });
      }

      if (!oldApplication) {
        return NextResponse.json({ error: "Application not found" }, { status: 404 });
      }

      // Verify ownership for old applications
      const hasAccess = oldApplication.candidateId === session.user.id ||
        (!oldApplication.candidateId && oldApplication.email?.toLowerCase() === session.user.email?.toLowerCase());

      if (!hasAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Convert old application to new format
      const formattedApplication = {
        id: oldApplication.id,
        jobId: oldApplication.jobId,
        jobTitle: oldApplication.job?.title || 'Unknown Job',
        companyName: oldApplication.job?.company?.name || 'Unknown Company',
        companyLogo: oldApplication.job?.company?.logoUrl || oldApplication.job?.company?.logo,
        location: oldApplication.job?.location || 'Location not specified',
        salary: oldApplication.job?.salaryRange || oldApplication.job?.salary,
        jobDescription: oldApplication.job?.description || 'No description available',
        requirements: oldApplication.job?.requirements ?
          (Array.isArray(oldApplication.job.requirements) ?
            oldApplication.job.requirements :
            [oldApplication.job.requirements]) : [],
        appliedAt: oldApplication.createdAt.toISOString(),
        status: oldApplication.status || 'APPLIED',
        source: 'MANUAL',
        jobType: oldApplication.job?.employmentType || oldApplication.job?.jobType || 'Full-time',
        experienceLevel: oldApplication.job?.experienceLevel,
        lastUpdated: oldApplication.updatedAt?.toISOString() || oldApplication.createdAt.toISOString(),
        jobUrl: oldApplication.job?.slug ? `/jobs/${oldApplication.job.slug}` : null,
        resume: oldApplication.resumeUrl ? {
          name: 'Resume.pdf',
          url: oldApplication.resumeUrl
        } : null,
        coverLetter: oldApplication.coverLetter,
        matchScore: null,
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

      return NextResponse.json({
        success: true,
        application: formattedApplication
      });
    }

    // Create timeline from application status history for new application structure
    const timeline = [
      {
        id: '1',
        type: 'APPLICATION_SUBMITTED',
        title: 'Application Submitted',
        description: application.source === 'AUTO_APPLY' ?
          'Your application was automatically submitted via Auto-Apply' :
          'Your application has been successfully submitted',
        timestamp: application.appliedAt.toISOString(),
        data: {
          source: application.source,
        },
      }
    ];

    // Add status updates to timeline based on current status
    if (application.status === 'VIEWED') {
      timeline.push({
        id: '2',
        type: 'APPLICATION_VIEWED',
        title: 'Application Reviewed',
        description: 'Your application has been reviewed by the hiring team',
        timestamp: application.updatedAt.toISOString(),
        data: null,
      });
    } else if (application.status === 'SHORTLISTED') {
      timeline.push(
        {
          id: '2',
          type: 'APPLICATION_VIEWED',
          title: 'Application Reviewed',
          description: 'Your application has been reviewed by the hiring team',
          timestamp: application.updatedAt.toISOString(),
          data: null,
        },
        {
          id: '3',
          type: 'SHORTLISTED',
          title: 'Shortlisted for Interview',
          description: 'Congratulations! You have been shortlisted for the next round',
          timestamp: application.updatedAt.toISOString(),
          data: null,
        }
      );
    } else if (application.status === 'INTERVIEW_SCHEDULED') {
      timeline.push(
        {
          id: '2',
          type: 'APPLICATION_VIEWED',
          title: 'Application Reviewed',
          description: 'Your application has been reviewed by the hiring team',
          timestamp: application.updatedAt.toISOString(),
          data: null,
        },
        {
          id: '3',
          type: 'SHORTLISTED',
          title: 'Shortlisted for Interview',
          description: 'Congratulations! You have been shortlisted for the next round',
          timestamp: application.updatedAt.toISOString(),
          data: null,
        },
        {
          id: '4',
          type: 'INTERVIEW_SCHEDULED',
          title: 'Interview Scheduled',
          description: 'Your interview has been scheduled. Good luck!',
          timestamp: application.updatedAt.toISOString(),
          data: null,
        }
      );
    } else if (application.status === 'REJECTED') {
      timeline.push({
        id: '2',
        type: 'REJECTED',
        title: 'Application Not Selected',
        description: 'Unfortunately, your application was not selected for this position',
        timestamp: application.updatedAt.toISOString(),
        data: null,
      });
    } else if (application.status === 'HIRED') {
      timeline.push(
        {
          id: '2',
          type: 'APPLICATION_VIEWED',
          title: 'Application Reviewed',
          description: 'Your application has been reviewed by the hiring team',
          timestamp: application.updatedAt.toISOString(),
          data: null,
        },
        {
          id: '3',
          type: 'SHORTLISTED',
          title: 'Shortlisted for Interview',
          description: 'Congratulations! You have been shortlisted for the next round',
          timestamp: application.updatedAt.toISOString(),
          data: null,
        },
        {
          id: '4',
          type: 'INTERVIEW_SCHEDULED',
          title: 'Interview Completed',
          description: 'You have completed the interview process',
          timestamp: application.updatedAt.toISOString(),
          data: null,
        },
        {
          id: '5',
          type: 'HIRED',
          title: 'Congratulations! You\'re Hired!',
          description: 'Welcome to the team! Your job offer has been confirmed',
          timestamp: application.updatedAt.toISOString(),
          data: null,
        }
      );
    }

    // Format the detailed application response
    const detailedApplication = {
      id: application.id,
      jobId: application.jobId,
      jobTitle: application.externalJob?.title || 'Unknown Job',
      companyName: application.externalJob?.company?.name || 'Unknown Company',
      companyLogo: application.externalJob?.company?.logo,
      location: application.externalJob?.location || 'Location not specified',
      salary: application.externalJob?.salary,
      jobDescription: application.externalJob?.description || 'No description available',
      requirements: application.externalJob?.requirements ?
        (Array.isArray(application.externalJob.requirements) ?
          application.externalJob.requirements :
          [application.externalJob.requirements]) : [],
      appliedAt: application.appliedAt.toISOString(),
      status: application.status,
      source: application.source || 'MANUAL',
      jobType: application.externalJob?.jobType || 'Full-time',
      experienceLevel: application.externalJob?.experienceLevel,
      lastUpdated: application.updatedAt.toISOString(),
      jobUrl: application.externalJob?.url,
      resume: application.resumeData ? {
        name: application.resumeData.name || 'Resume.pdf',
        url: application.resumeData.url || '#'
      } : null,
      coverLetter: application.coverLetter,
      matchScore: application.matchScore,
      timeline: timeline.sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    };

    return NextResponse.json({
      success: true,
      application: detailedApplication
    });

  } catch (error) {
    console.error("[GET_APPLICATION]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
