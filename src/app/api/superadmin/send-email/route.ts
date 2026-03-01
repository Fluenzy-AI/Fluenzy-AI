import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";

const MAX_RECIPIENTS = 200;

// ─── SMTP transporter using env credentials ──────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // TLS
    auth: {
      user: process.env.SUPERADMIN_EMAIL_MANAGEMENT,
      pass: process.env.SUPERADMIN_PASSWORD_MANAGEMENT,
    },
  });
}

// ─── Input sanitisation – prevent header injection ────────────────────────────
function sanitise(value: string): string {
  return value.replace(/[\r\n]/g, " ").trim();
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth guard ────────────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role as string) !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const {
      type,
      emails: rawEmails,
      subject: rawSubject,
      message: rawMessage,
    } = body as {
      type: "single" | "multiple" | "all";
      emails?: string[];
      subject: string;
      message: string;
    };

    // ── Validate required fields ───────────────────────────────────────────────
    if (!type || !["single", "multiple", "all"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    if (!rawSubject?.trim()) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 });
    }
    if (!rawMessage?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const subject = sanitise(rawSubject);
    const message = rawMessage.trim();

    // ── Resolve recipients ────────────────────────────────────────────────────
    let recipientEmails: string[] = [];

    if (type === "all") {
      const users = await prisma.users.findMany({
        where: { disabled: false },
        select: { email: true },
      });
      recipientEmails = users.map((u) => u.email);
    } else if (type === "multiple") {
      if (!rawEmails || rawEmails.length === 0) {
        return NextResponse.json({ error: "No recipients provided" }, { status: 400 });
      }
      recipientEmails = rawEmails.map((e) => sanitise(e));
    } else {
      // single
      if (!rawEmails || rawEmails.length !== 1) {
        return NextResponse.json(
          { error: "Exactly one recipient required for single send" },
          { status: 400 }
        );
      }
      recipientEmails = [sanitise(rawEmails[0])];
    }

    // ── Rate-limit: cap at MAX_RECIPIENTS ─────────────────────────────────────
    if (recipientEmails.length > MAX_RECIPIENTS) {
      return NextResponse.json(
        { error: `Too many recipients. Max allowed: ${MAX_RECIPIENTS}` },
        { status: 400 }
      );
    }

    if (recipientEmails.length === 0) {
      return NextResponse.json({ error: "No valid recipients found" }, { status: 400 });
    }

    // ── Send email via SMTP ───────────────────────────────────────────────────
    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"Fluenzy AI Admin" <${process.env.SUPERADMIN_EMAIL_MANAGEMENT}>`,
      to: recipientEmails.join(", "),
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Fluenzy AI</h1>
          </div>
          <div style="background: #ffffff; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
            <div style="white-space: pre-wrap; color: #374151; font-size: 15px; line-height: 1.6;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
          </div>
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
            This email was sent by Fluenzy AI Super Admin.
          </p>
        </div>
      `,
    });

    // ── Persist email log ─────────────────────────────────────────────────────
    await prisma.emailLog.create({
      data: {
        subject,
        message,
        recipients: recipientEmails,
        recipientType: type,
        sentBy: session.user.email as string,
        status: "sent",
      },
    });

    return NextResponse.json({
      success: true,
      recipientCount: recipientEmails.length,
      message: `Email sent successfully to ${recipientEmails.length} recipient(s).`,
    });
  } catch (error: any) {
    console.error("[send-email] Error:", error);

    // Try to save failed log
    try {
      const session = await getServerSession(authOptions);
      if (session) {
        await prisma.emailLog.create({
          data: {
            subject: "Failed send",
            message: "",
            recipients: [],
            recipientType: "unknown",
            sentBy: session.user.email as string,
            status: "failed",
            errorMsg: String(error?.message ?? error),
          },
        });
      }
    } catch (_) {}

    return NextResponse.json(
      { error: "Failed to send email. Please check SMTP credentials." },
      { status: 500 }
    );
  }
}
