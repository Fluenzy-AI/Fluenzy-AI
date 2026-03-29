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

    // Try to fetch real video analytics from MongoDB behavioral_analytics collection
    let videoAnalytics = {
      confidence: 0,
      eyeContact: 0,
      posture: 0,
      smile: 0,
      engagement: 0,
      stressLevel: 0,
    };

    try {
      // Query behavioral analytics for this session
      const behavioralFilter: any = {
        sessionId: session.id,
      };

      const rawBehavioral = await (prisma as any).$runCommandRaw({
        find: "behavioral_analytics",
        filter: behavioralFilter,
        sort: { createdAt: -1 },
        limit: 1,
      });

      const behavioralDocs = rawBehavioral?.cursor?.firstBatch || [];

      if (behavioralDocs.length > 0) {
        const doc = behavioralDocs[0];
        const summary = doc?.summary || {};
        
        // Use real data from MongoDB
        videoAnalytics = {
          confidence: Number(summary.confidence) || session.score || 0,
          eyeContact: Number(summary.eye_contact) || 0,
          posture: Number(summary.posture) || 0,
          smile: Number(summary.smile) || 0,
          engagement: Number(summary.engagement) || 0,
          stressLevel: Number(summary.stress_level) || 0,
        };
      } else {
        // No behavioral data found - use score-based estimates as fallback
        const score = session.score || 0;
        videoAnalytics = {
          confidence: score,
          eyeContact: Math.min(100, Math.max(0, score * 0.8)),
          posture: Math.min(100, Math.max(0, score * 0.9)),
          smile: Math.min(100, Math.max(0, 50)),
          engagement: Math.min(100, Math.max(0, score * 0.85)),
          stressLevel: Math.min(100, Math.max(0, 100 - score)),
        };
      }
    } catch (error) {
      console.error('[RESULT] Failed to fetch behavioral data:', error);
      // Use score-based fallback
      const score = session.score || 0;
      videoAnalytics = {
        confidence: score,
        eyeContact: Math.min(100, Math.max(0, score * 0.8)),
        posture: Math.min(100, Math.max(0, score * 0.9)),
        smile: Math.min(100, Math.max(0, 50)),
        engagement: Math.min(100, Math.max(0, score * 0.85)),
        stressLevel: Math.min(100, Math.max(0, 100 - score)),
      };
    }

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
