// Chat Utility Functions
// ═══════════════════════════════════════════════════════════════════════════════

import { ConversationType } from "../types/chat.types";

/**
 * Generate a unique conversation ID for direct messages
 * Ensures consistent ID regardless of user order
 */
export function generateDirectConversationKey(userId1: string, userId2: string): string {
  const sorted = [userId1, userId2].sort();
  return `direct:${sorted[0]}:${sorted[1]}`;
}

/**
 * Extract mentions from message content
 * Returns array of usernames mentioned with @
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const matches = content.match(mentionRegex);
  if (!matches) return [];
  return matches.map(m => m.substring(1)); // Remove @ prefix
}

/**
 * Format message preview for conversation list
 * Truncates and adds type prefix for media messages
 */
export function formatMessagePreview(
  content: string | null, 
  type: string, 
  senderName?: string
): string {
  const prefix = senderName ? `${senderName.split(' ')[0]}: ` : '';
  
  switch (type) {
    case 'IMAGE':
      return `${prefix}📷 Photo`;
    case 'VIDEO':
      return `${prefix}🎥 Video`;
    case 'DOCUMENT':
      return `${prefix}📄 Document`;
    case 'VOICE':
      return `${prefix}🎤 Voice message`;
    case 'SYSTEM':
      return content || 'System message';
    default:
      if (!content) return '';
      const truncated = content.length > 50 ? content.substring(0, 50) + '...' : content;
      return `${prefix}${truncated}`;
  }
}

/**
 * Format duration in seconds to mm:ss format
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get conversation display name
 * For direct chats, returns other user's name
 * For groups, returns group name
 */
export function getConversationDisplayName(
  conversation: {
    type: ConversationType;
    group?: { name: string } | null;
    participants: Array<{ user: { id: string; name: string } }>;
  },
  currentUserId: string
): string {
  if (conversation.type === 'GROUP' && conversation.group) {
    return conversation.group.name;
  }
  
  // For direct messages, find the other participant
  const otherParticipant = conversation.participants.find(
    p => p.user.id !== currentUserId
  );
  
  return otherParticipant?.user.name || 'Unknown User';
}

/**
 * Get conversation avatar
 */
export function getConversationAvatar(
  conversation: {
    type: ConversationType;
    group?: { avatar: string | null } | null;
    participants: Array<{ user: { id: string; avatar: string | null } }>;
  },
  currentUserId: string
): string | null {
  if (conversation.type === 'GROUP' && conversation.group) {
    return conversation.group.avatar;
  }
  
  const otherParticipant = conversation.participants.find(
    p => p.user.id !== currentUserId
  );
  
  return otherParticipant?.user.avatar || null;
}

/**
 * Check if user can send message in conversation
 */
export function canSendMessage(
  conversation: {
    type: ConversationType;
    participants: Array<{ userId: string }>;
  },
  userId: string
): boolean {
  return conversation.participants.some(p => p.userId === userId);
}

/**
 * Check if user can manage group
 */
export function canManageGroup(
  role: string | undefined
): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

/**
 * Check if user is group owner
 */
export function isGroupOwner(role: string | undefined): boolean {
  return role === 'OWNER';
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Format relative time (e.g., "2m ago", "1h ago", "Yesterday")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = now.getTime() - d.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  
  return d.toLocaleDateString();
}

/**
 * Format message timestamp for chat bubble
 */
export function formatMessageTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format date separator in chat
 */
export function formatDateSeparator(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const messageDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  
  if (messageDate.getTime() === today.getTime()) return 'Today';
  if (messageDate.getTime() === yesterday.getTime()) return 'Yesterday';
  
  return d.toLocaleDateString(undefined, { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

/**
 * Group messages by date for rendering
 */
export function groupMessagesByDate<T extends { createdAt: Date | string }>(
  messages: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  
  messages.forEach(msg => {
    const date = typeof msg.createdAt === 'string' 
      ? new Date(msg.createdAt) 
      : msg.createdAt;
    const dateKey = date.toDateString();
    
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(msg);
  });
  
  return groups;
}

/**
 * Validate message content
 */
export function validateMessageContent(content: string): { valid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  if (content.length > 10000) {
    return { valid: false, error: 'Message too long (max 10000 characters)' };
  }
  return { valid: true };
}

/**
 * Get file extension from URL or filename
 */
export function getFileExtension(url: string): string {
  const parts = url.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Determine message type from file mime type
 */
export function getMessageTypeFromMime(mimeType: string): 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'VOICE' {
  if (mimeType.startsWith('image/')) return 'IMAGE';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  if (mimeType.startsWith('audio/')) return 'VOICE';
  return 'DOCUMENT';
}
