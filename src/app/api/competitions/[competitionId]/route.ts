// ═══════════════════════════════════════════════════════════════════════════════
// Competition Detail API Routes - GET, PATCH, DELETE
// Supports both NextAuth (students) and Portal Auth (admins)
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getPortalAuthFromRequest } from '@/lib/portal-auth';
import { 
  getCompetitionById, 
  updateCompetitionStatus, 
  deleteCompetition 
} from '@/lib/competitions/competition.service';
import { CompetitionUserContext } from '@/lib/competitions/competition.types';
import { CompetitionStatus } from '@prisma/client';

// ─── Helper: Get User Context (supports both NextAuth and Portal Auth) ─────────

async function getUserContextFromRequest(request: NextRequest): Promise<CompetitionUserContext | null> {
  // 1. Try Portal Auth first (for Admin portal)
  const portalAuth = getPortalAuthFromRequest(request);
  if (portalAuth) {
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

// ─── GET /api/competitions/[competitionId] ─────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  try {
    const context = await getUserContextFromRequest(request);
    if (!context) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { competitionId } = await params;
    const result = await getCompetitionById(competitionId, context);
    
    return NextResponse.json(result, { status: result.success ? 200 : 404 });
  } catch (error) {
    console.error('Error in GET /api/competitions/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/competitions/[competitionId] ───────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  try {
    const context = await getUserContextFromRequest(request);
    if (!context) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins and college admins can update
    const allowedRoles = ['SUPER_ADMIN', 'Admin', 'PORTAL_ADMIN', 'COLLEGE_ADMIN'];
    if (!allowedRoles.includes(context.userRole)) {
      return NextResponse.json(
        { success: false, error: 'Not authorized' },
        { status: 403 }
      );
    }

    const { competitionId } = await params;
    const body = await request.json();

    // Handle status update
    if (body.status) {
      const validStatuses: CompetitionStatus[] = ['DRAFT', 'UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status' },
          { status: 400 }
        );
      }

      const result = await updateCompetitionStatus(competitionId, body.status, context);
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

    // Handle other updates (name, description, etc.)
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { status: true, collegeAdminId: true }
    });

    if (!competition) {
      return NextResponse.json(
        { success: false, error: 'Competition not found' },
        { status: 404 }
      );
    }

    // Only DRAFT competitions can be fully edited
    if (competition.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'Only draft competitions can be edited' },
        { status: 400 }
      );
    }

    // Validate college admin permission
    if (context.userRole === 'COLLEGE_ADMIN' && 
        competition.collegeAdminId !== context.collegeAdminId) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to edit this competition' },
        { status: 403 }
      );
    }

    // Update allowed fields
    const updateData: Record<string, unknown> = {};
    if (body.name) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.startDate) updateData.startDate = new Date(body.startDate);
    if (body.endDate) updateData.endDate = new Date(body.endDate);
    if (body.registrationDeadline) updateData.registrationDeadline = new Date(body.registrationDeadline);
    if (body.durationPerModule) updateData.durationPerModule = body.durationPerModule;
    if (body.maxAttempts) updateData.maxAttempts = body.maxAttempts;
    if (body.participantLimit !== undefined) updateData.participantLimit = body.participantLimit;
    if (body.prizePool !== undefined) updateData.prizePool = body.prizePool;
    if (body.bannerUrl !== undefined) updateData.bannerUrl = body.bannerUrl;

    await prisma.competition.update({
      where: { id: competitionId },
      data: updateData
    });

    return NextResponse.json({ success: true, data: { id: competitionId } });
  } catch (error) {
    console.error('Error in PATCH /api/competitions/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/competitions/[competitionId] ──────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  try {
    const context = await getUserContextFromRequest(request);
    if (!context) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins and college admins can delete
    const allowedRoles = ['SUPER_ADMIN', 'Admin', 'PORTAL_ADMIN', 'COLLEGE_ADMIN'];
    if (!allowedRoles.includes(context.userRole)) {
      return NextResponse.json(
        { success: false, error: 'Not authorized' },
        { status: 403 }
      );
    }

    const { competitionId } = await params;
    const result = await deleteCompetition(competitionId, context);
    
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('Error in DELETE /api/competitions/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
