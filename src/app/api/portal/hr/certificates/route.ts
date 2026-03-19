/**
 * HR Portal - Certificates API
 * POST /api/portal/hr/certificates - Generate new certificate
 * GET /api/portal/hr/certificates - List certificates with filters
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";
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

    // Save PDF to filesystem (or upload to S3 in production)
    const fs = require("fs");
    const path = require("path");
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "certificates");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const pdfFileName = `${certificateNumber}.pdf`;
    const pdfPath = path.join(uploadsDir, pdfFileName);
    fs.writeFileSync(pdfPath, pdfBuffer);
    const pdfUrl = `/uploads/certificates/${pdfFileName}`;

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

    // Send email if requested
    if (sendEmail && candidateEmail) {
      try {
        const nodemailer = require("nodemailer");
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"Fluenzy AI HR" <${process.env.SMTP_FROM}>`,
          to: candidateEmail,
          subject: `Your ${type.toLowerCase()} certificate from Fluenzy AI`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4f46e5;">Certificate Generated</h2>
              <p>Dear ${candidateName},</p>
              <p>Please find attached your ${type.toLowerCase()} certificate from Fluenzy AI.</p>
              <p><strong>Certificate Number:</strong> ${certificateNumber}</p>
              <p>You can verify this certificate anytime at:</p>
              <p><a href="${verificationUrl}" style="color: #4f46e5;">${verificationUrl}</a></p>
              <p>Best regards,<br/>Fluenzy AI Team</p>
            </div>
          `,
          attachments: [
            {
              filename: pdfFileName,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
        });
      } catch (emailErr) {
        console.error("[Email send error]", emailErr);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        type: certificate.type,
        status: certificate.status,
        pdfUrl: certificate.pdfUrl,
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

    return NextResponse.json({
      certificates: certificates.map((cert) => ({
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
        pdfUrl: cert.pdfUrl,
        sentViaEmail: cert.sentViaEmail,
        revokedAt: cert.revokedAt,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[Certificates list error]", err);
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 });
  }
}