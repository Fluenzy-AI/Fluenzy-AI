'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type PermissionStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

export interface MediaCaptureState {
  stream: MediaStream | null;
  permissionStatus: PermissionStatus;
  isCameraReady: boolean;
  isMicReady: boolean;
  error: string | null;
  deviceInfo: { resolution: string; frameRate: number } | null;
}

export function useMediaCapture() {
  const [state, setState] = useState<MediaCaptureState>({
    stream: null,
    permissionStatus: 'idle',
    isCameraReady: false,
    isMicReady: false,
    error: null,
    deviceInfo: null,
  });

  const streamRef = useRef<MediaStream | null>(null);

  const requestPermissions = useCallback(async () => {
    setState(prev => ({ ...prev, permissionStatus: 'requesting', error: null }));

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;

      const videoTrack = mediaStream.getVideoTracks()[0];
      const settings = videoTrack?.getSettings();

      setState({
        stream: mediaStream,
        permissionStatus: 'granted',
        isCameraReady: mediaStream.getVideoTracks().length > 0,
        isMicReady: mediaStream.getAudioTracks().length > 0,
        error: null,
        deviceInfo: settings
          ? {
              resolution: `${settings.width ?? '?'}×${settings.height ?? '?'}`,
              frameRate: settings.frameRate ?? 30,
            }
          : null,
      });

      return mediaStream;
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string };
      const errorMessage =
        error.name === 'NotAllowedError'
          ? 'Camera/Microphone access denied. Please allow permissions in your browser settings and retry.'
          : error.name === 'NotFoundError'
          ? 'Camera or microphone not found on this device.'
          : error.name === 'NotReadableError'
          ? 'Camera is already in use by another application.'
          : `Media error: ${error.message ?? 'Unknown error'}`;

      setState(prev => ({
        ...prev,
        permissionStatus: 'denied',
        error: errorMessage,
      }));

      return null;
    }
  }, []);

  const stopCapture = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setState(prev => ({
        ...prev,
        stream: null,
        isCameraReady: false,
        isMicReady: false,
      }));
    }
  }, []);

  const checkPermissions = useCallback(async () => {
    if (!navigator.permissions) return;
    try {
      const [camPerm, micPerm] = await Promise.all([
        navigator.permissions.query({ name: 'camera' as PermissionName }),
        navigator.permissions.query({ name: 'microphone' as PermissionName }),
      ]);
      if (camPerm.state === 'granted' && micPerm.state === 'granted') {
        setState(prev => ({ ...prev, permissionStatus: 'granted' }));
      } else if (camPerm.state === 'denied' || micPerm.state === 'denied') {
        setState(prev => ({ ...prev, permissionStatus: 'denied' }));
      }
    } catch {
      // Permissions API not fully supported — will check on explicit request
    }
  }, []);

  useEffect(() => {
    checkPermissions();
    return () => {
      stopCapture();
    };
  }, [checkPermissions, stopCapture]);

  return { ...state, requestPermissions, stopCapture, checkPermissions };
}
