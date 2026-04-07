// ═══════════════════════════════════════════════════════════════════════════════
// Competition Leaderboard API - GET
// Supports both NextAuth (students) and Portal Auth (admins)
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPortalAuthFromRequest } from '@/lib/portal-auth';
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
