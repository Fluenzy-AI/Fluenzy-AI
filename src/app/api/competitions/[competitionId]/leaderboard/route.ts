// ═══════════════════════════════════════════════════════════════════════════════
// Competition Leaderboard API - GET
// Supports both NextAuth (students) and Portal Auth (admins)
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPortalAuthFromRequest } from '@/lib/portal-auth';
import prisma from '@/lib/prisma';
import { 
  getLeaderboard, 
  getUserRank, 
  getTopPerformers,
  getUniversityLeaderboard 
} from '@/lib/competitions/leaderboard.service';

// ─── GET /api/competitions/[competitionId]/leaderboard ─────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  try {
    // Check authentication (Portal Auth or NextAuth)
    const portalAuth = getPortalAuthFromRequest(request);
    const session = await getServerSession(authOptions);
    
    if (!portalAuth && !session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { competitionId } = await params;
    const { searchParams } = new URL(request.url);

    // Check for different leaderboard views
    const view = searchParams.get('view');
    const includeAll = searchParams.get('includeAll') === 'true'; // Include all participants

    if (view === 'universities') {
      // University-level leaderboard
      const result = await getUniversityLeaderboard(competitionId);
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

    if (view === 'top') {
      // Top performers only
      const limit = parseInt(searchParams.get('limit') || '10');
      const result = await getTopPerformers(competitionId, limit);
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

    if (view === 'myrank') {
      // Current user's rank
      const userId = searchParams.get('userId');
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'userId required for myrank view' },
          { status: 400 }
        );
      }
      const result = await getUserRank(competitionId, userId);
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

    // Full leaderboard with pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const result = await getLeaderboard(competitionId, page, limit);
    
    // If includeAll flag is set or no leaderboard entries, also include all participants
    if (includeAll || (result.success && result.data?.entries.length === 0)) {
      // Get all registered participants
      const participants = await prisma.competitionParticipant.findMany({
        where: { competitionId },
        orderBy: { registeredAt: 'asc' },
        include: {
          result: {
            select: { totalScore: true, rank: true, completionTime: true, badgeType: true }
          },
          moduleScores: {
            select: { score: true, moduleId: true },
            orderBy: { attemptNumber: 'desc' }
          }
        }
      });

      // Merge with existing leaderboard entries or create new ones
      const existingUserIds = new Set(result.data?.entries.map(e => e.userId) || []);
      const allEntries = [...(result.data?.entries || [])];

      for (const participant of participants) {
        if (!existingUserIds.has(participant.userId)) {
          // Calculate score from module scores if available
          let totalScore = 0;
          const moduleScores: Record<string, number> = {};
          
          if (participant.moduleScores.length > 0) {
            // Get best score per module
            const bestScoresByModule: Record<string, number> = {};
            for (const ms of participant.moduleScores) {
              if (!bestScoresByModule[ms.moduleId] || ms.score > bestScoresByModule[ms.moduleId]) {
                bestScoresByModule[ms.moduleId] = ms.score;
              }
            }
            // Calculate average as total for now
            const scores = Object.values(bestScoresByModule);
            totalScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
            
            for (const [moduleId, score] of Object.entries(bestScoresByModule)) {
              moduleScores[moduleId] = score;
            }
          }

          // Use result data if available
          if (participant.result) {
            totalScore = participant.result.totalScore;
          }

          allEntries.push({
            rank: participant.result?.rank || allEntries.length + 1,
            userId: participant.userId,
            userName: participant.userName,
            userAvatar: participant.userAvatar,
            universityName: participant.universityName,
            collegeName: participant.collegeName,
            totalScore: totalScore,
            moduleScores: moduleScores,
            completionTime: participant.result?.completionTime || null,
            badgeType: participant.result?.badgeType || null,
            status: participant.status // Include status for display
          });
        }
      }

      // Sort by totalScore descending, then by completionTime ascending
      allEntries.sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        if (a.completionTime && b.completionTime) return a.completionTime - b.completionTime;
        return 0;
      });

      // Re-assign ranks
      allEntries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      if (result.success && result.data) {
        result.data.entries = allEntries;
        result.data.totalParticipants = allEntries.length;
      }
    }
    
    // Add cache headers for active competitions
    const response = NextResponse.json(result, { status: result.success ? 200 : 400 });
    response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=5');
    
    return response;
  } catch (error) {
    console.error('Error in GET /api/competitions/[id]/leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
