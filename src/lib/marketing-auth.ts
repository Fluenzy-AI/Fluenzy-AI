/**
 * Marketing API Authentication Helper
 * Checks for either next-auth session (SUPER_ADMIN) or portal token (MARKETING_ADMIN)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPortalAuthFromRequest, DecodedPortalToken } from "@/lib/portal-auth";

export interface MarketingAuthResult {
  authorized: boolean;
  userId?: string;
  email?: string;
  role?: string;
  error?: string;
}

export async function checkMarketingAuth(req: NextRequest): Promise<MarketingAuthResult> {
  // First check next-auth session (for SUPER_ADMIN accessing via superadmin panel)
  const session = await getServerSession(authOptions);
  console.log("[Marketing Auth] Session check:", session?.user?.role);
  if (session?.user && ["SUPER_ADMIN", "MARKETING_ADMIN"].includes(session.user.role as string)) {
    return {
      authorized: true,
      userId: session.user.id,
      email: session.user.email || undefined,
      role: session.user.role as string,
    };
  }

  // Then check portal token (for portal staff accessing marketing)
  const portalAuth = getPortalAuthFromRequest(req);
  console.log("[Marketing Auth] Portal token check:", portalAuth?.role, portalAuth?.email);
  // Allow ADMIN, HR, and MARKETING_ADMIN roles from portal
  if (portalAuth && ["ADMIN", "HR", "MARKETING_ADMIN"].includes(portalAuth.role)) {
    return {
      authorized: true,
      userId: portalAuth.staffId,
      email: portalAuth.email,
      role: portalAuth.role,
    };
  }

  return {
    authorized: false,
    error: "Unauthorized: requires SUPER_ADMIN, ADMIN, HR, or MARKETING_ADMIN role",
  };
}

export function unauthorizedResponse(error?: string): NextResponse {
  return NextResponse.json(
    { error: error || "Unauthorized" },
    { status: 401 }
  );
}
