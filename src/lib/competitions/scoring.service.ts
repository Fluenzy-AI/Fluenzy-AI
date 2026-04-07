// ═══════════════════════════════════════════════════════════════════════════════
// Scoring Service - AI Evaluation & Score Calculation
// ═══════════════════════════════════════════════════════════════════════════════

import prisma from '@/lib/prisma';
import { CompetitionModuleType, BadgeType } from '@prisma/client';
import { 
  ModuleEvaluation, 
  ModuleSubmissionData, 
  ModuleScoreResult,
  ApiResponse 
} from './competition.types';

// ─── Evaluate Module Submission ────────────────────────────────────────────────

export async function evaluateModuleSubmission(
  submission: ModuleSubmissionData
): Promise<ApiResponse<ModuleScoreResult>> {
  const { competitionId, moduleId, participantId, moduleType } = submission;

  try {
    // Get module configuration
    const module = await prisma.competitionModule.findUnique({
      where: { id: moduleId },
      select: { config: true, weight: true }
    });

    if (!module) {
      return { success: false, error: 'Module not found' };
    }

    // Get participant's attempt count
    const attemptCount = await prisma.competitionModuleScore.count({
      where: { participantId, moduleId }
    });

    // Check max attempts
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { maxAttempts: true }
    });

    if (competition && attemptCount >= competition.maxAttempts) {
      return { success: false, error: 'Maximum attempts reached for this module' };
    }

    // Perform AI evaluation based on module type
    const evaluation = await performAIEvaluation(submission, moduleType);

    // Save score to database
    const score = await prisma.competitionModuleScore.create({
      data: {
        participantId,
        moduleId,
        score: evaluation.overallModuleScore,
        pronunciationScore: evaluation.pronunciationScore,
        grammarScore: evaluation.grammarScore,
        confidenceScore: evaluation.confidenceScore,
        clarityScore: evaluation.clarityScore,
        fluencyScore: evaluation.fluencyScore,
        paceScore: evaluation.paceScore,
        communicationScore: evaluation.communicationScore,
        attemptNumber: attemptCount + 1,
        rawAiResponse: evaluation as unknown as object,
        feedback: evaluation.feedback as unknown as object
      }
    });

    // Update participant status if this is their first module
    await prisma.competitionParticipant.update({
      where: { id: participantId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: { set: new Date() }
      }
    });

    return {
      success: true,
      data: {
        success: true,
        score: evaluation.overallModuleScore,
        evaluation,
        moduleId,
        attemptNumber: attemptCount + 1
      }
    };
  } catch (error) {
    console.error('Error evaluating module submission:', error);
    return { success: false, error: 'Failed to evaluate submission' };
  }
}

// ─── Perform AI Evaluation ─────────────────────────────────────────────────────

async function performAIEvaluation(
  submission: ModuleSubmissionData,
  moduleType: CompetitionModuleType
): Promise<ModuleEvaluation> {
  // In a real implementation, this would call the Gemini API
  // For now, we'll generate scores based on the module type
  
  const baseEvaluation: ModuleEvaluation = {
    pronunciationScore: 0,
    grammarScore: 0,
    confidenceScore: 0,
    clarityScore: 0,
    fluencyScore: 0,
    paceScore: 0,
    communicationScore: 0,
    overallModuleScore: 0,
    feedback: {
      strengths: [],
      improvements: [],
      detailedFeedback: ''
    }
  };

  // Generate evaluation based on module type
  // In production, this would call Gemini API with appropriate prompts
  switch (moduleType) {
    case 'READ_ALOUD':
      return generateReadAloudEvaluation(submission);
    case 'LISTEN_AND_REPEAT':
      return generateListenRepeatEvaluation(submission);
    case 'COMPREHENSION':
      return generateComprehensionEvaluation(submission);
    case 'CONVERSATION':
      return generateConversationEvaluation(submission);
    case 'EXTEMPORANEOUS':
      return generateExtemporaneousEvaluation(submission);
    case 'LISTEN_AND_SUMMARIZE':
      return generateSummarizeEvaluation(submission);
    default:
      return baseEvaluation;
  }
}

// ─── Module-Specific Evaluation Functions ──────────────────────────────────────

