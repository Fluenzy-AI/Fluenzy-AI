import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/ats/history?userId=<id>&page=1&limit=10
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
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(20, parseInt(searchParams.get("limit") ?? "10"));
    const skip = (page - 1) * limit;

    const isAdmin = ["SUPER_ADMIN", "Admin", "COLLEGE_ADMIN"].includes(user.role as string);
    const queryUserId = searchParams.get("userId") ?? user.id;

    if (queryUserId !== user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [analyses, total] = await Promise.all([
      (prisma as any).aTSAnalysis.findMany({
        where: { userId: queryUserId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          resume: { select: { fileName: true, fileType: true, uploadedAt: true } },
          ranking: { select: { rank: true } },
        },
      }),
      (prisma as any).aTSAnalysis.count({ where: { userId: queryUserId } }),
    ]);

    return NextResponse.json({
      analyses,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[ATS History GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/ats/history?analysisId=<id>
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get("analysisId");
    if (!analysisId) {
      return NextResponse.json({ error: "analysisId required" }, { status: 400 });
    }

    const analysis = await (prisma as any).aTSAnalysis.findFirst({
      where: { id: analysisId, userId: user.id },
    });
    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    await (prisma as any).aTSAnalysis.delete({ where: { id: analysisId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[ATS History DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
