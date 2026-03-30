import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCompanyRoles } from "@/lib/company-auth";
import { getPublicUrl } from "@/lib/r2-service";
import { isR2Configured } from "@/lib/r2";

/**
 * GET /api/company/applications
 * Fetch all applications for company jobs
 */
export async function GET(req: NextRequest) {
  try {
    // Verify company member authentication
    const authResult = await requireCompanyRoles(req, ["ADMIN", "HR_RECRUITER", "HIRING_MANAGER"]);
    if (!authResult.authorized || !authResult.member || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all applications for this company's jobs
    const applications = await prisma.externalJobApplication.findMany({
      where: {
        job: {
          companyId: authResult.company.id,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        resumeUrl: true,
        status: true,
        createdAt: true,
        isAutoApplied: true,
        fluenzyScore: true,
        confidenceScore: true,
        experience: true,
        candidate: {
          select: {
            profile: {
              select: {
                skills: true,
              },
            },
          },
        },
        job: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Get unique jobs for filter dropdown
    const jobs = await prisma.externalJob.findMany({
      where: {
        companyId: authResult.company.id,
      },
      select: {
        id: true,
        title: true,
      },
      orderBy: {
        title: "asc",
      },
    });

    // Format the response with CDN URLs for lifetime access
    const formattedApplications = applications.map((app) => {
      // Convert R2 keys to CDN URLs
      let resumeUrl = app.resumeUrl;
      if (resumeUrl && !resumeUrl.startsWith('http') && !resumeUrl.startsWith('/') && isR2Configured()) {
        resumeUrl = getPublicUrl(resumeUrl) || resumeUrl;
      }
      
      return {
        id: app.id,
        name: app.name,
        email: app.email,
        phone: app.phone,
        resumeUrl,
        jobTitle: app.job.title,
        jobId: app.job.id,
        status: app.status,
        createdAt: app.createdAt.toISOString(),
        isAutoApplied: app.isAutoApplied,
        fluenzyScore: app.fluenzyScore,
        confidenceScore: app.confidenceScore,
        experience: app.experience,
        skills: app.candidate?.profile?.skills || [],
      };
    });

    return NextResponse.json({
      applications: formattedApplications,
      jobs: jobs.map(j => ({ id: j.id, title: j.title })),
    });
  } catch (error) {
    console.error("[COMPANY_APPLICATIONS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
