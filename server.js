const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

// Queue manager for real-time matchmaking
const queues = new Map();
const rooms = new Map();

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
    });

    socket.on('leave-queue', () => {
      handleDisconnect(socket);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
      handleDisconnect(socket);
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

  function handleDisconnect(socket) {
    const queueKey = socket.data.queueKey;
    const userInfo = socket.data.userInfo;
    if (queueKey && userInfo) {
      removeFromQueue(queueKey, userInfo.userId);
    }
    socket.disconnect();
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

  server.listen(port, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log(`> Server running on port ${port}`);
    console.log(`> Socket.IO ready at /api/socket/io`);
  });
});
