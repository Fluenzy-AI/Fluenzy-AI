// src/app/api/job-search/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/job-search/history
 * Returns search history for the user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    const history = await prisma.jobSearchHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 50),
      select: {
        id: true,
        query: true,
        location: true,
        jobType: true,
        workMode: true,
        resultsCount: true,
        fromCache: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      history,
      total: history.length,
    });
  } catch (error) {
    console.error("[History] Error:", error);
    return NextResponse.json({ error: "Failed to get search history" }, { status: 500 });
  }
}

/**
 * DELETE /api/job-search/history
 * Clear search history for the user
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      // Delete single history item
      await prisma.jobSearchHistory.delete({
        where: { id, userId: session.user.id },
      });
    } else {
      // Clear all history
      await prisma.jobSearchHistory.deleteMany({
        where: { userId: session.user.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[History] Delete error:", error);
    return NextResponse.json({ error: "Failed to delete history" }, { status: 500 });
  }
}
