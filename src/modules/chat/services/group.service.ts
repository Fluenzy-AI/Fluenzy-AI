// Group Service
// Handles group creation, management, and membership operations
// ═══════════════════════════════════════════════════════════════════════════════

import prisma from "@/lib/prisma";
import { GroupRole, ConversationType } from "@prisma/client";
import type {
  ChatGroupWithMembers,
  CreateGroupInput,
  UpdateGroupInput,
  AddGroupMembersInput,
  PaginatedResponse
} from "../types/chat.types";

// ─── GROUP CREATION & MANAGEMENT ───────────────────────────────────────────────

/**
 * Create a new chat group
 */
export async function createGroup(
  creatorId: string,
  input: CreateGroupInput
): Promise<ChatGroupWithMembers> {
  const { name, description, avatar, memberIds } = input;

  // Validate name
  if (!name || name.trim().length < 1) {
    throw new Error("Group name is required");
  }
  if (name.length > 100) {
    throw new Error("Group name too long (max 100 characters)");
  }

  // Ensure creator is included in members
  const allMemberIds = [...new Set([creatorId, ...memberIds])];

  // Validate all members exist
  const users = await prisma.users.findMany({
    where: { id: { in: allMemberIds } },
    select: { id: true }
  });

  if (users.length !== allMemberIds.length) {
    throw new Error("One or more users not found");
  }

  // Create group with members and conversation in transaction
  const group = await prisma.$transaction(async (tx) => {
    // Create the group
    const newGroup = await tx.chatGroup.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        avatar,
        createdBy: creatorId,
        members: {
          create: allMemberIds.map(userId => ({
            userId,
            role: userId === creatorId ? GroupRole.OWNER : GroupRole.MEMBER
          }))
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        },
        _count: { select: { members: true } }
      }
    });

    // Create associated conversation
    await tx.conversation.create({
      data: {
        type: ConversationType.GROUP,
        groupId: newGroup.id,
        participants: {
          create: allMemberIds.map(userId => ({
            userId
          }))
        }
      }
    });

    return newGroup;
  });

  return group;
}

/**
 * Update group details (name, description, avatar)
 */
export async function updateGroup(
  userId: string,
  groupId: string,
  input: UpdateGroupInput
): Promise<ChatGroupWithMembers> {
  // Check user is admin/owner
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } }
  });

  if (!member) throw new Error("Not a member of this group");
  if (member.role === GroupRole.MEMBER) {
    throw new Error("Only admins can update group details");
  }

  const { name, description, avatar } = input;

  if (name !== undefined && name.trim().length < 1) {
    throw new Error("Group name cannot be empty");
  }

  return prisma.chatGroup.update({
    where: { id: groupId },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() }),
      ...(avatar !== undefined && { avatar })
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } }
        }
      },
      _count: { select: { members: true } }
    }
  });
}

/**
 * Archive/unarchive a group (soft delete)
 */
export async function archiveGroup(
  userId: string,
  groupId: string,
  archive: boolean = true
): Promise<void> {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } }
  });

  if (!member || member.role !== GroupRole.OWNER) {
    throw new Error("Only the owner can archive this group");
  }

  await prisma.chatGroup.update({
    where: { id: groupId },
    data: { isArchived: archive }
  });
}

// ─── MEMBER MANAGEMENT ─────────────────────────────────────────────────────────

/**
 * Add members to a group
 */
export async function addGroupMembers(
  userId: string,
  groupId: string,
  input: AddGroupMembersInput
): Promise<ChatGroupWithMembers> {
  const { memberIds } = input;

  // Check user is admin/owner
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } }
  });

  if (!member) throw new Error("Not a member of this group");
  if (member.role === GroupRole.MEMBER) {
    throw new Error("Only admins can add members");
  }

  // Validate users exist
  const users = await prisma.users.findMany({
    where: { id: { in: memberIds } },
    select: { id: true }
  });

  if (users.length !== memberIds.length) {
    throw new Error("One or more users not found");
  }

  // Get conversation for this group
  const conversation = await prisma.conversation.findUnique({
    where: { groupId }
  });

  if (!conversation) throw new Error("Group conversation not found");

  // Add members to both group and conversation
  await prisma.$transaction(async (tx) => {
    // Add to group (skip if already member)
    for (const memberId of memberIds) {
      await tx.groupMember.upsert({
        where: { groupId_userId: { groupId, userId: memberId } },
        create: { groupId, userId: memberId, role: GroupRole.MEMBER },
        update: {} // No update if exists
      });

      // Add to conversation
      await tx.conversationParticipant.upsert({
        where: { conversationId_userId: { conversationId: conversation.id, userId: memberId } },
        create: { conversationId: conversation.id, userId: memberId },
        update: {}
      });
    }
  });

  return getGroup(groupId);
}

/**
 * Remove a member from a group
 */
