import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/users/search
 * Search for users by name or username
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    if (query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Search users by name or profile username
    const users = await prisma.users.findMany({
      where: {
        AND: [
          { id: { not: session.user.id } },
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { profile: { username: { contains: query, mode: 'insensitive' } } }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        profile: {
          select: {
            username: true
          }
        }
      },
      take: limit,
      orderBy: [
        { name: 'asc' }
      ]
    });

    // Transform to flatten profile
    const transformedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      username: u.profile?.username || null
    }));

    return NextResponse.json({ users: transformedUsers });
  } catch (error) {
    console.error("[User Search] Error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
