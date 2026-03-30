/**
 * Company Signup - Send OTP
 * POST /api/company/send-otp
 * Body: { companyName, memberName, email, password, phone?, orgType, memberRole }
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { isWorkEmail, generateOtp, generateUniqueCompanySlug, extractDomain } from "@/lib/company-auth";
import { sendOTPEmail } from "@/lib/brevo-mail";

const OTP_EXPIRY_MINUTES = 10;

async function sendCompanyOtpEmail(email: string, otp: string, companyName: string) {
  await sendOTPEmail({
    to: email,
    subject: "Verify Your Company Account – Fluenzy AI",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center;">
          <h1 style="margin:0;font-size:26px;color:#fff;">Fluenzy AI</h1>
          <p style="margin:8px 0 0;color:#c7d2fe;font-size:14px;">Global Career Portal</p>
        </div>
        <div style="padding:32px 24px;">
          <h2 style="color:#a5b4fc;font-size:20px;margin-bottom:8px;">Verify Your Company Account</h2>
          <p style="color:#94a3b8;margin-bottom:12px;">Company: <strong style="color:#e2e8f0">${companyName}</strong></p>
          <p style="color:#94a3b8;margin-bottom:24px;">Use the OTP below to verify your work email. Valid for <strong style="color:#e2e8f0">${OTP_EXPIRY_MINUTES} minutes</strong>.</p>
          <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
            <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#a5b4fc;">${otp}</span>
          </div>
          <p style="font-size:12px;color:#64748b;text-align:center;">Do not share this OTP with anyone. If you didn't request this, ignore this email.</p>
        </div>
      </div>
    `,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      companyName,
      memberName,
      email,
      password,
      phone,
      orgType,
      memberRole,
    } = body as {
      companyName: string;
      memberName: string;
      email: string;
      password: string;
      phone?: string;
      orgType: string;
      memberRole: string;
    };

    // Validation
    if (!companyName?.trim() || !memberName?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: "Company name, your name, email, and password are required." }, { status: 400 });
    }

    if (!orgType?.trim()) {
      return NextResponse.json({ error: "Organization type is required." }, { status: 400 });
    }

    if (!memberRole?.trim()) {
      return NextResponse.json({ error: "Your role in the organization is required." }, { status: 400 });
    }

    // Validate work email
    const emailCheck = isWorkEmail(email);
    if (!emailCheck.valid) {
      return NextResponse.json(
        { error: emailCheck.error || "Only official work email addresses are allowed." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase();
    const domain = extractDomain(email);

    // Check if email already registered as a company member
    const existingMember = await prisma.companyMember.findUnique({ where: { email: lowerEmail } });
    if (existingMember) {
      return NextResponse.json({ error: "This email is already registered. Please login instead." }, { status: 409 });
    }

    // Check if company with this domain already exists
    const existingCompany = await prisma.company.findUnique({ where: { domain } });
    if (existingCompany) {
      return NextResponse.json(
        { error: `A company with domain "${domain}" is already registered. Please contact your company admin to get an invite, or login if you already have an account.` },
        { status: 409 }
      );
    }

    // Hash password and generate OTP
    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    const companySlug = await generateUniqueCompanySlug(companyName);

    // Delete any previous unverified OTP records for this email
    await prisma.companyOtp.deleteMany({
      where: { email: lowerEmail, verified: false },
    });

    await prisma.companyOtp.create({
      data: {
        email: lowerEmail,
        otp,
        type: "company_signup",
        expiresAt,
        pendingName: memberName.trim(),
        pendingPassword: hashedPassword,
        pendingMeta: {
          companyName: companyName.trim(),
          companySlug,
          domain,
          orgType: orgType.trim(),
          memberRole: memberRole.trim(),
          phone: phone?.trim() || null,
        },
      },
    });

    await sendCompanyOtpEmail(lowerEmail, otp, companyName);

    return NextResponse.json({
      success: true,
      message: "OTP sent to your work email.",
      domain,
    });
  } catch (error) {
    console.error("[company/send-otp]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
