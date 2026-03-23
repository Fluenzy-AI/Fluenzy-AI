/**
 * Company Portal - Get Current User
 * GET /api/company/auth/me
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCompanyAuthFromRequest } from "@/lib/company-auth";

export async function GET(req: NextRequest) {
  try {
    const decoded = getCompanyAuthFromRequest(req);

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const member = await prisma.companyMember.findUnique({
      where: { id: decoded.memberId, status: "ACTIVE" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        lastLoginAt: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            domain: true,
            logoUrl: true,
            status: true,
            autoApplyEnabled: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found or inactive" }, { status: 401 });
    }

    if (member.company.status === "SUSPENDED") {
      return NextResponse.json({ error: "Company account suspended" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        phone: member.phone,
        avatar: member.avatar,
        lastLoginAt: member.lastLoginAt,
      },
      company: member.company,
    });
  } catch (err) {
    console.error("[COMPANY_ME]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
