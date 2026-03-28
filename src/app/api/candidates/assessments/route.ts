import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getCandidateFromRequest } from "@/lib/candidate-auth";

/**
 * GET /api/candidates/assessments
 * Get all assessments assigned to the logged-in candidate
 */
export async function GET(req: NextRequest) {
  try {
    // Try candidate JWT auth first
    const candidateAuth = getCandidateFromRequest(req);
    
    // Fallback to NextAuth session
    const session = candidateAuth ? null : await getServerSession(authOptions);

    if (!candidateAuth && !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = candidateAuth?.email || session?.user?.email;

    if (!userEmail) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    // Find candidate's applications by email
    const applications = await prisma.externalJobApplication.findMany({
      where: {
        email: {
          equals: userEmail,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
      },
    });

    if (applications.length === 0) {
      return NextResponse.json({
        success: true,
        assessments: [],
        stats: {
          total: 0,
          pending: 0,
          inProgress: 0,
          completed: 0,
          expired: 0,
        },
      });
    }

    const applicationIds = applications.map(a => a.id);

    // Get all assessment sessions for this candidate
    const sessions = await prisma.candidateAssessmentSession.findMany({
      where: {
        applicationId: { in: applicationIds },
      },
      include: {
        assessment: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
              },
            },
          },
        },
        application: {
          select: {
            id: true,
            name: true,
            email: true,
            job: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
    });

    // Calculate stats
    const stats = {
      total: sessions.length,
      pending: sessions.filter(s => s.status === "PENDING" || s.status === "INVITED").length,
      inProgress: sessions.filter(s => s.status === "IN_PROGRESS").length,
      completed: sessions.filter(s => s.status === "COMPLETED").length,
      expired: sessions.filter(s => s.status === "EXPIRED").length,
    };

    // Format response
    const assessments = sessions.map(session => ({
      id: session.id,
      sessionToken: session.sessionToken,
      status: session.status,
      score: session.score,
      passed: session.passed,
      assignedAt: session.assignedAt,
      expiresAt: session.expiresAt,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      assessment: {
        id: session.assessment.id,
        title: session.assessment.title,
        description: session.assessment.description,
        type: session.assessment.type,
        duration: session.assessment.duration,
        passingScore: session.assessment.passingScore,
        questionsCount: Array.isArray(session.assessment.questions) 
          ? (session.assessment.questions as any[]).length 
          : 0,
      },
      company: {
        id: session.assessment.company.id,
        name: session.assessment.company.name,
        logo: session.assessment.company.logoUrl,
      },
      job: {
        id: session.application.job.id,
        title: session.application.job.title,
      },
    }));

    return NextResponse.json({
      success: true,
      assessments,
      stats,
    });
  } catch (error) {
    console.error("[CANDIDATES_ASSESSMENTS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
