/**
 * Marketing Email Service
 * Handles bulk email sending with Brevo API
 */

import prisma from "@/lib/prisma";
import { sendBrevoEmail, type EmailContext } from "@/lib/brevo-mail";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "marketing-secret";

// Sender addresses from environment (for display/logging)
const SENDERS = {
  news: process.env.NEWS_FROM || "news@fluenzyai.app",
  contact: process.env.CONTACT_FROM || "contact@fluenzyai.app",
  careers: process.env.CAREERS_FROM || "careers@fluenzyai.app",
  support: process.env.SUPPORT_FROM || "support@fluenzyai.app",
};

// Map marketing sender types to Brevo email contexts
const SENDER_TO_CONTEXT: Record<string, EmailContext> = {
  news: "DEFAULT",
  contact: "DEFAULT",
  careers: "HR",
  support: "ADMIN",
};

export interface EmailRecipient {
  userId: string;
  email: string;
  name: string;
  variables?: Record<string, string>;
}

export interface MarketingEmailOptions {
  campaignId?: string;
  triggerId?: string;
  triggerName?: string;
  senderType: "news" | "contact" | "careers" | "support";
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  recipients: EmailRecipient[];
}

/**
 * Replace template variables in email content
 */
function replaceVariables(
  content: string,
  recipient: EmailRecipient,
  additionalVars?: Record<string, string>
): string {
  let result = content;

  // Basic variables
  result = result.replace(/\{\{first_name\}\}/g, recipient.name.split(" ")[0] || "there");
  result = result.replace(/\{\{name\}\}/g, recipient.name || "there");
  result = result.replace(/\{\{email\}\}/g, recipient.email);

  // Custom variables
  if (recipient.variables) {
    Object.entries(recipient.variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    });
  }

  // Additional variables
  if (additionalVars) {
    Object.entries(additionalVars).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    });
  }

  return result;
}

/**
 * Generate unsubscribe link for a user
 */
export function generateUnsubscribeLink(userId: string, email: string): string {
  const token = jwt.sign(
    { userId, email, action: "unsubscribe" },
    JWT_SECRET,
    { expiresIn: "365d" } // Long-lived for email links
  );
  return `https://www.fluenzyai.app/unsubscribe?token=${token}`;
}

/**
 * Generate tracking pixel URL
 */
export function generateTrackingPixel(emailLogId: string): string {
  const token = jwt.sign(
    { logId: emailLogId, action: "open" },
    JWT_SECRET,
    { expiresIn: "90d" }
  );
  return `https://www.fluenzyai.app/api/track/open?token=${token}`;
}

/**
 * Wrap links for click tracking
 */
export function wrapLinksForTracking(html: string, emailLogId: string): string {
  // Find all href attributes and wrap them
  return html.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (match, url) => {
      // Don't wrap unsubscribe links
      if (url.includes("unsubscribe")) {
        return match;
      }
      const token = jwt.sign(
        { logId: emailLogId, action: "click", url },
        JWT_SECRET,
        { expiresIn: "90d" }
      );
      return `href="https://www.fluenzyai.app/api/track/click?token=${token}&url=${encodeURIComponent(url)}"`;
    }
  );
}

/**
 * Add tracking pixel to email HTML
 */
