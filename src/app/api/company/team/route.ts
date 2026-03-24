import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCompanyRoles } from "@/lib/company-auth";

/**
 * GET /api/company/team
 * Fetch all team members
 */
export async function GET(req: NextRequest) {
  try {
    // Verify company member authentication (only ADMIN can view team)
    const authResult = await requireCompanyRoles(req, ["ADMIN"]);
    if (!authResult.authorized || !authResult.member || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all team members
    const members = await prisma.companyMember.findMany({
      where: {
        companyId: authResult.company.id,
      },
      orderBy: {
        joinedAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        joinedAt: true,
      },
    });

    const formattedMembers = members.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      status: member.status,
      joinedAt: member.joinedAt?.toISOString() || null,
    }));

    return NextResponse.json({ members: formattedMembers });
  } catch (error) {
    console.error("[COMPANY_TEAM_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
