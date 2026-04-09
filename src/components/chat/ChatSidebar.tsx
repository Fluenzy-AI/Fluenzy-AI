"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Users,
  MessageSquare,
  UserPlus,
  X,
  Pin,
  Archive,
  MoreHorizontal,
  Loader2
} from "lucide-react";
import type { ConversationListItem } from "@/modules/chat/types/chat.types";
import { formatRelativeTime } from "@/modules/chat/utils/chat.utils";
import { QuickAddContact } from "./QuickAddContact";

interface ChatSidebarProps {
  conversations: ConversationListItem[];
  selectedId?: string;
  onSelect: (conversation: ConversationListItem) => void;
  onConversationsChange: (conversations: ConversationListItem[]) => void;
  userId: string;
}

type FilterType = 'all' | 'direct' | 'groups' | 'archived';

export function ChatSidebar({ 
  conversations, 
  selectedId, 
  onSelect, 
  onConversationsChange,
  userId 
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>('all');
  const [showNewChat, setShowNewChat] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    async function loadConversations() {
      try {
        const res = await fetch('/api/chat/conversations');
        if (res.ok) {
          const data = await res.json();
          onConversationsChange(data.conversations || []);
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);
      }
    }
    
    if (conversations.length === 0) {
      loadConversations();
    }
  }, []);

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    // Search filter
    if (searchQuery && !conv.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Type filter
    switch (filter) {
      case 'direct':
        return conv.type === 'DIRECT';
      case 'groups':
        return conv.type === 'GROUP';
      case 'archived':
        return conv.isArchived;
      default:
        return !conv.isArchived;
    }
  });

  // Load friends for new chat
  const loadFriends = useCallback(async () => {
    setIsLoadingFriends(true);
    try {
      const res = await fetch('/api/chat/friends');
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error("Failed to load friends:", error);
    } finally {
      setIsLoadingFriends(false);
    }
  }, []);

  // Start new chat with a friend
  const startDirectChat = async (friendId: string) => {
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'direct',
          userId: friendId
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        // Add to conversations if not exists
        const exists = conversations.some(c => c.id === data.conversation.id);
        if (!exists) {
          onConversationsChange([data.conversation, ...conversations]);
        }
        onSelect(data.conversation);
        setShowNewChat(false);
      }
    } catch (error) {
      console.error("Failed to start chat:", error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/30">
      {/* Header */}
      <div className="p-2 sm:p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h1 className="text-base sm:text-lg font-bold text-white">Messages</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowNewChat(true);
                loadFriends();
              }}
              className="p-1.5 sm:p-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors"
            >
              <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-2 sm:mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 sm:py-2 bg-slate-800/50 border border-white/5 rounded-lg text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-1">
          {(['all', 'direct', 'groups', 'archived'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {/* Quick Add Contact Button */}
        <QuickAddContact
          userId={userId}
          existingFriendIds={friends.map(f => f.id)}
          onContactAdded={() => loadFriends()}
        />

        <AnimatePresence>
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-xs sm:text-sm">
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </div>
          ) : (
            filteredConversations.map((conv, index) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
              >
                <ConversationItem
                  conversation={conv}
                  isSelected={selectedId === conv.id}
                  onClick={() => onSelect(conv)}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNewChat(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 rounded-2xl border border-white/10 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3 sm:p-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-white">New Chat</h2>
                <button
                  onClick={() => setShowNewChat(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {isLoadingFriends ? (
                  <div className="p-8 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                  </div>
                ) : friends.length === 0 ? (
                  <div className="p-8 text-center">
                    <UserPlus className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No friends yet</p>
                    <p className="text-slate-500 text-xs mt-1">Add friends to start chatting</p>
                  </div>
                ) : (
                  friends.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => startDirectChat(friend.id)}
                      className="w-full p-3 sm:p-4 flex items-center gap-3 hover:bg-white/5 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {friend.avatar ? (
                          <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-bold text-sm">
                            {friend.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-medium text-white text-xs sm:text-sm truncate">{friend.name}</div>
                        <div className="text-[10px] sm:text-xs text-slate-500 truncate">@{friend.username}</div>
                      </div>
                      <MessageSquare size={16} className="text-slate-500 flex-shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Conversation Item Component
interface ConversationItemProps {
  conversation: ConversationListItem;
  isSelected: boolean;
  onClick: () => void;
}

function ConversationItem({ conversation, isSelected, onClick }: ConversationItemProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={`group relative px-1 sm:px-2 ${isSelected ? 'bg-purple-600/10' : ''}`}
    >
      <button
        onClick={onClick}
        className={`w-full p-2 sm:p-3 flex items-center gap-2 sm:gap-3 rounded-lg transition-colors ${
          isSelected
            ? 'bg-purple-600/20'
            : 'hover:bg-white/5'
        }`}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center overflow-hidden ${
            conversation.type === 'GROUP'
              ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
              : 'bg-gradient-to-br from-purple-500 to-pink-500'
          }`}>
            {conversation.avatar ? (
              <img
                src={conversation.avatar}
                alt={conversation.name}
                className="w-full h-full object-cover"
              />
            ) : conversation.type === 'GROUP' ? (
              <Users size={18} className="sm:w-5 sm:h-5 text-white" />
            ) : (
              <span className="text-white font-bold text-sm">
                {conversation.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Pin indicator */}
          {conversation.isPinned && (
            <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-purple-600 rounded-full flex items-center justify-center">
              <Pin size={8} className="sm:w-[10px] sm:h-[10px] text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center justify-between gap-1">
            <span className="font-semibold text-white text-xs sm:text-sm truncate">
              {conversation.name}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 flex-shrink-0">
              {conversation.lastMessageAt
                ? formatRelativeTime(new Date(conversation.lastMessageAt))
                : ''}
            </span>
          </div>

          <div className="flex items-center justify-between gap-1 mt-0.5">
            <p className="text-xs sm:text-sm text-slate-400 truncate pr-1">
              {conversation.lastMessage || 'No messages yet'}
            </p>

            {conversation.unreadCount > 0 && (
              <span className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 bg-purple-600 rounded-full flex items-center justify-center text-[8px] sm:text-[10px] font-bold text-white">
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Hover Menu */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 text-slate-400 transition-opacity"
      >
        <MoreHorizontal size={16} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute right-2 sm:right-4 top-full mt-1 w-32 sm:w-36 py-1 bg-slate-800 rounded-lg border border-white/10 shadow-xl z-10"
          >
            <button className="w-full px-3 py-2 text-left text-xs sm:text-sm text-white hover:bg-white/5 flex items-center gap-2">
              <Pin size={14} />
              {conversation.isPinned ? 'Unpin' : 'Pin'}
            </button>
            <button className="w-full px-3 py-2 text-left text-xs sm:text-sm text-white hover:bg-white/5 flex items-center gap-2">
              <Archive size={14} />
              {conversation.isArchived ? 'Unarchive' : 'Archive'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
