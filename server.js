const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

// ─── Crash Guard ─────────────────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught exception (server kept alive):', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled rejection (server kept alive):', reason);
});
// ─────────────────────────────────────────────────────────────────────────────

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

// Queue manager for real-time matchmaking (GD)
const queues = new Map();
const rooms = new Map();

// Interview queue manager (role-based 1:1 strict matching)
// Key format: `${interviewType}-${role}` e.g. "PI-HR", "PI-Candidate", "Technical-EngineeringManager", "Technical-Candidate"
const interviewQueues = new Map();
const interviewRooms = new Map();
const interviewTimeouts = new Map(); // userId → timeoutHandle

// Private interview rooms (many-to-many)
const privateInterviewRooms = new Map();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Socket.IO setup
  const io = new Server(server, {
    path: '/api/socket/io',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Handle user joining queue
    socket.on('join-queue', (data) => {
      try {
      console.log(`[Socket.IO] User joining queue:`, data);

      const queueUser = {
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
      
      const existingIndex = queue.findIndex(u => u.userId === data.userId);
      if (existingIndex !== -1) {
        queue[existingIndex] = queueUser;
      } else {
        queue.push(queueUser);
      }
      
      queues.set(queueKey, queue);
      socket.data.queueKey = queueKey;
      socket.data.userInfo = queueUser;

      console.log(`[Socket.IO] Queue ${queueKey} now has ${queue.length} users`);

      // Notify user they're in queue
      socket.emit('queue-status', {
        status: 'waiting',
        position: queue.length,
        message: `Looking for ${data.participantCount - queue.length} more...`
      });

      // Try to create room
      tryCreateRoom(queueKey, io);
      } catch(e) { console.error('[Socket join-queue]', e); }
    });

    socket.on('leave-queue', () => {
      try { handleDisconnect(socket); } catch(e) { console.error('[Socket leave-queue]', e); }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
      try { handleDisconnect(socket, true); } catch(e) { console.error('[Socket disconnect GD]', e); }
      try { handleInterviewDisconnect(socket); } catch(e) { console.error('[Socket disconnect Interview]', e); }
    });

    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`[Socket.IO] Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
    });

    socket.on('end-session', (data) => {
      const room = rooms.get(data.roomId);
      if (room) {
        room.users.forEach(user => {
          io.to(user.socketId).emit('session-ended', { reason: 'Host ended session' });
        });
        rooms.delete(data.roomId);
        console.log(`[Socket.IO] Room ${data.roomId} deleted`);
      }
    });

    // ─── INTERVIEW SOCKET HANDLERS ────────────────────────────────────────────

    // 1:1 role-based interview matching
    socket.on('interview-join-queue', (data) => {
      try {
      const { userId, userName, interviewType, role } = data;
      // interviewType: 'PI' | 'Technical'
      // role: 'HR' | 'Candidate' | 'EngineeringManager'
      console.log(`[Interview] User joining queue:`, data);

      const oppositeRole = interviewType === 'PI'
        ? (role === 'HR' ? 'Candidate' : 'HR')
        : (role === 'EngineeringManager' ? 'Candidate' : 'EngineeringManager');

      const myQueueKey   = `${interviewType}-${role}`;
      const theirQueueKey = `${interviewType}-${oppositeRole}`;

      const user = { socketId: socket.id, userId, userName, interviewType, role, joinedAt: Date.now() };

      // Check if there's someone in the opposite queue
      const oppositeQueue = interviewQueues.get(theirQueueKey) || [];
      const matchIndex = oppositeQueue.findIndex(u => u.userId !== userId);

      if (matchIndex !== -1) {
        // Match found → create room
        const opponent = oppositeQueue.splice(matchIndex, 1)[0];
        if (oppositeQueue.length === 0) interviewQueues.delete(theirQueueKey);
        else interviewQueues.set(theirQueueKey, oppositeQueue);

        // Clear any pending timeouts
        clearInterviewTimeout(opponent.userId);
        clearInterviewTimeout(userId);

        createInterviewRoom([user, opponent], io);
      } else {
        // Add to own queue
        const myQueue = interviewQueues.get(myQueueKey) || [];
        const existingIdx = myQueue.findIndex(u => u.userId === userId);
        if (existingIdx !== -1) myQueue[existingIdx] = user;
        else myQueue.push(user);
        interviewQueues.set(myQueueKey, myQueue);

        socket.data.interviewQueueKey = myQueueKey;
        socket.data.interviewUserInfo = user;

        socket.emit('interview-queue-status', {
          status: 'waiting',
          message: `Waiting for an ${oppositeRole} to connect...`,
        });

        // Auto timeout after 2 minutes
        const t = setTimeout(() => {
          removeFromInterviewQueue(myQueueKey, userId);
          const s = io.sockets.sockets.get(user.socketId);
          if (s) s.emit('interview-queue-timeout', { message: 'No match found. Please try again.' });
        }, 120_000);
        interviewTimeouts.set(userId, t);
      }
      } catch(e) { console.error('[Socket interview-join-queue]', e); }
    });

    socket.on('interview-leave-queue', () => {
      try { handleInterviewDisconnect(socket); } catch(e) { console.error('[Socket interview-leave-queue]', e); }
    });

    // Private interview room – host creates
    socket.on('interview-private-create', (data) => {
      try {
      const { roomId, userId, userName, interviewType } = data;
      privateInterviewRooms.set(roomId, {
        roomId,
        interviewType,
        hostId: userId,
        participants: [],
        phase: 'waiting',
        createdAt: Date.now(),
      });
      socket.join(`private-interview-${roomId}`);
      socket.data.privateInterviewRoom = roomId;
      socket.emit('interview-private-created', { roomId });
      } catch(e) { console.error('[Socket interview-private-create]', e); }
    });

    // Private interview room – participant joins
    socket.on('interview-private-join', (data) => {
      try {
      const { roomId, userId, userName, role } = data;
      const room = privateInterviewRooms.get(roomId);
      if (!room) {
        socket.emit('interview-private-error', { message: 'Room not found or has ended.' });
        return;
      }
      if (room.phase === 'ended') {
        socket.emit('interview-private-error', { message: 'This interview session has ended.' });
        return;
      }
      // Remove stale entry for same user
      room.participants = room.participants.filter(p => p.userId !== userId);
      room.participants.push({ socketId: socket.id, userId, userName, role, joinedAt: Date.now() });
      socket.join(`private-interview-${roomId}`);
      socket.data.privateInterviewRoom = roomId;

      // Notify all in room
      io.to(`private-interview-${roomId}`).emit('interview-private-participant-update', {
        participants: room.participants.map(p => ({ userId: p.userId, userName: p.userName, role: p.role })),
      });
      socket.emit('interview-private-joined', { roomId, interviewType: room.interviewType, participants: room.participants.map(p => ({ userId: p.userId, userName: p.userName, role: p.role })) });
      } catch(e) { console.error('[Socket interview-private-join]', e); }
    });

    // Private interview room – host controls
    socket.on('interview-private-control', (data) => {
      try {
      const { roomId, action, targetUserId } = data;
      const room = privateInterviewRooms.get(roomId);
      if (!room) return;

      if (action === 'start') {
        room.phase = 'active';
        room.startedAt = Date.now();
        io.to(`private-interview-${roomId}`).emit('interview-private-started', { startedAt: room.startedAt });
      } else if (action === 'end') {
        room.phase = 'ended';
        io.to(`private-interview-${roomId}`).emit('interview-private-ended', { reason: 'Host ended the interview.' });
        privateInterviewRooms.delete(roomId);
      } else if (action === 'remove' && targetUserId) {
        const target = room.participants.find(p => p.userId === targetUserId);
        if (target) {
          const s = io.sockets.sockets.get(target.socketId);
          if (s) { s.emit('interview-private-removed', {}); s.leave(`private-interview-${roomId}`); }
          room.participants = room.participants.filter(p => p.userId !== targetUserId);
          io.to(`private-interview-${roomId}`).emit('interview-private-participant-update', {
            participants: room.participants.map(p => ({ userId: p.userId, userName: p.userName, role: p.role })),
          });
        }
      } else if (action === 'mute' && targetUserId) {
        const target = room.participants.find(p => p.userId === targetUserId);
        if (target) {
          const s = io.sockets.sockets.get(target.socketId);
          if (s) s.emit('interview-private-muted', {});
        }
      } else if (action === 'lock') {
        room.locked = !room.locked;
        io.to(`private-interview-${roomId}`).emit('interview-private-lock-status', { locked: room.locked });
      }
      } catch(e) { console.error('[Socket interview-private-control]', e); }
    });

    // Raise hand in private interview
    socket.on('interview-raise-hand', (data) => {
      try {
      const { roomId, userId, userName } = data;
      io.to(`private-interview-${roomId}`).emit('interview-hand-raised', { userId, userName });
      } catch(e) { console.error('[Socket interview-raise-hand]', e); }
    });

    // Transcript relay (broadcast to all in room)
    socket.on('interview-transcript', (data) => {
      const { roomId, userId, userName, text, role } = data;
      io.to(`private-interview-${roomId}`).emit('interview-transcript-update', { userId, userName, text, role, ts: Date.now() });
    });

    // Live 1:1 transcript relay
    socket.on('interview-live-transcript', (data) => {
      const { roomId, userId, text, role } = data;
      socket.to(roomId).emit('interview-live-transcript-update', { userId, text, role, ts: Date.now() });
    });

    // End 1:1 live interview
    socket.on('interview-end', (data) => {
      const { roomId } = data;
      const room = interviewRooms.get(roomId);
      if (room) {
        room.users.forEach(u => {
          const s = io.sockets.sockets.get(u.socketId);
          if (s) s.emit('interview-session-ended', { reason: 'Participant ended the interview.' });
        });
        interviewRooms.delete(roomId);
      }
    });
  });

  function tryCreateRoom(queueKey, io) {
    const queue = queues.get(queueKey);
    if (!queue || queue.length === 0) return;

    const requiredCount = queue[0].participantCount;
    
    if (queue.length >= requiredCount) {
      const matchedUsers = queue.slice(0, requiredCount);
      createRoom(queueKey, matchedUsers, io);
    }
  }

  function createRoom(queueKey, users, io) {
    console.log(`[Socket.IO] Creating room for users:`, users.map(u => u.userId));

    // Generate channel name (letters, numbers, underscore only)
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const channelName = roomId;

    const topics = getTopicsByMode(users[0].mode);
    const topic = topics[Math.floor(Math.random() * topics.length)];

    const room = {
      id: roomId,
      channelName,
      topic,
      users,
      createdAt: Date.now()
    };

    rooms.set(roomId, room);

    users.forEach(user => removeFromQueue(queueKey, user.userId));

    users.forEach(user => {
      const role = assignRole(users.length, user.userId);
      io.to(user.socketId).emit('match-found', {
        roomId,
        channelName,
        topic,
        participants: users.map(u => ({
          odlUserId: u.userId,
          odlUserName: u.userName,
          role: assignRole(users.length, u.userId)
        }))
      });
    });

    console.log(`[Socket.IO] Room created: ${roomId}`);
  }

  function assignRole(participantCount, userId) {
    const roles = ['Initiator', 'Moderator', 'Analyzer', 'Challenger', 'Supporter', 'Info Provider', 'Summarizer', 'Opposer'];
    const availableRoles = roles.slice(0, Math.min(participantCount, roles.length));
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return availableRoles[hash % availableRoles.length];
  }

  function removeFromQueue(queueKey, userId) {
    const queue = queues.get(queueKey);
    if (queue) {
      const filtered = queue.filter(u => u.userId !== userId);
      if (filtered.length > 0) {
        queues.set(queueKey, filtered);
      } else {
        queues.delete(queueKey);
      }
    }
  }

  function handleDisconnect(socket, fromDisconnectEvent = false) {
    const queueKey = socket.data.queueKey;
    const userInfo = socket.data.userInfo;
    if (queueKey && userInfo) {
      removeFromQueue(queueKey, userInfo.userId);
    }
    // Only call socket.disconnect() when NOT already inside the disconnect event
    if (!fromDisconnectEvent) {
      try { socket.disconnect(); } catch(_) {}
    }
  }

  function getTopicsByMode(mode) {
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
    
    const modeMap = {
      Corporate: allTopics.slice(0, 10),
      CurrentAffairs: allTopics.slice(10, 15),
      Abstract: allTopics.slice(15, 21),
      Technology: allTopics.slice(21, 25)
    };

    return modeMap[mode] || allTopics;
  }

  function clearInterviewTimeout(userId) {
    const t = interviewTimeouts.get(userId);
    if (t) { clearTimeout(t); interviewTimeouts.delete(userId); }
  }

  function removeFromInterviewQueue(queueKey, userId) {
    const q = interviewQueues.get(queueKey);
    if (!q) return;
    const filtered = q.filter(u => u.userId !== userId);
    if (filtered.length > 0) interviewQueues.set(queueKey, filtered);
    else interviewQueues.delete(queueKey);
  }

  function handleInterviewDisconnect(socket) {
    const queueKey = socket.data.interviewQueueKey;
    const userInfo = socket.data.interviewUserInfo;
    if (queueKey && userInfo) {
      removeFromInterviewQueue(queueKey, userInfo.userId);
      clearInterviewTimeout(userInfo.userId);
    }
    // Handle private room disconnect
    const privateRoomId = socket.data.privateInterviewRoom;
    if (privateRoomId) {
      const room = privateInterviewRooms.get(privateRoomId);
      if (room) {
        const wasHost = room.hostId === userInfo?.userId;
        room.participants = room.participants.filter(p => p.socketId !== socket.id);
        if (!wasHost) {
          socket.to(`private-interview-${privateRoomId}`).emit('interview-private-participant-update', {
            participants: room.participants.map(p => ({ userId: p.userId, userName: p.userName, role: p.role })),
          });
        }
      }
    }
  }

  function createInterviewRoom(users, io) {
    const roomId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const channelName = roomId;
    const interviewType = users[0].interviewType;

    const piQuestions = [
      'Tell me about yourself.',
      'What are your greatest strengths and weaknesses?',
      'Where do you see yourself in 5 years?',
      'Describe a challenge you faced and how you overcame it.',
      'Why do you want to work here?',
    ];
    const techQuestions = [
      'Explain the difference between a stack and a queue.',
      'What is the time complexity of binary search?',
      'Describe the SOLID principles.',
      'How would you design a URL shortener?',
      'What is the difference between SQL and NoSQL databases?',
    ];
    const topic = interviewType === 'Technical'
      ? techQuestions[Math.floor(Math.random() * techQuestions.length)]
      : piQuestions[Math.floor(Math.random() * piQuestions.length)];

    const room = { id: roomId, channelName, interviewType, topic, users, createdAt: Date.now() };
    interviewRooms.set(roomId, room);

    users.forEach(user => {
      const s = io.sockets.sockets.get(user.socketId);
      if (s) {
        s.join(roomId);
        s.emit('interview-match-found', {
          roomId,
          channelName,
          interviewType,
          topic,
          participants: users.map(u => ({ userId: u.userId, userName: u.userName, role: u.role })),
        });
      }
    });

    console.log(`[Interview] Room created: ${roomId} (${interviewType})`);
  }

  server.listen(port, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log(`> Server running on port ${port}`);
    console.log(`> Socket.IO ready at /api/socket/io`);
  });
});
