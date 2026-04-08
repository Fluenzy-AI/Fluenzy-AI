"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  UserPlus, 
  Search, 
  Check, 
  X, 
  MessageSquare, 
  Clock,
  ArrowLeft,
  Loader2,
  UserMinus
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useChatSocket } from "@/hooks/useChatSocket";

interface User {
  id: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
}

interface Request {
  id: string;
  user: User;
  createdAt: Date;
}

interface FriendsPageClientProps {
  userId: string;
  friends: User[];
  incomingRequests: Request[];
  outgoingRequests: Request[];
}

type Tab = 'friends' | 'requests' | 'add';

export default function FriendsPageClient({
  userId,
  friends: initialFriends,
  incomingRequests: initialIncoming,
  outgoingRequests: initialOutgoing
}: FriendsPageClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState(initialFriends);
  const [incomingRequests, setIncomingRequests] = useState(initialIncoming);
  const [outgoingRequests, setOutgoingRequests] = useState(initialOutgoing);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Socket for real-time friend request updates
  const { sendFriendRequest: emitFriendRequest } = useChatSocket({
    onFriendRequest: (data) => {
      if (data.action === 'received') {
        setIncomingRequests(prev => [data.request, ...prev]);
      } else if (data.action === 'accepted') {
        // Move from outgoing to friends
        setOutgoingRequests(prev => prev.filter(r => r.id !== data.requestId));
        if (data.user) {
          setFriends(prev => [data.user, ...prev]);
        }
      }
    }
  });

  // Search users
  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        // Filter out current user and existing friends
        const friendIds = new Set(friends.map(f => f.id));
        const filtered = data.users.filter((u: User) => 
          u.id !== userId && !friendIds.has(u.id)
        );
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  }, [userId, friends]);

  // Send friend request
  const sendRequest = async (receiverId: string) => {
    setProcessingIds(prev => new Set(prev).add(receiverId));
    try {
      const res = await fetch('/api/chat/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId })
      });

      if (res.ok) {
        const data = await res.json();
        const user = searchResults.find(u => u.id === receiverId);
        if (user) {
          setOutgoingRequests(prev => [{
            id: data.request.id,
            user,
            createdAt: new Date()
          }, ...prev]);
        }
        setSearchResults(prev => prev.filter(u => u.id !== receiverId));
        emitFriendRequest(receiverId, data.request);
      }
    } catch (error) {
      console.error("Failed to send request:", error);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(receiverId);
        return next;
      });
    }
  };

  // Accept friend request
  const acceptRequest = async (requestId: string, senderId: string) => {
    setProcessingIds(prev => new Set(prev).add(requestId));
    try {
      const res = await fetch('/api/chat/friends/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });

      if (res.ok) {
        const request = incomingRequests.find(r => r.id === requestId);
        if (request) {
          setFriends(prev => [request.user, ...prev]);
        }
        setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
      }
    } catch (error) {
      console.error("Failed to accept request:", error);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  // Reject friend request
  const rejectRequest = async (requestId: string) => {
    setProcessingIds(prev => new Set(prev).add(requestId));
    try {
      const res = await fetch('/api/chat/friends/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });

      if (res.ok) {
        setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
      }
    } catch (error) {
      console.error("Failed to reject request:", error);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  // Cancel sent request
  const cancelRequest = async (requestId: string) => {
    setProcessingIds(prev => new Set(prev).add(requestId));
    try {
      const res = await fetch('/api/chat/friends/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });

      if (res.ok) {
        setOutgoingRequests(prev => prev.filter(r => r.id !== requestId));
      }
    } catch (error) {
      console.error("Failed to cancel request:", error);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  // Remove friend
  const removeFriend = async (friendId: string) => {
    setProcessingIds(prev => new Set(prev).add(friendId));
    try {
      const res = await fetch('/api/chat/friends/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId })
      });

      if (res.ok) {
        setFriends(prev => prev.filter(f => f.id !== friendId));
      }
    } catch (error) {
      console.error("Failed to remove friend:", error);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(friendId);
        return next;
      });
    }
  };

  // Start chat with friend
  const startChat = async (friendId: string) => {
    setProcessingIds(prev => new Set(prev).add(friendId));
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
        router.push(`/train/chat/${data.conversation.id}`);
      } else {
        console.error("Failed to create conversation:", res.statusText);
      }
    } catch (error) {
      console.error("Failed to start chat:", error);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(friendId);
        return next;
      });
    }
  };

  const filteredFriends = friends.filter(f => 
    !searchQuery || 
    f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="h-16 border-b border-white/5 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/train/chat')}
              className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Friends
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('friends')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === 'friends'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Users size={16} />
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setTab('requests')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === 'requests'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Clock size={16} />
            Requests
            {(incomingRequests.length > 0 || outgoingRequests.length > 0) && (
              <span className="w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center">
                {incomingRequests.length + outgoingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('add')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === 'add'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus size={16} />
            Add Friend
          </button>
        </div>

        {/* Content */}
        <div className="bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden">
          {/* Friends Tab */}
          <AnimatePresence mode="wait">
            {tab === 'friends' && (
              <motion.div
                key="friends"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Search */}
                <div className="p-4 border-b border-white/5">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                      type="text"
                      placeholder="Search friends..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-800/50 border border-white/5 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                </div>

                {/* Friends List */}
                <div className="divide-y divide-white/5">
                  {filteredFriends.length === 0 ? (
                    <div className="p-8 text-center">
                      <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">No friends yet</p>
                      <button
                        onClick={() => setTab('add')}
                        className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm transition-colors"
                      >
                        Add Friends
                      </button>
                    </div>
                  ) : (
                    filteredFriends.map((friend) => (
                      <div key={friend.id} className="p-4 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                          {friend.avatar ? (
                            <img src={friend.avatar} alt={friend.name || ''} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white font-bold">
                              {friend.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white">{friend.name}</p>
                          <p className="text-sm text-slate-500">@{friend.username}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startChat(friend.id)}
                            disabled={processingIds.has(friend.id)}
                            className="p-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingIds.has(friend.id) ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <MessageSquare size={18} />
                            )}
                          </button>
                          <button
                            onClick={() => removeFriend(friend.id)}
                            disabled={processingIds.has(friend.id)}
                            className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-colors disabled:opacity-50"
                          >
                            {processingIds.has(friend.id) ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <UserMinus size={18} />
                            )}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* Requests Tab */}
            {tab === 'requests' && (
              <motion.div
                key="requests"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Incoming Requests */}
                <div className="p-4 border-b border-white/5">
                  <h3 className="text-sm font-medium text-slate-400 mb-3">
                    Incoming Requests ({incomingRequests.length})
                  </h3>
                  {incomingRequests.length === 0 ? (
                    <p className="text-sm text-slate-500">No pending requests</p>
                  ) : (
                    <div className="space-y-3">
                      {incomingRequests.map((request) => (
                        <div key={request.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                            {request.user.avatar ? (
                              <img src={request.user.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white text-sm font-bold">
                                {request.user.name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-white text-sm">{request.user.name}</p>
                            <p className="text-xs text-slate-500">@{request.user.username}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => acceptRequest(request.id, request.user.id)}
                              disabled={processingIds.has(request.id)}
                              className="p-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-400 transition-colors disabled:opacity-50"
                            >
                              {processingIds.has(request.id) ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Check size={16} />
                              )}
                            </button>
                            <button
                              onClick={() => rejectRequest(request.id)}
                              disabled={processingIds.has(request.id)}
                              className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-colors disabled:opacity-50"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Outgoing Requests */}
                <div className="p-4">
                  <h3 className="text-sm font-medium text-slate-400 mb-3">
                    Sent Requests ({outgoingRequests.length})
                  </h3>
                  {outgoingRequests.length === 0 ? (
                    <p className="text-sm text-slate-500">No sent requests</p>
                  ) : (
                    <div className="space-y-3">
                      {outgoingRequests.map((request) => (
                        <div key={request.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                            {request.user.avatar ? (
                              <img src={request.user.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white text-sm font-bold">
                                {request.user.name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-white text-sm">{request.user.name}</p>
                            <p className="text-xs text-slate-500">@{request.user.username}</p>
                          </div>
                          <button
                            onClick={() => cancelRequest(request.id)}
                            disabled={processingIds.has(request.id)}
                            className="px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors disabled:opacity-50"
                          >
                            {processingIds.has(request.id) ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              'Cancel'
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Add Friend Tab */}
            {tab === 'add' && (
              <motion.div
                key="add"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4"
              >
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    placeholder="Search by name or username..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleSearch(e.target.value);
                    }}
                    className="w-full pl-9 pr-4 py-3 bg-slate-800/50 border border-white/5 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    {searchQuery.length < 2 
                      ? 'Type at least 2 characters to search'
                      : 'No users found'
                    }
                  </div>
                ) : (
                  <div className="space-y-2">
                    {searchResults.map((user) => (
                      <div key={user.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                          {user.avatar ? (
                            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white text-sm font-bold">
                              {user.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white text-sm">{user.name}</p>
                          <p className="text-xs text-slate-500">@{user.username}</p>
                        </div>
                        <button
                          onClick={() => sendRequest(user.id)}
                          disabled={processingIds.has(user.id)}
                          className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          {processingIds.has(user.id) ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <>
                              <UserPlus size={14} />
                              Add
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
