'use client';

import { useState, useCallback } from 'react';
import type { PairingState, BLEDeviceInfo, PairingStep } from '@/types/hardware';
import { HireLensSDK } from '@/lib/device-sdk';
import { BLEManager } from '@/lib/ble-manager';

const INITIAL_STATE: PairingState = {
  step: 'search',
  discoveredDevice: null,
  pairingCode: null,
  error: null,
  progress: 0,
};

// ─── useDevicePairing ─────────────────────────────────────────────────────────
// Multi-step pairing state machine:
//   search → found → connecting → authenticating → configuring_wifi → testing_stream → paired
// Each step advances `progress` from 0 → 100.

export function useDevicePairing() {
  const [state, setState] = useState<PairingState>(INITIAL_STATE);
  const [registeredDeviceId, setRegisteredDeviceId] = useState<string | null>(null);

  // Browser BLE support — checked once at hook init (safe server-side: returns unsupported)
  const bleSupport =
    typeof window !== 'undefined'
      ? BLEManager.getBrowserSupport()
      : { supported: false, reason: 'SSR' };

  // ── Helper: advance step ──────────────────────────────────────────────────

  const advance = useCallback(
    (step: PairingStep, progress: number, extra: Partial<PairingState> = {}) => {
      setState(prev => ({ ...prev, step, progress, error: null, ...extra }));
    },
    []
  );

  // ── Step 1: BLE scan ──────────────────────────────────────────────────────

  const startScan = useCallback(async () => {
    advance('search', 10);
    try {
      const device = await HireLensSDK.scanBLE();
      if (!device) {
        setState(prev => ({ ...prev, error: 'Scan cancelled. Try again.' }));
        return;
      }
      advance('found', 25, { discoveredDevice: device });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'BLE scan failed.';
      setState(prev => ({ ...prev, step: 'error', error: msg }));
    }
  }, [advance]);

  // ── Step 2: GATT connect + read pairing code ──────────────────────────────

  const connect = useCallback(async () => {
    advance('connecting', 40);
    try {
      const ok = await HireLensSDK.connectBLE();
      if (!ok) throw new Error('GATT connection refused. Keep device within 1 meter.');
      const code = await HireLensSDK.getPairingCode();
      advance('authenticating', 55, { pairingCode: code });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed.';
      setState(prev => ({ ...prev, step: 'error', error: msg }));
    }
  }, [advance]);

  // ── Step 3: Verify pairing code shown on device LEDs ─────────────────────

  const confirmCode = useCallback(
    (entered: string) => {
      if (entered !== state.pairingCode) {
        setState(prev => ({ ...prev, error: 'Code mismatch. Check the device LED display.' }));
        return;
      }
      advance('configuring_wifi', 70);
    },
    [state.pairingCode, advance]
  );

  // ── Step 4: Push WiFi credentials to device ───────────────────────────────

  const configureWifi = useCallback(
    async (ssid: string, password: string) => {
      advance('configuring_wifi', 75);
      try {
        const ok = await HireLensSDK.configureDeviceWifi(ssid, password);
        if (!ok) throw new Error('WiFi credentials rejected by device.');
        advance('testing_stream', 85);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'WiFi config failed.';
        setState(prev => ({ ...prev, step: 'error', error: msg }));
      }
    },
    [advance]
  );

  // ── Step 5: Register device in backend + finish ───────────────────────────

  const registerAndFinish = useCallback(async () => {
    advance('testing_stream', 90);
    try {
      const info = await HireLensSDK.getDeviceInfo();
      const device = await HireLensSDK.registerDevice({
        serialNumber: info.serialNumber,
        macAddress: state.discoveredDevice!.id,
        firmwareVersion: info.firmwareVersion,
      });
      setRegisteredDeviceId(device.id);
      advance('paired', 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setState(prev => ({ ...prev, step: 'error', error: msg }));
    }
  }, [state.discoveredDevice, advance]);

  // ── Reset ─────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    HireLensSDK.disconnect().catch(() => {});
    setState(INITIAL_STATE);
    setRegisteredDeviceId(null);
  }, []);

  return {
    ...state,
    registeredDeviceId,
    bleSupport,
    startScan,
    connect,
    confirmCode,
    configureWifi,
    registerAndFinish,
    reset,
  };
}
