import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createEmailTransporter, sendEmail } from "@/lib/email-transporter";

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

// ── SMTP transporter ──────────────────────────────────────────────────────────
function createTransporter() {
  return createEmailTransporter({
    user: process.env.SIGNUP_OTP_EMAIL_USER,
    pass: process.env.SIGNUP_OTP_EMAIL_PASS,
    label: "SIGNUP-OTP",
  });
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
    const transporter = createTransporter();
    const emailResult = await sendEmail(
      transporter,
      {
        from: `"Fluenzy AI" <${process.env.SIGNUP_OTP_EMAIL_USER}>`,
        to: email,
        subject: "Fluenzy AI – Verify Your Account",
        html: buildOtpEmail(firstName.trim(), otp, OTP_EXPIRY_MINUTES),
      },
      "SIGNUP-OTP"
    );

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

// ── HTML Email template ───────────────────────────────────────────────────────
function buildOtpEmail(name: string, otp: string, expiryMinutes: number): string {
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
            <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.75);">Account Verification</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#e2e8f0;">Hey ${name} 👋</p>
            <p style="margin:0 0 28px;font-size:15px;color:#94a3b8;line-height:1.6;">
              You're one step away from accessing your Fluenzy AI account.<br>Use the verification code below:
            </p>

            <!-- OTP Boxes -->
            <div style="text-align:center;margin:0 0 28px;">${digitBoxes}</div>

            <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.2);border-radius:12px;padding:16px 20px;margin-bottom:28px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#94a3b8;">
                ⏱️ This code expires in <strong style="color:#c4b5fd;">${expiryMinutes} minutes</strong>
              </p>
            </div>

            <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
              🔒 <strong style="color:#94a3b8;">Security tip:</strong> Never share this code with anyone. Fluenzy AI will never ask for your OTP via email, phone, or chat.
            </p>
            <p style="margin:16px 0 0;font-size:13px;color:#64748b;">
              If you didn't create an account, you can safely ignore this email.
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
