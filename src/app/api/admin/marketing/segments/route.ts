/**
 * Marketing Segments API
 * GET - List all segments with live counts
 * POST - Create a new segment
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { segmentEngine } from "@/lib/marketing/segment-engine";
import { checkMarketingAuth, unauthorizedResponse } from "@/lib/marketing-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await checkMarketingAuth(req);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const searchParams = req.nextUrl.searchParams;
    const includePreview = searchParams.get("preview") === "true";
    const predefinedOnly = searchParams.get("predefined") === "true";

    // Get predefined segments with live counts
    const predefinedSegments = await segmentEngine.getPredefinedSegments();

    if (predefinedOnly) {
      return NextResponse.json({ segments: predefinedSegments });
    }

    // Get saved segments from database
    const savedSegments = await prisma.userSegment.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        filterRules: true,
        userCount: true,
        lastSyncedAt: true,
        isSystem: true,
        createdBy: true,
        createdAt: true,
      },
    });

    // Refresh counts for saved segments if needed (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const segmentsNeedingRefresh = savedSegments.filter(
      (s) => !s.lastSyncedAt || s.lastSyncedAt < oneHourAgo
    );

    // Update stale segment counts
    for (const segment of segmentsNeedingRefresh) {
      try {
        const result = await segmentEngine.executeFilter(segment.filterRules as any);
        await prisma.userSegment.update({
          where: { id: segment.id },
          data: {
            userCount: result.count,
            lastSyncedAt: new Date(),
          },
        });
        segment.userCount = result.count;
        segment.lastSyncedAt = new Date();
      } catch (error) {
        console.error(`Failed to refresh segment ${segment.id}:`, error);
      }
    }

    return NextResponse.json({
      predefinedSegments,
      savedSegments,
    });
  } catch (error) {
    console.error("Segments list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch segments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await checkMarketingAuth(req);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const body = await req.json();
    const { name, description, filterRules } = body;

    if (!name || !filterRules) {
      return NextResponse.json(
        { error: "Missing required fields: name, filterRules" },
        { status: 400 }
      );
    }

    // Calculate initial user count
    const result = await segmentEngine.executeFilter(filterRules);

    const segment = await prisma.userSegment.create({
      data: {
        name,
        description: description || undefined,
        filterRules,
        userCount: result.count,
        lastSyncedAt: new Date(),
        createdBy: auth.email || "unknown",
        isSystem: false,
      },
    });

    return NextResponse.json({
      success: true,
      segment: {
        id: segment.id,
        name: segment.name,
        userCount: segment.userCount,
      },
    });
  } catch (error) {
    console.error("Segment create error:", error);
    return NextResponse.json(
      { error: "Failed to create segment" },
      { status: 500 }
    );
  }
}
