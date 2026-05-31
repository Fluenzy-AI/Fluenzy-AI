// DELETE /api/chat/friends/unblock - Unblock a user
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { unblockUser } from "@/modules/chat/services/friend.service";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const blockedUserId = searchParams.get("blockedUserId");

    if (!blockedUserId) {
      return NextResponse.json(
        { error: "Blocked user ID is required" },
        { status: 400 }
      );
    }

    await unblockUser(session.user.id, blockedUserId);

    return NextResponse.json({
      success: true,
      message: "User unblocked successfully"
    });
  } catch (error: any) {
    console.error("[DELETE /api/chat/friends/unblock]", error);
    return NextResponse.json(
      { error: error.message || "Failed to unblock user" },
      { status: 500 }
    );
  }
}
