// Message Service
// Handles message sending, editing, deletion, reactions, and retrieval
// ═══════════════════════════════════════════════════════════════════════════════

import prisma from "@/lib/prisma";
import { MessageType, MessageStatus } from "@prisma/client";
import { 
  updateConversationLastMessage, 
  incrementUnreadCounts 
} from "./conversation.service";
import { extractMentions } from "../utils/chat.utils";
import type {
  MessageWithDetails,
  SendMessageInput,
  EditMessageInput,
  DeleteMessageInput,
  ForwardMessageInput,
  AddReactionInput,
  PaginatedResponse
} from "../types/chat.types";

// ─── MESSAGE SENDING ───────────────────────────────────────────────────────────

/**
 * Send a message to a conversation
 */
export async function sendMessage(
  userId: string,
  input: SendMessageInput
): Promise<MessageWithDetails> {
  const { 
    conversationId, 
    type = MessageType.TEXT, 
    content, 
    mediaUrl, 
    mediaMeta, 
    replyToId,
    mentions: inputMentions,
    // Encryption
    isEncrypted = false,
    encryptedContent,
    nonce,
    keyVersion
  } = input;

  // Validate user is a participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } }
  });

  if (!participant) {
    throw new Error("Not a participant in this conversation");
  }

  // Validate content (encrypted or plain)
  if (type === MessageType.TEXT) {
    if (isEncrypted) {
      if (!encryptedContent || !nonce) {
        throw new Error("Encrypted content and nonce are required");
      }
    } else if (!content || content.trim().length === 0) {
      throw new Error("Message content is required");
    }
  }

  if (['IMAGE', 'VIDEO', 'DOCUMENT', 'VOICE'].includes(type) && !mediaUrl) {
    throw new Error("Media URL is required for media messages");
  }

  // Extract mentions from content
  let mentions = inputMentions || [];
  if (content && !inputMentions) {
    const mentionedUsernames = extractMentions(content);
    if (mentionedUsernames.length > 0) {
      // Resolve usernames to user IDs
      const mentionedUsers = await prisma.userProfile.findMany({
        where: { username: { in: mentionedUsernames } },
        select: { userId: true }
      });
      mentions = mentionedUsers.map(u => u.userId);
    }
  }

  // Validate reply target exists and is in same conversation
  if (replyToId) {
    const replyTarget = await prisma.message.findFirst({
      where: { id: replyToId, conversationId }
    });
    if (!replyTarget) {
      throw new Error("Reply target message not found");
    }
  }

  // Create the message
  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      type,
      content: isEncrypted ? null : content?.trim(),
      mediaUrl,
      mediaMeta: mediaMeta ? JSON.parse(JSON.stringify(mediaMeta)) : undefined,
      replyToId,
      mentions,
      status: MessageStatus.SENT,
      // Encryption fields
      isEncrypted,
      encryptedContent,
      nonce,
      keyVersion
    },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
      replyTo: {
        select: {
          id: true,
          content: true,
          senderId: true,
          type: true,
          sender: { select: { name: true } }
        }
      },
      reactions: {
        include: { user: { select: { id: true, name: true } } }
      },
      readStatus: true
    }
  });

  // Update conversation metadata (use encrypted content placeholder if encrypted)
  const lastMessageContent = isEncrypted ? "🔒 Encrypted message" : (content ?? null);
  await Promise.all([
    updateConversationLastMessage(conversationId, lastMessageContent, type),
    incrementUnreadCounts(conversationId, userId)
  ]);

  // Create read status entries for all participants (except sender)
  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId, userId: { not: userId } },
    select: { userId: true }
  });

  if (participants.length > 0) {
    await prisma.messageReadStatus.createMany({
      data: participants.map(p => ({
        messageId: message.id,
        userId: p.userId
      }))
    });
  }

  // Transform reply to include sender name
  const transformedMessage: MessageWithDetails = {
    ...message,
    replyTo: message.replyTo ? {
      id: message.replyTo.id,
      content: message.replyTo.content,
      senderId: message.replyTo.senderId,
      senderName: (message.replyTo as any).sender?.name || 'Unknown',
      type: message.replyTo.type
    } : null
  };

  return transformedMessage;
}

/**
 * Edit a message
 */