function generateReadAloudEvaluation(submission: ModuleSubmissionData): ModuleEvaluation {
  // Weights for read aloud: pronunciation (30%), clarity (25%), pace (25%), fluency (20%)
  const pronunciationScore = generateRandomScore(60, 95);
  const clarityScore = generateRandomScore(65, 95);
  const paceScore = generateRandomScore(60, 90);
  const fluencyScore = generateRandomScore(55, 95);

  const overallModuleScore = 
    pronunciationScore * 0.30 +
    clarityScore * 0.25 +
    paceScore * 0.25 +
    fluencyScore * 0.20;

  return {
    pronunciationScore,
    grammarScore: 0,
    confidenceScore: 0,
    clarityScore,
    fluencyScore,
    paceScore,
    communicationScore: 0,
    overallModuleScore: Math.round(overallModuleScore * 100) / 100,
    feedback: {
      strengths: generateStrengths(['pronunciation', 'clarity', 'pace'], [pronunciationScore, clarityScore, paceScore]),
      improvements: generateImprovements(['pronunciation', 'clarity', 'pace'], [pronunciationScore, clarityScore, paceScore]),
      detailedFeedback: 'Your reading was clear and well-paced. Focus on maintaining consistent pronunciation of complex words.'
    }
  };
}

function generateListenRepeatEvaluation(submission: ModuleSubmissionData): ModuleEvaluation {
  const pronunciationScore = generateRandomScore(60, 95);
  const clarityScore = generateRandomScore(60, 95);
  const fluencyScore = generateRandomScore(55, 90);

  const overallModuleScore = 
    pronunciationScore * 0.40 +
    clarityScore * 0.35 +
    fluencyScore * 0.25;

  return {
    pronunciationScore,
    grammarScore: 0,
    confidenceScore: 0,
    clarityScore,
    fluencyScore,
    paceScore: 0,
    communicationScore: 0,
    overallModuleScore: Math.round(overallModuleScore * 100) / 100,
    feedback: {
      strengths: generateStrengths(['pronunciation', 'clarity'], [pronunciationScore, clarityScore]),
      improvements: generateImprovements(['pronunciation', 'fluency'], [pronunciationScore, fluencyScore]),
      detailedFeedback: 'Good repetition accuracy. Work on capturing the natural rhythm of the original speech.'
    }
  };
}

function generateComprehensionEvaluation(submission: ModuleSubmissionData): ModuleEvaluation {
  const grammarScore = generateRandomScore(65, 98);
  const clarityScore = generateRandomScore(60, 95);
  const communicationScore = generateRandomScore(60, 95);

  const overallModuleScore = 
    grammarScore * 0.35 +
    clarityScore * 0.35 +
    communicationScore * 0.30;

  return {
    pronunciationScore: 0,
    grammarScore,
    confidenceScore: 0,
    clarityScore,
    fluencyScore: 0,
    paceScore: 0,
    communicationScore,
    overallModuleScore: Math.round(overallModuleScore * 100) / 100,
    feedback: {
      strengths: generateStrengths(['comprehension', 'clarity'], [grammarScore, clarityScore]),
      improvements: generateImprovements(['detail', 'structure'], [grammarScore, communicationScore]),
      detailedFeedback: 'Strong comprehension demonstrated. Consider providing more specific details in your responses.'
    }
  };
}

function generateConversationEvaluation(submission: ModuleSubmissionData): ModuleEvaluation {
  const grammarScore = generateRandomScore(60, 95);
  const confidenceScore = generateRandomScore(55, 95);
  const clarityScore = generateRandomScore(60, 95);
  const fluencyScore = generateRandomScore(55, 90);
  const communicationScore = generateRandomScore(60, 95);

  const overallModuleScore = 
    grammarScore * 0.20 +
    confidenceScore * 0.20 +
    clarityScore * 0.20 +
    fluencyScore * 0.20 +
    communicationScore * 0.20;

  return {
    pronunciationScore: 0,
    grammarScore,
    confidenceScore,
    clarityScore,
    fluencyScore,
    paceScore: 0,
    communicationScore,
    overallModuleScore: Math.round(overallModuleScore * 100) / 100,
    feedback: {
      strengths: generateStrengths(['communication', 'confidence', 'grammar'], [communicationScore, confidenceScore, grammarScore]),
      improvements: generateImprovements(['fluency', 'engagement'], [fluencyScore, communicationScore]),
      detailedFeedback: 'Engaging conversation skills. Focus on maintaining natural flow and active listening cues.'
    }
  };
}

