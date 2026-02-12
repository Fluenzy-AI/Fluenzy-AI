import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  joinQueue,
  findMatches,
  createGDSession,
  getUserRole,
  getSessionDetails,
  leaveQueue,
  getUserActiveSession,
  seedTopics,
  cleanupExpiredSessions
} from '@/lib/gdMatchmaking';
import { GDDifficulty, GDMode, GDPhase } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { action, participantCount, difficulty, mode, force } = body;

    // Check GD usage limits
    const planSettings = await prisma.globalPlanSettings.findFirst({
      where: { plan: user.plan }
    });

    const isUnlimited = planSettings?.isUnlimited || false;
    const monthlyLimit = planSettings?.monthlyLimit || 3;
    
    if (!isUnlimited && user.gdUsage >= monthlyLimit) {
      return NextResponse.json(
        { error: 'GD usage limit reached. Please upgrade your plan.' },
        { status: 403 }
      );
    }

    switch (action) {
      case 'cleanup': {
        // Force cleanup of all expired sessions for this user
        const now = new Date();
        const expiryTime = new Date(now.getTime() - 20 * 60 * 1000); // 20 minutes ago
        
        // Clear old queue entries
        await prisma.gDQueue.updateMany({
          where: {
            userId: user.id,
            status: { in: ['Queued', 'Expired'] }
          },
          data: { status: 'Expired' }
        });
        
        // Clear old participant entries
        await prisma.gDParticipant.updateMany({
          where: {
            userId: user.id,
            status: { in: ['Active', 'Joining'] }
          },
          data: {
            status: 'Left',
            leftAt: now
          }
        });
        
        return NextResponse.json({ 
          success: true, 
          message: 'Old sessions cleared. You can now join a new GD.' 
        });
      }

      case 'join': {
        // Validate inputs
        const count = Math.min(Math.max(parseInt(participantCount) || 4, 3), 8);
        const diff = (difficulty as GDDifficulty) || 'Medium';
        const gdMode = (mode as GDMode) || 'Random';

        // Check if user already has an active session
        let existingSession = await getUserActiveSession(user.id);
        
        // If force flag is set, clear old sessions and retry
        if (existingSession && force) {
          // Force clear old session
          await prisma.gDQueue.updateMany({
            where: { userId: user.id, status: { in: ['Queued', 'Expired'] } },
            data: { status: 'Expired' }
          });
          
          await prisma.gDParticipant.updateMany({
            where: { userId: user.id, status: { in: ['Active', 'Joining'] } },
            data: { status: 'Left', leftAt: new Date() }
          });
          
          // Clear any old sessions
          await cleanupExpiredSessions();
          
          // Check again
          existingSession = await getUserActiveSession(user.id);
        }
        
        if (existingSession) {
          return NextResponse.json(
            { error: 'You already have an active GD session or are in queue' },
            { status: 400 }
          );
        }

        // Seed topics if needed
        await seedTopics();

        // Join the queue
        const { queueId } = await joinQueue({
          userId: user.id,
          participantCount: count,
          difficulty: diff,
          mode: gdMode
        });

        // Try to find matches immediately
        const matchedUserIds = await findMatches(count, diff, gdMode);

        if (matchedUserIds.length >= count) {
          // Create the GD session
          const { sessionId, channelName, topic } = await createGDSession(
            matchedUserIds,
            count,
            diff,
            gdMode
          );

          // Get participants with their roles
          const sessionDetails = await getSessionDetails(sessionId);
          
          // Get current user's role
          const currentUserRole = await getUserRole(sessionId, user.id);

          // Update user's gdUsage
          await prisma.users.update({
            where: { id: user.id },
            data: { gdUsage: { increment: 1 } }
          });

          return NextResponse.json({
            success: true,
            matched: true,
            queueId,
            sessionId,
            channelName,
            topic,
            role: currentUserRole,
            participants: sessionDetails?.participants.map(p => ({
              userId: p.userId,
              name: p.user?.name,
              avatar: p.user?.avatar,
              role: p.role
            }))
          });
        }

        // No match yet, user is in queue
        return NextResponse.json({
          success: true,
          matched: false,
          queueId,
          message: 'Looking for participants...',
          estimatedWait: '30 seconds'
        });
      }

      case 'leave': {
        await leaveQueue(user.id);
        return NextResponse.json({ success: true, message: 'Left queue' });
      }

      case 'check': {
        const result = await getUserActiveSession(user.id);
        
        if (!result) {
          return NextResponse.json({ status: 'idle' });
        }

        if (result.type === 'queue') {
          const queueData = result.data as any;
          const matchedUserIds = await findMatches(
            queueData.participantCount,
            queueData.difficulty,
            queueData.mode
          );

          if (matchedUserIds.length >= queueData.participantCount) {
            const { sessionId, channelName, topic } = await createGDSession(
              matchedUserIds,
              queueData.participantCount,
              queueData.difficulty,
              queueData.mode
            );

            const sessionDetails = await getSessionDetails(sessionId);
            const currentUserRole = await getUserRole(sessionId, user.id);

            return NextResponse.json({
              success: true,
              matched: true,
              sessionId,
              channelName,
              topic,
              role: currentUserRole,
              participants: sessionDetails?.participants.map(p => ({
                userId: p.userId,
                name: p.user?.name,
                avatar: p.user?.avatar,
                role: p.role
              }))
            });
          }

          return NextResponse.json({
            status: 'waiting',
            queueId: queueData.id
          });
        }

        if (result.type === 'session') {
          const sessionData = result.data as any;
          const sessionDetails = await getSessionDetails(sessionData.sessionId);
          const currentUserRole = await getUserRole(sessionData.sessionId, user.id);

          return NextResponse.json({
            status: 'active',
            sessionId: sessionData.sessionId,
            channelName: sessionDetails?.channelName,
            topic: sessionDetails?.topic,
            phase: sessionDetails?.phase,
            role: currentUserRole,
            participants: sessionDetails?.participants.map((p: any) => ({
              userId: p.userId,
              name: p.user?.name,
              avatar: p.user?.avatar,
              role: p.role,
              status: p.status
            }))
          });
        }

        return NextResponse.json({ status: 'idle' });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('GD matchmaking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's active session status
    const result = await getUserActiveSession(user.id);

    if (!result) {
      return NextResponse.json({ hasActiveSession: false });
    }

    return NextResponse.json({
      hasActiveSession: true,
      type: result.type,
      ...result.data
    });
  } catch (error) {
    console.error('GD status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
