// ═══════════════════════════════════════════════════════════════════════════════
// Eligibility Service - Competition Registration Validation
// ═══════════════════════════════════════════════════════════════════════════════

import prisma from '@/lib/prisma';
import { EligibilityCheckResult, CompetitionUserContext, ApiResponse } from './competition.types';

// ─── Check Eligibility ─────────────────────────────────────────────────────────

export async function checkEligibility(
  competitionId: string,
  context: CompetitionUserContext
): Promise<ApiResponse<EligibilityCheckResult>> {
  const { userId, collegeAdminId, universityName } = context;

  try {
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        universities: { select: { universityName: true } },
        _count: { select: { participants: true } }
      }
    });

    if (!competition) {
      return { 
        success: false, 
        error: 'Competition not found' 
      };
    }

    const result: EligibilityCheckResult = {
      eligible: true,
      alreadyRegistered: false,
      competitionFull: false,
      registrationClosed: false
    };

    // Check if already registered
    const existingParticipant = await prisma.competitionParticipant.findUnique({
      where: {
        competitionId_userId: { competitionId, userId }
      }
    });

    if (existingParticipant) {
      // Get user's attempt count from module scores
      const attemptCount = await prisma.competitionModuleScore.aggregate({
        where: {
          participantId: existingParticipant.id
        },
        _max: {
          attemptNumber: true
        }
      });
      
      const currentAttempts = attemptCount._max.attemptNumber || 0;
      const maxAttempts = competition.maxAttempts || 1;
      const hasAttemptsRemaining = currentAttempts < maxAttempts;
      
      result.eligible = false;
      result.alreadyRegistered = true;
      result.isRegistered = true;
      result.participantStatus = existingParticipant.status;
      result.attemptCount = currentAttempts;
      result.maxAttempts = maxAttempts;
      result.hasAttemptsRemaining = hasAttemptsRemaining;
      result.reason = hasAttemptsRemaining 
        ? `You are registered. Attempts: ${currentAttempts}/${maxAttempts}` 
        : 'You have used all your attempts';
      return { success: true, data: result };
    }

    // Check competition status
    if (!['UPCOMING', 'ACTIVE'].includes(competition.status)) {
      result.eligible = false;
      result.reason = `Competition is ${competition.status.toLowerCase()}`;
      return { success: true, data: result };
    }

    // Check registration deadline
    if (competition.registrationDeadline && new Date() > competition.registrationDeadline) {
      result.eligible = false;
      result.registrationClosed = true;
      result.reason = 'Registration deadline has passed';
      return { success: true, data: result };
    }

    // Check participant limit
    if (competition.participantLimit && 
        competition._count.participants >= competition.participantLimit) {
      result.eligible = false;
      result.competitionFull = true;
      result.reason = 'Competition has reached maximum participants';
      return { success: true, data: result };
    }

    // Scope-based eligibility
    switch (competition.scope) {
      case 'GLOBAL':
        // Everyone is eligible for global competitions
        break;

      case 'UNIVERSITY':
        const isUniversityMatch = competition.universities.some(
          u => u.universityName === universityName
        );
        if (!isUniversityMatch) {
          result.eligible = false;
          result.reason = 'This competition is only for specific universities';
        }
        break;

      case 'COLLEGE':
        if (competition.collegeAdminId !== collegeAdminId) {
          result.eligible = false;
          result.reason = 'This competition is only for your college';
        }
        break;
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('Error checking eligibility:', error);
    return { success: false, error: 'Failed to check eligibility' };
  }
}

// ─── Register for Competition ──────────────────────────────────────────────────

export async function registerForCompetition(
  competitionId: string,
  context: CompetitionUserContext
): Promise<ApiResponse<{ participantId: string }>> {
  const { userId, collegeAdminId, collegeName, universityName } = context;

  // First check eligibility
  const eligibilityResult = await checkEligibility(competitionId, context);
  if (!eligibilityResult.success) {
    return { success: false, error: eligibilityResult.error };
  }

  if (!eligibilityResult.data?.eligible) {
    return { success: false, error: eligibilityResult.data?.reason || 'Not eligible' };
  }

  try {
    // Get user details
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { name: true, email: true, avatar: true }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Create participant
    const participant = await prisma.competitionParticipant.create({
      data: {
        competitionId,
        userId,
        userName: user.name,
        userEmail: user.email,
        userAvatar: user.avatar,
        universityName,
        collegeName,
        collegeAdminId,
        status: 'REGISTERED'
      },
      select: { id: true }
    });

    return { success: true, data: { participantId: participant.id } };
  } catch (error) {
    console.error('Error registering for competition:', error);
    return { success: false, error: 'Failed to register for competition' };
  }
}

// ─── Unregister from Competition ───────────────────────────────────────────────

export async function unregisterFromCompetition(
  competitionId: string,
  userId: string
): Promise<ApiResponse<{ unregistered: boolean }>> {
  try {
    const participant = await prisma.competitionParticipant.findUnique({
      where: {
        competitionId_userId: { competitionId, userId }
      },
      include: {
        competition: { select: { status: true } }
      }
    });

    if (!participant) {
      return { success: false, error: 'Not registered for this competition' };
    }

    // Can only unregister if competition hasn't started and participant hasn't started
    if (participant.competition.status === 'ACTIVE' && 
        participant.status !== 'REGISTERED') {
      return { 
        success: false, 
        error: 'Cannot unregister after starting the competition' 
      };
    }

    await prisma.competitionParticipant.delete({
      where: { id: participant.id }
    });

    return { success: true, data: { unregistered: true } };
  } catch (error) {
    console.error('Error unregistering from competition:', error);
    return { success: false, error: 'Failed to unregister from competition' };
  }
}

// ─── Get Participant Status ────────────────────────────────────────────────────

export async function getParticipantStatus(
  competitionId: string,
  userId: string
): Promise<ApiResponse<{
  isRegistered: boolean;
  status?: string;
  registeredAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  rank?: number;
  totalScore?: number;
}>> {
  try {
    const participant = await prisma.competitionParticipant.findUnique({
      where: {
        competitionId_userId: { competitionId, userId }
      },
      include: {
        result: {
          select: { rank: true, totalScore: true }
        }
      }
    });

    if (!participant) {
      return { 
        success: true, 
        data: { isRegistered: false } 
      };
    }

    return {
      success: true,
      data: {
        isRegistered: true,
        status: participant.status,
        registeredAt: participant.registeredAt,
        startedAt: participant.startedAt || undefined,
        completedAt: participant.completedAt || undefined,
        rank: participant.result?.rank || undefined,
        totalScore: participant.result?.totalScore || undefined
      }
    };
  } catch (error) {
    console.error('Error getting participant status:', error);
    return { success: false, error: 'Failed to get participant status' };
  }
}
