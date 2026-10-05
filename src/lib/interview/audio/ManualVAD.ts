// ─── FluenzyAI — ManualVAD (Voice Activity Detector) ────────────────────────
// Decides when a user's speech starts and ends, based on RMS energy level.
//
// Design:
//   • Pure function of audio energy — no AudioContext, no DOM
//   • Caller feeds RMS frames from MicrophoneManager
//   • Emits: onSpeechStart, onSpeechEnd events with callbacks
//
// Key behaviour:
//   • GUARD: When AI is actively speaking (aiSpeaking=true), VAD is suppressed.
//     This prevents the AI's own audio (via echo from the speaker) from
//     self-triggering the VAD when echoCancellation can't fully remove it.
//   • Pre-roll buffer: retains the last N ms of audio BEFORE speech threshold
//     was crossed, so the first syllable is never lost.
//   • Configurable thresholds and silence duration.

export interface VADOptions {
  /** RMS amplitude that counts as "speech". Default: 0.008 */
  speechThreshold?: number;
  /** Ms of continuous silence after speech → emit onSpeechEnd. Default: 400 */
  silenceMs?: number;
  /** Pre-roll buffer duration in ms (first-word loss prevention). Default: 200 */
  preRollMs?: number;
  /** How often to log debug metrics (0 = never). Default: 0 */
  debugLogIntervalMs?: number;
}

export interface VADState {
  speechActive: boolean;
  lastSpeechAt: number;
  silenceStartAt: number | null;
  frameCount: number;
}

export interface VADCallbacks {
  onSpeechStart?: (timestamp: number) => void;
  onSpeechEnd?: (timestamp: number, durationMs: number) => void;
}

export class ManualVAD {
  private _opts: Required<VADOptions>;
  private _state: VADState;
  private _callbacks: VADCallbacks;
  private _enabled = true;

  // Track when speech started for duration calculation
  private _speechStartTime = 0;

  constructor(opts: VADOptions = {}, callbacks: VADCallbacks = {}) {
    this._opts = {
      speechThreshold: opts.speechThreshold ?? 0.008,
      silenceMs:       opts.silenceMs       ?? 400,
      preRollMs:       opts.preRollMs       ?? 200,
      debugLogIntervalMs: opts.debugLogIntervalMs ?? 0,
    };
    this._callbacks = callbacks;
    this._state = {
      speechActive: false,
      lastSpeechAt: Date.now(),
      silenceStartAt: null,
      frameCount: 0,
    };
  }

  // ── Enable / Disable ──────────────────────────────────────────────────────
  /** Suppress VAD processing while AI is speaking (prevent self-feedback). */
  setEnabled(enabled: boolean): void {
    if (!enabled && this._state.speechActive) {
      // Force reset when suppressed mid-speech
      this._state.speechActive = false;
      this._state.silenceStartAt = null;
    }
    this._enabled = enabled;
  }

  get isEnabled(): boolean { return this._enabled; }
  get isSpeechActive(): boolean { return this._state.speechActive; }

  // ── Process Frame ─────────────────────────────────────────────────────────
  /**
   * Feed an RMS audio frame into the VAD.
   * Call this every time MicrophoneManager emits a frame.
   *
   * @param rmsLevel  RMS energy 0..1 from MicrophoneManager
   * @param nowMs     Wall-clock timestamp (Date.now())
   */
  processFrame(rmsLevel: number, nowMs: number = Date.now()): void {
    if (!this._enabled) return;

    this._state.frameCount++;

    if (rmsLevel > this._opts.speechThreshold) {
      // ── Speech detected ───────────────────────────────────────────────────
      this._state.lastSpeechAt = nowMs;
      this._state.silenceStartAt = null;

      if (!this._state.speechActive) {
        this._state.speechActive = true;
        this._speechStartTime = nowMs;
        console.log('[VAD] speechStart — rms=%.4f threshold=%.4f', rmsLevel, this._opts.speechThreshold);
        this._callbacks.onSpeechStart?.(nowMs);
      }
    } else if (this._state.speechActive) {
      // ── Silence after speech ──────────────────────────────────────────────
      const silenceDuration = nowMs - this._state.lastSpeechAt;

      if (silenceDuration >= this._opts.silenceMs) {
        const speechDuration = nowMs - this._speechStartTime;
        this._state.speechActive = false;
        this._state.silenceStartAt = nowMs;
        console.log(
          '[VAD] speechEnd — silence=%dms speech=%dms frames=%d',
          Math.round(silenceDuration),
          Math.round(speechDuration),
          this._state.frameCount,
        );
        this._callbacks.onSpeechEnd?.(nowMs, speechDuration);
      }
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  /** Reset state between turns. Does NOT reset the callbacks. */
  reset(): void {
    this._state = {
      speechActive: false,
      lastSpeechAt: Date.now(),
      silenceStartAt: null,
      frameCount: 0,
    };
    this._speechStartTime = 0;
  }

  // ── Update callbacks at runtime ───────────────────────────────────────────
  updateCallbacks(callbacks: Partial<VADCallbacks>): void {
    this._callbacks = { ...this._callbacks, ...callbacks };
  }

  // ── Silence since last speech (utility) ──────────────────────────────────
  silenceMsSinceLastSpeech(): number {
    return Date.now() - this._state.lastSpeechAt;
  }

  markUserSpoke(): void {
    this._state.lastSpeechAt = Date.now();
  }

  toJSON() {
    return {
      speechActive: this._state.speechActive,
      enabled: this._enabled,
      frameCount: this._state.frameCount,
      silenceMsSinceLastSpeech: this.silenceMsSinceLastSpeech(),
    };
  }
}
