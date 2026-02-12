import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

interface MatchFoundData {
  roomId: string;
  channelName: string;
  topic: string;
  participants: {
    userId: string;
    userName: string;
  }[];
}

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [state, setState] = useState<SocketState>({
    connected: false,
    connecting: false,
    error: null
  });
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Don't connect during SSR
    if (typeof window === 'undefined') return;

    console.log('[Socket] Initializing socket connection...');

    const socketInstance = io({
      path: '/api/socket/io',
      addTrailingSlash: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);
    setState(prev => ({ ...prev, connecting: true }));

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected:', socketInstance.id);
      setState({ connected: true, connecting: false, error: null });
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setState(prev => ({ ...prev, connected: false }));
    });

    socketInstance.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
      setState(prev => ({ ...prev, error: error.message, connecting: false }));
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
    });

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log('[Socket] Reconnection attempt:', attemptNumber);
    });

    return () => {
      console.log('[Socket] Cleaning up...');
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, []);

  const joinQueue = useCallback((data: {
    userId: string;
    userName: string;
    participantCount: number;
    difficulty: string;
    mode: string;
  }) => {
    if (socketRef.current?.connected) {
      console.log('[Socket] Joining queue:', data);
      socketRef.current.emit('join-queue', data);
    } else {
      console.error('[Socket] Cannot join queue - not connected');
      setState(prev => ({ ...prev, error: 'Not connected to server' }));
    }
  }, []);

  const leaveQueue = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('[Socket] Leaving queue');
      socketRef.current.emit('leave-queue');
    }
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    if (socketRef.current?.connected) {
      console.log('[Socket] Joining room:', roomId);
      socketRef.current.emit('join-room', roomId);
    }
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    if (socketRef.current?.connected) {
      console.log('[Socket] Leaving room:', roomId);
      socketRef.current.emit('leave-room', roomId);
    }
  }, []);

  const endSession = useCallback((roomId: string) => {
    if (socketRef.current?.connected) {
      console.log('[Socket] Ending session:', roomId);
      socketRef.current.emit('end-session', { roomId });
    }
  }, []);

  return {
    socket,
    connected: state.connected,
    connecting: state.connecting,
    error: state.error,
    joinQueue,
    leaveQueue,
    joinRoom,
    leaveRoom,
    endSession
  };
}
