import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCompanyRoles } from "@/lib/company-auth";

/**
 * PATCH /api/company/applications/[id]
 * Update application status
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify company member authentication
    const authResult = await requireCompanyRoles(req, ["ADMIN", "HR_RECRUITER", "HIRING_MANAGER"]);
    if (!authResult.authorized || !authResult.member || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const { status } = await req.json();

    // Validate status
    const validStatuses = ["PENDING", "SHORTLISTED", "INTERVIEWING", "ACCEPTED", "REJECTED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Update the application
    const application = await prisma.externalJobApplication.update({
      where: {
        id,
        job: {
          companyId: authResult.company.id,
        },
      },
      data: { status },
    });

    return NextResponse.json({ application });
  } catch (error) {
    console.error("[COMPANY_APPLICATION_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
