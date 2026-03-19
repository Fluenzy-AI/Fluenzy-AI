/**
 * HR Portal - Single Certificate Details
 * GET /api/portal/hr/certificates/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        candidate: { select: { id: true, name: true, email: true, phone: true } },
        employee: { select: { id: true, name: true, email: true, phone: true } },
        verifications: {
          orderBy: { verifiedAt: "desc" },
          take: 10,
        },
      },
    });

    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    return NextResponse.json({
      certificate: {
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        type: certificate.type,
        status: certificate.status,
        data: certificate.data,
        pdfUrl: certificate.pdfUrl,
        qrCodeDataUrl: certificate.qrCodeDataUrl,
        issuedBy: certificate.issuedBy,
        issuedAt: certificate.issuedAt,
        sentViaEmail: certificate.sentViaEmail,
        emailSentAt: certificate.emailSentAt,
        revokedAt: certificate.revokedAt,
        revokedBy: certificate.revokedBy,
        revocationReason: certificate.revocationReason,
        candidate: certificate.candidate,
        employee: certificate.employee,
        verifications: certificate.verifications,
        createdAt: certificate.createdAt,
        updatedAt: certificate.updatedAt,
      },
    });
  } catch (err) {
    console.error("[Certificate details error]", err);
    return NextResponse.json({ error: "Failed to fetch certificate" }, { status: 500 });
  }
}