// POST /api/chat/friends/block - Block a user
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { blockUser } from "@/modules/chat/services/friend.service";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { blockedUserId } = await req.json();

    if (!blockedUserId) {
      return NextResponse.json(
        { error: "Blocked user ID is required" },
        { status: 400 }
      );
    }

    await blockUser(session.user.id, blockedUserId);

    return NextResponse.json({
      success: true,
      message: "User blocked successfully"
    });
  } catch (error: any) {
    console.error("[POST /api/chat/friends/block]", error);
    return NextResponse.json(
      { error: error.message || "Failed to block user" },
      { status: error.message.includes("already blocked") ? 400 : 500 }
    );
  }
}
