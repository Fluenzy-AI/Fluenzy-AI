/**
 * GET  /api/candidates/notifications  — returns activity-based notifications
 * PATCH /api/candidates/notifications — mark all read (client-side only, no DB model)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCandidateFromRequest } from "@/lib/candidate-auth";

const STATUS_MESSAGES: Record<string, string> = {
  PENDING:              "Your application has been received and is pending review.",
  REVIEWED:             "Your application has been reviewed by the hiring team.",
  SHORTLISTED:          "🎉 Congratulations! You've been shortlisted for this role.",
  INTERVIEW_SCHEDULED:  "📅 Your interview has been scheduled. Check your email for details.",
  REJECTED:             "Thank you for applying. This role has been filled.",
  HIRED:                "🎊 Congratulations! You have been selected for this role!",
};

export async function GET(req: NextRequest) {
  const session = getCandidateFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const applications = await prisma.jobApplication.findMany({
      where: { candidateId: session.id },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        updatedAt: true,
        job: { select: { title: true } },
      },
    });

    const notifications = applications.map(app => ({
      id: app.id,
      type: app.status,
      message: `${app.job.title}: ${STATUS_MESSAGES[app.status] ?? `Status updated to ${app.status}`}`,
      read: false, // client manages read state in memory; no DB model
      createdAt: app.updatedAt.toISOString(),
    }));

    return NextResponse.json({ notifications });
  } catch {
    return NextResponse.json({ notifications: [] });
  }
}

// Mark all read — client handles this in state; just return OK
export async function PATCH(req: NextRequest) {
  const session = getCandidateFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ success: true });
}
