import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCollegeAdminFromRequest } from "@/lib/collegeAuth";

// ─── POST /api/college/notifications/send  (College Admin only) ──────────────
//  Sends in-app notification to registered (onboarded) students of this college
//  Body: { title, message, type, target: "all" | "specific", studentIds?: string[] }
export async function POST(req: NextRequest) {
  const admin = await getCollegeAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    title,
    message,
    type = "info",
    target,
    studentIds,
  } = body as {
    title: string;
    message: string;
    type?: string;
    target: "all" | "specific";
    studentIds?: string[];
  };

  if (!title?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
  }

  // Find students that belong to this college AND are onboarded (have a userId)
  const where: Record<string, unknown> = {
    collegeAdminId: admin.id,
    userId: { not: null },   // only students who have registered
    status: "ACTIVE",
  };

  if (target === "specific") {
    if (!studentIds || studentIds.length === 0) {
      return NextResponse.json({ error: "No studentIds provided" }, { status: 400 });
    }
    where.id = { in: studentIds };
  }

  const students = await prisma.collegeStudent.findMany({
    where: where as any,
    select: { userId: true },
  });

  const userIds = students.map((s) => s.userId as string).filter(Boolean);

  if (userIds.length === 0) {
    return NextResponse.json({ error: "No registered students found", sent: 0 });
  }

  const notifications = userIds.map((userId) => ({
    userId,
    title: title.trim(),
    message: message.trim(),
    type,
    isRead: false,
    sentBy: admin.id,
    sentByRole: "COLLEGE_ADMIN",
  }));

  await prisma.notification.createMany({ data: notifications });

  return NextResponse.json({ ok: true, sent: notifications.length });
}

// ─── GET /api/college/notifications/send  (history of sent notifications) ────
export async function GET(req: NextRequest) {
  const admin = await getCollegeAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));

  // Get unique notification batches sent by this college admin (group by title+createdAt approx)
  // We'll get the latest distinct notifications sent by this admin
  const [total, notifications] = await Promise.all([
    prisma.notification.count({
      where: { sentBy: admin.id, sentByRole: "COLLEGE_ADMIN" },
    }),
    prisma.notification.findMany({
      where:   { sentBy: admin.id, sentByRole: "COLLEGE_ADMIN" },
      distinct: ["title", "message"],
      orderBy:  { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
      select:  { id: true, title: true, message: true, type: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({ notifications, total, page, limit });
}
