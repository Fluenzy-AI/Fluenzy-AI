import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCompanyRoles } from "@/lib/company-auth";
import { z } from "zod";

const ScheduleInterviewSchema = z.object({
  applicationId: z.string(),
  scheduledAt: z.string(),
  interviewerName: z.string().optional(),
  interviewerEmail: z.string().email().optional().or(z.literal("")),
  meetingLink: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/company/interviews
 * List all scheduled interviews for company job applications
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireCompanyRoles(req, ["ADMIN", "HR_RECRUITER", "HIRING_MANAGER"]);
    if (!authResult.authorized || !authResult.member || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = authResult.company.id;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    // Fetch applications for company jobs that have interview scheduled or date set
    const applications = await prisma.externalJobApplication.findMany({
      where: {
        job: { companyId },
        OR: [
          { status: "INTERVIEW_SCHEDULED" },
          { interviewDate: { not: null } },
        ],
        ...(status ? { status: status as any } : {}),
      },
      orderBy: { interviewDate: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        interviewDate: true,
        notes: true,
        job: {
          select: {
            id: true,
            title: true,
            department: true,
          },
        },
      },
    });

    const interviews = applications.map((app) => ({
      id: app.id,
      applicationId: app.id,
      candidateName: app.name,
      candidateEmail: app.email,
      candidatePhone: app.phone,
      jobTitle: app.job.title,
      department: app.job.department,
      scheduledAt: app.interviewDate ? app.interviewDate.toISOString() : null,
      status: app.status,
      notes: app.notes || "",
    }));

    return NextResponse.json({
      success: true,
      interviews,
    });
  } catch (error) {
    console.error("[COMPANY_INTERVIEWS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/company/interviews
 * Schedule a new interview for a candidate application
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireCompanyRoles(req, ["ADMIN", "HR_RECRUITER", "HIRING_MANAGER"]);
    if (!authResult.authorized || !authResult.member || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ScheduleInterviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }

    const { applicationId, scheduledAt, interviewerName, notes } = parsed.data;

    // Verify application belongs to company job
    const existingApp = await prisma.externalJobApplication.findFirst({
      where: {
        id: applicationId,
        job: { companyId: authResult.company.id },
      },
      include: { job: true },
    });

    if (!existingApp) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Update application with interview date and status
    const updatedApp = await prisma.externalJobApplication.update({
      where: { id: applicationId },
      data: {
        status: "INTERVIEW_SCHEDULED",
        interviewDate: new Date(scheduledAt),
        notes: notes ? `${existingApp.notes || ""}\n[Interview Scheduled with ${interviewerName || "Recruiter"}]: ${notes}`.trim() : existingApp.notes,
      },
    });

    return NextResponse.json({
      success: true,
      interview: {
        id: updatedApp.id,
        candidateName: updatedApp.name,
        jobTitle: existingApp.job.title,
        scheduledAt: updatedApp.interviewDate?.toISOString(),
        status: updatedApp.status,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[COMPANY_INTERVIEWS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
