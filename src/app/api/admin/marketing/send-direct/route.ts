/**
 * Marketing Direct Send API
 * POST - Send email directly to selected recipients
 * 
 * Uses Brevo API for reliable email delivery
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkMarketingAuth, unauthorizedResponse } from "@/lib/marketing-auth";
import { sendBrevoEmail, EmailContext } from "@/lib/brevo-mail";

// Sender configuration mapping to Brevo contexts
const senderContextMap: Record<string, EmailContext> = {
  news: "ADMIN",      // Use ADMIN for marketing broadcasts
  contact: "DEFAULT",
  careers: "HR",
  support: "DEFAULT",
};

// Sender configuration for display names and campaign records
const senderConfig: Record<string, { name: string; email: string }> = {
  news: { name: "FluenzyAI News", email: process.env.NEWS_FROM || "news@fluenzyai.app" },
  contact: { name: "FluenzyAI Contact", email: process.env.CONTACT_FROM || "contact@fluenzyai.app" },
  careers: { name: "FluenzyAI Careers", email: process.env.CAREERS_FROM || "careers@fluenzyai.app" },
  support: { name: "FluenzyAI Support", email: process.env.SUPPORT_FROM || "support@fluenzyai.app" },
};

export async function POST(req: NextRequest) {
  console.log("[send-direct] Starting POST request");
  try {
    const auth = await checkMarketingAuth(req);
    console.log("[send-direct] Auth result:", auth.authorized, auth.role);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const body = await req.json();
    const { recipientIds, subject, bodyHtml, senderType = "news" } = body;
    console.log("[send-direct] Request body:", { recipientIds, subject: subject?.substring(0, 20), senderType });

    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json(
        { error: "Recipient IDs are required" },
        { status: 400 }
      );
    }

    if (!subject || !bodyHtml) {
      return NextResponse.json(
        { error: "Subject and body are required" },
        { status: 400 }
      );
    }

    // Get recipients
    console.log("[send-direct] Fetching recipients...");
    const recipients = await prisma.marketingRecipient.findMany({
      where: {
        id: { in: recipientIds },
        status: "active",
      },
    });
    console.log("[send-direct] Found recipients:", recipients.length);

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No active recipients found" },
        { status: 400 }
      );
    }

    // Get the email context for Brevo API
    const emailContext = senderContextMap[senderType] || "ADMIN";
    const sender = senderConfig[senderType] || senderConfig.news;
    console.log("[send-direct] Using context:", emailContext, "sender:", sender);
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Create a campaign record
    console.log("[send-direct] Creating campaign...");
    const campaign = await prisma.marketingCampaign.create({
      data: {
        name: `Direct Send: ${subject.substring(0, 50)}`,
        subject,
        bodyHtml,
        bodyText: bodyHtml.replace(/<[^>]*>/g, ""),
        senderType: senderType as any,  // senderType is already lowercase (news, contact, etc.)
        status: "sending",
        totalRecipients: recipients.length,
        createdByEmail: auth.email || "system@fluenzyai.app",  // Required field
      },
    });
    console.log("[send-direct] Campaign created:", campaign.id);

    // Send emails using Brevo API
    for (const recipient of recipients) {
      console.log("[send-direct] Sending to:", recipient.email);
      try {
        // Personalize the email
        let personalizedHtml = bodyHtml
          .replace(/\{\{name\}\}/gi, recipient.name || "there")
          .replace(/\{\{email\}\}/gi, recipient.email);

        // Send via Brevo API (more reliable than SMTP)
        console.log("[send-direct] Calling sendBrevoEmail...");
        const result = await sendBrevoEmail({
          context: emailContext,
          to: recipient.email,
          subject,
          html: personalizedHtml,
          text: personalizedHtml.replace(/<[^>]*>/g, ""),
        });
        console.log("[send-direct] sendBrevoEmail result:", result);

        if (!result.success) {
          throw new Error(result.error || "Failed to send email");
        }

        // Log the email
        await prisma.marketingEmailLog.create({
          data: {
            campaignId: campaign.id,
            recipientEmail: recipient.email,
            recipientName: recipient.name,
            subject,
            senderType: senderType as any,
            status: "sent",
            sentAt: new Date(),
          },
        });

        // Update recipient last emailed
        await prisma.marketingRecipient.update({
          where: { id: recipient.id },
          data: { lastEmailedAt: new Date() },
        });

        sent++;
      } catch (error: any) {
        failed++;
        errors.push(`${recipient.email}: ${error.message || "Unknown error"}`);

        // Log failed email
        await prisma.marketingEmailLog.create({
          data: {
            campaignId: campaign.id,
            recipientEmail: recipient.email,
            recipientName: recipient.name,
            subject,
            senderType: senderType as any,
            status: "failed",
            failureReason: error.message || "Unknown error",
          },
        });
      }
    }

    // Update campaign stats
    await prisma.marketingCampaign.update({
      where: { id: campaign.id },
      data: {
        status: "sent",
        sentAt: new Date(),
        totalSent: sent,
      },
    });

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: recipients.length,
      campaignId: campaign.id,
      errors: errors.slice(0, 5),
    });
  } catch (error: any) {
    console.error("Direct send error:", error);
    console.error("Error details:", error?.message, error?.body, error?.stack);
    return NextResponse.json(
      { error: error?.message || "Failed to send emails", details: error?.body },
      { status: 500 }
    );
  }
}
