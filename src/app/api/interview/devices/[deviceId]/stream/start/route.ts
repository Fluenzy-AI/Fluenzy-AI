import { NextRequest, NextResponse } from 'next/server';

// ── POST /api/interview/devices/[deviceId]/stream/start ───────────────────────
// Proxies to the AI backend (FastAPI). In dev, returns a mock streamEndpoint
// so the BLE collar gets something to connect to.

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const body = await req.json().catch(() => ({}));
  const { sessionId } = body;

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  }

  const backendUrl = process.env.BACKEND_URL;

  if (backendUrl) {
    // Production: forward to FastAPI backend
    try {
      const res = await fetch(`${backendUrl}/device/stream/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, deviceId }),
      });
      const data = await res.json();
      return NextResponse.json(data);
    } catch (err) {
      console.error('[stream/start] Backend unreachable:', err);
      // Fall through to mock response
    }
  }

  // Development fallback — mock stream endpoint
  return NextResponse.json({
    streamEndpoint: `wss://stream.fluenzyai.app/device/${deviceId}/session/${sessionId}`,
    sessionId,
    deviceId,
    started: true,
  });
}
