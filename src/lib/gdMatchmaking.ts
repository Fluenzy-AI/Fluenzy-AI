import prisma, { GDMode, GDDifficulty, ParticipantStatus, GDPhase, GDRole } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// Session max duration (20 minutes in ms)
const MAX_SESSION_DURATION = 20 * 60 * 1000;

// GD Roles pool - different based on participant count
const ROLES_3_PARTICIPANTS: GDRole[] = ['Initiator', 'Analyzer', 'Summarizer'];
const ROLES_4_PARTICIPANTS: GDRole[] = ['Initiator', 'Moderator', 'Analyzer', 'Summarizer'];
const ROLES_5_PARTICIPANTS: GDRole[] = ['Initiator', 'Moderator', 'Analyzer', 'Challenger', 'Summarizer'];
const ROLES_6_PARTICIPANTS: GDRole[] = ['Initiator', 'Moderator', 'Analyzer', 'Challenger', 'Supporter', 'Summarizer'];
const ROLES_7_PARTICIPANTS: GDRole[] = ['Initiator', 'Moderator', 'Analyzer', 'Challenger', 'Supporter', 'InfoProvider', 'Summarizer'];
const ROLES_8_PARTICIPANTS: GDRole[] = ['Initiator', 'Moderator', 'Analyzer', 'Challenger', 'Supporter', 'InfoProvider', 'Summarizer', 'Opposer'];

// Topic pools by mode
const TOPICS: Record<string, string[]> = {
  Corporate: [
    "Should companies prioritize profit over employee well-being?",
    "Is remote work the future or a temporary trend?",
    "Should businesses have a social responsibility beyond profit?",
    "Is it ethical for companies to use AI for employee monitoring?",
    "Should there be a universal minimum wage across all industries?",
    "Is corporate transparency more important than competitive advantage?",
    "Should companies be required to disclose their environmental impact?",
    "Is it better to hire for skills or cultural fit?",
    "Should executive compensation be capped?",
    "Is work-life balance achievable in modern corporate culture?"
  ],
  CurrentAffairs: [
    "Should AI be regulated by governments?",
    "Is social media doing more harm than good to society?",
    "Should climate change be treated as a national security issue?",
    "Is universal basic income a viable solution for automation?",
    "Should data privacy be a fundamental right?",
    "Is space exploration worth the investment?",
    "Should voting be mandatory in democracies?",
    "Is cancel culture harmful to free speech?",
    "Should there be limits on free speech in the digital age?",
    "Is globalization beneficial or detrimental to developing nations?"
  ],
  Abstract: [
    "Is silence more powerful than words?",
    "Can money buy happiness?",
    "Is conformity the enemy of progress?",
    "Are rules meant to be broken?",
    "Is patience a virtue or a weakness?",
    "Can one person truly make a difference?",
    "Is it better to be feared or loved as a leader?",
    "Are we defined by our choices?",
    "Is truth always relative?",
    "Can technology ever truly be neutral?"
  ],
  BusinessEthics: [
    "Is it ethical for companies to use dark patterns in UX design?",
    "Should businesses be required to hire locally over cheaper foreign labor?",
    "Is price gouging during emergencies ever justified?",
    "Should companies disclose when they use AI in customer service?",
    "Is it ethical to target advertising at vulnerable populations?",
    "Should businesses take stands on social issues?",
    "Is aggressive tax avoidance unethical?",
    "Should companies be held responsible for employee mental health?",
    "Is it ethical to delete negative reviews?",
    "Should businesses prioritize sustainable practices over profits?"
  ],
  Technology: [
    "Will AI replace most human jobs within the next decade?",
    "Is cryptocurrency the future of finance or a bubble?",
    "Should social media platforms be treated as public utilities?",
    "Is technology making us more isolated?",
    "Should there be limits on surveillance technology?",
    "Is open source software more secure than proprietary?",
    "Should self-driving cars be held to higher safety standards?",
    "Is quantum computing a threat to cybersecurity?",
    "Should technology companies be liable for user-generated content?",
    "Is the internet a fundamental human right?"
  ],
  Random: []
};

// Combine all topics for Random mode
const ALL_TOPICS = [
  ...TOPICS.Corporate,
  ...TOPICS.CurrentAffairs,
  ...TOPICS.Abstract,
  ...TOPICS.BusinessEthics,
  ...TOPICS.Technology
];

export interface JoinQueueParams {
  userId: string;
  participantCount: number; // 3-8
  difficulty: GDDifficulty;
  mode: GDMode;
}

