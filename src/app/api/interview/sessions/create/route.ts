import { NextRequest, NextResponse } from 'next/server';
import { PAIRING_STORE, type PairingRecord } from '@/app/api/interview/pair/[code]/route';

function generatePairingCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
}

// POST /api/interview/sessions/create
// Called from LAPTOP — creates a new interview session and returns a pairing code + QR payload.
// Auth is handled by the portal layout/middleware; no cookie check needed here.

export async function POST(req: NextRequest) {

  const body = await req.json().catch(() => ({}));
  const { candidateName, jobRole } = body;

  if (!candidateName || !jobRole) {
    return NextResponse.json(
      { error: 'candidateName and jobRole are required' },
      { status: 400 }
    );
  }

  const sessionId = `hl2_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const pairingCode = generatePairingCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const record: PairingRecord = {
    sessionId,
    pairingCode,
    candidateName,
    jobRole,
    status: 'AWAITING_DEVICE',
    pairingExpiresAt: expiresAt.toISOString(),
    mobileConnected: false,
  };

  // Write to pairing store (in production: prisma.interviewSession.create)
  PAIRING_STORE.set(pairingCode, record);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (req.headers.get('origin') ?? 'https://fluenzyai.app');

  return NextResponse.json(
    {
      session: {
        id: sessionId,
        candidateName,
        jobRole,
        status: 'AWAITING_DEVICE',
      },
      pairing: {
        sessionId,
        pairingCode,
        qrPayload: `${appUrl}/pair/${pairingCode}`,
        expiresAt: expiresAt.getTime(),
        laptopConnected: true,
        mobileConnected: false,
      },
    },
    { status: 201 }
  );
}

// GET /api/interview/sessions/create — poll pairing status from laptop
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pairingCode = searchParams.get('pairingCode');

  if (!pairingCode) {
    return NextResponse.json({ error: 'pairingCode required' }, { status: 400 });
  }

  const record = PAIRING_STORE.get(pairingCode);
  if (!record) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({
    sessionId: record.sessionId,
    mobileConnected: record.mobileConnected,
    status: record.status,
  });
}
