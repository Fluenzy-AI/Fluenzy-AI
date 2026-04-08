// GET /api/chat/conversations - List user's conversations
// POST /api/chat/conversations - Start a new conversation
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  getConversationsList, 
  searchConversations, 
  getOrCreateDirectConversation,
  getTotalUnreadCount 
} from "@/modules/chat/services/conversation.service";
import { getGroupConversation } from "@/modules/chat/services/conversation.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const filter = searchParams.get("filter") as 'all' | 'unread' | 'groups' | 'direct' | undefined;
    const search = searchParams.get("search");

    // Get total unread count
    if (searchParams.get("unreadCount") === "true") {
      const count = await getTotalUnreadCount(session.user.id);
      return NextResponse.json({ unreadCount: count });
    }

    // Search conversations
    if (search) {
      const conversations = await searchConversations(session.user.id, search, limit);
      return NextResponse.json({ data: conversations, total: conversations.length });
    }

    const result = await getConversationsList(session.user.id, page, limit, filter);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[GET /api/chat/conversations]", error);
    return NextResponse.json(
      { error: error.message || "Failed to get conversations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, userId, groupId } = body;

    if (type === 'direct' || (!type && userId)) {
      // Start direct conversation
      if (!userId) {
        return NextResponse.json(
          { error: "User ID is required for direct conversation" },
          { status: 400 }
        );
      }

      const conversation = await getOrCreateDirectConversation(session.user.id, userId);
      return NextResponse.json({
        success: true,
        conversation
      }, { status: 201 });
    }

    if (type === 'group' && groupId) {
      // Get group conversation
      const conversationId = await getGroupConversation(groupId);
      if (!conversationId) {
        return NextResponse.json(
          { error: "Group conversation not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        conversationId
      });
    }

    return NextResponse.json(
      { error: "Invalid conversation type" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[POST /api/chat/conversations]", error);
    
    const status = error.message.includes("not found") ? 404 
      : error.message.includes("friends") ? 403
      : error.message.includes("yourself") ? 400
      : 500;

    return NextResponse.json(
      { error: error.message || "Failed to create conversation" },
      { status }
    );
  }
}
