'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DeviceDiagnostics } from '@/types/hardware';
import { HireLensSDK } from '@/lib/device-sdk';

// ─── useHardwareDevice ────────────────────────────────────────────────────────
// Manages live diagnostics (BLE notify + REST poll) and stream start/stop
// for an active hardware session.

export function useHardwareDevice(
  deviceId: string | null,
  sessionId: string | null
) {
  const [diagnostics, setDiagnostics] = useState<DeviceDiagnostics | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastHeartbeat, setLastHeartbeat] = useState<number | null>(null);

  const offlineTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Subscribe to BLE diagnostic notifications + REST poll ─────────────────

  useEffect(() => {
    if (!deviceId) return;

    // BLE push (best-effort — silently fails if not BLE-connected)
    HireLensSDK.subscribeToDiagnostics((data) => {
      setDiagnostics(prev => ({ ...(prev ?? {} as DeviceDiagnostics), ...data } as DeviceDiagnostics));
      setLastHeartbeat(Date.now());
    }).catch(() => {});

    // REST poll as fallback (every 15s)
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/interview/devices/${deviceId}/status`, {
          credentials: 'include',
        });
        if (res.ok) {
          const { diagnostics: d } = await res.json();
          if (d) {
            setDiagnostics(d);
            setLastHeartbeat(Date.now());
          }
        }
      } catch {
        // network error — continue polling
      }
    }, 15_000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [deviceId]);

  // ── Offline detection — mark not streaming after 30s silence ──────────────

  useEffect(() => {
    if (!lastHeartbeat) return;
    if (offlineTimer.current) clearTimeout(offlineTimer.current);
    offlineTimer.current = setTimeout(() => {
      setIsStreaming(false);
    }, 30_000);
    return () => {
      if (offlineTimer.current) clearTimeout(offlineTimer.current);
    };
  }, [lastHeartbeat]);

  // ── Stream control ────────────────────────────────────────────────────────

  const startStream = useCallback(async (): Promise<boolean> => {
    if (!deviceId || !sessionId) return false;
    const ok = await HireLensSDK.startStream(deviceId, sessionId);
    if (ok) setIsStreaming(true);
    return ok;
  }, [deviceId, sessionId]);

  const stopStream = useCallback(async (): Promise<void> => {
    if (!deviceId) return;
    await HireLensSDK.stopStream(deviceId);
    setIsStreaming(false);
  }, [deviceId]);

  return { diagnostics, isStreaming, lastHeartbeat, startStream, stopStream };
}
