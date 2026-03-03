/**
 * GET /api/candidates/me
 * Returns current candidate + profile
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCandidateFromRequest } from "@/lib/candidate-auth";

export async function GET(req: NextRequest) {
  const session = getCandidateFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const candidate = await prisma.candidateUser.findUnique({
    where: { id: session.id },
    select: {
      id: true, name: true, email: true, createdAt: true,
      profile: true,
    },
  });

  if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ candidate });
}
