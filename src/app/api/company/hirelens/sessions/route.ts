import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// ─── Lightweight session creation for HireLens (no Prisma required for demo) ─
// Swap the mock response body for real prisma.interviewSession.create() calls
// when the DB schema is migrated.

export async function POST(req: NextRequest) {
  try {
    // Auth check — reuse existing company auth cookie
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('company_auth_token') || cookieStore.get('auth_token');

    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { candidateName, jobRole, mode = 'MOBILE', deviceInfo } = body;

    if (!candidateName || !jobRole) {
      return NextResponse.json(
        { error: 'candidateName and jobRole are required' },
        { status: 400 }
      );
    }

    // ── Mock session (replace with real DB insert later) ──────────────────────
    const sessionId = `hl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const session = {
      id: sessionId,
      candidateName,
      jobRole,
      mode,
      status: 'PENDING',
      consentGiven: false,
      createdAt: new Date().toISOString(),
      deviceInfo: deviceInfo || null,
    };
    // ─────────────────────────────────────────────────────────────────────────

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error('[HireLens] Session creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  // Placeholder — list sessions for current company user
  return NextResponse.json({ sessions: [] });
}