export function addTrackingPixel(html: string, emailLogId: string): string {
  const pixelUrl = generateTrackingPixel(emailLogId);
  const pixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="" />`;
  
  if (html.includes("</body>")) {
    return html.replace("</body>", pixel + "</body>");
  }
  return html + pixel;
}

/**
 * Check if user is unsubscribed
 */
async function isUserUnsubscribed(userId: string): Promise<boolean> {
  const prefs = await prisma.emailPreferences.findUnique({
    where: { userId },
  });
  return prefs?.unsubscribed || false;
}

/**
 * Send a single marketing email
 */
export async function sendMarketingEmail(
  options: MarketingEmailOptions,
  recipient: EmailRecipient
): Promise<{ success: boolean; messageId?: string; error?: string; logId?: string }> {
  const { campaignId, triggerId, triggerName, senderType, subject, bodyHtml, bodyText } = options;

  try {
    // Check if user is unsubscribed
    if (await isUserUnsubscribed(recipient.userId)) {
      return { success: false, error: "User is unsubscribed" };
    }

    // Create email log entry first
    const emailLog = await prisma.marketingEmailLog.create({
      data: {
        campaignId: campaignId || undefined,
        userId: recipient.userId,
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        senderEmail: SENDERS[senderType],
        subject,
        status: "queued",
        triggerId: triggerId || undefined,
        triggerName: triggerName || undefined,
      },
    });

    // Generate unsubscribe link
    const unsubscribeLink = generateUnsubscribeLink(recipient.userId, recipient.email);

    // Replace variables
    let processedSubject = replaceVariables(subject, recipient);
    let processedHtml = replaceVariables(bodyHtml, recipient, {
      unsubscribe_link: unsubscribeLink,
    });
    let processedText = bodyText
      ? replaceVariables(bodyText, recipient, { unsubscribe_link: unsubscribeLink })
      : undefined;

    // Add tracking
    processedHtml = addTrackingPixel(processedHtml, emailLog.id);
    processedHtml = wrapLinksForTracking(processedHtml, emailLog.id);

    // Get email context for Brevo
    const emailContext = SENDER_TO_CONTEXT[senderType] || "DEFAULT";

    // Send email via Brevo
    const result = await sendBrevoEmail({
      context: emailContext,
      to: recipient.email,
      subject: processedSubject,
      html: processedHtml,
      text: processedText,
    });

    // Update email log
    await prisma.marketingEmailLog.update({
      where: { id: emailLog.id },
      data: {
        status: "sent",
        sentAt: new Date(),
        messageId: result.messageId || undefined,
      },
    });

    // Update campaign stats if campaign
    if (campaignId) {
      await prisma.marketingCampaign.update({
        where: { id: campaignId },
        data: {
          totalSent: { increment: 1 },
        },
      });
    }

    return { success: true, messageId: result.messageId, logId: emailLog.id };
  } catch (error) {
    console.error("Marketing email send error:", error);

    // Log the failure
    if (options.campaignId || options.triggerId) {
      await prisma.marketingEmailLog.create({
        data: {
          campaignId: campaignId || undefined,
          userId: recipient.userId,
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          senderEmail: SENDERS[senderType],
          subject,
          status: "failed",
          failureReason: error instanceof Error ? error.message : "Unknown error",
          triggerId: triggerId || undefined,
          triggerName: triggerName || undefined,
        },
      });

      // Update campaign failed count
      if (campaignId) {
        await prisma.marketingCampaign.update({
          where: { id: campaignId },
          data: {
            totalFailed: { increment: 1 },
          },
        });
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send bulk marketing emails with rate limiting
 */
export async function sendBulkMarketingEmails(
  options: MarketingEmailOptions,
  onProgress?: (sent: number, total: number, failed: number) => void
): Promise<{
  totalSent: number;
  totalFailed: number;
  errors: Array<{ email: string; error: string }>;
}> {
  const { recipients } = options;
  let totalSent = 0;
  let totalFailed = 0;
  const errors: Array<{ email: string; error: string }> = [];

  // Rate limit: 10 emails per second (configurable)
  const RATE_LIMIT_MS = 100; // 10 per second

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];

    const result = await sendMarketingEmail(options, recipient);

    if (result.success) {
      totalSent++;
    } else {
      totalFailed++;
      errors.push({ email: recipient.email, error: result.error || "Unknown error" });
    }

    // Progress callback
    if (onProgress) {
      onProgress(totalSent, recipients.length, totalFailed);
    }

    // Rate limiting delay
    if (i < recipients.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS));
    }
  }

  return { totalSent, totalFailed, errors };
}

/**
 * Update campaign status
 */
export async function updateCampaignStatus(
  campaignId: string,
  status: "draft" | "scheduled" | "sending" | "sent" | "paused" | "cancelled"
): Promise<void> {
  const updateData: any = { status };

  if (status === "sending") {
    updateData.sentAt = new Date();
  } else if (status === "paused") {
    updateData.pausedAt = new Date();
  }

  await prisma.marketingCampaign.update({
    where: { id: campaignId },
    data: updateData,
  });
}

/**
 * Handle email tracking events (open, click, bounce, etc.)
 */
export async function handleTrackingEvent(
  event: "open" | "click" | "bounce" | "unsubscribe",
  emailLogId: string,
  metadata?: Record<string, any>
): Promise<void> {
  const updateData: any = {};

  switch (event) {
    case "open":
      updateData.status = "opened";
      updateData.openedAt = new Date();
      break;
    case "click":
      updateData.status = "clicked";
      updateData.clickedAt = new Date();
      break;
    case "bounce":
      updateData.status = "bounced";
      updateData.bouncedAt = new Date();
      updateData.bounceReason = metadata?.reason || "Unknown";
      break;
    case "unsubscribe":
      updateData.status = "unsubscribed";
      updateData.unsubscribedAt = new Date();
      break;
  }

  if (metadata) {
    updateData.metadata = metadata;
  }

  try {
    const log = await prisma.marketingEmailLog.update({
      where: { id: emailLogId },
      data: updateData,
    });

    // Update campaign stats
    if (log.campaignId) {
      const statField = {
        open: "totalOpened",
        click: "totalClicked",
        bounce: "totalBounced",
        unsubscribe: "totalUnsubscribed",
      }[event];

      if (statField) {
        await prisma.marketingCampaign.update({
          where: { id: log.campaignId },
          data: {
            [statField]: { increment: 1 },
          },
        });
      }
    }
  } catch (error) {
    console.error("Tracking event error:", error);
  }
}

/**
 * Get campaign analytics
 */
export async function getCampaignAnalytics(campaignId: string): Promise<{
  campaign: any;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  topLinks: Array<{ url: string; clicks: number }>;
}> {
  const campaign = await prisma.marketingCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const openRate = campaign.totalSent > 0 
    ? (campaign.totalOpened / campaign.totalSent) * 100 
    : 0;
  const clickRate = campaign.totalOpened > 0 
    ? (campaign.totalClicked / campaign.totalOpened) * 100 
    : 0;
  const bounceRate = campaign.totalSent > 0 
    ? (campaign.totalBounced / campaign.totalSent) * 100 
    : 0;
  const unsubscribeRate = campaign.totalSent > 0 
    ? (campaign.totalUnsubscribed / campaign.totalSent) * 100 
    : 0;

  // Get top clicked links (from metadata)
  const clickedLogs = await prisma.marketingEmailLog.findMany({
    where: {
      campaignId,
      status: "clicked",
      metadata: { not: null },
    },
    select: {
      metadata: true,
    },
  });

  const linkCounts: Record<string, number> = {};
  clickedLogs.forEach((log) => {
    const url = (log.metadata as any)?.clickedUrl;
    if (url) {
      linkCounts[url] = (linkCounts[url] || 0) + 1;
    }
  });

  const topLinks = Object.entries(linkCounts)
    .map(([url, clicks]) => ({ url, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  return {
    campaign,
    openRate,
    clickRate,
    bounceRate,
    unsubscribeRate,
    topLinks,
  };
}
