import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { decryptFromSender } from "@/modules/chat/services/encryption.service";

interface Props {
  params: Promise<{ conversationId: string }>;
}

/**
 * GET /api/chat/encryption/conversation-key/[conversationId]
 * Get decrypted conversation key for the user
 */
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { conversationId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: session.user.id
        }
      }
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    // Get latest conversation key
    const convKey = await prisma.conversationKey.findFirst({
      where: { conversationId },
      orderBy: { version: 'desc' }
    });

    if (!convKey) {
      return NextResponse.json(
        { error: "No encryption key found" },
        { status: 404 }
      );
    }

    // Get key distribution for this user
    const distribution = convKey.keyDistribution as any;
    const userEncryptedKey = distribution[session.user.id];

    if (!userEncryptedKey) {
      return NextResponse.json(
        { error: "Key not available for user" },
        { status: 404 }
      );
    }

    // Note: Client will decrypt this with their secret key
    // We return the encrypted key, not the plaintext
    return NextResponse.json({
      encryptedKey: userEncryptedKey.encryptedKey,
      nonce: userEncryptedKey.nonce,
      version: convKey.version,
      // For direct conversations, we need sender's public key to decrypt
      createdBy: convKey.createdBy
    });

  } catch (error) {
    console.error("[Get Conversation Key] Error:", error);
    return NextResponse.json(
      { error: "Failed to get key" },
      { status: 500 }
    );
  }
}
