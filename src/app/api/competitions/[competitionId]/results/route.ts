// ═══════════════════════════════════════════════════════════════════════════════
// Competition Results API - GET / POST
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { submitModuleScore, calculateTotalScore } from '@/lib/competitions/scoring.service';
import { z } from 'zod';

// ─── Validation Schema ─────────────────────────────────────────────────────────

const moduleScoreSchema = z.object({
  moduleId: z.string().min(1),
  audioUrl: z.string().optional(),
  textResponse: z.string().optional(),
  attemptNumber: z.number().min(1).optional()
});

// ─── GET /api/competitions/[competitionId]/results ─────────────────────────────

export async function GET(
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Get current user
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // If userId provided and different from current user, check admin access
    const targetUserId = userId || user.id;
    if (targetUserId !== user.id) {
      const isAdmin = user.role === 'Admin' || user.role === 'SUPER_ADMIN';
      const collegeAdmin = await prisma.collegeAdmin.findUnique({
        where: { email: session.user.email }
      });
      const portalStaff = await prisma.portalStaff.findUnique({
        where: { email: session.user.email }
      });

      if (!isAdmin && !collegeAdmin && !portalStaff) {
        return NextResponse.json(
          { success: false, error: 'Not authorized to view other user results' },
          { status: 403 }
        );
      }
    }

    // Get participant
    const participant = await prisma.competitionParticipant.findUnique({
      where: {
        competitionId_userId: {
          competitionId,
          userId: targetUserId
        }
      },
      include: {
        moduleScores: {
          include: {
            module: {
              select: { moduleType: true, weight: true, order: true }
            }
          },
          orderBy: { completedAt: 'desc' }
        },
        result: true
      }
    });

    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'Participant not found' },
        { status: 404 }
      );
    }

    // Get competition for context
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: {
        name: true,
        type: true,
        status: true,
        modules: {
          select: { id: true, moduleType: true, weight: true, order: true }
        }
      }
    });

    // Group scores by module and calculate best attempt
    const moduleResults = competition?.modules.map(module => {
      const scores = participant.moduleScores.filter(s => s.moduleId === module.id);
      const bestAttempt = scores.reduce((best, current) => 
        current.score > (best?.score || 0) ? current : best
      , scores[0]);

      return {
        moduleId: module.id,
        moduleType: module.moduleType,
        weight: module.weight,
        order: module.order,
        attempts: scores.length,
        bestScore: bestAttempt?.score || null,
        latestScore: scores[0]?.score || null,
        breakdown: bestAttempt ? {
          pronunciation: bestAttempt.pronunciationScore,
          grammar: bestAttempt.grammarScore,
          confidence: bestAttempt.confidenceScore,
          clarity: bestAttempt.clarityScore,
          fluency: bestAttempt.fluencyScore,
          pace: bestAttempt.paceScore,
          communication: bestAttempt.communicationScore
        } : null
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: {
        competitionName: competition?.name,
        competitionStatus: competition?.status,
        participantStatus: participant.status,
        registeredAt: participant.registeredAt,
        startedAt: participant.startedAt,
        completedAt: participant.completedAt,
        moduleResults,
        finalResult: participant.result ? {
          totalScore: participant.result.totalScore,
          rank: participant.result.rank,
          badgeType: participant.result.badgeType,
          completionTime: participant.result.completionTime,
          rewardsIssued: participant.result.rewardsIssued
        } : null
      }
    });
  } catch (error) {
    console.error('Error in GET /api/competitions/[id]/results:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── POST /api/competitions/[competitionId]/results ────────────────────────────
// Submit a module score (called after completing a module)

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
    const body = await request.json();

    // Validate body
    const validation = moduleScoreSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: validation.error.issues },
        { status: 400 }
      );
    }

    const scoreData = validation.data;

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

    // Get participant
    const participant = await prisma.competitionParticipant.findUnique({
      where: {
        competitionId_userId: {
          competitionId,
          userId: user.id
        }
      }
    });

    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'You are not registered for this competition' },
        { status: 400 }
      );
    }

    if (participant.status === 'COMPLETED' || participant.status === 'DISQUALIFIED') {
      return NextResponse.json(
        { success: false, error: 'Cannot submit scores: competition already completed' },
        { status: 400 }
      );
    }

    // Submit the score (AI evaluation happens inside submitModuleScore)
    const result = await submitModuleScore({
      competitionId,
      participantId: participant.id,
      moduleId: scoreData.moduleId,
      userId: user.id,
      audioUrl: scoreData.audioUrl,
      textResponse: scoreData.textResponse,
      attemptNumber: scoreData.attemptNumber
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.data
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/competitions/[id]/results:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
