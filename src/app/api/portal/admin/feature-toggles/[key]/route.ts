/**
 * Admin Portal - Toggle Feature ON/OFF
 * PATCH /api/portal/admin/feature-toggles/[key]
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (decoded.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { key } = await params;
  const { enabled } = await req.json();

  const toggle = await prisma.featureToggle.update({
    where: { key },
    data: { enabled, updatedBy: decoded.email },
  });

  await prisma.portalAuditLog.create({
    data: {
      staffId: decoded.staffId,
      actorEmail: decoded.email,
      actorRole: decoded.role,
      action: enabled ? "ENABLE_FEATURE" : "DISABLE_FEATURE",
      entityType: "FeatureToggle",
      metadata: { key, enabled },
    },
  });

  return NextResponse.json({ success: true, toggle });
}
