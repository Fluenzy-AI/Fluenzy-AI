/**
 * Professional Email Templates for Fluenzy AI
 * 
 * Industry-standard email templates with consistent branding.
 * Uses hosted logo from CDN for reliable rendering across all email clients.
 * 
 * @module email-templates
 */

// ── Logo URL (hosted on CDN for email compatibility) ─────────────────────────
const LOGO_URL = "https://cdn.fluenzyai.app/email/fluenzy-logo.png";
const LOGO_FALLBACK = "https://www.fluenzyai.app/favicon/white-removebg-preview1.png";

// ── Brand Colors ─────────────────────────────────────────────────────────────
const BRAND = {
  primary: "#7c3aed",
  primaryDark: "#4f46e5", 
  gradient: "linear-gradient(135deg, #7c3aed, #4f46e5)",
  bgDark: "#0f0a1e",
  bgCard: "#1a1035",
  textPrimary: "#ffffff",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  border: "rgba(124, 58, 237, 0.3)",
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
      .container { width: 100% !important; padding: 16px !important; }
      .content { padding: 24px !important; }
      .otp-box { width: 40px !important; height: 48px !important; font-size: 22px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.bgDark}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${BRAND.bgDark};">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        ${content}
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Email Header with Logo ───────────────────────────────────────────────────
function emailHeader(subtitle?: string): string {
  return `
    <tr>
      <td style="background: ${BRAND.gradient}; padding: 32px 40px; text-align: center; border-radius: 16px 16px 0 0;">
        <img src="${LOGO_URL}" alt="Fluenzy AI" width="56" height="56" style="display: block; margin: 0 auto 12px; border-radius: 12px;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
        <div style="display: none; width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 12px; align-items: center; justify-content: center; margin: 0 auto 12px; font-size: 28px; font-weight: 800; color: white;">F</div>
        <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Fluenzy AI</h1>
        ${subtitle ? `<p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.8); font-weight: 500;">${subtitle}</p>` : ""}
      </td>
    </tr>`;
}

// ── Email Footer ─────────────────────────────────────────────────────────────
function emailFooter(): string {
  const year = new Date().getFullYear();
  return `
    <tr>
      <td style="padding: 24px 40px; text-align: center; border-top: 1px solid ${BRAND.border};">
        <p style="margin: 0 0 8px; font-size: 12px; color: ${BRAND.textMuted};">
          Need help? Contact us at <a href="mailto:support@fluenzyai.app" style="color: ${BRAND.primary}; text-decoration: none;">support@fluenzyai.app</a>
        </p>
        <p style="margin: 0 0 12px; font-size: 12px; color: ${BRAND.textMuted};">
          <a href="https://www.fluenzyai.app/privacy-policy" style="color: ${BRAND.textMuted}; text-decoration: none;">Privacy Policy</a> · 
          <a href="https://www.fluenzyai.app/terms-and-conditions" style="color: ${BRAND.textMuted}; text-decoration: none;">Terms of Service</a>
        </p>
        <p style="margin: 0; font-size: 11px; color: ${BRAND.textMuted};">
          © ${year} Fluenzy AI. All rights reserved.<br>
          AI-Powered Interview & Communication Coach
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
    signup: "You're one step away from creating your Fluenzy AI account. Enter the verification code below to complete your signup.",
    password_reset: "We received a request to reset your password. Use the code below to proceed with the reset.",
    login: "For security, please verify your login attempt with the code below.",
  };

  const digitBoxes = otp.split("").map(d => 
    `<td style="width: 48px; height: 56px; text-align: center; font-size: 28px; font-weight: 700; background: #1e1b4b; border: 2px solid ${BRAND.primary}; border-radius: 10px; color: #c4b5fd;">${d}</td>`
  ).join('<td style="width: 8px;"></td>');

  const content = `
    <table class="container" role="presentation" width="100%" style="max-width: 520px; background: ${BRAND.bgCard}; border-radius: 16px; border: 1px solid ${BRAND.border}; overflow: hidden;">
      ${emailHeader(titles[type])}
      <tr>
        <td class="content" style="padding: 40px;">
          <p style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #e2e8f0;">Hey ${name} 👋</p>
          <p style="margin: 0 0 28px; font-size: 15px; color: ${BRAND.textSecondary}; line-height: 1.6;">
            ${messages[type]}
          </p>
          
          <!-- OTP Code -->
          <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin: 0 auto 28px;">
            <tr>${digitBoxes}</tr>
          </table>
          
          <!-- Expiry Notice -->
          <div style="background: rgba(124, 58, 237, 0.1); border: 1px solid ${BRAND.border}; border-radius: 12px; padding: 16px 20px; margin-bottom: 28px; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: ${BRAND.textSecondary};">
              ⏱️ This code expires in <strong style="color: #c4b5fd;">${expiryMinutes} minutes</strong>
            </p>
          </div>
          
          <!-- Security Notice -->
          <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 16px 20px;">
            <p style="margin: 0; font-size: 13px; color: #fca5a5; line-height: 1.6;">
              🔒 <strong>Security Notice:</strong> Never share this code with anyone. Fluenzy AI will never ask for your verification code via email, phone, or chat.
            </p>
          </div>
        </td>
      </tr>
      ${emailFooter()}
    </table>`;

  return emailWrapper(content, `Your Fluenzy AI verification code is ${otp}`);
}

