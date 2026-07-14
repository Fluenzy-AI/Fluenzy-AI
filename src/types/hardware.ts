// ─── HireLens Hardware Types ─────────────────────────────────────────────────

export type DeviceStatus =
  | 'UNREGISTERED'
  | 'REGISTERED'
  | 'PAIRED'
  | 'ONLINE'
  | 'STREAMING'
  | 'IDLE'
  | 'LOW_BATTERY'
  | 'ERROR'
  | 'OFFLINE';

export type PairingStep =
  | 'search'
  | 'found'
  | 'connecting'
  | 'authenticating'
  | 'configuring_wifi'
  | 'testing_stream'
  | 'paired'
  | 'error';

export interface HireLensDevice {
  id: string;
  serialNumber: string;
  macAddress: string;
  firmwareVersion: string;
  hardwareRevision?: string;
  nickname?: string;
  status: DeviceStatus;
  lastSeenAt?: string;
  lastBatteryLevel?: number;
  lastSignalStrength?: number;
  assignedTo?: { id: string; name: string } | null;
}

export interface DeviceDiagnostics {
  deviceId: string;
  timestamp: number;
  batteryLevel: number;
  wifiSignal?: number;
  streamingStatus: 'active' | 'idle' | 'buffering' | 'error';
  errorCode?: string;
  bufferHealth?: number;
}

export interface PairingState {
  step: PairingStep;
  discoveredDevice: BLEDeviceInfo | null;
  pairingCode: string | null;
  error: string | null;
  progress: number; // 0–100
}

export interface BLEDeviceInfo {
  id: string;
  name: string;
  serialNumber: string;
  firmwareVersion?: string;
}

// ─── GATT UUIDs ───────────────────────────────────────────────────────────────
// NOTE: Custom UUIDs below are PLACEHOLDERS — confirm final values with firmware team
// before shipping the physical device.

export const HIRELENS_BLE_SERVICES = {
  DEVICE_INFO:    '0000180a-0000-1000-8000-00805f9b34fb', // standard BT SIG
  BATTERY:        '0000180f-0000-1000-8000-00805f9b34fb', // standard BT SIG
  HIRELENS_MAIN:  'f1uen2y3-a1a1-4c7e-8901-234567890abc', // custom — TODO confirm
  STREAM_CONTROL: 'f1uen2y3-b1b1-4c7e-8901-234567890abc', // custom — TODO confirm
  DIAGNOSTICS:    'f1uen2y3-c1c1-4c7e-8901-234567890abc', // custom — TODO confirm
  PAIRING:        'f1uen2y3-d1d1-4c7e-8901-234567890abc', // custom — TODO confirm
} as const;

export const HIRELENS_BLE_CHARACTERISTICS = {
  SERIAL_NUMBER:    'f1uen2y3-e1e1-0000-0002-234567890abc',
  FIRMWARE_VERSION: 'f1uen2y3-e1e1-0000-0003-234567890abc',
  BATTERY_LEVEL:    '00002a19-0000-1000-8000-00805f9b34fb', // standard BT SIG
  STREAM_START:     'f1uen2y3-e2e2-0000-0001-234567890abc',
  STREAM_STOP:      'f1uen2y3-e2e2-0000-0002-234567890abc',
  DIAGNOSTICS_READ: 'f1uen2y3-e3e3-0000-0001-234567890abc',
  PAIRING_CODE:     'f1uen2y3-e4e4-0000-0001-234567890abc',
  WIFI_CREDENTIALS: 'f1uen2y3-e4e4-0000-0002-234567890abc',
} as const;
