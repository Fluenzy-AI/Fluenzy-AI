/**
 * GET  /api/candidates/profile  - Get candidate profile
 * PUT  /api/candidates/profile  - Update candidate profile
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCandidateFromRequest, calcProfileCompletion } from "@/lib/candidate-auth";

const UpdateSchema = z.object({
  phone: z.string().optional(),
  education: z.string().optional(),
  experience: z.string().optional(),
  skills: z.array(z.string()).optional(),
  resumeUrl: z.string().optional(),
  resumeName: z.string().optional(),
  linkedin: z.string().optional(),
  portfolio: z.string().optional(),
  address: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = getCandidateFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.candidateProfile.findUnique({ where: { candidateId: session.id } });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  const session = getCandidateFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  const data = parsed.data;
  const profileCompletion = calcProfileCompletion(data);

  const profile = await prisma.candidateProfile.upsert({
    where: { candidateId: session.id },
    update: { ...data, profileCompletion, updatedAt: new Date() },
    create: {
      candidateId: session.id,
      ...data,
      skills: data.skills ?? [],
      profileCompletion,
      updatedAt: new Date(),
    },
  });

  // Also update name if provided separately (from candidate user)
  if (body.name) {
    await prisma.candidateUser.update({ where: { id: session.id }, data: { name: body.name } });
  }

  return NextResponse.json({ success: true, profile });
}
