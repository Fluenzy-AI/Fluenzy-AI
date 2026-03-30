/**
 * Centralized Brevo Email Service
 * 
 * Single SMTP configuration using Brevo for all email operations.
 * Replaces multiple Gmail-based configurations with domain-based senders.
 * 
 * @module brevo-mail
 */

import nodemailer from "nodemailer";
import type { Transporter, SendMailOptions } from "nodemailer";

/**
 * Email context types - determines which sender address to use
 */
export type EmailContext =
  | "DEFAULT"      // General notifications → noreply@fluenzyai.app
  | "OTP"          // Authentication OTPs → otp@fluenzyai.app
  | "CERTIFICATE"  // HR certificates → certificates@fluenzyai.app
  | "HR"           // HR operations → hr@fluenzyai.app
  | "BILLING"      // Payments & invoices → billing@fluenzyai.app
  | "ASSESSMENT"   // Company assessments → assessments@fluenzyai.app
  | "ADMIN";       // Admin broadcasts → admin@fluenzyai.app

/**
 * Email send options
 */
export interface BrevoEmailOptions {
  context: EmailContext;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
  }>;
  cc?: string | string[];
  bcc?: string | string[];
}

/**
 * Email send result
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Brevo SMTP configuration validator
 */
function validateBrevoConfig(): void {
  const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `[BREVO] Missing required environment variables: ${missing.join(", ")}`
    );
  }

  console.log("[BREVO] Configuration validated ✓");
  console.log(`[BREVO] Host: ${process.env.SMTP_HOST}`);
  console.log(`[BREVO] Port: ${process.env.SMTP_PORT}`);
  console.log(`[BREVO] User: ${process.env.SMTP_USER}`);
}

/**
 * Create single Brevo SMTP transporter (singleton pattern)
 */
let _transporter: Transporter | null = null;

function getBrevoTransporter(): Transporter {
  if (_transporter) {
    return _transporter;
  }

  validateBrevoConfig();

  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT!, 10),
    secure: false, // Use STARTTLS on port 587
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
    // Enable debug logging in production
    logger: process.env.NODE_ENV === "production",
    debug: process.env.NODE_ENV === "production",
  });

  console.log("[BREVO] SMTP transporter created ✓");
  return _transporter;
}

/**
 * Map email context to sender address
 */
function getSenderAddress(context: EmailContext): string {
  const contextMap: Record<EmailContext, string> = {
    DEFAULT: process.env.DEFAULT_FROM || "noreply@fluenzyai.app",
    OTP: process.env.OTP_FROM || "otp@fluenzyai.app",
    CERTIFICATE: process.env.CERT_FROM || "certificates@fluenzyai.app",
    HR: process.env.HR_FROM || "hr@fluenzyai.app",
    BILLING: process.env.BILLING_FROM || "billing@fluenzyai.app",
    ASSESSMENT: process.env.ASSESSMENT_FROM || "assessments@fluenzyai.app",
    ADMIN: process.env.ADMIN_FROM || "admin@fluenzyai.app",
  };

  const sender = contextMap[context];
  console.log(`[BREVO] Using sender for ${context}: ${sender}`);
  return sender;
}

/**
 * Get display name for sender context
 */
function getDisplayName(context: EmailContext): string {
  const displayMap: Record<EmailContext, string> = {
    DEFAULT: "Fluenzy AI",
    OTP: "Fluenzy AI Security",
    CERTIFICATE: "Fluenzy AI Certificates",
    HR: "Fluenzy AI HR",
    BILLING: "Fluenzy AI Billing",
    ASSESSMENT: "Fluenzy AI Assessments",
    ADMIN: "Fluenzy AI Admin",
  };

  return displayMap[context];
}

/**
 * Send email using Brevo SMTP
 * 
 * @param options - Email options with context
 * @returns Promise with send result
 */
export async function sendBrevoEmail(
  options: BrevoEmailOptions
): Promise<EmailResult> {
  const { context, to, subject, html, text, attachments, cc, bcc } = options;

  try {
    const transporter = getBrevoTransporter();
    const senderEmail = getSenderAddress(context);
    const displayName = getDisplayName(context);

    console.log(`[BREVO-${context}] Preparing email...`);
    console.log(`[BREVO-${context}] To: ${Array.isArray(to) ? to.join(", ") : to}`);
    console.log(`[BREVO-${context}] Subject: ${subject}`);

    const mailOptions: SendMailOptions = {
      from: `"${displayName}" <${senderEmail}>`,
      to,
      subject,
      html,
      text,
      attachments,
      cc,
      bcc,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`[BREVO-${context}] ✅ Email sent successfully`);
    console.log(`[BREVO-${context}] Message ID: ${info.messageId}`);
    console.log(`[BREVO-${context}] Response: ${info.response}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error(`[BREVO-${context}] ❌ Failed to send email`);
    console.error(`[BREVO-${context}] Error:`, error?.message || error);
    console.error(`[BREVO-${context}] Code:`, error?.code);
    console.error(`[BREVO-${context}] Command:`, error?.command);

    return {
      success: false,
      error: error?.message || "Failed to send email",
    };
  }
}

/**
 * Helper: Send OTP email
 */
export async function sendOTPEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<EmailResult> {
  return sendBrevoEmail({
    context: "OTP",
    ...params,
  });
}

/**
 * Helper: Send certificate email
 */
export async function sendCertificateEmail(params: {
  to: string;
  subject: string;
  html: string;
  attachments?: BrevoEmailOptions["attachments"];
}): Promise<EmailResult> {
  return sendBrevoEmail({
    context: "CERTIFICATE",
    ...params,
  });
}

/**
 * Helper: Send HR email
 */
export async function sendHREmail(params: {
  to: string;
  subject: string;
  html: string;
  cc?: string | string[];
}): Promise<EmailResult> {
  return sendBrevoEmail({
    context: "HR",
    ...params,
  });
}

/**
 * Helper: Send billing email
 */
export async function sendBillingEmail(params: {
  to: string;
  subject: string;
  html: string;
  attachments?: BrevoEmailOptions["attachments"];
}): Promise<EmailResult> {
  return sendBrevoEmail({
    context: "BILLING",
    ...params,
  });
}

/**
 * Helper: Send assessment email
 */
export async function sendAssessmentEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<EmailResult> {
  return sendBrevoEmail({
    context: "ASSESSMENT",
    ...params,
  });
}

/**
 * Helper: Send admin email (broadcast)
 */
export async function sendAdminEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}): Promise<EmailResult> {
  return sendBrevoEmail({
    context: "ADMIN",
    ...params,
  });
}

/**
 * Helper: Send notification email (default)
 */
export async function sendNotificationEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<EmailResult> {
  return sendBrevoEmail({
    context: "DEFAULT",
    ...params,
  });
}

/**
 * Bulk email send with rate limiting
 */
export async function sendBulkEmails(
  emails: BrevoEmailOptions[],
  options?: { batchSize?: number; delayMs?: number }
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const batchSize = options?.batchSize || 50;
  const delayMs = options?.delayMs || 100;

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map((email) => sendBrevoEmail(email))
    );

    results.forEach((result, idx) => {
      if (result.status === "fulfilled" && result.value.success) {
        sent++;
      } else {
        failed++;
        const error =
          result.status === "rejected"
            ? result.reason
            : result.value.error;
        errors.push(`Email ${i + idx}: ${error}`);
      }
    });

    // Delay between batches
    if (i + batchSize < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  console.log(`[BREVO-BULK] Sent: ${sent}, Failed: ${failed}`);
  return { sent, failed, errors };
}
