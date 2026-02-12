import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma, { GDPhase } from '@/lib/prisma';
import { endGDSession, updateSessionPhase } from '@/lib/gdMatchmaking';

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
    const { sessionId, analytics, transcript } = body;

    // Verify user is part of this session and has permission to end it
    const participant = await prisma.gDParticipant.findFirst({
      where: {
        sessionId,
        userId: user.id,
        status: 'Active'
      },
      include: {
        session: true
      }
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'You are not part of this session or it has ended' },
        { status: 403 }
      );
    }

    // Only Moderator (if exists) or Initiator can end the session
    const canEnd = participant.role === 'Moderator' || 
                   participant.role === 'Initiator' ||
                   participant.session.phase === GDPhase.Completed;

    if (!canEnd) {
      return NextResponse.json(
        { error: 'Only the Moderator or Initiator can end the session' },
        { status: 403 }
      );
    }

    // Update session phase to completed
    await updateSessionPhase(sessionId, GDPhase.Completed);
    await endGDSession(sessionId);

    // Calculate final duration
    const sessionDuration = Math.floor(
      (Date.now() - participant.session.createdAt.getTime()) / 1000
    );

    // Save analytics for each participant if provided
    if (analytics && Array.isArray(analytics)) {
      for (const participantAnalytics of analytics) {
        await prisma.gDAnalytics.upsert({
          where: {
            id: participantAnalytics.id || undefined
          },
          update: participantAnalytics,
          create: {
            sessionId,
            participantId: participantAnalytics.participantId,
            speakingTime: participantAnalytics.speakingTime || 0,
            confidenceScore: participantAnalytics.confidenceScore || 0,
            paceScore: participantAnalytics.paceScore || 0,
            rolePerformanceScore: participantAnalytics.rolePerformanceScore || 0,
            volumeStability: participantAnalytics.volumeStability || 0
          }
        });
      }
    }

    // Save transcript if provided
    if (transcript && Array.isArray(transcript)) {
      await prisma.gDTranscript.createMany({
        data: transcript.map(t => ({
          sessionId,
          participantId: t.participantId,
          speakerName: t.speakerName,
          role: t.role,
          content: t.content,
          timestamp: t.timestamp,
          phase: GDPhase.Completed
        }))
      });
    }

    // Create history entries for all participants
    const allParticipants = await prisma.gDParticipant.findMany({
      where: { sessionId },
      include: { user: true }
    });

    for (const p of allParticipants) {
      // Get participant-specific analytics
      const participantAnalytics = analytics?.find(
        (a: any) => a.participantId === p.id
      );

      // Calculate overall score (simplified version)
      const overallScore = participantAnalytics
        ? (participantAnalytics.confidenceScore || 0) * 0.25 +
          (participantAnalytics.paceScore || 0) * 0.25 +
          (participantAnalytics.rolePerformanceScore || 0) * 0.5
        : null;

      await prisma.gDHistory.create({
        data: {
          userId: p.userId,
          sessionId,
          topic: participant.session.topic,
          topicCategory: participant.session.topicCategory,
          role: p.role,
          duration: sessionDuration,
          overallScore,
          communicationScore: participantAnalytics?.confidenceScore || null,
          confidenceScore: participantAnalytics?.confidenceScore || null,
          grammarScore: null,
          relevanceScore: null,
          leadershipScore: participantAnalytics?.rolePerformanceScore || null,
          roleScore: participantAnalytics?.rolePerformanceScore || null,
          strengths: [],
          improvements: []
        }
      });
    }

    return NextResponse.json({
      success: true,
      sessionId,
      duration: sessionDuration,
      topic: participant.session.topic,
      participantCount: allParticipants.length
    });
  } catch (error) {
    console.error('GD session end error:', error);
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    );
  }
}