function generateExtemporaneousEvaluation(submission: ModuleSubmissionData): ModuleEvaluation {
  const confidenceScore = generateRandomScore(55, 95);
  const clarityScore = generateRandomScore(60, 95);
  const fluencyScore = generateRandomScore(50, 90);
  const paceScore = generateRandomScore(55, 90);
  const communicationScore = generateRandomScore(55, 95);

  const overallModuleScore = 
    confidenceScore * 0.25 +
    clarityScore * 0.20 +
    fluencyScore * 0.20 +
    paceScore * 0.15 +
    communicationScore * 0.20;

  return {
    pronunciationScore: 0,
    grammarScore: 0,
    confidenceScore,
    clarityScore,
    fluencyScore,
    paceScore,
    communicationScore,
    overallModuleScore: Math.round(overallModuleScore * 100) / 100,
    feedback: {
      strengths: generateStrengths(['confidence', 'structure', 'clarity'], [confidenceScore, communicationScore, clarityScore]),
      improvements: generateImprovements(['time management', 'depth'], [paceScore, fluencyScore]),
      detailedFeedback: 'Good spontaneous speaking ability. Work on organizing thoughts quickly and diving deeper into key points.'
    }
  };
}

function generateSummarizeEvaluation(submission: ModuleSubmissionData): ModuleEvaluation {
  const grammarScore = generateRandomScore(65, 95);
  const clarityScore = generateRandomScore(60, 95);
  const communicationScore = generateRandomScore(60, 95);

  const overallModuleScore = 
    grammarScore * 0.30 +
    clarityScore * 0.40 +
    communicationScore * 0.30;

  return {
    pronunciationScore: 0,
    grammarScore,
    confidenceScore: 0,
    clarityScore,
    fluencyScore: 0,
    paceScore: 0,
    communicationScore,
    overallModuleScore: Math.round(overallModuleScore * 100) / 100,
    feedback: {
      strengths: generateStrengths(['comprehension', 'conciseness'], [clarityScore, communicationScore]),
      improvements: generateImprovements(['key points', 'brevity'], [grammarScore, clarityScore]),
      detailedFeedback: 'Effective summarization. Ensure all main points are captured while avoiding unnecessary details.'
    }
  };
}

// ─── Helper Functions ──────────────────────────────────────────────────────────

