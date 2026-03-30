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

    // For Voice/GD, include Agora credentials and config
    if (session.assessment.type === "VOICE" || session.assessment.type === "GD") {
      if (isAgoraConfigured()) {
        // Check if we need to regenerate channel (too long or missing)
        let channel = session.agoraChannel || "";
        let token = session.agoraToken || "";
        let uid = session.agoraUid || Math.floor(Math.random() * 100000) + 1;
        
        // Regenerate if:
        // 1. Channel is missing or too long (64-byte Agora limit)
        // 2. Token is missing or appears invalid (too short - valid tokens are 200+ chars)
        const needsRegeneration = !channel || channel.length > 64 || !token || token.length < 100;
        
        if (needsRegeneration) {
          console.log(`[Assessment GET] Credentials need regeneration - channel: ${channel?.length || 0} chars, token: ${token?.length || 0} chars`);
          const shortSessionId = session.id.substring(0, 8);
          channel = `gd_${shortSessionId}_${Date.now()}`;
          uid = Math.floor(Math.random() * 100000) + 1; // Fresh UID too
          
          try {
            const tokenResult = await generateGDToken(channel, uid, "publisher");
            token = tokenResult.token;
            
            // Update session with new credentials
            await prisma.candidateAssessmentSession.update({
              where: { id: session.id },
              data: {
                agoraChannel: channel,
                agoraToken: token,
                agoraUid: uid,
              },
            });
            console.log(`[Assessment GET] New channel: ${channel} (${channel.length} bytes), uid: ${uid}`);
          } catch (error) {
            console.error("[Assessment GET] Failed to regenerate Agora token:", error);
          }
        }
        
        if (channel && token) {
          response.agora = {
            appId: getAgoraAppId(),
            channel,
            token,
            uid,
          };
        }
      }
      if (session.gdRoomId) {
        response.gdRoomId = session.gdRoomId;
      }
      
      // Extract GD topic and Voice config from assessment config
      const config = session.assessment.config as Record<string, any> | null;
      if (config) {
        if (session.assessment.type === "GD" && config.topic) {
          response.gdTopic = config.topic;
        }
        if (session.assessment.type === "VOICE") {
          response.voiceConfig = {
            audioOnly: config.audioOnly || false,
            categories: config.categories || ["Technical", "Behavioral"],
          };
        }
      }
    }
    
    // For Corporate Voice, include config
    if (session.assessment.type === "CORPORATE_VOICE") {
      const config = session.assessment.config as Record<string, any> | null;
      if (config) {
        response.corporateVoiceConfig = {
          subType: config.subType || "read_aloud",
          passages: config.passages,
          audioPrompts: config.audioPrompts,
          comprehensionAudio: config.comprehensionAudio,
          comprehensionQuestions: config.comprehensionQuestions,
          conversationTopic: config.conversationTopic,
          extemporaneousTopic: config.extemporaneousTopic,
          prepTime: config.prepTime,
          summarizePassage: config.summarizePassage,
          duration: config.duration,
        };
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
        // Create a short channel name (Agora limit: 64 bytes)
        // Always generate a new channel name if the existing one is too long
        let channel = session.agoraChannel || "";
        
        // Validate channel name length and regenerate if invalid
        if (!channel || channel.length > 64) {
          if (channel.length > 64) {
            console.warn(`[Assessment] Existing channel too long (${channel.length} bytes), generating new one`);
          }
          const shortSessionId = session.id.substring(0, 8);
          channel = `gd_${shortSessionId}_${Date.now()}`;
          console.log(`[Assessment] New channel: ${channel} (${channel.length} bytes)`);
        }
        
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

      // Build response
      const responseData: any = {
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
      };
      
      // Add GD topic, Voice config, and Corporate Voice config
      const config = session.assessment.config as Record<string, any> | null;
      if (config) {
        if (session.assessment.type === "GD" && config.topic) {
          responseData.gdTopic = config.topic;
        }
        if (session.assessment.type === "VOICE") {
          responseData.voiceConfig = {
            audioOnly: config.audioOnly || false,
            categories: config.categories || ["Technical", "Behavioral"],
          };
        }
        if (session.assessment.type === "CORPORATE_VOICE") {
          responseData.corporateVoiceConfig = {
            subType: config.subType || "read_aloud",
            passages: config.passages,
            audioPrompts: config.audioPrompts,
            comprehensionAudio: config.comprehensionAudio,
            comprehensionQuestions: config.comprehensionQuestions,
            conversationTopic: config.conversationTopic,
            extemporaneousTopic: config.extemporaneousTopic,
            prepTime: config.prepTime,
            summarizePassage: config.summarizePassage,
            duration: config.duration,
          };
        }
      }

      return NextResponse.json(responseData);
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
