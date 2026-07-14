/**
 * HR Portal - Certificate PDF Download
 * GET /api/portal/hr/certificates/[id]/pdf
 * 
 * OPTIMIZED: Uses document-service for generate-once-serve-from-CDN pattern.
 * First download → generates PDF, uploads to R2, redirects to CDN.
 * All subsequent downloads → instant CDN redirect (zero Puppeteer).
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
import { getOrGenerateDocument } from "@/lib/document-service";
import { buildCertificateFileName } from "@/lib/document-types";

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

    // Use document-service: check cache first, generate on miss
    const result = await getOrGenerateDocument({
      documentType: "certificate",
      documentId: certificate.id,
      ownerId: (decoded as any).portalStaffId || (decoded as any).sub || "system",
      fileName: buildCertificateFileName(certificate.certificateNumber),
      metadata: {
        certificateNumber: certificate.certificateNumber,
        certificateType: certificate.type,
        candidateName: certificate.candidate?.name || certificate.employee?.name,
      },
      generatePdf: async () => {
        // This only runs on cache miss
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
        const qrCodeDataUrl = await generateQRCode(verificationUrl);

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

        return generateCertificatePdfBuffer(certData);
      },
    });

    // Update Certificate.pdfUrl if it changed
    if (result.cdnUrl && certificate.pdfUrl !== result.cdnUrl) {
      await prisma.certificate.update({
        where: { id: certificate.id },
        data: { pdfUrl: result.cdnUrl },
      }).catch(() => {});
    }

    // If CDN URL available, redirect for instant download
    if (result.cdnUrl) {
      return NextResponse.redirect(result.cdnUrl);
    }

    // Fallback: return PDF buffer directly
    const candidateName = certificate.candidate?.name || certificate.employee?.name || "Certificate";
    const fileName = `${certificate.certificateNumber}_${candidateName.replace(/\s+/g, "_")}.pdf`;

    return new NextResponse(result.pdfBuffer ? new Uint8Array(result.pdfBuffer) : null, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[Certificate PDF download error]", err);
    return NextResponse.json({ error: "Failed to generate certificate PDF" }, { status: 500 });
  }
}