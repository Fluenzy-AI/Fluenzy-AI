import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { isInstitutionalEmail } from "@/lib/collegeAuth";
import { sendCollegeOtpEmail } from "@/lib/collegeEmail";

const OTP_EXPIRY_MINUTES = 5;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { collegeName, adminName, email, password, designation, contactNumber } = body as {
      collegeName: string;
      adminName: string;
      email: string;
      password: string;
      designation: string;
      contactNumber: string;
    };

    // Validation
    if (!collegeName?.trim() || !adminName?.trim() || !email?.trim() || !password?.trim() || !designation?.trim() || !contactNumber?.trim()) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const { valid, domain } = isInstitutionalEmail(email);
    if (!valid) {
      return NextResponse.json(
        { error: "Only official institutional email addresses are allowed. Personal emails (Gmail, Yahoo, etc.) are not permitted." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    // Check if already registered
    const existing = await prisma.collegeAdmin.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "This email is already registered." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Delete any previous unverified OTP records for this email
    await prisma.collegeOtpVerification.deleteMany({
      where: { email: email.toLowerCase(), verified: false },
    });

    await prisma.collegeOtpVerification.create({
      data: {
        email: email.toLowerCase(),
        otp,
        type: "college_signup",
        expiresAt,
        pendingName: adminName.trim(),
        pendingPassword: hashedPassword,
        pendingMeta: {
          collegeName: collegeName.trim(),
          designation: designation.trim(),
          contactNumber: contactNumber.trim(),
          domain,
        },
      },
    });

    await sendCollegeOtpEmail(email.toLowerCase(), otp, collegeName);

    return NextResponse.json({ success: true, message: "OTP sent to your institutional email." });
  } catch (error) {
    console.error("[college/send-otp]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
