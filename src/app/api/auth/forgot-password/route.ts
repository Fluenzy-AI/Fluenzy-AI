import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { createEmailTransporter } from "@/lib/email-transporter";

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
    const transporter = createEmailTransporter({
      user: process.env.forgotpassword_EMAIL_USER,
      pass: process.env.forgotpassword_EMAIL_PASS,
      label: "FORGOT-PASSWORD"
    });
    const firstName = user.name?.split(" ")[0] || "User";

    await transporter.sendMail({
      from: `"Fluenzy AI" <${process.env.forgotpassword_EMAIL_USER}>`,
      to: normalizedEmail,
      subject: "Fluenzy AI – Password Reset Code",
      html: buildPasswordResetEmail(firstName, otp, OTP_EXPIRY_MINUTES),
    });

    return NextResponse.json({
      success: true,
      message: "If an account with this email exists, you will receive a password reset OTP shortly.",
      email: normalizedEmail, // Return for frontend use
    });
  } catch (error: any) {
    console.error("[FORGOT-PASSWORD] Error:", error?.message || error);
    console.error("[FORGOT-PASSWORD] Error code:", error?.code);
    console.error("[FORGOT-PASSWORD] Error command:", error?.command);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}

// ── HTML Email template for password reset ────────────────────────────────────
function buildPasswordResetEmail(name: string, otp: string, expiryMinutes: number): string {
  const digits = otp.split("");
  const digitBoxes = digits
    .map(
      (d) =>
        `<span style="display:inline-block;width:48px;height:56px;line-height:56px;text-align:center;font-size:28px;font-weight:700;background:#1e1b4b;border:2px solid #7c3aed;border-radius:10px;color:#c4b5fd;margin:0 4px;">${d}</span>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0a1e;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0a1e;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:linear-gradient(135deg,#1a1035 0%,#0d0a2e 100%);border-radius:20px;border:1px solid rgba(124,58,237,0.3);overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px;">Fluenzy AI</p>
            <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.75);">Password Reset</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#e2e8f0;">Hey ${name} 👋</p>
            <p style="margin:0 0 28px;font-size:15px;color:#94a3b8;line-height:1.6;">
              We received a request to reset your password.<br>Use the code below to proceed:
            </p>

            <!-- OTP Boxes -->
            <div style="text-align:center;margin:0 0 28px;">${digitBoxes}</div>

            <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.2);border-radius:12px;padding:16px 20px;margin-bottom:28px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#94a3b8;">
                ⏱️ This code expires in <strong style="color:#c4b5fd;">${expiryMinutes} minutes</strong>
              </p>
            </div>

            <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:16px 20px;margin-bottom:28px;">
              <p style="margin:0;font-size:13px;color:#fca5a5;line-height:1.6;">
                ⚠️ <strong>Security Warning:</strong> If you didn't request this password reset, please ignore this email. Your account is secure.
              </p>
            </div>

            <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
              🔒 <strong style="color:#94a3b8;">Never share this code</strong> with anyone. Fluenzy AI will never ask for your OTP via email, phone, or chat.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;font-size:12px;color:#475569;">© 2026 Fluenzy AI · All rights reserved</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
