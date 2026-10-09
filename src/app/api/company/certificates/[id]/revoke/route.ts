import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCompanyAuthFromRequest } from "@/lib/company-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = getCompanyAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const { reason } = await req.json();

    const certificate = await prisma.certificate.findUnique({
      where: { id },
    });

    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    // MULTI-TENANT AUTHORIZATION CHECK:
    // Ensure the certificate belongs to this company (issued by a company member)
    const companyMembers = await prisma.companyMember.findMany({
      where: { companyId: decoded.companyId },
      select: { email: true },
    });

    const companyEmails = companyMembers.map((m) => m.email.toLowerCase());
    if (decoded.email && !companyEmails.includes(decoded.email.toLowerCase())) {
      companyEmails.push(decoded.email.toLowerCase());
    }

    if (!certificate.issuedBy || !companyEmails.includes(certificate.issuedBy.toLowerCase())) {
      return NextResponse.json({ error: "Certificate not found or unauthorized" }, { status: 404 });
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
        revocationReason: reason || "Revoked by company admin",
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
    console.error("[COMPANY_CERTIFICATE_REVOKE_ERROR]", err);
    return NextResponse.json({ error: "Failed to revoke certificate" }, { status: 500 });
  }
}
