import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { calculateInterviewScore } from '@/lib/utils';

// NOTE: incrementModuleUsage is now called in /api/session-start (on interview start)
// not here. This prevents refresh abuse.

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
    // NOTE: Usage is now decremented on SESSION START (not here)
    // via /api/session-start endpoint. This prevents refresh abuse.
    // We only save session data here, no usage increment needed.
    // ============================================================
    console.log('[SESSION_COMPLETE]', { 
      userId: user.id, 
      module, 
      sessionId: newSession.sessionId,
      note: 'Usage was already decremented on session start'
    });

    // Mark the active session as completed (if tracking is enabled)
    const sessionToken = sessionId; // Use the sessionId as reference
    try {
      await (prisma as any).activeSession.updateMany({
        where: { 
          userId: user.id,
          module,
          status: 'active'
        },
        data: {
          status: 'completed',
          endTime: new Date()
        }
      });
      console.log('[ACTIVE_SESSION_COMPLETED]', { userId: user.id, module });
    } catch (dbError) {
      // If ActiveSession model doesn't exist yet, silently continue
      console.warn('[ACTIVE_SESSION_UPDATE_SKIPPED]', { 
        reason: 'Model may not exist yet'
      });
    }

    // ============================================================
    // Return comprehensive response with session info
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
      message: 'Session saved successfully'
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
      include: {
        // ── Critical: must include transcripts for History modal to display ──
        // Previously this was a `select` with NO transcripts field, causing
        // the "No turn transcripts recorded" UI state even when data existed.
        transcripts: {
          orderBy: [{ createdAt: 'asc' }, { turnNumber: 'asc' }],
          select: {
            id: true,
            turnNumber: true,
            aiPrompt: true,
            userAnswer: true,
            aiFeedback: true,
            idealAnswer: true,
            clarityScore: true,
            relevanceScore: true,
            grammarScore: true,
            confidenceScore: true,
            technicalAccuracyScore: true,
            perQuestionScore: true,
            createdAt: true,
          },
        },
      },
      // Use select only for session-level scalar fields (avoid returning full user object)
    });

    const formattedSessions = sessions.map((s: any) => ({
      sessionId:      s.sessionId,
      module:         s.module,
      createdAt:      s.createdAt,
      startTime:      s.startTime,
      endTime:        s.endTime,
      aggregateScore: s.aggregateScore,
      status:         s.status,
      targetCompany:  s.targetCompany,
      role:           s.role,
      duration:       s.duration,
      durationMinutes: getDurationMinutes(s.startTime, s.endTime, s.duration),
      // Map Transcript rows to the shape the History UI expects
      transcripts: (s.transcripts || []).map((t: any) => ({
        turnNumber:       t.turnNumber,
        aiPrompt:         t.aiPrompt,
        userAnswer:       t.userAnswer,
        aiFeedback:       t.aiFeedback,
        idealAnswer:      t.idealAnswer,
        perQuestionScore: t.perQuestionScore,
        scores: {
          clarity:           t.clarityScore,
          relevance:         t.relevanceScore,
          grammar:           t.grammarScore,
          confidence:        t.confidenceScore,
          technicalAccuracy: t.technicalAccuracyScore,
        },
      })),
    }));

    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error('Sessions fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}