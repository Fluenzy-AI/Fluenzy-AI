// Chat System Types
// ═══════════════════════════════════════════════════════════════════════════════

import { 
  FriendRequest, 
  Friendship, 
  ChatGroup, 
  GroupMember, 
  Conversation, 
  ConversationParticipant, 
  Message, 
  MessageReadStatus, 
  MessageReaction,
  FriendRequestStatus,
  GroupRole,
  ConversationType,
  MessageType,
  MessageStatus
} from "@prisma/client";

// Re-export enums for convenience
export { 
  FriendRequestStatus, 
  GroupRole, 
  ConversationType, 
  MessageType, 
  MessageStatus 
};

// ─── FRIEND TYPES ──────────────────────────────────────────────────────────────
export interface FriendRequestWithUsers extends FriendRequest {
  sender: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  receiver: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

export interface FriendWithProfile extends Friendship {
  friend: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    profile?: {
      username: string;
      headline?: string | null;
    } | null;
  };
}

export interface SendFriendRequestInput {
  receiverId: string;
  message?: string;
}

export interface FriendRequestResponse {
  success: boolean;
  message: string;
  request?: FriendRequestWithUsers;
}

// ─── GROUP TYPES ───────────────────────────────────────────────────────────────
export interface ChatGroupWithMembers extends ChatGroup {
  members: GroupMemberWithUser[];
  _count?: {
    members: number;
  };
}

export interface GroupMemberWithUser extends GroupMember {
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  avatar?: string;
  memberIds: string[];
}

export interface UpdateGroupInput {
  name?: string;
  description?: string;
  avatar?: string;
}

export interface AddGroupMembersInput {
  memberIds: string[];
}

// ─── CONVERSATION TYPES ────────────────────────────────────────────────────────
export interface ConversationWithDetails extends Conversation {
  participants: ConversationParticipantWithUser[];
  group?: ChatGroupWithMembers | null;
  messages?: MessageWithDetails[];
  _count?: {
    messages: number;
  };
}

export interface ConversationParticipantWithUser extends ConversationParticipant {
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

export interface ConversationListItem {
  id: string;
  type: ConversationType;
  name: string;
  avatar?: string | null;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  participants?: {
    id: string;
    name: string | null;
    avatar: string | null;
  }[];
}

// ─── MESSAGE TYPES ─────────────────────────────────────────────────────────────
export interface MessageWithDetails extends Message {
  sender: {
    id: string;
    name: string;
    avatar: string | null;
  };
  replyTo?: {
    id: string;
    content: string | null;
    senderId: string;
    senderName: string;
    type: MessageType;
  } | null;
  reactions: MessageReactionWithUser[];
  readStatus: MessageReadStatus[];
}

export interface MessageReactionWithUser extends MessageReaction {
  user: {
    id: string;
    name: string;
  };
}

export interface SendMessageInput {
  conversationId: string;
  type?: MessageType;
  content?: string;
  mediaUrl?: string;
  mediaMeta?: MediaMeta;
  replyToId?: string;
  mentions?: string[];
  // Encryption
  isEncrypted?: boolean;
  encryptedContent?: string;
  nonce?: string;
  keyVersion?: number;
}

export interface EditMessageInput {
  messageId: string;
  content: string;
}

export interface DeleteMessageInput {
  messageId: string;
  forEveryone?: boolean;
}

export interface ForwardMessageInput {
  messageId: string;
  conversationIds: string[];
}

export interface AddReactionInput {
  messageId: string;
  emoji: string;
}

export interface MediaMeta {
  duration?: number;      // For voice/video
  waveform?: number[];    // For voice
  width?: number;         // For images/videos
  height?: number;        // For images/videos
  size?: number;          // File size in bytes
  mimeType?: string;      // MIME type
  fileName?: string;      // Original file name
  thumbnail?: string;     // Thumbnail URL for videos
}

// ─── SOCKET EVENT TYPES ────────────────────────────────────────────────────────
export interface SocketMessageEvent {
  conversationId: string;
  message: MessageWithDetails;
}

export interface SocketTypingEvent {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface SocketReadEvent {
  conversationId: string;
  messageIds: string[];
  userId: string;
  readAt: Date;
}

export interface SocketPresenceEvent {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface SocketReactionEvent {
  messageId: string;
  conversationId: string;
  userId: string;
  userName: string;
  emoji: string;
  action: 'add' | 'remove';
}

// ─── API RESPONSE TYPES ────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiResponse<T = void> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// ─── PRESENCE TYPES ────────────────────────────────────────────────────────────
export interface UserPresence {
  userId: string;
  isOnline: boolean;
  lastSeen: Date;
  socketId?: string;
}

export interface TypingStatus {
  conversationId: string;
  userId: string;
  userName: string;
  timestamp: number;
}
