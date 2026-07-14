import { NextRequest, NextResponse } from 'next/server';

// ─── GET /api/interview/pair/[code]
// Mobile validates the pairing code and fetches interview context (read-only).
// POST /api/interview/pair/[code]
// Mobile confirms it's joining — marks device connected, returns sessionId.

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const session = PAIRING_STORE.get(code);

  if (!session) {
    return NextResponse.json(
      { error: 'Invalid pairing code. Check the code on your laptop and try again.' },
      { status: 404 }
    );
  }

  if (isExpired(session.pairingExpiresAt)) {
    return NextResponse.json(
      { error: 'Pairing code has expired. Generate a new one from your laptop.' },
      { status: 410 }
    );
  }

  if (session.mobileConnected) {
    return NextResponse.json(
      { error: 'A device has already joined this session.' },
      { status: 409 }
    );
  }

  return NextResponse.json({
    sessionId: session.sessionId,
    candidateName: session.candidateName,
    jobRole: session.jobRole,
    status: session.status,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const body = await req.json().catch(() => ({}));
  const { deviceInfo } = body;

  const session = PAIRING_STORE.get(code);
  if (!session) {
    return NextResponse.json({ error: 'Invalid pairing code.' }, { status: 404 });
  }

  if (isExpired(session.pairingExpiresAt)) {
    return NextResponse.json({ error: 'Pairing code expired.' }, { status: 410 });
  }

  // Mark mobile as connected
  session.mobileConnected = true;
  session.mobileJoinedAt = new Date().toISOString();
  session.status = 'CONSENT_PENDING';
  if (deviceInfo) session.deviceInfo = deviceInfo;

  PAIRING_STORE.set(code, session);

  return NextResponse.json({
    sessionId: session.sessionId,
    status: session.status,
    candidateName: session.candidateName,
    jobRole: session.jobRole,
  });
}

// ─── In-memory pairing store (shared with sessions/route.ts via module import)
// In production this should be replaced with Prisma reads/writes.
// Export so the sessions/create route can write to it.

export interface PairingRecord {
  sessionId: string;
  pairingCode: string;
  candidateName: string;
  jobRole: string;
  status: string;
  pairingExpiresAt: string;
  mobileConnected: boolean;
  mobileJoinedAt?: string;
  deviceInfo?: unknown;
}

export const PAIRING_STORE = new Map<string, PairingRecord>();
