import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/ats/ranking?page=1&limit=20&college=<name>&role=<jobRole>
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
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const skip = (page - 1) * limit;
    const collegeFilter = searchParams.get("college");
    const roleFilter = searchParams.get("role"); // e.g. "frontend", "backend", "fullstack"

    // Build where filter
    const where: Record<string, any> = {};
    if (collegeFilter) where.college = { contains: collegeFilter, mode: "insensitive" };
    if (roleFilter && roleFilter !== "all") where.jobRole = roleFilter;

    // COLLEGE_ADMIN: restrict to their college students only
    if (user.role === "COLLEGE_ADMIN") {
      const adminProfile = await (prisma as any).userProfile.findUnique({
        where: { userId: user.id },
        include: { educations: true },
      });
      const adminCollege = adminProfile?.educations?.[0]?.institution;
      if (adminCollege) {
        where.college = { contains: adminCollege, mode: "insensitive" };
      }
    }

    const [rankings, total] = await Promise.all([
      (prisma as any).aTSRanking.findMany({
        where,
        orderBy: { rank: "asc" },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
          analysis: {
            select: {
              atsScore: true,
              extractedSkills: true,
              jobTitleMatch: true,
              createdAt: true,
            },
          },
        },
      }),
      (prisma as any).aTSRanking.count({ where }),
    ]);

    // Find current user's rank (filtered by same role if specified)
    const myRankWhere: Record<string, any> = { userId: user.id };
    if (roleFilter && roleFilter !== "all") myRankWhere.jobRole = roleFilter;
    const myRanking = await (prisma as any).aTSRanking.findFirst({
      where: myRankWhere,
      orderBy: { totalScore: "desc" },
    });

    return NextResponse.json({
      rankings,
      total,
      page,
      pages: Math.ceil(total / limit),
      myRank: myRanking?.rank ?? null,
      myScore: myRanking?.totalScore ?? null,
      myRole: myRanking?.jobRole ?? null,
    });
  } catch (err) {
    console.error("[ATS Ranking GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