export async function editMessage(
  userId: string,
  input: EditMessageInput
): Promise<MessageWithDetails> {
  const { messageId, content } = input;

  if (!content || content.trim().length === 0) {
    throw new Error("Message content cannot be empty");
  }

  const message = await prisma.message.findUnique({
    where: { id: messageId }
  });

  if (!message) throw new Error("Message not found");
  if (message.senderId !== userId) throw new Error("Can only edit your own messages");
  if (message.isDeleted) throw new Error("Cannot edit deleted message");
  if (message.type !== MessageType.TEXT) throw new Error("Can only edit text messages");

  // Check time limit (e.g., 15 minutes)
  const editTimeLimit = 15 * 60 * 1000; // 15 minutes
  if (Date.now() - message.createdAt.getTime() > editTimeLimit) {
    throw new Error("Message can only be edited within 15 minutes of sending");
  }

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: {
      content: content.trim(),
      isEdited: true,
      editedAt: new Date()
    },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
      replyTo: {
        select: {
          id: true,
          content: true,
          senderId: true,
          type: true,
          sender: { select: { name: true } }
        }
      },
      reactions: {
        include: { user: { select: { id: true, name: true } } }
      },
      readStatus: true
    }
  });

  return updated as MessageWithDetails;
}

/**
 * Delete a message
 */
export async function deleteMessage(
  userId: string,
  input: DeleteMessageInput
): Promise<void> {
  const { messageId, forEveryone = false } = input;

  const message = await prisma.message.findUnique({
    where: { id: messageId }
  });

  if (!message) throw new Error("Message not found");

  if (forEveryone) {
    // Only sender can delete for everyone
    if (message.senderId !== userId) {
      throw new Error("Can only delete your own messages for everyone");
    }

    // Check time limit for delete for everyone (e.g., 1 hour)
    const deleteTimeLimit = 60 * 60 * 1000; // 1 hour
    if (Date.now() - message.createdAt.getTime() > deleteTimeLimit) {
      throw new Error("Message can only be deleted for everyone within 1 hour of sending");
    }

    await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedForAll: true,
        content: null,
        mediaUrl: null
      }
    });
  } else {
    // Delete for me - add user to deletedBy array
    await prisma.message.update({
      where: { id: messageId },
      data: {
        deletedBy: { push: userId }
      }
    });
  }
}

/**
 * Forward a message to other conversations
 */
export async function forwardMessage(
  userId: string,
  input: ForwardMessageInput
): Promise<MessageWithDetails[]> {
  const { messageId, conversationIds } = input;

  const originalMessage = await prisma.message.findUnique({
    where: { id: messageId }
  });

  if (!originalMessage) throw new Error("Message not found");
  if (originalMessage.isDeleted) throw new Error("Cannot forward deleted message");

  // Validate user is participant in all target conversations
  const participations = await prisma.conversationParticipant.findMany({
    where: {
      userId,
      conversationId: { in: conversationIds }
    }
  });

  if (participations.length !== conversationIds.length) {
    throw new Error("Not authorized to send to all target conversations");
  }

  // Create forwarded messages
  const forwardedMessages: MessageWithDetails[] = [];

  for (const conversationId of conversationIds) {
    const message = await sendMessage(userId, {
      conversationId,
      type: originalMessage.type,
      content: originalMessage.content || undefined,
      mediaUrl: originalMessage.mediaUrl || undefined,
      mediaMeta: originalMessage.mediaMeta as any
    });

    // Update with forwarded info
    await prisma.message.update({
      where: { id: message.id },
      data: { forwardedFrom: messageId }
    });

    forwardedMessages.push(message);
  }

  return forwardedMessages;
}

// ─── REACTIONS ─────────────────────────────────────────────────────────────────

/**
 * Add a reaction to a message
 */
export async function addReaction(
  userId: string,
  input: AddReactionInput
): Promise<void> {
  const { messageId, emoji } = input;

  // Validate message exists and user has access
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      conversation: {
        include: { participants: { where: { userId } } }
      }
    }
  });

  if (!message) throw new Error("Message not found");
  if (message.conversation.participants.length === 0) {
    throw new Error("Not authorized to react to this message");
  }

  // Add or update reaction (upsert)
  await prisma.messageReaction.upsert({
    where: { messageId_userId_emoji: { messageId, userId, emoji } },
    create: { messageId, userId, emoji },
    update: {} // No update needed, just ensure it exists
  });
}

/**
 * Remove a reaction from a message
 */
export async function removeReaction(
  userId: string,
  messageId: string,
  emoji: string
): Promise<void> {
  await prisma.messageReaction.delete({
    where: { messageId_userId_emoji: { messageId, userId, emoji } }
  }).catch(() => {
    // Ignore if doesn't exist
  });
}

