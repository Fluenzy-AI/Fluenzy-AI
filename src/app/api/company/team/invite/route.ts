import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCompanyRoles, generateOtp } from "@/lib/company-auth";

/**
 * POST /api/company/team/invite
 * Invite a new team member
 */
export async function POST(req: NextRequest) {
  try {
    // Verify company member authentication (only ADMIN can invite)
    const authResult = await requireCompanyRoles(req, ["ADMIN"]);
    if (!authResult.authorized || !authResult.member || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, role } = await req.json();

    // Validate inputs
    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    const validRoles = ["ADMIN", "HR_RECRUITER", "HIRING_MANAGER"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if email domain matches company domain
    const emailDomain = email.split("@")[1];
    if (emailDomain !== authResult.company.domain) {
      return NextResponse.json(
        { error: `Email must belong to ${authResult.company.domain} domain` },
        { status: 400 }
      );
    }

    // Check if member already exists
    const existingMember = await prisma.companyMember.findFirst({
      where: {
        email,
        companyId: authResult.company.id,
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: "Member already exists" }, { status: 400 });
    }

    // Generate OTP and send invite email
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store OTP
    await prisma.companyOtp.create({
      data: {
        email,
        otp,
        expiresAt,
      },
    });

    // TODO: Send invitation email with OTP
    console.log(`[TEAM_INVITE] OTP for ${email}: ${otp}`);

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
    });
  } catch (error) {
    console.error("[COMPANY_TEAM_INVITE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
