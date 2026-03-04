import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/ats/analysis?id=<analysisId>  (optional – omit for latest)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get("id");

    const isAdmin = ["SUPER_ADMIN", "Admin", "COLLEGE_ADMIN"].includes(user.role as string);
    const targetUserId = searchParams.get("userId") ?? user.id;

    // Admins can query other users; students can only see their own
    if (targetUserId !== user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // COLLEGE_ADMIN: restrict to their college
    if (user.role === "COLLEGE_ADMIN") {
      const targetUser = await prisma.users.findUnique({ where: { id: targetUserId } });
      if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
      // Additional college filtering can be added based on your CollegeAdmin model
    }

    let analysis;

    if (analysisId) {
      analysis = await (prisma as any).aTSAnalysis.findFirst({
        where: { id: analysisId, userId: targetUserId },
        include: { resume: { select: { fileName: true, uploadedAt: true } } },
      });
    } else {
      analysis = await (prisma as any).aTSAnalysis.findFirst({
        where: { userId: targetUserId },
        orderBy: { createdAt: "desc" },
        include: { resume: { select: { fileName: true, uploadedAt: true } } },
      });
    }

    if (!analysis) {
      return NextResponse.json({ analysis: null });
    }

    // Fetch rank
    const ranking = await (prisma as any).aTSRanking.findFirst({
      where: { analysisId: analysis.id },
    });

    return NextResponse.json({ analysis, ranking });
  } catch (err) {
    console.error("[ATS Analysis GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
