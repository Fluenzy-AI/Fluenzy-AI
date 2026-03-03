/**
 * HR Portal - Attendance Management
 * GET    /api/portal/hr/attendance    - List attendance records
 * POST   /api/portal/hr/attendance    - Mark/record attendance
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";
import { z } from "zod";

const AttendanceSchema = z.object({
  employeeId: z.string(),
  date: z.string(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE"]),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const hrEmployeeIds = decoded.role === "HR"
    ? (await prisma.employee.findMany({ where: { hrId: decoded.staffId }, select: { id: true } })).map(e => e.id)
    : null;

  const where = {
    ...(hrEmployeeIds ? { employeeId: { in: hrEmployeeIds } } : {}),
    ...(employeeId ? { employeeId } : {}),
    ...(month && year ? {
      date: {
        gte: new Date(parseInt(year), parseInt(month) - 1, 1),
        lte: new Date(parseInt(year), parseInt(month), 0, 23, 59, 59),
      },
    } : {}),
  };

  const attendance = await prisma.attendance.findMany({
    where,
    orderBy: { date: "desc" },
    take: 200,
    include: { employee: { select: { id: true, name: true, employeeCode: true } } },
  });

  return NextResponse.json({ attendance });
}

export async function POST(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const isArray = Array.isArray(body);
    const records = isArray ? body : [body];

    const results = [];
    for (const record of records) {
      const parsed = AttendanceSchema.safeParse(record);
      if (!parsed.success) continue;

      const { date, checkIn, checkOut, ...rest } = parsed.data;
      const dateObj = new Date(date);

      // Compute hours worked
      let hoursWorked: number | undefined;
      if (checkIn && checkOut) {
        const ci = new Date(checkIn);
        const co = new Date(checkOut);
        hoursWorked = Math.round(((co.getTime() - ci.getTime()) / 3600000) * 10) / 10;
      }

      const att = await prisma.attendance.upsert({
        where: { employeeId_date: { employeeId: rest.employeeId, date: dateObj } },
        update: {
          ...rest,
          checkIn: checkIn ? new Date(checkIn) : null,
          checkOut: checkOut ? new Date(checkOut) : null,
          hoursWorked,
          markedBy: decoded.email,
        },
        create: {
          ...rest,
          date: dateObj,
          checkIn: checkIn ? new Date(checkIn) : null,
          checkOut: checkOut ? new Date(checkOut) : null,
          hoursWorked,
          markedBy: decoded.email,
        },
      });
      results.push(att);
    }

    await prisma.portalAuditLog.create({
      data: {
        staffId: decoded.staffId,
        actorEmail: decoded.email,
        actorRole: decoded.role,
        action: "MARK_ATTENDANCE",
        metadata: { count: results.length, isArray },
      },
    });

    return NextResponse.json({ success: true, records: results }, { status: 201 });
  } catch (err) {
    console.error("[MARK_ATTENDANCE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
