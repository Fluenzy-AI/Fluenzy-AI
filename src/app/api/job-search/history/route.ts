// src/app/api/job-search/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/job-search/history
 * Returns search history for the user (auto-cleans old items)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clean up records older than 30 days (background, don't block)
    cleanupOldHistory(session.user.id).catch(err => 
      console.warn("[History] Cleanup failed:", err.message)
    );

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    // Get history from last 30 days only
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const history = await prisma.jobSearchHistory.findMany({
      where: { 
        userId: session.user.id,
        createdAt: { gte: thirtyDaysAgo }, // Only get recent items
      },
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
        jobs: true, // Include job results
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      history,
      total: history.length,
    });
  } catch (error: any) {
    console.error("[History] Error:", error);
    return NextResponse.json({ 
      success: false,
      error: "Failed to get search history",
      message: error.message 
    }, { status: 500 });
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
      // Delete single history item (user manual delete)
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
  } catch (error: any) {
    console.error("[History] Delete error:", error);
    return NextResponse.json({ 
      success: false,
      error: "Failed to delete history",
      message: error.message 
    }, { status: 500 });
  }
}

/**
 * Clean up old history records (older than 30 days)
 * Runs async in background
 */
async function cleanupOldHistory(userId: string) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await prisma.jobSearchHistory.deleteMany({
      where: {
        userId,
        createdAt: { lt: thirtyDaysAgo },
      },
    });
    
    if (result.count > 0) {
      console.log(`[History] Cleaned up ${result.count} old records for user ${userId}`);
    }
  } catch (err) {
    // Don't throw - this is background cleanup
    throw err;
  }
}
