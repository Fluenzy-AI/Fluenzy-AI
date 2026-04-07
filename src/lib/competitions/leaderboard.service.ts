// ═══════════════════════════════════════════════════════════════════════════════
// Leaderboard Service - Real-time Rankings
// ═══════════════════════════════════════════════════════════════════════════════

import prisma from '@/lib/prisma';
import { LeaderboardResponse, LeaderboardEntry, ApiResponse } from './competition.types';

// ─── Get Leaderboard ───────────────────────────────────────────────────────────

export async function getLeaderboard(
  competitionId: string,
  page: number = 1,
  limit: number = 50
): Promise<ApiResponse<LeaderboardResponse>> {
  const skip = (page - 1) * limit;
  const take = Math.min(limit, 100);

  try {
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { name: true, status: true }
    });

    if (!competition) {
      return { success: false, error: 'Competition not found' };
    }

    const [leaderboardEntries, totalCount] = await Promise.all([
      prisma.competitionLeaderboard.findMany({
        where: { competitionId },
        orderBy: { rank: 'asc' },
        skip,
        take
      }),
      prisma.competitionLeaderboard.count({ where: { competitionId } })
    ]);

    const entries: LeaderboardEntry[] = leaderboardEntries.map(entry => ({
      rank: entry.rank,
      userId: entry.userId,
      userName: entry.userName,
      userAvatar: entry.userAvatar,
      universityName: entry.universityName,
      collegeName: entry.collegeName,
      totalScore: entry.totalScore,
      moduleScores: entry.moduleScores as Record<string, number>,
      completionTime: entry.completionTime,
      badgeType: entry.badgeType
    }));

    return {
      success: true,
      data: {
        competitionId,
        competitionName: competition.name,
        lastUpdated: new Date().toISOString(),
        totalParticipants: totalCount,
        entries,
        pagination: {
          page,
          limit: take,
          total: totalCount,
          totalPages: Math.ceil(totalCount / take)
        }
      }
    };
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return { success: false, error: 'Failed to get leaderboard' };
  }
}

// ─── Get User Rank ─────────────────────────────────────────────────────────────

export async function getUserRank(
  competitionId: string,
  userId: string
): Promise<ApiResponse<{
  rank: number | null;
  totalScore: number | null;
  totalParticipants: number;
  percentile: number | null;
}>> {
  try {
    const [userEntry, totalParticipants] = await Promise.all([
      prisma.competitionLeaderboard.findUnique({
        where: {
          competitionId_userId: { competitionId, userId }
        }
      }),
      prisma.competitionLeaderboard.count({ where: { competitionId } })
    ]);

    if (!userEntry) {
      return {
        success: true,
        data: {
          rank: null,
          totalScore: null,
          totalParticipants,
          percentile: null
        }
      };
    }

    const percentile = totalParticipants > 0
      ? Math.round(((totalParticipants - userEntry.rank + 1) / totalParticipants) * 100)
      : null;

    return {
      success: true,
      data: {
        rank: userEntry.rank,
        totalScore: userEntry.totalScore,
        totalParticipants,
        percentile
      }
    };
  } catch (error) {
    console.error('Error getting user rank:', error);
    return { success: false, error: 'Failed to get user rank' };
  }
}

// ─── Update Leaderboard Entry ──────────────────────────────────────────────────

export async function updateLeaderboardEntry(
  competitionId: string,
  userId: string,
  totalScore: number,
  moduleScores: Record<string, number>,
  completionTime?: number
): Promise<ApiResponse<{ rank: number }>> {
  try {
    // Get participant info
    const participant = await prisma.competitionParticipant.findUnique({
      where: {
        competitionId_userId: { competitionId, userId }
      }
    });

    if (!participant) {
      return { success: false, error: 'Participant not found' };
    }

    // Calculate rank
    const higherScored = await prisma.competitionLeaderboard.count({
      where: {
        competitionId,
        OR: [
          { totalScore: { gt: totalScore } },
          {
            totalScore,
            completionTime: completionTime ? { lt: completionTime } : undefined
          }
        ]
      }
    });
    const rank = higherScored + 1;

    // Determine badge type
    let badgeType = null;
    if (rank === 1) badgeType = 'GOLD';
    else if (rank === 2) badgeType = 'SILVER';
    else if (rank === 3) badgeType = 'BRONZE';
    else if (rank <= 10) badgeType = 'TOP_PERFORMER';

    // Upsert leaderboard entry
    await prisma.competitionLeaderboard.upsert({
      where: {
        competitionId_userId: { competitionId, userId }
      },
      create: {
        competitionId,
        userId,
        userName: participant.userName,
        userAvatar: participant.userAvatar,
        rank,
        totalScore,
        moduleScores,
        universityName: participant.universityName,
        collegeName: participant.collegeName,
        completionTime,
        badgeType: badgeType as 'GOLD' | 'SILVER' | 'BRONZE' | 'TOP_PERFORMER' | null
      },
      update: {
        rank,
        totalScore,
        moduleScores,
        completionTime,
        badgeType: badgeType as 'GOLD' | 'SILVER' | 'BRONZE' | 'TOP_PERFORMER' | null
      }
    });

    // Rerank entries that were pushed down
    await recalculateRanks(competitionId);

    return { success: true, data: { rank } };
  } catch (error) {
    console.error('Error updating leaderboard entry:', error);
    return { success: false, error: 'Failed to update leaderboard' };
  }
}

