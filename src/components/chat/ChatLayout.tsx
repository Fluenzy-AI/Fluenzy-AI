"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Users,
  Search,
  Plus,
  Settings,
  Filter,
  X,
  Loader2,
  Pin,
  Archive,
  Bell,
  Trash2
} from "lucide-react";
import { ChatSidebar } from "./ChatSidebar";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { FriendRequestPanel } from "./FriendRequestPanel";
import { useChatSocket } from "@/hooks/useChatSocket";
import type { ConversationListItem, MessageWithDetails } from "@/modules/chat/types/chat.types";

interface ChatLayoutProps {
  userId: string;
  userName: string;
  initialConversations?: ConversationListItem[];
}

export function ChatLayout({ userId, userName, initialConversations = [] }: ChatLayoutProps) {
  // ============================================
  // STATE MANAGEMENT (STRICT STRUCTURE)
  // ============================================

  // Sidebar State
  const [conversations, setConversations] = useState<ConversationListItem[]>(initialConversations);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);

  // Chat Selection State
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ConversationListItem | null>(null);

  // Chat Messages State (MAIN BUSINESS LOGIC)
  const [messages, setMessages] = useState<MessageWithDetails[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile drawer starts closed
  const [debugMode] = useState(false); // Set to true for debugging
  const [showSettings, setShowSettings] = useState(false);

  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  // ============================================
  // SOCKET SETUP
  // ============================================
  const {
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage: emitMessage,
    sendTyping,
    sendRead
  } = useChatSocket({
    onMessage: (conversationId, message) => {
      // Only add if it's for the currently selected conversation
      if (conversationId === selectedConversationId) {
        setMessages(prev => [...prev, message]);
        sendRead(conversationId, [message.id]);
      }

      // Update sidebar preview
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              lastMessage: message.content || `[${message.type}]`,
              lastMessageAt: new Date(),
              unreadCount: selectedConversationId === conversationId ? 0 : conv.unreadCount + 1
            };
          }
          return conv;
        });
        return updated.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          const aTime = a.lastMessageAt?.getTime() ?? 0;
          const bTime = b.lastMessageAt?.getTime() ?? 0;
          return bTime - aTime;
        });
      });
    },
    onRead: (event) => {
      if (selectedConversationId === event.conversationId) {
        setMessages(prev => prev.map(msg => {
          if (event.messageIds.includes(msg.id)) {
            return { ...msg, status: 'SEEN' };
          }
          return msg;
        }));
      }
    },
    onReaction: (event) => {
      if (selectedConversationId === event.conversationId) {
        setMessages(prev => prev.map(msg => {
          if (msg.id === event.messageId) {
            if (event.action === 'add') {
              return {
                ...msg,
                reactions: [...msg.reactions, {
                  id: `${event.messageId}-${event.userId}-${event.emoji}`,
                  messageId: event.messageId,
                  userId: event.userId,
                  emoji: event.emoji,
                  createdAt: new Date(),
                  user: { id: event.userId, name: event.userName }
                }]
              };
            } else {
              return {
                ...msg,
                reactions: msg.reactions.filter(
                  r => !(r.userId === event.userId && r.emoji === event.emoji)
                )
              };
            }
          }
          return msg;
        }));
      }
    },
    onMessageUpdate: (data) => {
      if (selectedConversationId === data.conversationId) {
        setMessages(prev => prev.map(msg => {
          if (msg.id === data.messageId) {
            if (data.action === 'edit' && data.content !== undefined) {
              return { ...msg, content: data.content, isEdited: true };
            } else if (data.action === 'delete') {
              return { ...msg, isDeleted: true, deletedForAll: true, content: null };
            }
          }
          return msg;
        }));
      }
    }
  });

  // ============================================
  // LOAD FRIEND REQUESTS ON MOUNT
  // ============================================
  useEffect(() => {
    async function loadRequests() {
      try {
        const res = await fetch("/api/chat/friends?type=received");
        if (res.ok) {
          const data = await res.json();
          setFriendRequests(data.requests || []);
        }
      } catch (error) {
        console.error("Failed to load friend requests:", error);
      }
    }
    loadRequests();
  }, []);

  // ============================================
  // CRITICAL FIX: SYNC CHAT SELECTION
  // ============================================
  // When selectedConversationId changes, update selectedConversation
  useEffect(() => {
    if (selectedConversationId) {
      const conv = conversations.find(c => c.id === selectedConversationId);
      setSelectedConversation(conv || null);
    } else {
      setSelectedConversation(null);
    }
  }, [selectedConversationId, conversations]);

  // ============================================
  // CRITICAL FIX: FETCH MESSAGES WHEN CONVERSATION CHANGES
  // ============================================
  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      setMessageError(null);
      return;
    }

    // Cancel previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    async function fetchMessages() {
      setIsLoadingMessages(true);
      setMessageError(null);

      try {
        const res = await fetch(
          `/api/chat/conversations/${selectedConversationId}`,
          { signal: abortController.signal }
        );

        if (!res.ok) {
          throw new Error(`Failed to load messages: ${res.statusText}`);
        }

        const data = await res.json();

        // Handle different response formats
        const messagesData = data.messages?.data || data.messages || [];

        if (Array.isArray(messagesData)) {
          setMessages(messagesData);
          setMessageError(null);
        } else {
          setMessages([]);
          setMessageError("Invalid message format");
        }

        // Join conversation for real-time updates
        if (selectedConversationId) {
          joinConversation(selectedConversationId);
        }

        // Mark as read
        setConversations(prev => prev.map(conv =>
          conv.id === selectedConversationId ? { ...conv, unreadCount: 0 } : conv
        ));
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error("Failed to load messages:", error);
          setMessageError(error.message || "Failed to load messages");
          setMessages([]);
        }
      } finally {
        setIsLoadingMessages(false);
      }
    }

    fetchMessages();

    // Cleanup
    return () => {
      abortController.abort();
      if (selectedConversation?.id) {
        leaveConversation(selectedConversation.id);
      }
    };
  }, [selectedConversationId, selectedConversation?.id, joinConversation, leaveConversation]);

  // ============================================
  // HANDLE CONVERSATION SELECTION
  // ============================================
  const handleSelectConversation = useCallback((conversation: ConversationListItem) => {
    setSelectedConversationId(conversation.id);
    // Close sidebar drawer on mobile after selection
    if (window.innerWidth < 640) {
      setIsSidebarOpen(false);
    }
  }, []);

  // ============================================
  // HANDLE MENU OPERATIONS
  // ============================================
  const getOtherUser = () => {
    if (!selectedConversation?.participants) return null;
    return selectedConversation.participants.find(p => p.id !== userId);
  };

  const handleViewProfile = async () => {
    const otherUser = getOtherUser();
    if (!otherUser?.id) return;

    try {
      // Fetch user profile to get username
      const res = await fetch(`/api/public-profile/${otherUser.id}`);
      if (res.ok) {
        const data = await res.json();
        const username = data.profile?.username || otherUser.id;
        window.location.href = `/u/${username}`;
      } else {
        // Fallback to userId if username fetch fails
        window.location.href = `/u/${otherUser.id}`;
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Fallback to userId
      window.location.href = `/u/${otherUser.id}`;
    }
  };

  const handleBlockUser = async () => {
    const otherUser = getOtherUser();
    if (!otherUser?.id) return;

    try {
      const res = await fetch('/api/chat/friends/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedUserId: otherUser.id })
      });

      if (res.ok) {
        setShowSettings(false);
        setSelectedConversationId(null);
        // Refresh conversations
        const convRes = await fetch('/api/chat/conversations');
        if (convRes.ok) {
          const data = await convRes.json();
          setConversations(data.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to block user:', error);
    }
  };

  const handlePinConversation = async () => {
    if (!selectedConversationId) return;

    try {
      await fetch(`/api/chat/conversations/${selectedConversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pin',
          value: !selectedConversation?.isPinned
        })
      });

      setConversations(prev =>
        prev.map(conv =>
          conv.id === selectedConversationId
            ? { ...conv, isPinned: !conv.isPinned }
            : conv
        )
      );
    } catch (error) {
      console.error('Failed to pin conversation:', error);
    }
  };

  const handleMuteConversation = async () => {
    if (!selectedConversationId) return;

    try {
      await fetch(`/api/chat/conversations/${selectedConversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mute',
          value: !selectedConversation?.isMuted
        })
      });

      setConversations(prev =>
        prev.map(conv =>
          conv.id === selectedConversationId
            ? { ...conv, isMuted: !conv.isMuted }
            : conv
        )
      );
    } catch (error) {
      console.error('Failed to mute conversation:', error);
    }
  };

  const handleArchiveConversation = async () => {
    if (!selectedConversationId) return;

    try {
      await fetch(`/api/chat/conversations/${selectedConversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'archive',
          value: true
        })
      });

      setShowSettings(false);
      setSelectedConversationId(null);
      setConversations(prev =>
        prev.filter(conv => conv.id !== selectedConversationId)
      );
    } catch (error) {
      console.error('Failed to archive conversation:', error);
    }
  };

  const handleClearHistory = async () => {
    if (!selectedConversationId) return;

    try {
      await fetch(`/api/chat/conversations/${selectedConversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clearHistory' })
      });

      setMessages([]);
      setShowSettings(false);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedConversationId) return;

    try {
      await fetch(`/api/chat/conversations/${selectedConversationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      setShowSettings(false);
      setSelectedConversationId(null);
      setConversations(prev =>
        prev.filter(conv => conv.id !== selectedConversationId)
      );
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  // ============================================
  // HANDLE SEND MESSAGE
  // ============================================
  const handleSendMessage = useCallback(async (
    content: string,
    type: string = 'TEXT',
    mediaMeta?: any,
    encrypted?: { encryptedContent: string; nonce: string; keyVersion: number }
  ) => {
    if (!selectedConversationId) return;

    try {
      const body: any = {
        conversationId: selectedConversationId,
        type,
        content: type === 'TEXT' ? content : undefined,
        mediaUrl: type !== 'TEXT' ? content : undefined,
        mediaMeta
      };

      if (encrypted) {
        body.isEncrypted = true;
        body.encryptedContent = encrypted.encryptedContent;
        body.nonce = encrypted.nonce;
        body.keyVersion = encrypted.keyVersion;
      }

      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        const message = data.message;

        // Add to messages
        setMessages(prev => [...prev, message]);

        // Emit via socket
        emitMessage(selectedConversationId, message);

        // Update sidebar
        setConversations(prev => {
          const updated = prev.map(conv => {
            if (conv.id === selectedConversationId) {
              return {
                ...conv,
                lastMessage: content || `[${type}]`,
                lastMessageAt: new Date()
              };
            }
            return conv;
          });
          return updated.sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            const aTime = a.lastMessageAt?.getTime() ?? 0;
            const bTime = b.lastMessageAt?.getTime() ?? 0;
            return bTime - aTime;
          });
        });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }, [selectedConversationId, emitMessage]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <>
      {/* Mobile overlay for sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 sm:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="flex h-full w-full bg-slate-950 rounded-none overflow-hidden border-0 text-white dark">
        {/* Mobile Sidebar Drawer */}
        <AnimatePresence mode="wait">
          {isSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0, x: -320 }}
              animate={{ width: 320, opacity: 1, x: 0 }}
              exit={{ width: 0, opacity: 0, x: -320 }}
              transition={{ duration: 0.3 }}
              className="border-r border-white/5 flex-shrink-0 fixed sm:static z-40 sm:z-0 h-[calc(100vh-3.5rem-16px)] sm:h-auto sm:w-80 w-80 sm:flex-none"
            >
              <ChatSidebar
                conversations={conversations}
                selectedId={selectedConversationId || undefined}
                onSelect={handleSelectConversation}
                onConversationsChange={setConversations}
                userId={userId}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar - always visible */}
        <div className="hidden sm:flex border-r border-white/5 w-80 flex-shrink-0">
          <ChatSidebar
            conversations={conversations}
            selectedId={selectedConversationId || undefined}
            onSelect={handleSelectConversation}
            onConversationsChange={setConversations}
            userId={userId}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedConversation ? (
            <>
              {/* Friend Request Panel */}
              {friendRequests.length > 0 && (
                <div className="px-2 sm:px-4 pt-2 sm:pt-4">
                  <FriendRequestPanel
                    requests={friendRequests.map((r: any) => ({
                      id: r.id,
                      fromUserId: r.sender.id,
                      fromUserName: r.sender.name,
                      fromUserAvatar: r.sender.avatar,
                      fromUserUsername: r.sender.profile?.username || null,
                    }))}
                    onRequestHandled={(requestId) => {
                      setFriendRequests(prev => prev.filter(r => r.id !== requestId));
                    }}
                  />
                </div>
              )}

              {/* Chat Header */}
              <div className="h-12 sm:h-16 px-2 sm:px-4 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors sm:hidden flex-shrink-0"
                  >
                    <MessageSquare size={18} className="sm:w-5 sm:h-5" />
                  </button>

                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {selectedConversation.avatar ? (
                      <img
                        src={selectedConversation.avatar}
                        alt={selectedConversation.name}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-white font-bold text-xs sm:text-sm">
                        {selectedConversation.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-white text-xs sm:text-sm truncate">
                      {selectedConversation.name}
                    </h2>
                    <p className="text-[10px] sm:text-xs text-slate-500">
                      {selectedConversation.type === 'GROUP'
                        ? `${selectedConversation.participants?.length || 0} members`
                        : isConnected ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 relative">
                  <button className="p-1.5 sm:p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                    <Search size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                  >
                    <Settings size={18} />
                  </button>

                  {/* Settings Panel - Simple Dropdown */}
                  <AnimatePresence>
                    {showSettings && (
                      <>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-40"
                          onClick={() => setShowSettings(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="fixed w-72 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-y-auto max-h-96"
                          style={{
                            right: '1rem',
                            top: '4.5rem'
                          }}
                        >
                          <div className="p-3">
                            <div className="space-y-1">
                              {selectedConversation?.type === 'GROUP' ? (
                                <>
                                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition-colors">
                                    <Users size={16} />
                                    View Members
                                  </button>
                                  <button
                                    onClick={handlePinConversation}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition-colors"
                                  >
                                    <Pin size={16} />
                                    {selectedConversation?.isPinned ? 'Unpin Group' : 'Pin Group'}
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={handleViewProfile}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition-colors"
                                  >
                                    <Users size={16} />
                                    View Profile
                                  </button>
                                  <button
                                    onClick={handleBlockUser}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                  >
                                    <X size={16} />
                                    Block User
                                  </button>
                                </>
                              )}
                              <hr className="my-2 border-white/10" />
                              <button
                                onClick={handlePinConversation}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition-colors"
                              >
                                <Pin size={16} />
                                {selectedConversation?.isPinned ? 'Unpin Conversation' : 'Pin Conversation'}
                              </button>
                              <button
                                onClick={handleMuteConversation}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition-colors"
                              >
                                <Bell size={16} />
                                {selectedConversation?.isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
                              </button>
                              <button
                                onClick={handleArchiveConversation}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition-colors"
                              >
                                <Archive size={16} />
                                Archive Chat
                              </button>
                              <hr className="my-2 border-white/10" />
                              <button
                                onClick={handleClearHistory}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition-colors"
                              >
                                <Trash2 size={16} />
                                Clear History
                              </button>
                              <button
                                onClick={handleDeleteChat}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 size={16} />
                                Delete Chat
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Messages - CRITICAL RENDERING FIX */}
              {isLoadingMessages ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
              ) : messageError ? (
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="text-center">
                    <p className="text-red-400 mb-2">Failed to load messages</p>
                    <p className="text-slate-500 text-sm">{messageError}</p>
                  </div>
                </div>
              ) : (
                <>
                  <ChatMessages
                    messages={messages}
                    currentUserId={userId}
                    conversationId={selectedConversation.id}
                    isLoading={false}
                  />

                  {/* DEBUG PANEL (TEMPORARY) */}
                  {debugMode && (
                    <div className="border-t border-white/5 p-2 bg-slate-900/50 max-h-32 overflow-y-auto">
                      <pre className="text-[10px] text-slate-400 whitespace-pre-wrap break-words">
                        {JSON.stringify({
                          selectedConversationId,
                          messagesCount: messages.length,
                          isLoading: isLoadingMessages,
                          error: messageError
                        }, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              )}

              {/* Input */}
              <ChatInput
                onSend={handleSendMessage}
                conversationId={selectedConversation.id}
                onTyping={(isTyping) => sendTyping(selectedConversation.id, isTyping)}
              />
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 sm:p-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4 sm:mb-6">
                <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
                Welcome to Chat
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm max-w-sm mb-4 sm:mb-6">
                Select a conversation from the sidebar or start a new chat with your friends.
              </p>
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="px-4 sm:px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-xs sm:text-sm font-medium transition-colors"
              >
                Start Chatting
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
