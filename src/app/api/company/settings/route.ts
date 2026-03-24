import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCompanyRoles } from "@/lib/company-auth";

/**
 * GET /api/company/settings
 * Get company settings
 */
export async function GET(req: NextRequest) {
  try {
    // Verify company member authentication
    const authResult = await requireCompanyRoles(req, ["ADMIN", "HR_RECRUITER", "HIRING_MANAGER"]);
    if (!authResult.authorized || !authResult.member || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch full company settings
    const company = await prisma.company.findUnique({
      where: { id: authResult.company.id },
      select: {
        name: true,
        domain: true,
        website: true,
        size: true,
        description: true,
        logoUrl: true,
        autoApplyEnabled: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({ settings: company });
  } catch (error) {
    console.error("[COMPANY_SETTINGS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/company/settings
 * Update company settings
 */
export async function PATCH(req: NextRequest) {
  try {
    // Verify company member authentication (only ADMIN can update settings)
    const authResult = await requireCompanyRoles(req, ["ADMIN"]);
    if (!authResult.authorized || !authResult.member || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, website, size, description, logoUrl, autoApplyEnabled } = await req.json();

    // Update company
    const company = await prisma.company.update({
      where: { id: authResult.company.id },
      data: {
        ...(name !== undefined && { name }),
        ...(website !== undefined && { website }),
        ...(size !== undefined && { size }),
        ...(description !== undefined && { description }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(autoApplyEnabled !== undefined && { autoApplyEnabled }),
      },
    });

    return NextResponse.json({ company });
  } catch (error) {
    console.error("[COMPANY_SETTINGS_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
