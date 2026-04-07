// ═══════════════════════════════════════════════════════════════════════════════
// Competition Start API - POST
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// ─── POST /api/competitions/[competitionId]/start ──────────────────────────────
// Start the competition for the current user

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { competitionId } = await params;

    // Get user
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get competition
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: {
        id: true,
        status: true,
        startDate: true,
        endDate: true,
        durationPerModule: true,
        maxAttempts: true,
        modules: {
          select: { id: true, moduleType: true, order: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!competition) {
      return NextResponse.json(
        { success: false, error: 'Competition not found' },
        { status: 404 }
      );
    }

    // Check competition is active
    if (competition.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Competition is not currently active' },
        { status: 400 }
      );
    }

    const now = new Date();
    if (now < competition.startDate || now > competition.endDate) {
      return NextResponse.json(
        { success: false, error: 'Competition is not within the active period' },
        { status: 400 }
      );
    }

    // Get participant
    const participant = await prisma.competitionParticipant.findUnique({
      where: {
        competitionId_userId: {
          competitionId,
          userId: user.id
        }
      },
      include: {
        result: true
      }
    });

    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'You are not registered for this competition' },
        { status: 400 }
      );
    }

    if (participant.status === 'DISQUALIFIED') {
      return NextResponse.json(
        { success: false, error: 'You have been disqualified from this competition' },
        { status: 400 }
      );
    }

    // Check max attempts - count how many times user has completed
    if (participant.status === 'COMPLETED' && participant.result) {
      // Count previous attempts by checking CompetitionModuleScore attemptNumber
      const maxAttemptUsed = await prisma.competitionModuleScore.aggregate({
        where: { participantId: participant.id },
        _max: { attemptNumber: true }
      });
      
      const attemptCount = maxAttemptUsed._max?.attemptNumber || 1;
      
      if (attemptCount >= competition.maxAttempts) {
        return NextResponse.json(
          { 
            success: false, 
            error: `You have used all ${competition.maxAttempts} attempt(s) for this competition` 
          },
          { status: 400 }
        );
      }
      
      // Allow retry - reset status for new attempt
      await prisma.competitionParticipant.update({
        where: { id: participant.id },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          completedAt: null
        }
      });
    } else if (participant.status !== 'COMPLETED') {
      // Update participant status to IN_PROGRESS
      await prisma.competitionParticipant.update({
        where: { id: participant.id },
        data: {
          status: 'IN_PROGRESS',
          startedAt: participant.startedAt || new Date()
        }
      });
    }

    // Get completed modules
    const completedModules = await prisma.competitionModuleScore.findMany({
      where: { participantId: participant.id },
      select: { moduleId: true }
    });

    const completedModuleIds = completedModules.map(m => m.moduleId);

    // Get current attempt number
    const maxAttempt = await prisma.competitionModuleScore.aggregate({
      where: { participantId: participant.id },
      _max: { attemptNumber: true }
    });

    return NextResponse.json({
      success: true,
      data: {
        participant: {
          id: participant.id,
          status: 'IN_PROGRESS',
          startedAt: participant.startedAt || new Date()
        },
        modules: competition.modules,
        completedModules: completedModuleIds,
        durationPerModule: competition.durationPerModule,
        currentAttempt: (maxAttempt._max?.attemptNumber || 0) + 1,
        maxAttempts: competition.maxAttempts
      }
    });
  } catch (error) {
    console.error('Error in POST /api/competitions/[id]/start:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
