/**
 * Marketing Direct Send API
 * POST - Send email directly to selected recipients
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkMarketingAuth, unauthorizedResponse } from "@/lib/marketing-auth";
import nodemailer from "nodemailer";

// Sender configuration from environment
const senderConfig: Record<string, { name: string; email: string }> = {
  news: { name: "FluenzyAI News", email: process.env.NEWS_FROM || "news@fluenzyai.app" },
  contact: { name: "FluenzyAI Contact", email: process.env.CONTACT_FROM || "contact@fluenzyai.app" },
  careers: { name: "FluenzyAI Careers", email: process.env.CAREERS_FROM || "careers@fluenzyai.app" },
  support: { name: "FluenzyAI Support", email: process.env.SUPPORT_FROM || "support@fluenzyai.app" },
};

export async function POST(req: NextRequest) {
  try {
    const auth = await checkMarketingAuth(req);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const body = await req.json();
    const { recipientIds, subject, bodyHtml, senderType = "news" } = body;

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
    const recipients = await prisma.marketingRecipient.findMany({
      where: {
        id: { in: recipientIds },
        status: "active",
      },
    });

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No active recipients found" },
        { status: 400 }
      );
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const sender = senderConfig[senderType] || senderConfig.news;
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Create a campaign record
    const campaign = await prisma.marketingCampaign.create({
      data: {
        name: `Direct Send: ${subject.substring(0, 50)}`,
        subject,
        bodyHtml,
        bodyText: bodyHtml.replace(/<[^>]*>/g, ""),
        senderType: senderType.toUpperCase() as any,
        status: "sending",
        totalRecipients: recipients.length,
      },
    });

    // Send emails
    for (const recipient of recipients) {
      try {
        // Personalize the email
        let personalizedHtml = bodyHtml
          .replace(/\{\{name\}\}/gi, recipient.name || "there")
          .replace(/\{\{email\}\}/gi, recipient.email);

        await transporter.sendMail({
          from: `"${sender.name}" <${sender.email}>`,
          to: recipient.email,
          subject,
          html: personalizedHtml,
          text: personalizedHtml.replace(/<[^>]*>/g, ""),
        });

        // Log the email
        await prisma.marketingEmailLog.create({
          data: {
            campaignId: campaign.id,
            recipientEmail: recipient.email,
            recipientName: recipient.name,
            subject,
            senderType: senderType.toUpperCase() as any,
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
            senderType: senderType.toUpperCase() as any,
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
  } catch (error) {
    console.error("Direct send error:", error);
    return NextResponse.json(
      { error: "Failed to send emails" },
      { status: 500 }
    );
  }
}
