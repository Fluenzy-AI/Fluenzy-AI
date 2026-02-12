// Socket.IO client-side initialization helper
// This file is used to initialize Socket.IO on the client side

export const SOCKET_PATH = '/api/socket/io';

export function initSocketConfig() {
  return {
    path: '/api/socket/io',
    addTrailingSlash: false,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  };
}
