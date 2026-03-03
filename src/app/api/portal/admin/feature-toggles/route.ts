/**
 * Admin Portal - Feature Toggles
 * GET   /api/portal/admin/feature-toggles
 * POST  /api/portal/admin/feature-toggles     - Create toggle
 * PATCH /api/portal/admin/feature-toggles/[key] - Toggle on/off
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";
import { z } from "zod";

const CreateToggleSchema = z.object({
  key: z.string().min(1).regex(/^[a-z_][a-z0-9_]*$/),
  label: z.string().min(2),
  description: z.string().optional(),
  enabled: z.boolean().optional().default(false),
});

export async function GET(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (decoded.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const toggles = await prisma.featureToggle.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ toggles });
}

export async function POST(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (decoded.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = CreateToggleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const toggle = await prisma.featureToggle.upsert({
      where: { key: parsed.data.key },
      update: { label: parsed.data.label, description: parsed.data.description },
      create: { ...parsed.data, updatedBy: decoded.email },
    });

    await prisma.portalAuditLog.create({
      data: {
        staffId: decoded.staffId,
        actorEmail: decoded.email,
        actorRole: decoded.role,
        action: "CREATE_FEATURE_TOGGLE",
        entityType: "FeatureToggle",
        entityId: toggle.id,
        metadata: { key: parsed.data.key },
      },
    });

    return NextResponse.json({ success: true, toggle }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
