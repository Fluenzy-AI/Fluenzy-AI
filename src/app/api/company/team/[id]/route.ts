import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCompanyRoles } from "@/lib/company-auth";

/**
 * PATCH /api/company/team/[id]
 * Update team member status
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify company member authentication (only ADMIN can update team)
    const authResult = await requireCompanyRoles(req, ["ADMIN"]);
    if (!authResult.authorized || !authResult.member || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { status } = await req.json();

    // Validate status
    const validStatuses = ["ACTIVE", "SUSPENDED", "PENDING"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Update the member
    const member = await prisma.companyMember.update({
      where: {
        id,
        companyId: authResult.company.id,
      },
      data: { status },
    });

    return NextResponse.json({ member });
  } catch (error) {
    console.error("[COMPANY_TEAM_MEMBER_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
