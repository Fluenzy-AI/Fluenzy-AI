import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateGDToken, isAgoraConfigured, getAgoraAppId } from "@/lib/agoraToken";

/**
 * GET /api/candidate/assessment/[token]
 * Get assessment details for candidate using session token
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
      return NextResponse.json({ error: "Invalid assessment link" }, { status: 404 });
    }

    // Check if expired
    if (session.expiresAt && new Date() > session.expiresAt) {
      await prisma.candidateAssessmentSession.update({
        where: { id: session.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ error: "Assessment link has expired" }, { status: 410 });
    }

    // Check if already completed
    if (session.status === "COMPLETED") {
      return NextResponse.json({
        error: "Assessment already completed",
        completed: true,
        score: session.score,
        passed: session.passed,
      }, { status: 400 });
    }

    // Build response based on assessment type
    const response: any = {
      success: true,
      session: {
        id: session.id,
        status: session.status,
        startedAt: session.startedAt,
        expiresAt: session.expiresAt,
      },
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
      candidate: {
        name: session.application.name,
        email: session.application.email,
        jobTitle: session.application.job.title,
      },
      company: {
        name: session.assessment.company.name,
        logo: session.assessment.company.logoUrl,
      },
    };

    // For MCQ/Coding, include questions only if assessment started
    if ((session.assessment.type === "MCQ" || session.assessment.type === "CODING") && session.status === "IN_PROGRESS") {
      response.questions = session.assessment.questions;
    }

    // For Voice/GD, include Agora credentials
    if (session.assessment.type === "VOICE" || session.assessment.type === "GD") {
      if (session.agoraChannel && isAgoraConfigured()) {
        response.agora = {
          appId: getAgoraAppId(),
          channel: session.agoraChannel,
          token: session.agoraToken,
          uid: session.agoraUid,
        };
      }
      if (session.gdRoomId) {
        response.gdRoomId = session.gdRoomId;
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[CANDIDATE_ASSESSMENT_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/candidate/assessment/[token]
 * Start or submit assessment
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json();
    const { action, answers, aiTranscript, voiceRecording, gdTranscript, feedback, interviewData } = body;

    // Find the assessment session
    const session = await prisma.candidateAssessmentSession.findFirst({
      where: {
        sessionToken: token,
      },
      include: {
        assessment: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Invalid assessment link" }, { status: 404 });
    }

    // Check if expired
    if (session.expiresAt && new Date() > session.expiresAt) {
      await prisma.candidateAssessmentSession.update({
        where: { id: session.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ error: "Assessment link has expired" }, { status: 410 });
    }

    // Handle different actions
    if (action === "start") {
      // Check if already completed
      if (session.status === "COMPLETED") {
        return NextResponse.json({ error: "Assessment already completed" }, { status: 400 });
      }

      // Update session to IN_PROGRESS
      const updatedSession = await prisma.candidateAssessmentSession.update({
        where: { id: session.id },
        data: {
          status: "IN_PROGRESS",
          startedAt: new Date(),
        },
        include: {
          assessment: {
            select: {
              questions: true,
              type: true,
            },
          },
        },
      });

      // Generate fresh Agora token if needed
      let agoraData = null;
      if ((session.assessment.type === "VOICE" || session.assessment.type === "GD") && isAgoraConfigured()) {
        const channel = session.agoraChannel || `assessment_${session.assessmentId}_${session.id}_${Date.now()}`;
        const uid = session.agoraUid || Math.floor(Math.random() * 100000) + 1;
        
        try {
          const tokenResult = await generateGDToken(channel, uid, "publisher");
          await prisma.candidateAssessmentSession.update({
            where: { id: session.id },
            data: {
              agoraChannel: channel,
              agoraToken: tokenResult.token,
              agoraUid: uid,
            },
          });
          agoraData = {
            appId: getAgoraAppId(),
            channel,
            token: tokenResult.token,
            uid,
          };
        } catch (error) {
          console.error("Failed to generate Agora token:", error);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Assessment started",
        session: {
          id: updatedSession.id,
          status: updatedSession.status,
          startedAt: updatedSession.startedAt,
        },
        questions: updatedSession.assessment.type === "MCQ" || updatedSession.assessment.type === "CODING"
          ? updatedSession.assessment.questions
          : undefined,
        agora: agoraData,
      });
    }

    if (action === "submit") {
      // Check if already completed
      if (session.status === "COMPLETED") {
        return NextResponse.json({ error: "Assessment already completed" }, { status: 400 });
      }

      // Check if started
      if (session.status !== "IN_PROGRESS") {
        return NextResponse.json({ error: "Assessment not started" }, { status: 400 });
      }

      // Calculate score for MCQ
      let score = 0;
      let passed = false;
      const timeTaken = session.startedAt 
        ? Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000)
        : 0;

      if (session.assessment.type === "MCQ" && answers) {
        const questions = session.assessment.questions as any[];
        let totalMarks = 0;
        let scoredMarks = 0;

        questions.forEach((q, index) => {
          const marks = q.marks || 1;
          totalMarks += marks;
          
          const userAnswer = answers[index];
          const correctAnswers = q.correctAnswers || [];
          
          if (Array.isArray(userAnswer) && Array.isArray(correctAnswers)) {
            // Multiple choice
            const isCorrect = userAnswer.length === correctAnswers.length &&
              userAnswer.every((a: number) => correctAnswers.includes(a));
            if (isCorrect) scoredMarks += marks;
          } else {
            // Single choice
            if (correctAnswers.includes(userAnswer)) scoredMarks += marks;
          }
        });

        score = totalMarks > 0 ? Math.round((scoredMarks / totalMarks) * 100) : 0;
        passed = score >= session.assessment.passingScore;
      }

      // For AI/Voice/GD, score comes from AI analysis
      if (session.assessment.type === "AI_INTERVIEW" || 
          session.assessment.type === "VOICE" || 
          session.assessment.type === "GD") {
        // Use provided score from frontend AI analysis or interviewData
        if (interviewData) {
          score = Math.round((interviewData.aggregateScore || 0) * 100);
          passed = score >= session.assessment.passingScore;
        } else {
          score = body.score || 0;
          passed = score >= session.assessment.passingScore;
        }
      }

      // Update session with results
      const completedSession = await prisma.candidateAssessmentSession.update({
        where: { id: session.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          score,
          passed,
          timeTaken,
          answers: answers || null,
          aiTranscript: interviewData?.transcripts ? JSON.stringify(interviewData.transcripts) : (aiTranscript || null),
          voiceRecording: voiceRecording || null,
          gdTranscript: gdTranscript || null,
          feedback: feedback || null,
        },
      });

      // Also create an AssessmentResult record
      await prisma.assessmentResult.create({
        data: {
          assessmentId: session.assessmentId,
          candidateId: session.candidateId,
          score,
          passed,
          timeTaken,
          answers: answers || {},
          startedAt: session.startedAt || new Date(),
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Assessment submitted successfully",
        result: {
          score,
          passed,
          timeTaken: Math.round(timeTaken / 60), // minutes
          passingScore: session.assessment.passingScore,
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[CANDIDATE_ASSESSMENT_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
