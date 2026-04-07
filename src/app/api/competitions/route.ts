// ═══════════════════════════════════════════════════════════════════════════════
// Competition API Routes - GET (list) & POST (create)
// Supports both NextAuth (students) and Portal Auth (admins)
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getPortalAuthFromRequest } from '@/lib/portal-auth';
import { 
  createCompetition, 
  listCompetitions, 
  getCompetitionStats 
} from '@/lib/competitions/competition.service';
import { 
  CompetitionCreateInput, 
  CompetitionListQuery, 
  CompetitionUserContext 
} from '@/lib/competitions/competition.types';
import { z } from 'zod';

// Validation schemas
const createCompetitionSchema = z.object({
  name: z.string().min(5, 'Name must be at least 5 characters'),
  description: z.string().optional(),
  scope: z.enum(['GLOBAL', 'UNIVERSITY', 'COLLEGE']),
  type: z.enum(['GD_BATTLE', 'HR_INTERVIEW_BATTLE', 'CORPORATE_VOICE_BATTLE']),
  startDate: z.string(),
  endDate: z.string(),
  registrationDeadline: z.string().optional(),
  durationPerModule: z.number().min(60).max(3600),
  maxAttempts: z.number().min(1).max(5).default(1),
  participantLimit: z.number().positive().optional().nullable(),
  prizePool: z.string().optional(),
  bannerUrl: z.string().optional(),
  universityNames: z.array(z.string()).optional(),
  universityIds: z.array(z.string()).optional(),
  // GD Battle specific fields
  minGDParticipants: z.number().min(2).max(5).optional(),
  maxGDParticipants: z.number().min(3).max(8).optional(),
  modules: z.array(z.object({
    moduleType: z.enum([
      'READ_ALOUD', 
      'LISTEN_AND_REPEAT', 
      'COMPREHENSION', 
      'CONVERSATION', 
      'EXTEMPORANEOUS', 
      'LISTEN_AND_SUMMARIZE'
    ]),
    weight: z.number().min(0).max(100),
    order: z.number().min(0),
    config: z.any().optional()
  })).min(1),
  rewards: z.array(z.object({
    rankFrom: z.number().min(1),
    rankTo: z.number().min(1),
    rewardType: z.enum([
      'GOLD_CERTIFICATE',
      'SILVER_CERTIFICATE',
      'BRONZE_CERTIFICATE',
      'SCHOLARSHIP',
      'BADGE',
      'CASH_PRIZE'
    ]),
    rewardTitle: z.string(),
    rewardValue: z.string().optional()
  }))
}).refine(
  (data) => {
    // For GD_BATTLE, validate min <= max if both are provided
    if (data.type === 'GD_BATTLE' && data.minGDParticipants && data.maxGDParticipants) {
      return data.minGDParticipants <= data.maxGDParticipants;
    }
    return true;
  },
  { message: 'minGDParticipants cannot be greater than maxGDParticipants' }
);

// ─── Helper: Get User Context (supports both NextAuth and Portal Auth) ─────────

async function getUserContextFromRequest(request: NextRequest): Promise<CompetitionUserContext | null> {
  // 1. Try Portal Auth first (for Admin portal)
  const portalAuth = getPortalAuthFromRequest(request);
  if (portalAuth) {
    // Portal staff auth
    const portalStaff = await prisma.portalStaff.findUnique({
      where: { id: portalAuth.staffId },
      select: { id: true, role: true, email: true }
    });

    if (portalStaff) {
      return {
        userId: portalStaff.id,
        userRole: portalStaff.role === 'ADMIN' ? 'PORTAL_ADMIN' : portalStaff.role
      };
    }
  }

  // 2. Try College Admin token (from Authorization header)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const jwt = await import('jsonwebtoken');
      const decoded = jwt.default.verify(token, process.env.COLLEGE_JWT_SECRET || process.env.NEXTAUTH_SECRET!) as {
        adminId: string;
        email: string;
      };
      
      const collegeAdmin = await prisma.collegeAdmin.findUnique({
        where: { id: decoded.adminId },
        select: { id: true, collegeName: true, email: true }
      });

      if (collegeAdmin) {
        return {
          userId: collegeAdmin.id,
          userRole: 'COLLEGE_ADMIN',
          collegeAdminId: collegeAdmin.id,
          collegeName: collegeAdmin.collegeName
        };
      }
    } catch {
      // Token invalid, continue to NextAuth
    }
  }

  // 3. Try NextAuth session (for students)
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    return getUserContextFromEmail(session.user.email);
  }

  return null;
}

