import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCollegeAdminFromRequest } from "@/lib/collegeAuth";

// ─── GET /api/college/students/[id] ─────────────────────────────────────────
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getCollegeAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const student = await prisma.collegeStudent.findFirst({
    where: { id: params.id, collegeAdminId: admin.id },
    include: { batch: true },
  });
  if (!student) return NextResponse.json({ error: "Student not found." }, { status: 404 });

  let performance: Record<string, unknown> | null = null;
  if (student.userId) {
    const user = await prisma.users.findUnique({
      where: { id: student.userId },
      select: {
        plan: true,
        usageCount: true,
        englishUsage: true,
        hrUsage: true,
        technicalUsage: true,
        companyUsage: true,
        mockUsage: true,
        gdUsage: true,
        gdCoachUsage: true,
        sessions: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            module: true,
            aggregateScore: true,
            startTime: true,
            endTime: true,
            duration: true,
            status: true,
          },
        },
        loginLogs: {
          orderBy: { loginTime: "desc" },
          take: 5,
          select: { loginTime: true, logoutTime: true, deviceType: true, os: true, browser: true },
        },
      },
    });
    if (user) {
      const allSessions = await prisma.session.findMany({
        where: { userId: student.userId },
        select: { aggregateScore: true },
      });
      const scores = allSessions.map((s) => s.aggregateScore).filter(Boolean) as number[];
      const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

      performance = {
        ...user,
        avgScore,
        totalSessions: allSessions.length,
        lastLogin: user.loginLogs[0]?.loginTime ?? null,
      };
    }
  }

  return NextResponse.json({ student, performance });
}

// ─── PATCH /api/college/students/[id] ───────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getCollegeAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const existing = await prisma.collegeStudent.findFirst({
    where: { id: params.id, collegeAdminId: admin.id },
  });
  if (!existing) return NextResponse.json({ error: "Student not found." }, { status: 404 });

  const body = await req.json();
  const { studentName, department, year, batchId, rollNumber, status, adminNotes, tags, warningFlags } = body;

  const updated = await prisma.collegeStudent.update({
    where: { id: params.id },
    data: {
      ...(studentName !== undefined && { studentName: studentName.trim() }),
      ...(department !== undefined && { department }),
      ...(year !== undefined && { year: Number(year) }),
      ...(batchId !== undefined && { batchId }),
      ...(rollNumber !== undefined && { rollNumber }),
      ...(status !== undefined && { status }),
      ...(adminNotes !== undefined && { adminNotes }),
      ...(tags !== undefined && { tags }),
      ...(warningFlags !== undefined && { warningFlags }),
    },
  });

  return NextResponse.json({ success: true, student: updated });
}

// ─── DELETE /api/college/students/[id] ──────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getCollegeAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const existing = await prisma.collegeStudent.findFirst({
    where: { id: params.id, collegeAdminId: admin.id },
  });
  if (!existing) return NextResponse.json({ error: "Student not found." }, { status: 404 });

  await prisma.collegeStudent.delete({ where: { id: params.id } });
  await prisma.collegeAdmin.update({
    where: { id: admin.id },
    data: { usedSeats: { decrement: 1 } },
  });

  return NextResponse.json({ success: true });
}
