import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = body as { email: string; otp: string };

    if (!email || !otp || otp.length !== 6) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    // ── Find the latest unexpired OTP record ──────────────────────────────────
    const record = await prisma.otpVerification.findFirst({
      where: {
        email: email.toLowerCase(),
        type: "signup",
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json(
        { error: "OTP has expired or does not exist. Please request a new one." },
        { status: 410 }
      );
    }

    // ── Max attempts guard ────────────────────────────────────────────────────
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

    // ── OTP valid – create user ───────────────────────────────────────────────
    const existingUser = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      // Mark OTP as verified and return success (don't error if somehow user exists)
      await prisma.otpVerification.update({
        where: { id: record.id },
        data: { verified: true },
      });
      return NextResponse.json({ success: true, message: "Account already exists. You can log in." });
    }

    // Create the user using pending data stored at OTP creation time
    await prisma.users.create({
      data: {
        name: record.pendingName ?? "User",
        email: email.toLowerCase(),
        password: record.pendingPassword ?? "",
        plan: "Free",
        usageCount: 0,
        usageLimit: 3,
        role: "User",
      },
    });

    // Mark record verified
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { verified: true },
    });

    // Clean up old OTP records for this email
    await prisma.otpVerification.deleteMany({
      where: { email: email.toLowerCase(), verified: true },
    });

    return NextResponse.json({
      success: true,
      message: "Account verified successfully! You can now sign in.",
    });
  } catch (error: any) {
    console.error("[verify-otp] Error:", error);
    return NextResponse.json({ error: "An error occurred. Please try again." }, { status: 500 });
  }
}
