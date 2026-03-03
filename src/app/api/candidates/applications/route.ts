/**
 * GET /api/candidates/applications
 * Returns all job applications for the logged-in candidate
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCandidateFromRequest } from "@/lib/candidate-auth";

export async function GET(req: NextRequest) {
  const session = getCandidateFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Support both candidateId link and email lookup
  const applications = await prisma.jobApplication.findMany({
    where: {
      OR: [
        { candidateId: session.id },
        { email: session.email },
      ],
    },
    include: {
      job: {
        select: { id: true, title: true, slug: true, department: true, location: true, employmentType: true, salaryRange: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ applications });
}
