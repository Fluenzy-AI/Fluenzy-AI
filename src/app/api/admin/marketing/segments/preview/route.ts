/**
 * Segment Preview API
 * POST - Preview users matching a segment filter
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { segmentEngine } from "@/lib/marketing/segment-engine";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !["SUPER_ADMIN", "MARKETING_ADMIN"].includes(session.user.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { filterRules, segmentType, params } = body;

    let result;

    if (segmentType) {
      // Use predefined segment type
      switch (segmentType) {
        case "all_users":
          result = await segmentEngine.allUsers();
          break;
        case "inactive":
          result = await segmentEngine.inactiveUsers(params?.days || 7);
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
          result = await segmentEngine.planType(params?.plan || "Free");
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

    return NextResponse.json({
      count: result.count,
      previewSample: result.previewSample,
    });
  } catch (error) {
    console.error("Segment preview error:", error);
    return NextResponse.json(
      { error: "Failed to preview segment" },
      { status: 500 }
    );
  }
}
