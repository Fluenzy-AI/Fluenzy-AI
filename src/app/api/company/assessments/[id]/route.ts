import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCompanyRoles } from "@/lib/company-auth";

/**
 * GET /api/company/assessments/[id]
 * Fetch single assessment details with results
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify company member authentication
    const authResult = await requireCompanyRoles(req, ["ADMIN", "HR_RECRUITER", "HIRING_MANAGER"]);
    if (!authResult.authorized || !authResult.member || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get assessment with results and sessions
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
            passed: true,
            startedAt: true,
            completedAt: true,
            candidateId: true,
            timeTaken: true,
          },
          orderBy: {
            startedAt: 'desc',
          },
        },
        sessions: {
          select: {
            id: true,
            sessionToken: true,
            status: true,
            score: true,
            passed: true,
            startedAt: true,
            completedAt: true,
            timeTaken: true,
            application: {
              select: {
                id: true,
                name: true,
                email: true,
                job: {
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
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

    // Calculate statistics from sessions (more accurate than results)
    const completedSessions = assessment.sessions.filter(s => s.status === 'COMPLETED');
    const passedSessions = completedSessions.filter(s => s.passed);
    const inProgressSessions = assessment.sessions.filter(s => s.status === 'IN_PROGRESS');
    const pendingSessions = assessment.sessions.filter(s => s.status === 'PENDING' || s.status === 'INVITED');

    const statistics = {
      totalAssigned: assessment.sessions.length,
      completed: completedSessions.length,
      passed: passedSessions.length,
      failed: completedSessions.length - passedSessions.length,
      pending: pendingSessions.length + inProgressSessions.length,
      averageScore: completedSessions.length > 0
        ? Math.round(completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions.length)
        : 0,
      passRate: completedSessions.length > 0
        ? Math.round((passedSessions.length / completedSessions.length) * 100)
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
      results: assessment.sessions.map(session => ({
        id: session.id,
        candidateName: session.application?.name || 'Candidate',
        candidateEmail: session.application?.email || '',
        score: session.score || 0,
        passed: session.passed || false,
        status: session.status === 'COMPLETED' ? 'COMPLETED' : 
                session.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'NOT_STARTED',
        startedAt: session.startedAt?.toISOString(),
        completedAt: session.completedAt?.toISOString(),
        duration: session.timeTaken || 0,
        sessionToken: session.sessionToken,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify company member authentication
    const authResult = await requireCompanyRoles(req, ["ADMIN", "HR_RECRUITER"]);
    if (!authResult.authorized || !authResult.member || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify company member authentication
    const authResult = await requireCompanyRoles(req, ["ADMIN", "HR_RECRUITER"]);
    if (!authResult.authorized || !authResult.member || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

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