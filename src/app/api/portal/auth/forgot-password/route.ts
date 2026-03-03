/**
 * Portal Forgot Password API
 * POST /api/portal/auth/forgot-password  => sends reset email
 * PUT  /api/portal/auth/forgot-password  => resets with token
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPortalEmail, ADMIN_EMAIL_TEMPLATES } from "@/lib/portal-email";
import { z } from "zod";

const ForgotSchema = z.object({ email: z.string().email() });
const ResetSchema = z.object({ token: z.string(), password: z.string().min(8) });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ForgotSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid email" }, { status: 400 });

    const { email } = parsed.data;
    const staff = await prisma.portalStaff.findUnique({ where: { email } });

    // Always return 200 to prevent email enumeration
    if (!staff) return NextResponse.json({ success: true });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.portalStaff.update({
      where: { id: staff.id },
      data: { passwordResetToken: resetToken, passwordResetExpiry: expiresAt },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${appUrl}/portal/reset-password?token=${resetToken}`;

    const { subject, html } = ADMIN_EMAIL_TEMPLATES.passwordReset(staff.name, resetLink);
    await sendPortalEmail({
      to: staff.email,
      subject,
      html,
      senderRole: "ADMIN",
      senderEmail: process.env.ADMIN_EMAIL_USER!,
      staffId: staff.id,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ResetSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    const { token, password } = parsed.data;

    const staff = await prisma.portalStaff.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: { gt: new Date() },
      },
    });

    if (!staff) return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });

    const hashed = await bcrypt.hash(password, 12);

    await prisma.portalStaff.update({
      where: { id: staff.id },
      data: {
        password: hashed,
        passwordResetToken: null,
        passwordResetExpiry: null,
        loginAttempts: 0,
        lockedUntil: null,
      },
    });

    await prisma.portalAuditLog.create({
      data: {
        staffId: staff.id,
        actorEmail: staff.email,
        actorRole: staff.role,
        action: "PASSWORD_RESET",
        metadata: { method: "token" },
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
