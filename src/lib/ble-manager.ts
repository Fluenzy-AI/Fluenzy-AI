'use client';
// Web Bluetooth API wrapper.
// IMPORTANT: Only works in Chromium-based browsers (Chrome 56+, Edge 79+) over HTTPS.
// Firefox and Safari do not support Web Bluetooth.

import {
  HIRELENS_BLE_SERVICES,
  HIRELENS_BLE_CHARACTERISTICS,
  type BLEDeviceInfo,
} from '@/types/hardware';

export class BLEManager {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private services: Map<string, BluetoothRemoteGATTService> = new Map();

  // ── Static browser-support checks ──────────────────────────────────────────

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  static getBrowserSupport(): { supported: boolean; reason?: string } {
    if (typeof window === 'undefined') {
      return { supported: false, reason: 'Not in browser environment.' };
    }
    const ua = navigator.userAgent;
    if (/Firefox\//.test(ua)) {
      return {
        supported: false,
        reason: 'Firefox does not support Web Bluetooth. Use Chrome or Edge.',
      };
    }
    if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) {
      return {
        supported: false,
        reason: 'Safari does not support Web Bluetooth. Use Chrome or Edge.',
      };
    }
    if (!('bluetooth' in navigator)) {
      return {
        supported: false,
        reason: 'Web Bluetooth unavailable. Requires HTTPS and Chrome 56+ / Edge 79+.',
      };
    }
    return { supported: true };
  }

  // ── Device discovery ───────────────────────────────────────────────────────

  async scanForDevices(): Promise<BLEDeviceInfo | null> {
    if (!BLEManager.isSupported()) {
      throw new Error('Web Bluetooth not supported in this browser.');
    }
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'HireLens' },
          { services: [HIRELENS_BLE_SERVICES.HIRELENS_MAIN] },
        ],
        optionalServices: Object.values(HIRELENS_BLE_SERVICES),
      });
      this.device = device;
      const suffix = device.name?.replace('HireLens-', '') || 'UNKNOWN';
      return {
        id: device.id,
        name: device.name || 'HireLens Device',
        serialNumber: `HRL-${suffix}`,
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'NotFoundError') {
        return null; // user cancelled the picker
      }
      throw err;
    }
  }

  // ── GATT connection ────────────────────────────────────────────────────────

  async connect(): Promise<boolean> {
    if (!this.device) {
      throw new Error('No device selected. Call scanForDevices() first.');
    }
    try {
      this.server = await this.device.gatt!.connect();

      // Pre-load all custom services
      await Promise.allSettled(
        Object.values(HIRELENS_BLE_SERVICES).map(uuid => this.getService(uuid))
      );

      this.device.addEventListener('gattserverdisconnected', () => {
        this.server = null;
        this.services.clear();
      });
      return true;
    } catch (err) {
      console.error('[BLEManager] GATT connection failed:', err);
      return false;
    }
  }

  get isConnected(): boolean {
    return !!this.server?.connected;
  }

  // ── Pairing ────────────────────────────────────────────────────────────────

  async getPairingCode(): Promise<string> {
    const char = await this.getCharacteristic(
      HIRELENS_BLE_SERVICES.PAIRING,
      HIRELENS_BLE_CHARACTERISTICS.PAIRING_CODE
    );
    const value = await char.readValue();
    return new TextDecoder().decode(value).trim();
  }

  async configureWifi(ssid: string, password: string): Promise<boolean> {
    try {
      const char = await this.getCharacteristic(
        HIRELENS_BLE_SERVICES.PAIRING,
        HIRELENS_BLE_CHARACTERISTICS.WIFI_CREDENTIALS
      );
      await char.writeValue(
        new TextEncoder().encode(JSON.stringify({ ssid, password }))
      );
      return true;
    } catch (err) {
      console.error('[BLEManager] WiFi config failed:', err);
      return false;
    }
  }

  // ── Device info ────────────────────────────────────────────────────────────

  async getDeviceInfo(): Promise<{ serialNumber: string; firmwareVersion: string; name: string }> {
    const [snChar, fwChar] = await Promise.all([
      this.getCharacteristic(
        HIRELENS_BLE_SERVICES.HIRELENS_MAIN,
        HIRELENS_BLE_CHARACTERISTICS.SERIAL_NUMBER
      ),
      this.getCharacteristic(
        HIRELENS_BLE_SERVICES.HIRELENS_MAIN,
        HIRELENS_BLE_CHARACTERISTICS.FIRMWARE_VERSION
      ),
    ]);
    const [snValue, fwValue] = await Promise.all([
      snChar.readValue(),
      fwChar.readValue(),
    ]);
    const decoder = new TextDecoder();
    return {
      serialNumber: decoder.decode(snValue).trim(),
      firmwareVersion: decoder.decode(fwValue).trim(),
      name: this.device?.name || 'HireLens',
    };
  }

  async getBatteryLevel(): Promise<number> {
    const char = await this.getCharacteristic(
      HIRELENS_BLE_SERVICES.BATTERY,
      HIRELENS_BLE_CHARACTERISTICS.BATTERY_LEVEL
    );
    const value = await char.readValue();
    return value.getUint8(0);
  }

  // ── Diagnostics (BLE notify) ───────────────────────────────────────────────

  async subscribeToDiagnostics(callback: (data: Record<string, unknown>) => void): Promise<void> {
    const char = await this.getCharacteristic(
      HIRELENS_BLE_SERVICES.DIAGNOSTICS,
      HIRELENS_BLE_CHARACTERISTICS.DIAGNOSTICS_READ
    );
    await char.startNotifications();
    char.addEventListener('characteristicvaluechanged', (event: Event) => {
      const target = event.target as BluetoothRemoteGATTCharacteristic;
      try {
        const text = new TextDecoder().decode(target.value!);
        callback(JSON.parse(text));
      } catch {
        // malformed packet — ignore
      }
    });
  }

  // ── Streaming control ──────────────────────────────────────────────────────

  async startStream(sessionId: string, streamConfig: Record<string, unknown>): Promise<boolean> {
    try {
      const char = await this.getCharacteristic(
        HIRELENS_BLE_SERVICES.STREAM_CONTROL,
        HIRELENS_BLE_CHARACTERISTICS.STREAM_START
      );
      await char.writeValue(
        new TextEncoder().encode(JSON.stringify({ sessionId, ...streamConfig }))
      );
      return true;
    } catch (err) {
      console.error('[BLEManager] Start stream failed:', err);
      return false;
    }
  }

  async stopStream(): Promise<boolean> {
    try {
      const char = await this.getCharacteristic(
        HIRELENS_BLE_SERVICES.STREAM_CONTROL,
        HIRELENS_BLE_CHARACTERISTICS.STREAM_STOP
      );
      await char.writeValue(new TextEncoder().encode('STOP'));
      return true;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await this.stopStream().catch(() => {});
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.server = null;
    this.services.clear();
    this.device = null;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async getService(uuid: string): Promise<BluetoothRemoteGATTService> {
    if (this.services.has(uuid)) return this.services.get(uuid)!;
    if (!this.server) throw new Error('Not connected to GATT server.');
    const service = await this.server.getPrimaryService(uuid);
    this.services.set(uuid, service);
    return service;
  }

  private async getCharacteristic(
    serviceUuid: string,
    charUuid: string
  ): Promise<BluetoothRemoteGATTCharacteristic> {
    const service = await this.getService(serviceUuid);
    return service.getCharacteristic(charUuid);
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────

let _instance: BLEManager | null = null;

export function getBLEManager(): BLEManager {
  if (!_instance) _instance = new BLEManager();
  return _instance;
}
