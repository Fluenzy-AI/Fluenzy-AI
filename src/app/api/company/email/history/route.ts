import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCompanyRoles } from "@/lib/company-auth";

/**
 * GET /api/company/email/history
 * Fetch email log history sent by company members
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireCompanyRoles(req, ["ADMIN", "HR_RECRUITER", "HIRING_MANAGER"]);
    if (!authResult.authorized || !authResult.member || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Fetch all members of this company to filter email logs
    const companyMembers = await prisma.companyMember.findMany({
      where: { companyId: authResult.company.id },
      select: { email: true, id: true },
    });

    const memberEmails = companyMembers.map((m) => m.email);

    const where: Record<string, unknown> = {
      senderEmail: { in: memberEmails },
    };

    if (search) {
      where.OR = [
        { recipientEmail: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.portalEmailLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.portalEmailLog.count({ where }),
    ]);

    const formattedLogs = logs.map((log) => ({
      id: log.id,
      recipientEmail: log.recipientEmail,
      senderEmail: log.senderEmail,
      subject: log.subject,
      body: log.body,
      templateId: log.templateId,
      status: log.status,
      sentAt: (log.sentAt || log.createdAt || new Date()).toISOString(),
    }));

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[COMPANY_EMAIL_HISTORY_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
