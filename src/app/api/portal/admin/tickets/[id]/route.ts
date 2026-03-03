/**
 * Admin Portal - Individual Ticket Management
 * GET   /api/portal/admin/tickets/[id]
 * PATCH /api/portal/admin/tickets/[id]  - Update status, assign, resolve
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";
import { sendPortalEmail, ADMIN_EMAIL_TEMPLATES } from "@/lib/portal-email";
import { z } from "zod";

const UpdateTicketSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  assignedTo: z.string().optional(),
  resolution: z.string().optional(),
  notifyUser: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (decoded.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ticket });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (decoded.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = UpdateTicketSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    const { notifyUser, ...data } = parsed.data;
    const ticket = await prisma.supportTicket.update({ where: { id }, data });

    if (notifyUser && ticket.status && ticket.submittedBy) {
      const { subject, html } = ADMIN_EMAIL_TEMPLATES.ticketUpdate(
        ticket.submittedBy,
        ticket.ticketNumber,
        ticket.status,
        ticket.resolution || undefined
      );
      await sendPortalEmail({
        to: ticket.submittedBy,
        subject,
        html,
        senderRole: "ADMIN",
        senderEmail: process.env.ADMIN_EMAIL_USER!,
        staffId: decoded.staffId,
      });
    }

    await prisma.portalAuditLog.create({
      data: {
        staffId: decoded.staffId,
        actorEmail: decoded.email,
        actorRole: decoded.role,
        action: "UPDATE_TICKET",
        entityType: "SupportTicket",
        entityId: id,
        metadata: { changes: data },
      },
    });

    return NextResponse.json({ success: true, ticket });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
