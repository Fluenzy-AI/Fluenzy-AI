/**
 * HR Portal - Individual Leave Management
 * GET   /api/portal/hr/leaves/[id]   - Get leave
 * PATCH /api/portal/hr/leaves/[id]   - Approve / Reject leave
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";
import { sendPortalEmail, HR_EMAIL_TEMPLATES } from "@/lib/portal-email";
import { z } from "zod";

const ApproveSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const leave = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { employee: { select: { id: true, name: true, email: true, department: true } } },
  });
  if (!leave) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ leave });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = ApproveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const leave = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!leave) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (leave.status !== "PENDING") {
      return NextResponse.json({ error: "Leave is already processed" }, { status: 400 });
    }

    const { action, rejectionReason } = parsed.data;
    const approved = action === "APPROVE";

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: approved ? "APPROVED" : "REJECTED",
        approvedBy: decoded.email,
        approvedAt: new Date(),
        rejectionReason: approved ? null : rejectionReason,
      },
      include: { employee: true },
    });

    // Send notification email to employee
    const { subject, html } = HR_EMAIL_TEMPLATES.leaveApproval(
      updated.employee.name,
      updated.type,
      updated.startDate.toDateString(),
      updated.endDate.toDateString(),
      approved,
      rejectionReason
    );

    await sendPortalEmail({
      to: updated.employee.email,
      subject,
      html,
      senderRole: "HR",
      senderEmail: process.env.HR_EMAIL_USER!,
      staffId: decoded.staffId,
    });

    await prisma.portalAuditLog.create({
      data: {
        staffId: decoded.staffId,
        actorEmail: decoded.email,
        actorRole: decoded.role,
        action: approved ? "APPROVE_LEAVE" : "REJECT_LEAVE",
        entityType: "LeaveRequest",
        entityId: id,
        metadata: { employeeId: leave.employeeId, reason: rejectionReason },
      },
    });

    return NextResponse.json({ success: true, leave: updated });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
