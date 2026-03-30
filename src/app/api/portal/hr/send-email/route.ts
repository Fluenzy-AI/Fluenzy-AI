/**
 * HR Portal - Send Email to candidate or employee
 * POST /api/portal/hr/send-email
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";
import { sendPortalEmail, sendBulkPortalEmail } from "@/lib/portal-email";
import { z } from "zod";

const SendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1),
  html: z.string().min(1),
  text: z.string().optional(),
  templateId: z.string().optional(),
  isBulk: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "HR"].includes(decoded.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    console.log("[HR_SEND_EMAIL] Request body:", JSON.stringify(body, null, 2));
    
    const parsed = SendEmailSchema.safeParse(body);
    if (!parsed.success) {
      console.error("[HR_SEND_EMAIL] Validation failed:", parsed.error.flatten());
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: parsed.error.flatten(),
          received: body 
        }, 
        { status: 400 }
      );
    }

    const { to, subject, html, text, templateId, isBulk } = parsed.data;

    if (isBulk && Array.isArray(to)) {
      const result = await sendBulkPortalEmail({
        recipients: to,
        subject,
        html,
        text,
        senderRole: "HR",
        senderEmail: process.env.HR_EMAIL_USER!,
        staffId: decoded.staffId,
        templateId,
      });

      await prisma.portalAuditLog.create({
        data: {
          staffId: decoded.staffId,
          actorEmail: decoded.email,
          actorRole: decoded.role,
          action: "BULK_EMAIL_SENT",
          metadata: { subject, recipientCount: to.length, sent: result.sent, failed: result.failed },
        },
      });

      return NextResponse.json({ success: true, ...result });
    } else {
      const result = await sendPortalEmail({
        to,
        subject,
        html,
        text,
        senderRole: "HR",
        senderEmail: process.env.HR_EMAIL_USER!,
        staffId: decoded.staffId,
        templateId,
      });

      await prisma.portalAuditLog.create({
        data: {
          staffId: decoded.staffId,
          actorEmail: decoded.email,
          actorRole: decoded.role,
          action: "EMAIL_SENT",
          metadata: { subject, to: Array.isArray(to) ? to.join(", ") : to },
        },
      });

      return NextResponse.json({ success: result.success, error: result.error });
    }
  } catch (err) {
    console.error("[HR_SEND_EMAIL]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
