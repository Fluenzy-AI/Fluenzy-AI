import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// ─── DELETE /api/notifications/[id]  (Superadmin – deletes entire batch) ─────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role as string) !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Find the representative notification to get its title + message
  const notif = await prisma.notification.findFirst({
    where: { id, sentByRole: "SUPER_ADMIN" },
    select: { title: true, message: true },
  });

  if (!notif) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete ALL notifications of this batch (same title+message sent by SUPER_ADMIN)
  const { count } = await prisma.notification.deleteMany({
    where: { title: notif.title, message: notif.message, sentByRole: "SUPER_ADMIN" },
  });

  return NextResponse.json({ ok: true, deleted: count });
}

// ─── PATCH /api/notifications/[id]  (Superadmin – edits entire batch) ────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role as string) !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { title, message } = body as { title?: string; message?: string };

  if (!title?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
  }

  // Find original to match the batch
  const notif = await prisma.notification.findFirst({
    where: { id, sentByRole: "SUPER_ADMIN" },
    select: { title: true, message: true },
  });

  if (!notif) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { count } = await prisma.notification.updateMany({
    where: { title: notif.title, message: notif.message, sentByRole: "SUPER_ADMIN" },
    data:  { title: title.trim(), message: message.trim() },
  });

  return NextResponse.json({ ok: true, updated: count });
}
