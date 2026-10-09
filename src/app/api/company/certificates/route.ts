import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCompanyAuthFromRequest } from "@/lib/company-auth";
import { getPublicFileUrl } from "@/lib/file-url-helper";
import {
  generateCertificateNumber,
  validateCertificateData,
  calculateDuration,
} from "@/lib/certificate-utils";
import {
  generateCertificatePdfBuffer,
  generateQRCode,
  readLogoBase64Export,
  type CertificateData,
} from "@/lib/generate-certificate-pdf";

export async function POST(req: NextRequest) {
  const decoded = getCompanyAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      type,
      candidateId,
      candidateName,
      candidateEmail,
      position,
      department,
      startDate,
      endDate,
      joiningDate,
      salary,
      projectDescription,
      performanceNotes,
      responsibilities,
      achievements,
      trainingName,
      grade,
      sendEmail,
    } = body;

    // Validate
    const validation = validateCertificateData(type, body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join(", ") }, { status: 400 });
    }

    // Get company details
    const company = await prisma.company.findUnique({
      where: { id: decoded.companyId },
    });

    const companyName = company?.name || decoded.companyName || "Company";

    // Generate certificate number
    const certificateNumber = generateCertificateNumber(type);

    // Build verification URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verificationUrl = `${baseUrl}/verify/${certificateNumber}`;

    // Generate QR code
    const qrCodeDataUrl = await generateQRCode(verificationUrl);

    // Prepare certificate data
    const certData: CertificateData & { companyId: string } = {
      certificateNumber,
      type,
      candidateName,
      candidateEmail,
      issueDate: new Date(),
      companyName,
      position,
      department,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      duration:
        startDate && endDate
          ? calculateDuration(new Date(startDate), new Date(endDate))
          : undefined,
      salary,
      joiningDate: joiningDate ? new Date(joiningDate) : undefined,
      projectDescription,
      performanceNotes,
      responsibilities,
      achievements,
      trainingName,
      grade,
      hrName: decoded.name || decoded.email,
      hrDesignation: "Authorized Signatory",
      qrCodeDataUrl,
      verificationUrl,
      logoBase64: readLogoBase64Export(),
      companyId: decoded.companyId,
    };

    // Generate PDF
    const pdfBuffer = await generateCertificatePdfBuffer(certData);

    // Upload PDF to R2 storage
    let pdfUrl: string = "";
    let fileKey: string | null = null;
    const pdfFileName = `${certificateNumber}.pdf`;

    try {
      const { uploadPdfToR2 } = await import("@/lib/r2-service");
      const { isR2Configured: checkR2 } = await import("@/lib/r2");

      if (checkR2()) {
        fileKey = await uploadPdfToR2(
          "certificate",
          certificateNumber,
          Buffer.from(pdfBuffer),
          pdfFileName
        );
        pdfUrl = fileKey;
      }
    } catch (r2Error) {
      console.error("[COMPANY_CERTIFICATE] R2 upload failed:", r2Error);
    }

    // Create certificate record in database
    const certificate = await prisma.certificate.create({
      data: {
        certificateNumber,
        type,
        candidateId: candidateId || null,
        data: certData as any,
        pdfUrl: pdfUrl || pdfFileName,
        qrCodeDataUrl,
        status: "ISSUED",
        issuedBy: decoded.email,
        sentViaEmail: sendEmail || false,
        emailSentAt: sendEmail ? new Date() : null,
      },
    });

    const publicPdfUrl = fileKey ? await getPublicFileUrl(fileKey, { usePublicCDN: true }) : pdfUrl;

    // Send email if requested
    if (sendEmail && candidateEmail) {
      try {
        const { sendCertificateEmail } = await import("@/lib/brevo-mail");
        const { buildCertificateEmailTemplate } = await import("@/lib/email-templates");

        const emailHtml = buildCertificateEmailTemplate({
          recipientName: candidateName,
          certificateType: type,
          certificateNumber,
          position,
          department,
          startDate: startDate ? new Date(startDate).toLocaleDateString("en-IN") : undefined,
          endDate: endDate ? new Date(endDate).toLocaleDateString("en-IN") : undefined,
          verificationUrl,
          performanceNote: performanceNotes,
        });

        await sendCertificateEmail({
          to: candidateEmail,
          subject: `Your ${type.replace(/_/g, " ")} Certificate from ${companyName} — ${candidateName}`,
          html: emailHtml,
          attachments: [
            {
              filename: pdfFileName,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
        });
      } catch (emailErr) {
        console.error("[COMPANY_CERTIFICATE] Email error:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        type: certificate.type,
        status: certificate.status,
        pdfUrl: publicPdfUrl,
        verificationUrl,
      },
    });
  } catch (err) {
    console.error("[COMPANY_CERTIFICATE] Generation error:", err);
    return NextResponse.json({ error: "Failed to generate certificate" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const decoded = getCompanyAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    // STRICT MULTI-TENANT ISOLATION:
    // Find all team members belonging to this company to filter certificates by company issuer email
    const companyMembers = await prisma.companyMember.findMany({
      where: { companyId: decoded.companyId },
      select: { email: true },
    });

    const companyEmails = companyMembers.map((m) => m.email.toLowerCase());
    if (decoded.email && !companyEmails.includes(decoded.email.toLowerCase())) {
      companyEmails.push(decoded.email.toLowerCase());
    }

    const where: any = {
      issuedBy: { in: companyEmails },
    };

    if (type) where.type = type;
    if (status) where.status = status;

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { issuedAt: "desc" },
        include: {
          candidate: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.certificate.count({ where }),
    ]);

    const certificatesWithUrls = await Promise.all(
      certificates.map(async (cert) => ({
        id: cert.id,
        certificateNumber: cert.certificateNumber,
        type: cert.type,
        status: cert.status,
        candidateName: cert.candidate?.name || (cert.data as any)?.candidateName || "N/A",
        candidateEmail: cert.candidate?.email || (cert.data as any)?.candidateEmail,
        position: (cert.data as any)?.position,
        department: (cert.data as any)?.department,
        issuedAt: cert.issuedAt,
        issuedBy: cert.issuedBy,
        pdfUrl: cert.pdfUrl ? await getPublicFileUrl(cert.pdfUrl, { usePublicCDN: true }) : null,
        sentViaEmail: cert.sentViaEmail,
        revokedAt: cert.revokedAt,
      }))
    );

    return NextResponse.json({
      certificates: certificatesWithUrls,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[COMPANY_CERTIFICATE] Fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 });
  }
}
