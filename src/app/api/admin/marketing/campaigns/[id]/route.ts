/**
 * Marketing Campaign by ID API
 * GET - Get campaign details
 * PUT - Update campaign
 * DELETE - Delete campaign
 * POST - Send campaign now
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { segmentEngine } from "@/lib/marketing/segment-engine";
import { sendBulkMarketingEmails, updateCampaignStatus, getCampaignAnalytics } from "@/lib/marketing/email-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !["SUPER_ADMIN", "MARKETING_ADMIN"].includes(session.user.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const campaign = await prisma.marketingCampaign.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            emailLogs: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Get analytics
    const analytics = await getCampaignAnalytics(id);

    return NextResponse.json({
      campaign,
      analytics: {
        openRate: analytics.openRate,
        clickRate: analytics.clickRate,
        bounceRate: analytics.bounceRate,
        unsubscribeRate: analytics.unsubscribeRate,
        topLinks: analytics.topLinks,
      },
    });
  } catch (error) {
    console.error("Campaign fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !["SUPER_ADMIN", "MARKETING_ADMIN"].includes(session.user.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Check campaign exists
    const existing = await prisma.marketingCampaign.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Don't allow editing sent campaigns
    if (existing.status === "sent" || existing.status === "sending") {
      return NextResponse.json(
        { error: "Cannot edit a campaign that has been sent or is sending" },
        { status: 400 }
      );
    }

    const {
      name,
      subject,
      bodyHtml,
      bodyText,
      senderType,
      segmentFilters,
      segmentIds,
      scheduledAt,
      status,
    } = body;

    // Recalculate recipients if segment changed
    let recipientCount = existing.totalRecipients;
    if (segmentFilters && JSON.stringify(segmentFilters) !== JSON.stringify(existing.segmentFilters)) {
      const result = await segmentEngine.executeFilter(segmentFilters);
      recipientCount = result.count;
    }

    const campaign = await prisma.marketingCampaign.update({
      where: { id },
      data: {
        name: name || undefined,
        subject: subject || undefined,
        bodyHtml: bodyHtml || undefined,
        bodyText: bodyText ?? undefined,
        senderType: senderType || undefined,
        segmentFilters: segmentFilters ?? undefined,
        segmentIds: segmentIds ?? undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        status: status || undefined,
        totalRecipients: recipientCount,
      },
    });

    return NextResponse.json({
      success: true,
      campaign,
    });
  } catch (error) {
    console.error("Campaign update error:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !["SUPER_ADMIN", "MARKETING_ADMIN"].includes(session.user.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check campaign exists
    const existing = await prisma.marketingCampaign.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Don't allow deleting sending campaigns
    if (existing.status === "sending") {
      return NextResponse.json(
        { error: "Cannot delete a campaign that is currently sending" },
        { status: 400 }
      );
    }

    // Delete campaign (cascades to email logs)
    await prisma.marketingCampaign.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Campaign delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}

// POST - Send campaign now
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !["SUPER_ADMIN", "MARKETING_ADMIN"].includes(session.user.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    const campaign = await prisma.marketingCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    switch (action) {
      case "send": {
        if (campaign.status === "sent" || campaign.status === "sending") {
          return NextResponse.json(
            { error: "Campaign has already been sent or is sending" },
            { status: 400 }
          );
        }

        // Update status to sending
        await updateCampaignStatus(id, "sending");

        // Get recipients
        let recipients: Array<{ userId: string; email: string; name: string }> = [];

        if (campaign.segmentFilters) {
          const result = await segmentEngine.executeFilter(campaign.segmentFilters as any);
          const users = await prisma.users.findMany({
            where: { id: { in: result.userIds } },
            select: { id: true, email: true, name: true },
          });
          recipients = users.map((u) => ({ userId: u.id, email: u.email, name: u.name }));
        } else {
          const users = await prisma.users.findMany({
            where: { disabled: false },
            select: { id: true, email: true, name: true },
          });
          recipients = users.map((u) => ({ userId: u.id, email: u.email, name: u.name }));
        }

        // Send in background
        sendBulkMarketingEmails({
          campaignId: campaign.id,
          senderType: campaign.senderType as any,
          subject: campaign.subject,
          bodyHtml: campaign.bodyHtml,
          bodyText: campaign.bodyText || undefined,
          recipients,
        }).then(async (result) => {
          await updateCampaignStatus(campaign.id, "sent");
          console.log(`Campaign ${campaign.id} sent: ${result.totalSent} emails`);
        }).catch((error) => {
          console.error(`Campaign ${campaign.id} send error:`, error);
        });

        return NextResponse.json({
          success: true,
          message: "Campaign sending started",
          recipientCount: recipients.length,
        });
      }

      case "pause": {
        if (campaign.status !== "sending") {
          return NextResponse.json(
            { error: "Can only pause a sending campaign" },
            { status: 400 }
          );
        }

        await updateCampaignStatus(id, "paused");
        return NextResponse.json({ success: true, message: "Campaign paused" });
      }

      case "resume": {
        if (campaign.status !== "paused") {
          return NextResponse.json(
            { error: "Can only resume a paused campaign" },
            { status: 400 }
          );
        }

        await updateCampaignStatus(id, "sending");
        return NextResponse.json({ success: true, message: "Campaign resumed" });
      }

      case "cancel": {
        if (campaign.status === "sent") {
          return NextResponse.json(
            { error: "Cannot cancel a sent campaign" },
            { status: 400 }
          );
        }

        await updateCampaignStatus(id, "cancelled");
        return NextResponse.json({ success: true, message: "Campaign cancelled" });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: send, pause, resume, or cancel" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Campaign action error:", error);
    return NextResponse.json(
      { error: "Failed to perform campaign action" },
      { status: 500 }
    );
  }
}