// ── Invoice Email Template ───────────────────────────────────────────────────
export function buildInvoiceEmailTemplate(params: {
  userName: string | null | undefined;
  invoiceNumber: string;
  plan: string | null | undefined;
  status: string;
  amount?: string;
  date?: string;
}): string {
  const { userName, invoiceNumber, plan, status, amount, date } = params;
  
  const statusStyles: Record<string, { bg: string; color: string; label: string; icon: string }> = {
    paid: { bg: "#dcfce7", color: "#166534", label: "Payment Successful", icon: "✅" },
    free_via_coupon: { bg: "#dbeafe", color: "#1e40af", label: "Activated via Coupon", icon: "🎁" },
    failed: { bg: "#fee2e2", color: "#991b1b", label: "Payment Failed", icon: "❌" },
    refunded: { bg: "#fef3c7", color: "#92400e", label: "Refunded", icon: "↩️" },
  };
  
  const statusStyle = statusStyles[status] || statusStyles.paid;

  const content = `
    <table class="container" role="presentation" width="100%" style="max-width: 520px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <!-- Header -->
      <tr>
        <td style="background: ${BRAND.gradient}; padding: 32px 40px; text-align: center;">
          <img src="${LOGO_URL}" alt="Fluenzy AI" width="48" height="48" style="display: block; margin: 0 auto 12px; border-radius: 10px;" onerror="this.style.display='none';">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">Fluenzy AI</h1>
          <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">Payment Receipt</p>
        </td>
      </tr>
      
      <!-- Body -->
      <tr>
        <td style="padding: 40px;">
          <p style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #1e293b;">Hi ${userName || "there"},</p>
          <p style="margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.6;">
            Thank you for choosing Fluenzy AI! Your invoice <strong style="color: ${BRAND.primaryDark};">#${invoiceNumber}</strong> is attached to this email.
          </p>
          
          <!-- Status Badge -->
          <div style="background: ${statusStyle.bg}; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
            <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${statusStyle.color};">
              ${statusStyle.icon} ${statusStyle.label}
            </p>
          </div>
          
          <!-- Invoice Details -->
          <table role="presentation" width="100%" style="background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
            <tr>
              <td style="padding: 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="font-size: 13px; color: #64748b;">Invoice Number</span>
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                      <strong style="font-size: 14px; color: #1e293b;">#${invoiceNumber}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="font-size: 13px; color: #64748b;">Plan</span>
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                      <strong style="font-size: 14px; color: #1e293b;">${plan || "Standard"}</strong>
                    </td>
                  </tr>
                  ${amount ? `
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="font-size: 13px; color: #64748b;">Amount</span>
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                      <strong style="font-size: 14px; color: ${BRAND.success};">${amount}</strong>
                    </td>
                  </tr>` : ""}
                  ${date ? `
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="font-size: 13px; color: #64748b;">Date</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
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
                <a href="https://www.fluenzyai.app/dashboard" style="display: inline-block; background: ${BRAND.gradient}; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                  Go to Dashboard →
                </a>
              </td>
            </tr>
          </table>
          
          <p style="margin: 0; font-size: 13px; color: #64748b; text-align: center;">
            For billing queries, contact <a href="mailto:billing@fluenzyai.app" style="color: ${BRAND.primary}; text-decoration: none;">billing@fluenzyai.app</a>
          </p>
        </td>
      </tr>
      
      <!-- Footer -->
      <tr>
        <td style="padding: 20px 40px; background: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">
            © ${new Date().getFullYear()} Fluenzy AI · <a href="https://www.fluenzyai.app" style="color: #94a3b8; text-decoration: none;">fluenzyai.app</a>
          </p>
        </td>
      </tr>
    </table>`;

  return emailWrapper(content, `Your Fluenzy AI invoice #${invoiceNumber}`);
}

