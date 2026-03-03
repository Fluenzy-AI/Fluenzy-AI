/**
 * HR Portal - Leave Management
 * GET    /api/portal/hr/leaves     - List leave requests
 * POST   /api/portal/hr/leaves     - Submit leave request
 * PATCH  /api/portal/hr/leaves/[id] - Approve/Reject leave
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";
import { sendPortalEmail, HR_EMAIL_TEMPLATES } from "@/lib/portal-email";
import { z } from "zod";

const CreateLeaveSchema = z.object({
  employeeId: z.string(),
  type: z.enum(["CASUAL", "SICK", "EARNED", "MATERNITY", "PATERNITY", "UNPAID"]),
  startDate: z.string(),
  endDate: z.string(),
  days: z.number().min(1),
  reason: z.string().min(5),
});

export async function GET(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status");
  const employeeId = searchParams.get("employeeId");

  // HR sees only leaves from their employees
  const hrEmployeeIds = decoded.role === "HR"
    ? (await prisma.employee.findMany({ where: { hrId: decoded.staffId }, select: { id: true } })).map(e => e.id)
    : null;

  const where = {
    ...(hrEmployeeIds ? { employeeId: { in: hrEmployeeIds } } : {}),
    ...(status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" } : {}),
    ...(employeeId ? { employeeId } : {}),
  };

  const [total, leaves] = await Promise.all([
    prisma.leaveRequest.count({ where }),
    prisma.leaveRequest.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { employee: { select: { id: true, name: true, email: true, department: true } } },
    }),
  ]);

  return NextResponse.json({ leaves, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = CreateLeaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const { startDate, endDate, ...rest } = parsed.data;
    const leave = await prisma.leaveRequest.create({
      data: {
        ...rest,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
      include: { employee: true },
    });

    await prisma.portalAuditLog.create({
      data: {
        staffId: decoded.staffId,
        actorEmail: decoded.email,
        actorRole: decoded.role,
        action: "CREATE_LEAVE_REQUEST",
        entityType: "LeaveRequest",
        entityId: leave.id,
        metadata: { employeeId: rest.employeeId, type: rest.type },
      },
    });

    return NextResponse.json({ success: true, leave }, { status: 201 });
  } catch (err) {
    console.error("[CREATE_LEAVE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