// ─── MESSAGE QUERIES ───────────────────────────────────────────────────────────

/**
 * Get messages in a conversation with pagination
 */
export async function getMessages(
  conversationId: string,
  userId: string,
  page: number = 1,
  limit: number = 50,
  beforeId?: string
): Promise<PaginatedResponse<MessageWithDetails>> {
  // Validate user is participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } }
  });

  if (!participant) {
    throw new Error("Not authorized to view messages");
  }

  const where: any = {
    conversationId,
    isDeleted: false
  };

  // For cursor-based pagination
  if (beforeId) {
    const beforeMessage = await prisma.message.findUnique({
      where: { id: beforeId },
      select: { createdAt: true }
    });
    if (beforeMessage) {
      where.createdAt = { lt: beforeMessage.createdAt };
    }
  }

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        replyTo: {
          select: {
            id: true,
            content: true,
            senderId: true,
            type: true,
            sender: { select: { name: true } }
          }
        },
        reactions: {
          include: { user: { select: { id: true, name: true } } }
        },
        readStatus: true
      }
    }),
    prisma.message.count({ where: { conversationId, isDeleted: false } })
  ]);

  // Transform and reverse for chronological order
  const transformedMessages = messages.reverse().map(msg => ({
    ...msg,
    replyTo: msg.replyTo ? {
      id: msg.replyTo.id,
      content: msg.replyTo.content,
      senderId: msg.replyTo.senderId,
      senderName: (msg.replyTo as any).sender?.name || 'Unknown',
      type: msg.replyTo.type
    } : null
  })) as MessageWithDetails[];

  return {
    data: transformedMessages,
    total,
    page,
    limit,
    hasMore: messages.length === limit
  };
}

/**
 * Get a single message by ID
 */
export async function getMessage(
  messageId: string,
  userId: string
): Promise<MessageWithDetails | null> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
      conversation: {
        include: { participants: { where: { userId } } }
      },
      replyTo: {
        select: {
          id: true,
          content: true,
          senderId: true,
          type: true,
          sender: { select: { name: true } }
        }
      },
      reactions: {
        include: { user: { select: { id: true, name: true } } }
      },
      readStatus: true
    }
  });

  if (!message) return null;
  if (message.conversation.participants.length === 0) {
    throw new Error("Not authorized to view this message");
  }

  // Check if deleted by this user
  if (message.deletedBy.includes(userId)) return null;

  return message as MessageWithDetails;
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  userId: string,
  messageIds: string[]
): Promise<void> {
  await prisma.messageReadStatus.updateMany({
    where: {
      userId,
      messageId: { in: messageIds },
      readAt: null
    },
    data: { readAt: new Date() }
  });
}

/**
 * Mark messages as delivered
 */
export async function markMessagesAsDelivered(
  userId: string,
  messageIds: string[]
): Promise<void> {
  await prisma.messageReadStatus.updateMany({
    where: {
      userId,
      messageId: { in: messageIds },
      deliveredAt: null
    },
    data: { deliveredAt: new Date() }
  });
}

/**
 * Search messages in a conversation
 */
export async function searchMessages(
  conversationId: string,
  userId: string,
  search: string,
  limit: number = 20
): Promise<MessageWithDetails[]> {
  // Validate user is participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } }
  });

  if (!participant) {
    throw new Error("Not authorized to search messages");
  }

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      content: { contains: search, mode: 'insensitive' },
      isDeleted: false,
      NOT: { deletedBy: { has: userId } }
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
      reactions: {
        include: { user: { select: { id: true, name: true } } }
      },
      readStatus: true
    }
  });

  return messages as MessageWithDetails[];
}

/**
 * Get media messages from a conversation
 */
export async function getMediaMessages(
  conversationId: string,
  userId: string,
  type?: MessageType,
  limit: number = 50
): Promise<MessageWithDetails[]> {
  // Validate user is participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } }
  });

  if (!participant) {
    throw new Error("Not authorized to view messages");
  }

  const mediaTypes = type 
    ? [type] 
    : [MessageType.IMAGE, MessageType.VIDEO, MessageType.DOCUMENT, MessageType.VOICE];

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      type: { in: mediaTypes },
      isDeleted: false,
      NOT: { deletedBy: { has: userId } }
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
      reactions: {
        include: { user: { select: { id: true, name: true } } }
      },
      readStatus: true
    }
  });

  return messages as MessageWithDetails[];
}
