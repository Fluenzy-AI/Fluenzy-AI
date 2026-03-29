/**
 * Assessment Token Validation API
 * POST /api/assessments/validate-token
 * Validate assessment token and return assessment data for candidates
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const ValidateTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
  candidateEmail: z.string().email("Valid email is required").optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ValidateTokenSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { token, candidateEmail } = parsed.data;

    // Find assessment session by token
    const session = await prisma.candidateAssessmentSession?.findFirst({
      where: { sessionToken: token },
      include: {
        assessment: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
              }
            }
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: "Invalid or expired assessment token" },
        { status: 404 }
      );
    }

    // Check if already completed
    if (session.status === "COMPLETED") {
      return NextResponse.json(
        { 
          error: "Assessment already completed",
          completedAt: session.completedAt?.toISOString(),
        },
        { status: 409 }
      );
    }

    // Return assessment data (without showing correct answers)
    const assessmentData = {
      id: session.assessment.id,
      sessionId: session.id,
      sessionToken: session.sessionToken,
      title: session.assessment.title,
      description: session.assessment.description,
      type: session.assessment.type,
      subType: session.assessment.subType,
      duration: session.assessment.duration,
      passingScore: session.assessment.passingScore,
      questions: sanitizeQuestions(session.assessment.questions, session.assessment.type),
      company: session.assessment.company,
      candidateEmail: session.candidateEmail,
      candidateName: session.candidateName,
      status: session.status,
      startedAt: session.startedAt?.toISOString(),
      expiresAt: session.expiresAt?.toISOString(),
    };

    return NextResponse.json({
      success: true,
      assessment: assessmentData,
    });

  } catch (error: any) {
    console.error("[VALIDATE_TOKEN]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Remove correct answers and sensitive data from questions
 */
function sanitizeQuestions(questions: any, type: string): any {
  if (!Array.isArray(questions)) return [];

  switch (type) {
    case "MCQ":
      return questions.map((q: any) => ({
        question: q.question,
        options: q.options,
        // Remove correctAnswer and explanation
      }));

    case "CODING":
      return questions.map((q: any) => ({
        title: q.title,
        description: q.description,
        difficulty: q.difficulty,
        hints: q.hints,
        timeLimit: q.timeLimit,
        memoryLimit: q.memoryLimit,
        // Remove testCases or only show sample cases
        sampleTestCases: q.testCases?.slice(0, 2) || [],
      }));

    default:
      // For other types (AI_INTERVIEW, VOICE, GD, CORPORATE_VOICE)
      return questions;
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}