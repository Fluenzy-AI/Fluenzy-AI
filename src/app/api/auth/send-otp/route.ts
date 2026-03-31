import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendOTPEmail } from "@/lib/brevo-mail";
import { buildOtpEmailTemplate } from "@/lib/email-templates";

const OTP_EXPIRY_MINUTES = 5;

// ── Generate a secure 6-digit OTP ────────────────────────────────────────────
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── Basic email regex ─────────────────────────────────────────────────────────
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Strong password: ≥8 chars, uppercase, lowercase, digit, special ───────────
function isStrongPassword(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(
    password
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
    } = body as {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      confirmPassword: string;
    };

    // ── Server-side validation ────────────────────────────────────────────────
    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
    }
    if (!email?.trim() || !isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }
    if (!isStrongPassword(password)) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
        },
        { status: 400 }
      );
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    // ── Check for duplicate email ─────────────────────────────────────────────
    const existingUser = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // ── Rate-limit: max 5 OTP requests per email per 10 min ───────────────────
    const recentOtps = await prisma.otpVerification.findMany({
      where: {
        email: email.toLowerCase(),
        type: "signup",
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
    });
    if (recentOtps.length >= 5) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please wait 10 minutes before trying again." },
        { status: 429 }
      );
    }

    // ── Invalidate any previous unused OTPs for this email ───────────────────
    await prisma.otpVerification.deleteMany({
      where: { email: email.toLowerCase(), type: "signup", verified: false },
    });

    // ── Hash password & generate OTP ─────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.otpVerification.create({
      data: {
        email: email.toLowerCase(),
        otp,
        type: "signup",
        expiresAt,
        pendingName: `${firstName.trim()} ${lastName.trim()}`,
        pendingPassword: hashedPassword,
      },
    });

    // ── Send OTP email ────────────────────────────────────────────────────────
    const emailResult = await sendOTPEmail({
      to: email,
      subject: "Fluenzy AI – Verify Your Account",
      html: buildOtpEmailTemplate({
        name: firstName.trim(),
        otp,
        expiryMinutes: OTP_EXPIRY_MINUTES,
        type: "signup",
      }),
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || "Failed to send OTP email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully. Please check your email.",
      email: email.toLowerCase(),
    });
  } catch (error: any) {
    console.error("[send-otp] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to send OTP. Please try again." },
      { status: 500 }
    );
  }
}
