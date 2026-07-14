import { NextRequest, NextResponse } from 'next/server';

// ── POST /api/interview/devices/[deviceId]/stream/stop ────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const backendUrl = process.env.BACKEND_URL;

  if (backendUrl) {
    await fetch(`${backendUrl}/device/stream/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId }),
    }).catch(err => console.error('[stream/stop] Backend unreachable:', err));
  }

  return NextResponse.json({ stopped: true, deviceId });
}
