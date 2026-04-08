// GET /api/chat/messages/[id] - Get a single message
// PATCH /api/chat/messages/[id] - Edit message, add reaction
// DELETE /api/chat/messages/[id] - Delete message
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  getMessage, 
  editMessage, 
  deleteMessage,
  addReaction,
  removeReaction,
  forwardMessage
} from "@/modules/chat/services/message.service";

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
    const message = await getMessage(id, session.user.id);

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json({ message });
  } catch (error: any) {
    console.error("[GET /api/chat/messages/[id]]", error);
    
    const status = error.message.includes("authorized") ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to get message" },
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
    const { action, content, emoji, conversationIds } = body;

    switch (action) {
      case 'edit':
        if (!content) {
          return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }
        const edited = await editMessage(session.user.id, { messageId: id, content });
        return NextResponse.json({ success: true, message: edited });

      case 'react':
        if (!emoji) {
          return NextResponse.json({ error: "Emoji is required" }, { status: 400 });
        }
        await addReaction(session.user.id, { messageId: id, emoji });
        return NextResponse.json({ success: true, message: "Reaction added" });

      case 'unreact':
        if (!emoji) {
          return NextResponse.json({ error: "Emoji is required" }, { status: 400 });
        }
        await removeReaction(session.user.id, id, emoji);
        return NextResponse.json({ success: true, message: "Reaction removed" });

      case 'forward':
        if (!conversationIds || !Array.isArray(conversationIds) || conversationIds.length === 0) {
          return NextResponse.json({ error: "Conversation IDs are required" }, { status: 400 });
        }
        const forwarded = await forwardMessage(session.user.id, { 
          messageId: id, 
          conversationIds 
        });
        return NextResponse.json({ success: true, messages: forwarded });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("[PATCH /api/chat/messages/[id]]", error);
    
    const status = error.message.includes("own") ? 403 
      : error.message.includes("deleted") ? 400
      : error.message.includes("15 minutes") ? 400
      : error.message.includes("not found") ? 404
      : 500;

    return NextResponse.json(
      { error: error.message || "Failed to update message" },
      { status }
    );
  }
}

export async function DELETE(
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
    const forEveryone = searchParams.get("forEveryone") === "true";

    await deleteMessage(session.user.id, { messageId: id, forEveryone });

    return NextResponse.json({
      success: true,
      message: forEveryone ? "Message deleted for everyone" : "Message deleted"
    });
  } catch (error: any) {
    console.error("[DELETE /api/chat/messages/[id]]", error);
    
    const status = error.message.includes("own") ? 403 
      : error.message.includes("1 hour") ? 400
      : error.message.includes("not found") ? 404
      : 500;

    return NextResponse.json(
      { error: error.message || "Failed to delete message" },
      { status }
    );
  }
}
