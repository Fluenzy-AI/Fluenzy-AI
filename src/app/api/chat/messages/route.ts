// GET /api/chat/messages - Search messages across conversations
// POST /api/chat/messages - Send a message
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  sendMessage, 
  searchMessages,
  getMediaMessages 
} from "@/modules/chat/services/message.service";
import { MessageType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    const search = searchParams.get("search");
    const mediaType = searchParams.get("mediaType") as MessageType | undefined;
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    // Search messages
    if (search) {
      const messages = await searchMessages(conversationId, session.user.id, search, limit);
      return NextResponse.json({ data: messages });
    }

    // Get media messages
    if (mediaType) {
      const messages = await getMediaMessages(conversationId, session.user.id, mediaType, limit);
      return NextResponse.json({ data: messages });
    }

    return NextResponse.json({ error: "Search query or media type required" }, { status: 400 });
  } catch (error: any) {
    console.error("[GET /api/chat/messages]", error);
    
    const status = error.message.includes("authorized") ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to search messages" },
      { status }
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
    const { 
      conversationId, 
      type = 'TEXT', 
      content, 
      mediaUrl, 
      mediaMeta, 
      replyToId,
      mentions,
      // Encryption fields
      encryptedContent,
      nonce,
      keyVersion,
      isEncrypted = false
    } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    const message = await sendMessage(session.user.id, {
      conversationId,
      type,
      content,
      mediaUrl,
      mediaMeta,
      replyToId,
      mentions,
      // Encryption
      isEncrypted,
      encryptedContent,
      nonce,
      keyVersion
    });

    return NextResponse.json({
      success: true,
      message
    }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/chat/messages]", error);
    
    const status = error.message.includes("participant") ? 403 
      : error.message.includes("required") ? 400
      : error.message.includes("not found") ? 404
      : 500;

    return NextResponse.json(
      { error: error.message || "Failed to send message" },
      { status }
    );
  }
}
