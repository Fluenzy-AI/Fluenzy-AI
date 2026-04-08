// GET /api/chat/conversations/[id] - Get conversation details with messages
// PATCH /api/chat/conversations/[id] - Update conversation settings (pin, mute, archive)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  getConversation,
  togglePinConversation,
  toggleMuteConversation,
  archiveConversation,
  markConversationAsRead
} from "@/modules/chat/services/conversation.service";
import { getMessages } from "@/modules/chat/services/message.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));
    const beforeId = searchParams.get("beforeId") ?? undefined;

    // Get conversation details
    const conversation = await getConversation(id, session.user.id);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Get messages
    const messages = await getMessages(id, session.user.id, page, limit, beforeId);

    // Mark as read
    await markConversationAsRead(id, session.user.id);

    return NextResponse.json({
      conversation,
      messages
    });
  } catch (error: any) {
    console.error("[GET /api/chat/conversations/[id]]", error);
    
    const status = error.message.includes("authorized") ? 403 
      : error.message.includes("not found") ? 404
      : 500;

    return NextResponse.json(
      { error: error.message || "Failed to get conversation" },
      { status }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, value } = body;

    switch (action) {
      case 'pin':
        await togglePinConversation(id, session.user.id, value ?? true);
        break;
      case 'mute':
        await toggleMuteConversation(id, session.user.id, value ?? true);
        break;
      case 'archive':
        await archiveConversation(id, session.user.id, value ?? true);
        break;
      case 'markRead':
        await markConversationAsRead(id, session.user.id);
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Conversation ${action}ed`
    });
  } catch (error: any) {
    console.error("[PATCH /api/chat/conversations/[id]]", error);
    return NextResponse.json(
      { error: error.message || "Failed to update conversation" },
      { status: 500 }
    );
  }
}
