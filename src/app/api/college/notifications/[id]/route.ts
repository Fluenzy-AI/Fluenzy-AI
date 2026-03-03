import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCollegeAdminFromRequest } from "@/lib/collegeAuth";

// ─── DELETE /api/college/notifications/[id]  (College Admin – deletes batch) ─
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getCollegeAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notif = await prisma.notification.findFirst({
    where: { id: params.id, sentBy: admin.id, sentByRole: "COLLEGE_ADMIN" },
    select: { title: true, message: true },
  });

  if (!notif) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { count } = await prisma.notification.deleteMany({
    where: { title: notif.title, message: notif.message, sentBy: admin.id, sentByRole: "COLLEGE_ADMIN" },
  });

  return NextResponse.json({ ok: true, deleted: count });
}

// ─── PATCH /api/college/notifications/[id]  (College Admin – edits batch) ────
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getCollegeAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, message } = body as { title?: string; message?: string };

  if (!title?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
  }

  const notif = await prisma.notification.findFirst({
    where: { id: params.id, sentBy: admin.id, sentByRole: "COLLEGE_ADMIN" },
    select: { title: true, message: true },
  });

  if (!notif) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { count } = await prisma.notification.updateMany({
    where: { title: notif.title, message: notif.message, sentBy: admin.id, sentByRole: "COLLEGE_ADMIN" },
    data:  { title: title.trim(), message: message.trim() },
  });

  return NextResponse.json({ ok: true, updated: count });
}
