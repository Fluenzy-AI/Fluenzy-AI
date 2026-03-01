import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCollegeAdminFromRequest } from "@/lib/collegeAuth";

export async function GET(req: NextRequest) {
  const admin = await getCollegeAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const collegeAdmin = await prisma.collegeAdmin.findUnique({
    where: { id: admin.id },
    select: { totalSeats: true, usedSeats: true, allocatedPlan: true, planExpiresAt: true },
  });

  // Get all students under this college
  const allStudents = await prisma.collegeStudent.findMany({
    where: { collegeAdminId: admin.id },
    select: { id: true, userId: true, status: true, department: true, year: true, createdAt: true },
  });

  const totalStudents = allStudents.length;
  const activeStudents = allStudents.filter((s) => s.status === "ACTIVE").length;
  const onboardedStudents = allStudents.filter((s) => s.userId !== null).length;

  const userIds = allStudents.filter((s) => s.userId).map((s) => s.userId as string);

  let totalSessions = 0;
  let totalTimeSpent = 0;
  let moduleBreakdown: Record<string, number> = {};
  let avgScore: number | null = null;
  let sessionCountByDate: Record<string, number> = {};

  if (userIds.length > 0) {
    const dateFilter: Record<string, unknown> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const sessionsWhere: Record<string, unknown> = { userId: { in: userIds } };
    if (Object.keys(dateFilter).length) sessionsWhere.createdAt = dateFilter;

    const sessions = await prisma.session.findMany({
      where: sessionsWhere as any,
      select: { module: true, duration: true, aggregateScore: true, createdAt: true },
    });

    totalSessions = sessions.length;
    totalTimeSpent = sessions.reduce((acc, s) => acc + (s.duration ?? 0), 0);

    for (const s of sessions) {
      moduleBreakdown[s.module] = (moduleBreakdown[s.module] ?? 0) + 1;
      const dateKey = new Date(s.createdAt).toISOString().slice(0, 10);
      sessionCountByDate[dateKey] = (sessionCountByDate[dateKey] ?? 0) + 1;
    }

    const scores = sessions.map((s) => s.aggregateScore).filter(Boolean) as number[];
    avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  }

  // Department breakdown
  const deptMap: Record<string, number> = {};
  for (const s of allStudents) {
    const dept = s.department ?? "Unknown";
    deptMap[dept] = (deptMap[dept] ?? 0) + 1;
  }

  // Inactive flagging - students not logged in for 14 days
  let inactiveCount = 0;
  if (userIds.length > 0) {
    const threshold = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const recentLogins = await prisma.userLoginLog.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, loginTime: { gte: threshold } },
      _max: { loginTime: true },
    });
    const recentLoginUserIds = new Set(recentLogins.map((r) => r.userId));
    inactiveCount = userIds.filter((id) => !recentLoginUserIds.has(id)).length;
  }

  return NextResponse.json({
    overview: {
      totalStudents,
      activeStudents,
      onboardedStudents,
      totalSeats: collegeAdmin?.totalSeats ?? 0,
      usedSeats: collegeAdmin?.usedSeats ?? 0,
      allocatedPlan: collegeAdmin?.allocatedPlan ?? "Free",
      planExpiresAt: collegeAdmin?.planExpiresAt ?? null,
      totalSessions,
      totalTimeSpentMinutes: totalTimeSpent,
      avgScore,
      inactiveCount,
    },
    moduleBreakdown,
    departmentBreakdown: deptMap,
    sessionCountByDate,
  });
}
