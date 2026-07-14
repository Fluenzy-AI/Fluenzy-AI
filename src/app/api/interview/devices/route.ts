import { NextRequest, NextResponse } from 'next/server';
import { DEVICE_STORE, type DeviceRecord } from '@/lib/stores';
import type { HireLensDevice, DeviceStatus } from '@/types/hardware';

// ── POST /api/interview/devices — register / re-register device ───────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { serialNumber, macAddress, firmwareVersion, nickname } = body;

  if (!serialNumber || !macAddress) {
    return NextResponse.json(
      { error: 'serialNumber and macAddress are required' },
      { status: 400 }
    );
  }

  // Check if already registered (by serialNumber)
  const existing = [...DEVICE_STORE.values()].find(d => d.serialNumber === serialNumber);

  if (existing) {
    const updated: DeviceRecord = {
      ...existing,
      status: 'PAIRED' as DeviceStatus,
      lastSeenAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    DEVICE_STORE.set(existing.id, updated);
    return NextResponse.json({ device: toPublic(updated), isRepairing: true });
  }

  const id = `hl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const record: DeviceRecord = {
    id,
    organizationId: 'org_from_session', // TODO: extract from auth session in production
    serialNumber,
    macAddress,
    firmwareVersion: firmwareVersion || '1.0.0',
    hardwareRevision: 'v1',
    nickname: nickname || undefined,
    status: 'PAIRED',
    lastSeenAt: now,
    lastBatteryLevel: undefined,
    lastSignalStrength: undefined,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  DEVICE_STORE.set(id, record);

  return NextResponse.json({ device: toPublic(record) }, { status: 201 });
}

// ── GET /api/interview/devices — list all active devices ──────────────────────

export async function GET(_req: NextRequest) {
  const devices = [...DEVICE_STORE.values()]
    .filter(d => d.isActive)
    .sort((a, b) => {
      const aOnline = isOnline(a.lastSeenAt);
      const bOnline = isOnline(b.lastSeenAt);
      if (aOnline !== bOnline) return bOnline ? 1 : -1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    })
    .map(toPublic);

  return NextResponse.json({ devices });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isOnline(lastSeenAt?: string): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < 60_000;
}

function toPublic(d: DeviceRecord): HireLensDevice & { assignedTo?: { id: string; name: string } | null } {
  return {
    id: d.id,
    serialNumber: d.serialNumber,
    macAddress: d.macAddress,
    firmwareVersion: d.firmwareVersion,
    hardwareRevision: d.hardwareRevision,
    nickname: d.nickname,
    status: d.status,
    lastSeenAt: d.lastSeenAt,
    lastBatteryLevel: d.lastBatteryLevel,
    lastSignalStrength: d.lastSignalStrength,
    assignedTo: d.assignedToUserId
      ? { id: d.assignedToUserId, name: d.assignedToName || 'Unknown' }
      : null,
  };
}
