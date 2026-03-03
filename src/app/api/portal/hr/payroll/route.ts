/**
 * HR Portal - Payroll Management
 * GET    /api/portal/hr/payroll    - List payroll records
 * POST   /api/portal/hr/payroll    - Create payroll entry
 * PATCH  /api/portal/hr/payroll/[id] - Update payroll status
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";
import { z } from "zod";

const PayrollSchema = z.object({
  employeeId: z.string(),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
  basicSalary: z.number().min(0),
  allowances: z.number().min(0).default(0),
  deductions: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const employeeId = searchParams.get("employeeId");
  const status = searchParams.get("status");

  const hrEmployeeIds = decoded.role === "HR"
    ? (await prisma.employee.findMany({ where: { hrId: decoded.staffId }, select: { id: true } })).map(e => e.id)
    : null;

  const where = {
    ...(hrEmployeeIds ? { employeeId: { in: hrEmployeeIds } } : {}),
    ...(employeeId ? { employeeId } : {}),
    ...(month ? { month: parseInt(month) } : {}),
    ...(year ? { year: parseInt(year) } : {}),
    ...(status ? { status } : {}),
  };

  const records = await prisma.payrollRecord.findMany({
    where,
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: {
      employee: { select: { id: true, name: true, email: true, employeeCode: true, department: true } },
    },
    take: 200,
  });

  // Summary stats
  const totalNet = records.reduce((acc, r) => acc + r.netSalary, 0);

  return NextResponse.json({ records, totalNet, count: records.length });
}

export async function POST(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "HR"].includes(decoded.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = PayrollSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const { basicSalary, allowances, deductions, ...rest } = parsed.data;
    const netSalary = basicSalary + (allowances || 0) - (deductions || 0);

    const record = await prisma.payrollRecord.upsert({
      where: { employeeId_month_year: { employeeId: rest.employeeId, month: rest.month, year: rest.year } },
      update: { basicSalary, allowances: allowances || 0, deductions: deductions || 0, netSalary, processedBy: decoded.email },
      create: {
        ...rest,
        basicSalary,
        allowances: allowances || 0,
        deductions: deductions || 0,
        netSalary,
        processedBy: decoded.email,
      },
    });

    await prisma.portalAuditLog.create({
      data: {
        staffId: decoded.staffId,
        actorEmail: decoded.email,
        actorRole: decoded.role,
        action: "CREATE_PAYROLL",
        entityType: "PayrollRecord",
        entityId: record.id,
        metadata: { employeeId: rest.employeeId, month: rest.month, year: rest.year, netSalary },
      },
    });

    return NextResponse.json({ success: true, record }, { status: 201 });
  } catch (err) {
    console.error("[CREATE_PAYROLL]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
