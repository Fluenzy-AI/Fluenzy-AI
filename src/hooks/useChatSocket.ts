"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import type { 
  MessageWithDetails, 
  SocketTypingEvent, 
  SocketReadEvent,
  SocketPresenceEvent,
  SocketReactionEvent
} from "@/modules/chat/types/chat.types";

// Socket connection singleton
let socket: Socket | null = null;
let socketInitialized = false;

function getSocket(): Socket {
  if (!socket) {
    socket = io({
      path: "/api/socket/io",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

interface UseChatSocketOptions {
  onMessage?: (conversationId: string, message: MessageWithDetails) => void;
  onTyping?: (event: SocketTypingEvent) => void;
  onRead?: (event: SocketReadEvent) => void;
  onPresence?: (event: SocketPresenceEvent) => void;
  onReaction?: (event: SocketReactionEvent) => void;
  onMessageUpdate?: (data: {
    conversationId: string;
    messageId: string;
    action: "edit" | "delete";
    content?: string;
    userId: string;
  }) => void;
  onFriendRequest?: (data: any) => void;
  onGroupUpdate?: (data: any) => void;
  onGroupInvite?: (data: any) => void;
}

export function useChatSocket(options: UseChatSocketOptions = {}) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Initialize socket connection and authenticate
  useEffect(() => {
    if (!session?.user?.id) return;

    const socket = getSocket();

    const handleConnect = () => {
      setIsConnected(true);
      setConnectionError(null);
      
      // Authenticate with chat system
      if (!socketInitialized) {
        socket.emit("chat:auth", {
          userId: session.user.id,
          userName: session.user.name,
        });
        socketInitialized = true;
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      socketInitialized = false;
    };

    const handleError = (error: Error) => {
      setConnectionError(error.message);
      console.error("[Chat Socket] Error:", error);
    };

    // Set up connection handlers
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleError);

    // Set up chat event handlers
    socket.on("chat:message", (data) => {
      optionsRef.current.onMessage?.(data.conversationId, data.message);
    });

    socket.on("chat:typing", (data) => {
      optionsRef.current.onTyping?.(data);
    });

    socket.on("chat:read", (data) => {
      optionsRef.current.onRead?.(data);
    });

    socket.on("chat:presence", (data) => {
      optionsRef.current.onPresence?.(data);
    });

    socket.on("chat:reaction", (data) => {
      optionsRef.current.onReaction?.(data);
    });

    socket.on("chat:message:update", (data) => {
      optionsRef.current.onMessageUpdate?.(data);
    });

    socket.on("chat:friend:request", (data) => {
      optionsRef.current.onFriendRequest?.(data);
    });

    socket.on("chat:group:update", (data) => {
      optionsRef.current.onGroupUpdate?.(data);
    });

    socket.on("chat:group:invite", (data) => {
      optionsRef.current.onGroupInvite?.(data);
    });

    // Connect if not already connected
    if (!socket.connected) {
      socket.connect();
    } else {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleError);
      socket.off("chat:message");
      socket.off("chat:typing");
      socket.off("chat:read");
      socket.off("chat:presence");
      socket.off("chat:reaction");
      socket.off("chat:message:update");
      socket.off("chat:friend:request");
      socket.off("chat:group:update");
      socket.off("chat:group:invite");
    };
  }, [session?.user?.id, session?.user?.name]);

  // Join a conversation
  const joinConversation = useCallback((conversationId: string) => {
    const socket = getSocket();
    socket.emit("chat:join", { conversationId });
  }, []);

  // Leave a conversation
  const leaveConversation = useCallback((conversationId: string) => {
    const socket = getSocket();
    socket.emit("chat:leave", { conversationId });
  }, []);

  // Send a message (broadcasts to other participants)
  const sendMessage = useCallback((conversationId: string, message: Partial<MessageWithDetails>) => {
    const socket = getSocket();
    socket.emit("chat:message", { conversationId, message });
  }, []);

  // Send typing indicator
  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    const socket = getSocket();
    socket.emit("chat:typing", { conversationId, isTyping });
  }, []);

  // Send read receipt
  const sendRead = useCallback((conversationId: string, messageIds: string[]) => {
    const socket = getSocket();
    socket.emit("chat:read", { conversationId, messageIds });
  }, []);

  // Send reaction
  const sendReaction = useCallback((
    conversationId: string, 
    messageId: string, 
    emoji: string, 
    action: "add" | "remove"
  ) => {
    const socket = getSocket();
    socket.emit("chat:reaction", { conversationId, messageId, emoji, action });
  }, []);

  // Send message update (edit/delete)
  const sendMessageUpdate = useCallback((
    conversationId: string,
    messageId: string,
    action: "edit" | "delete",
    content?: string
  ) => {
    const socket = getSocket();
    socket.emit("chat:message:update", { conversationId, messageId, action, content });
  }, []);

  // Send friend request notification
  const sendFriendRequest = useCallback((receiverId: string, request: any) => {
    const socket = getSocket();
    socket.emit("chat:friend:request", { receiverId, request });
  }, []);

  // Send group update notification
  const sendGroupUpdate = useCallback((
    conversationId: string,
    action: string,
    groupData: any,
    memberIds?: string[]
  ) => {
    const socket = getSocket();
    socket.emit("chat:group:update", { conversationId, action, groupData, memberIds });
  }, []);

  return {
    isConnected,
    connectionError,
    joinConversation,
    leaveConversation,
    sendMessage,
    sendTyping,
    sendRead,
    sendReaction,
    sendMessageUpdate,
    sendFriendRequest,
    sendGroupUpdate,
  };
}

// Presence tracking hook
export function usePresence() {
  const [onlineUsers, setOnlineUsers] = useState<Map<string, { lastSeen: Date }>>(new Map());

  useChatSocket({
    onPresence: (event) => {
      setOnlineUsers((prev) => {
        const next = new Map(prev);
        if (event.isOnline) {
          next.set(event.userId, { lastSeen: new Date() });
        } else {
          next.delete(event.userId);
        }
        return next;
      });
    },
  });

  const isOnline = useCallback((userId: string) => onlineUsers.has(userId), [onlineUsers]);
  const getLastSeen = useCallback((userId: string) => onlineUsers.get(userId)?.lastSeen, [onlineUsers]);

  return { onlineUsers, isOnline, getLastSeen };
}

// Typing indicator hook for a specific conversation
export function useTypingIndicator(conversationId: string) {
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map()); // userId -> userName
  const { sendTyping } = useChatSocket({
    onTyping: (event) => {
      if (event.conversationId !== conversationId) return;
      
      setTypingUsers((prev) => {
        const next = new Map(prev);
        if (event.isTyping) {
          next.set(event.userId, event.userName);
        } else {
          next.delete(event.userId);
        }
        return next;
      });
    },
  });

  const setTyping = useCallback((isTyping: boolean) => {
    sendTyping(conversationId, isTyping);
  }, [conversationId, sendTyping]);

  const typingText = typingUsers.size === 0 
    ? null 
    : typingUsers.size === 1 
      ? `${Array.from(typingUsers.values())[0]} is typing...`
      : typingUsers.size === 2
        ? `${Array.from(typingUsers.values()).join(" and ")} are typing...`
        : `${typingUsers.size} people are typing...`;

  return { typingUsers, typingText, setTyping };
}
