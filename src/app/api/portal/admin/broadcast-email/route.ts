/**
 * Admin Portal - Broadcast Email
 * POST /api/portal/admin/broadcast-email
 * Sends mass email using ADMIN credentials to all/selected app users
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";
import { sendBulkPortalEmail, ADMIN_EMAIL_TEMPLATES } from "@/lib/portal-email";
import { z } from "zod";

const BroadcastSchema = z.object({
  targetAudience: z.enum(["ALL", "PRO", "STANDARD", "FREE", "CUSTOM"]),
  customEmails: z.array(z.string().email()).optional(),
  subject: z.string().min(5),
  html: z.string().min(10),
  text: z.string().optional(),
  scheduledAt: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (decoded.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = BroadcastSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const { targetAudience, customEmails, subject, html, text } = parsed.data;

    let recipients: string[] = [];

    if (targetAudience === "CUSTOM" && customEmails) {
      recipients = customEmails;
    } else {
      const planFilter =
        targetAudience === "ALL"
          ? {}
          : { plan: targetAudience as "Pro" | "Standard" | "Free" };

      const users = await prisma.users.findMany({
        where: { disabled: false, ...planFilter },
        select: { email: true },
      });
      recipients = users.map((u) => u.email);
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No recipients found" }, { status: 400 });
    }

    const result = await sendBulkPortalEmail({
      recipients,
      subject,
      html,
      text,
      senderRole: "ADMIN",
      senderEmail: process.env.ADMIN_EMAIL_USER!,
      staffId: decoded.staffId,
    });

    await prisma.portalAuditLog.create({
      data: {
        staffId: decoded.staffId,
        actorEmail: decoded.email,
        actorRole: decoded.role,
        action: "BROADCAST_EMAIL",
        metadata: {
          subject,
          targetAudience,
          totalRecipients: recipients.length,
          sent: result.sent,
          failed: result.failed,
        },
      },
    });

    return NextResponse.json({ success: true, ...result, totalRecipients: recipients.length });
  } catch (err) {
    console.error("[BROADCAST_EMAIL]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
