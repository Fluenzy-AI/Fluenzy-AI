/**
 * AI Evaluate Answer API
 * POST /api/ai/evaluate-answer
 * Evaluate assessment answers using Gemini
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { 
  evaluateTextAnswer, 
  evaluateMCQAnswers, 
  evaluateCodingSubmission,
  evaluateInterviewTranscript,
  type MCQQuestion,
  type EvaluationResult 
} from "@/lib/gemini";

// Base schema
const BaseEvaluationSchema = z.object({
  type: z.enum(["MCQ", "CODING", "TEXT", "INTERVIEW"]),
});

// MCQ evaluation schema
const MCQEvaluationSchema = z.object({
  type: z.literal("MCQ"),
  questions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()),
    correctAnswer: z.number(),
    explanation: z.string().optional(),
    difficulty: z.string().optional(),
    topic: z.string().optional(),
  })),
  userAnswers: z.array(z.number()),
});

// Coding evaluation schema
const CodingEvaluationSchema = z.object({
  type: z.literal("CODING"),
  code: z.string(),
  language: z.string(),
  problem: z.object({
    title: z.string(),
    description: z.string(),
    testCases: z.array(z.object({
      input: z.string(),
      output: z.string(),
    })),
  }),
});

// Text evaluation schema
const TextEvaluationSchema = z.object({
  type: z.literal("TEXT"),
  question: z.string(),
  userAnswer: z.string(),
  modelAnswer: z.string().optional(),
  context: z.string().optional(),
});

// Interview evaluation schema
const InterviewEvaluationSchema = z.object({
  type: z.literal("INTERVIEW"),
  role: z.string(),
  experienceLevel: z.string().optional(),
  transcript: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const baseValidation = BaseEvaluationSchema.safeParse(body);
    if (!baseValidation.success) {
      return NextResponse.json(
        { error: "Invalid evaluation type", details: baseValidation.error.flatten() },
        { status: 400 }
      );
    }

    const { type } = baseValidation.data;

    try {
      let result: EvaluationResult;

      switch (type) {
        case "MCQ": {
          const mcqValidation = MCQEvaluationSchema.safeParse(body);
          if (!mcqValidation.success) {
            return NextResponse.json(
              { error: "Invalid MCQ evaluation data", details: mcqValidation.error.flatten() },
              { status: 400 }
            );
          }

          const { questions, userAnswers } = mcqValidation.data;
          result = evaluateMCQAnswers(questions as MCQQuestion[], userAnswers);
          break;
        }

        case "CODING": {
          const codingValidation = CodingEvaluationSchema.safeParse(body);
          if (!codingValidation.success) {
            return NextResponse.json(
              { error: "Invalid coding evaluation data", details: codingValidation.error.flatten() },
              { status: 400 }
            );
          }

          const { code, language, problem } = codingValidation.data;
          result = await evaluateCodingSubmission(
            code,
            language,
            problem.testCases,
            problem.description
          );
          break;
        }

        case "TEXT": {
          const textValidation = TextEvaluationSchema.safeParse(body);
          if (!textValidation.success) {
            return NextResponse.json(
              { error: "Invalid text evaluation data", details: textValidation.error.flatten() },
              { status: 400 }
            );
          }

          const { question, userAnswer, modelAnswer, context } = textValidation.data;
          result = await evaluateTextAnswer(question, userAnswer, modelAnswer, context);
          break;
        }

        case "INTERVIEW": {
          const interviewValidation = InterviewEvaluationSchema.safeParse(body);
          if (!interviewValidation.success) {
            return NextResponse.json(
              { error: "Invalid interview evaluation data", details: interviewValidation.error.flatten() },
              { status: 400 }
            );
          }

          const { role, experienceLevel, transcript } = interviewValidation.data;
          result = await evaluateInterviewTranscript(role, transcript, experienceLevel);
          break;
        }

        default:
          return NextResponse.json(
            { error: "Unsupported evaluation type" },
            { status: 400 }
          );
      }

      return NextResponse.json({
        success: true,
        evaluation: result,
        metadata: {
          type,
          evaluatedAt: new Date().toISOString(),
        }
      });

    } catch (geminiError: any) {
      console.error("[AI_EVALUATE_ANSWER] Gemini error:", geminiError);
      
      return NextResponse.json(
        { 
          error: "Failed to evaluate answer", 
          message: "AI evaluation service is temporarily unavailable. Please try again.",
          details: geminiError.message 
        },
        { status: 503 }
      );
    }

  } catch (error: any) {
    console.error("[AI_EVALUATE_ANSWER]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}