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
  Loader2
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [debugMode] = useState(false); // Set to true for debugging

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
  }, []);

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
    <div className="flex h-[calc(100vh-4rem)] bg-slate-950 rounded-2xl overflow-hidden border border-white/5">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-white/5 flex-shrink-0"
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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversation ? (
          <>
            {/* Friend Request Panel */}
            {friendRequests.length > 0 && (
              <div className="px-4 pt-4">
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
            <div className="h-16 px-4 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors md:hidden"
                >
                  <MessageSquare size={20} />
                </button>

                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center overflow-hidden">
                  {selectedConversation.avatar ? (
                    <img
                      src={selectedConversation.avatar}
                      alt={selectedConversation.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {selectedConversation.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="font-semibold text-white text-sm">
                    {selectedConversation.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedConversation.type === 'GROUP'
                      ? `${selectedConversation.participants?.length || 0} members`
                      : isConnected ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                  <Search size={18} />
                </button>
                <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                  <Settings size={18} />
                </button>
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
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-6">
              <MessageSquare className="w-12 h-12 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Welcome to Chat
            </h2>
            <p className="text-slate-500 max-w-sm mb-6">
              Select a conversation from the sidebar or start a new chat with your friends.
            </p>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-sm font-medium transition-colors"
            >
              Start Chatting
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
