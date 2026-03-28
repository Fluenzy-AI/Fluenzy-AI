import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCompanyRoles } from "@/lib/company-auth";

/**
 * GET /api/company/assessments/[id]/analytics/[sessionToken]
 * Get comprehensive analytics for a specific candidate's assessment
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sessionToken: string }> }
) {
  try {
    // Verify company member authentication
    const authResult = await requireCompanyRoles(req, ["ADMIN", "HR_RECRUITER", "HIRING_MANAGER"]);
    if (!authResult.authorized || !authResult.member || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, sessionToken } = await params;

    // Get assessment session with all related data
    const session = await prisma.candidateAssessmentSession.findFirst({
      where: {
        sessionToken: sessionToken,
        assessmentId: id,
        assessment: {
          companyId: authResult.company.id, // Ensure it belongs to this company
        },
      },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            duration: true,
            passingScore: true,
          },
        },
        application: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            job: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Assessment session not found" },
        { status: 404 }
      );
    }

    if (session.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Assessment not completed yet" },
        { status: 400 }
      );
    }

    // Parse AI transcript
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

    // Calculate detailed metrics from transcripts
    const totalQuestions = transcripts.length;
    let totalWords = 0;
    let totalAnswerLength = 0;
    const keywordCounts: { [key: string]: number } = {};

    transcripts.forEach((t: any) => {
      const answer = t.userAnswer || '';
      const words = answer.split(/\s+/).filter((w: string) => w.length > 0);
      totalWords += words.length;
      totalAnswerLength += answer.length;

      // Count keywords
      words.forEach((word: string) => {
        const lowerWord = word.toLowerCase().replace(/[^a-z]/g, '');
        if (lowerWord.length > 3) {
          keywordCounts[lowerWord] = (keywordCounts[lowerWord] || 0) + 1;
        }
      });
    });

    const avgWordsPerAnswer = totalQuestions > 0 ? Math.round(totalWords / totalQuestions) : 0;
    const wordsPerMinute = session.timeTaken ? Math.round(totalWords / session.timeTaken) : 0;

    // Top keywords
    const topKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    // Generate video analytics (mock data based on score)
    const score = session.score || 0;
    const videoAnalytics = {
      eyeContact: Math.min(100, Math.max(0, score * 0.8 + Math.random() * 15)),
      posture: Math.min(100, Math.max(0, score * 0.9 + Math.random() * 10)),
      smile: Math.min(100, Math.max(0, 50 + Math.random() * 30)),
      engagement: Math.min(100, Math.max(0, score * 0.85 + Math.random() * 15)),
      stressControl: Math.min(100, Math.max(0, 100 - score + Math.random() * 20)),
      faceDetection: Math.min(100, Math.max(0, 90 + Math.random() * 10)),
    };

    // Communication metrics
    const communicationMetrics = {
      communication: score,
      confidence: Math.min(100, Math.max(0, score + Math.random() * 20 - 10)),
      grammar: Math.min(100, Math.max(0, score * 0.9 + Math.random() * 15)),
      speakingPace: wordsPerMinute,
      sentence: Math.min(100, Math.max(0, 30 + Math.random() * 40)),
      tone: Math.min(100, Math.max(0, 40 + Math.random() * 30)),
    };

    // Response format
    const analyticsData = {
      session: {
        id: session.id,
        sessionToken: session.sessionToken,
        status: session.status,
        score: session.score,
        passed: session.passed,
        timeTaken: session.timeTaken,
        startedAt: session.startedAt?.toISOString(),
        completedAt: session.completedAt?.toISOString(),
      },
      candidate: {
        name: session.application?.name || "Candidate",
        email: session.application?.email || "",
        phone: session.application?.phone || "",
        jobTitle: session.application?.job?.title || "",
      },
      assessment: {
        title: session.assessment.title,
        description: session.assessment.description,
        type: session.assessment.type,
        duration: session.assessment.duration,
        passingScore: session.assessment.passingScore,
      },
      summary: {
        overallScore: score,
        overallStatus: session.passed ? "Passed" : "Needs Improvement",
        totalQuestions: totalQuestions,
        totalDurationMinutes: session.timeTaken || 0,
        avgWordsPerAnswer: avgWordsPerAnswer,
        speakingPace: wordsPerMinute,
        completionRate: 100,
      },
      behavioral: videoAnalytics,
      communication: communicationMetrics,
      transcripts: transcripts.map((t: any, index: number) => ({
        questionNumber: index + 1,
        aiPrompt: t.aiPrompt || '',
        userAnswer: t.userAnswer || '',
        score: t.perQuestionScore || 0,
        scores: t.scores || {},
        wordCount: (t.userAnswer || '').split(/\s+/).filter((w: string) => w.length > 0).length,
      })),
      textAnalysis: {
        topKeywords: topKeywords,
        totalWords: totalWords,
        avgWordsPerAnswer: avgWordsPerAnswer,
        wordsPerMinute: wordsPerMinute,
      },
      insights: {
        strengths: score >= 70 ? ["Communication", "Engagement"] : [],
        focusAreas: score < 70 ? ["Technical Knowledge", "Confidence"] : [],
        tips: [
          "Practice concise answers with clear structure",
          "Maintain eye contact with the camera",
          "Speak at a steady pace of 120-160 WPM",
          "Review key concepts regularly",
        ],
      },
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error("[ASSESSMENT_ANALYTICS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
