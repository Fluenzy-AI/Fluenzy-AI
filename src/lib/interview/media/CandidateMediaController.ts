// ─── FluenzyAI — CandidateMediaController ────────────────────────────────────
// Single authoritative source of truth for candidate microphone and camera.
//
// Design:
//   • Uses track.enabled = false/true — NEVER calls getUserMedia() redundantly
//   • Emits typed events on every state transition
//   • Handles: permission denied, device disconnect, Bluetooth headset changes
//   • Pure class — no React, no DOM references (except MediaStream/MediaStreamTrack)
//   • Safe to call toggleMic / toggleCamera multiple times (idempotent)
//
// Integration points:
//   • VoiceAgent: reads micMuted → passes to TurnTakingEngine.evaluate()
//   • ManualVAD: suspends when micMuted=true
//   • ASIE: skips frame processing when micMuted=true
//   • VideoAnalysisPanel: reads cameraMuted → pauses WS frame capture
//   • onaudioprocess callback: skips Gemini sendRealtimeInput when micMuted=true

export type MediaPermission = 'granted' | 'denied' | 'prompt' | 'unavailable';

export interface SingleMediaState {
  /** Whether the track exists and the browser device is available */
  available: boolean;
  /** Whether the candidate has intentionally enabled this device */
  enabled: boolean;
  /** Browser permission query result */
  permission: MediaPermission;
  /** True if track.readyState === 'live' and track.enabled === true */
  live: boolean;
}

export interface CandidateMediaState {
  microphone: SingleMediaState;
  camera: SingleMediaState;
}

export type MediaControllerEvent =
  | 'mic-enabled'
  | 'mic-disabled'
  | 'mic-unavailable'
  | 'mic-permission-denied'
  | 'camera-enabled'
  | 'camera-disabled'
  | 'camera-unavailable'
  | 'camera-permission-denied'
  | 'device-change'
  | 'state-change';

export type MediaControllerListener = (state: CandidateMediaState) => void;

const INITIAL_SINGLE: SingleMediaState = {
  available:  false,
  enabled:    false,
  permission: 'prompt',
  live:       false,
};

export class CandidateMediaController {
  private _micStream:     MediaStream | null = null;
  private _cameraStream:  MediaStream | null = null;
  private _micTrack:      MediaStreamTrack | null = null;
  private _cameraTrack:   MediaStreamTrack | null = null;

  private _state: CandidateMediaState = {
    microphone: { ...INITIAL_SINGLE },
    camera:     { ...INITIAL_SINGLE },
  };

  private _listeners = new Set<MediaControllerListener>();
  private _deviceChangeHandler: (() => void) | null = null;
  private _destroyed = false;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  /**
   * Attach an existing microphone MediaStream.
   * Called once after getUserMedia() in VoiceAgent (no second getUserMedia call needed).
   */
  attachMicStream(stream: MediaStream): void {
    if (this._destroyed) return;
    this._micStream = stream;
    const tracks = stream.getAudioTracks();
    if (tracks.length === 0) {
      this._patchMic({ available: false, enabled: false, permission: 'unavailable', live: false });
      return;
    }
    this._micTrack = tracks[0];
    this._micTrack.addEventListener('ended', () => this._onMicTrackEnded());
    this._patchMic({
      available:  true,
      enabled:    this._micTrack.enabled,
      permission: 'granted',
      live:       this._micTrack.readyState === 'live' && this._micTrack.enabled,
    });
    console.log('[CandidateMediaController] Mic stream attached. trackId=%s', this._micTrack.id);
  }

  /**
   * Attach an existing camera MediaStream.
   * Called once after camera getUserMedia() in VideoAnalysisPanel.
   */
  attachCameraStream(stream: MediaStream): void {
    if (this._destroyed) return;
    this._cameraStream = stream;
    const tracks = stream.getVideoTracks();
    if (tracks.length === 0) {
      this._patchCamera({ available: false, enabled: false, permission: 'unavailable', live: false });
      return;
    }
    this._cameraTrack = tracks[0];
    this._cameraTrack.addEventListener('ended', () => this._onCameraTrackEnded());
    this._patchCamera({
      available:  true,
      enabled:    this._cameraTrack.enabled,
      permission: 'granted',
      live:       this._cameraTrack.readyState === 'live' && this._cameraTrack.enabled,
    });
    console.log('[CandidateMediaController] Camera stream attached. trackId=%s', this._cameraTrack.id);
  }

  /**
   * Register a browser device-change listener.
   * Call once after attach. Handles: headset disconnect, device switch, etc.
   */
  startDeviceChangeListener(): void {
    if (this._destroyed || this._deviceChangeHandler) return;
    this._deviceChangeHandler = () => this._onDeviceChange();
    navigator.mediaDevices.addEventListener('devicechange', this._deviceChangeHandler);
    console.log('[CandidateMediaController] devicechange listener registered');
  }

  // ── Microphone control ─────────────────────────────────────────────────────

  /**
   * Toggle microphone ON or OFF.
   * Uses track.enabled — does NOT recreate the MediaStream.
   */
  toggleMic(): void {
    if (this._destroyed) return;
    if (!this._micTrack || this._micTrack.readyState !== 'live') {
      console.warn('[CandidateMediaController] toggleMic: no live mic track — cannot toggle');
      this._patchMic({ available: false, enabled: false, permission: 'unavailable', live: false });
      return;
    }
    const next = !this._micTrack.enabled;
    this._micTrack.enabled = next;
    this._patchMic({
      available:  true,
      enabled:    next,
      permission: 'granted',
      live:       next && this._micTrack.readyState === 'live',
    });
    console.log('[CandidateMediaController] Mic %s', next ? 'ENABLED' : 'MUTED');
  }

