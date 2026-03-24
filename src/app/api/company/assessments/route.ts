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
        companyId: authResult.company.id,
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
        passingScore: true,
        createdAt: true,
        job: {
          select: {
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
      type: assessment.type,
      title: assessment.title,
      jobTitle: assessment.job?.title || "General",
      questions: Array.isArray(assessment.questions) ? assessment.questions.length : 0,
      duration: assessment.duration,
      passPercentage: assessment.passingScore || 70,
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

/**
 * POST /api/company/assessments
 * Create a new assessment
 */
export async function POST(req: NextRequest) {
  try {
    // Verify company member authentication
    const authResult = await requireCompanyRoles(req, ["ADMIN", "HR_RECRUITER"]);
    if (!authResult.authorized || !authResult.member || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      type,
      title,
      jobId,
      duration,
      passPercentage,
      description,
      questions,
      codingProblem,
      codingLanguage,
    } = body;

    // Validate required fields
    if (!type || !title || !jobId || !duration || passPercentage === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify the job belongs to this company
    const job = await prisma.externalJob.findUnique({
      where: { id: jobId },
    });

    if (!job || job.companyId !== authResult.company.id) {
      return NextResponse.json({ error: "Invalid job" }, { status: 400 });
    }

    // Create assessment
    const assessment = await prisma.assessment.create({
      data: {
        type,
        title,
        description,
        duration,
        passingScore: passPercentage,
        companyId: authResult.company.id,
        jobId,
        questions: type === "MCQ" ? questions : [],
        additionalData: {
          codingProblem,
          codingLanguage,
        },
      },
    });

    return NextResponse.json({
      success: true,
      assessment: {
        id: assessment.id,
        type: assessment.type,
        title: assessment.title,
      },
    });
  } catch (error) {
    console.error("[COMPANY_ASSESSMENTS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
