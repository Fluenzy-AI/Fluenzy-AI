/**
 * HR Portal - Certificates API
 * POST /api/portal/hr/certificates - Generate new certificate
 * GET /api/portal/hr/certificates - List certificates with filters
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";
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
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (decoded.role !== "ADMIN" && decoded.role !== "HR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      type,
      candidateId,
      employeeId,
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

    // Generate certificate number
    const certificateNumber = generateCertificateNumber(type);

    // Build verification URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verificationUrl = `${baseUrl}/verify/${certificateNumber}`;

    // Generate QR code
    const qrCodeDataUrl = generateQRCode(verificationUrl);

    // Get HR info
    const hrStaff = await prisma.portalStaff.findUnique({
      where: { email: decoded.email },
    });

    // Get founder signature
    const founderSigAsset = await prisma.portalSecureAsset.findUnique({
      where: { key: "founder_signature" },
    });

    // Get HR signature (if exists)
    const hrSigAsset = hrStaff?.id
      ? await prisma.portalSecureAsset.findUnique({
          where: { key: `hr_signature_${hrStaff.id}` },
        })
      : null;

    // Prepare certificate data
    const certData: CertificateData = {
      certificateNumber,
      type,
      candidateName,
      candidateEmail,
      issueDate: new Date(),
      companyName: "Fluenzy AI",
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
      hrName: hrStaff?.name || decoded.email,
      hrDesignation: hrStaff?.role === "ADMIN" ? "HR Manager" : "HR Executive",
      hrSignatureBase64: hrSigAsset
        ? `data:${hrSigAsset.mimeType};base64,${hrSigAsset.dataBase64}`
        : undefined,
      founderSignatureBase64: founderSigAsset
        ? `data:${founderSigAsset.mimeType};base64,${founderSigAsset.dataBase64}`
        : undefined,
      qrCodeDataUrl,
      verificationUrl,
      logoBase64: readLogoBase64Export(),
    };

    // Generate PDF
    const pdfBuffer = await generateCertificatePdfBuffer(certData);

    // Upload PDF to R2 storage
    let pdfUrl: string;
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
        pdfUrl = fileKey; // Store the R2 key
        console.info(`[CERTIFICATE] Uploaded to R2: ${fileKey}`);
      } else {
        console.error("[CERTIFICATE] R2 not configured!");
        return NextResponse.json(
          { error: "File storage is not configured. Contact support." },
          { status: 503 }
        );
      }
    } catch (r2Error) {
      console.error("[CERTIFICATE] R2 upload failed:", r2Error);
      return NextResponse.json(
        { error: "Failed to upload certificate. Please try again." },
        { status: 500 }
      );
    }

    // Create certificate record in database
    const certificate = await prisma.certificate.create({
      data: {
        certificateNumber,
        type,
        candidateId: candidateId || null,
        employeeId: employeeId || null,
        data: certData as any,
        pdfUrl,
        qrCodeDataUrl,
        status: "ISSUED",
        issuedBy: decoded.email,
        sentViaEmail: sendEmail || false,
        emailSentAt: sendEmail ? new Date() : null,
      },
    });

    // Create FileRecord if uploaded to R2
    if (fileKey) {
      await prisma.fileRecord.create({
        data: {
          fileType: "certificate",
          fileKey,
          originalFileName: `${certificateNumber}.pdf`,
          fileSize: pdfBuffer.length,
          mimeType: "application/pdf",
          isPublic: true, // Certificates are public
          metadata: { certificateId: certificate.id, type },
        },
      });
    }

    // Generate lifetime CDN URL for response (if R2 key exists)
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
          startDate: startDate ? new Date(startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : undefined,
          endDate: endDate ? new Date(endDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : undefined,
          verificationUrl,
          performanceNote: performanceNotes,
        });

        const result = await sendCertificateEmail({
          to: candidateEmail,
          subject: `Your ${type.replace(/_/g, " ")} Certificate from Fluenzy AI — ${candidateName}`,
          html: emailHtml,
          attachments: [
            {
              filename: pdfFileName,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
        });
        
        if (result.success) {
          // Update certificate email sent status
          await prisma.certificate.update({
            where: { id: certificate.id },
            data: { sentViaEmail: true, emailSentAt: new Date() },
          });
        } else {
          throw new Error(result.error);
        }
      } catch (emailErr) {
        console.error("[Certificate Email send error]", emailErr);
        // Update to reflect email was not sent
        await prisma.certificate.update({
          where: { id: certificate.id },
          data: { sentViaEmail: false },
        });
      }
    }

    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        type: certificate.type,
        status: certificate.status,
        pdfUrl: publicPdfUrl, // Return CDN URL for lifetime access
        verificationUrl,
      },
    });
  } catch (err) {
    console.error("[Certificate generation error]", err);
    return NextResponse.json(
      { error: "Failed to generate certificate" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { certificateNumber: { contains: search, mode: "insensitive" } },
        { data: { path: ["candidateName"], string_contains: search } },
      ];
    }

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { issuedAt: "desc" },
        include: {
          candidate: { select: { id: true, name: true, email: true } },
          employee: { select: { id: true, name: true, email: true } },
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
        candidateName:
          cert.candidate?.name ||
          cert.employee?.name ||
          (cert.data as any)?.candidateName ||
          "N/A",
        candidateEmail:
          cert.candidate?.email ||
          cert.employee?.email ||
          (cert.data as any)?.candidateEmail,
        position: (cert.data as any)?.position,
        department: (cert.data as any)?.department,
        issuedAt: cert.issuedAt,
        issuedBy: cert.issuedBy,
        pdfUrl: await getPublicFileUrl(cert.pdfUrl, { usePublicCDN: true }), // Convert to CDN URL for lifetime access
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
    console.error("[Certificates list error]", err);
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 });
  }
}