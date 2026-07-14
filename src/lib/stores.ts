// ─── Shared in-memory stores ─────────────────────────────────────────────────
// Centralised here so route files NEVER export store values directly
// (Next.js build rejects non-handler exports from route.ts files).
// In production: replace with Prisma reads/writes.

import type { HireLensDevice } from '@/types/hardware';

// ── Pairing Store (Mobile Mode) ───────────────────────────────────────────────

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

// ── Device Store (Hardware Mode) ──────────────────────────────────────────────

export type DeviceRecord = Omit<HireLensDevice, 'assignedTo'> & {
  organizationId: string;
  assignedToUserId?: string;
  assignedToName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export const DEVICE_STORE = new Map<string, DeviceRecord>();

// Seed a demo device so the device-list page is never empty in dev
const DEMO_DEVICE_ID = 'demo_device_001';
if (!DEVICE_STORE.has(DEMO_DEVICE_ID)) {
  DEVICE_STORE.set(DEMO_DEVICE_ID, {
    id: DEMO_DEVICE_ID,
    organizationId: 'demo_org',
    serialNumber: 'HRL-DEMO-0001',
    macAddress: 'AA:BB:CC:DD:EE:FF',
    firmwareVersion: '1.2.0',
    hardwareRevision: 'v1',
    nickname: 'Conference Room Collar',
    status: 'ONLINE',
    lastSeenAt: new Date().toISOString(),
    lastBatteryLevel: 82,
    lastSignalStrength: -58,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

// ── Diagnostics Log ───────────────────────────────────────────────────────────

export const DIAGNOSTICS_LOG = new Map<string, Array<{
  batteryLevel: number;
  wifiSignal?: number;
  streamingStatus?: string;
  errorCode?: string;
  timestamp: string;
}>>();
