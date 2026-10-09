import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCompanyAuthFromRequest } from "@/lib/company-auth";
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
  const decoded = getCompanyAuthFromRequest(req);
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

    // Fetch company name
    const company = await prisma.company.findUnique({
      where: { id: decoded.companyId },
    });

    const companyName = company?.name || "Company";

    // Use document-service: check cache first, generate on miss
    const result = await getOrGenerateDocument({
      documentType: "certificate",
      documentId: certificate.id,
      ownerId: decoded.memberId || decoded.companyId,
      fileName: buildCertificateFileName(certificate.certificateNumber),
      metadata: {
        certificateNumber: certificate.certificateNumber,
        certificateType: certificate.type,
        candidateName: certificate.candidate?.name || certificate.employee?.name,
      },
      generatePdf: async () => {
        const storedData = (certificate.data as any) || {};

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
          companyName: companyName,
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
          hrName: decoded.name || decoded.email,
          hrDesignation: "Authorized Signatory",
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
    console.error("[COMPANY_CERTIFICATE_PDF_ERROR]", err);
    return NextResponse.json({ error: "Failed to generate certificate PDF" }, { status: 500 });
  }
}