async function getUserContextFromEmail(email: string): Promise<CompetitionUserContext | null> {
  // Check if user is a college admin
  const collegeAdmin = await prisma.collegeAdmin.findUnique({
    where: { email },
    select: { id: true, collegeName: true }
  });

  if (collegeAdmin) {
    return {
      userId: collegeAdmin.id,
      userRole: 'COLLEGE_ADMIN',
      collegeAdminId: collegeAdmin.id,
      collegeName: collegeAdmin.collegeName
    };
  }

  // Check if user is portal staff (admin)
  const portalStaff = await prisma.portalStaff.findUnique({
    where: { email },
    select: { id: true, role: true }
  });

  if (portalStaff) {
    return {
      userId: portalStaff.id,
      userRole: portalStaff.role === 'ADMIN' ? 'PORTAL_ADMIN' : portalStaff.role
    };
  }

  // Check regular user
  const user = await prisma.users.findUnique({
    where: { email },
    select: { id: true, role: true }
  });

  if (user) {
    // Check if student is linked to a college
    const collegeStudent = await prisma.collegeStudent.findUnique({
      where: { userId: user.id },
      include: { collegeAdmin: { select: { id: true, collegeName: true } } }
    });

    return {
      userId: user.id,
      userRole: user.role,
      collegeAdminId: collegeStudent?.collegeAdminId || undefined,
      collegeName: collegeStudent?.collegeAdmin.collegeName
    };
  }

  return null;
}

// ─── GET /api/competitions ─────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const context = await getUserContextFromRequest(request);
    if (!context) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Check if this is a stats request
    if (searchParams.get('stats') === 'true') {
      const result = await getCompetitionStats(context);
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

    // Check if requesting user's registered competitions
    const myOnly = searchParams.get('my') === 'true';
    
    if (myOnly) {
      // Fetch competitions where user is registered
      const myCompetitions = await prisma.competitionParticipant.findMany({
        where: { userId: context.userId },
        include: {
          competition: {
            include: {
              _count: { select: { participants: true } }
            }
          }
        },
        orderBy: { registeredAt: 'desc' }
      });

      // Also get results for each competition
      const results = await prisma.competitionResult.findMany({
        where: { userId: context.userId }
      });

      const resultsMap = new Map(results.map(r => [r.competitionId, r]));

      const competitions = myCompetitions.map(p => ({
        id: p.competition.id,
        name: p.competition.name,
        description: p.competition.description,
        scope: p.competition.scope,
        type: p.competition.type,
        status: p.competition.status,
        startDate: p.competition.startDate,
        endDate: p.competition.endDate,
        registrationDeadline: p.competition.registrationDeadline,
        participantLimit: p.competition.participantLimit,
        participantCount: p.competition._count.participants,
        prizePool: p.competition.prizePool,
        bannerUrl: p.competition.bannerUrl,
        myStatus: p.status,
        myRank: resultsMap.get(p.competitionId)?.rank || null,
        myScore: resultsMap.get(p.competitionId)?.totalScore || null
      }));

      return NextResponse.json({
        success: true,
        data: { competitions }
      });
    }

    const query: CompetitionListQuery = {
      scope: searchParams.get('scope') as CompetitionListQuery['scope'] || undefined,
      status: searchParams.get('status') as CompetitionListQuery['status'] || undefined,
      type: searchParams.get('type') as CompetitionListQuery['type'] || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') as CompetitionListQuery['sortBy'] || 'createdAt',
      sortOrder: searchParams.get('sortOrder') as CompetitionListQuery['sortOrder'] || 'desc'
    };

    const result = await listCompetitions(query, context);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('Error in GET /api/competitions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── POST /api/competitions ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContextFromRequest(request);
    if (!context) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins and college admins can create competitions
    const allowedRoles = ['SUPER_ADMIN', 'Admin', 'PORTAL_ADMIN', 'COLLEGE_ADMIN'];
    if (!allowedRoles.includes(context.userRole)) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to create competitions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('Competition create request body:', JSON.stringify(body, null, 2));
    
    // Validate request body
    const validation = createCompetitionSchema.safeParse(body);
    if (!validation.success) {
      console.error('Validation failed:', JSON.stringify(validation.error.issues, null, 2));
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message, details: validation.error.issues },
        { status: 400 }
      );
    }

    const input = validation.data as CompetitionCreateInput;
    console.log('Validated input:', JSON.stringify(input, null, 2));

    // Validate dates
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    if (endDate <= startDate) {
      return NextResponse.json(
        { success: false, error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Validate module weights
    const totalWeight = input.modules.reduce((sum, m) => sum + m.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      return NextResponse.json(
        { success: false, error: `Module weights must sum to 100. Current: ${totalWeight}` },
        { status: 400 }
      );
    }

    // Create competition
    const result = await createCompetition(input, context);
    return NextResponse.json(result, { status: result.success ? 201 : 400 });
  } catch (error) {
    console.error('Error in POST /api/competitions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