export async function removeGroupMember(
  userId: string,
  groupId: string,
  targetUserId: string
): Promise<void> {
  const [actorMember, targetMember] = await Promise.all([
    prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    }),
    prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } }
    })
  ]);

  if (!actorMember) throw new Error("Not a member of this group");
  if (!targetMember) throw new Error("Target user is not a member");
  
  // Cannot remove owner
  if (targetMember.role === GroupRole.OWNER) {
    throw new Error("Cannot remove the group owner");
  }

  // Only owner can remove admins, admins can remove members
  if (targetMember.role === GroupRole.ADMIN && actorMember.role !== GroupRole.OWNER) {
    throw new Error("Only the owner can remove admins");
  }

  if (actorMember.role === GroupRole.MEMBER && userId !== targetUserId) {
    throw new Error("Only admins can remove members");
  }

  // Get conversation
  const conversation = await prisma.conversation.findUnique({
    where: { groupId }
  });

  // Remove from group and conversation
  await prisma.$transaction([
    prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId: targetUserId } }
    }),
    ...(conversation ? [
      prisma.conversationParticipant.delete({
        where: { conversationId_userId: { conversationId: conversation.id, userId: targetUserId } }
      })
    ] : [])
  ]);
}

/**
 * Leave a group
 */
export async function leaveGroup(userId: string, groupId: string): Promise<void> {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } }
  });

  if (!member) throw new Error("Not a member of this group");

  // If owner, must transfer ownership first
  if (member.role === GroupRole.OWNER) {
    const otherMembers = await prisma.groupMember.findMany({
      where: { groupId, userId: { not: userId } },
      orderBy: { joinedAt: 'asc' }
    });

    if (otherMembers.length === 0) {
      // Last member - delete the group
      await prisma.chatGroup.delete({ where: { id: groupId } });
      return;
    }

    throw new Error("Transfer ownership before leaving");
  }

  await removeGroupMember(userId, groupId, userId);
}

/**
 * Promote a member to admin
 */
export async function promoteToAdmin(
  userId: string,
  groupId: string,
  targetUserId: string
): Promise<void> {
  const actorMember = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } }
  });

  if (!actorMember || actorMember.role !== GroupRole.OWNER) {
    throw new Error("Only the owner can promote members");
  }

  await prisma.groupMember.update({
    where: { groupId_userId: { groupId, userId: targetUserId } },
    data: { role: GroupRole.ADMIN }
  });
}

/**
 * Demote an admin to member
 */
export async function demoteToMember(
  userId: string,
  groupId: string,
  targetUserId: string
): Promise<void> {
  const actorMember = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } }
  });

  if (!actorMember || actorMember.role !== GroupRole.OWNER) {
    throw new Error("Only the owner can demote admins");
  }

  await prisma.groupMember.update({
    where: { groupId_userId: { groupId, userId: targetUserId } },
    data: { role: GroupRole.MEMBER }
  });
}

/**
 * Transfer group ownership
 */
export async function transferOwnership(
  userId: string,
  groupId: string,
  newOwnerId: string
): Promise<void> {
  const [currentOwner, newOwner] = await Promise.all([
    prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    }),
    prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: newOwnerId } }
    })
  ]);

  if (!currentOwner || currentOwner.role !== GroupRole.OWNER) {
    throw new Error("Only the owner can transfer ownership");
  }

  if (!newOwner) {
    throw new Error("New owner must be a group member");
  }

  await prisma.$transaction([
    prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId } },
      data: { role: GroupRole.ADMIN }
    }),
    prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId: newOwnerId } },
      data: { role: GroupRole.OWNER }
    })
  ]);
}

// ─── GROUP QUERIES ─────────────────────────────────────────────────────────────

/**
 * Get a group by ID with members
 */
export async function getGroup(groupId: string): Promise<ChatGroupWithMembers> {
  const group = await prisma.chatGroup.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } }
        },
        orderBy: [
          { role: 'asc' }, // OWNER first, then ADMIN, then MEMBER
          { joinedAt: 'asc' }
        ]
      },
      _count: { select: { members: true } }
    }
  });

  if (!group) throw new Error("Group not found");
  return group;
}

/**
 * Get user's groups with pagination
 */
export async function getUserGroups(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<ChatGroupWithMembers>> {
  const skip = (page - 1) * limit;

  const [memberships, total] = await Promise.all([
    prisma.groupMember.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { joinedAt: 'desc' },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, email: true, avatar: true } }
              },
              take: 5 // Only get first 5 members for preview
            },
            _count: { select: { members: true } }
          }
        }
      }
    }),
    prisma.groupMember.count({ where: { userId } })
  ]);

  const groups = memberships
    .map(m => m.group)
    .filter((g): g is NonNullable<typeof g> => g !== null && !g.isArchived);

  return {
    data: groups,
    total,
    page,
    limit,
    hasMore: skip + groups.length < total
  };
}

/**
 * Get user's role in a group
 */
export async function getUserGroupRole(
  userId: string,
  groupId: string
): Promise<GroupRole | null> {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } }
  });
  return member?.role ?? null;
}

/**
 * Check if user is a member of a group
 */
export async function isGroupMember(userId: string, groupId: string): Promise<boolean> {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } }
  });
  return !!member;
}

/**
 * Search groups user can join (public groups or groups they're invited to)
 */
export async function searchGroups(
  userId: string,
  search: string,
  limit: number = 20
): Promise<ChatGroupWithMembers[]> {
  // For now, only return groups user is already a member of
  // Future: implement public groups or invite system
  const memberships = await prisma.groupMember.findMany({
    where: {
      userId,
      group: {
        name: { contains: search, mode: 'insensitive' },
        isArchived: false
      }
    },
    take: limit,
    include: {
      group: {
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, avatar: true } }
            },
            take: 5
          },
          _count: { select: { members: true } }
        }
      }
    }
  });

  return memberships
    .map(m => m.group)
    .filter((g): g is NonNullable<typeof g> => g !== null);
}
