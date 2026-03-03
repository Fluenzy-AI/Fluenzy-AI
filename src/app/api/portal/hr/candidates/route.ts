/**
 * HR Portal - Candidate Management
 * GET  /api/portal/hr/candidates   - List candidates
 * POST /api/portal/hr/candidates   - Create candidate
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";
import { z } from "zod";

const CreateCandidateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  position: z.string().min(1),
  department: z.string().optional(),
  source: z.string().optional(),
  expectedSalary: z.number().optional(),
  currentSalary: z.number().optional(),
  experience: z.number().optional(),
  skills: z.array(z.string()).optional(),
  resumeUrl: z.string().optional(),
  interviewDate: z.string().optional(),
  interviewNotes: z.string().optional(),
  interviewerName: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "HR"].includes(decoded.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status");

  const where = {
    ...(decoded.role === "HR" ? { hrId: decoded.staffId } : {}),
    ...(status ? { status: status as "APPLIED" | "SCREENING" | "INTERVIEW_SCHEDULED" | "INTERVIEWED" | "OFFERED" | "JOINED" | "REJECTED" | "WITHDRAWN" } : {}),
    ...(search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { position: { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const [total, candidates] = await Promise.all([
    prisma.candidate.count({ where }),
    prisma.candidate.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ candidates, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "HR"].includes(decoded.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = CreateCandidateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const { interviewDate, ...rest } = parsed.data;
    const candidate = await prisma.candidate.create({
      data: {
        ...rest,
        hrId: decoded.staffId,
        skills: rest.skills || [],
        ...(interviewDate ? { interviewDate: new Date(interviewDate) } : {}),
      },
    });

    await prisma.portalAuditLog.create({
      data: {
        staffId: decoded.staffId,
        actorEmail: decoded.email,
        actorRole: decoded.role,
        action: "CREATE_CANDIDATE",
        entityType: "Candidate",
        entityId: candidate.id,
        metadata: { name: candidate.name, email: candidate.email, position: candidate.position },
      },
    });

    return NextResponse.json({ success: true, candidate }, { status: 201 });
  } catch (err) {
    console.error("[CREATE_CANDIDATE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
