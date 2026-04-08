"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Phone, 
  Video, 
  MoreVertical, 
  Users,
  Settings
} from "lucide-react";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { useChatSocket } from "@/hooks/useChatSocket";
import type { MessageWithDetails } from "@/modules/chat/types/chat.types";

interface ConversationInfo {
  id: string;
  type: string;
  name: string;
  avatar?: string | null;
  description?: string | null;
  participants: Array<{
    id: string;
    name: string | null;
    avatar: string | null;
  }>;
}

interface ConversationPageClientProps {
  userId: string;
  userName: string;
  conversation: ConversationInfo;
  initialMessages: MessageWithDetails[];
}

export default function ConversationPageClient({ 
  userId, 
  userName,
  conversation,
  initialMessages
}: ConversationPageClientProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<MessageWithDetails[]>(initialMessages);
  const [replyingTo, setReplyingTo] = useState<{ id: string; content: string; senderName: string } | null>(null);

  // Socket connection
  const { 
    isConnected,
    joinConversation, 
    leaveConversation, 
    sendMessage: emitMessage,
    sendTyping,
    sendRead
  } = useChatSocket({
    onMessage: (conversationId, message) => {
      if (conversationId === conversation.id) {
        setMessages(prev => [...prev, message]);
        sendRead(conversation.id, [message.id]);
      }
    },
    onReaction: (event) => {
      if (event.conversationId === conversation.id) {
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
      if (data.conversationId === conversation.id) {
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

  // Join conversation on mount
  useEffect(() => {
    joinConversation(conversation.id);
    return () => leaveConversation(conversation.id);
  }, [conversation.id, joinConversation, leaveConversation]);

  // Handle send message
  const handleSendMessage = useCallback(async (
    content: string, 
    type: string = 'TEXT', 
    mediaMeta?: any,
    encrypted?: { encryptedContent: string; nonce: string; keyVersion: number }
  ) => {
    try {
      const body: any = {
        conversationId: conversation.id,
        type,
        content: type === 'TEXT' ? content : undefined,
        mediaUrl: type !== 'TEXT' ? content : undefined,
        mediaMeta
      };

      // Add encryption data if provided
      if (encrypted) {
        body.isEncrypted = true;
        body.encryptedContent = encrypted.encryptedContent;
        body.nonce = encrypted.nonce;
        body.keyVersion = encrypted.keyVersion;
      }

      if (replyingTo) {
        body.replyToId = replyingTo.id;
      }

      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.message]);
        emitMessage(conversation.id, data.message);
        setReplyingTo(null);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }, [conversation.id, replyingTo, emitMessage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="h-16 border-b border-white/5 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/train/chat')}
              className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center overflow-hidden">
              {conversation.avatar ? (
                <img 
                  src={conversation.avatar} 
                  alt={conversation.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-sm">
                  {conversation.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            
            <div>
              <h1 className="font-semibold text-white text-sm">
                {conversation.name}
              </h1>
              <p className="text-xs text-slate-500">
                {conversation.type === 'GROUP' 
                  ? `${conversation.participants.length} members`
                  : isConnected ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {conversation.type === 'GROUP' && (
              <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                <Users size={18} />
              </button>
            )}
            <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="max-w-4xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
        <ChatMessages
          messages={messages}
          currentUserId={userId}
          conversationId={conversation.id}
        />

        <ChatInput
          onSend={handleSendMessage}
          conversationId={conversation.id}
          onTyping={(isTyping) => sendTyping(conversation.id, isTyping)}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </main>
    </div>
  );
}
