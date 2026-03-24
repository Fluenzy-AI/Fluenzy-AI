/**
 * GET /api/candidates/applications/[id]
 * Returns single application details with job and company info
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCandidateSession } from "@/lib/candidate-auth";

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const session = await getCandidateSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find application - can be either internal JobApplication or ExternalJobApplication
    let application: any = await prisma.externalJobApplication.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    });

    // If not found in ExternalJobApplication, try JobApplication
    if (!application) {
      application = await prisma.jobApplication.findUnique({
        where: { id },
        include: {
          job: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  logoUrl: true,
                },
              },
            },
          },
        },
      });
    }

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Verify ownership
    if (application.candidateId && application.candidateId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify email ownership if candidateId is null
    if (!application.candidateId) {
      const candidate = await prisma.candidateUser.findUnique({
        where: { id: session.id },
        select: { email: true },
      });
      if (!candidate || candidate.email.toLowerCase() !== application.email.toLowerCase()) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      application,
    });
  } catch (error) {
    console.error("[GET_APPLICATION]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
