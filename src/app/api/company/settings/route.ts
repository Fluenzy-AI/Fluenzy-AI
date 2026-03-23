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

    const settings = {
      name: authResult.company.name,
      domain: authResult.company.domain,
      website: authResult.company.website || "",
      location: authResult.company.location || "",
      size: authResult.company.size || "",
      about: authResult.company.about || "",
      logoUrl: authResult.company.logoUrl || "",
      autoApplyEnabled: authResult.company.autoApplyEnabled,
    };

    return NextResponse.json({ settings });
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

    const { name, website, location, size, about, logoUrl, autoApplyEnabled } = await req.json();

    // Update company
    const company = await prisma.company.update({
      where: { id: authResult.company.id },
      data: {
        name,
        website,
        location,
        size,
        about,
        logoUrl,
        autoApplyEnabled,
      },
    });

    return NextResponse.json({ company });
  } catch (error) {
    console.error("[COMPANY_SETTINGS_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
