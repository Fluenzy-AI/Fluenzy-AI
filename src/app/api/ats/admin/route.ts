import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "Admin", "COLLEGE_ADMIN"];

/**
 * GET /api/ats/admin
 * Query params:
 *   page, limit, search (name/email), college, minScore, maxScore, sort (score|rank|date)
 * 
 * Roles:
 *  - SUPER_ADMIN / Admin  → all students
 *  - COLLEGE_ADMIN        → only students from their college
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (!ADMIN_ROLES.includes(user.role as string)) {
      return NextResponse.json({ error: "Forbidden – admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") ?? "";
    const minScore = parseFloat(searchParams.get("minScore") ?? "0");
    const maxScore = parseFloat(searchParams.get("maxScore") ?? "100");
    const sort = searchParams.get("sort") ?? "score"; // score|rank|date
    const college = searchParams.get("college") ?? "";

    // Build analysis where filter
    const analysisWhere: Record<string, any> = {
      atsScore: { gte: minScore, lte: maxScore },
    };

    // User filter
    const userWhere: Record<string, any> = {};
    if (search) {
      userWhere.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // COLLEGE_ADMIN restriction
    if (user.role === "COLLEGE_ADMIN") {
      // Get their college from their profile
      const adminProfile = await (prisma as any).userProfile.findUnique({
        where: { userId: user.id },
        include: { educations: true },
      });
      const adminCollege = adminProfile?.educations?.[0]?.institution ?? "";
      // Filter rankings by college
      if (!college) {
        // Force their college filter
        analysisWhere.ranking = {
          college: { contains: adminCollege, mode: "insensitive" },
        };
      }
    }

    if (college) {
      analysisWhere.ranking = {
        college: { contains: college, mode: "insensitive" },
      };
    }

    // Sort
    let orderBy: Record<string, any> = { atsScore: "desc" };
    if (sort === "rank") orderBy = { ranking: { rank: "asc" } };
    if (sort === "date") orderBy = { createdAt: "desc" };

    // Fetch analyses with users
    let analyses;
    let total;

    if (Object.keys(userWhere).length > 0) {
      // Need to filter by user fields – get matching user IDs first
      const matchingUsers = await prisma.users.findMany({
        where: userWhere,
        select: { id: true },
      });
      const userIds = matchingUsers.map(u => u.id);
      analysisWhere.userId = { in: userIds };
    }

    // Get latest analysis per user only (sub-query equivalent: group by userId)
    [analyses, total] = await Promise.all([
      (prisma as any).aTSAnalysis.findMany({
        where: analysisWhere,
        orderBy,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true, createdAt: true } },
          resume: { select: { fileName: true, fileType: true, uploadedAt: true } },
          ranking: true,
        },
      }),
      (prisma as any).aTSAnalysis.count({ where: analysisWhere }),
    ]);

    // Aggregate stats
    const stats = await (prisma as any).aTSAnalysis.aggregate({
      _avg: { atsScore: true, keywordScore: true, skillsScore: true },
      _max: { atsScore: true },
      _min: { atsScore: true },
      _count: true,
    });

    // College breakdown (top 10)
    const collegeBreakdown = await (prisma as any).aTSRanking.groupBy({
      by: ["college"],
      _avg: { totalScore: true },
      _count: true,
      orderBy: { _avg: { totalScore: "desc" } },
      take: 10,
      where: { college: { not: null } },
    });

    return NextResponse.json({
      analyses,
      total,
      page,
      pages: Math.ceil(total / limit),
      stats: {
        avgScore: Math.round(stats._avg?.atsScore ?? 0),
        avgKeywordScore: Math.round(stats._avg?.keywordScore ?? 0),
        avgSkillsScore: Math.round(stats._avg?.skillsScore ?? 0),
        maxScore: stats._max?.atsScore ?? 0,
        minScore: stats._min?.atsScore ?? 100,
        totalAnalyses: stats._count,
      },
      collegeBreakdown,
    });
  } catch (err) {
    console.error("[ATS Admin GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
