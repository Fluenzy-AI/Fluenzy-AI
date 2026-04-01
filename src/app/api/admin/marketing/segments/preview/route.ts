/**
 * Segment Preview API
 * POST - Preview users matching a segment filter
 */

import { NextRequest, NextResponse } from "next/server";
import { segmentEngine } from "@/lib/marketing/segment-engine";
import prisma from "@/lib/prisma";
import { checkMarketingAuth, unauthorizedResponse } from "@/lib/marketing-auth";

export async function POST(req: NextRequest) {
  try {
    const auth = await checkMarketingAuth(req);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const body = await req.json();
    const { filterRules, segmentType, params, fullList } = body;

    let result;

    if (segmentType) {
      // Use predefined segment type
      switch (segmentType) {
        case "all_users":
          result = await segmentEngine.allUsers();
          break;
        case "inactive":
        case "inactive_7":
          result = await segmentEngine.inactiveUsers(params?.days || 7);
          break;
        case "inactive_30":
          result = await segmentEngine.inactiveUsers(30);
          break;
        case "new_users":
          result = await segmentEngine.newUsers(params?.days || 7);
          break;
        case "low_score":
          result = await segmentEngine.lowScore(params?.threshold || 0.4);
          break;
        case "power_users":
          result = await segmentEngine.powerUsers();
          break;
        case "incomplete_module":
          result = await segmentEngine.incompleteModule(params?.threshold || 0.5);
          break;
        case "quick_submit":
          result = await segmentEngine.quickSubmit(params?.maxSeconds || 60);
          break;
        case "plan":
        case "free_plan":
          result = await segmentEngine.planType(params?.plan || "Free");
          break;
        case "pro_plan":
          result = await segmentEngine.planType("Pro");
          break;
        case "feature_not_used":
          result = await segmentEngine.featureNotUsed(params?.module || "english");
          break;
        default:
          return NextResponse.json({ error: "Invalid segment type" }, { status: 400 });
      }
    } else if (filterRules) {
      // Use custom filter rules
      result = await segmentEngine.executeFilter(filterRules);
    } else {
      return NextResponse.json(
        { error: "Either segmentType or filterRules is required" },
        { status: 400 }
      );
    }

    // If fullList is requested, fetch full user details
    if (fullList && result.userIds.length > 0) {
      const users = await prisma.users.findMany({
        where: { id: { in: result.userIds.slice(0, 100) } }, // Limit to 100 for performance
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          plan: true,
          disabled: true,
          usageLimit: true,
          usageCount: true,
          hrUsage: true,
          gdUsage: true,
          technicalUsage: true,
          createdAt: true,
          avatar: true,
        },
      });

      // Map to frontend-friendly format
      const mappedUsers = users.map(u => ({
        ...u,
        sessionLimit: u.usageLimit,
        sessionsCount: u.usageCount,
        hrSessions: u.hrUsage,
        gdSessions: u.gdUsage,
        technicalSessions: u.technicalUsage,
      }));

      return NextResponse.json({
        count: result.count,
        users: mappedUsers,
      });
    }

    return NextResponse.json({
      count: result.count,
      users: result.previewSample,
    });
  } catch (error) {
    console.error("Segment preview error:", error);
    return NextResponse.json(
      { error: "Failed to preview segment" },
      { status: 500 }
    );
  }
}
