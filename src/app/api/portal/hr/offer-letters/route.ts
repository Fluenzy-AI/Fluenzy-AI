/**
 * HR Portal - Offer Letter Generation
 * GET  /api/portal/hr/offer-letters
 * POST /api/portal/hr/offer-letters
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";
import { sendPortalEmail } from "@/lib/portal-email";
import { generateOfferPdfBuffer, readLogoBase64Export, type OfferPdfData } from "@/lib/generate-offer-pdf";
import { z } from "zod";

const OfferLetterSchema = z.object({
  candidateId: z.string().optional(),
  employeeId: z.string().optional(),
  position: z.string().min(1),
  department: z.string().min(1),
  salary: z.number().min(0),
  joiningDate: z.string(),
  acceptanceDeadline: z.string().optional(),
  content: z.string().optional(),
  sendEmail: z.boolean().optional().default(false),
  probationMonths: z.number().optional(),
  workingHours: z.string().optional(),
  workDays: z.string().optional(),
  salaryType: z.enum(["per annum", "per month"]).optional().default("per annum"),
  employmentType: z.string().optional(),
  workLocation: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const offerLetters = await prisma.offerLetter.findMany({
    ...(decoded.role === "HR" ? {
      where: { issuedBy: decoded.email },
    } : {}),
    include: {
      candidate: { select: { id: true, name: true, email: true, position: true } },
      employee: { select: { id: true, name: true, email: true, designation: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ offerLetters });
}

export async function POST(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "HR"].includes(decoded.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = OfferLetterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const { joiningDate, acceptanceDeadline, sendEmail, probationMonths, workingHours, workDays, salaryType, employmentType, workLocation, content: rawContent, ...rest } = parsed.data;

    const content = rawContent && rawContent.trim().length >= 10
      ? rawContent
      : `Offer Letter for ${rest.position}`;

    const offerLetter = await prisma.offerLetter.create({
      data: {
        ...rest,
        content,
        joiningDate: new Date(joiningDate),
        acceptanceDeadline: acceptanceDeadline ? new Date(acceptanceDeadline) : null,
        salaryType: salaryType || "per annum",
        employmentType: employmentType || "Full-Time, Permanent",
        workLocation: workLocation || "India (Remote / Hybrid)",
        issuedBy: decoded.email,
      },
      include: {
        candidate: true,
        employee: true,
      },
    });

    // Optionally send via email with PDF attachment
    if (sendEmail) {
      const recipientName = offerLetter.candidate?.name || offerLetter.employee?.name || "Candidate";
      const recipientEmail = offerLetter.candidate?.email || offerLetter.employee?.email;

      if (recipientEmail) {
        try {
          // Fetch assets for PDF
          const [hrStaff, founderSigAsset] = await Promise.all([
            prisma.portalStaff.findFirst({ where: { email: decoded.email } }),
            prisma.portalSecureAsset.findUnique({ where: { key: "founder_signature" } }),
          ]);

          const pdfData: OfferPdfData = {
            offerId: offerLetter.id,
            candidateName: recipientName,
            position: rest.position,
            department: rest.department,
            salary: rest.salary,
            joiningDate: new Date(joiningDate),
            acceptanceDeadline: acceptanceDeadline ? new Date(acceptanceDeadline) : null,
            createdAt: new Date(offerLetter.createdAt),
            issuedBy: decoded.email,
            salaryType: salaryType || "per annum",
            employmentType: employmentType || "Full-Time, Permanent",
            workLocation: workLocation || "India (Remote / Hybrid)",
            hrName: hrStaff?.name || decoded.name || decoded.email,
            hrDesignation: hrStaff?.role === "ADMIN" ? "HR Manager" : "HR Executive",
            founderSigBase64: founderSigAsset
              ? `data:${founderSigAsset.mimeType};base64,${founderSigAsset.dataBase64}`
              : "",
            logoBase64: readLogoBase64Export(),
          };

          const pdfBuffer = await generateOfferPdfBuffer(pdfData);
          const fileName = `OfferLetter_${recipientName.replace(/\s+/g, "_")}_${offerLetter.id.slice(-6)}.pdf`;

          const emailHtml = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <h2 style="color:#4f46e5;">Fluenzy AI &mdash; Offer Letter</h2>
  <p>Dear <strong>${recipientName}</strong>,</p>
  <p>We are delighted to offer you the position of <strong>${rest.position}</strong> at <strong>Fluenzy AI</strong>.</p>
  <p>Please find your official offer letter attached to this email as a PDF.</p>
  <table style="background:#f5f3ff;border-radius:8px;padding:16px 20px;margin:16px 0;border-left:4px solid #4f46e5;">
    <tr><td style="padding:4px 0;"><strong>Position:</strong></td><td style="padding:4px 0 4px 12px;">${rest.position}</td></tr>
    <tr><td style="padding:4px 0;"><strong>Department:</strong></td><td style="padding:4px 0 4px 12px;">${rest.department}</td></tr>
    <tr><td style="padding:4px 0;"><strong>${salaryType === "per month" ? "Monthly Stipend / Salary" : "Annual CTC"}:</strong></td><td style="padding:4px 0 4px 12px;">&#8377;${rest.salary.toLocaleString()} ${salaryType === "per month" ? "/ month" : "/ year"}</td></tr>
    <tr><td style="padding:4px 0;"><strong>Employment Type:</strong></td><td style="padding:4px 0 4px 12px;">${employmentType || "Full-Time, Permanent"}</td></tr>
    <tr><td style="padding:4px 0;"><strong>Work Location:</strong></td><td style="padding:4px 0 4px 12px;">${workLocation || "India (Remote / Hybrid)"}</td></tr>
    <tr><td style="padding:4px 0;"><strong>Date of Joining:</strong></td><td style="padding:4px 0 4px 12px;">${new Date(joiningDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td></tr>
    ${acceptanceDeadline ? `<tr><td style="padding:4px 0;"><strong>Accept By:</strong></td><td style="padding:4px 0 4px 12px;">${new Date(acceptanceDeadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td></tr>` : ""}
  </table>
  <p>Please sign and return the attached offer letter to confirm your acceptance.</p>
  <p style="margin-top:24px;">Warm regards,<br/><strong>${hrStaff?.name || decoded.email}</strong><br/>HR Team, Fluenzy AI</p>
</div>`;

          const emailResult = await sendPortalEmail({
            to: recipientEmail,
            subject: `Offer Letter - ${rest.position} at Fluenzy AI`,
            html: emailHtml,
            attachments: [{ filename: fileName, content: pdfBuffer, contentType: "application/pdf" }],
            senderRole: "HR",
            senderEmail: process.env.HR_EMAIL_USER!,
            staffId: decoded.staffId,
          });

          // Update status based on email result
          if (emailResult.success) {
            await prisma.offerLetter.update({
              where: { id: offerLetter.id },
              data: { status: "SENT" },
            });
          } else {
            console.error("[OFFER_LETTER_EMAIL] Failed:", emailResult.error);
            // Mark as PENDING so HR knows email failed
            await prisma.offerLetter.update({
              where: { id: offerLetter.id },
              data: { status: "PENDING" },
            });
          }
        } catch (emailErr) {
          console.error("[OFFER_LETTER_EMAIL]", emailErr);
          // Mark as PENDING on exception
          await prisma.offerLetter.update({
            where: { id: offerLetter.id },
            data: { status: "PENDING" },
          });
        }
      }
    }

    await prisma.portalAuditLog.create({
      data: {
        staffId: decoded.staffId,
        actorEmail: decoded.email,
        actorRole: decoded.role,
        action: "CREATE_OFFER_LETTER",
        entityType: "OfferLetter",
        entityId: offerLetter.id,
        metadata: { position: rest.position, sendEmail },
      },
    });

    return NextResponse.json({ success: true, offerLetter }, { status: 201 });
  } catch (err) {
    console.error("[CREATE_OFFER_LETTER]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
