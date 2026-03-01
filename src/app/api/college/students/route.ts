import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getCollegeAdminFromRequest } from "@/lib/collegeAuth";
import { sendStudentInviteEmail } from "@/lib/collegeEmail";

// ─── GET  /api/college/students ──────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const admin = await getCollegeAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "25");
  const search = searchParams.get("search") ?? "";
  const batchId = searchParams.get("batchId");
  const department = searchParams.get("department");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = { collegeAdminId: admin.id };
  if (search) {
    where.OR = [
      { studentName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { department: { contains: search, mode: "insensitive" } },
    ];
  }
  if (batchId) where.batchId = batchId;
  if (department) where.department = department;
  if (status) where.status = status;

  const [total, students] = await Promise.all([
    prisma.collegeStudent.count({ where } as any),
    prisma.collegeStudent.findMany({
      where: where as any,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        batch: { select: { id: true, name: true, department: true } },
      },
    }),
  ]);

  // Get user performance data for each student who has a userId
  const studentIds = students.filter((s) => s.userId).map((s) => s.userId as string);
  let userMap: Map<string, {
    lastLogin: Date | null;
    sessions: number;
    avgScore: number | null;
  }> = new Map();

  if (studentIds.length > 0) {
    const users = await prisma.users.findMany({
      where: { id: { in: studentIds } },
      select: {
        id: true,
        loginLogs: { orderBy: { loginTime: "desc" }, take: 1, select: { loginTime: true } },
        sessions: { select: { aggregateScore: true } },
      },
    });
    for (const u of users) {
      const scores = u.sessions.map((s) => s.aggregateScore).filter(Boolean) as number[];
      userMap.set(u.id, {
        lastLogin: u.loginLogs[0]?.loginTime ?? null,
        sessions: u.sessions.length,
        avgScore: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
      });
    }
  }

  const enriched = students.map((s) => ({
    ...s,
    performance: s.userId ? userMap.get(s.userId) ?? null : null,
  }));

  return NextResponse.json({ students: enriched, total, page, limit });
}

// ─── POST  /api/college/students ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const admin = await getCollegeAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json();
  const { studentName, email, department, year, batchId, rollNumber } = body as {
    studentName: string;
    email: string;
    department?: string;
    year?: number;
    batchId?: string;
    rollNumber?: string;
  };

  if (!studentName?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Student name and email are required." }, { status: 400 });
  }

  const emailLower = email.toLowerCase();
  const emailDomain = emailLower.split("@")[1];
  if (emailDomain !== admin.domain) {
    return NextResponse.json(
      { error: `Student email must belong to @${admin.domain}` },
      { status: 400 }
    );
  }

  const existing = await prisma.collegeStudent.findUnique({ where: { email: emailLower } });
  if (existing) {
    return NextResponse.json({ error: "Student with this email already exists." }, { status: 409 });
  }

  // Check seat availability
  const collegeAdmin = await prisma.collegeAdmin.findUnique({ where: { id: admin.id } });
  if (collegeAdmin && collegeAdmin.totalSeats > 0 && collegeAdmin.usedSeats >= collegeAdmin.totalSeats) {
    return NextResponse.json({ error: "No available seats. Please upgrade your plan." }, { status: 403 });
  }

  // Generate temp password + invite token
  const tempPassword = `Fluenzy@${crypto.randomBytes(3).toString("hex")}`;
  const inviteToken = crypto.randomBytes(32).toString("hex");
  const hashedTemp = await bcrypt.hash(tempPassword, 10);

  const student = await prisma.collegeStudent.create({
    data: {
      collegeAdminId: admin.id,
      studentName: studentName.trim(),
      email: emailLower,
      department: department?.trim(),
      year: year ? Number(year) : undefined,
      rollNumber: rollNumber?.trim(),
      batchId: batchId || undefined,
      inviteToken,
      inviteSentAt: new Date(),
      tempPassword: hashedTemp,
    },
  });

  // Increment usedSeats
  await prisma.collegeAdmin.update({
    where: { id: admin.id },
    data: { usedSeats: { increment: 1 } },
  });

  // Send invite email (non-blocking)
  sendStudentInviteEmail(emailLower, studentName.trim(), admin.collegeName, tempPassword, inviteToken).catch(
    console.error
  );

  return NextResponse.json({ success: true, student });
}