// ─── Recalculate All Ranks ─────────────────────────────────────────────────────

async function recalculateRanks(competitionId: string): Promise<void> {
  const entries = await prisma.competitionLeaderboard.findMany({
    where: { competitionId },
    orderBy: [
      { totalScore: 'desc' },
      { completionTime: 'asc' }
    ]
  });

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const newRank = i + 1;

    if (entry.rank !== newRank) {
      let badgeType = entry.badgeType;
      if (newRank === 1) badgeType = 'GOLD';
      else if (newRank === 2) badgeType = 'SILVER';
      else if (newRank === 3) badgeType = 'BRONZE';
      else if (newRank <= 10) badgeType = 'TOP_PERFORMER';
      else badgeType = null;

      await prisma.competitionLeaderboard.update({
        where: { id: entry.id },
        data: { rank: newRank, badgeType }
      });
    }
  }
}

// ─── Get Top Performers ────────────────────────────────────────────────────────

export async function getTopPerformers(
  competitionId: string,
  limit: number = 10
): Promise<ApiResponse<LeaderboardEntry[]>> {
  try {
    const entries = await prisma.competitionLeaderboard.findMany({
      where: { competitionId },
      orderBy: { rank: 'asc' },
      take: limit
    });

    return {
      success: true,
      data: entries.map(entry => ({
        rank: entry.rank,
        userId: entry.userId,
        userName: entry.userName,
        userAvatar: entry.userAvatar,
        universityName: entry.universityName,
        collegeName: entry.collegeName,
        totalScore: entry.totalScore,
        moduleScores: entry.moduleScores as Record<string, number>,
        completionTime: entry.completionTime,
        badgeType: entry.badgeType
      }))
    };
  } catch (error) {
    console.error('Error getting top performers:', error);
    return { success: false, error: 'Failed to get top performers' };
  }
}

// ─── Get University Leaderboard ────────────────────────────────────────────────

export async function getUniversityLeaderboard(
  competitionId: string
): Promise<ApiResponse<{
  universityName: string;
  participantCount: number;
  avgScore: number;
  topScore: number;
  topRank: number;
}[]>> {
  try {
    const entries = await prisma.competitionLeaderboard.findMany({
      where: { 
        competitionId,
        universityName: { not: null }
      }
    });

    // Group by university
    const universityMap = new Map<string, {
      scores: number[];
      topRank: number;
    }>();

    for (const entry of entries) {
      if (!entry.universityName) continue;
      
      if (!universityMap.has(entry.universityName)) {
        universityMap.set(entry.universityName, {
          scores: [],
          topRank: entry.rank
        });
      }

      const data = universityMap.get(entry.universityName)!;
      data.scores.push(entry.totalScore);
      if (entry.rank < data.topRank) {
        data.topRank = entry.rank;
      }
    }

    const result = Array.from(universityMap.entries()).map(([name, data]) => ({
      universityName: name,
      participantCount: data.scores.length,
      avgScore: Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 100) / 100,
      topScore: Math.max(...data.scores),
      topRank: data.topRank
    }));

    // Sort by average score
    result.sort((a, b) => b.avgScore - a.avgScore);

    return { success: true, data: result };
  } catch (error) {
    console.error('Error getting university leaderboard:', error);
    return { success: false, error: 'Failed to get university leaderboard' };
  }
}
