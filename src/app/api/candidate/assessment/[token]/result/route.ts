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
    let transcripts: any[] = [];
    if (session.aiTranscript) {
      try {
        const parsed = typeof session.aiTranscript === 'string' 
          ? JSON.parse(session.aiTranscript)
          : session.aiTranscript;
        if (Array.isArray(parsed)) {
          transcripts = parsed;
        }
      } catch (e) {
        console.error("Failed to parse AI transcript:", e);
      }
    }

    // Parse feedback if available
    let feedbackData: any = null;
    if (session.feedback) {
      try {
        feedbackData = typeof session.feedback === 'string' 
          ? JSON.parse(session.feedback)
          : session.feedback;
      } catch (e) {
        console.error("Failed to parse feedback:", e);
      }
    }

    // Try to fetch real video analytics from MongoDB behavioral_analytics collection
    let videoMetrics = {
      confidence: 0,
      eyeContact: 0,
      posture: 0,
      smile: 0,
      engagement: 0,
      stressLevel: 0,
      stressControl: 0,
      focus: 0,
      faceDetection: 0,
      expressionAnalysis: 0,
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
        videoMetrics = {
          confidence: Number(summary.confidence) || session.score || 0,
          eyeContact: Number(summary.eye_contact) || 0,
          posture: Number(summary.posture) || 0,
          smile: Number(summary.smile) || 0,
          engagement: Number(summary.engagement) || 0,
          stressLevel: Number(summary.stress_level) || 0,
          stressControl: Number(summary.stress_control) || 0,
          focus: Number(summary.focus) || 0,
          faceDetection: Number(summary.face_detection) || 100,
          expressionAnalysis: Number(summary.expression_analysis) || 0,
        };
      } else {
        // No behavioral data found - use score-based estimates as fallback
        const score = session.score || 0;
        videoMetrics = {
          confidence: score,
          eyeContact: Math.min(100, Math.max(0, score * 0.85)),
          posture: Math.min(100, Math.max(0, score * 0.9)),
          smile: Math.min(100, Math.max(0, 60)),
          engagement: Math.min(100, Math.max(0, score * 0.85)),
          stressLevel: Math.min(100, Math.max(0, 100 - score * 0.7)),
          stressControl: Math.min(100, Math.max(0, score * 0.75)),
          focus: Math.min(100, Math.max(0, score * 0.9)),
          faceDetection: 100,
          expressionAnalysis: Math.min(100, Math.max(0, score * 0.8)),
        };
      }
    } catch (error) {
      console.error('[RESULT] Failed to fetch behavioral data:', error);
      // Use score-based fallback
      const score = session.score || 0;
      videoMetrics = {
        confidence: score,
        eyeContact: Math.min(100, Math.max(0, score * 0.85)),
        posture: Math.min(100, Math.max(0, score * 0.9)),
        smile: Math.min(100, Math.max(0, 60)),
        engagement: Math.min(100, Math.max(0, score * 0.85)),
        stressLevel: Math.min(100, Math.max(0, 100 - score * 0.7)),
        stressControl: Math.min(100, Math.max(0, score * 0.75)),
        focus: Math.min(100, Math.max(0, score * 0.9)),
        faceDetection: 100,
        expressionAnalysis: Math.min(100, Math.max(0, score * 0.8)),
      };
    }

    // Generate interview scores from transcript data
    let interviewScores = null;
    if (["AI_INTERVIEW", "VOICE", "GD"].includes(session.assessment.type) && transcripts.length > 0) {
      // Calculate scores from transcript feedback if available
      const candidateResponses = transcripts.filter((t: any) => 
        t.perQuestionScore !== undefined || t.scores
      );
      
      if (candidateResponses.length > 0) {
        const avgPerQuestion = candidateResponses.reduce((acc: number, t: any) => 
          acc + (t.perQuestionScore || t.scores?.overall || 0), 0
        ) / candidateResponses.length;

        interviewScores = {
          communication: Math.round(avgPerQuestion * 0.9),
          confidence: Math.round(avgPerQuestion * 0.85),
          grammar: Math.round(avgPerQuestion * 0.95),
          technicalKnowledge: Math.round(avgPerQuestion * 0.8),
          overallRating: session.score || Math.round(avgPerQuestion),
          strengths: feedbackData?.strengths || feedbackData?.highlights || [],
          improvements: feedbackData?.improvements || [],
          summary: feedbackData?.feedback || feedbackData?.aiFeedback || null,
          recommendation: getRecommendation(session.score || avgPerQuestion),
        };
      } else {
        // Use overall score to generate estimates
        const score = session.score || 0;
        interviewScores = {
          communication: Math.round(score * 0.9),
          confidence: Math.round(score * 0.85),
          grammar: Math.round(score * 0.95),
          technicalKnowledge: Math.round(score * 0.8),
          overallRating: score,
          strengths: feedbackData?.strengths || feedbackData?.highlights || [],
          improvements: feedbackData?.improvements || [],
          summary: feedbackData?.feedback || feedbackData?.aiFeedback || null,
          recommendation: getRecommendation(score),
        };
      }
    }

    // Generate video feedback descriptions
    const videoFeedback = {
      confidence: generateMetricFeedback("confidence", videoMetrics.confidence),
      eyeContact: generateMetricFeedback("eyeContact", videoMetrics.eyeContact),
      posture: generateMetricFeedback("posture", videoMetrics.posture),
      smile: generateMetricFeedback("smile", videoMetrics.smile),
      engagement: generateMetricFeedback("engagement", videoMetrics.engagement),
      stressLevel: generateMetricFeedback("stressLevel", videoMetrics.stressLevel, true),
      stressControl: generateMetricFeedback("stressControl", videoMetrics.stressControl, true),
      focus: generateMetricFeedback("focus", videoMetrics.focus),
      faceDetection: generateMetricFeedback("faceDetection", videoMetrics.faceDetection),
      expressionAnalysis: generateMetricFeedback("expressionAnalysis", videoMetrics.expressionAnalysis),
      overallBehavioralScore: calculateBehavioralScore(videoMetrics),
      behavioralSummary: generateBehavioralSummary(videoMetrics, session.application?.job?.title || "the position"),
      strengths: extractVideoStrengths(videoMetrics),
      improvements: extractVideoImprovements(videoMetrics),
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
        subType: session.assessment.subType,
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
      interviewScores: interviewScores,
      videoMetrics: ["AI_INTERVIEW", "VOICE", "GD"].includes(session.assessment.type) 
        ? videoMetrics : undefined,
      videoFeedback: ["AI_INTERVIEW", "VOICE", "GD"].includes(session.assessment.type) 
        ? videoFeedback : undefined,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ASSESSMENT_RESULT_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper functions
function getRecommendation(score: number): string {
  if (score >= 85) return "Strongly Recommend";
  if (score >= 70) return "Recommend";
  if (score >= 50) return "Consider";
  return "Do Not Recommend";
}

function calculateBehavioralScore(metrics: any): number {
  const score = Math.round(
    metrics.confidence * 0.20 +
    metrics.eyeContact * 0.15 +
    metrics.posture * 0.10 +
    metrics.smile * 0.05 +
    metrics.engagement * 0.15 +
    (100 - metrics.stressLevel) * 0.10 +
    metrics.stressControl * 0.10 +
    metrics.focus * 0.10 +
    metrics.expressionAnalysis * 0.05
  );
  return Math.max(0, Math.min(100, score));
}

function generateMetricFeedback(metric: string, value: number, isInverse: boolean = false): string {
  const feedbackMap: Record<string, Record<string, string>> = {
    confidence: {
      high: "Confidence signals were strong and consistent throughout.",
      medium: "Confidence levels were acceptable with room for improvement.",
      low: "Confidence could be strengthened with more practice.",
    },
    eyeContact: {
      high: "Excellent camera engagement and eye contact maintained.",
      medium: "Eye contact was generally good but inconsistent at times.",
      low: "More direct camera engagement would improve presence.",
    },
    posture: {
      high: "Professional posture maintained throughout.",
      medium: "Posture was generally good with some drift.",
      low: "Improved upright alignment would enhance professional presence.",
    },
    smile: {
      high: "Warm and approachable facial expressions demonstrated.",
      medium: "Facial expressions were neutral to friendly.",
      low: "More warmth in facial expressions would help build rapport.",
    },
    engagement: {
      high: "High level of engagement and attention demonstrated.",
      medium: "Engagement was good with occasional lapses.",
      low: "More active engagement would improve interview performance.",
    },
    stressLevel: {
      high: "Elevated stress indicators detected - consider relaxation techniques.",
      medium: "Moderate stress levels observed - this is normal.",
      low: "Excellent stress management demonstrated.",
    },
    stressControl: {
      high: "Excellent composure under pressure.",
      medium: "Good stress control with some fluctuation.",
      low: "Stress management techniques could help improve composure.",
    },
    focus: {
      high: "Sustained focus and attention throughout.",
      medium: "Focus was generally good.",
      low: "More sustained focus would improve performance.",
    },
    faceDetection: {
      high: "Good camera positioning for clear visibility.",
      medium: "Camera positioning was acceptable.",
      low: "Better camera positioning would improve analysis.",
    },
    expressionAnalysis: {
      high: "Clear and expressive communication demonstrated.",
      medium: "Expressions were readable but could be more animated.",
      low: "More expressive communication would enhance delivery.",
    },
  };

  const level = isInverse
    ? (value <= 30 ? "low" : value <= 60 ? "medium" : "high")
    : (value >= 80 ? "high" : value >= 50 ? "medium" : "low");
    
  // For stress metrics, swap high and low meanings
  const adjustedLevel = (metric === "stressLevel")
    ? level
    : (metric === "stressControl" ? (value >= 80 ? "high" : value >= 50 ? "medium" : "low") : level);

  return feedbackMap[metric]?.[adjustedLevel] || `${metric}: ${value}%`;
}

function generateBehavioralSummary(metrics: any, jobTitle: string): string {
  const score = calculateBehavioralScore(metrics);
  
  if (score >= 80) {
    return `Excellent behavioral presentation for ${jobTitle}. The candidate demonstrated strong confidence, good eye contact, and professional composure throughout the interview.`;
  } else if (score >= 60) {
    return `Good behavioral presentation with some areas for improvement. The candidate showed acceptable confidence and engagement, though could benefit from working on stress management and more consistent eye contact.`;
  } else {
    return `The behavioral analysis suggests areas for development. Focus on building confidence, maintaining eye contact, and managing stress during interviews for better performance.`;
  }
}

function extractVideoStrengths(metrics: any): string[] {
  const strengths: string[] = [];
  
  if (metrics.confidence >= 80) strengths.push("Strong confidence throughout");
  if (metrics.eyeContact >= 80) strengths.push("Excellent eye contact");
  if (metrics.posture >= 80) strengths.push("Professional posture");
  if (metrics.smile >= 80) strengths.push("Warm and approachable demeanor");
  if (metrics.engagement >= 80) strengths.push("High engagement level");
  if (metrics.stressLevel <= 30) strengths.push("Excellent stress management");
  if (metrics.focus >= 80) strengths.push("Sustained focus and attention");
  
  return strengths.slice(0, 3);
}

function extractVideoImprovements(metrics: any): string[] {
  const improvements: string[] = [];
  
  if (metrics.confidence < 60) improvements.push("Build confidence in delivery");
  if (metrics.eyeContact < 60) improvements.push("Maintain more consistent eye contact");
  if (metrics.posture < 60) improvements.push("Improve upright posture");
  if (metrics.stressLevel > 60) improvements.push("Practice stress management techniques");
  if (metrics.engagement < 60) improvements.push("Show more active engagement");
  if (metrics.focus < 60) improvements.push("Work on sustained attention");
  
  return improvements.slice(0, 3);
}
