/**
 * HR Portal - Interviews
 * GET  /api/portal/hr/interviews
 * POST /api/portal/hr/interviews
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";
import { z } from "zod";

const InterviewSchema = z.object({
  candidateId: z.string().optional(),
  position: z.string().min(1),
  department: z.string().optional(),
  scheduledAt: z.string(),
  durationMinutes: z.number().optional().default(60),
  type: z.enum(["VIDEO", "PHONE", "IN_PERSON"]).optional().default("VIDEO"),
  meetingLink: z.string().optional(),
  interviewerName: z.string().optional(),
  interviewerEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "20"));

  const where: Record<string, unknown> = {};
  if (decoded.role === "HR") where.scheduledBy = decoded.email;
  if (status) where.status = status;

  const [interviews, total] = await Promise.all([
    prisma.interview.findMany({
      where,
      include: { candidate: { select: { id: true, name: true, email: true } } },
      orderBy: { scheduledAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.interview.count({ where }),
  ]);

  return NextResponse.json({ interviews, total, page, limit });
}

export async function POST(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "HR"].includes(decoded.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = InterviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const { scheduledAt, interviewerEmail, ...rest } = parsed.data;

    const interview = await prisma.interview.create({
      data: {
        ...rest,
        interviewerEmail: interviewerEmail || null,
        scheduledAt: new Date(scheduledAt),
        scheduledBy: decoded.email,
      },
      include: { candidate: { select: { id: true, name: true, email: true } } },
    });

    // If candidateId provided, update candidate status to INTERVIEW_SCHEDULED
    if (rest.candidateId) {
      await prisma.candidate.update({
        where: { id: rest.candidateId },
        data: {
          status: "INTERVIEW_SCHEDULED",
          interviewDate: new Date(scheduledAt),
          interviewerName: rest.interviewerName || undefined,
        },
      });
    }

    return NextResponse.json({ success: true, interview }, { status: 201 });
  } catch (err) {
    console.error("[CREATE_INTERVIEW]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
