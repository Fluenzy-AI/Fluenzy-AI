// DELETE /api/chat/friends/cancel - Cancel a sent friend request
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cancelFriendRequest } from "@/modules/chat/services/friend.service";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("requestId");

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    await cancelFriendRequest(session.user.id, requestId);

    return NextResponse.json({
      success: true,
      message: "Friend request cancelled"
    });
  } catch (error: any) {
    console.error("[DELETE /api/chat/friends/cancel]", error);
    
    const status = error.message.includes("not found") ? 404 
      : error.message.includes("authorized") ? 403
      : 500;

    return NextResponse.json(
      { error: error.message || "Failed to cancel friend request" },
      { status }
    );
  }
}