function generateRandomScore(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function generateStrengths(areas: string[], scores: number[]): string[] {
  const strengths: string[] = [];
  scores.forEach((score, index) => {
    if (score >= 80) {
      strengths.push(`Excellent ${areas[index]}`);
    } else if (score >= 70) {
      strengths.push(`Good ${areas[index]}`);
    }
  });
  return strengths.slice(0, 3);
}

function generateImprovements(areas: string[], scores: number[]): string[] {
  const improvements: string[] = [];
  scores.forEach((score, index) => {
    if (score < 70) {
      improvements.push(`Work on ${areas[index]}`);
    }
  });
  return improvements.slice(0, 3);
}

// ─── Calculate Total Competition Score ─────────────────────────────────────────

export async function calculateTotalScore(
  participantId: string
): Promise<ApiResponse<{ totalScore: number; moduleScores: Record<string, number> }>> {
  try {
    const participant = await prisma.competitionParticipant.findUnique({
      where: { id: participantId },
      include: {
        moduleScores: {
          include: { module: { select: { moduleType: true, weight: true } } },
          orderBy: { attemptNumber: 'desc' }
        }
      }
    });

    if (!participant) {
      return { success: false, error: 'Participant not found' };
    }

    // Get best score for each module
    const bestScores: Record<string, { score: number; weight: number }> = {};
    for (const ms of participant.moduleScores) {
      const key = ms.module.moduleType;
      if (!bestScores[key] || ms.score > bestScores[key].score) {
        bestScores[key] = { score: ms.score, weight: ms.module.weight };
      }
    }

    // Calculate weighted total
    let totalScore = 0;
    const moduleScores: Record<string, number> = {};
    
    for (const [moduleType, data] of Object.entries(bestScores)) {
      moduleScores[moduleType] = data.score;
      totalScore += (data.score * data.weight) / 100;
    }

    return {
      success: true,
      data: {
        totalScore: Math.round(totalScore * 100) / 100,
        moduleScores
      }
    };
  } catch (error) {
    console.error('Error calculating total score:', error);
    return { success: false, error: 'Failed to calculate total score' };
  }
}

// ─── Finalize Competition Results ──────────────────────────────────────────────

export async function finalizeCompetitionResults(
  competitionId: string
): Promise<ApiResponse<{ resultsCount: number }>> {
  try {
    // Get all participants with their scores
    const participants = await prisma.competitionParticipant.findMany({
      where: { 
        competitionId,
        status: { in: ['IN_PROGRESS', 'COMPLETED'] }
      },
      include: {
        moduleScores: {
          include: { module: { select: { weight: true } } }
        }
      }
    });

    // Calculate total scores for each participant
    const scoredParticipants = participants.map(p => {
      let totalScore = 0;
      const moduleScoreMap: Record<string, number> = {};
      
      for (const ms of p.moduleScores) {
        const moduleId = ms.moduleId;
        if (!moduleScoreMap[moduleId] || ms.score > moduleScoreMap[moduleId]) {
          moduleScoreMap[moduleId] = ms.score;
        }
      }

      for (const ms of p.moduleScores) {
        if (moduleScoreMap[ms.moduleId] === ms.score) {
          totalScore += (ms.score * ms.module.weight) / 100;
        }
      }

      return {
        participantId: p.id,
        userId: p.userId,
        totalScore: Math.round(totalScore * 100) / 100,
        completionTime: p.completedAt && p.startedAt 
          ? Math.floor((p.completedAt.getTime() - p.startedAt.getTime()) / 1000)
          : null,
        moduleScores: moduleScoreMap
      };
    });

    // Sort by score (descending), then by completion time (ascending)
    scoredParticipants.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      // Tiebreaker: faster completion time wins
      return (a.completionTime || Infinity) - (b.completionTime || Infinity);
    });

    // Assign ranks and badges
    for (let i = 0; i < scoredParticipants.length; i++) {
      const rank = i + 1;
      const sp = scoredParticipants[i];
      
      let badgeType: BadgeType | null = null;
      if (rank === 1) badgeType = 'GOLD';
      else if (rank === 2) badgeType = 'SILVER';
      else if (rank === 3) badgeType = 'BRONZE';
      else if (rank <= 10) badgeType = 'TOP_PERFORMER';
      else badgeType = 'PARTICIPATION';

      // Create or update result
      await prisma.competitionResult.upsert({
        where: {
          competitionId_userId: {
            competitionId,
            userId: sp.userId
          }
        },
        create: {
          competitionId,
          userId: sp.userId,
          participantId: sp.participantId,
          totalScore: sp.totalScore,
          rank,
          completionTime: sp.completionTime,
          badgeType
        },
        update: {
          totalScore: sp.totalScore,
          rank,
          completionTime: sp.completionTime,
          badgeType
        }
      });

      // Update leaderboard
      const participant = participants.find(p => p.id === sp.participantId);
      if (participant) {
        await prisma.competitionLeaderboard.upsert({
          where: {
            competitionId_userId: {
              competitionId,
              userId: sp.userId
            }
          },
          create: {
            competitionId,
            userId: sp.userId,
            userName: participant.userName,
            userAvatar: participant.userAvatar,
            rank,
            totalScore: sp.totalScore,
            moduleScores: sp.moduleScores,
            universityName: participant.universityName,
            collegeName: participant.collegeName,
            completionTime: sp.completionTime,
            badgeType
          },
          update: {
            rank,
            totalScore: sp.totalScore,
            moduleScores: sp.moduleScores,
            completionTime: sp.completionTime,
            badgeType
          }
        });
      }

      // Update participant status
      await prisma.competitionParticipant.update({
        where: { id: sp.participantId },
        data: { status: 'COMPLETED' }
      });
    }

    return { 
      success: true, 
      data: { resultsCount: scoredParticipants.length } 
    };
  } catch (error) {
    console.error('Error finalizing competition results:', error);
    return { success: false, error: 'Failed to finalize results' };
  }
}

// ─── Determine Rank ────────────────────────────────────────────────────────────

export async function determineRank(
  competitionId: string,
  userId: string,
  totalScore: number,
  completionTime: number
): Promise<number> {
  const higherRanked = await prisma.competitionResult.count({
    where: {
      competitionId,
      OR: [
        { totalScore: { gt: totalScore } },
        { 
          totalScore,
          completionTime: { lt: completionTime }
        }
      ]
    }
  });

  return higherRanked + 1;
}

