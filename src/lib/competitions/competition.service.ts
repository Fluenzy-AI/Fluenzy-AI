// ═══════════════════════════════════════════════════════════════════════════════
// Competition Service - Core Business Logic
// ═══════════════════════════════════════════════════════════════════════════════

import prisma from '@/lib/prisma';
import { 
  CompetitionScope, 
  CompetitionStatus, 
  CompetitionType,
  CompetitionParticipantStatus,
  BadgeType
} from '@prisma/client';
import { 
  CompetitionCreateInput, 
  CompetitionListQuery, 
  CompetitionListResponse,
  CompetitionWithStats,
  CompetitionUserContext,
  COMPETITION_RBAC,
  ApiResponse
} from './competition.types';

// ─── Create Competition ────────────────────────────────────────────────────────

export async function createCompetition(
  input: CompetitionCreateInput,
  context: CompetitionUserContext
): Promise<ApiResponse<{ id: string }>> {
  const { userId, userRole, collegeAdminId } = context;

  // Validate RBAC
  const allowedScopes = COMPETITION_RBAC.create[userRole as keyof typeof COMPETITION_RBAC.create];
  if (!allowedScopes || !allowedScopes.includes(input.scope)) {
    return { 
      success: false, 
      error: `Role ${userRole} cannot create ${input.scope} competitions` 
    };
  }

  // Validate module weights sum to 100
  const totalWeight = input.modules.reduce((sum, m) => sum + m.weight, 0);
  if (Math.abs(totalWeight - 100) > 0.01) {
    return { 
      success: false, 
      error: `Module weights must sum to 100. Current total: ${totalWeight}` 
    };
  }

  // For COLLEGE scope, require collegeAdminId
  if (input.scope === 'COLLEGE' && userRole === 'COLLEGE_ADMIN' && !collegeAdminId) {
    return { success: false, error: 'College admin ID required for college competitions' };
  }

  try {
    console.log('Creating competition with context:', JSON.stringify(context, null, 2));
    
    // Get creator email
    let creatorEmail = '';
    if (userRole === 'COLLEGE_ADMIN' && collegeAdminId) {
      const collegeAdmin = await prisma.collegeAdmin.findUnique({
        where: { id: collegeAdminId },
        select: { email: true }
      });
      creatorEmail = collegeAdmin?.email || '';
    } else {
      const user = await prisma.portalStaff.findFirst({
        where: { id: userId },
        select: { email: true }
      });
      if (!user) {
        const mainUser = await prisma.users.findFirst({
          where: { id: userId },
          select: { email: true }
        });
        creatorEmail = mainUser?.email || '';
      } else {
        creatorEmail = user.email;
      }
    }

    const competition = await prisma.competition.create({
      data: {
        name: input.name,
        description: input.description,
        scope: input.scope,
        type: input.type,
        status: 'DRAFT',
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        registrationDeadline: input.registrationDeadline 
          ? new Date(input.registrationDeadline) 
          : null,
        durationPerModule: input.durationPerModule,
        maxAttempts: input.maxAttempts || 1,
        participantLimit: input.participantLimit,
        prizePool: input.prizePool,
        bannerUrl: input.bannerUrl,
        // GD Battle specific settings
        minGDParticipants: input.type === 'GD_BATTLE' ? (input.minGDParticipants || 3) : null,
        maxGDParticipants: input.type === 'GD_BATTLE' ? (input.maxGDParticipants || 8) : null,
        createdById: userId,
        createdByRole: userRole,
        createdByEmail: creatorEmail,
        collegeAdminId: input.scope === 'COLLEGE' ? collegeAdminId : null,
        // Create modules
        modules: {
          create: input.modules.map(m => ({
            moduleType: m.moduleType,
            weight: m.weight,
            order: m.order,
            config: m.config ? JSON.parse(JSON.stringify(m.config)) : null,
          }))
        },
        // Create rewards
        rewards: {
          create: input.rewards.map(r => ({
            rankFrom: r.rankFrom,
            rankTo: r.rankTo,
            rewardType: r.rewardType,
            rewardTitle: r.rewardTitle,
            rewardValue: r.rewardValue,
          }))
        },
        // Create university associations for UNIVERSITY scope
        ...(input.scope === 'UNIVERSITY' && input.universityNames ? {
          universities: {
            create: input.universityNames.map(name => ({
              universityName: name,
            }))
          }
        } : {})
      },
      select: { id: true }
    });

    return { success: true, data: { id: competition.id } };
  } catch (error) {
    console.error('Error creating competition:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create competition';
    return { success: false, error: errorMessage };
  }
}

// ─── List Competitions ─────────────────────────────────────────────────────────

export async function listCompetitions(
  query: CompetitionListQuery,
  context: CompetitionUserContext
): Promise<ApiResponse<CompetitionListResponse>> {
  const { userId, userRole, collegeAdminId, collegeName, universityName } = context;
  const { 
    scope, 
    status, 
    type, 
    page = 1, 
    limit = 10, 
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = query;

  const skip = (page - 1) * limit;
  const take = Math.min(limit, 50);

  // Build where clause based on role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  // Apply filters
  if (scope) where.scope = scope;
  if (status) where.status = status;
  if (type) where.type = type;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Role-based filtering
  if (userRole === 'COLLEGE_ADMIN' && collegeAdminId) {
    // College admin sees only their college competitions
    where.collegeAdminId = collegeAdminId;
  } else if (userRole === 'User') {
    // Students see competitions they're eligible for
    where.OR = [
      { scope: 'GLOBAL' },
      ...(universityName ? [{ 
        scope: 'UNIVERSITY',
        universities: { some: { universityName } }
      }] : []),
      ...(collegeAdminId ? [{ 
        scope: 'COLLEGE',
        collegeAdminId 
      }] : [])
    ];
    // Only show non-draft competitions to students
    where.status = { not: 'DRAFT' };
  }
  // Admin and Super Admin see all

  try {
    const [competitions, total] = await Promise.all([
      prisma.competition.findMany({
        where,
        skip,
        take,
        orderBy: sortBy === 'participantCount' 
          ? { participants: { _count: sortOrder } }
          : { [sortBy]: sortOrder },
        include: {
          universities: { select: { universityName: true } },
          _count: { select: { participants: true } },
          participants: userId ? {
            where: { userId },
            select: { id: true, status: true }
          } : false
        }
      }),
      prisma.competition.count({ where })
    ]);

    const competitionsWithStats: CompetitionWithStats[] = competitions.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      scope: c.scope,
      type: c.type,
      status: c.status,
      startDate: c.startDate,
      endDate: c.endDate,
      registrationDeadline: c.registrationDeadline,
      prizePool: c.prizePool,
      bannerUrl: c.bannerUrl,
      participantCount: c._count.participants,
      participantLimit: c.participantLimit,
      // GD Battle specific fields
      minGDParticipants: c.minGDParticipants,
      maxGDParticipants: c.maxGDParticipants,
      universities: c.universities,
      createdAt: c.createdAt,
      isRegistered: c.participants && c.participants.length > 0,
      isEligible: checkEligibilitySync(c, context)
    }));

    return {
      success: true,
      data: {
        competitions: competitionsWithStats,
        pagination: {
          page,
          limit: take,
          total,
          totalPages: Math.ceil(total / take)
        }
      }
    };
  } catch (error) {
    console.error('Error listing competitions:', error);
    return { success: false, error: 'Failed to list competitions' };
  }
}