// ── Certificate Email Template ───────────────────────────────────────────────
export function buildCertificateEmailTemplate(params: {
  recipientName: string;
  certificateType: string;
  courseName?: string;
  issueDate?: string;
}): string {
  const { recipientName, certificateType, courseName, issueDate } = params;

  const content = `
    <table class="container" role="presentation" width="100%" style="max-width: 520px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <!-- Header -->
      <tr>
        <td style="background: linear-gradient(135deg, #059669, #10b981); padding: 32px 40px; text-align: center;">
          <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 28px;">🏆</span>
          </div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">Congratulations!</h1>
          <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">Your Certificate is Ready</p>
        </td>
      </tr>
      
      <!-- Body -->
      <tr>
        <td style="padding: 40px;">
          <p style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #1e293b;">Dear ${recipientName},</p>
          <p style="margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.6;">
            We are delighted to present you with your <strong style="color: #059669;">${certificateType}</strong> certificate from Fluenzy AI.
          </p>
          
          <!-- Certificate Details -->
          <table role="presentation" width="100%" style="background: linear-gradient(135deg, #ecfdf5, #d1fae5); border-radius: 12px; border: 1px solid #a7f3d0; margin-bottom: 24px;">
            <tr>
              <td style="padding: 24px; text-align: center;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #059669; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Certificate of ${certificateType}</p>
                ${courseName ? `<p style="margin: 0 0 8px; font-size: 18px; font-weight: 700; color: #065f46;">${courseName}</p>` : ""}
                ${issueDate ? `<p style="margin: 0; font-size: 13px; color: #047857;">Issued on: ${issueDate}</p>` : ""}
              </td>
            </tr>
          </table>
          
          <p style="margin: 0 0 24px; font-size: 14px; color: #475569; line-height: 1.6;">
            Your certificate is attached to this email as a PDF. You can also access it anytime from your Fluenzy AI dashboard.
          </p>
          
          <!-- CTA Button -->
          <table role="presentation" width="100%" style="margin-bottom: 24px;">
            <tr>
              <td align="center">
                <a href="https://www.fluenzyai.app/dashboard" style="display: inline-block; background: linear-gradient(135deg, #059669, #10b981); color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                  View in Dashboard →
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <!-- Footer -->
      <tr>
        <td style="padding: 20px 40px; background: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0 0 8px; font-size: 12px; color: #64748b;">
            This certificate can be verified at <a href="https://www.fluenzyai.app/verify" style="color: ${BRAND.primary}; text-decoration: none;">fluenzyai.app/verify</a>
          </p>
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">
            © ${new Date().getFullYear()} Fluenzy AI
          </p>
        </td>
      </tr>
    </table>`;

  return emailWrapper(content, `Your ${certificateType} Certificate from Fluenzy AI`);
}

// ── Welcome Email Template ───────────────────────────────────────────────────
export function buildWelcomeEmailTemplate(params: {
  name: string;
  plan?: string;
}): string {
  const { name, plan } = params;

  const content = `
    <table class="container" role="presentation" width="100%" style="max-width: 520px; background: ${BRAND.bgCard}; border-radius: 16px; border: 1px solid ${BRAND.border}; overflow: hidden;">
      ${emailHeader("Welcome to the Family!")}
      <tr>
        <td class="content" style="padding: 40px;">
          <p style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #e2e8f0;">Welcome, ${name}! 🎉</p>
          <p style="margin: 0 0 24px; font-size: 15px; color: ${BRAND.textSecondary}; line-height: 1.6;">
            Your Fluenzy AI account is now active${plan ? ` with the <strong style="color: ${BRAND.primary};">${plan} Plan</strong>` : ""}. Get ready to transform your communication skills with AI-powered coaching!
          </p>
          
          <!-- Features -->
          <table role="presentation" width="100%" style="margin-bottom: 28px;">
            <tr>
              <td style="padding: 16px; background: rgba(124, 58, 237, 0.1); border-radius: 12px; margin-bottom: 12px;">
                <p style="margin: 0; font-size: 14px; color: #e2e8f0;">
                  🎯 <strong>AI Mock Interviews</strong><br>
                  <span style="color: ${BRAND.textSecondary}; font-size: 13px;">Practice with realistic AI-driven interviews</span>
                </p>
              </td>
            </tr>
            <tr><td style="height: 12px;"></td></tr>
            <tr>
              <td style="padding: 16px; background: rgba(124, 58, 237, 0.1); border-radius: 12px; margin-bottom: 12px;">
                <p style="margin: 0; font-size: 14px; color: #e2e8f0;">
                  📊 <strong>Real-time Feedback</strong><br>
                  <span style="color: ${BRAND.textSecondary}; font-size: 13px;">Get instant insights on your responses</span>
                </p>
              </td>
            </tr>
            <tr><td style="height: 12px;"></td></tr>
            <tr>
              <td style="padding: 16px; background: rgba(124, 58, 237, 0.1); border-radius: 12px;">
                <p style="margin: 0; font-size: 14px; color: #e2e8f0;">
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
                <a href="https://www.fluenzyai.app/dashboard" style="display: inline-block; background: ${BRAND.gradient}; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 16px 40px; border-radius: 10px;">
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
    <table class="container" role="presentation" width="100%" style="max-width: 520px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
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
      
      <!-- Footer -->
      <tr>
        <td style="padding: 20px 40px; background: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">
            © ${new Date().getFullYear()} Fluenzy AI · <a href="https://www.fluenzyai.app" style="color: #94a3b8; text-decoration: none;">fluenzyai.app</a>
          </p>
        </td>
      </tr>
    </table>`;

  return emailWrapper(content, subject);
}

// ── Export titleCase helper ──────────────────────────────────────────────────
export const titleCase = (value?: string | null) => {
  if (!value) return "N/A";
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
};
