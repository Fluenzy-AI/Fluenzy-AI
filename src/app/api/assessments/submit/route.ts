/**
 * Assessment Submission API
 * POST /api/assessments/submit
 * Submit assessment answers and get evaluation
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { evaluateMCQAnswers, evaluateTextAnswer, type MCQQuestion } from "@/lib/gemini";

const SubmitAssessmentSchema = z.object({
  token: z.string(),
  answers: z.record(z.string(), z.any()), // Flexible to accommodate different answer formats
  duration: z.number().min(0), // Duration in seconds
  cheatingEvents: z.array(z.object({
    type: z.string(),
    timestamp: z.string(),
    data: z.any().optional(),
  })).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SubmitAssessmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { token, answers, duration, cheatingEvents } = parsed.data;

    // Find assessment session by token
    const session = await prisma.candidateAssessmentSession.findFirst({
      where: { sessionToken: token },
      include: {
        assessment: true,
        application: true,
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: "Invalid assessment token" },
        { status: 404 }
      );
    }

    if (session.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Assessment already completed" },
        { status: 400 }
      );
    }

    if (session.status === "EXPIRED" || (session.expiresAt && new Date() > session.expiresAt)) {
      return NextResponse.json(
        { error: "Assessment token has expired" },
        { status: 400 }
      );
    }

    // Evaluate answers based on assessment type
    let evaluation: any = null;
    let breakdown: any = null;
    let aiFeedback: string | null = null;

    try {
      if (session.assessment.type === "MCQ") {
        const mcqQuestions = session.assessment.questions as unknown as MCQQuestion[];
        const userAnswers = Object.values(answers) as number[];
        
        evaluation = evaluateMCQAnswers(mcqQuestions, userAnswers);
        breakdown = {
          correctAnswers: evaluation.correctAnswers,
          totalQuestions: evaluation.totalQuestions,
          score: evaluation.score,
          questionsBreakdown: evaluation.questionsBreakdown,
        };
      } else if (session.assessment.type === "CODING") {
        // For coding assessments
        const questions = session.assessment.questions as any[];
        const textEvaluations = [];
        let totalScore = 0;

        for (let i = 0; i < questions.length; i++) {
          const question = questions[i];
          const userAnswer = answers[i.toString()] as string;
          
          const result = await evaluateTextAnswer(
            question.question,
            userAnswer,
            question.modelAnswer,
            question.context
          );
          
          textEvaluations.push(result);
          totalScore += result.score;
        }

        evaluation = {
          score: totalScore / questions.length,
          questionsBreakdown: textEvaluations,
        };
        
        breakdown = evaluation;
        aiFeedback = textEvaluations.map(e => e.feedback).join("\n\n");
      }
    } catch (aiError) {
      console.error("[ASSESSMENT_SUBMIT] AI evaluation error:", aiError);
      // Continue without AI evaluation - store basic submission
    }

    // Create or update assessment result
    const result = await prisma.assessmentResult.upsert({
      where: {
        id: session.candidateId + "_" + session.assessmentId,
      },
      update: {
        answers: answers as any,
        score: evaluation?.score || 0,
        timeTaken: duration,
        aiFeedback,
        cheatingEvents: cheatingEvents ? JSON.stringify(cheatingEvents) : null,
        flagged: (cheatingEvents && cheatingEvents.length > 5) || false,
        completedAt: new Date(),
      },
      create: {
        id: session.candidateId + "_" + session.assessmentId,
        candidateId: session.candidateId,
        assessmentId: session.assessmentId,
        answers: answers as any,
        score: evaluation?.score || 0,
        timeTaken: duration,
        aiFeedback,
        cheatingEvents: cheatingEvents ? JSON.stringify(cheatingEvents) : null,
        flagged: (cheatingEvents && cheatingEvents.length > 5) || false,
        startedAt: new Date(),
        completedAt: new Date(),
        passed: (evaluation?.score || 0) >= 0.7,
        breakdown: breakdown ? JSON.stringify(breakdown) : null,
      }
    });

    // Update session status
    await prisma.candidateAssessmentSession.update({
      where: { id: session.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      result: {
        id: result.id,
        score: result.score,
        duration: result.timeTaken,
        aiFeedback: result.aiFeedback,
        flagged: result.flagged,
        submittedAt: result.completedAt,
      }
    });

  } catch (error: any) {
    console.error("[ASSESSMENT_SUBMIT]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
