import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCollegeAdminFromRequest } from "@/lib/collegeAuth";

export async function GET(req: NextRequest) {
  const admin = await getCollegeAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const department = searchParams.get("department");
  const batchId = searchParams.get("batchId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = { collegeAdminId: admin.id };
  if (department) where.department = department;
  if (batchId) where.batchId = batchId;

  const students = await prisma.collegeStudent.findMany({
    where: where as any,
    orderBy: { studentName: "asc" },
    include: { batch: { select: { name: true } } },
  });

  const userIds = students.filter((s) => s.userId).map((s) => s.userId as string);

  // Aggregate session data per user
  const sessionFilter: Record<string, unknown> = { userId: { in: userIds } };
  if (from || to) {
    sessionFilter.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const sessions = await prisma.session.findMany({
    where: sessionFilter as any,
    select: { userId: true, module: true, aggregateScore: true, duration: true, createdAt: true },
  });

  const lastLoginMap = new Map<string, Date>();
  if (userIds.length > 0) {
    const logs = await prisma.userLoginLog.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds } },
      _max: { loginTime: true },
    });
    for (const log of logs) {
      if (log._max.loginTime) lastLoginMap.set(log.userId, log._max.loginTime);
    }
  }

  // Build per-user stats
  const statsMap = new Map<string, { sessions: number; avgScore: number | null; totalMinutes: number }>();
  for (const uid of userIds) {
    const userSessions = sessions.filter((s) => s.userId === uid);
    const scores = userSessions.map((s) => s.aggregateScore).filter(Boolean) as number[];
    statsMap.set(uid, {
      sessions: userSessions.length,
      avgScore: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
      totalMinutes: userSessions.reduce((acc, s) => acc + (s.duration ?? 0), 0),
    });
  }

  // Build CSV
  const headers = [
    "Student Name",
    "Email",
    "Department",
    "Year",
    "Roll Number",
    "Batch",
    "Status",
    "Onboarded",
    "Last Login",
    "Total Sessions",
    "Avg Score",
    "Total Time (min)",
    "Tags",
    "Admin Notes",
  ];

  const rows = students.map((s) => {
    const stats = s.userId ? statsMap.get(s.userId) ?? null : null;
    const lastLogin = s.userId ? lastLoginMap.get(s.userId) : null;
    return [
      s.studentName,
      s.email,
      s.department ?? "",
      s.year?.toString() ?? "",
      s.rollNumber ?? "",
      s.batch?.name ?? "",
      s.status,
      s.onboardedAt ? s.onboardedAt.toISOString().slice(0, 10) : "No",
      lastLogin ? lastLogin.toISOString().slice(0, 10) : "Never",
      stats?.sessions?.toString() ?? "0",
      stats?.avgScore !== null && stats?.avgScore !== undefined ? stats.avgScore.toFixed(1) : "N/A",
      stats?.totalMinutes?.toString() ?? "0",
      s.tags.join(", "),
      s.adminNotes ?? "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const filename = `${admin.collegeName.replace(/\s+/g, "_")}_students_report_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
