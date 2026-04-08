// POST /api/chat/friends/accept - Accept a friend request
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { acceptFriendRequest } from "@/modules/chat/services/friend.service";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    const request = await acceptFriendRequest(session.user.id, requestId);

    return NextResponse.json({
      success: true,
      message: "Friend request accepted",
      request
    });
  } catch (error: any) {
    console.error("[POST /api/chat/friends/accept]", error);
    
    const status = error.message.includes("not found") ? 404 
      : error.message.includes("authorized") ? 403
      : error.message.includes("already") ? 409
      : 500;

    return NextResponse.json(
      { error: error.message || "Failed to accept friend request" },
      { status }
    );
  }
}
