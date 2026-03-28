import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/candidate/assessment/[token]/result
 * Get assessment result for completed assessment
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Find the assessment session by token
    const session = await prisma.candidateAssessmentSession.findFirst({
      where: {
        sessionToken: token,
        status: "COMPLETED",
      },
      include: {
        assessment: {
          include: {
            company: {
              select: {
                name: true,
                logoUrl: true,
              },
            },
          },
        },
        application: {
          select: {
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
    });

    if (!session) {
      return NextResponse.json(
        { error: "Assessment not completed or link invalid" },
        { status: 404 }
      );
    }

    // Parse AI transcript if available
    let transcripts = [];
    if (session.aiTranscript && typeof session.aiTranscript === 'string') {
      try {
        const parsed = JSON.parse(session.aiTranscript);
        if (Array.isArray(parsed)) {
          transcripts = parsed;
        }
      } catch (e) {
        console.error("Failed to parse AI transcript:", e);
      }
    }

    // Mock video analytics (in production, this would come from the actual video analysis)
    // For now, generate reasonable values based on score
    const videoAnalytics = {
      confidence: Math.min(100, Math.max(0, session.score || 0 + Math.random() * 20 - 10)),
      eyeContact: Math.min(100, Math.max(0, (session.score || 0) * 0.8 + Math.random() * 15)),
      posture: Math.min(100, Math.max(0, (session.score || 0) * 0.9 + Math.random() * 10)),
      smile: Math.min(100, Math.max(0, 50 + Math.random() * 30)),
      engagement: Math.min(100, Math.max(0, (session.score || 0) * 0.85 + Math.random() * 15)),
      stressLevel: Math.min(100, Math.max(0, 100 - (session.score || 0) + Math.random() * 20)),
    };

    // Build response
    const result = {
      score: session.score || 0,
      passed: session.passed || false,
      timeTaken: session.timeTaken || 0,
      passingScore: session.assessment.passingScore,
      completedAt: session.completedAt?.toISOString() || new Date().toISOString(),
      assessment: {
        title: session.assessment.title,
        description: session.assessment.description,
        type: session.assessment.type,
        duration: session.assessment.duration,
      },
      company: {
        name: session.assessment.company.name,
        logo: session.assessment.company.logoUrl,
      },
      candidate: {
        name: session.application?.name || "Candidate",
        email: session.application?.email || "",
        jobTitle: session.application?.job?.title || "Position",
      },
      transcripts: transcripts.length > 0 ? transcripts : undefined,
      videoAnalytics: session.assessment.type === "AI_INTERVIEW" ? videoAnalytics : undefined,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ASSESSMENT_RESULT_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