// ─── Get Competition Detail ────────────────────────────────────────────────────

export async function getCompetitionById(
  competitionId: string,
  context: CompetitionUserContext
): Promise<ApiResponse<unknown>> {
  try {
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            moduleType: true,
            weight: true,
            order: true,
            config: true
          }
        },
        rewards: {
          orderBy: { rankFrom: 'asc' },
          select: {
            id: true,
            rankFrom: true,
            rankTo: true,
            rewardType: true,
            rewardTitle: true,
            rewardValue: true
          }
        },
        universities: {
          select: { universityName: true }
        },
        _count: { select: { participants: true } },
        collegeAdmin: {
          select: { collegeName: true, logoUrl: true }
        }
      }
    });

    if (!competition) {
      return { success: false, error: 'Competition not found' };
    }

    // Check if user is registered
    let isRegistered = false;
    let participantStatus: CompetitionParticipantStatus | null = null;
    if (context.userId) {
      const participant = await prisma.competitionParticipant.findUnique({
        where: {
          competitionId_userId: {
            competitionId,
            userId: context.userId
          }
        },
        select: { status: true }
      });
      isRegistered = !!participant;
      participantStatus = participant?.status || null;
    }

    return {
      success: true,
      data: {
        ...competition,
        participantCount: competition._count.participants,
        isRegistered,
        participantStatus,
        isEligible: checkEligibilitySync(competition, context)
      }
    };
  } catch (error) {
    console.error('Error getting competition:', error);
    return { success: false, error: 'Failed to get competition' };
  }
}

// ─── Update Competition Status ─────────────────────────────────────────────────

