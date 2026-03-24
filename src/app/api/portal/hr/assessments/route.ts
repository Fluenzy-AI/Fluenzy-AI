/**
 * HR Portal - Assessment Management
 * GET  /api/portal/hr/assessments   - List assessments
 * POST /api/portal/hr/assessments   - Create assessment
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";
import { z } from "zod";

const CreateAssessmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  type: z.enum(["MCQ", "CODING", "AI_INTERVIEW", "VOICE", "GD"]),
  duration: z.number().min(5).max(180).default(30),
  passingScore: z.number().min(0).max(100).default(60),
  questions: z.array(z.any()).min(1, "At least one question is required"),
});

export async function GET(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "HR"].includes(decoded.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type");

    const where = {
      ...(type ? { type: type as "MCQ" | "CODING" | "AI_INTERVIEW" | "VOICE" | "GD" } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const assessments = await prisma.hRAssessment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { assignments: true },
        },
        assignments: {
          where: { status: "COMPLETED" },
          select: { id: true },
        },
      },
    });

    const formattedAssessments = assessments.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      type: a.type,
      duration: a.duration,
      passingScore: a.passingScore,
      questionsCount: Array.isArray(a.questions) ? (a.questions as unknown[]).length : 0,
      assigned: a._count.assignments,
      completed: a.assignments.length,
      isActive: a.isActive,
      createdAt: a.createdAt.toISOString(),
      createdBy: a.createdBy,
    }));

    return NextResponse.json({ assessments: formattedAssessments });
  } catch (error) {
    console.error("[HR_ASSESSMENTS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "HR"].includes(decoded.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = CreateAssessmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const assessment = await prisma.hRAssessment.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        type: parsed.data.type,
        duration: parsed.data.duration,
        passingScore: parsed.data.passingScore,
        questions: parsed.data.questions,
        createdBy: decoded.staffId,
      },
    });

    // Audit log
    await prisma.portalAuditLog.create({
      data: {
        staffId: decoded.staffId,
        actorEmail: decoded.email,
        actorRole: decoded.role,
        action: "CREATE_HR_ASSESSMENT",
        entityType: "HRAssessment",
        entityId: assessment.id,
        metadata: { title: assessment.title, type: assessment.type },
      },
    });

    return NextResponse.json({ success: true, assessment }, { status: 201 });
  } catch (error) {
    console.error("[HR_ASSESSMENTS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
