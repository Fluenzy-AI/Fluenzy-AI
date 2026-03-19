/**
 * Public Certificate Verification API
 * GET /api/verify/[certificateNumber]
 * No authentication required - public endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ certificateNumber: string }> }
) {
  const { certificateNumber } = await params;

  try {
    const certificate = await prisma.certificate.findUnique({
      where: { certificateNumber },
      include: {
        candidate: { select: { name: true, email: true } },
        employee: { select: { name: true, email: true } },
      },
    });

    if (!certificate) {
      return NextResponse.json({
        valid: false,
        error: "Certificate not found",
      });
    }

    // Log verification attempt
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    await prisma.certificateVerification.create({
      data: {
        certificateId: certificate.id,
        ipAddress,
        userAgent,
      },
    });

    const data = certificate.data as any;

    if (certificate.status === "REVOKED") {
      return NextResponse.json({
        valid: false,
        status: "REVOKED",
        certificate: {
          certificateNumber: certificate.certificateNumber,
          type: certificate.type,
          candidateName: certificate.candidate?.name || certificate.employee?.name || data?.candidateName,
          revokedAt: certificate.revokedAt,
          revokedBy: certificate.revokedBy,
          revocationReason: certificate.revocationReason,
        },
      });
    }

    return NextResponse.json({
      valid: true,
      status: "VALID",
      certificate: {
        certificateNumber: certificate.certificateNumber,
        type: certificate.type,
        candidateName: certificate.candidate?.name || certificate.employee?.name || data?.candidateName,
        position: data?.position,
        department: data?.department,
        organization: data?.companyName || "Fluenzy AI",
        issuedDate: certificate.issuedAt,
        startDate: data?.startDate,
        endDate: data?.endDate,
        duration: data?.duration,
        qrCodeDataUrl: certificate.qrCodeDataUrl,
      },
    });
  } catch (err) {
    console.error("[Certificate verification error]", err);
    return NextResponse.json({
      valid: false,
      error: "Verification failed",
    }, { status: 500 });
  }
}