/**
 * GET /api/candidates/me
 * Returns current candidate + profile + linked user plan
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

  // Try to find linked main user account by email
  const linkedUser = await prisma.users.findUnique({
    where: { email: candidate.email },
    select: { plan: true, id: true },
  });

  return NextResponse.json({
    candidate,
    user: linkedUser ? { plan: linkedUser.plan } : { plan: "Free" },
  });
}
