/**
 * HR Portal - Individual Employee
 * GET    /api/portal/hr/employees/[id]    - Get employee
 * PATCH  /api/portal/hr/employees/[id]    - Update employee
 * DELETE /api/portal/hr/employees/[id]    - Delete employee (Admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      hr: { select: { id: true, name: true, email: true } },
      leaveRequests: { orderBy: { createdAt: "desc" }, take: 10 },
      attendances: { orderBy: { date: "desc" }, take: 30 },
      payrollRecords: { orderBy: { year: "desc" }, take: 12 },
      offerLetters: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  // HR can only see their assigned employees
  if (decoded.role === "HR" && employee.hrId !== decoded.staffId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ employee });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    if (decoded.role === "HR" && employee.hrId !== decoded.staffId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { joinDate, ...rest } = body;
    const updated = await prisma.employee.update({
      where: { id },
      data: { ...rest, ...(joinDate ? { joinDate: new Date(joinDate) } : {}) },
    });

    await prisma.portalAuditLog.create({
      data: {
        staffId: decoded.staffId,
        actorEmail: decoded.email,
        actorRole: decoded.role,
        action: "UPDATE_EMPLOYEE",
        entityType: "Employee",
        entityId: id,
        metadata: { changes: rest },
      },
    });

    return NextResponse.json({ success: true, employee: updated });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (decoded.role !== "ADMIN") return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { id } = await params;

  try {
    await prisma.employee.delete({ where: { id } });
    await prisma.portalAuditLog.create({
      data: {
        staffId: decoded.staffId,
        actorEmail: decoded.email,
        actorRole: decoded.role,
        action: "DELETE_EMPLOYEE",
        entityType: "Employee",
        entityId: id,
      },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
