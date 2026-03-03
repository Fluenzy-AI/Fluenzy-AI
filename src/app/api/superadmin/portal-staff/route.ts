/**
 * Super Admin - Portal Staff Management
 * GET    /api/superadmin/portal-staff          - List all staff
 * POST   /api/superadmin/portal-staff          - Create staff (Admin or HR)
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { sendPortalEmail, ADMIN_EMAIL_TEMPLATES } from "@/lib/portal-email";

const CreateStaffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "HR"]),
  department: z.string().optional(),
  phone: z.string().optional(),
  permissions: z.record(z.string(), z.boolean()).optional(),
});

async function requireSuperAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  if ((session.user as { role?: string }).role !== "SUPER_ADMIN") return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireSuperAdmin(req);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where = {
    ...(role ? { role: role as "ADMIN" | "HR" } : {}),
    ...(status ? { status: status as "ACTIVE" | "INACTIVE" | "SUSPENDED" | "LOCKED" } : {}),
  };

  const [total, staff] = await Promise.all([
    prisma.portalStaff.count({ where }),
    prisma.portalStaff.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        department: true,
        phone: true,
        avatar: true,
        loginAttempts: true,
        lastLoginAt: true,
        lockedUntil: true,
        createdAt: true,
        permissions: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ staff, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await requireSuperAdmin(req);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = CreateStaffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const { name, email, password, role, department, phone, permissions } = parsed.data;

    const existing = await prisma.portalStaff.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const hashed = await bcrypt.hash(password, 12);

    const newStaff = await prisma.portalStaff.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashed,
        role,
        department,
        phone,
        permissions: permissions || {},
        createdBy: (session.user as { id?: string }).id,
      },
    });

    // Send welcome email (non-blocking — don't let email failure abort staff creation)
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await sendPortalEmail({
        to: email,
        subject: `Welcome to Fluenzy AI ${role === "ADMIN" ? "Admin" : "HR"} Portal`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#6366f1;">Welcome to Fluenzy AI Portal!</h2>
            <p>Dear ${name},</p>
            <p>Your <strong>${role === "ADMIN" ? "Admin" : "HR"}</strong> portal account has been created by the Super Admin.</p>
            <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;">
              <p><strong>Portal URL:</strong> <a href="${appUrl}/portal/login">${appUrl}/portal/login</a></p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Role:</strong> ${role}</p>
            </div>
            <p style="color:#ef4444;font-weight:bold;">Please change your password after first login.</p>
            <p>Fluenzy AI Team</p>
          </div>
        `,
        senderRole: "SUPER_ADMIN",
        senderEmail: process.env.SUPERADMIN_EMAIL_MANAGEMENT!,
      });
    } catch (emailErr) {
      console.warn("[CREATE_PORTAL_STAFF] Welcome email failed (non-fatal):", emailErr);
    }

    // Audit (non-blocking)
    try {
    await prisma.portalAuditLog.create({
      data: {
        actorEmail: (session.user as { email?: string }).email,
        actorRole: "SUPER_ADMIN",
        action: "CREATE_PORTAL_STAFF",
        entityType: "PortalStaff",
        entityId: newStaff.id,
        metadata: { name, email, role },
      },
    });
    } catch (auditErr) {
      console.warn("[CREATE_PORTAL_STAFF] Audit log failed (non-fatal):", auditErr);
    }

    const { password: _p, refreshToken: _r, passwordResetToken: _t, ...safeStaff } = newStaff;
    return NextResponse.json({ success: true, staff: safeStaff }, { status: 201 });
  } catch (err) {
    console.error("[CREATE_PORTAL_STAFF]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
