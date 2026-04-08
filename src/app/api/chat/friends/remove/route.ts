// DELETE /api/chat/friends/remove - Remove a friend (unfriend)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { removeFriend } from "@/modules/chat/services/friend.service";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const friendId = searchParams.get("friendId");

    if (!friendId) {
      return NextResponse.json(
        { error: "Friend ID is required" },
        { status: 400 }
      );
    }

    await removeFriend(session.user.id, friendId);

    return NextResponse.json({
      success: true,
      message: "Friend removed"
    });
  } catch (error: any) {
    console.error("[DELETE /api/chat/friends/remove]", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove friend" },
      { status: 500 }
    );
  }
}
