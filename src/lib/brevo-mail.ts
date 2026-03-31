/**
 * Centralized Brevo Email Service (API Version)
 * 
 * Uses Brevo's Transactional Email API instead of SMTP.
 * More reliable on cloud platforms like Render that may block SMTP ports.
 * 
 * @module brevo-mail
 */

import { BrevoClient } from "@getbrevo/brevo";

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

// ── Brevo Client Instance (singleton) ─────────────────────────────────────────────
let _client: BrevoClient | null = null;

function getBrevoClient(): BrevoClient {
  if (_client) {
    return _client;
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("[BREVO] Missing BREVO_API_KEY environment variable");
  }

  _client = new BrevoClient({ apiKey });
  console.log("[BREVO-API] Client initialized ✓");
  return _client;
}

/**
 * Map email context to sender info
 */
function getSenderInfo(context: EmailContext): { name: string; email: string } {
  const senderMap: Record<EmailContext, { name: string; email: string }> = {
    DEFAULT: { name: "Fluenzy AI", email: process.env.DEFAULT_FROM || "noreply@fluenzyai.app" },
    OTP: { name: "Fluenzy AI Security", email: process.env.OTP_FROM || "otp@fluenzyai.app" },
    CERTIFICATE: { name: "Fluenzy AI Certificates", email: process.env.CERT_FROM || "certificates@fluenzyai.app" },
    HR: { name: "Fluenzy AI HR", email: process.env.HR_FROM || "hr@fluenzyai.app" },
    BILLING: { name: "Fluenzy AI Billing", email: process.env.BILLING_FROM || "billing@fluenzyai.app" },
    ASSESSMENT: { name: "Fluenzy AI Assessments", email: process.env.ASSESSMENT_FROM || "assessments@fluenzyai.app" },
    ADMIN: { name: "Fluenzy AI Admin", email: process.env.ADMIN_FROM || "admin@fluenzyai.app" },
  };

  const sender = senderMap[context];
  console.log(`[BREVO-API] Using sender: ${sender.name} <${sender.email}>`);
  return sender;
}

/**
 * Send email using Brevo API
 */
export async function sendBrevoEmail(options: BrevoEmailOptions): Promise<EmailResult> {
  const { context, to, subject, html, text, attachments, cc, bcc } = options;

  try {
    const client = getBrevoClient();
    const sender = getSenderInfo(context);

    // Build recipient list
    const toList = Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }];
    
    console.log(`[BREVO-API] Sending ${context} email...`);
    console.log(`[BREVO-API] To: ${toList.map(r => r.email).join(", ")}`);
    console.log(`[BREVO-API] Subject: ${subject}`);

    // Build email request
    const emailRequest: Parameters<typeof client.transactionalEmails.sendTransacEmail>[0] = {
      sender,
      to: toList,
      subject,
    };

    if (html) emailRequest.htmlContent = html;
    if (text) emailRequest.textContent = text;
    
    // Handle CC
    if (cc) {
      emailRequest.cc = Array.isArray(cc) ? cc.map(email => ({ email })) : [{ email: cc }];
    }
    
    // Handle BCC
    if (bcc) {
      emailRequest.bcc = Array.isArray(bcc) ? bcc.map(email => ({ email })) : [{ email: bcc }];
    }

    // Handle attachments
    if (attachments && attachments.length > 0) {
      emailRequest.attachment = attachments.map(att => {
        const content = att.content 
          ? (Buffer.isBuffer(att.content) 
              ? att.content.toString("base64") 
              : Buffer.from(att.content).toString("base64"))
          : undefined;
        return {
          name: att.filename,
          content,
        };
      });
    }

    // Send email
    const response = await client.transactionalEmails.sendTransacEmail(emailRequest);
    
    console.log(`[BREVO-API] ✅ Email sent successfully`);
    console.log(`[BREVO-API] Message ID: ${response.messageId || "N/A"}`);

    return {
      success: true,
      messageId: response.messageId,
    };
  } catch (error: any) {
    console.error(`[BREVO-API] ❌ Failed to send email`);
    console.error(`[BREVO-API] Error:`, error?.body || error?.message || error);
    
    return {
      success: false,
      error: error?.body?.message || error?.message || "Failed to send email",
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

  console.log(`[BREVO-API-BULK] Sent: ${sent}, Failed: ${failed}`);
  return { sent, failed, errors };
}
