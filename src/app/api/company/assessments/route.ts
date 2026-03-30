import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCompanyRoles } from "@/lib/company-auth";
import { z } from "zod";

const CreateAssessmentSchema = z.object({
  type: z.enum(["MCQ", "CODING", "AI_INTERVIEW", "VOICE", "GD", "CORPORATE_VOICE"]),
  subType: z.string().optional(), // for CORPORATE_VOICE: read_aloud, listen_repeat, etc.
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  duration: z.number().min(5).max(180).default(30),
  passingScore: z.number().min(0).max(100).default(70),
  passPercentage: z.number().min(0).max(100).optional(), // alias for passingScore
  questions: z.array(z.any()).optional(), // For MCQ, CODING questions
  aiGenerated: z.boolean().default(false),
  // GD config
  gdTopic: z.string().optional(),
  gdMaxCandidates: z.number().min(2).max(50).optional(),
  // Voice config
  voiceAudioOnly: z.boolean().optional(),
  voiceCategories: z.array(z.string()).optional(),
  // Corporate Voice config
  corporateVoiceConfig: z.object({
    passages: z.array(z.string()).optional(),
    audioPrompts: z.array(z.string()).optional(),
    conversationTopic: z.string().optional(),
    extemporaneousTopic: z.string().optional(),
    prepTime: z.number().optional(),
    summarizePassage: z.string().optional(),
  }).optional(),
  // AI generation params (optional)
  aiParams: z.object({
    topic: z.string(),
    difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
    count: z.number().min(1).max(50).default(10)
  }).optional(),
  jobId: z.string().optional(),
});

/**
 * GET /api/company/assessments
 * Fetch all assessments for company jobs
 */
export async function GET(req: NextRequest) {
  try {
    // Verify company member authentication
    const authResult = await requireCompanyRoles(req, ["ADMIN", "HR_RECRUITER", "HIRING_MANAGER"]);
    if (!authResult.authorized || !authResult.member || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const search = searchParams.get("search") || "";

    // Build query filters
    const where: any = {
      companyId: authResult.company.id,
    };
    
    if (type) {
      where.type = type;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }

    // Get all assessments for this company
    const assessments = await prisma.assessment.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        type: true,
        subType: true,
        title: true,
        description: true,
        questions: true,
        duration: true,
        passingScore: true,
        isActive: true,
        aiGenerated: true,
        createdAt: true,
        _count: {
          select: {
            results: true,
            sessions: true,
          },
        },
      },
    });

    // Format the response
    const formattedAssessments = assessments.map((assessment) => ({
      id: assessment.id,
      type: assessment.type,
      subType: assessment.subType,
      title: assessment.title,
      description: assessment.description,
      questionsCount: Array.isArray(assessment.questions) ? assessment.questions.length : 0,
      duration: assessment.duration,
      passPercentage: assessment.passingScore || 70,
      totalAttempts: assessment._count.results,
      sessionsCount: assessment._count.sessions,
      isActive: assessment.isActive,
      aiGenerated: assessment.aiGenerated,
      createdAt: assessment.createdAt.toISOString(),
    }));

    return NextResponse.json({ assessments: formattedAssessments });
  } catch (error) {
    console.error("[COMPANY_ASSESSMENTS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/company/assessments
 * Create a new assessment
 */
export async function POST(req: NextRequest) {
  try {
    // Verify company member authentication
    const authResult = await requireCompanyRoles(req, ["ADMIN", "HR_RECRUITER"]);
    if (!authResult.authorized || !authResult.member || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateAssessmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // If AI generation is requested, questions will be generated later via AI API
    let questions = data.questions || [];
    
    // For non-MCQ types, questions can be empty initially
    if (!["MCQ", "CODING"].includes(data.type)) {
      questions = [];
    }

    // Build config object for assessment types that need it
    let config: Record<string, any> = {};
    
    if (data.type === "GD") {
      if (data.gdTopic) {
        config.topic = data.gdTopic;
      }
      // Store max candidates per GD room (default: 10)
      config.maxCandidates = data.gdMaxCandidates || 10;
    }
    
    if (data.type === "VOICE") {
      config.audioOnly = data.voiceAudioOnly || false;
      config.categories = data.voiceCategories || ["Technical", "Behavioral"];
    }
    
    if (data.type === "CORPORATE_VOICE" && data.corporateVoiceConfig) {
      config = {
        ...data.corporateVoiceConfig,
        subType: data.subType,
      };
    }

    // Create assessment
    const assessment = await prisma.assessment.create({
      data: {
        type: data.type,
        subType: data.subType,
        title: data.title,
        description: data.description,
        duration: data.duration,
        passingScore: data.passingScore || data.passPercentage || 70,
        companyId: authResult.company.id,
        questions: questions,
        config: Object.keys(config).length > 0 ? config : undefined,
        aiGenerated: data.aiGenerated,
        createdBy: authResult.member.id,
      },
    });

    return NextResponse.json({
      success: true,
      assessment: {
        id: assessment.id,
        type: assessment.type,
        subType: assessment.subType,
        title: assessment.title,
        aiGenerated: assessment.aiGenerated,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[COMPANY_ASSESSMENTS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
