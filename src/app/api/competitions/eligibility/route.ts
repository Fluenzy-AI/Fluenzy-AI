// ═══════════════════════════════════════════════════════════════════════════════
// Competition Eligibility Check API - GET
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { checkEligibility } from '@/lib/competitions/eligibility.service';
import { CompetitionUserContext } from '@/lib/competitions/competition.types';

// ─── GET /api/competitions/eligibility?competitionId=xxx ───────────────────────

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get('competitionId');

    if (!competitionId) {
      return NextResponse.json(
        { success: false, error: 'competitionId is required' },
        { status: 400 }
      );
    }

    // Get user context
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get college info if student
    const collegeStudent = await prisma.collegeStudent.findUnique({
      where: { userId: user.id },
      include: { collegeAdmin: { select: { id: true, collegeName: true } } }
    });

    const context: CompetitionUserContext = {
      userId: user.id,
      userRole: user.role,
      collegeAdminId: collegeStudent?.collegeAdminId || undefined,
      collegeName: collegeStudent?.collegeAdmin.collegeName
    };

    const result = await checkEligibility(competitionId, context);
    
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('Error in GET /api/competitions/eligibility:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
