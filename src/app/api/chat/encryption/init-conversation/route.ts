import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { 
  generateSymmetricKey, 
  encryptKeyForRecipients,
  getMultipleUserPublicKeys 
} from "@/modules/chat/services/encryption.service";

/**
 * POST /api/chat/encryption/init-conversation
 * Initialize encryption for a conversation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId, deviceId } = await request.json();

    if (!conversationId || !deviceId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
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

    // Check if key already exists
    const existing = await prisma.conversationKey.findFirst({
      where: { conversationId }
    });

    if (existing) {
      return NextResponse.json({
        symmetricKey: existing.encryptedKey,
        version: existing.version
      });
    }

    // Get all participants
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true }
    });

    // Get user's encryption key (to encrypt for others)
    const userKey = await prisma.userEncryptionKey.findFirst({
      where: {
        userId: session.user.id,
        deviceId,
        isActive: true
      }
    });

    if (!userKey) {
      return NextResponse.json(
        { error: "Encryption not initialized for device" },
        { status: 400 }
      );
    }

    // Get public keys for all participants
    const publicKeys = await getMultipleUserPublicKeys(
      participants.map(p => p.userId)
    );

    // Generate symmetric key
    const symmetricKey = generateSymmetricKey();

    // Encrypt for each participant
    // Note: In real implementation, sender's secret key would be passed from client
    // For now, we'll store the symmetric key directly and encrypt per-user on first access
    const keyDistribution = encryptKeyForRecipients(
      symmetricKey,
      publicKeys,
      userKey.publicKey // Using public key as placeholder - client will handle real encryption
    );

    // Create conversation key
    const convKey = await prisma.conversationKey.create({
      data: {
        conversationId,
        version: 1,
        encryptedKey: symmetricKey,
        keyDistribution: keyDistribution as any,
        createdBy: session.user.id
      }
    });

    return NextResponse.json({
      symmetricKey,
      version: convKey.version
    });

  } catch (error) {
    console.error("[Init Conversation Encryption] Error:", error);
    return NextResponse.json(
      { error: "Failed to initialize encryption" },
      { status: 500 }
    );
  }
}
