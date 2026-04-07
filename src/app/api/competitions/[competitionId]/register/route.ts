// ═══════════════════════════════════════════════════════════════════════════════
// Competition Registration API - POST (register)
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { registerForCompetition, unregisterFromCompetition } from '@/lib/competitions/eligibility.service';
import { CompetitionUserContext } from '@/lib/competitions/competition.types';

// ─── Helper: Get User Context ──────────────────────────────────────────────────

async function getUserContext(session: { user: { email?: string | null } }): Promise<CompetitionUserContext | null> {
  const email = session.user?.email;
  if (!email) return null;

  // Check regular user first (students register for competitions)
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
      collegeName: collegeStudent?.collegeAdmin.collegeName,
      universityName: undefined // Could be extracted from college domain
    };
  }

  return null;
}

// ─── POST /api/competitions/[competitionId]/register ───────────────────────────

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

    const context = await getUserContext(session);
    if (!context) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const { competitionId } = await params;

    // Register for competition
    const result = await registerForCompetition(competitionId, context);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/competitions/[id]/register:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/competitions/[competitionId]/register ─────────────────────────

export async function DELETE(
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

    const context = await getUserContext(session);
    if (!context) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const { competitionId } = await params;

    // Unregister from competition
    const result = await unregisterFromCompetition(competitionId, context.userId);
    
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('Error in DELETE /api/competitions/[id]/register:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
