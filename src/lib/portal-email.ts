/**
 * Portal Email Service
 * HR emails use HR_EMAIL_USER / HR_EMAIL_PASS
 * Admin emails use ADMIN_EMAIL_USER / ADMIN_EMAIL_PASS
 * Super Admin emails fall back to EMAIL_USER / EMAIL_PASS
 */

import nodemailer, { Transporter } from "nodemailer";
import { prisma } from "@/lib/prisma";

export type EmailRole = "HR" | "ADMIN" | "SUPER_ADMIN";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{ filename: string; path?: string; content?: string; contentType?: string }>;
  senderRole: EmailRole;
  senderEmail: string;
  staffId?: string;
  templateId?: string;
}

interface BulkEmailOptions extends Omit<SendEmailOptions, "to"> {
  recipients: string[];
}

// ── Transporter factory ─────────────────────────────────────────────────────

function createTransporter(role: EmailRole): Transporter {
  let user: string;
  let pass: string;

  switch (role) {
    case "HR":
      user = process.env.HR_EMAIL_USER!;
      pass = process.env.HR_EMAIL_PASS!;
      break;
    case "ADMIN":
      user = process.env.ADMIN_EMAIL_USER!;
      pass = process.env.ADMIN_EMAIL_PASS!;
      break;
    default:
      user = process.env.SUPERADMIN_EMAIL_MANAGEMENT || process.env.EMAIL_USER!;
      pass = process.env.SUPERADMIN_PASSWORD_MANAGEMENT || process.env.EMAIL_PASS!;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });
}

// ── Core send function ──────────────────────────────────────────────────────

export async function sendPortalEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  const {
    to,
    subject,
    html,
    text,
    attachments,
    senderRole,
    senderEmail,
    staffId,
    templateId,
  } = options;

  const recipients = Array.isArray(to) ? to : [to];

  // Create log entry in PENDING state
  let logId: string | undefined;
  for (const recipientEmail of recipients) {
    const log = await prisma.portalEmailLog.create({
      data: {
        staffId: staffId || null,
        senderEmail,
        senderRole,
        recipientEmail,
        subject,
        body: html,
        templateId: templateId || null,
        attachments: attachments ? JSON.parse(JSON.stringify(attachments)) : null,
        status: "PENDING",
      },
    });
    logId = log.id;
  }

  try {
    const transporter = createTransporter(senderRole);
    const fromEmail =
      senderRole === "HR"
        ? process.env.HR_EMAIL_USER
        : senderRole === "ADMIN"
        ? process.env.ADMIN_EMAIL_USER
        : process.env.EMAIL_USER;

    await transporter.sendMail({
      from: `"Fluenzy AI" <${fromEmail}>`,
      to: recipients.join(", "),
      subject,
      html,
      text,
      attachments,
    });

    // Update all logs to SENT
    await prisma.portalEmailLog.updateMany({
      where: {
        senderEmail,
        subject,
        status: "PENDING",
        createdAt: { gte: new Date(Date.now() - 5000) },
      },
      data: { status: "SENT", sentAt: new Date() },
    });

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";

    // Update logs to FAILED
    await prisma.portalEmailLog.updateMany({
      where: {
        senderEmail,
        subject,
        status: "PENDING",
        createdAt: { gte: new Date(Date.now() - 5000) },
      },
      data: { status: "FAILED", errorMsg },
    });

    // Schedule retry via database flag
    if (logId) {
      await prisma.portalEmailLog.update({
        where: { id: logId },
        data: { status: "RETRYING", retryCount: { increment: 1 } },
      });
    }

    return { success: false, error: errorMsg };
  }
}

// ── Bulk Email ──────────────────────────────────────────────────────────────

