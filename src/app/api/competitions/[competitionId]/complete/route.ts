// ═══════════════════════════════════════════════════════════════════════════════
// Competition Complete API - POST
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { calculateTotalScore, determineRank } from '@/lib/competitions/scoring.service';

// ─── POST /api/competitions/[competitionId]/complete ───────────────────────────
// Complete the competition for the current user

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
      select: { id: true, name: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
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
        moduleScores: true
      }
    });

    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'You are not registered for this competition' },
        { status: 400 }
      );
    }

    if (participant.status === 'COMPLETED') {
      // Already completed - just return existing result
      const existingResult = await prisma.competitionResult.findUnique({
        where: { participantId: participant.id }
      });

      return NextResponse.json({
        success: true,
        data: {
          alreadyCompleted: true,
          result: existingResult
        }
      });
    }

    // Calculate total score
    const totalScoreResult = await calculateTotalScore(participant.id);

    if (!totalScoreResult.success || !totalScoreResult.data) {
      return NextResponse.json(
        { success: false, error: totalScoreResult.error || 'Failed to calculate score' },
        { status: 500 }
      );
    }

    // Calculate completion time
    const completionTime = participant.startedAt
      ? Math.floor((Date.now() - participant.startedAt.getTime()) / 1000)
      : 0;

    // Determine rank
    const rank = await determineRank(
      competitionId,
      user.id,
      totalScoreResult.data.totalScore,
      completionTime
    );

    // Determine badge type based on rank
    let badgeType: 'GOLD' | 'SILVER' | 'BRONZE' | 'PARTICIPATION' | null = null;
    if (rank === 1) badgeType = 'GOLD';
    else if (rank === 2) badgeType = 'SILVER';
    else if (rank === 3) badgeType = 'BRONZE';
    else if (rank <= 10) badgeType = 'PARTICIPATION';

    // Create or update result
    const existingResult = await prisma.competitionResult.findUnique({
      where: { participantId: participant.id }
    });

    let result;
    if (existingResult) {
      result = await prisma.competitionResult.update({
        where: { participantId: participant.id },
        data: {
          totalScore: totalScoreResult.data.totalScore,
          rank,
          completionTime,
          badgeType
        }
      });
    } else {
      result = await prisma.competitionResult.create({
        data: {
          competitionId,
          userId: user.id,
          participantId: participant.id,
          totalScore: totalScoreResult.data.totalScore,
          rank,
          completionTime,
          badgeType
        }
      });
    }

    // Update participant status
    await prisma.competitionParticipant.update({
      where: { id: participant.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // Update leaderboard
    await prisma.competitionLeaderboard.upsert({
      where: {
        competitionId_userId: {
          competitionId,
          userId: user.id
        }
      },
      create: {
        competitionId,
        userId: user.id,
        userName: participant.userName,
        userAvatar: participant.userAvatar,
        rank,
        totalScore: totalScoreResult.data.totalScore,
        moduleScores: totalScoreResult.data.moduleScores,
        universityName: participant.universityName,
        collegeName: participant.collegeName,
        completionTime,
        badgeType
      },
      update: {
        rank,
        totalScore: totalScoreResult.data.totalScore,
        moduleScores: totalScoreResult.data.moduleScores,
        completionTime,
        badgeType
      }
    });

    // Create user badge if earned
    if (badgeType) {
      const competition = await prisma.competition.findUnique({
        where: { id: competitionId },
        select: { name: true }
      });

      await prisma.userBadge.create({
        data: {
          userId: user.id,
          competitionId,
          badgeType,
          label: `${badgeType} - ${competition?.name || 'Competition'}`
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        result,
        totalScore: totalScoreResult.data.totalScore,
        rank,
        badgeType,
        completionTime,
        moduleScores: totalScoreResult.data.moduleScores
      }
    });
  } catch (error) {
    console.error('Error in POST /api/competitions/[id]/complete:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
