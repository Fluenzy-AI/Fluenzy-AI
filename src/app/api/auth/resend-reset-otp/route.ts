import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";
import crypto from "crypto";

const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;

// ── Generate a cryptographically secure 6-digit OTP ───────────────────────────
function generateSecureOtp(): string {
  const randomBytes = crypto.randomBytes(4);
  const randomNumber = randomBytes.readUInt32BE(0);
  const otp = (randomNumber % 900000) + 100000;
  return otp.toString();
}

// ── SMTP transporter for password reset emails ────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.forgotpassword_EMAIL_USER,
      pass: process.env.forgotpassword_EMAIL_PASS,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body as { email: string };

    if (!email?.trim()) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── Find the last OTP request for this email ──────────────────────────────
    const lastOtp = await prisma.otpVerification.findFirst({
      where: {
        email: normalizedEmail,
        type: "password_reset",
        verified: false,
      },
      orderBy: { createdAt: "desc" },
    });

    // ── Rate-limit: enforce cooldown period ───────────────────────────────────
    if (lastOtp) {
      const elapsed = Date.now() - new Date(lastOtp.createdAt).getTime();
      if (elapsed < RESEND_COOLDOWN_SECONDS * 1000) {
        const wait = Math.ceil((RESEND_COOLDOWN_SECONDS * 1000 - elapsed) / 1000);
        return NextResponse.json(
          { 
            error: `Please wait ${wait} seconds before requesting a new OTP.`,
            waitSeconds: wait,
          },
          { status: 429 }
        );
      }
    }

    // ── Check if user exists ──────────────────────────────────────────────────
    const user = await prisma.users.findUnique({
      where: { email: normalizedEmail },
    });

    // Always respond generically to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account with this email exists, a new OTP has been sent.",
      });
    }

    // ── Invalidate previous OTPs ──────────────────────────────────────────────
    await prisma.otpVerification.deleteMany({
      where: {
        email: normalizedEmail,
        type: "password_reset",
        verified: false,
      },
    });

    // ── Generate new OTP ──────────────────────────────────────────────────────
    const otp = generateSecureOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.otpVerification.create({
      data: {
        email: normalizedEmail,
        otp,
        type: "password_reset",
        expiresAt,
        pendingName: user.name,
      },
    });

    // ── Send new OTP email ────────────────────────────────────────────────────
    const firstName = user.name?.split(" ")[0] || "User";
    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"Fluenzy AI" <${process.env.forgotpassword_EMAIL_USER}>`,
      to: normalizedEmail,
      subject: "Fluenzy AI – New Password Reset Code",
      html: buildResendOtpEmail(firstName, otp, OTP_EXPIRY_MINUTES),
    });

    return NextResponse.json({
      success: true,
      message: "A new OTP has been sent to your email.",
    });
  } catch (error: any) {
    console.error("[resend-reset-otp] Error:", error);
    return NextResponse.json(
      { error: "Failed to resend OTP. Please try again." },
      { status: 500 }
    );
  }
}

// ── HTML Email template ───────────────────────────────────────────────────────
function buildResendOtpEmail(name: string, otp: string, expiryMinutes: number): string {
  const digitBoxes = otp
    .split("")
    .map(
      (d) =>
        `<span style="display:inline-block;width:48px;height:56px;line-height:56px;text-align:center;font-size:28px;font-weight:700;background:#1e1b4b;border:2px solid #7c3aed;border-radius:10px;color:#c4b5fd;margin:0 4px;">${d}</span>`
    )
    .join("");

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f0a1e;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0a1e;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:linear-gradient(135deg,#1a1035,#0d0a2e);border-radius:20px;border:1px solid rgba(124,58,237,0.3);overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:28px 40px;text-align:center;">
          <p style="margin:0;font-size:26px;font-weight:800;color:#fff;">Fluenzy AI</p>
          <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.75);">New Password Reset Code</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#e2e8f0;">Hey ${name} 👋</p>
          <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;">Here's your new password reset code:</p>
          <div style="text-align:center;margin:0 0 24px;">${digitBoxes}</div>
          <p style="margin:0;text-align:center;font-size:13px;color:#94a3b8;">Expires in <strong style="color:#c4b5fd;">${expiryMinutes} minutes</strong></p>
        </td></tr>
        <tr><td style="padding:16px 40px 28px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <p style="margin:0;font-size:12px;color:#475569;">© 2026 Fluenzy AI</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
