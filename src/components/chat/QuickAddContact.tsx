"use client";

import { useState, useCallback } from "react";
import { UserPlus, Search, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QuickAddContactProps {
  userId: string;
  existingFriendIds: string[];
  onContactAdded?: (friendId: string) => void;
}

interface SearchUser {
  id: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
}

export function QuickAddContact({ userId, existingFriendIds, onContactAdded }: QuickAddContactProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [requestedUserIds, setRequestedUserIds] = useState<Set<string>>(new Set());

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        const filtered = (data.users || []).filter(
          (u: SearchUser) => u.id !== userId && !existingFriendIds.includes(u.id)
        );
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [userId, existingFriendIds]);

  const handleSendRequest = useCallback(async (receiverId: string) => {
    setRequestedUserIds(prev => new Set(prev).add(receiverId));
    try {
      const res = await fetch("/api/chat/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId }),
      });

      if (res.ok) {
        onContactAdded?.(receiverId);
        setSearchResults(prev => prev.filter(u => u.id !== receiverId));
      }
    } catch (error) {
      console.error("Failed to send request:", error);
    } finally {
      setRequestedUserIds(prev => {
        const updated = new Set(prev);
        updated.delete(receiverId);
        return updated;
      });
    }
  }, [onContactAdded]);

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          setSearchQuery("");
          setSearchResults([]);
        }}
        className="w-full p-3 flex items-center gap-2 text-purple-400 hover:bg-purple-900/20 rounded-lg transition-colors"
      >
        <UserPlus size={16} />
        <span className="text-sm font-medium">Add contact</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 rounded-2xl border border-white/10 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Add Contact</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search Box */}
              <div className="p-4 border-b border-white/5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    placeholder="Search by name or username..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    autoFocus
                    className="w-full pl-9 pr-4 py-2 bg-slate-800/50 border border-white/5 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto">
                {isSearching ? (
                  <div className="p-8 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                  </div>
                ) : searchQuery.length < 2 ? (
                  <div className="p-8 text-center">
                    <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Search for users to add</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-slate-400 text-sm">No users found</p>
                  </div>
                ) : (
                  searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="p-4 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name || "User"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-sm">
                            {user.name?.charAt(0).toUpperCase() || "U"}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm">{user.name}</p>
                        <p className="text-xs text-slate-500">@{user.username || "user"}</p>
                      </div>

                      <button
                        onClick={() => handleSendRequest(user.id)}
                        disabled={requestedUserIds.has(user.id)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                      >
                        {requestedUserIds.has(user.id) ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <UserPlus size={12} />
                            Add
                          </>
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
