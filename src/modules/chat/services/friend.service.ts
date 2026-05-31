// Friend Service
// Handles friend requests, friendships, and friend-related operations
// ═══════════════════════════════════════════════════════════════════════════════

import prisma from "@/lib/prisma";
import { FriendRequestStatus } from "@prisma/client";
import type { 
  FriendRequestWithUsers, 
  FriendWithProfile, 
  SendFriendRequestInput,
  PaginatedResponse 
} from "../types/chat.types";

// ─── FRIEND REQUEST OPERATIONS ─────────────────────────────────────────────────

/**
 * Send a friend request to another user
 */
export async function sendFriendRequest(
  senderId: string, 
  input: SendFriendRequestInput
): Promise<FriendRequestWithUsers> {
  const { receiverId, message } = input;

  // Validate users exist
  const [sender, receiver] = await Promise.all([
    prisma.users.findUnique({ where: { id: senderId } }),
    prisma.users.findUnique({ where: { id: receiverId } })
  ]);

  if (!sender) throw new Error("Sender not found");
  if (!receiver) throw new Error("User not found");
  if (senderId === receiverId) throw new Error("Cannot send friend request to yourself");

  // Check if already friends
  const existingFriendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId: senderId, friendId: receiverId },
        { userId: receiverId, friendId: senderId }
      ]
    }
  });

  if (existingFriendship) {
    throw new Error("Already friends with this user");
  }

  // Check for existing pending request in either direction
  const existingRequest = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId, receiverId, status: FriendRequestStatus.PENDING },
        { senderId: receiverId, receiverId: senderId, status: FriendRequestStatus.PENDING }
      ]
    }
  });

  if (existingRequest) {
    if (existingRequest.senderId === receiverId) {
      // They already sent us a request - accept it instead
      return acceptFriendRequest(senderId, existingRequest.id);
    }
    throw new Error("Friend request already sent");
  }

  // Create the friend request
  const request = await prisma.friendRequest.create({
    data: {
      senderId,
      receiverId,
      message,
      status: FriendRequestStatus.PENDING
    },
    include: {
      sender: {
        select: { id: true, name: true, email: true, avatar: true }
      },
      receiver: {
        select: { id: true, name: true, email: true, avatar: true }
      }
    }
  });

  return request;
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(
  userId: string, 
  requestId: string
): Promise<FriendRequestWithUsers> {
  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
    include: {
      sender: { select: { id: true, name: true, email: true, avatar: true } },
      receiver: { select: { id: true, name: true, email: true, avatar: true } }
    }
  });

  if (!request) throw new Error("Friend request not found");
  if (request.receiverId !== userId) throw new Error("Not authorized to accept this request");
  if (request.status !== FriendRequestStatus.PENDING) {
    throw new Error(`Request already ${request.status.toLowerCase()}`);
  }

  // Update request and create friendship in transaction
  const [updatedRequest] = await prisma.$transaction([
    prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: FriendRequestStatus.ACCEPTED },
      include: {
        sender: { select: { id: true, name: true, email: true, avatar: true } },
        receiver: { select: { id: true, name: true, email: true, avatar: true } }
      }
    }),
    // Create bidirectional friendship
    prisma.friendship.create({
      data: { userId: request.senderId, friendId: request.receiverId }
    }),
    prisma.friendship.create({
      data: { userId: request.receiverId, friendId: request.senderId }
    })
  ]);

  return updatedRequest;
}

/**
 * Reject a friend request
 */
export async function rejectFriendRequest(
  userId: string, 
  requestId: string
): Promise<FriendRequestWithUsers> {
  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId }
  });

  if (!request) throw new Error("Friend request not found");
  if (request.receiverId !== userId) throw new Error("Not authorized to reject this request");
  if (request.status !== FriendRequestStatus.PENDING) {
    throw new Error(`Request already ${request.status.toLowerCase()}`);
  }

  return prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: FriendRequestStatus.REJECTED },
    include: {
      sender: { select: { id: true, name: true, email: true, avatar: true } },
      receiver: { select: { id: true, name: true, email: true, avatar: true } }
    }
  });
}

/**
 * Cancel a sent friend request
 */
export async function cancelFriendRequest(
  userId: string, 
  requestId: string
): Promise<void> {
  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId }
  });

  if (!request) throw new Error("Friend request not found");
  if (request.senderId !== userId) throw new Error("Not authorized to cancel this request");
  if (request.status !== FriendRequestStatus.PENDING) {
    throw new Error(`Request already ${request.status.toLowerCase()}`);
  }

  await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: FriendRequestStatus.CANCELLED }
  });
}

// ─── FRIENDSHIP OPERATIONS ─────────────────────────────────────────────────────

/**
 * Remove a friend (unfriend)
 */
export async function removeFriend(userId: string, friendId: string): Promise<void> {
  // Delete both directions of the friendship
  await prisma.$transaction([
    prisma.friendship.deleteMany({
      where: { userId, friendId }
    }),
    prisma.friendship.deleteMany({
      where: { userId: friendId, friendId: userId }
    })
  ]);
}

/**
 * Get user's friends list with pagination
 */
export async function getFriends(
  userId: string, 
  page: number = 1, 
  limit: number = 20,
  search?: string
): Promise<PaginatedResponse<FriendWithProfile>> {
  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(search && {
      friend: {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { profile: { username: { contains: search, mode: 'insensitive' as const } } }
        ]
      }
    })
  };

  const [friends, total] = await Promise.all([
    prisma.friendship.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        friend: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            profile: {
              select: { username: true, headline: true }
            }
          }
        }
      }
    }),
    prisma.friendship.count({ where })
  ]);

  return {
    data: friends,
    total,
    page,
    limit,
    hasMore: skip + friends.length < total
  };
}

