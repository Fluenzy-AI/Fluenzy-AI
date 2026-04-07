// ═══════════════════════════════════════════════════════════════════════════════
// Competition Participants API - GET
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// ─── GET /api/competitions/[competitionId]/participants ────────────────────────

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

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;
    const take = Math.min(limit, 100);

    // Check if user has permission to view participants
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    const collegeAdmin = await prisma.collegeAdmin.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    const portalStaff = await prisma.portalStaff.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    // Verify competition exists and user has access
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { collegeAdminId: true, scope: true }
    });

    if (!competition) {
      return NextResponse.json(
        { success: false, error: 'Competition not found' },
        { status: 404 }
      );
    }

    // College admins can only view their own competition participants
    if (collegeAdmin && competition.collegeAdminId !== collegeAdmin.id) {
      return NextResponse.json(
        { success: false, error: 'Not authorized' },
        { status: 403 }
      );
    }

    // Regular users can view participant count for GD battles they're part of
    const countOnly = searchParams.get('count') === 'true';
    
    if (!collegeAdmin && !portalStaff && user?.role === 'User') {
      // Check if this is a GD_BATTLE competition
      const fullCompetition = await prisma.competition.findUnique({
        where: { id: competitionId },
        select: { type: true }
      });
      
      // For GD_BATTLE, allow users to see participant count if they're registered
      if (fullCompetition?.type === 'GD_BATTLE') {
        const isParticipant = await prisma.competitionParticipant.findFirst({
          where: {
            competitionId,
            userId: user?.id
          }
        });
        
        if (!isParticipant) {
          return NextResponse.json(
            { success: false, error: 'Not authorized' },
            { status: 403 }
          );
        }
        
        // If count only, return just the count
        if (countOnly) {
          const count = await prisma.competitionParticipant.count({
            where: {
              competitionId,
              status: { in: ['REGISTERED', 'IN_PROGRESS'] }
            }
          });
          
          return NextResponse.json({
            success: true,
            data: { count, minParticipants: competition.scope }
          });
        }
        
        // Otherwise, return basic participant info for GD battles
        const participants = await prisma.competitionParticipant.findMany({
          where: {
            competitionId,
            status: { in: ['REGISTERED', 'IN_PROGRESS'] }
          },
          select: {
            id: true,
            userId: true,
            userName: true,
            userEmail: true,
            status: true
          }
        });
        
        return NextResponse.json({
          success: true,
          data: { 
            participants: participants.map(p => ({
              id: p.id,
              userId: p.userId,
              user: {
                name: p.userName,
                email: p.userEmail
              },
              status: p.status
            })),
            total: participants.length
          }
        });
      }
      
      // For non-GD battles, deny access
      return NextResponse.json(
        { success: false, error: 'Not authorized' },
        { status: 403 }
      );
    }

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { competitionId };
    
    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { userName: { contains: search, mode: 'insensitive' } },
        { userEmail: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [participants, total] = await Promise.all([
      prisma.competitionParticipant.findMany({
        where,
        skip,
        take,
        orderBy: { registeredAt: 'desc' },
        include: {
          result: {
            select: { rank: true, totalScore: true, badgeType: true }
          },
          _count: {
            select: { moduleScores: true }
          }
        }
      }),
      prisma.competitionParticipant.count({ where })
    ]);

    // Get total modules for progress calculation
    const competition2 = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { _count: { select: { modules: true } } }
    });
    const totalModules = competition2?._count.modules || 0;

    const participantsWithProgress = participants.map(p => ({
      id: p.id,
      userId: p.userId,
      userName: p.userName,
      userEmail: p.userEmail,
      userAvatar: p.userAvatar,
      universityName: p.universityName,
      collegeName: p.collegeName,
      status: p.status,
      registeredAt: p.registeredAt,
      startedAt: p.startedAt,
      completedAt: p.completedAt,
      rank: p.result?.rank || null,
      totalScore: p.result?.totalScore || null,
      badgeType: p.result?.badgeType || null,
      moduleProgress: {
        completed: p._count.moduleScores,
        total: totalModules
      }
    }));

    return NextResponse.json({
      success: true,
      data: {
        participants: participantsWithProgress,
        pagination: {
          page,
          limit: take,
          total,
          totalPages: Math.ceil(total / take)
        }
      }
    });
  } catch (error) {
    console.error('Error in GET /api/competitions/[id]/participants:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
