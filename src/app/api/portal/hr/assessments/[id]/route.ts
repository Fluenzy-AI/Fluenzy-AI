/**
 * HR Portal - Single Assessment Operations
 * GET    /api/portal/hr/assessments/[id] - Get assessment details
 * PUT    /api/portal/hr/assessments/[id] - Update assessment
 * DELETE /api/portal/hr/assessments/[id] - Delete assessment
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";
import { z } from "zod";

const UpdateAssessmentSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  duration: z.number().min(5).max(180).optional(),
  passingScore: z.number().min(0).max(100).optional(),
  questions: z.array(z.any()).optional(),
  isActive: z.boolean().optional(),
});

const AssignCandidatesSchema = z.object({
  candidateIds: z.array(z.string()).min(1, "Select at least one candidate"),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "HR"].includes(decoded.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;

    const assessment = await prisma.hRAssessment.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            candidate: {
              select: {
                id: true,
                name: true,
                email: true,
                position: true,
              },
            },
          },
          orderBy: { assignedAt: "desc" },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    return NextResponse.json({ assessment });
  } catch (error) {
    console.error("[HR_ASSESSMENT_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "HR"].includes(decoded.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    // Check if this is an assign operation
    if (body.action === "assign") {
      const parsed = AssignCandidatesSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      // Create assignments for each candidate
      const assignments = await Promise.all(
        parsed.data.candidateIds.map(async (candidateId) => {
          return prisma.hRAssessmentAssignment.upsert({
            where: {
              assessmentId_candidateId: {
                assessmentId: id,
                candidateId,
              },
            },
            create: {
              assessmentId: id,
              candidateId,
              assignedBy: decoded.staffId,
            },
            update: {
              status: "PENDING",
              assignedAt: new Date(),
              assignedBy: decoded.staffId,
            },
          });
        })
      );

      return NextResponse.json({
        success: true,
        message: `Assessment assigned to ${assignments.length} candidate(s)`,
        assignments,
      });
    }

    // Regular update operation
    const parsed = UpdateAssessmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const assessment = await prisma.hRAssessment.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, assessment });
  } catch (error) {
    console.error("[HR_ASSESSMENT_PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (decoded.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can delete assessments" }, { status: 403 });
  }

  try {
    const { id } = await params;

    await prisma.hRAssessment.delete({
      where: { id },
    });

    // Audit log
    await prisma.portalAuditLog.create({
      data: {
        staffId: decoded.staffId,
        actorEmail: decoded.email,
        actorRole: decoded.role,
        action: "DELETE_HR_ASSESSMENT",
        entityType: "HRAssessment",
        entityId: id,
        metadata: {},
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[HR_ASSESSMENT_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
