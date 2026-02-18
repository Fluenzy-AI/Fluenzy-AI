import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET latest topics (accessible to all authenticated users)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "gd" | "personal" | "technical" | null (all)
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.companyName = { contains: search, mode: "insensitive" };
    }

    // Filter by interview type - only return entries that have the requested type filled
    if (type === "gd") {
      where.gdTopic = { not: null };
    } else if (type === "personal") {
      where.personalInterviewTopic = { not: null };
    } else if (type === "technical") {
      where.technicalInterviewTopic = { not: null };
    }

    const [topics, total] = await Promise.all([
      prisma.latestTopic.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          companyName: true,
          gdTopic: true,
          personalInterviewTopic: true,
          technicalInterviewTopic: true,
          createdAt: true,
        },
      }),
      prisma.latestTopic.count({ where }),
    ]);

    return NextResponse.json({
      topics,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching latest topics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
