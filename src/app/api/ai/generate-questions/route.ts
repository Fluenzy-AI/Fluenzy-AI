/**
 * AI Generate Questions API
 * POST /api/ai/generate-questions
 * Generate MCQ/Coding questions using Gemini
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateMCQQuestions, generateCodingChallenge } from "@/lib/gemini";

const GenerateQuestionsSchema = z.object({
  type: z.enum(["MCQ", "CODING"]),
  topic: z.string().min(3, "Topic must be at least 3 characters"),
  count: z.number().min(1).max(50).default(10),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = GenerateQuestionsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { type, topic, count, difficulty } = parsed.data;

    try {
      if (type === "MCQ") {
        const questions = await generateMCQQuestions(topic, count, difficulty);
        
        return NextResponse.json({
          success: true,
          questions,
          metadata: {
            type: "MCQ",
            topic,
            count: questions.length,
            difficulty,
            generatedAt: new Date().toISOString(),
          }
        });
      } 
      
      if (type === "CODING") {
        const challenge = await generateCodingChallenge(topic, difficulty);
        
        return NextResponse.json({
          success: true,
          questions: [challenge],
          metadata: {
            type: "CODING",
            topic,
            count: 1,
            difficulty,
            generatedAt: new Date().toISOString(),
          }
        });
      }

      return NextResponse.json(
        { error: "Unsupported question type" },
        { status: 400 }
      );

    } catch (geminiError: any) {
      console.error("[AI_GENERATE_QUESTIONS] Gemini error:", geminiError);
      
      return NextResponse.json(
        { 
          error: "Failed to generate questions", 
          message: "AI service is temporarily unavailable. Please try again.",
          details: geminiError.message 
        },
        { status: 503 }
      );
    }

  } catch (error: any) {
    console.error("[AI_GENERATE_QUESTIONS]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}