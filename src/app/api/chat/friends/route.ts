// GET /api/chat/friends - List user's friends
// POST /api/chat/friends - (redirects to /api/chat/friends/request)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFriends, getReceivedFriendRequests, getSentFriendRequests, getPendingRequestCount } from "@/modules/chat/services/friend.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const type = searchParams.get("type") ?? "friends"; // friends, received, sent
    const search = searchParams.get("search") ?? undefined;

    let result;
    
    switch (type) {
      case "received":
        result = await getReceivedFriendRequests(session.user.id, page, limit);
        break;
      case "sent":
        result = await getSentFriendRequests(session.user.id, page, limit);
        break;
      case "count":
        const count = await getPendingRequestCount(session.user.id);
        return NextResponse.json({ count });
      default:
        result = await getFriends(session.user.id, page, limit, search);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[GET /api/chat/friends]", error);
    return NextResponse.json(
      { error: error.message || "Failed to get friends" },
      { status: 500 }
    );
  }
}
