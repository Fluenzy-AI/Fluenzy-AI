import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCompanyRoles } from "@/lib/company-auth";

/**
 * GET /api/company/assessments
 * Fetch all assessments for company jobs
 */
export async function GET(req: NextRequest) {
  try {
    // Verify company member authentication
    const authResult = await requireCompanyRoles(req, ["ADMIN", "HR_RECRUITER", "HIRING_MANAGER"]);
    if (!authResult.authorized || !authResult.member || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all assessments for this company's jobs
    const assessments = await prisma.assessment.findMany({
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
        type: true,
        title: true,
        questions: true,
        duration: true,
        passPercentage: true,
        createdAt: true,
        job: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            results: true,
          },
        },
      },
    });

    // Format the response
    const formattedAssessments = assessments.map((assessment) => ({
      id: assessment.id,
      jobId: assessment.job.id,
      jobTitle: assessment.job.title,
      type: assessment.type,
      title: assessment.title,
      questions: Array.isArray(assessment.questions) ? assessment.questions.length : 0,
      duration: assessment.duration,
      passPercentage: assessment.passPercentage,
      assigned: assessment._count.results,
      completed: assessment._count.results, // In a real app, filter by completed status
      createdAt: assessment.createdAt.toISOString(),
    }));

    return NextResponse.json({ assessments: formattedAssessments });
  } catch (error) {
    console.error("[COMPANY_ASSESSMENTS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
