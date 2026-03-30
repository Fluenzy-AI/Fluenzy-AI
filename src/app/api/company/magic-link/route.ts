/**
 * Company Magic Link Login API
 * POST /api/company/magic-link
 * Body: { email }
 *
 * Sends a magic link to the company member's email for passwordless login.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { isWorkEmail } from "@/lib/company-auth";
import { createEmailTransporter } from "@/lib/email-transporter";

const MagicLinkSchema = z.object({
  email: z.string().email(),
});

const MAGIC_LINK_SECRET = process.env.COMPANY_MAGIC_LINK_SECRET || process.env.NEXTAUTH_SECRET! + "_magic";
const MAGIC_LINK_EXPIRY = "15m"; // 15 minutes
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = MagicLinkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const { email } = parsed.data;
    const lowerEmail = email.toLowerCase();

    // Validate work email
    const emailCheck = isWorkEmail(email);
    if (!emailCheck.valid) {
      return NextResponse.json(
        { error: emailCheck.error || "Please use your work email." },
        { status: 400 }
      );
    }

    // Find company member
    const member = await prisma.companyMember.findUnique({
      where: { email: lowerEmail },
      include: {
        company: {
          select: { id: true, name: true, slug: true, status: true },
        },
      },
    });

    // Don't reveal if email exists or not for security
    // But we still need to check company/member status
    if (!member) {
      // Return success anyway to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, you will receive a magic link shortly.",
      });
    }

    // Check company status
    if (member.company.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Your company account has been suspended. Please contact support." },
        { status: 403 }
      );
    }

    // Check member status
    if (member.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Your account has been suspended. Contact your company admin." },
        { status: 403 }
      );
    }
    if (member.status === "PENDING") {
      return NextResponse.json(
        { error: "Your account is pending approval. Contact your company admin." },
        { status: 403 }
      );
    }

    // Check if account is locked
    if (member.lockedUntil && member.lockedUntil > new Date()) {
      const minutes = Math.ceil((member.lockedUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Account locked. Try again in ${minutes} minutes.` },
        { status: 423 }
      );
    }

    // Generate magic link token
    const magicToken = jwt.sign(
      {
        memberId: member.id,
        email: member.email,
        companyId: member.company.id,
        type: "magic_link",
      },
      MAGIC_LINK_SECRET,
      { expiresIn: MAGIC_LINK_EXPIRY }
    );

    // Store token hash in database for verification (optional additional security)
    await prisma.companyMember.update({
      where: { id: member.id },
      data: {
        magicLinkToken: magicToken,
        magicLinkExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });

    // Build magic link URL
    const magicLinkUrl = `${BASE_URL}/company/verify-magic-link?token=${magicToken}`;

    // Send email
    const transporter = createEmailTransporter({
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
      label: "MAGIC-LINK"
    });

    await transporter.sendMail({
      from: `"Fluenzy AI" <${process.env.EMAIL_USER}>`,
      to: lowerEmail,
      subject: "Sign in to Fluenzy AI Company Portal",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <div style="text-align:center;margin-bottom:30px;">
            <div style="display:inline-block;width:50px;height:50px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;line-height:50px;color:white;font-weight:bold;font-size:24px;">F</div>
          </div>
          <h2 style="color:#1e293b;text-align:center;margin-bottom:24px;">Sign in to Company Portal</h2>
          <p style="color:#64748b;font-size:15px;line-height:1.6;">Hello ${member.name},</p>
          <p style="color:#64748b;font-size:15px;line-height:1.6;">
            Click the button below to securely sign in to your ${member.company.name} dashboard on Fluenzy AI.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${magicLinkUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
              Sign In to Dashboard
            </a>
          </div>
          <p style="color:#94a3b8;font-size:13px;line-height:1.6;">
            This link expires in 15 minutes. If you didn't request this email, you can safely ignore it.
          </p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
          <p style="color:#94a3b8;font-size:12px;text-align:center;">
            Fluenzy AI - Empowering Careers with AI
          </p>
        </div>
      `,
      text: `Sign in to Fluenzy AI Company Portal\n\nHello ${member.name},\n\nClick the link below to securely sign in:\n${magicLinkUrl}\n\nThis link expires in 15 minutes.`,
    });

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, you will receive a magic link shortly.",
    });
  } catch (err) {
    console.error("[COMPANY_MAGIC_LINK]", err);
    return NextResponse.json({ error: "Failed to send magic link. Please try again." }, { status: 500 });
  }
}