/**
 * Get pending friend requests received by user
 */
export async function getReceivedFriendRequests(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<FriendRequestWithUsers>> {
  const skip = (page - 1) * limit;

  const [requests, total] = await Promise.all([
    prisma.friendRequest.findMany({
      where: { receiverId: userId, status: FriendRequestStatus.PENDING },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true, email: true, avatar: true } },
        receiver: { select: { id: true, name: true, email: true, avatar: true } }
      }
    }),
    prisma.friendRequest.count({
      where: { receiverId: userId, status: FriendRequestStatus.PENDING }
    })
  ]);

  return {
    data: requests,
    total,
    page,
    limit,
    hasMore: skip + requests.length < total
  };
}

/**
 * Get friend requests sent by user
 */
export async function getSentFriendRequests(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<FriendRequestWithUsers>> {
  const skip = (page - 1) * limit;

  const [requests, total] = await Promise.all([
    prisma.friendRequest.findMany({
      where: { senderId: userId, status: FriendRequestStatus.PENDING },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true, email: true, avatar: true } },
        receiver: { select: { id: true, name: true, email: true, avatar: true } }
      }
    }),
    prisma.friendRequest.count({
      where: { senderId: userId, status: FriendRequestStatus.PENDING }
    })
  ]);

  return {
    data: requests,
    total,
    page,
    limit,
    hasMore: skip + requests.length < total
  };
}

/**
 * Check if two users are friends
 */
export async function areFriends(userId1: string, userId2: string): Promise<boolean> {
  const friendship = await prisma.friendship.findFirst({
    where: { userId: userId1, friendId: userId2 }
  });
  return !!friendship;
}

/**
 * Get friendship status between two users
 */
export async function getFriendshipStatus(
  currentUserId: string, 
  otherUserId: string
): Promise<'friends' | 'pending_sent' | 'pending_received' | 'none'> {
  // Check if already friends
  const friendship = await prisma.friendship.findFirst({
    where: { userId: currentUserId, friendId: otherUserId }
  });
  if (friendship) return 'friends';

  // Check for pending requests
  const pendingRequest = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId: currentUserId, receiverId: otherUserId, status: FriendRequestStatus.PENDING },
        { senderId: otherUserId, receiverId: currentUserId, status: FriendRequestStatus.PENDING }
      ]
    }
  });

  if (pendingRequest) {
    return pendingRequest.senderId === currentUserId ? 'pending_sent' : 'pending_received';
  }

  return 'none';
}

/**
 * Get count of pending friend requests
 */
export async function getPendingRequestCount(userId: string): Promise<number> {
  return prisma.friendRequest.count({
    where: { receiverId: userId, status: FriendRequestStatus.PENDING }
  });
}

/**
 * Get mutual friends between two users
 */
export async function getMutualFriends(
  userId1: string,
  userId2: string,
  limit: number = 10
): Promise<Array<{ id: string; name: string; avatar: string | null }>> {
  // Get friends of user1
  const user1Friends = await prisma.friendship.findMany({
    where: { userId: userId1 },
    select: { friendId: true }
  });
  const user1FriendIds = user1Friends.map(f => f.friendId);

  // Get friends of user2 that are also friends of user1
  const mutualFriends = await prisma.friendship.findMany({
    where: {
      userId: userId2,
      friendId: { in: user1FriendIds }
    },
    take: limit,
    include: {
      friend: {
        select: { id: true, name: true, avatar: true }
      }
    }
  });

  return mutualFriends.map(f => f.friend);
}

// ─── BLOCK OPERATIONS ──────────────────────────────────────────────────────────

/**
 * Block a user
 */
export async function blockUser(userId: string, blockedUserId: string): Promise<void> {
  if (userId === blockedUserId) {
    throw new Error("Cannot block yourself");
  }

  // Check if already blocked
  const existing = await prisma.blockedUser.findUnique({
    where: { userId_blockedUserId: { userId, blockedUserId } }
  });

  if (existing) {
    throw new Error("User already blocked");
  }

  // Create block record
  await prisma.blockedUser.create({
    data: {
      userId,
      blockedUserId,
      blockedAt: new Date()
    }
  });

  // Optional: delete conversation with blocked user
  await prisma.conversation.deleteMany({
    where: {
      type: 'DIRECT',
      participants: {
        every: {
          userId: { in: [userId, blockedUserId] }
        }
      }
    }
  });
}

/**
 * Unblock a user
 */
export async function unblockUser(userId: string, blockedUserId: string): Promise<void> {
  await prisma.blockedUser.delete({
    where: { userId_blockedUserId: { userId, blockedUserId } }
  }).catch(() => {
    throw new Error("User not blocked");
  });
}

/**
 * Check if user is blocked by another user
 */
export async function isUserBlocked(userId: string, checkedById: string): Promise<boolean> {
  const block = await prisma.blockedUser.findUnique({
    where: { userId_blockedUserId: { userId: checkedById, blockedUserId: userId } }
  });
  return !!block;
}

/**
 * Get list of blocked users
 */
export async function getBlockedUsers(userId: string): Promise<Array<{ id: string; name: string; avatar: string | null }>> {
  const blocks = await prisma.blockedUser.findMany({
    where: { userId },
    include: {
      blockedUser: {
        select: { id: true, name: true, avatar: true }
      }
    }
  });

  return blocks.map(b => b.blockedUser);
}