export interface MatchResult {
  success: boolean;
  sessionId?: string;
  channelName?: string;
  topic?: string;
  role?: GDRole;
  message?: string;
}

// Clean up old/expired sessions
export async function cleanupExpiredSessions(): Promise<void> {
  const now = new Date();
  const expiryTime = new Date(now.getTime() - MAX_SESSION_DURATION);
  
  // Find and update expired sessions
  await prisma.gDSession.updateMany({
    where: {
      phase: { not: GDPhase.Completed },
      createdAt: { lt: expiryTime }
    },
    data: {
      phase: GDPhase.Completed,
      endedAt: now
    }
  });
  
  // Update expired queue entries (older than 2 minutes)
  const queueExpiry = new Date(now.getTime() - 2 * 60 * 1000);
  await prisma.gDQueue.updateMany({
    where: {
      status: 'Queued',
      joinedAt: { lt: queueExpiry }
    },
    data: {
      status: 'Expired'
    }
  });
}

// Get roles based on participant count
function getRolesForCount(count: number): GDRole[] {
  switch (count) {
    case 3: return ROLES_3_PARTICIPANTS;
    case 4: return ROLES_4_PARTICIPANTS;
    case 5: return ROLES_5_PARTICIPANTS;
    case 6: return ROLES_6_PARTICIPANTS;
    case 7: return ROLES_7_PARTICIPANTS;
    case 8: return ROLES_8_PARTICIPANTS;
    default: return ROLES_4_PARTICIPANTS;
  }
}

// Get a random topic
function getRandomTopic(mode: string, difficulty: GDDifficulty): string {
  let topics: string[];
  
  if (mode === 'Random') {
    topics = ALL_TOPICS;
  } else {
    topics = TOPICS[mode] || TOPICS.Corporate;
  }
  
  return topics[Math.floor(Math.random() * topics.length)];
}

// Assign roles randomly without duplication
function assignRoles(participantCount: number): GDRole[] {
  const availableRoles = getRolesForCount(participantCount);
  const shuffled = [...availableRoles].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, participantCount);
}

// Add user to queue
export async function joinQueue(params: JoinQueueParams): Promise<{ queueId: string }> {
  const { userId, participantCount, difficulty, mode } = params;
  
  // Check if user already in queue
  const existingQueue = await prisma.gDQueue.findFirst({
    where: {
      userId,
      status: 'Queued'
    }
  });
  
  if (existingQueue) {
    return { queueId: existingQueue.id };
  }
  
  // Create queue entry
  const queueEntry = await prisma.gDQueue.create({
    data: {
      userId,
      participantCount,
      difficulty,
      mode,
      status: 'Queued'
    }
  });
  
  return { queueId: queueEntry.id };
}

// Find matches for users in queue
export async function findMatches(
  participantCount: number,
  difficulty: GDDifficulty,
  mode: GDMode
): Promise<string[]> {
  const now = new Date();
  const maxWaitTime = 30 * 1000; // 30 seconds max wait
  
  // Find users in queue waiting for same configuration
  const waitingUsers = await prisma.gDQueue.findMany({
    where: {
      status: 'Queued',
      participantCount,
      difficulty,
      mode: mode === 'Random' ? undefined : mode,
      joinedAt: {
        gte: new Date(now.getTime() - maxWaitTime)
      }
    },
    include: {
      user: true
    },
    orderBy: {
      joinedAt: 'asc'
    },
    take: participantCount
  });
  
  if (waitingUsers.length >= participantCount) {
    return waitingUsers.slice(0, participantCount).map(u => u.userId);
  }
  
  // If not enough users, try with flexible mode
  if (mode === 'Random') {
    const anyModeUsers = await prisma.gDQueue.findMany({
      where: {
        status: 'Queued',
        participantCount,
        difficulty,
        joinedAt: {
          gte: new Date(now.getTime() - maxWaitTime)
        }
      },
      include: {
        user: true
      },
      orderBy: {
        joinedAt: 'asc'
      },
      take: participantCount
    });
    
    if (anyModeUsers.length >= participantCount) {
      return anyModeUsers.slice(0, participantCount).map(u => u.userId);
    }
  }
  
  // Try with flexible difficulty
  const anyDifficultyUsers = await prisma.gDQueue.findMany({
    where: {
      status: 'Queued',
      participantCount,
      mode: mode === 'Random' ? undefined : mode,
      joinedAt: {
        gte: new Date(now.getTime() - maxWaitTime)
      }
    },
    include: {
      user: true
    },
    orderBy: {
      joinedAt: 'asc'
    },
    take: participantCount
  });
  
  if (anyDifficultyUsers.length >= participantCount) {
    return anyDifficultyUsers.slice(0, participantCount).map(u => u.userId);
  }
  
  return [];
}

