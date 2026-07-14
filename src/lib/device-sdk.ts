// HireLens Device SDK
// Thin static class that combines BLE operations with REST API calls.
// Import this in hooks/components; never call BLEManager directly from UI.

import { getBLEManager } from './ble-manager';
import type { HireLensDevice, BLEDeviceInfo, DeviceDiagnostics } from '@/types/hardware';

export class HireLensSDK {
  // ── BLE operations (delegated to BLEManager) ──────────────────────────────

  static async scanBLE(): Promise<BLEDeviceInfo | null> {
    return getBLEManager().scanForDevices();
  }

  static async connectBLE(): Promise<boolean> {
    return getBLEManager().connect();
  }

  static async getPairingCode(): Promise<string> {
    return getBLEManager().getPairingCode();
  }

  static async configureDeviceWifi(ssid: string, password: string): Promise<boolean> {
    return getBLEManager().configureWifi(ssid, password);
  }

  static async getDeviceInfo(): Promise<{ serialNumber: string; firmwareVersion: string; name: string }> {
    return getBLEManager().getDeviceInfo();
  }

  static async getBatteryLevel(): Promise<number> {
    return getBLEManager().getBatteryLevel();
  }

  static async subscribeToDiagnostics(
    callback: (data: Partial<DeviceDiagnostics>) => void
  ): Promise<void> {
    return getBLEManager().subscribeToDiagnostics(callback as (d: Record<string, unknown>) => void);
  }

  static async disconnect(): Promise<void> {
    return getBLEManager().disconnect();
  }

  // ── REST operations ───────────────────────────────────────────────────────

  static async registerDevice(params: {
    serialNumber: string;
    macAddress: string;
    firmwareVersion: string;
    nickname?: string;
  }): Promise<HireLensDevice> {
    const res = await fetch('/api/interview/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Device registration failed (${res.status})`);
    }
    const { device } = await res.json();
    return device;
  }

  static async listDevices(): Promise<HireLensDevice[]> {
    const res = await fetch('/api/interview/devices', { credentials: 'include' });
    if (!res.ok) return [];
    const { devices } = await res.json();
    return devices || [];
  }

  static async startStream(deviceId: string, sessionId: string): Promise<boolean> {
    const res = await fetch(`/api/interview/devices/${deviceId}/stream/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ sessionId }),
    });
    if (!res.ok) return false;
    const { streamEndpoint } = await res.json();
    // Tell the collar to start pushing data to streamEndpoint via WiFi
    return getBLEManager().startStream(sessionId, { streamEndpoint: streamEndpoint || '' });
  }

  static async stopStream(deviceId: string): Promise<void> {
    await getBLEManager().stopStream().catch(() => {});
    await fetch(`/api/interview/devices/${deviceId}/stream/stop`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
  }
}
