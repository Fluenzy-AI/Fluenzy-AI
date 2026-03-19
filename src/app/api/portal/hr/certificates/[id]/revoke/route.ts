/**
 * HR Portal - Revoke Certificate
 * POST /api/portal/hr/certificates/[id]/revoke
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (decoded.role !== "ADMIN" && decoded.role !== "HR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const { reason } = await req.json();

    const certificate = await prisma.certificate.findUnique({
      where: { id },
    });

    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    if (certificate.status === "REVOKED") {
      return NextResponse.json({ error: "Certificate already revoked" }, { status: 400 });
    }

    const updated = await prisma.certificate.update({
      where: { id },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
        revokedBy: decoded.email,
        revocationReason: reason || "No reason provided",
      },
    });

    return NextResponse.json({
      success: true,
      certificate: {
        id: updated.id,
        certificateNumber: updated.certificateNumber,
        status: updated.status,
        revokedAt: updated.revokedAt,
        revokedBy: updated.revokedBy,
      },
    });
  } catch (err) {
    console.error("[Certificate revoke error]", err);
    return NextResponse.json({ error: "Failed to revoke certificate" }, { status: 500 });
  }
}