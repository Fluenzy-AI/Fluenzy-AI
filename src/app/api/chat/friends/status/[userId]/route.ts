// GET /api/chat/friends/status/[userId] - Get friendship status with a user
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFriendshipStatus, getMutualFriends } from "@/modules/chat/services/friend.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const [status, mutualFriends] = await Promise.all([
      getFriendshipStatus(session.user.id, userId),
      getMutualFriends(session.user.id, userId)
    ]);

    return NextResponse.json({
      status,
      mutualFriends
    });
  } catch (error: any) {
    console.error("[GET /api/chat/friends/status]", error);
    return NextResponse.json(
      { error: error.message || "Failed to get friendship status" },
      { status: 500 }
    );
  }
}
