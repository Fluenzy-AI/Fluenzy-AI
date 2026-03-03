import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// ─── GET /api/notifications/send  (Superadmin history) ───────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role as string) !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));

  const [total, notifications] = await Promise.all([
    prisma.notification.count({ where: { sentByRole: "SUPER_ADMIN" } }),
    prisma.notification.findMany({
      where:    { sentByRole: "SUPER_ADMIN" },
      distinct: ["title", "message"],
      orderBy:  { createdAt: "desc" },
      skip:     (page - 1) * limit,
      take:     limit,
      select:   { id: true, title: true, message: true, type: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({ notifications, total, page, limit });
}

// ─── POST /api/notifications/send  (Superadmin only) ─────────────────────────
//  Body: { title, message, type, target: "all" | "specific", userIds?: string[] }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role as string) !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const {
    title,
    message,
    type = "info",
    target,
    userIds,
  } = body as {
    title: string;
    message: string;
    type?: string;
    target: "all" | "specific";
    userIds?: string[];
  };

  if (!title?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
  }
  if (!["all", "specific"].includes(target)) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  // Resolve recipient user IDs
  let recipientIds: string[] = [];

  if (target === "all") {
    const users = await prisma.users.findMany({
      where: { disabled: false },
      select: { id: true },
    });
    recipientIds = users.map((u) => u.id);
  } else {
    if (!userIds || userIds.length === 0) {
      return NextResponse.json({ error: "No userIds provided" }, { status: 400 });
    }
    recipientIds = userIds;
  }

  // Batch insert notifications (mongo supports many docs)
  const notifications = recipientIds.map((userId) => ({
    userId,
    title: title.trim(),
    message: message.trim(),
    type,
    isRead: false,
    sentBy: session.user.email ?? "superadmin",
    sentByRole: "SUPER_ADMIN",
  }));

  await prisma.notification.createMany({ data: notifications });

  return NextResponse.json({
    ok: true,
    sent: notifications.length,
  });
}
