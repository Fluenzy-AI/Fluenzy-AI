/**
 * HR Portal - Certificate PDF Download
 * GET /api/portal/hr/certificates/[id]/pdf
 * 
 * Regenerates PDF on-demand for serverless compatibility
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";
import {
  generateCertificatePdfBuffer,
  generateQRCode,
  readLogoBase64Export,
  type CertificateData,
} from "@/lib/generate-certificate-pdf";

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
        candidate: true,
        employee: true,
      },
    });

    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    // Get stored certificate data
    const storedData = certificate.data as any;
    
    // Get HR info
    const hrStaff = await prisma.portalStaff.findFirst({
      where: { email: certificate.issuedBy },
    });

    // Get signatures
    const [founderSigAsset, hrSigAsset] = await Promise.all([
      prisma.portalSecureAsset.findUnique({ where: { key: "founder_signature" } }),
      hrStaff?.id
        ? prisma.portalSecureAsset.findUnique({ where: { key: `hr_signature_${hrStaff.id}` } })
        : null,
    ]);

    // Build verification URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fluenzyai.app";
    const verificationUrl = `${baseUrl}/verify/${certificate.certificateNumber}`;
    const qrCodeDataUrl = generateQRCode(verificationUrl);

    // Reconstruct certificate data for PDF generation
    const certData: CertificateData = {
      certificateNumber: certificate.certificateNumber,
      type: certificate.type as CertificateData["type"],
      candidateName: storedData?.candidateName || certificate.candidate?.name || certificate.employee?.name || "N/A",
      candidateEmail: storedData?.candidateEmail || certificate.candidate?.email || certificate.employee?.email,
      issueDate: new Date(certificate.issuedAt),
      companyName: storedData?.companyName || "Fluenzy AI",
      position: storedData?.position,
      department: storedData?.department,
      startDate: storedData?.startDate ? new Date(storedData.startDate) : undefined,
      endDate: storedData?.endDate ? new Date(storedData.endDate) : undefined,
      duration: storedData?.duration,
      salary: storedData?.salary,
      joiningDate: storedData?.joiningDate ? new Date(storedData.joiningDate) : undefined,
      projectDescription: storedData?.projectDescription,
      performanceNotes: storedData?.performanceNotes,
      responsibilities: storedData?.responsibilities,
      achievements: storedData?.achievements,
      trainingName: storedData?.trainingName,
      grade: storedData?.grade,
      hrName: hrStaff?.name || storedData?.hrName || certificate.issuedBy,
      hrDesignation: hrStaff?.role === "ADMIN" ? "HR Manager" : (storedData?.hrDesignation || "HR Executive"),
      hrSignatureBase64: hrSigAsset
        ? `data:${hrSigAsset.mimeType};base64,${hrSigAsset.dataBase64}`
        : storedData?.hrSignatureBase64,
      founderSignatureBase64: founderSigAsset
        ? `data:${founderSigAsset.mimeType};base64,${founderSigAsset.dataBase64}`
        : storedData?.founderSignatureBase64,
      qrCodeDataUrl,
      verificationUrl,
      logoBase64: readLogoBase64Export(),
    };

    // Generate PDF on-demand
    const pdfBuffer = await generateCertificatePdfBuffer(certData);

    const candidateName = certificate.candidate?.name || certificate.employee?.name || "Certificate";
    const fileName = `${certificate.certificateNumber}_${candidateName.replace(/\s+/g, "_")}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[Certificate PDF download error]", err);
    return NextResponse.json({ error: "Failed to generate certificate PDF" }, { status: 500 });
  }
}