/**
 * HR Portal - Offer Letter Generation
 * GET  /api/portal/hr/offer-letters
 * POST /api/portal/hr/offer-letters
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";
import { sendPortalEmail, HR_EMAIL_TEMPLATES } from "@/lib/portal-email";
import { z } from "zod";

const OfferLetterSchema = z.object({
  candidateId: z.string().optional(),
  employeeId: z.string().optional(),
  position: z.string().min(1),
  department: z.string().min(1),
  salary: z.number().min(0),
  joiningDate: z.string(),
  content: z.string().optional(),
  sendEmail: z.boolean().optional().default(false),
  probationMonths: z.number().optional(),
  workingHours: z.string().optional(),
  workDays: z.string().optional(),
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

    const { joiningDate, sendEmail, probationMonths, workingHours, workDays, content: rawContent, ...rest } = parsed.data;

    const content = rawContent && rawContent.trim().length >= 10
      ? rawContent
      : `<p>Dear Candidate,</p><p>We are pleased to offer you the position of <strong>${rest.position}</strong> in the <strong>${rest.department}</strong> department.</p><p><strong>Annual Salary:</strong> ₹${rest.salary.toLocaleString()}</p><p><strong>Joining Date:</strong> ${new Date(joiningDate).toDateString()}</p>${probationMonths ? `<p><strong>Probation Period:</strong> ${probationMonths} months</p>` : ""}${workingHours ? `<p><strong>Working Hours:</strong> ${workingHours}</p>` : ""}${workDays ? `<p><strong>Working Days:</strong> ${workDays}</p>` : ""}<p>We look forward to having you on our team.</p>`;

    const offerLetter = await prisma.offerLetter.create({
      data: {
        ...rest,
        content,
        joiningDate: new Date(joiningDate),
        issuedBy: decoded.email,
      },
      include: {
        candidate: true,
        employee: true,
      },
    });

    // Optionally send via email
    if (sendEmail) {
      const recipientName = offerLetter.candidate?.name || offerLetter.employee?.name || "Candidate";
      const recipientEmail = offerLetter.candidate?.email || offerLetter.employee?.email;

      if (recipientEmail) {
        const { subject, html } = HR_EMAIL_TEMPLATES.offerLetter(
          recipientName,
          rest.position,
          `₹${rest.salary.toLocaleString()}/year`,
          new Date(joiningDate).toDateString()
        );

        await sendPortalEmail({
          to: recipientEmail,
          subject,
          html,
          senderRole: "HR",
          senderEmail: process.env.HR_EMAIL_USER!,
          staffId: decoded.staffId,
        });

        // Update status to SENT
        await prisma.offerLetter.update({
          where: { id: offerLetter.id },
          data: { status: "SENT" },
        });
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
