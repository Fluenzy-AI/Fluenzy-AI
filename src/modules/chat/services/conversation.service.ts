// Conversation Service
// Handles conversation creation, retrieval, and management
// ═══════════════════════════════════════════════════════════════════════════════

import prisma from "@/lib/prisma";
import { ConversationType } from "@prisma/client";
import { areFriends } from "./friend.service";
import type {
  ConversationWithDetails,
  ConversationListItem,
  PaginatedResponse
} from "../types/chat.types";
import { 
  getConversationDisplayName, 
  getConversationAvatar, 
  formatMessagePreview 
} from "../utils/chat.utils";

// ─── CONVERSATION CREATION ─────────────────────────────────────────────────────

/**
 * Get or create a direct conversation between two users
 */
export async function getOrCreateDirectConversation(
  userId: string,
  otherUserId: string
): Promise<ConversationWithDetails> {
  // Validate users exist
  const [user, otherUser] = await Promise.all([
    prisma.users.findUnique({ where: { id: userId } }),
    prisma.users.findUnique({ where: { id: otherUserId } })
  ]);

  if (!user) throw new Error("User not found");
  if (!otherUser) throw new Error("Other user not found");
  if (userId === otherUserId) throw new Error("Cannot start conversation with yourself");

  // Check if users are friends (required for DM)
  const friends = await areFriends(userId, otherUserId);
  if (!friends) {
    throw new Error("You can only message friends");
  }

  // Find existing conversation
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      type: ConversationType.DIRECT,
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: otherUserId } } }
      ]
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } }
        }
      },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
          reactions: {
            include: { user: { select: { id: true, name: true } } }
          },
          readStatus: true
        }
      }
    }
  });

  if (existingConversation) {
    return existingConversation;
  }

  // Create new conversation
  const conversation = await prisma.conversation.create({
    data: {
      type: ConversationType.DIRECT,
      participants: {
        create: [
          { userId },
          { userId: otherUserId }
        ]
      }
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } }
        }
      },
      messages: true
    }
  });

  return conversation as ConversationWithDetails;
}

/**
 * Get conversation by ID (with auth check)
 */
export async function getConversation(
  conversationId: string,
  userId: string
): Promise<ConversationWithDetails | null> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } }
        }
      },
      group: {
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, avatar: true } }
            }
          },
          _count: { select: { members: true } }
        }
      }
    }
  });

  if (!conversation) return null;

  // Check if user is a participant
  const isParticipant = conversation.participants.some(p => p.userId === userId);
  if (!isParticipant) {
    throw new Error("Not authorized to view this conversation");
  }

  return conversation as ConversationWithDetails;
}

// ─── CONVERSATION QUERIES ──────────────────────────────────────────────────────

/**
 * Get user's conversations list for sidebar
 */
export async function getConversationsList(
  userId: string,
  page: number = 1,
  limit: number = 20,
  filter?: 'all' | 'unread' | 'groups' | 'direct'
): Promise<PaginatedResponse<ConversationListItem>> {
  const skip = (page - 1) * limit;

  const whereClause: any = {
    participants: { some: { userId, isArchived: false } }
  };

  // Apply filters
  if (filter === 'unread') {
    whereClause.participants.some.unreadCount = { gt: 0 };
  } else if (filter === 'groups') {
    whereClause.type = ConversationType.GROUP;
  } else if (filter === 'direct') {
    whereClause.type = ConversationType.DIRECT;
  }

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: [
        { 
          participants: {
            _count: 'desc' // Pinned conversations have isPinned = true
          }
        },
        { lastMessageAt: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } }
          }
        },
        group: {
          select: { id: true, name: true, avatar: true }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: { select: { id: true, name: true, avatar: true } }
          }
        }
      }
    }),
    prisma.conversation.count({ where: whereClause })
  ]);

  // Transform to list items
  const items: ConversationListItem[] = conversations.map(conv => {
    const participant = conv.participants.find(p => p.userId === userId);
    const lastMessage = conv.messages[0];

    return {
      id: conv.id,
      type: conv.type,
      name: conv.type === ConversationType.GROUP && conv.group
        ? conv.group.name
        : getConversationDisplayName(conv as any, userId),
      avatar: conv.type === ConversationType.GROUP && conv.group
        ? conv.group.avatar
        : getConversationAvatar(conv as any, userId),
      lastMessage: lastMessage 
        ? formatMessagePreview(
            lastMessage.content, 
            lastMessage.type, 
            lastMessage.senderId !== userId ? lastMessage.sender.name : undefined
          )
        : null,
      lastMessageAt: conv.lastMessageAt,
      unreadCount: participant?.unreadCount ?? 0,
      isPinned: participant?.isPinned ?? false,
      isMuted: participant?.isMuted ?? false,
      isArchived: participant?.isArchived ?? false,
      participants: conv.participants.map(p => ({
        id: p.user.id,
        name: p.user.name,
        avatar: p.user.avatar
      }))
    };
  });

  // Sort by pinned first, then by lastMessageAt
  items.sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    const aTime = a.lastMessageAt?.getTime() ?? 0;
    const bTime = b.lastMessageAt?.getTime() ?? 0;
    return bTime - aTime;
  });

  return {
    data: items,
    total,
    page,
    limit,
    hasMore: skip + items.length < total
  };
}

