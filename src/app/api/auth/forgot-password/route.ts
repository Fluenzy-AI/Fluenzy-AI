import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendOTPEmail } from "@/lib/brevo-mail";
import { buildOtpEmailTemplate } from "@/lib/email-templates";

const OTP_EXPIRY_MINUTES = 5;
const MAX_REQUESTS_PER_10_MIN = 3;

// ── Generate a cryptographically secure 6-digit OTP ───────────────────────────
function generateSecureOtp(): string {
  const randomBytes = crypto.randomBytes(4);
  const randomNumber = randomBytes.readUInt32BE(0);
  const otp = (randomNumber % 900000) + 100000;
  return otp.toString();
}

// ── Basic email regex ─────────────────────────────────────────────────────────
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body as { email: string };

    // ── Validate email format ─────────────────────────────────────────────────
    if (!email?.trim() || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── Rate-limit: max requests per 10 minutes ───────────────────────────────
    const recentRequests = await prisma.otpVerification.findMany({
      where: {
        email: normalizedEmail,
        type: "password_reset",
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
    });

    if (recentRequests.length >= MAX_REQUESTS_PER_10_MIN) {
      // Generic response to prevent enumeration
      return NextResponse.json({
        success: true,
        message: "If an account with this email exists, you will receive a password reset OTP shortly.",
      });
    }

    // ── Check if user exists ──────────────────────────────────────────────────
    const user = await prisma.users.findUnique({
      where: { email: normalizedEmail },
    });

    // Always respond generically to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account with this email exists, you will receive a password reset OTP shortly.",
      });
    }

    // ── Invalidate any previous unused password reset OTPs ────────────────────
    await prisma.otpVerification.deleteMany({
      where: {
        email: normalizedEmail,
        type: "password_reset",
        verified: false,
      },
    });

    // ── Generate secure OTP and store ─────────────────────────────────────────
    const otp = generateSecureOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.otpVerification.create({
      data: {
        email: normalizedEmail,
        otp,
        type: "password_reset",
        expiresAt,
        pendingName: user.name, // Store for email personalization
      },
    });

    // ── Send password reset email ─────────────────────────────────────────────
    const firstName = user.name?.split(" ")[0] || "User";

    const result = await sendOTPEmail({
      to: normalizedEmail,
      subject: "Fluenzy AI – Password Reset Code",
      html: buildOtpEmailTemplate({
        name: firstName,
        otp,
        expiryMinutes: OTP_EXPIRY_MINUTES,
        type: "password_reset",
      }),
    });

    if (!result.success) {
      console.error("[FORGOT-PASSWORD] Email send failed:", result.error);
      return NextResponse.json(
        { error: "Failed to send reset code. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "If an account with this email exists, you will receive a password reset OTP shortly.",
      email: normalizedEmail, // Return for frontend use
    });
  } catch (error: any) {
    console.error("[FORGOT-PASSWORD] Error:", error?.message || error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
