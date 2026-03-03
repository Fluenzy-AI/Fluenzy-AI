/**
 * HR Portal - Analytics Dashboard
 * GET /api/portal/hr/analytics
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";

export async function GET(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "HR"].includes(decoded.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const hrFilter = decoded.role === "HR" ? { hrId: decoded.staffId } : {};
    const hrEmployeeIds = decoded.role === "HR"
      ? (await prisma.employee.findMany({ where: hrFilter, select: { id: true } })).map(e => e.id)
      : undefined;

    const leaveFilter = hrEmployeeIds ? { employeeId: { in: hrEmployeeIds } } : {};

    const now = new Date();
    const thisMonth = { gte: new Date(now.getFullYear(), now.getMonth(), 1) };

    const [
      totalEmployees,
      activeEmployees,
      onLeave,
      terminated,
      totalCandidates,
      pendingLeaves,
      thisMonthHires,
      thisMonthJoins,
      departmentBreakdown,
      candidatesByStatus,
      recentLeaves,
      payrollThisMonth,
    ] = await Promise.all([
      prisma.employee.count({ where: hrFilter }),
      prisma.employee.count({ where: { ...hrFilter, status: "ACTIVE" } }),
      prisma.employee.count({ where: { ...hrFilter, status: "ON_LEAVE" } }),
      prisma.employee.count({ where: { ...hrFilter, status: "TERMINATED" } }),
      prisma.candidate.count({
        where: decoded.role === "HR" ? { hrId: decoded.staffId } : {},
      }),
      prisma.leaveRequest.count({ where: { ...leaveFilter, status: "PENDING" } }),
      prisma.employee.count({
        where: { ...hrFilter, createdAt: thisMonth },
      }),
      prisma.candidate.count({
        where: {
          ...(decoded.role === "HR" ? { hrId: decoded.staffId } : {}),
          status: "JOINED",
          createdAt: thisMonth,
        },
      }),
      // Department breakdown
      prisma.employee.groupBy({
        by: ["department"],
        where: hrFilter,
        _count: { id: true },
      }),
      // Candidates by status
      prisma.candidate.groupBy({
        by: ["status"],
        where: decoded.role === "HR" ? { hrId: decoded.staffId } : {},
        _count: { id: true },
      }),
      // Recent leave requests (last 5)
      prisma.leaveRequest.findMany({
        where: leaveFilter,
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { employee: { select: { name: true, department: true } } },
      }),
      // Payroll this month
      prisma.payrollRecord.aggregate({
        where: {
          ...(hrEmployeeIds ? { employeeId: { in: hrEmployeeIds } } : {}),
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
        _sum: { netSalary: true },
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      overview: {
        totalEmployees,
        activeEmployees,
        onLeave,
        terminated,
        totalCandidates,
        pendingLeaves,
        thisMonthHires,
        thisMonthJoins,
      },
      departmentBreakdown: departmentBreakdown.map(d => ({
        department: d.department,
        count: d._count.id,
      })),
      candidatesByStatus: candidatesByStatus.map(c => ({
        status: c.status,
        count: c._count.id,
      })),
      recentLeaves: recentLeaves,
      payroll: {
        totalNetThisMonth: payrollThisMonth._sum.netSalary || 0,
        processedCount: payrollThisMonth._count.id,
      },
    });
  } catch (err) {
    console.error("[HR_ANALYTICS]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
