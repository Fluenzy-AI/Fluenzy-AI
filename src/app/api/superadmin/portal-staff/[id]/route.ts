/**
 * Super Admin - Individual Staff Management
 * GET    /api/superadmin/portal-staff/[id]     - Get staff
 * PATCH  /api/superadmin/portal-staff/[id]     - Update staff
 * DELETE /api/superadmin/portal-staff/[id]     - Delete staff
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const UpdateStaffSchema = z.object({
  name: z.string().min(2).optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "LOCKED"]).optional(),
  role: z.enum(["ADMIN", "HR"]).optional(),
  permissions: z.record(z.string(), z.boolean()).optional(),
  newPassword: z.string().min(8).optional(),
});

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  if ((session.user as { role?: string }).role !== "SUPER_ADMIN") return null;
  return session;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const staff = await prisma.portalStaff.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, role: true, status: true,
      department: true, phone: true, avatar: true, permissions: true,
      loginAttempts: true, lastLoginAt: true, lastLoginIp: true,
      lockedUntil: true, createdAt: true, updatedAt: true,
      auditLogs: { take: 20, orderBy: { createdAt: "desc" } },
    },
  });

  if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });
  return NextResponse.json({ staff });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = UpdateStaffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const { newPassword, ...rest } = parsed.data;
    const updateData: Record<string, unknown> = { ...rest };

    if (newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 12);
      updateData.loginAttempts = 0;
      updateData.lockedUntil = null;
    }

    const updated = await prisma.portalStaff.update({
      where: { id },
      data: updateData,
      select: {
        id: true, name: true, email: true, role: true, status: true,
        department: true, phone: true, permissions: true, updatedAt: true,
      },
    });

    await prisma.portalAuditLog.create({
      data: {
        actorEmail: (session.user as { email?: string }).email,
        actorRole: "SUPER_ADMIN",
        action: "UPDATE_PORTAL_STAFF",
        entityType: "PortalStaff",
        entityId: id,
        metadata: { changes: rest, passwordChanged: !!newPassword },
      },
    });

    return NextResponse.json({ success: true, staff: updated });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    const staff = await prisma.portalStaff.findUnique({ where: { id } });
    if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

    // Revoke all refresh tokens
    await prisma.portalRefreshToken.deleteMany({ where: { staffId: id } });

    await prisma.portalStaff.delete({ where: { id } });

    await prisma.portalAuditLog.create({
      data: {
        actorEmail: (session.user as { email?: string }).email,
        actorRole: "SUPER_ADMIN",
        action: "DELETE_PORTAL_STAFF",
        entityType: "PortalStaff",
        entityId: id,
        metadata: { deletedEmail: staff.email, deletedRole: staff.role },
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
