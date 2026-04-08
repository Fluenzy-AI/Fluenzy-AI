// POST /api/chat/friends/request - Send a friend request
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendFriendRequest } from "@/modules/chat/services/friend.service";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { receiverId, message } = body;

    if (!receiverId) {
      return NextResponse.json(
        { error: "Receiver ID is required" },
        { status: 400 }
      );
    }

    const request = await sendFriendRequest(session.user.id, { receiverId, message });

    return NextResponse.json({
      success: true,
      message: "Friend request sent",
      request
    });
  } catch (error: any) {
    console.error("[POST /api/chat/friends/request]", error);
    
    const status = error.message.includes("not found") ? 404 
      : error.message.includes("yourself") ? 400
      : error.message.includes("already") ? 409
      : 500;

    return NextResponse.json(
      { error: error.message || "Failed to send friend request" },
      { status }
    );
  }
}
