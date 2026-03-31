/**
 * Professional Email Templates for Fluenzy AI
 * 
 * FANG-level, industry-standard email templates with consistent branding.
 * Uses hosted logo from CDN for reliable rendering across all email clients.
 * 
 * Template Types:
 * - HR Documents: Internship Certificate, Experience Letter, Offer Letter, 
 *                 Relieving Letter, Appreciation Certificate, Training Completion
 * - System Emails: Invoice/Billing, OTP/Password Reset
 * 
 * @module email-templates
 */

// ── Logo URL (hosted on CDN for email compatibility) ─────────────────────────
const LOGO_URL = "https://cdn.fluenzyai.app/email/fluenzy-logo.png";

// ── Brand Colors ─────────────────────────────────────────────────────────────
const BRAND = {
  primary: "#6c47ff",
  primaryDark: "#4f35b8", 
  gradient: "linear-gradient(135deg, #6c47ff, #4f35b8)",
  bgDark: "#0c0c0f",
  bgCard: "#111118",
  textPrimary: "#e2e2e8",
  textSecondary: "#94a3b8",
  textMuted: "#555555",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  border: "#1c1c24",
  accent: "#a78bfa",
};

// ── Base Email Wrapper ───────────────────────────────────────────────────────
function emailWrapper(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Fluenzy AI</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 24px !important; }
      .otp-box { width: 40px !important; height: 48px !important; font-size: 22px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif;">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
    <tr>
      <td style="padding: 0;">
        ${content}
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Light Theme Email Wrapper (for professional documents) ──────────────────
function emailWrapperLight(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Fluenzy AI</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 24px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif;">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
    <tr>
      <td style="padding: 0;">
        ${content}
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Email Header with Logo ───────────────────────────────────────────────────
function emailHeader(subtitle?: string, accentColor?: string): string {
  const gradientColor = accentColor || BRAND.primary;
  return `
    <tr>
      <td style="background: linear-gradient(135deg, ${gradientColor}, ${BRAND.primaryDark}); padding: 32px 40px; text-align: center; ">
        <img src="${LOGO_URL}" alt="Fluenzy AI" width="56" height="56" style="display: block; margin: 0 auto 12px; border-radius: 4px;" onerror="this.style.display='none';">
        <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Fluenzy AI</h1>
        ${subtitle ? `<p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9); font-weight: 500;">${subtitle}</p>` : ""}
      </td>
    </tr>`;
}

// ── Email Footer ─────────────────────────────────────────────────────────────
function emailFooter(contactEmail?: string): string {
  const year = new Date().getFullYear();
  const supportEmail = contactEmail || "support@fluenzyai.app";
  return `
    <tr>
      <td style="padding: 24px 40px; text-align: center; border-top: 1px solid ${BRAND.border};">
        <p style="margin: 0 0 8px; font-size: 12px; color: ${BRAND.textMuted};">
          Need help? Contact us at <a href="mailto:${supportEmail}" style="color: ${BRAND.primary}; text-decoration: none;">${supportEmail}</a>
        </p>
        <p style="margin: 0 0 12px; font-size: 12px; color: ${BRAND.textMuted};">
          <a href="https://www.fluenzyai.app/privacy-policy" style="color: ${BRAND.textMuted}; text-decoration: none;">Privacy Policy</a> · 
          <a href="https://www.fluenzyai.app/terms-and-conditions" style="color: ${BRAND.textMuted}; text-decoration: none;">Terms of Service</a>
        </p>
        <p style="margin: 0; font-size: 11px; color: ${BRAND.textMuted};">
          © ${year} Fluenzy AI · <a href="https://www.fluenzyai.app" style="color: ${BRAND.textMuted}; text-decoration: none;">fluenzyai.app</a>
        </p>
      </td>
    </tr>`;
}

// ── Light Footer (for professional documents) ────────────────────────────────
function emailFooterLight(contactEmail?: string): string {
  const year = new Date().getFullYear();
  const supportEmail = contactEmail || "support@fluenzyai.app";
  return `
    <tr>
      <td style="padding: 20px 40px; background: #f1f5f9; text-align: center; border-top: 1px solid #e2e8f0; ">
        <p style="margin: 0 0 8px; font-size: 12px; color: #64748b;">
          Questions? Contact <a href="mailto:${supportEmail}" style="color: ${BRAND.primary}; text-decoration: none;">${supportEmail}</a>
        </p>
        <p style="margin: 0; font-size: 11px; color: #94a3b8;">
          © ${year} Fluenzy AI · <a href="https://www.fluenzyai.app" style="color: #94a3b8; text-decoration: none;">fluenzyai.app</a>
        </p>
      </td>
    </tr>`;
}

// ── OTP Email Template ───────────────────────────────────────────────────────
export function buildOtpEmailTemplate(params: {
  name: string;
  otp: string;
  expiryMinutes: number;
  type: "signup" | "password_reset" | "login";
}): string {
  const { name, otp, expiryMinutes, type } = params;
  
  const titles = {
    signup: "Verify Your Account",
    password_reset: "Reset Your Password",
    login: "Verify Your Login",
  };
  
  const messages = {
    signup: "You're one step away from creating your Fluenzy AI account. Use the verification code below to complete your signup.",
    password_reset: "We received a request to reset the password on your Fluenzy AI account. Use the verification code below to proceed. This code is valid for 5 minutes only.",
    login: "For security, please verify your login attempt with the code below.",
  };

  const digitBoxes = otp.split("").map(d => 
    `<td style="width: 48px; height: 56px; text-align: center; font-size: 28px; font-weight: 700; background: #f8fafc; border: 2px solid ${BRAND.primary}; color: ${BRAND.primary}; letter-spacing: 4px;">${d}</td>`
  ).join('<td style="width: 8px;"></td>');

  const content = `
    <table class="container" role="presentation" width="100%" style="background: #ffffff; overflow: hidden;">
      <!-- Header -->
      <tr>
        <td style="background: linear-gradient(135deg, #ec4899, ${BRAND.primaryDark}); padding: 32px 40px; text-align: center;">
          <img src="${LOGO_URL}" alt="Fluenzy AI" width="56" height="56" style="display: block; margin: 0 auto 12px;" onerror="this.style.display='none';">
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Fluenzy AI</h1>
          <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">${titles[type]}</p>
        </td>
      </tr>
      <tr>
        <td class="content" style="padding: 40px;">
          <p style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #1e293b;">Hey ${name} 👋</p>
          <p style="margin: 0 0 28px; font-size: 15px; color: #475569; line-height: 1.7;">
            ${messages[type]}
          </p>
          
          <!-- OTP Code -->
          <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin: 0 auto 28px;">
            <tr>${digitBoxes}</tr>
          </table>
          
          <!-- Expiry Notice -->
          <div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 16px 20px; margin-bottom: 28px; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #0369a1;">
              ⏱️ This code expires in <strong style="color: ${BRAND.primary};">${expiryMinutes} minutes</strong>
            </p>
          </div>
          
          <!-- Security Notice -->
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 16px 20px;">
            <p style="margin: 0; font-size: 13px; color: #991b1b; line-height: 1.6;">
              🔒 <strong>Security Notice:</strong> Fluenzy AI will NEVER ask for your verification code via email, phone, Telegram, WhatsApp, or chat. Anyone asking for this code is attempting fraud.
            </p>
          </div>
          
          <!-- Ignore Notice -->
          <p style="margin: 24px 0 0; font-size: 13px; color: #64748b; line-height: 1.6;">
            If you didn't request ${type === "password_reset" ? "a password reset" : "this code"}, please ignore this email — your account is safe and no changes have been made.
          </p>
        </td>
      </tr>
      ${emailFooterLight("otp@fluenzyai.app")}
    </table>`;

  return emailWrapperLight(content, `Your Fluenzy AI verification code is ${otp}. Expires in ${expiryMinutes} minutes.`);
}

// ── Invoice Email Template ───────────────────────────────────────────────────
export function buildInvoiceEmailTemplate(params: {
  userName: string | null | undefined;
  invoiceNumber: string;
  plan: string | null | undefined;
  status: string;
  amount?: string;
  discount?: string;
  date?: string;
  billingPeriod?: string;
}): string {
  const { userName, invoiceNumber, plan, status, amount, discount, date, billingPeriod } = params;
  
  const statusStyles: Record<string, { bg: string; color: string; label: string; icon: string }> = {
    paid: { bg: "#dcfce7", color: "#166534", label: "Payment Successful", icon: "✅" },
    free_via_coupon: { bg: "#dbeafe", color: "#1e40af", label: "Activated via Coupon", icon: "🎁" },
    failed: { bg: "#fee2e2", color: "#991b1b", label: "Payment Failed", icon: "❌" },
    refunded: { bg: "#fef3c7", color: "#92400e", label: "Refunded", icon: "↩️" },
  };
  
  const statusStyle = statusStyles[status] || statusStyles.paid;

  const content = `
    <table class="container" role="presentation" width="100%" style=" background: #ffffff;  overflow: hidden; ">
      <!-- Header -->
      <tr>
        <td style="background: linear-gradient(135deg, #a855f7, ${BRAND.primaryDark}); padding: 32px 40px; text-align: center;">
          <img src="${LOGO_URL}" alt="Fluenzy AI" width="48" height="48" style="display: block; margin: 0 auto 12px; border-radius: 10px;" onerror="this.style.display='none';">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">Fluenzy AI</h1>
          <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">Payment Receipt</p>
        </td>
      </tr>
      
      <!-- Body -->
      <tr>
        <td style="padding: 40px;">
          <p style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #1e293b;">Hi ${userName || "there"},</p>
          <p style="margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.7;">
            Thank you for your payment — it went through successfully! Your invoice for the <strong style="color: ${BRAND.primary};">${plan || "Standard"}</strong> plan has been generated and is attached to this email as a PDF for your records. Please keep a copy for any billing or tax purposes.
          </p>
          
          <!-- Status Badge -->
          <div style="background: ${statusStyle.bg}; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
            <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${statusStyle.color};">
              ${statusStyle.icon} ${statusStyle.label}
            </p>
          </div>
          
          <!-- Invoice Details -->
          <table role="presentation" width="100%" style="background: #f8fafc; border-radius: 4px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
            <tr>
              <td style="padding: 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="font-size: 13px; color: #64748b;">Invoice Number</span>
                    </td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                      <strong style="font-size: 14px; color: #1e293b;">#${invoiceNumber}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="font-size: 13px; color: #64748b;">Plan</span>
                    </td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                      <strong style="font-size: 14px; color: #1e293b;">${plan || "Standard"}</strong>
                    </td>
                  </tr>
                  ${amount ? `
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="font-size: 13px; color: #64748b;">Amount Charged</span>
                    </td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                      <strong style="font-size: 14px; color: ${BRAND.success};">${amount}</strong>
                    </td>
                  </tr>` : ""}
                  ${discount ? `
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="font-size: 13px; color: #64748b;">Discount Applied</span>
                    </td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                      <strong style="font-size: 14px; color: #10b981;">${discount}</strong>
                    </td>
                  </tr>` : ""}
                  ${billingPeriod ? `
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="font-size: 13px; color: #64748b;">Billing Period</span>
                    </td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                      <strong style="font-size: 14px; color: #1e293b;">${billingPeriod}</strong>
                    </td>
                  </tr>` : ""}
                  ${date ? `
                  <tr>
                    <td style="padding: 10px 0;">
                      <span style="font-size: 13px; color: #64748b;">Payment Date</span>
                    </td>
                    <td style="padding: 10px 0; text-align: right;">
                      <strong style="font-size: 14px; color: #1e293b;">${date}</strong>
                    </td>
                  </tr>` : ""}
                </table>
              </td>
            </tr>
          </table>
          
          <!-- CTA Button -->
          <table role="presentation" width="100%" style="margin-bottom: 24px;">
            <tr>
              <td align="center">
                <a href="https://www.fluenzyai.app/train" style="display: inline-block; background: linear-gradient(135deg, #a855f7, ${BRAND.primaryDark}); color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                  Go to Dashboard →
                </a>
              </td>
            </tr>
          </table>
          
          <p style="margin: 0; font-size: 13px; color: #64748b; text-align: center; line-height: 1.6;">
            If you have any questions about this charge, need a revised invoice, or would like to update your billing details, contact <a href="mailto:billing@fluenzyai.app" style="color: ${BRAND.primary}; text-decoration: none;">billing@fluenzyai.app</a>
          </p>
        </td>
      </tr>
      
      ${emailFooterLight("billing@fluenzyai.app")}
    </table>`;

  return emailWrapperLight(content, `Your Fluenzy AI invoice #${invoiceNumber} — Payment Confirmed`);
}

// ── HR Certificate Email Templates ───────────────────────────────────────────

interface HRCertificateEmailParams {
  candidateName: string;
  certificateNumber: string;
  position: string;
  department: string;
  startDate: string;
  endDate: string;
  verificationUrl: string;
  employmentType?: string;
  performanceNote?: string;
  recognitionReason?: string;
}

/**
 * Internship Certificate Email
 */
export function buildInternshipCertificateEmail(params: HRCertificateEmailParams): string {
  const { candidateName, certificateNumber, position, department, startDate, endDate, verificationUrl } = params;
  
  const content = `
    <table class="container" role="presentation" width="100%" style=" background: #ffffff;  overflow: hidden; ">
      <!-- Header -->
      <tr>
        <td style="background: linear-gradient(135deg, #6c47ff, ${BRAND.primaryDark}); padding: 32px 40px; text-align: center;">
          <img src="${LOGO_URL}" alt="Fluenzy AI" width="56" height="56" style="display: block; margin: 0 auto 12px; border-radius: 4px;" onerror="this.style.display='none';">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">Fluenzy AI</h1>
          <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">Internship Certificate</p>
        </td>
      </tr>
      
      <!-- Body -->
      <tr>
        <td style="padding: 40px;">
          <p style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #1e293b;">Hi ${candidateName},</p>
          <p style="margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.7;">
            Congratulations on completing your internship at Fluenzy AI! It's been a pleasure having you on the team, and we're proud to formally recognize the work you've put in during your time with us.
          </p>
          <p style="margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.7;">
            Your official <strong style="color: ${BRAND.primary};">Internship Certificate</strong> is attached to this email as a PDF. It includes your role, department, duration, and a unique certificate number that can be independently verified anytime.
          </p>
          
          <!-- Details Card -->
          <table role="presentation" width="100%" style="background: #f8fafc; border-radius: 4px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
            <tr>
              <td style="padding: 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;"><span style="font-size: 13px; color: #64748b;">Certificate Number</span></td><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;"><strong style="font-size: 14px; color: ${BRAND.primary};">${certificateNumber}</strong></td></tr>
                  <tr><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;"><span style="font-size: 13px; color: #64748b;">Position</span></td><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;"><strong style="font-size: 14px; color: #1e293b;">${position}</strong></td></tr>
                  <tr><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;"><span style="font-size: 13px; color: #64748b;">Department</span></td><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;"><strong style="font-size: 14px; color: #1e293b;">${department}</strong></td></tr>
                  <tr><td style="padding: 10px 0;"><span style="font-size: 13px; color: #64748b;">Duration</span></td><td style="padding: 10px 0; text-align: right;"><strong style="font-size: 14px; color: #1e293b;">${startDate} – ${endDate}</strong></td></tr>
                </table>
              </td>
            </tr>
          </table>
          
          <p style="margin: 0 0 24px; font-size: 14px; color: #475569; line-height: 1.6;">
            You can verify the authenticity of your certificate at any time by visiting the link below.
          </p>
          
          <!-- CTA Button -->
          <table role="presentation" width="100%" style="margin-bottom: 24px;">
            <tr>
              <td align="center">
                <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #6c47ff, ${BRAND.primaryDark}); color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                  Verify Certificate →
                </a>
              </td>
            </tr>
          </table>
          
          <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">
            Wishing you great success in everything ahead.
          </p>
          <p style="margin: 16px 0 0; font-size: 14px; color: #1e293b;">
            <strong>Warm regards,</strong><br/>
            The Fluenzy AI Team<br/>
            <a href="mailto:certificates@fluenzyai.app" style="color: ${BRAND.primary}; text-decoration: none;">certificates@fluenzyai.app</a>
          </p>
        </td>
      </tr>
      
      ${emailFooterLight("certificates@fluenzyai.app")}
    </table>`;

  return emailWrapperLight(content, "Your official certificate is ready to download and verify.");
}

/**
 * Experience Letter Email
 */
export function buildExperienceLetterEmail(params: HRCertificateEmailParams): string {
  const { candidateName, certificateNumber, position, department, startDate, endDate, verificationUrl, employmentType } = params;
  
  const content = `
    <table class="container" role="presentation" width="100%" style=" background: #ffffff;  overflow: hidden; ">
      <!-- Header -->
      <tr>
        <td style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px 40px; text-align: center;">
          <img src="${LOGO_URL}" alt="Fluenzy AI" width="56" height="56" style="display: block; margin: 0 auto 12px; border-radius: 4px;" onerror="this.style.display='none';">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">Fluenzy AI</h1>
          <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">Experience Letter</p>
        </td>
      </tr>
      
      <!-- Body -->
      <tr>
        <td style="padding: 40px;">
          <p style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #1e293b;">Hi ${candidateName},</p>
          <p style="margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.7;">
            Thank you for your time and contributions at Fluenzy AI. As requested, we have prepared your official Experience Letter confirming your tenure with us.
          </p>
          <p style="margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.7;">
            This document serves as a formal record of your employment and can be shared with future employers, academic institutions, or any authority that requires proof of experience.
          </p>
          
          <!-- Details Card -->
          <table role="presentation" width="100%" style="background: linear-gradient(135deg, #ecfdf5, #d1fae5); border-radius: 4px; border: 1px solid #a7f3d0; margin-bottom: 24px;">
            <tr>
              <td style="padding: 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding: 10px 0; border-bottom: 1px solid #a7f3d0;"><span style="font-size: 13px; color: #047857;">Full Name</span></td><td style="padding: 10px 0; border-bottom: 1px solid #a7f3d0; text-align: right;"><strong style="font-size: 14px; color: #065f46;">${candidateName}</strong></td></tr>
                  <tr><td style="padding: 10px 0; border-bottom: 1px solid #a7f3d0;"><span style="font-size: 13px; color: #047857;">Designation</span></td><td style="padding: 10px 0; border-bottom: 1px solid #a7f3d0; text-align: right;"><strong style="font-size: 14px; color: #065f46;">${position}</strong></td></tr>
                  <tr><td style="padding: 10px 0; border-bottom: 1px solid #a7f3d0;"><span style="font-size: 13px; color: #047857;">Department</span></td><td style="padding: 10px 0; border-bottom: 1px solid #a7f3d0; text-align: right;"><strong style="font-size: 14px; color: #065f46;">${department}</strong></td></tr>
                  ${employmentType ? `<tr><td style="padding: 10px 0; border-bottom: 1px solid #a7f3d0;"><span style="font-size: 13px; color: #047857;">Employment Type</span></td><td style="padding: 10px 0; border-bottom: 1px solid #a7f3d0; text-align: right;"><strong style="font-size: 14px; color: #065f46;">${employmentType}</strong></td></tr>` : ""}
                  <tr><td style="padding: 10px 0;"><span style="font-size: 13px; color: #047857;">Period of Employment</span></td><td style="padding: 10px 0; text-align: right;"><strong style="font-size: 14px; color: #065f46;">${startDate} – ${endDate}</strong></td></tr>
                </table>
              </td>
            </tr>
          </table>
          
          <p style="margin: 0 0 24px; font-size: 14px; color: #475569; line-height: 1.6;">
            Your letter is attached as a PDF. If you need any corrections or an additional copy, please reach out to us.
          </p>
          
          <!-- CTA Button -->
          <table role="presentation" width="100%" style="margin-bottom: 24px;">
            <tr>
              <td align="center">
                <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                  Verify Document →
                </a>
              </td>
            </tr>
          </table>
          
          <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">
            We wish you all the best in your next chapter.
          </p>
          <p style="margin: 16px 0 0; font-size: 14px; color: #1e293b;">
            <strong>Best regards,</strong><br/>
            HR Team · Fluenzy AI<br/>
            <a href="mailto:hr@fluenzyai.app" style="color: #10b981; text-decoration: none;">hr@fluenzyai.app</a>
          </p>
        </td>
      </tr>
      
      ${emailFooterLight("hr@fluenzyai.app")}
    </table>`;

  return emailWrapperLight(content, "Your official experience letter is attached. Best of luck ahead!");
}

/**
 * Relieving Letter Email
 */
export function buildRelievingLetterEmail(params: HRCertificateEmailParams): string {
  const { candidateName, position, department, startDate, endDate } = params;
  
  const content = `
    <table class="container" role="presentation" width="100%" style=" background: #ffffff;  overflow: hidden; ">
      <!-- Header -->
      <tr>
        <td style="background: linear-gradient(135deg, #6b7280, #4b5563); padding: 32px 40px; text-align: center;">
          <img src="${LOGO_URL}" alt="Fluenzy AI" width="56" height="56" style="display: block; margin: 0 auto 12px; border-radius: 4px;" onerror="this.style.display='none';">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">Fluenzy AI</h1>
          <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">Relieving Letter</p>
        </td>
      </tr>
      
      <!-- Body -->
      <tr>
        <td style="padding: 40px;">
          <p style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #1e293b;">Hi ${candidateName},</p>
          <p style="margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.7;">
            We want to take a moment to thank you for everything you contributed during your time at Fluenzy AI.
          </p>
          <p style="margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.7;">
            This letter formally confirms that you have been relieved from your position as <strong>${position}</strong> in the <strong>${department}</strong> department, effective <strong>${endDate}</strong>. All handover procedures have been completed, and there are no pending obligations from either party.
          </p>
          
          <!-- Details Card -->
          <table role="presentation" width="100%" style="background: #f8fafc; border-radius: 4px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
            <tr>
              <td style="padding: 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;"><span style="font-size: 13px; color: #64748b;">Full Name</span></td><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;"><strong style="font-size: 14px; color: #1e293b;">${candidateName}</strong></td></tr>
                  <tr><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;"><span style="font-size: 13px; color: #64748b;">Last Designation</span></td><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;"><strong style="font-size: 14px; color: #1e293b;">${position}</strong></td></tr>
                  <tr><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;"><span style="font-size: 13px; color: #64748b;">Department</span></td><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;"><strong style="font-size: 14px; color: #1e293b;">${department}</strong></td></tr>
                  <tr><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;"><span style="font-size: 13px; color: #64748b;">Date of Joining</span></td><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;"><strong style="font-size: 14px; color: #1e293b;">${startDate}</strong></td></tr>
                  <tr><td style="padding: 10px 0;"><span style="font-size: 13px; color: #64748b;">Last Working Day</span></td><td style="padding: 10px 0; text-align: right;"><strong style="font-size: 14px; color: #1e293b;">${endDate}</strong></td></tr>
                </table>
              </td>
            </tr>
          </table>
          
          <p style="margin: 0 0 24px; font-size: 14px; color: #475569; line-height: 1.6;">
            Your relieving letter is attached to this email as a PDF and can be used for your records or shared with future employers. We wish you every success in your next journey. Should you need a reference or any future HR support, please don't hesitate to reach out.
          </p>
          
          <!-- CTA Button -->
          <table role="presentation" width="100%" style="margin-bottom: 24px;">
            <tr>
              <td align="center">
                <a href="mailto:hr@fluenzyai.app" style="display: inline-block; background: linear-gradient(135deg, #6b7280, #4b5563); color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                  Contact HR →
                </a>
              </td>
            </tr>
          </table>
          
          <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">
            It was a pleasure having you with us. All the best!
          </p>
          <p style="margin: 16px 0 0; font-size: 14px; color: #1e293b;">
            <strong>Regards,</strong><br/>
            HR Team · Fluenzy AI<br/>
            <a href="mailto:hr@fluenzyai.app" style="color: #6b7280; text-decoration: none;">hr@fluenzyai.app</a>
          </p>
        </td>
      </tr>
      
      ${emailFooterLight("hr@fluenzyai.app")}
    </table>`;

  return emailWrapperLight(content, "Your official relieving letter is ready. Thank you for everything.");
}

/**
 * Appreciation Certificate Email
 */
export function buildAppreciationCertificateEmail(params: HRCertificateEmailParams): string {
  const { candidateName, certificateNumber, position, department, startDate, endDate, verificationUrl, recognitionReason, performanceNote } = params;
  
  const content = `
    <table class="container" role="presentation" width="100%" style=" background: #ffffff;  overflow: hidden; ">
      <!-- Header -->
      <tr>
        <td style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 32px 40px; text-align: center;">
          <img src="${LOGO_URL}" alt="Fluenzy AI" width="56" height="56" style="display: block; margin: 0 auto 12px; border-radius: 4px;" onerror="this.style.display='none';">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">Fluenzy AI</h1>
          <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">Certificate of Appreciation 🏅</p>
        </td>
      </tr>
      
      <!-- Body -->
      <tr>
        <td style="padding: 40px;">
          <p style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #1e293b;">Hi ${candidateName},</p>
          <p style="margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.7;">
            We see you — and we want to make sure you know it. This certificate is a small token of our sincere appreciation for the extraordinary effort, dedication, and impact you brought to Fluenzy AI during ${startDate} – ${endDate}.
          </p>
          <p style="margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.7;">
            Great work isn't just about hitting targets — it's about the attitude, the consistency, and the care you bring every single day. You've demonstrated all of that, and more.
          </p>
          
          <!-- Details Card -->
          <table role="presentation" width="100%" style="background: linear-gradient(135deg, #fffbeb, #fef3c7); border-radius: 4px; border: 1px solid #fcd34d; margin-bottom: 24px;">
            <tr>
              <td style="padding: 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${recognitionReason ? `<tr><td style="padding: 10px 0; border-bottom: 1px solid #fcd34d;"><span style="font-size: 13px; color: #92400e;">Recognized For</span></td><td style="padding: 10px 0; border-bottom: 1px solid #fcd34d; text-align: right;"><strong style="font-size: 14px; color: #78350f;">${recognitionReason}</strong></td></tr>` : ""}
                  <tr><td style="padding: 10px 0; border-bottom: 1px solid #fcd34d;"><span style="font-size: 13px; color: #92400e;">Role</span></td><td style="padding: 10px 0; border-bottom: 1px solid #fcd34d; text-align: right;"><strong style="font-size: 14px; color: #78350f;">${position}, ${department}</strong></td></tr>
                  <tr><td style="padding: 10px 0; border-bottom: 1px solid #fcd34d;"><span style="font-size: 13px; color: #92400e;">Period</span></td><td style="padding: 10px 0; border-bottom: 1px solid #fcd34d; text-align: right;"><strong style="font-size: 14px; color: #78350f;">${startDate} – ${endDate}</strong></td></tr>
                  <tr><td style="padding: 10px 0;"><span style="font-size: 13px; color: #92400e;">Certificate ID</span></td><td style="padding: 10px 0; text-align: right;"><strong style="font-size: 14px; color: #f59e0b;">${certificateNumber}</strong></td></tr>
                </table>
              </td>
            </tr>
          </table>
          
          ${performanceNote ? `
          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px 20px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; font-size: 15px; color: #78350f; font-style: italic; line-height: 1.6;">
              "${performanceNote}"
            </p>
            <p style="margin: 8px 0 0; font-size: 13px; color: #92400e;">
              — Fluenzy AI Leadership Team
            </p>
          </div>
          ` : ""}
          
          <!-- CTA Button -->
          <table role="presentation" width="100%" style="margin-bottom: 24px;">
            <tr>
              <td align="center">
                <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                  Verify Certificate →
                </a>
              </td>
            </tr>
          </table>
          
          <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">
            Keep doing what you do best. We're grateful to have you.
          </p>
          <p style="margin: 16px 0 0; font-size: 14px; color: #1e293b;">
            <strong>With appreciation,</strong><br/>
            The Fluenzy AI Team
          </p>
        </td>
      </tr>
      
      ${emailFooterLight("certificates@fluenzyai.app")}
    </table>`;

  return emailWrapperLight(content, "Your hard work didn't go unnoticed. We're proud to recognize you.");
}

/**
 * Training Completion Certificate Email
 */
export function buildTrainingCompletionEmail(params: HRCertificateEmailParams): string {
  const { candidateName, certificateNumber, position, department, startDate, endDate, verificationUrl, performanceNote } = params;
  
  const content = `
    <table class="container" role="presentation" width="100%" style=" background: #ffffff;  overflow: hidden; ">
      <!-- Header -->
      <tr>
        <td style="background: linear-gradient(135deg, #06b6d4, #0891b2); padding: 32px 40px; text-align: center;">
          <img src="${LOGO_URL}" alt="Fluenzy AI" width="56" height="56" style="display: block; margin: 0 auto 12px; border-radius: 4px;" onerror="this.style.display='none';">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">Fluenzy AI</h1>
          <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">Training Completion 🎓</p>
        </td>
      </tr>
      
      <!-- Body -->
      <tr>
        <td style="padding: 40px;">
          <p style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #1e293b;">Hi ${candidateName},</p>
          <p style="margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.7;">
            You did it — congratulations on completing the <strong style="color: #0891b2;">${position}</strong> program at Fluenzy AI!
          </p>
          <p style="margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.7;">
            This is a significant milestone. The skills and knowledge you've gained through this training are a real asset, and we're confident you'll put them to great use. Your official Training Completion Certificate is attached to this email.
          </p>
          
          <!-- Details Card -->
          <table role="presentation" width="100%" style="background: linear-gradient(135deg, #ecfeff, #cffafe); border-radius: 4px; border: 1px solid #67e8f9; margin-bottom: 24px;">
            <tr>
              <td style="padding: 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding: 10px 0; border-bottom: 1px solid #67e8f9;"><span style="font-size: 13px; color: #0e7490;">Program</span></td><td style="padding: 10px 0; border-bottom: 1px solid #67e8f9; text-align: right;"><strong style="font-size: 14px; color: #164e63;">${position}</strong></td></tr>
                  <tr><td style="padding: 10px 0; border-bottom: 1px solid #67e8f9;"><span style="font-size: 13px; color: #0e7490;">Department / Domain</span></td><td style="padding: 10px 0; border-bottom: 1px solid #67e8f9; text-align: right;"><strong style="font-size: 14px; color: #164e63;">${department}</strong></td></tr>
                  <tr><td style="padding: 10px 0; border-bottom: 1px solid #67e8f9;"><span style="font-size: 13px; color: #0e7490;">Program Duration</span></td><td style="padding: 10px 0; border-bottom: 1px solid #67e8f9; text-align: right;"><strong style="font-size: 14px; color: #164e63;">${startDate} – ${endDate}</strong></td></tr>
                  <tr><td style="padding: 10px 0;"><span style="font-size: 13px; color: #0e7490;">Certificate Number</span></td><td style="padding: 10px 0; text-align: right;"><strong style="font-size: 14px; color: #06b6d4;">${certificateNumber}</strong></td></tr>
                </table>
              </td>
            </tr>
          </table>
          
          ${performanceNote ? `
          <p style="margin: 0 0 8px; font-size: 14px; color: #475569;">Your trainer has noted the following about your performance:</p>
          <div style="background: #ecfeff; border-left: 4px solid #06b6d4; padding: 16px 20px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; font-size: 15px; color: #164e63; font-style: italic; line-height: 1.6;">
              "${performanceNote}"
            </p>
          </div>
          ` : ""}
          
          <!-- CTA Button -->
          <table role="presentation" width="100%" style="margin-bottom: 24px;">
            <tr>
              <td align="center">
                <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #06b6d4, #0891b2); color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                  Verify Certificate →
                </a>
              </td>
            </tr>
          </table>
          
          <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">
            We're proud of your progress. Keep learning, keep growing.
          </p>
          <p style="margin: 16px 0 0; font-size: 14px; color: #1e293b;">
            <strong>Best regards,</strong><br/>
            Training & Development Team · Fluenzy AI<br/>
            <a href="mailto:support@fluenzyai.app" style="color: #06b6d4; text-decoration: none;">support@fluenzyai.app</a>
          </p>
        </td>
      </tr>
      
      ${emailFooterLight("support@fluenzyai.app")}
    </table>`;

  return emailWrapperLight(content, "You've officially completed the program. Here's your certificate!");
}

// ── Offer Letter Email Template ──────────────────────────────────────────────

interface OfferLetterEmailParams {
  candidateName: string;
  position: string;
  department: string;
  salary: number;
  salaryType: "per month" | "per annum";
  joiningDate: string;
  acceptByDate?: string;
  workHours?: string;
  workLocation?: string;
  probationMonths?: number;
  employmentType?: string;
  hrName?: string;
}

export function buildOfferLetterEmail(params: OfferLetterEmailParams): string {
  const { 
    candidateName, position, department, salary, salaryType, 
    joiningDate, acceptByDate, workHours, workLocation, 
    probationMonths, employmentType, hrName 
  } = params;
  
  const salaryLabel = salaryType === "per month" ? "Monthly Stipend / Salary" : "Annual CTC";
  const salaryValue = `₹${salary.toLocaleString("en-IN")} ${salaryType === "per month" ? "/ month" : "/ year"}`;
  
  const content = `
    <table class="container" role="presentation" width="100%" style=" background: #ffffff;  overflow: hidden; ">
      <!-- Header -->
      <tr>
        <td style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 32px 40px; text-align: center;">
          <img src="${LOGO_URL}" alt="Fluenzy AI" width="56" height="56" style="display: block; margin: 0 auto 12px; border-radius: 4px;" onerror="this.style.display='none';">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">Fluenzy AI</h1>
          <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">Offer of Employment 🎉</p>
        </td>
      </tr>
      
      <!-- Body -->
      <tr>
        <td style="padding: 40px;">
          <p style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #1e293b;">Hi ${candidateName},</p>
          <p style="margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.7;">
            We're thrilled to extend a formal offer of employment to you. After a thorough review of your interviews and assessments, the team at Fluenzy AI is excited to welcome you as <strong style="color: #3b82f6;">${position}</strong> in our <strong>${department}</strong> department.
          </p>
          <p style="margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.7;">
            We believe you'll be a great fit, and we look forward to building something meaningful together. Please find your signed Offer Letter attached. Review it carefully, and don't hesitate to reach out if you have any questions before accepting.
          </p>
          
          <!-- Details Card -->
          <table role="presentation" width="100%" style="background: linear-gradient(135deg, #eff6ff, #dbeafe); border-radius: 4px; border: 1px solid #93c5fd; margin-bottom: 24px;">
            <tr>
              <td style="padding: 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding: 10px 0; border-bottom: 1px solid #93c5fd;"><span style="font-size: 13px; color: #1e40af;">Position</span></td><td style="padding: 10px 0; border-bottom: 1px solid #93c5fd; text-align: right;"><strong style="font-size: 14px; color: #1e3a8a;">${position}</strong></td></tr>
                  <tr><td style="padding: 10px 0; border-bottom: 1px solid #93c5fd;"><span style="font-size: 13px; color: #1e40af;">Department</span></td><td style="padding: 10px 0; border-bottom: 1px solid #93c5fd; text-align: right;"><strong style="font-size: 14px; color: #1e3a8a;">${department}</strong></td></tr>
                  <tr><td style="padding: 10px 0; border-bottom: 1px solid #93c5fd;"><span style="font-size: 13px; color: #1e40af;">${salaryLabel}</span></td><td style="padding: 10px 0; border-bottom: 1px solid #93c5fd; text-align: right;"><strong style="font-size: 14px; color: #10b981;">${salaryValue}</strong></td></tr>
                  <tr><td style="padding: 10px 0; border-bottom: 1px solid #93c5fd;"><span style="font-size: 13px; color: #1e40af;">Joining Date</span></td><td style="padding: 10px 0; border-bottom: 1px solid #93c5fd; text-align: right;"><strong style="font-size: 14px; color: #1e3a8a;">${joiningDate}</strong></td></tr>
                  ${workHours ? `<tr><td style="padding: 10px 0; border-bottom: 1px solid #93c5fd;"><span style="font-size: 13px; color: #1e40af;">Work Hours</span></td><td style="padding: 10px 0; border-bottom: 1px solid #93c5fd; text-align: right;"><strong style="font-size: 14px; color: #1e3a8a;">${workHours}</strong></td></tr>` : ""}
                  ${workLocation ? `<tr><td style="padding: 10px 0; border-bottom: 1px solid #93c5fd;"><span style="font-size: 13px; color: #1e40af;">Work Location</span></td><td style="padding: 10px 0; border-bottom: 1px solid #93c5fd; text-align: right;"><strong style="font-size: 14px; color: #1e3a8a;">${workLocation}</strong></td></tr>` : ""}
                  ${probationMonths ? `<tr><td style="padding: 10px 0; border-bottom: 1px solid #93c5fd;"><span style="font-size: 13px; color: #1e40af;">Probation Period</span></td><td style="padding: 10px 0; border-bottom: 1px solid #93c5fd; text-align: right;"><strong style="font-size: 14px; color: #1e3a8a;">${probationMonths} months</strong></td></tr>` : ""}
                  ${employmentType ? `<tr><td style="padding: 10px 0;"><span style="font-size: 13px; color: #1e40af;">Employment Type</span></td><td style="padding: 10px 0; text-align: right;"><strong style="font-size: 14px; color: #1e3a8a;">${employmentType}</strong></td></tr>` : ""}
                </table>
              </td>
            </tr>
          </table>
          
          ${acceptByDate ? `
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.6;">
              ⏰ Please accept this offer by <strong>${acceptByDate}</strong> by signing and returning the attached letter. Failing to respond by this date may result in the offer being rescinded.
            </p>
          </div>
          ` : ""}
          
          <!-- CTA Button -->
          <table role="presentation" width="100%" style="margin-bottom: 24px;">
            <tr>
              <td align="center">
                <a href="mailto:hr@fluenzyai.app" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                  Questions? Contact HR →
                </a>
              </td>
            </tr>
          </table>
          
          <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">
            We're excited to have you join us — welcome to Fluenzy AI!
          </p>
          <p style="margin: 16px 0 0; font-size: 14px; color: #1e293b;">
            <strong>Warm regards,</strong><br/>
            ${hrName || "HR Team"} · Fluenzy AI<br/>
            <a href="mailto:hr@fluenzyai.app" style="color: #3b82f6; text-decoration: none;">hr@fluenzyai.app</a>
          </p>
        </td>
      </tr>
      
      ${emailFooterLight("hr@fluenzyai.app")}
    </table>`;

  return emailWrapperLight(content, "We'd love to have you on the team. Your offer letter is attached.");
}

// ── Generic Certificate Email (maintains backward compatibility) ─────────────
export function buildCertificateEmailTemplate(params: {
  recipientName: string;
  certificateType: string;
  certificateNumber?: string;
  position?: string;
  department?: string;
  courseName?: string;
  issueDate?: string;
  startDate?: string;
  endDate?: string;
  verificationUrl?: string;
  performanceNote?: string;
}): string {
  const { recipientName, certificateType, certificateNumber, position, department, startDate, endDate, verificationUrl, performanceNote } = params;
  
  // Route to specific templates based on type
  const type = certificateType.toLowerCase();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.fluenzyai.app";
  const vUrl = verificationUrl || `${baseUrl}/verify/${certificateNumber || ""}`;
  
  const certParams: HRCertificateEmailParams = {
    candidateName: recipientName,
    certificateNumber: certificateNumber || "",
    position: position || certificateType,
    department: department || "General",
    startDate: startDate || new Date().toLocaleDateString("en-IN"),
    endDate: endDate || new Date().toLocaleDateString("en-IN"),
    verificationUrl: vUrl,
    performanceNote,
  };
  
  if (type.includes("internship")) {
    return buildInternshipCertificateEmail(certParams);
  } else if (type.includes("experience")) {
    return buildExperienceLetterEmail(certParams);
  } else if (type.includes("relieving")) {
    return buildRelievingLetterEmail(certParams);
  } else if (type.includes("appreciation")) {
    return buildAppreciationCertificateEmail(certParams);
  } else if (type.includes("training") || type.includes("completion")) {
    return buildTrainingCompletionEmail(certParams);
  }
  
  // Default generic certificate
  return buildInternshipCertificateEmail(certParams);
}

// ── Welcome Email Template ───────────────────────────────────────────────────
export function buildWelcomeEmailTemplate(params: {
  name: string;
  plan?: string;
}): string {
  const { name, plan } = params;

  const content = `
    <table class="container" role="presentation" width="100%" style=" background: ${BRAND.bgCard};  border: 1px solid ${BRAND.border}; overflow: hidden;">
      ${emailHeader("Welcome to the Family!")}
      <tr>
        <td class="content" style="padding: 40px;">
          <p style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: ${BRAND.textPrimary};">Welcome, ${name}! 🎉</p>
          <p style="margin: 0 0 24px; font-size: 15px; color: ${BRAND.textSecondary}; line-height: 1.7;">
            Your Fluenzy AI account is now active${plan ? ` with the <strong style="color: ${BRAND.primary};">${plan} Plan</strong>` : ""}. Get ready to transform your communication skills with AI-powered coaching!
          </p>
          
          <!-- Features -->
          <table role="presentation" width="100%" style="margin-bottom: 28px;">
            <tr>
              <td style="padding: 16px; background: rgba(108, 71, 255, 0.1); border-radius: 4px; margin-bottom: 12px;">
                <p style="margin: 0; font-size: 14px; color: ${BRAND.textPrimary};">
                  🎯 <strong>AI Mock Interviews</strong><br>
                  <span style="color: ${BRAND.textSecondary}; font-size: 13px;">Practice with realistic AI-driven interviews</span>
                </p>
              </td>
            </tr>
            <tr><td style="height: 12px;"></td></tr>
            <tr>
              <td style="padding: 16px; background: rgba(108, 71, 255, 0.1); border-radius: 4px; margin-bottom: 12px;">
                <p style="margin: 0; font-size: 14px; color: ${BRAND.textPrimary};">
                  📊 <strong>Real-time Feedback</strong><br>
                  <span style="color: ${BRAND.textSecondary}; font-size: 13px;">Get instant insights on your responses</span>
                </p>
              </td>
            </tr>
            <tr><td style="height: 12px;"></td></tr>
            <tr>
              <td style="padding: 16px; background: rgba(108, 71, 255, 0.1); border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: ${BRAND.textPrimary};">
                  🏆 <strong>Track Progress</strong><br>
                  <span style="color: ${BRAND.textSecondary}; font-size: 13px;">Monitor improvement over time</span>
                </p>
              </td>
            </tr>
          </table>
          
          <!-- CTA Button -->
          <table role="presentation" width="100%">
            <tr>
              <td align="center">
                <a href="https://www.fluenzyai.app/train" style="display: inline-block; background: ${BRAND.gradient}; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 16px 40px; border-radius: 10px;">
                  Start Your Journey →
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ${emailFooter()}
    </table>`;

  return emailWrapper(content, `Welcome to Fluenzy AI, ${name}!`);
}

// ── HR/Admin Notification Email Template ─────────────────────────────────────
export function buildNotificationEmailTemplate(params: {
  recipientName?: string;
  subject: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
}): string {
  const { recipientName, subject, message, ctaText, ctaUrl } = params;

  const content = `
    <table class="container" role="presentation" width="100%" style=" background: #ffffff;  overflow: hidden; ">
      <!-- Header -->
      <tr>
        <td style="background: ${BRAND.gradient}; padding: 28px 40px; text-align: center;">
          <img src="${LOGO_URL}" alt="Fluenzy AI" width="44" height="44" style="display: block; margin: 0 auto 10px; border-radius: 10px;" onerror="this.style.display='none';">
          <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff;">Fluenzy AI</h1>
        </td>
      </tr>
      
      <!-- Body -->
      <tr>
        <td style="padding: 36px 40px;">
          ${recipientName ? `<p style="margin: 0 0 8px; font-size: 17px; font-weight: 600; color: #1e293b;">Hi ${recipientName},</p>` : ""}
          <div style="font-size: 15px; color: #475569; line-height: 1.7;">
            ${message}
          </div>
          
          ${ctaText && ctaUrl ? `
          <table role="presentation" width="100%" style="margin-top: 28px;">
            <tr>
              <td align="center">
                <a href="${ctaUrl}" style="display: inline-block; background: ${BRAND.gradient}; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                  ${ctaText}
                </a>
              </td>
            </tr>
          </table>` : ""}
        </td>
      </tr>
      
      ${emailFooterLight()}
    </table>`;

  return emailWrapperLight(content, subject);
}

// ── Export titleCase helper ──────────────────────────────────────────────────
export const titleCase = (value?: string | null) => {
  if (!value) return "N/A";
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
};

// ── Export all template builders ─────────────────────────────────────────────
export {
  LOGO_URL,
  BRAND,
};
