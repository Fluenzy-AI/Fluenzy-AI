import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendOTPEmail } from "@/lib/brevo-mail";
import { buildOtpEmailTemplate } from "@/lib/email-templates";
import { isInstitutionalEmail } from "@/lib/collegeAuth";

const OTP_EXPIRY_MINUTES = 10;
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
        { error: "Please enter a valid institutional email address." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── Validate institutional email ──────────────────────────────────────────
    const { valid } = isInstitutionalEmail(normalizedEmail);
    if (!valid) {
      return NextResponse.json(
        { error: "Only official institutional email addresses are allowed." },
        { status: 400 }
      );
    }

    // ── Rate-limit: max requests per 10 minutes ───────────────────────────────
    const recentRequests = await prisma.collegeOtpVerification.findMany({
      where: {
        email: normalizedEmail,
        type: "college_password_reset",
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
    });

    if (recentRequests.length >= MAX_REQUESTS_PER_10_MIN) {
      // Generic response to prevent enumeration
      return NextResponse.json({
        success: true,
        message: "If an account with this email exists, you will receive a password reset code shortly.",
      });
    }

    // ── Check if college admin exists ─────────────────────────────────────────
    const admin = await prisma.collegeAdmin.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, collegeName: true, adminName: true },
    });

    // Always respond generically to prevent email enumeration
    if (!admin) {
      return NextResponse.json({
        success: true,
        message: "If an account with this email exists, you will receive a password reset code shortly.",
      });
    }

    // ── Invalidate any previous unused password reset OTPs ────────────────────
    await prisma.collegeOtpVerification.deleteMany({
      where: {
        email: normalizedEmail,
        type: "college_password_reset",
        verified: false,
      },
    });

    // ── Generate secure OTP and store ─────────────────────────────────────────
    const otp = generateSecureOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.collegeOtpVerification.create({
      data: {
        email: normalizedEmail,
        otp,
        type: "college_password_reset",
        expiresAt,
        pendingName: admin.adminName,
        verified: false,
      },
    });

    // ── Send password reset email ─────────────────────────────────────────────
    const firstName = admin.adminName?.split(" ")[0] || "Admin";

    const result = await sendOTPEmail({
      to: normalizedEmail,
      subject: "Fluenzy AI College Portal – Password Reset Code",
      html: buildOtpEmailTemplate({
        name: firstName,
        otp,
        expiryMinutes: OTP_EXPIRY_MINUTES,
        type: "password_reset",
      }),
    });

    if (!result.success) {
      console.error("[college/forgot-password] Email send failed:", result.error);
      return NextResponse.json(
        { error: "Failed to send reset code. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "If an account with this email exists, you will receive a password reset code shortly.",
      email: normalizedEmail, // Return for frontend use
    });
  } catch (error: any) {
    console.error("[college/forgot-password] Error:", error?.message || error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