  /** Explicitly enable microphone */
  enableMic(): void {
    if (this._destroyed) return;
    if (!this._micTrack) return;
    if (!this._micTrack.enabled) this.toggleMic();
  }

  /** Explicitly mute microphone */
  muteMic(): void {
    if (this._destroyed) return;
    if (!this._micTrack) return;
    if (this._micTrack.enabled) this.toggleMic();
  }

  // ── Camera control ─────────────────────────────────────────────────────────

  /**
   * Toggle camera ON or OFF.
   * Uses track.enabled — does NOT recreate the MediaStream.
   */
  toggleCamera(): void {
    if (this._destroyed) return;
    if (!this._cameraTrack || this._cameraTrack.readyState !== 'live') {
      console.warn('[CandidateMediaController] toggleCamera: no live camera track');
      this._patchCamera({ available: false, enabled: false, permission: 'unavailable', live: false });
      return;
    }
    const next = !this._cameraTrack.enabled;
    this._cameraTrack.enabled = next;
    this._patchCamera({
      available:  true,
      enabled:    next,
      permission: 'granted',
      live:       next && this._cameraTrack.readyState === 'live',
    });
    console.log('[CandidateMediaController] Camera %s', next ? 'ENABLED' : 'DISABLED');
  }

  /** Explicitly enable camera */
  enableCamera(): void {
    if (this._destroyed) return;
    if (!this._cameraTrack) return;
    if (!this._cameraTrack.enabled) this.toggleCamera();
  }

  /** Explicitly disable camera */
  disableCamera(): void {
    if (this._destroyed) return;
    if (!this._cameraTrack) return;
    if (this._cameraTrack.enabled) this.toggleCamera();
  }

  // ── Notification marks — for when permission is denied before any stream ──

  markMicPermissionDenied(): void {
    this._patchMic({ available: false, enabled: false, permission: 'denied', live: false });
  }

  markCameraPermissionDenied(): void {
    this._patchCamera({ available: false, enabled: false, permission: 'denied', live: false });
  }

  // ── State read ─────────────────────────────────────────────────────────────

  get state(): CandidateMediaState { return this._state; }
  get micMuted(): boolean { return !this._state.microphone.enabled; }
  get cameraMuted(): boolean { return !this._state.camera.enabled; }

  // ── Event subscriptions ────────────────────────────────────────────────────

  subscribe(fn: MediaControllerListener): () => void {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────

  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;

    if (this._deviceChangeHandler) {
      navigator.mediaDevices.removeEventListener('devicechange', this._deviceChangeHandler);
      this._deviceChangeHandler = null;
    }

    // We do NOT stop tracks here — VoiceAgent and VideoAnalysisPanel own the
    // MediaStream lifecycle. We only release our references.
    this._micTrack    = null;
    this._cameraTrack = null;
    this._micStream   = null;
    this._cameraStream = null;
    this._listeners.clear();
    console.log('[CandidateMediaController] Destroyed');
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private _patchMic(patch: SingleMediaState): void {
    this._state = { ...this._state, microphone: patch };
    this._emit();
  }

  private _patchCamera(patch: SingleMediaState): void {
    this._state = { ...this._state, camera: patch };
    this._emit();
  }

  private _emit(): void {
    const snap = this._state;
    for (const fn of this._listeners) {
      try { fn(snap); } catch (e) { console.error('[CandidateMediaController] listener error', e); }
    }
  }

  private _onMicTrackEnded(): void {
    // MediaStreamTrack.onended fires when device is physically disconnected
    console.warn('[CandidateMediaController] Mic track ended — device disconnected or permission revoked');
    this._micTrack = null;
    this._patchMic({ available: false, enabled: false, permission: 'unavailable', live: false });
  }

  private _onCameraTrackEnded(): void {
    console.warn('[CandidateMediaController] Camera track ended — device disconnected or permission revoked');
    this._cameraTrack = null;
    this._patchCamera({ available: false, enabled: false, permission: 'unavailable', live: false });
  }

  private async _onDeviceChange(): Promise<void> {
    // Re-enumerate devices and check if our tracks are still valid
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(d => d.kind === 'audioinput');
      const videoInputs = devices.filter(d => d.kind === 'videoinput');

      const micStillAvailable = this._micTrack
        ? audioInputs.some(d => d.deviceId === this._micTrack?.getSettings().deviceId)
        : false;

      const cameraStillAvailable = this._cameraTrack
        ? videoInputs.some(d => d.deviceId === this._cameraTrack?.getSettings().deviceId)
        : false;

      if (this._micTrack && !micStillAvailable) {
        console.warn('[CandidateMediaController] devicechange: mic device no longer available');
        this._patchMic({ available: false, enabled: false, permission: 'unavailable', live: false });
      }

      if (this._cameraTrack && !cameraStillAvailable) {
        console.warn('[CandidateMediaController] devicechange: camera device no longer available');
        this._patchCamera({ available: false, enabled: false, permission: 'unavailable', live: false });
      }

      console.log(
        '[CandidateMediaController] devicechange: audioInputs=%d videoInputs=%d',
        audioInputs.length, videoInputs.length
      );
    } catch (err) {
      console.error('[CandidateMediaController] devicechange enumerateDevices failed:', err);
    }
  }

  // ── Debug ──────────────────────────────────────────────────────────────────

  toJSON() {
    return {
      microphone: {
        ...this._state.microphone,
        trackId:     this._micTrack?.id ?? null,
        readyState:  this._micTrack?.readyState ?? null,
      },
      camera: {
        ...this._state.camera,
        trackId:     this._cameraTrack?.id ?? null,
        readyState:  this._cameraTrack?.readyState ?? null,
      },
    };
  }
}
