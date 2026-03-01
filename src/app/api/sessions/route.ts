import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { calculateInterviewScore } from '@/lib/utils';
import { incrementModuleUsage } from '@/lib/billing';

const getDurationMinutes = (
  start?: Date | null,
  end?: Date | null,
  stored?: number | null
) => {
  if (typeof stored === 'number' && stored > 0) return stored;
  if (!start || !end) return null;
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return 0;
  const minutes = Math.round(diffMs / 60000);
  return minutes > 0 ? minutes : 1;
};

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

    const {
      module,
      targetCompany,
      role,
      startTime,
      endTime,
      transcripts,
      aggregateScore,
      status
    } = await request.json();

    const sessionId = `S_${Date.now()}`;

    const duration = endTime && startTime
      ? Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)
      : null;

    console.log('[SESSION_CREATE_START]', { userId: user.id, module, sessionId, timestamp: new Date().toISOString() });

    const newSession = await (prisma as any).session.create({
      data: {
        sessionId,
        userId: user.id,
        module,
        targetCompany,
        role,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        duration,
        aggregateScore,
        status,
        transcripts: {
          create: transcripts.map((t: any, index: number) => ({
            turnNumber: index + 1,
            aiPrompt: t.aiPrompt,
            userAnswer: t.userAnswer,
            aiFeedback: t.aiFeedback,
            idealAnswer: t.idealAnswer,
            clarityScore: t.scores?.clarity,
            relevanceScore: t.scores?.relevance,
            grammarScore: t.scores?.grammar,
            confidenceScore: t.scores?.confidence,
            technicalAccuracyScore: t.scores?.technicalAccuracy,
            perQuestionScore: t.perQuestionScore
          }))
        }
      },
      include: {
        transcripts: true
      }
    });

    // Calculate real score based on transcripts
    const { score, status: calculatedStatus } = calculateInterviewScore(newSession.transcripts, duration || undefined);

    // Update the session with real score
    await (prisma as any).session.update({
      where: { id: newSession.id },
      data: {
        aggregateScore: score / 100, // Store as decimal
        status: calculatedStatus
      }
    });

    console.log('[SESSION_SAVED_SUCCESS]', { sessionId: newSession.sessionId, duration, score: score / 100 });

    // ============================================================
    // CRITICAL FIX: Increment module usage AFTER session created
    // ============================================================
    console.log('[USAGE_INCREMENT_START]', { userId: user.id, module, sessionId });
    
    const usageResult = await incrementModuleUsage(user.id, module as any);

    if (!usageResult.success) {
      console.error('[USAGE_INCREMENT_FAILED]', { 
        userId: user.id, 
        module, 
        error: usageResult.error 
      });
      // Log error but don't fail - session is already saved and valuable
    } else {
      console.log('[USAGE_INCREMENT_SUCCESS]', { 
        userId: user.id, 
        module, 
        newUsage: usageResult.currentUsage,
        remaining: usageResult.remaining,
        limitReached: usageResult.remaining === 0
      });
    }

    // ============================================================
    // Return comprehensive response with both session and usage info
    // ============================================================
    return NextResponse.json({
      sessionId: newSession.sessionId,
      session: {
        id: newSession.id,
        sessionId: newSession.sessionId,
        module: newSession.module,
        duration: newSession.duration,
        score: score / 100,
        status: calculatedStatus,
        createdAt: newSession.createdAt
      },
      usage: {
        currentUsage: usageResult.success ? usageResult.currentUsage : undefined,
        remaining: usageResult.success ? usageResult.remaining : undefined,
        isLimitExceeded: usageResult.success ? usageResult.remaining === 0 : undefined,
        usageIncrementFailed: !usageResult.success
      }
    });
  } catch (error) {
    console.error('[SESSION_SAVE_ERROR]', { error, timestamp: new Date().toISOString() });
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
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

    const sessions = await (prisma as any).session.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        sessionId: true,
        module: true,
        createdAt: true,
        startTime: true,
        endTime: true,
        aggregateScore: true,
        status: true,
        targetCompany: true,
        role: true,
        duration: true
      }
    });

    const formattedSessions = sessions.map((session: any) => ({
      ...session,
      durationMinutes: getDurationMinutes(session.startTime, session.endTime, session.duration)
    }));

    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error('Sessions fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}