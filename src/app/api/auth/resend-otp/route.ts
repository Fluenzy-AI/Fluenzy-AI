import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendOTPEmail } from "@/lib/brevo-mail";
import { buildOtpEmailTemplate } from "@/lib/email-templates";

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
      html: buildOtpEmailTemplate({
        name: firstName,
        otp,
        expiryMinutes: OTP_EXPIRY_MINUTES,
        type: "signup",
      }),
    });

    return NextResponse.json({ success: true, message: "New OTP sent successfully." });
  } catch (error) {
    console.error("[resend-otp] Error:", error);
    return NextResponse.json({ error: "Failed to resend OTP." }, { status: 500 });
  }
}
