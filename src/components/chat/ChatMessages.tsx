"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  CheckCheck,
  Clock,
  Reply,
  Forward,
  Edit2,
  Trash2,
  MoreHorizontal,
  Download,
  Play,
  Pause,
  Smile,
  Loader2,
  Lock,
  Image as ImageIcon,
  Download as DownloadIcon,
  Eye,
  EyeOff
} from "lucide-react";
import type { MessageWithDetails } from "@/modules/chat/types/chat.types";
import { formatRelativeTime } from "@/modules/chat/utils/chat.utils";
import { useTypingIndicator } from "@/hooks/useChatSocket";
import { useMessageDecryption } from "@/hooks/useEncryption";

interface ChatMessagesProps {
  messages: MessageWithDetails[];
  currentUserId: string;
  conversationId: string;
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function ChatMessages({ 
  messages, 
  currentUserId, 
  conversationId,
  isLoading = false,
  onLoadMore,
  hasMore = false
}: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const { typingText } = useTypingIndicator(conversationId);
  
  // Decrypt messages
  const decryptedMessages = useMessageDecryption(messages);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (bottomRef.current && !showScrollButton) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showScrollButton]);

  // Handle scroll to detect if user is at bottom
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isAtBottom);

    // Load more when scrolling to top
    if (scrollTop < 100 && hasMore && !isLoading) {
      onLoadMore?.();
    }
  }, [hasMore, isLoading, onLoadMore]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Group messages by date
  const groupedMessages = groupMessagesByDate(decryptedMessages);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-4 scroll-smooth"
    >
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
        </div>
      )}

      {/* Messages grouped by date */}
      {Object.entries(groupedMessages).map(([date, msgs]) => (
        <div key={date}>
          {/* Date separator */}
          <div className="flex items-center justify-center my-3 sm:my-4">
            <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-slate-800/50 rounded-full text-[10px] sm:text-xs text-slate-400">
              {date}
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-1 sm:space-y-2">
            {msgs.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUserId}
                showAvatar={shouldShowAvatar(msgs, index, currentUserId)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Typing indicator */}
      <AnimatePresence>
        {typingText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-2 text-xs sm:text-sm text-slate-400"
          >
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            {typingText}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll anchor */}
      <div ref={bottomRef} />

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={scrollToBottom}
            className="fixed bottom-20 sm:bottom-28 right-4 sm:right-8 p-2 sm:p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-lg transition-colors"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// Message Bubble Component
interface MessageBubbleProps {
  message: MessageWithDetails;
  isOwn: boolean;
  showAvatar: boolean;
}

function MessageBubble({ message, isOwn, showAvatar }: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  // Handle deleted messages
  if (message.isDeleted && message.deletedForAll) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className="px-3 sm:px-4 py-1 sm:py-2 bg-slate-800/30 rounded-xl text-slate-500 text-xs sm:text-sm italic">
          This message was deleted
        </div>
      </div>
    );
  }

  const reactions = message.reactions || [];
  const uniqueReactions = [...new Set(reactions.map(r => r.emoji))];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group flex gap-1 sm:gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      {!isOwn && showAvatar ? (
        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
          {message.sender?.avatar ? (
            <img
              src={message.sender.avatar}
              alt={message.sender.name}
              className="w-full h-full rounded-full object-cover"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <span className="text-white text-[10px] sm:text-xs font-bold">
              {message.sender?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          )}
        </div>
      ) : !isOwn ? (
        <div className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
      ) : null}

      <div className={`flex flex-col max-w-[85%] sm:max-w-[70%] relative ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender name for group chats */}
        {!isOwn && showAvatar && message.sender && (
          <p className="text-[9px] sm:text-xs text-purple-400 mb-0.5 sm:mb-1 ml-1">
            {message.sender.name}
          </p>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div className={`mb-0.5 sm:mb-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg border-l-2 text-[9px] sm:text-xs ${
            isOwn ? 'border-purple-400 bg-purple-900/20' : 'border-slate-400 bg-slate-800/30'
          }`}>
            <p className="text-slate-400">{message.replyTo.senderName}</p>
            <p className="text-slate-300 truncate">{message.replyTo.content}</p>
          </div>
        )}

        {/* Message content */}
        <div className="relative">
          <div
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl ${
              isOwn
                ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white'
                : 'bg-slate-800 text-white'
            } ${message.type !== 'TEXT' ? 'p-1 sm:p-2' : ''}`}
          >
            <MessageContent message={message} isOwn={isOwn} />

            {/* Timestamp and status */}
            <div className={`flex items-center gap-1 mt-0.5 text-[9px] sm:text-[10px] ${isOwn ? 'justify-end' : ''}`}>
              {message.isEncrypted && (
                <Lock className="w-2 h-2 sm:w-3 sm:h-3 opacity-50" />
              )}
              <span className="opacity-60">
                {formatRelativeTime(new Date(message.createdAt))}
              </span>
              {message.isEdited && (
                <span className="opacity-50">edited</span>
              )}
              {isOwn && (
                <MessageStatus status={message.status} />
              )}
            </div>
          </div>

          {/* Reactions */}
          {uniqueReactions.length > 0 && (
            <div className={`absolute -bottom-2 sm:-bottom-3 ${isOwn ? 'right-1 sm:right-2' : 'left-1 sm:left-2'} flex gap-0.5`}>
              {uniqueReactions.slice(0, 3).map((emoji) => (
                <span
                  key={emoji}
                  className="w-4 h-4 sm:w-5 sm:h-5 bg-slate-700 rounded-full flex items-center justify-center text-xs border border-slate-800"
                >
                  {emoji}
                </span>
              ))}
              {uniqueReactions.length > 3 && (
                <span className="w-4 h-4 sm:w-5 sm:h-5 bg-slate-700 rounded-full flex items-center justify-center text-[8px] sm:text-[10px] text-slate-300 border border-slate-800">
                  +{uniqueReactions.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action menu (on hover) */}
        <div
          className={`absolute top-0 ${isOwn ? '-left-16 sm:-left-20' : '-right-16 sm:-right-20'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 sm:gap-1`}
        >
          <button
            className="p-1 sm:p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Reply"
          >
            <Reply size={12} className="sm:w-[14px] sm:h-[14px]" />
          </button>
          <button
            className="p-1 sm:p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="React"
            onClick={() => setShowReactions(!showReactions)}
          >
            <Smile size={12} className="sm:w-[14px] sm:h-[14px]" />
          </button>
          <button
            className="p-1 sm:p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="More"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreHorizontal size={12} className="sm:w-[14px] sm:h-[14px]" />
          </button>
        </div>

        {/* Reaction picker */}
        <AnimatePresence>
          {showReactions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`absolute top-0 ${isOwn ? '-left-36 sm:-left-40' : '-right-36 sm:-right-40'} p-2 bg-slate-800 rounded-lg border border-white/10 flex gap-1 z-10`}
            >
              {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setShowReactions(false)}
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-white/10 rounded transition-colors text-sm sm:text-lg"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* More options menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`absolute top-8 ${isOwn ? 'right-0' : 'left-0'} w-32 sm:w-36 py-1 bg-slate-800 rounded-lg border border-white/10 shadow-xl z-10`}
            >
              <button className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs sm:text-sm text-white hover:bg-white/5 flex items-center gap-2">
                <Forward size={12} className="sm:w-[14px] sm:h-[14px]" />
                Forward
              </button>
              {isOwn && (
                <>
                  <button className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs sm:text-sm text-white hover:bg-white/5 flex items-center gap-2">
                    <Edit2 size={12} className="sm:w-[14px] sm:h-[14px]" />
                    Edit
                  </button>
                  <button className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs sm:text-sm text-red-400 hover:bg-white/5 flex items-center gap-2">
                    <Trash2 size={12} className="sm:w-[14px] sm:h-[14px]" />
                    Delete
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Message Content by Type
function MessageContent({ message, isOwn }: { message: MessageWithDetails; isOwn: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);

  switch (message.type) {
    case 'IMAGE':
      return (
        <div className="max-w-xs sm:max-w-sm rounded-lg overflow-hidden">
          <img
            src={message.mediaUrl || ''}
            alt="Image"
            className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
        </div>
      );

    case 'VIDEO':
      return (
        <div className="max-w-xs sm:max-w-sm rounded-lg overflow-hidden relative group">
          <video
            src={message.mediaUrl || ''}
            className="w-full rounded-lg"
            controls
            crossOrigin="anonymous"
          />
        </div>
      );

    case 'DOCUMENT':
      const meta = message.mediaMeta as any;
      return (
        <a
          href={message.mediaUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium truncate">{meta?.fileName || 'Document'}</p>
            <p className="text-[10px] sm:text-xs opacity-60">{meta?.size || 'Download'}</p>
          </div>
          <Download size={14} className="opacity-60 flex-shrink-0 sm:w-4 sm:h-4" />
        </a>
      );

    case 'VOICE':
      const voiceMeta = message.mediaMeta as any;
      return (
        <div className="flex items-center gap-2 sm:gap-3 min-w-[160px] sm:min-w-[200px]">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0"
          >
            {isPlaying ? <Pause size={14} className="sm:w-[18px] sm:h-[18px]" /> : <Play size={14} className="sm:w-[18px] sm:h-[18px] ml-0.5" />}
          </button>
          <div className="flex-1">
            {/* Waveform visualization */}
            <div className="flex items-center gap-0.5 h-5 sm:h-6">
              {(voiceMeta?.waveform || Array(30).fill(0.5)).map((h: number, i: number) => (
                <div
                  key={i}
                  className={`w-0.5 sm:w-1 bg-current rounded-full ${isPlaying ? 'animate-pulse' : ''}`}
                  style={{
                    height: `${Math.max(4, h * 24)}px`,
                    opacity: isOwn ? 0.8 : 0.6
                  }}
                />
              ))}
            </div>
            <p className="text-[10px] sm:text-xs opacity-60 mt-0.5 sm:mt-1">
              {voiceMeta?.duration ? `${Math.floor(voiceMeta.duration / 60)}:${String(voiceMeta.duration % 60).padStart(2, '0')}` : '0:00'}
            </p>
          </div>
        </div>
      );

    case 'SYSTEM':
      return (
        <p className="text-xs sm:text-sm text-center text-slate-400 italic">
          {message.content}
        </p>
      );

    default:
      return (
        <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
      );
  }
}

// Message Status Icon
function MessageStatus({ status }: { status?: string }) {
  switch (status) {
    case 'SEEN':
      return <CheckCheck size={14} className="text-blue-400" />;
    case 'DELIVERED':
      return <CheckCheck size={14} className="opacity-60" />;
    case 'SENT':
      return <Check size={14} className="opacity-60" />;
    default:
      return <Clock size={12} className="opacity-40" />;
  }
}

// Helper functions
function groupMessagesByDate(messages: MessageWithDetails[]): Record<string, MessageWithDetails[]> {
  return messages.reduce((groups, message) => {
    const date = new Date(message.createdAt);
    const dateKey = formatDateKey(date);
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    return groups;
  }, {} as Record<string, MessageWithDetails[]>);
}

function formatDateKey(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function shouldShowAvatar(
  messages: MessageWithDetails[], 
  index: number, 
  currentUserId: string
): boolean {
  const msg = messages[index];
  if (msg.senderId === currentUserId) return false;
  if (index === 0) return true;
  
  const prevMsg = messages[index - 1];
  return prevMsg.senderId !== msg.senderId;
}