// ─── Submit Module Score ─────────────────────────────────────────────────────────

export async function submitModuleScore(data: {
  competitionId: string;
  participantId: string;
  moduleId: string;
  userId: string;
  audioUrl?: string;
  textResponse?: string;
  attemptNumber?: number;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { competitionId, participantId, moduleId, userId, audioUrl, textResponse, attemptNumber = 1 } = data;

    // Get module configuration
    const module = await prisma.competitionModule.findUnique({
      where: { id: moduleId },
      include: { competition: true }
    });

    if (!module) {
      return { success: false, error: 'Module not found' };
    }

    // Get participant
    const participant = await prisma.competitionParticipant.findUnique({
      where: { id: participantId }
    });

    if (!participant) {
      return { success: false, error: 'Participant not found' };
    }

    // Check if already submitted for this attempt
    const existingScore = await prisma.competitionModuleScore.findFirst({
      where: {
        participantId,
        moduleId,
        attemptNumber
      }
    });

    if (existingScore) {
      return { success: false, error: 'Score already submitted for this attempt' };
    }

    // Prepare submission data for AI evaluation
    const submissionData: ModuleSubmissionData = {
      competitionId,
      moduleId,
      participantId,
      audioUrl,
      textResponse,
      submissionType: audioUrl && textResponse ? 'mixed' : audioUrl ? 'audio' : 'text',
      moduleType: module.moduleType
    };

    // Evaluate submission using AI
    const evaluationResult = await evaluateModuleSubmission(submissionData);

    if (!evaluationResult.success || !evaluationResult.data) {
      return { success: false, error: evaluationResult.error || 'Evaluation failed' };
    }

    const { score, evaluation, attemptNumber: evalAttemptNumber } = evaluationResult.data;

    // Create module score record
    const moduleScore = await prisma.competitionModuleScore.create({
      data: {
        participantId,
        moduleId,
        score,
        pronunciationScore: evaluation.pronunciationScore,
        grammarScore: evaluation.grammarScore,
        confidenceScore: evaluation.confidenceScore,
        clarityScore: evaluation.clarityScore,
        fluencyScore: evaluation.fluencyScore,
        paceScore: evaluation.paceScore,
        communicationScore: evaluation.communicationScore,
        attemptNumber: evalAttemptNumber,
        rawAiResponse: evaluation as any,
        feedback: evaluation.feedback as any
      }
    });

    // Update participant status to IN_PROGRESS if not already
    if (participant.status === 'REGISTERED') {
      await prisma.competitionParticipant.update({
        where: { id: participantId },
        data: { 
          status: 'IN_PROGRESS',
          startedAt: new Date()
        }
      });
    }

    // Check if all modules are completed
    const allModules = await prisma.competitionModule.count({
      where: { competitionId }
    });

    const completedModules = await prisma.competitionModuleScore.count({
      where: { participantId }
    });

    if (completedModules >= allModules) {
      // Calculate total score
      const totalScoreResult = await calculateTotalScore(participantId);
      
      if (totalScoreResult.success && totalScoreResult.data) {
        const completionTime = participant.startedAt 
          ? Math.floor((Date.now() - participant.startedAt.getTime()) / 1000)
          : 0;

        // Get rank
        const rank = await determineRank(
          competitionId, 
          userId, 
          totalScoreResult.data.totalScore,
          completionTime
        );

        // Create or update result - use participantId which is unique
        const existingResult = await prisma.competitionResult.findUnique({
          where: { participantId }
        });

        if (existingResult) {
          await prisma.competitionResult.update({
            where: { participantId },
            data: {
              totalScore: totalScoreResult.data.totalScore,
              rank,
              completionTime
            }
          });
        } else {
          await prisma.competitionResult.create({
            data: {
              competitionId,
              userId,
              participantId,
              totalScore: totalScoreResult.data.totalScore,
              rank,
              completionTime
            }
          });
        }

        // Update participant status
        await prisma.competitionParticipant.update({
          where: { id: participantId },
          data: { 
            status: 'COMPLETED',
            completedAt: new Date()
          }
        });
      }
    }

    return { 
      success: true, 
      data: {
        moduleScore,
        evaluation,
        isComplete: completedModules >= allModules
      }
    };
  } catch (error) {
    console.error('Error submitting module score:', error);
    return { success: false, error: 'Failed to submit score' };
  }
}