/**
 * Search conversations
 */
export async function searchConversations(
  userId: string,
  search: string,
  limit: number = 10
): Promise<ConversationListItem[]> {
  // Search in group names and participant names
  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId, isArchived: false } },
      OR: [
        { group: { name: { contains: search, mode: 'insensitive' } } },
        { 
          participants: { 
            some: { 
              user: { name: { contains: search, mode: 'insensitive' } } 
            } 
          } 
        }
      ]
    },
    take: limit,
    orderBy: { lastMessageAt: 'desc' },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } }
        }
      },
      group: { select: { id: true, name: true, avatar: true } }
    }
  });

  return conversations.map(conv => {
    const participant = conv.participants.find(p => p.userId === userId);

    return {
      id: conv.id,
      type: conv.type,
      name: conv.type === ConversationType.GROUP && conv.group
        ? conv.group.name
        : getConversationDisplayName(conv as any, userId),
      avatar: conv.type === ConversationType.GROUP && conv.group
        ? conv.group.avatar
        : getConversationAvatar(conv as any, userId),
      lastMessage: conv.lastMessagePreview,
      lastMessageAt: conv.lastMessageAt,
      unreadCount: participant?.unreadCount ?? 0,
      isPinned: participant?.isPinned ?? false,
      isMuted: participant?.isMuted ?? false,
      isArchived: participant?.isArchived ?? false
    };
  });
}

// ─── CONVERSATION ACTIONS ──────────────────────────────────────────────────────

/**
 * Pin/unpin a conversation
 */
export async function togglePinConversation(
  conversationId: string,
  userId: string,
  pinned: boolean
): Promise<void> {
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { isPinned: pinned }
  });
}

/**
 * Mute/unmute a conversation
 */
export async function toggleMuteConversation(
  conversationId: string,
  userId: string,
  muted: boolean
): Promise<void> {
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { isMuted: muted }
  });
}

/**
 * Archive a conversation (hide from list)
 */
export async function archiveConversation(
  conversationId: string,
  userId: string,
  archived: boolean = true
): Promise<void> {
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { isArchived: archived }
  });
}

/**
 * Mark conversation as read
 */
export async function markConversationAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  await prisma.$transaction([
    // Update participant's last read time and reset unread count
    prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { 
        lastReadAt: new Date(),
        unreadCount: 0
      }
    }),
    // Mark all messages as read
    prisma.messageReadStatus.updateMany({
      where: {
        userId,
        readAt: null,
        message: { conversationId }
      },
      data: { readAt: new Date() }
    })
  ]);
}

/**
 * Get unread count across all conversations
 */
export async function getTotalUnreadCount(userId: string): Promise<number> {
  const result = await prisma.conversationParticipant.aggregate({
    where: { userId, isArchived: false },
    _sum: { unreadCount: true }
  });
  return result._sum.unreadCount ?? 0;
}

/**
 * Update last message info on conversation
 */
export async function updateConversationLastMessage(
  conversationId: string,
  content: string | null,
  type: string
): Promise<void> {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      lastMessageAt: new Date(),
      lastMessagePreview: formatMessagePreview(content, type)
    }
  });
}

/**
 * Increment unread count for all participants except sender
 */
export async function incrementUnreadCounts(
  conversationId: string,
  exceptUserId: string
): Promise<void> {
  await prisma.conversationParticipant.updateMany({
    where: {
      conversationId,
      userId: { not: exceptUserId }
    },
    data: {
      unreadCount: { increment: 1 }
    }
  });
}

/**
 * Get conversation for a group
 */
export async function getGroupConversation(groupId: string): Promise<string | null> {
  const conversation = await prisma.conversation.findUnique({
    where: { groupId },
    select: { id: true }
  });
  return conversation?.id ?? null;
}