// Create a new GD session
export async function createGDSession(
  userIds: string[],
  participantCount: number,
  difficulty: GDDifficulty,
  mode: GDMode
): Promise<{ sessionId: string; channelName: string; topic: string }> {
  const channelName = uuidv4();
  const topic = getRandomTopic(mode, difficulty);
  const roles = assignRoles(participantCount);
  
  // Create session
  const session = await prisma.gDSession.create({
    data: {
      channelName,
      topic,
      topicCategory: mode === 'Random' ? getRandomMode() : mode,
      difficulty,
      phase: GDPhase.Waiting,
      participants: {
        create: userIds.map((userId, index) => ({
          userId,
          role: roles[index],
          order: index,
          status: 'Active'
        }))
      }
    }
  });
  
  // Mark queue entries as matched
  await prisma.gDQueue.updateMany({
    where: {
      userId: { in: userIds },
      status: 'Queued'
    },
    data: {
      status: 'Joining',
      matchedAt: new Date()
    }
  });
  
  return {
    sessionId: session.id,
    channelName: session.channelName,
    topic: session.topic
  };
}

// Get user's assigned role in a session
export async function getUserRole(sessionId: string, userId: string): Promise<GDRole | null> {
  const participant = await prisma.gDParticipant.findFirst({
    where: {
      sessionId,
      userId
    }
  });
  
  return participant?.role || null;
}

// Update session phase
export async function updateSessionPhase(
  sessionId: string,
  phase: GDPhase
): Promise<void> {
  await prisma.gDSession.update({
    where: { id: sessionId },
    data: {
      phase,
      phaseStartedAt: new Date()
    }
  });
}

// End session
export async function endGDSession(sessionId: string): Promise<void> {
  await prisma.gDSession.update({
    where: { id: sessionId },
    data: {
      phase: GDPhase.Completed,
      endedAt: new Date()
    }
  });
  
  // Update all participants as left
  await prisma.gDParticipant.updateMany({
    where: {
      sessionId,
      status: 'Active'
    },
    data: {
      status: 'Left',
      leftAt: new Date()
    }
  });
}

// Get session details
export async function getSessionDetails(sessionId: string) {
  return prisma.gDSession.findUnique({
    where: { id: sessionId },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      }
    }
  });
}

// Get user's active session with cleanup
export async function getUserActiveSession(userId: string) {
  // First, clean up expired sessions
  await cleanupExpiredSessions();
  
  const queueEntry = await prisma.gDQueue.findFirst({
    where: {
      userId,
      status: { in: ['Queued', 'Joining'] }
    }
  });
  
  if (queueEntry) {
    return { type: 'queue', data: queueEntry };
  }
  
  const participant = await prisma.gDParticipant.findFirst({
    where: {
      userId,
      status: { in: ['Active', 'Joining'] }
    },
    include: {
      session: true
    }
  });
  
  if (participant) {
    return { type: 'session', data: participant };
  }
  
  return null;
}

// Remove user from queue
export async function leaveQueue(userId: string): Promise<void> {
  await prisma.gDQueue.deleteMany({
    where: {
      userId,
      status: 'Queued'
    }
  });
}

// Get a random mode when user selects Random
function getRandomMode(): GDMode {
  const modes: GDMode[] = ['Corporate', 'CurrentAffairs', 'Abstract', 'BusinessEthics', 'Technology'];
  return modes[Math.floor(Math.random() * modes.length)];
}

// Seed initial topics
export async function seedTopics(): Promise<void> {
  const topicCount = await prisma.gDTopic.count();
  
  if (topicCount === 0) {
    const topicsToCreate = [];
    
    for (const [category, topics] of Object.entries(TOPICS)) {
      for (const content of topics) {
        topicsToCreate.push({
          content,
          category: category as GDMode,
          difficulty: 'Medium' as GDDifficulty
        });
      }
    }
    
    await prisma.gDTopic.createMany({
      data: topicsToCreate
    });
    
    console.log(`Seeded ${topicsToCreate.length} GD topics`);
  }
}

// Export types and enums for external use
export { GDPhase, GDRole, GDMode, GDDifficulty, ParticipantStatus };