export async function updateCompetitionStatus(
  competitionId: string,
  newStatus: CompetitionStatus,
  context: CompetitionUserContext
): Promise<ApiResponse<{ id: string }>> {
  try {
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { status: true, collegeAdminId: true, scope: true }
    });

    if (!competition) {
      return { success: false, error: 'Competition not found' };
    }

    // Validate permission
    if (context.userRole === 'COLLEGE_ADMIN' && 
        competition.collegeAdminId !== context.collegeAdminId) {
      return { success: false, error: 'Not authorized to update this competition' };
    }

    // Validate status transition
    const validTransitions: Record<CompetitionStatus, CompetitionStatus[]> = {
      DRAFT: ['UPCOMING', 'CANCELLED'],
      UPCOMING: ['ACTIVE', 'CANCELLED'],
      ACTIVE: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: []
    };

    if (!validTransitions[competition.status].includes(newStatus)) {
      return { 
        success: false, 
        error: `Cannot transition from ${competition.status} to ${newStatus}` 
      };
    }

    await prisma.competition.update({
      where: { id: competitionId },
      data: { status: newStatus }
    });

    return { success: true, data: { id: competitionId } };
  } catch (error) {
    console.error('Error updating competition status:', error);
    return { success: false, error: 'Failed to update competition status' };
  }
}

// ─── Delete Competition ────────────────────────────────────────────────────────

export async function deleteCompetition(
  competitionId: string,
  context: CompetitionUserContext
): Promise<ApiResponse<{ deleted: boolean }>> {
  try {
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { status: true, collegeAdminId: true }
    });

    if (!competition) {
      return { success: false, error: 'Competition not found' };
    }

    // Only DRAFT competitions can be deleted
    if (competition.status !== 'DRAFT') {
      return { success: false, error: 'Only draft competitions can be deleted' };
    }

    // Validate permission
    if (context.userRole === 'COLLEGE_ADMIN' && 
        competition.collegeAdminId !== context.collegeAdminId) {
      return { success: false, error: 'Not authorized to delete this competition' };
    }

    await prisma.competition.delete({ where: { id: competitionId } });

    return { success: true, data: { deleted: true } };
  } catch (error) {
    console.error('Error deleting competition:', error);
    return { success: false, error: 'Failed to delete competition' };
  }
}

// ─── Helper Functions ──────────────────────────────────────────────────────────

function checkEligibilitySync(
  competition: { 
    scope: CompetitionScope; 
    status: CompetitionStatus;
    registrationDeadline?: Date | null;
    participantLimit?: number | null;
    collegeAdminId?: string | null;
    universities?: { universityName: string }[];
    _count?: { participants: number };
  },
  context: CompetitionUserContext
): boolean {
  // Only UPCOMING or ACTIVE competitions are eligible
  if (!['UPCOMING', 'ACTIVE'].includes(competition.status)) {
    return false;
  }

  // Check registration deadline
  if (competition.registrationDeadline && new Date() > competition.registrationDeadline) {
    return false;
  }

  // Check participant limit
  if (competition.participantLimit && 
      competition._count && 
      competition._count.participants >= competition.participantLimit) {
    return false;
  }

  // Scope-based eligibility
  if (competition.scope === 'GLOBAL') {
    return true;
  }

  if (competition.scope === 'UNIVERSITY') {
    return competition.universities?.some(
      u => u.universityName === context.universityName
    ) || false;
  }

  if (competition.scope === 'COLLEGE') {
    return competition.collegeAdminId === context.collegeAdminId;
  }

  return false;
}

// ─── Get Competition Stats ─────────────────────────────────────────────────────

export async function getCompetitionStats(
  context: CompetitionUserContext
): Promise<ApiResponse<{
  totalCompetitions: number;
  activeCompetitions: number;
  totalParticipants: number;
  completedCompetitions: number;
}>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    
    if (context.userRole === 'COLLEGE_ADMIN' && context.collegeAdminId) {
      where.collegeAdminId = context.collegeAdminId;
    }

    const [total, active, completed, participantCount] = await Promise.all([
      prisma.competition.count({ where }),
      prisma.competition.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.competition.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.competitionParticipant.count({
        where: context.userRole === 'COLLEGE_ADMIN' && context.collegeAdminId
          ? { competition: { collegeAdminId: context.collegeAdminId } }
          : {}
      })
    ]);

    return {
      success: true,
      data: {
        totalCompetitions: total,
        activeCompetitions: active,
        completedCompetitions: completed,
        totalParticipants: participantCount
      }
    };
  } catch (error) {
    console.error('Error getting competition stats:', error);
    return { success: false, error: 'Failed to get competition stats' };
  }
}
