import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendCollegeOtpEmail } from "@/lib/collegeEmail";

const OTP_EXPIRY_MINUTES = 5;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body as { email: string };

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    // Find the most recent unverified OTP record
    const record = await prisma.collegeOtpVerification.findFirst({
      where: { email: email.toLowerCase(), type: "college_signup", verified: false },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json({ error: "No pending signup found for this email." }, { status: 404 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.collegeOtpVerification.update({
      where: { id: record.id },
      data: { otp, expiresAt, attempts: 0 },
    });

    const meta = record.pendingMeta as { collegeName?: string } | null;
    await sendCollegeOtpEmail(email.toLowerCase(), otp, meta?.collegeName);

    return NextResponse.json({ success: true, message: "New OTP sent." });
  } catch (error) {
    console.error("[college/resend-otp]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
