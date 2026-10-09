import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCompanyRoles } from "@/lib/company-auth";
import { getPublicUrl } from "@/lib/r2-service";
import { isR2Configured } from "@/lib/r2";

/**
 * GET /api/company/candidates
 * Fetch company-authorized candidate pool derived from company applications
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireCompanyRoles(req, ["ADMIN", "HR_RECRUITER", "HIRING_MANAGER"]);
    if (!authResult.authorized || !authResult.member || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const jobId = searchParams.get("jobId") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const companyId = authResult.company.id;

    // Build filter query scoped to company jobs
    const whereCondition: Record<string, unknown> = {
      job: {
        companyId,
      },
    };

    if (jobId) {
      whereCondition.jobId = jobId;
    }

    if (status) {
      whereCondition.status = status;
    }

    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [applications, total] = await Promise.all([
      prisma.externalJobApplication.findMany({
        where: whereCondition,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          resumeUrl: true,
          resumeName: true,
          status: true,
          experience: true,
          notes: true,
          fluenzyScore: true,
          confidenceScore: true,
          interviewDate: true,
          createdAt: true,
          candidateId: true,
          candidate: {
            select: {
              profile: {
                select: {
                  skills: true,
                  experience: true,
                },
              },
            },
          },
          job: {
            select: {
              id: true,
              title: true,
              department: true,
            },
          },
        },
      }),
      prisma.externalJobApplication.count({ where: whereCondition }),
    ]);

    // Format candidates with CDN URLs
    const formattedCandidates = applications.map((app) => {
      let resumeUrl = app.resumeUrl;
      if (resumeUrl && !resumeUrl.startsWith("http") && !resumeUrl.startsWith("/") && isR2Configured()) {
        resumeUrl = getPublicUrl(resumeUrl) || resumeUrl;
      }

      return {
        id: app.id,
        candidateId: app.candidateId || app.id,
        name: app.name,
        email: app.email,
        phone: app.phone,
        resumeUrl,
        resumeName: app.resumeName,
        status: app.status,
        experience: app.experience || app.candidate?.profile?.experience || "N/A",
        notes: app.notes || "",
        fluenzyScore: app.fluenzyScore || null,
        confidenceScore: app.confidenceScore || null,
        skills: app.candidate?.profile?.skills || [],
        jobTitle: app.job.title,
        jobId: app.job.id,
        department: app.job.department,
        interviewDate: app.interviewDate ? app.interviewDate.toISOString() : null,
        createdAt: app.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      candidates: formattedCandidates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[COMPANY_CANDIDATES_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
