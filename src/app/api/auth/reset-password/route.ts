import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

const MAX_ATTEMPTS = 5;

// ── Strong password: ≥8 chars, uppercase, lowercase, digit, special ───────────
function isStrongPassword(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(
    password
  );
}

// ── Basic email regex ─────────────────────────────────────────────────────────
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp, newPassword, confirmPassword } = body as {
      email: string;
      otp: string;
      newPassword: string;
      confirmPassword: string;
    };

    // ── Validate inputs ───────────────────────────────────────────────────────
    if (!email?.trim() || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    if (!otp?.trim() || otp.length !== 6) {
      return NextResponse.json(
        { error: "Please enter a valid 6-digit OTP." },
        { status: 400 }
      );
    }

    if (!newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Password fields are required." },
        { status: 400 }
      );
    }

    if (!isStrongPassword(newPassword)) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters with uppercase, lowercase, number, and special character.",
        },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── Find the latest unexpired password reset OTP ──────────────────────────
    const record = await prisma.otpVerification.findFirst({
      where: {
        email: normalizedEmail,
        type: "password_reset",
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json(
        { error: "OTP has expired or is invalid. Please request a new one." },
        { status: 410 }
      );
    }

    // ── Check max attempts ────────────────────────────────────────────────────
    if (record.attempts >= MAX_ATTEMPTS) {
      await prisma.otpVerification.delete({ where: { id: record.id } });
      return NextResponse.json(
        { error: "Too many incorrect attempts. Please request a new OTP." },
        { status: 429 }
      );
    }

    // ── Verify OTP ────────────────────────────────────────────────────────────
    if (record.otp !== otp.trim()) {
      await prisma.otpVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      const remaining = MAX_ATTEMPTS - record.attempts - 1;
      return NextResponse.json(
        {
          error: `Incorrect OTP. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : "No attempts remaining."}`,
          attemptsRemaining: remaining,
        },
        { status: 400 }
      );
    }

    // ── Check if user exists ──────────────────────────────────────────────────
    const user = await prisma.users.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email address." },
        { status: 404 }
      );
    }

    // ── Hash new password and update user ─────────────────────────────────────
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.users.update({
      where: { email: normalizedEmail },
      data: { password: hashedPassword },
    });

    // ── Mark OTP as verified and clean up ─────────────────────────────────────
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { verified: true },
    });

    // Clean up all password reset OTPs for this email
    await prisma.otpVerification.deleteMany({
      where: {
        email: normalizedEmail,
        type: "password_reset",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully! You can now sign in with your new password.",
    });
  } catch (error: any) {
    console.error("[reset-password] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
