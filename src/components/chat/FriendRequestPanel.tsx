"use client";

import { useState, useCallback } from "react";
import { UserPlus, Check, X, Loader2, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string | null;
  fromUserUsername: string | null;
}

interface FriendRequestPanelProps {
  requests: FriendRequest[];
  onRequestHandled?: (requestId: string) => void;
}

export function FriendRequestPanel({ requests, onRequestHandled }: FriendRequestPanelProps) {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [localRequests, setLocalRequests] = useState(requests);

  const handleAccept = useCallback(async (requestId: string, userId: string) => {
    setProcessingIds(prev => new Set(prev).add(requestId));
    try {
      const res = await fetch("/api/chat/friends/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      if (res.ok) {
        setLocalRequests(prev => prev.filter(r => r.id !== requestId));
        onRequestHandled?.(requestId);
      }
    } catch (error) {
      console.error("Failed to accept request:", error);
    } finally {
      setProcessingIds(prev => {
        const updated = new Set(prev);
        updated.delete(requestId);
        return updated;
      });
    }
  }, [onRequestHandled]);

  const handleReject = useCallback(async (requestId: string) => {
    setProcessingIds(prev => new Set(prev).add(requestId));
    try {
      const res = await fetch("/api/chat/friends/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      if (res.ok) {
        setLocalRequests(prev => prev.filter(r => r.id !== requestId));
        onRequestHandled?.(requestId);
      }
    } catch (error) {
      console.error("Failed to reject request:", error);
    } finally {
      setProcessingIds(prev => {
        const updated = new Set(prev);
        updated.delete(requestId);
        return updated;
      });
    }
  }, [onRequestHandled]);

  if (localRequests.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-purple-600/10 border border-purple-600/20 rounded-lg p-4 mb-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-purple-400">
            {localRequests.length} Friend Request{localRequests.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="space-y-2">
          {localRequests.slice(0, 3).map((request) => (
            <div
              key={request.id}
              className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0 flex items-center justify-center overflow-hidden">
                {request.fromUserAvatar ? (
                  <img
                    src={request.fromUserAvatar}
                    alt={request.fromUserName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-white">
                    {request.fromUserName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">
                  {request.fromUserName}
                </p>
                <p className="text-[10px] text-slate-500">
                  @{request.fromUserUsername || "user"}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleAccept(request.id, request.fromUserId)}
                  disabled={processingIds.has(request.id)}
                  className="p-1.5 rounded-full bg-green-600/20 hover:bg-green-600/30 text-green-400 transition-colors disabled:opacity-50"
                  title="Accept"
                >
                  {processingIds.has(request.id) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleReject(request.id)}
                  disabled={processingIds.has(request.id)}
                  className="p-1.5 rounded-full bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-colors disabled:opacity-50"
                  title="Reject"
                >
                  {processingIds.has(request.id) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {localRequests.length > 3 && (
          <p className="text-xs text-slate-500 mt-3 text-center">
            +{localRequests.length - 3} more request{localRequests.length - 3 !== 1 ? "s" : ""}
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
