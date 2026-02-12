import { NextApiRequest } from 'next';
import { NextApiResponse } from 'next';
import { Server as NetServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

// Queue manager for real-time matchmaking
interface QueueUser {
  id: string;
  socketId: string;
  userId: string;
  userName: string;
  participantCount: number;
  difficulty: string;
  mode: string;
  joinedAt: number;
}

interface Room {
  id: string;
  channelName: string;
  topic: string;
  users: QueueUser[];
  createdAt: number;
}

// In-memory queues and rooms - GLOBAL across all server instances
const queues: Map<string, QueueUser[]> = new Map();
const rooms: Map<string, Room> = new Map();

// Socket.io server instance
let io: SocketIOServer | null = null;

// Initialize Socket.io
function initializeSocket(server: NetServer): SocketIOServer {
  if (io) return io;

  console.log('[Socket.IO] Initializing Socket.IO server...');

  io = new SocketIOServer(server, {
    path: '/api/socket/io',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Handle user joining queue
    socket.on('join-queue', (data: {
      userId: string;
      userName: string;
      participantCount: number;
      difficulty: string;
      mode: string;
    }) => {
      console.log(`[Socket.IO] User joining queue:`, data);

      const queueUser: QueueUser = {
        id: socket.id,
        socketId: socket.id,
        userId: data.userId,
        userName: data.userName,
        participantCount: data.participantCount,
        difficulty: data.difficulty,
        mode: data.mode,
        joinedAt: Date.now()
      };

      // Add to queue
      const queueKey = `${data.participantCount}-${data.difficulty}-${data.mode}`;
      let queue = queues.get(queueKey) || [];
      
      // Check if user already in queue
      const existingIndex = queue.findIndex(u => u.userId === data.userId);
      if (existingIndex !== -1) {
        console.log(`[Socket.IO] User ${data.userId} already in queue, updating...`);
        queue[existingIndex] = queueUser;
      } else {
        queue.push(queueUser);
      }
      
      queues.set(queueKey, queue);
      socket.data.queueKey = queueKey;
      socket.data.userInfo = queueUser;

      console.log(`[Socket.IO] Queue ${queueKey} now has ${queue.length} users (need ${data.participantCount})`);

      // Notify user they're in queue
      socket.emit('queue-status', {
        status: 'waiting',
        position: queue.length,
        message: `Looking for ${data.participantCount - queue.length} more participant(s)...`
      });

      // Try to find a match immediately
      tryCreateRoom(queueKey);
    });

    // Handle leaving queue
    socket.on('leave-queue', () => {
      handleDisconnect(socket);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
      handleDisconnect(socket);
    });

    // Handle room events
    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);
      console.log(`[Socket.IO] Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('leave-room', (roomId: string) => {
      socket.leave(roomId);
      console.log(`[Socket.IO] Socket ${socket.id} left room ${roomId}`);
    });

    socket.on('end-session', (data: { roomId: string }) => {
      const room = rooms.get(data.roomId);
      if (room) {
        room.users.forEach(user => {
          io?.to(user.socketId).emit('session-ended', {
            reason: 'Host ended session'
          });
        });
        rooms.delete(data.roomId);
        console.log(`[Socket.IO] Room ${data.roomId} deleted`);
      }
    });
  });

  console.log('[Socket.IO] Server initialized successfully');
  return io;
}

// Try to create a room if we have enough users
function tryCreateRoom(queueKey: string) {
  const queue = queues.get(queueKey);
  if (!queue || queue.length === 0) return;

  const requiredCount = queue[0].participantCount;
  
  console.log(`[Socket.IO] Checking queue ${queueKey}: ${queue.length}/${requiredCount} users`);
  
  if (queue.length >= requiredCount) {
    // Get the first N users who joined
    const matchedUsers = queue.slice(0, requiredCount);
    
    // Verify all users have the same participantCount requirement
    const allSame = matchedUsers.every(u => u.participantCount === requiredCount);
    if (!allSame) {
      console.log(`[Socket.IO] User participant count mismatch, waiting...`);
      return;
    }

    createRoom(queueKey, matchedUsers);
  }
}

// Create a room with matched users
async function createRoom(queueKey: string, users: QueueUser[]) {
  console.log(`[Socket.IO] Creating room for users:`, users.map(u => u.userId));

  // Generate unique room ID
  const roomId = `gd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const channelName = `room_${roomId.replace(/-/g, '_')}`;

  // Generate topic
  const mode = users[0].mode;
  const topics = getTopicsByMode(mode);
  const topic = topics[Math.floor(Math.random() * topics.length)];

  // Assign roles to all users first (for consistency)
  const userRoles: Record<string, string> = {};
  users.forEach(user => {
    userRoles[user.userId] = assignRole(users.length, user.userId);
  });

  const room: Room = {
    id: roomId,
    channelName,
    topic,
    users,
    createdAt: Date.now()
  };

  rooms.set(roomId, room);

  // Remove users from queue
  users.forEach(user => {
    removeFromQueue(queueKey, user.userId);
  });

  // Note: We don't create DB sessions here because:
  // 1. The model requires authenticated users with valid userId references
  // 2. Guests use odlUserId which isn't in the schema
  // 3. The token API validates Socket.IO sessions differently
  // DB sessions can be created later when users authenticate
  const sessionId = roomId;
  console.log(`[Socket.IO] Session ID for token validation: ${sessionId}`);

  // Notify all users
  users.forEach(user => {
    io?.to(user.socketId).emit('match-found', {
      roomId,
      sessionId,
      channelName,
      topic,
      participants: users.map(u => ({
        odlUserId: u.userId,
        odlUserName: u.userName,
        role: userRoles[u.userId]
      }))
    });
  });

  console.log(`[Socket.IO] Room created: ${roomId} with ${users.length} users`);
}

// Assign role based on participant count
function assignRole(participantCount: number, userId: string): string {
  const roles = [
    'Initiator',
    'Moderator',
    'Analyzer',
    'Challenger',
    'Supporter',
    'Info Provider',
    'Summarizer',
    'Opposer'
  ];
  
  // Always have at least Initiator
  const availableRoles = roles.slice(0, Math.min(participantCount, roles.length));
  
  // Simple deterministic role assignment based on userId hash
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const roleIndex = hash % availableRoles.length;
  
  return availableRoles[roleIndex];
}

// Remove user from queue
function removeFromQueue(queueKey: string, userId: string) {
  const queue = queues.get(queueKey);
  if (queue) {
    const filtered = queue.filter(u => u.userId !== userId);
    if (filtered.length > 0) {
      queues.set(queueKey, filtered);
    } else {
      queues.delete(queueKey);
    }
    console.log(`[Socket.IO] Removed user ${userId} from queue ${queueKey}`);
  }
}

// Handle disconnect
function handleDisconnect(socket: Socket) {
  const queueKey = socket.data.queueKey;
  const userInfo = socket.data.userInfo;

  if (queueKey && userInfo) {
    removeFromQueue(queueKey, userInfo.userId);
  }

  socket.disconnect();
}

// Get topics by mode
function getTopicsByMode(mode: string): string[] {
  const allTopics = [
    "Should companies prioritize profit over employee well-being?",
    "Is remote work the future or a temporary trend?",
    "Should businesses have a social responsibility beyond profit?",
    "Is it ethical for companies to use AI for employee monitoring?",
    "Should there be a universal minimum wage across all industries?",
    "Is corporate transparency more important than competitive advantage?",
    "Should companies be required to disclose their environmental impact?",
    "Is it better to hire for skills or cultural fit?",
    "Should executive compensation be capped?",
    "Is work-life balance achievable in modern corporate culture?",
    "Should AI be regulated by governments?",
    "Is social media doing more harm than good to society?",
    "Should climate change be treated as a national security issue?",
    "Is universal basic income a viable solution for automation?",
    "Should data privacy be a fundamental right?",
    "Is silence more powerful than words?",
    "Can money buy happiness?",
    "Is conformity the enemy of progress?",
    "Are rules meant to be broken?",
    "Is patience a virtue or a weakness?",
    "Can one person truly make a difference?",
    "Will AI replace most human jobs within the next decade?",
    "Is cryptocurrency the future of finance or a bubble?",
    "Should social media platforms be treated as public utilities?"
  ];

  if (mode === 'Random') return allTopics;
  
  const modeMap: Record<string, string[]> = {
    Corporate: allTopics.slice(0, 10),
    CurrentAffairs: allTopics.slice(10, 15),
    Abstract: allTopics.slice(15, 21),
    Technology: allTopics.slice(21, 25)
  };

  return modeMap[mode] || allTopics;
}

// Export for use
export { initializeSocket, io, queues, rooms };
