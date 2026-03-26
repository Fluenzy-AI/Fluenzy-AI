import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCompanyRoles } from "@/lib/company-auth";

/**
 * GET /api/company/assessments/[id]
 * Fetch single assessment details with results
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify company member authentication
    const authResult = await requireCompanyRoles(req, ["ADMIN", "HR_RECRUITER", "HIRING_MANAGER"]);
    if (!authResult.authorized || !authResult.member || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Get assessment with results
    const assessment = await prisma.assessment.findUnique({
      where: {
        id: id,
        companyId: authResult.company.id, // Ensure it belongs to this company
      },
      include: {
        results: {
          select: {
            id: true,
            score: true,
            status: true,
            startedAt: true,
            completedAt: true,
            candidateEmail: true,
            candidateName: true,
          },
          orderBy: {
            startedAt: 'desc',
          },
        },
        _count: {
          select: {
            results: true,
          },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // Calculate statistics
    const completedResults = assessment.results.filter(r => r.status === 'COMPLETED');
    const passedResults = completedResults.filter(r => r.score >= assessment.passingScore);

    const statistics = {
      totalAssigned: assessment.results.length,
      completed: completedResults.length,
      passed: passedResults.length,
      failed: completedResults.length - passedResults.length,
      pending: assessment.results.filter(r => r.status === 'IN_PROGRESS').length,
      averageScore: completedResults.length > 0
        ? Math.round(completedResults.reduce((sum, r) => sum + r.score, 0) / completedResults.length)
        : 0,
      passRate: completedResults.length > 0
        ? Math.round((passedResults.length / completedResults.length) * 100)
        : 0,
    };

    // Format the response
    const formattedAssessment = {
      id: assessment.id,
      type: assessment.type,
      title: assessment.title,
      description: assessment.description,
      duration: assessment.duration,
      passingScore: assessment.passingScore,
      isActive: assessment.isActive,
      questions: assessment.questions,
      questionsCount: Array.isArray(assessment.questions) ? assessment.questions.length : 0,
      createdAt: assessment.createdAt.toISOString(),
      updatedAt: assessment.updatedAt.toISOString(),
      statistics,
      results: assessment.results.map(result => ({
        id: result.id,
        candidateName: result.candidateName || 'Anonymous',
        candidateEmail: result.candidateEmail,
        score: result.score,
        status: result.status,
        startedAt: result.startedAt?.toISOString(),
        completedAt: result.completedAt?.toISOString(),
        duration: result.startedAt && result.completedAt
          ? Math.round((new Date(result.completedAt).getTime() - new Date(result.startedAt).getTime()) / (1000 * 60))
          : null,
      })),
    };

    return NextResponse.json({
      success: true,
      assessment: formattedAssessment
    });

  } catch (error) {
    console.error("[COMPANY_ASSESSMENT_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/company/assessments/[id]
 * Update assessment (toggle active status, edit content)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify company member authentication
    const authResult = await requireCompanyRoles(req, ["ADMIN", "HR_RECRUITER"]);
    if (!authResult.authorized || !authResult.member || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    // Verify assessment belongs to this company
    const existingAssessment = await prisma.assessment.findUnique({
      where: {
        id: id,
        companyId: authResult.company.id,
      },
    });

    if (!existingAssessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // Update assessment
    const updatedAssessment = await prisma.assessment.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      assessment: {
        id: updatedAssessment.id,
        title: updatedAssessment.title,
        isActive: updatedAssessment.isActive,
      }
    });

  } catch (error) {
    console.error("[COMPANY_ASSESSMENT_PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/company/assessments/[id]
 * Delete assessment
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify company member authentication
    const authResult = await requireCompanyRoles(req, ["ADMIN", "HR_RECRUITER"]);
    if (!authResult.authorized || !authResult.member || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Verify assessment belongs to this company
    const existingAssessment = await prisma.assessment.findUnique({
      where: {
        id: id,
        companyId: authResult.company.id,
      },
    });

    if (!existingAssessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // Delete assessment (this will cascade delete results)
    await prisma.assessment.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Assessment deleted successfully"
    });

  } catch (error) {
    console.error("[COMPANY_ASSESSMENT_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}