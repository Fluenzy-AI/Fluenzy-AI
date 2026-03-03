/**
 * HR Portal - Employee Management
 * GET    /api/portal/hr/employees         - List employees (HR sees only assigned)
 * POST   /api/portal/hr/employees         - Create employee
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";
import { z } from "zod";

const CreateEmployeeSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  department: z.string().min(1),
  designation: z.string().min(1),
  joinDate: z.string(),
  salary: z.number().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  resumeUrl: z.string().optional(),
});

function generateEmployeeCode(): string {
  return "EMP" + Date.now().toString().slice(-6) + Math.random().toString(36).slice(2, 4).toUpperCase();
}

export async function GET(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "HR"].includes(decoded.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const department = searchParams.get("department");
  const status = searchParams.get("status");

  const where = {
    // HR sees only employees assigned to them; Admin sees all
    ...(decoded.role === "HR" ? { hrId: decoded.staffId } : {}),
    ...(status ? { status: status as "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED" } : {}),
    ...(department ? { department } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { employeeCode: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, employees] = await Promise.all([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        hr: { select: { id: true, name: true, email: true } },
        _count: { select: { leaveRequests: true, attendances: true } },
      },
    }),
  ]);

  return NextResponse.json({ employees, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "HR"].includes(decoded.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = CreateEmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.employee.findUnique({ where: { email: parsed.data.email } });
    if (existing) return NextResponse.json({ error: "Employee email already exists" }, { status: 409 });

    const employee = await prisma.employee.create({
      data: {
        ...parsed.data,
        employeeCode: generateEmployeeCode(),
        joinDate: new Date(parsed.data.joinDate),
        hrId: decoded.staffId,
      },
    });

    await prisma.portalAuditLog.create({
      data: {
        staffId: decoded.staffId,
        actorEmail: decoded.email,
        actorRole: decoded.role,
        action: "CREATE_EMPLOYEE",
        entityType: "Employee",
        entityId: employee.id,
        metadata: { name: employee.name, email: employee.email },
      },
    });

    return NextResponse.json({ success: true, employee }, { status: 201 });
  } catch (err) {
    console.error("[CREATE_EMPLOYEE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