export async function sendBulkPortalEmail(
  options: BulkEmailOptions
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const { recipients, ...rest } = options;
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  // Batch in groups of 50
  const batchSize = 50;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const result = await sendPortalEmail({ ...rest, to: batch });
    if (result.success) {
      sent += batch.length;
    } else {
      failed += batch.length;
      if (result.error) errors.push(result.error);
    }
    // Small delay between batches
    if (i + batchSize < recipients.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return { sent, failed, errors };
}

// ── Retry Failed Emails ─────────────────────────────────────────────────────

export async function retryFailedEmails(maxRetries = 3): Promise<void> {
  const failedLogs = await prisma.portalEmailLog.findMany({
    where: {
      status: "RETRYING",
      retryCount: { lt: maxRetries },
    },
    take: 50,
    orderBy: { createdAt: "asc" },
  });

  for (const log of failedLogs) {
    const role = log.senderRole as EmailRole;
    await sendPortalEmail({
      to: log.recipientEmail,
      subject: log.subject,
      html: log.body,
      senderRole: role,
      senderEmail: log.senderEmail,
      staffId: log.staffId || undefined,
    });
  }
}

// ── Email Templates ─────────────────────────────────────────────────────────

export function renderTemplate(template: string, variables: Record<string, string>): string {
  return Object.entries(variables).reduce(
    (acc, [key, val]) => acc.replaceAll(`{{${key}}}`, val),
    template
  );
}

// ── Built-in HR Templates ───────────────────────────────────────────────────

export const HR_EMAIL_TEMPLATES = {
  interviewInvite: (candidateName: string, position: string, date: string, location: string) => ({
    subject: `Interview Invitation - ${position} at Fluenzy AI`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#6366f1;">Fluenzy AI - Interview Invitation</h2>
        <p>Dear ${candidateName},</p>
        <p>We are pleased to invite you for an interview for the <strong>${position}</strong> position.</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;">
          <p><strong>Date & Time:</strong> ${date}</p>
          <p><strong>Location/Link:</strong> ${location}</p>
        </div>
        <p>Please confirm your attendance by replying to this email.</p>
        <p>Best regards,<br/>HR Team, Fluenzy AI</p>
      </div>
    `,
  }),

  offerLetter: (candidateName: string, position: string, salary: string, joiningDate: string) => ({
    subject: `Offer Letter - ${position} at Fluenzy AI`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#6366f1;">Fluenzy AI - Offer Letter</h2>
        <p>Dear ${candidateName},</p>
        <p>We are delighted to offer you the position of <strong>${position}</strong> at Fluenzy AI.</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;">
          <p><strong>Role:</strong> ${position}</p>
          <p><strong>CTC:</strong> ${salary}</p>
          <p><strong>Joining Date:</strong> ${joiningDate}</p>
        </div>
        <p>Kindly sign and return the attached offer letter to confirm acceptance.</p>
        <p>Looking forward to welcoming you to the team!</p>
        <p>Best regards,<br/>HR Team, Fluenzy AI</p>
      </div>
    `,
  }),

  leaveApproval: (employeeName: string, leaveType: string, startDate: string, endDate: string, approved: boolean, reason?: string) => ({
    subject: `Leave Request ${approved ? "Approved" : "Rejected"}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:${approved ? "#22c55e" : "#ef4444"};">Leave Request ${approved ? "Approved ✓" : "Rejected ✗"}</h2>
        <p>Dear ${employeeName},</p>
        <p>Your ${leaveType} leave request for <strong>${startDate}</strong> to <strong>${endDate}</strong> has been <strong>${approved ? "approved" : "rejected"}</strong>.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
        <p>For any queries, please contact HR.</p>
        <p>Best regards,<br/>HR Team, Fluenzy AI</p>
      </div>
    `,
  }),
};

// ── Admin Email Templates ───────────────────────────────────────────────────

export const ADMIN_EMAIL_TEMPLATES = {
  announcement: (title: string, message: string) => ({
    subject: `[Fluenzy AI Announcement] ${title}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#6366f1;">📢 ${title}</h2>
        <div style="background:#f3f4f6;padding:16px;border-radius:8px;">
          ${message}
        </div>
        <p style="margin-top:16px;color:#6b7280;font-size:12px;">
          This is an official communication from Fluenzy AI Admin Team.
        </p>
      </div>
    `,
  }),

  ticketUpdate: (userName: string, ticketNumber: string, status: string, resolution?: string) => ({
    subject: `Support Ticket #${ticketNumber} - ${status}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#6366f1;">Support Ticket Update</h2>
        <p>Dear ${userName},</p>
        <p>Your ticket <strong>#${ticketNumber}</strong> has been updated to: <strong>${status}</strong></p>
        ${resolution ? `<div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;"><strong>Resolution:</strong><p>${resolution}</p></div>` : ""}
        <p>Best regards,<br/>Fluenzy AI Admin Team</p>
      </div>
    `,
  }),

  passwordReset: (name: string, resetLink: string) => ({
    subject: "Portal Password Reset - Fluenzy AI",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#6366f1;">Password Reset Request</h2>
        <p>Dear ${name},</p>
        <p>A password reset was requested for your Fluenzy AI portal account.</p>
        <p style="text-align:center;margin:24px 0;">
          <a href="${resetLink}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Reset Password
          </a>
        </p>
        <p style="color:#ef4444;">This link expires in 1 hour. If you did not request this, please ignore this email.</p>
        <p>Fluenzy AI Security Team</p>
      </div>
    `,
  }),
};
