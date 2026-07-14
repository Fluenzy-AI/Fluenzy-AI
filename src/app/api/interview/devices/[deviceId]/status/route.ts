import { NextRequest, NextResponse } from 'next/server';
import { DEVICE_STORE, DIAGNOSTICS_LOG } from '@/lib/stores';

// ── GET /api/interview/devices/[deviceId]/status ──────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const device = DEVICE_STORE.get(deviceId);

  if (!device) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 });
  }

  const log = DIAGNOSTICS_LOG.get(deviceId) || [];
  const latest = log[log.length - 1] ?? null;

  const isOnline = device.lastSeenAt
    ? Date.now() - new Date(device.lastSeenAt).getTime() < 60_000
    : false;

  return NextResponse.json({
    device: {
      id: device.id,
      serialNumber: device.serialNumber,
      status: device.status,
      lastBatteryLevel: device.lastBatteryLevel,
      lastSignalStrength: device.lastSignalStrength,
      lastSeenAt: device.lastSeenAt,
    },
    diagnostics: latest
      ? {
          deviceId,
          timestamp: new Date(latest.timestamp).getTime(),
          batteryLevel: latest.batteryLevel,
          wifiSignal: latest.wifiSignal,
          streamingStatus: latest.streamingStatus || 'idle',
          errorCode: latest.errorCode,
        }
      : null,
    isOnline,
  });
}

// ── POST /api/interview/devices/[deviceId]/status — heartbeat from device ─────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const device = DEVICE_STORE.get(deviceId);

  if (!device) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const { batteryLevel, wifiSignal, streamingStatus, errorCode } = body;

  // Derive status
  let newStatus = device.status;
  if (errorCode) newStatus = 'ERROR';
  else if (batteryLevel !== undefined && batteryLevel < 15) newStatus = 'LOW_BATTERY';
  else if (streamingStatus === 'active') newStatus = 'STREAMING';
  else newStatus = 'ONLINE';

  // Update device
  DEVICE_STORE.set(deviceId, {
    ...device,
    status: newStatus,
    lastSeenAt: new Date().toISOString(),
    lastBatteryLevel: batteryLevel ?? device.lastBatteryLevel,
    lastSignalStrength: wifiSignal ?? device.lastSignalStrength,
    updatedAt: new Date().toISOString(),
  });

  // Append to diagnostics log (keep last 50)
  const log = DIAGNOSTICS_LOG.get(deviceId) || [];
  log.push({
    batteryLevel: batteryLevel ?? 0,
    wifiSignal,
    streamingStatus,
    errorCode,
    timestamp: new Date().toISOString(),
  });
  if (log.length > 50) log.shift();
  DIAGNOSTICS_LOG.set(deviceId, log);

  return NextResponse.json({ received: true });
}
