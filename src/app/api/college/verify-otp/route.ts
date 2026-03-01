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

    const record = await prisma.collegeOtpVerification.findFirst({
      where: {
        email: email.toLowerCase(),
        type: "college_signup",
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

    if (record.attempts >= MAX_ATTEMPTS) {
      await prisma.collegeOtpVerification.delete({ where: { id: record.id } });
      return NextResponse.json(
        { error: "Too many incorrect attempts. Please request a new OTP." },
        { status: 429 }
      );
    }

    if (record.otp !== otp.trim()) {
      await prisma.collegeOtpVerification.update({
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

    // Check again if admin was already created (race condition)
    const existingAdmin = await prisma.collegeAdmin.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingAdmin) {
      await prisma.collegeOtpVerification.update({ where: { id: record.id }, data: { verified: true } });
      return NextResponse.json({ success: true, message: "Account already exists. Please login." });
    }

    const meta = record.pendingMeta as {
      collegeName: string;
      designation: string;
      contactNumber: string;
      domain: string;
    };

    // Create the CollegeAdmin with PENDING status (awaits superadmin approval)
    await prisma.collegeAdmin.create({
      data: {
        collegeName: meta.collegeName,
        adminName: record.pendingName ?? "",
        email: email.toLowerCase(),
        password: record.pendingPassword ?? "",
        designation: meta.designation,
        contactNumber: meta.contactNumber,
        domain: meta.domain,
        status: "PENDING",
      },
    });

    await prisma.collegeOtpVerification.update({
      where: { id: record.id },
      data: { verified: true },
    });

    return NextResponse.json({
      success: true,
      message: "Email verified! Your application is under review. You will be notified once approved.",
    });
  } catch (error) {
    console.error("[college/verify-otp]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
