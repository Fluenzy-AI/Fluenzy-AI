// ═══════════════════════════════════════════════════════════════════════════════
// Competition Universities API - Fetch registered universities
// Only returns approved/active college partners
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getPortalAuthFromRequest } from '@/lib/portal-auth';

// GET /api/competitions/universities - Fetch all registered universities
export async function GET(request: NextRequest) {
  try {
    // Check for portal auth (Admin Portal) OR NextAuth session (SuperAdmin)
    const portalAuth = getPortalAuthFromRequest(request);
    const session = await getServerSession(authOptions);
    
    // Must have either portal auth or be a superadmin via NextAuth
    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';
    
    if (!portalAuth && !isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch all APPROVED college admins (registered universities)
    const collegeAdmins = await prisma.collegeAdmin.findMany({
      where: {
        status: 'APPROVED'
      },
      select: {
        id: true,
        collegeName: true,
        domain: true,
        logoUrl: true
      },
      orderBy: {
        collegeName: 'asc'
      }
    });

    // Map to university format (id = collegeAdminId, name = collegeName)
    const universities = collegeAdmins.map(ca => ({
      id: ca.id,
      name: ca.collegeName,
      domain: ca.domain,
      logoUrl: ca.logoUrl
    }));

    return NextResponse.json({
      success: true,
      data: universities
    });
  } catch (error) {
    console.error('Error fetching universities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch universities' },
      { status: 500 }
    );
  }
}
