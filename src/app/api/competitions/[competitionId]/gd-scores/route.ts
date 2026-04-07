// ═══════════════════════════════════════════════════════════════════════════════
// GD Battle Scores API - POST
// Store GD evaluation scores for a participant
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
    const { scores, feedback, highlights, improvements, talkTimePercent } = body;

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

    // Get competition with modules
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        modules: true
      }
    });

    if (!competition) {
      return NextResponse.json(
        { success: false, error: 'Competition not found' },
        { status: 404 }
      );
    }

    // Verify competition is GD_BATTLE type
    if (competition.type !== 'GD_BATTLE') {
      return NextResponse.json(
        { success: false, error: 'This endpoint is only for GD Battle competitions' },
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
      }
    });

    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'You are not registered for this competition' },
        { status: 400 }
      );
    }

    // Map GD evaluation scores to module scores
    // Map: contentQuality -> RELEVANCE, communication -> COMMUNICATION, 
    // leadership -> LEADERSHIP, teamwork -> TEAMWORK, confidence -> CONFIDENCE
    const scoreMapping: Record<string, number> = {
      'COMMUNICATION': scores.communication || scores.overall || 70,
      'LEADERSHIP': scores.leadership || scores.overall || 70,
      'CONFIDENCE': scores.confidence || scores.overall || 70,
      'RELEVANCE': scores.contentQuality || scores.overall || 70,
      'TEAMWORK': scores.teamwork || scores.overall || 70,
      'GRAMMAR': scores.communication || scores.overall || 70,  // Use communication as proxy
      'INITIATIVE': scores.leadership || scores.overall || 70,  // Use leadership as proxy
      'BODY_LANGUAGE': scores.confidence || scores.overall || 70  // Use confidence as proxy
    };

    // Store scores for each module using upsert
    const moduleScorePromises = competition.modules.map(async (module) => {
      const scoreValue = scoreMapping[module.moduleType] || scores.overall || 70;
      
      // Check if score already exists for this participant+module+attempt
      const existingScore = await prisma.competitionModuleScore.findFirst({
        where: {
          participantId: participant.id,
          moduleId: module.id
        },
        orderBy: { attemptNumber: 'desc' }
      });

      if (existingScore) {
        // Update existing score
        return prisma.competitionModuleScore.update({
          where: { id: existingScore.id },
          data: {
            score: scoreValue,
            communicationScore: scores.communication,
            confidenceScore: scores.confidence,
            grammarScore: scores.communication, // proxy
            feedback: { feedback, highlights, improvements },
            completedAt: new Date()
          }
        });
      }

      // Create new score
      return prisma.competitionModuleScore.create({
        data: {
          participantId: participant.id,
          moduleId: module.id,
          score: scoreValue,
          communicationScore: scores.communication,
          confidenceScore: scores.confidence,
          grammarScore: scores.communication,
          attemptNumber: 1,
          feedback: { feedback, highlights, improvements },
          completedAt: new Date()
        }
      });
    });

    await Promise.all(moduleScorePromises);

    // Update participant status
    await prisma.competitionParticipant.update({
      where: { id: participant.id },
      data: {
        status: 'IN_PROGRESS'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        scores: scoreMapping,
        feedback,
        highlights,
        improvements,
        talkTimePercent
      }
    });

  } catch (error) {
    console.error('Error in POST /api/competitions/[id]/gd-scores:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
