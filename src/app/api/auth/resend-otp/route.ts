import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendOTPEmail } from "@/lib/brevo-mail";

const OTP_EXPIRY_MINUTES = 5;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body as { email: string };

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    // ── Rate-limit: allow resend only once per 30 seconds ─────────────────────
    const lastOtp = await prisma.otpVerification.findFirst({
      where: { email: email.toLowerCase(), type: "signup", verified: false },
      orderBy: { createdAt: "desc" },
    });

    if (lastOtp) {
      const elapsed = Date.now() - new Date(lastOtp.createdAt).getTime();
      if (elapsed < 30 * 1000) {
        const wait = Math.ceil((30 * 1000 - elapsed) / 1000);
        return NextResponse.json(
          { error: `Please wait ${wait} seconds before requesting a new OTP.` },
          { status: 429 }
        );
      }
    }

    // ── Check whether pending signup data exists (generated at send-otp) ────
    if (!lastOtp) {
      return NextResponse.json(
        { error: "No pending signup found for this email. Please start the signup process again." },
        { status: 404 }
      );
    }

    // ── Generate new OTP, invalidate old ──────────────────────────────────────
    await prisma.otpVerification.deleteMany({
      where: { email: email.toLowerCase(), type: "signup", verified: false },
    });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.otpVerification.create({
      data: {
        email: email.toLowerCase(),
        otp,
        type: "signup",
        expiresAt,
        pendingName: lastOtp.pendingName,
        pendingPassword: lastOtp.pendingPassword,
      },
    });

    // ── Send new OTP ──────────────────────────────────────────────────────────
    const firstName = (lastOtp.pendingName ?? "").split(" ")[0] || "User";
    await sendOTPEmail({
      to: email,
      subject: "Fluenzy AI – New Verification Code",
      html: buildOtpEmail(firstName, otp, OTP_EXPIRY_MINUTES),
    });

    return NextResponse.json({ success: true, message: "New OTP sent successfully." });
  } catch (error) {
    console.error("[resend-otp] Error:", error);
    return NextResponse.json({ error: "Failed to resend OTP." }, { status: 500 });
  }
}

function buildOtpEmail(name: string, otp: string, expiryMinutes: number): string {
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
          <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.75);">New Verification Code</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#e2e8f0;">Hey ${name} 👋</p>
          <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;">Here's your new verification code:</p>
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
