/**
 * Company Portal Logout API
 * POST /api/company/auth/logout
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getCompanyAuthFromRequest,
  COMPANY_ACCESS_COOKIE,
  COMPANY_REFRESH_COOKIE,
} from "@/lib/company-auth";

export async function POST(req: NextRequest) {
  try {
    const decoded = getCompanyAuthFromRequest(req);

    // Clear refresh token from DB if we have a valid session
    if (decoded?.memberId) {
      await prisma.companyMember.update({
        where: { id: decoded.memberId },
        data: { refreshToken: null },
      }).catch(() => {
        // Ignore if update fails (member might not exist)
      });
    }

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });

    // Clear cookies
    response.cookies.delete(COMPANY_ACCESS_COOKIE);
    response.cookies.delete(COMPANY_REFRESH_COOKIE);

    return response;
  } catch (err) {
    console.error("[COMPANY_LOGOUT]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
