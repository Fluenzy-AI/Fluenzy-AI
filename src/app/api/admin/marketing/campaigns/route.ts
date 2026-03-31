/**
 * Marketing Campaigns API
 * GET - List all campaigns
 * POST - Create a new campaign
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { segmentEngine } from "@/lib/marketing/segment-engine";
import { sendBulkMarketingEmails, updateCampaignStatus } from "@/lib/marketing/email-service";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !["SUPER_ADMIN", "MARKETING_ADMIN"].includes(session.user.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
      ];
    }

    const [campaigns, total] = await Promise.all([
      prisma.marketingCampaign.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          subject: true,
          senderType: true,
          status: true,
          scheduledAt: true,
          sentAt: true,
          totalRecipients: true,
          totalSent: true,
          totalOpened: true,
          totalClicked: true,
          totalBounced: true,
          totalUnsubscribed: true,
          isAiGenerated: true,
          createdByEmail: true,
          createdAt: true,
        },
      }),
      prisma.marketingCampaign.count({ where }),
    ]);

    // Calculate metrics for each campaign
    const campaignsWithMetrics = campaigns.map((campaign) => {
      const openRate = campaign.totalSent > 0
        ? ((campaign.totalOpened / campaign.totalSent) * 100).toFixed(1)
        : "0.0";
      const clickRate = campaign.totalOpened > 0
        ? ((campaign.totalClicked / campaign.totalOpened) * 100).toFixed(1)
        : "0.0";

      return {
        ...campaign,
        openRate,
        clickRate,
      };
    });

    return NextResponse.json({
      campaigns: campaignsWithMetrics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Campaigns list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !["SUPER_ADMIN", "MARKETING_ADMIN"].includes(session.user.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      subject,
      bodyHtml,
      bodyText,
      senderType,
      segmentFilters,
      segmentIds,
      scheduledAt,
      sendNow,
      isAiGenerated,
      aiPrompt,
      aiTone,
    } = body;

    // Validate required fields
    if (!name || !subject || !bodyHtml || !senderType) {
      return NextResponse.json(
        { error: "Missing required fields: name, subject, bodyHtml, senderType" },
        { status: 400 }
      );
    }

    // Validate sender type
    if (!["news", "contact", "careers", "support"].includes(senderType)) {
      return NextResponse.json(
        { error: "Invalid sender type" },
        { status: 400 }
      );
    }

    // Calculate recipients based on segment
    let recipientCount = 0;
    if (segmentFilters) {
      const result = await segmentEngine.executeFilter(segmentFilters);
      recipientCount = result.count;
    } else if (segmentIds && segmentIds.length > 0) {
      // Get users from saved segments
      const segments = await prisma.userSegment.findMany({
        where: { id: { in: segmentIds } },
      });
      
      // Aggregate user counts (approximation for now)
      recipientCount = segments.reduce((acc, seg) => acc + seg.userCount, 0);
    } else {
      // Default to all users
      recipientCount = await prisma.users.count({ where: { disabled: false } });
    }

    // Determine initial status
    let status: "draft" | "scheduled" | "sending" = "draft";
    if (sendNow) {
      status = "sending";
    } else if (scheduledAt) {
      status = "scheduled";
    }

    // Create campaign
    const campaign = await prisma.marketingCampaign.create({
      data: {
        name,
        subject,
        bodyHtml,
        bodyText: bodyText || undefined,
        senderType,
        status,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        segmentFilters: segmentFilters || undefined,
        segmentIds: segmentIds || [],
        totalRecipients: recipientCount,
        isAiGenerated: isAiGenerated || false,
        aiPrompt: aiPrompt || undefined,
        aiTone: aiTone || undefined,
        createdByEmail: session.user.email || "unknown",
      },
    });

    // If sendNow, start sending emails
    if (sendNow) {
      // Get recipients
      let recipients: Array<{ userId: string; email: string; name: string }> = [];

      if (segmentFilters) {
        const result = await segmentEngine.executeFilter(segmentFilters);
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

      // Send in background (non-blocking)
      sendBulkMarketingEmails({
        campaignId: campaign.id,
        senderType,
        subject,
        bodyHtml,
        bodyText,
        recipients,
      }).then(async (result) => {
        // Update campaign status when done
        await updateCampaignStatus(campaign.id, "sent");
        console.log(`Campaign ${campaign.id} sent: ${result.totalSent} emails, ${result.totalFailed} failed`);
      }).catch((error) => {
        console.error(`Campaign ${campaign.id} send error:`, error);
      });
    }

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        totalRecipients: campaign.totalRecipients,
      },
      message: sendNow 
        ? "Campaign created and sending started" 
        : scheduledAt 
          ? "Campaign created and scheduled" 
          : "Campaign saved as draft",
    });
  } catch (error) {
    console.error("Campaign create error:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
