/**
 * HR Portal - Offer Letter PDF Download
 * GET /api/portal/hr/offer-letters/[id]/pdf
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";
import { generateOfferPdfBuffer, readLogoBase64Export, type OfferPdfData } from "@/lib/generate-offer-pdf";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [offer, founderSigAsset] = await Promise.all([
    prisma.offerLetter.findUnique({
      where: { id },
      include: { candidate: true, employee: true },
    }),
    prisma.portalSecureAsset.findUnique({ where: { key: "founder_signature" } }),
  ]);

  if (!offer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const hrStaff = await prisma.portalStaff.findFirst({ where: { email: offer.issuedBy } });

  const pdfData: OfferPdfData = {
    offerId: offer.id,
    candidateName: offer.candidate?.name || offer.employee?.name || "Candidate",
    position: offer.position,
    department: offer.department,
    salary: offer.salary,
    joiningDate: new Date(offer.joiningDate),
    acceptanceDeadline: offer.acceptanceDeadline ? new Date(offer.acceptanceDeadline) : null,
    createdAt: new Date(offer.createdAt),
    issuedBy: offer.issuedBy,
    hrName: hrStaff?.name || offer.issuedBy,
    hrDesignation: hrStaff?.role === "ADMIN" ? "HR Manager" : "HR Executive",
    employmentType: offer.employmentType || "Full-Time, Permanent",
    workLocation: offer.workLocation || "India (Remote / Hybrid)",
    founderSigBase64: founderSigAsset
      ? `data:${founderSigAsset.mimeType};base64,${founderSigAsset.dataBase64}`
      : "",
    logoBase64: readLogoBase64Export(),
  };

  try {
    const pdfBuffer = await generateOfferPdfBuffer(pdfData);
    const fileName = `OfferLetter_${pdfData.candidateName.replace(/\s+/g, "_")}_${id.slice(-6)}.pdf`;
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    console.error("[PDF generation error]", err);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
