// ─── FluenzyAI — SpeechStateGuard ─────────────────────────────────────────────
// Deterministic guard layer that sits between raw ASIE/VAD signals and
// TurnTakingEngine. Fixes the P0 "stuck in listening" regression.
//
// Root causes addressed:
//   BUG-1: vadSpeechActive could remain `true` forever when ASIE starts
//           returning background-audio frames while candidate is silent.
//           The onaudioprocess early-return path never cleared the flag.
//
//   BUG-2: No hard expiry on vadSpeechActive. Even if every frame had silence,
//           a stale `true` was passed to TTE → USER_IS_SPEAKING forever.
//
//   BUG-3: Multiple concurrent setInterval loops could accumulate across
//           session restarts because silenceTimerRef and turnSilenceTimerRef
//           were TWO different refs — assignment to one, cleanup from the other.
//
// This class:
//   1. Adds hysteresis: requires N consecutive speech-positive frames to START,
//      and M consecutive speech-negative frames to END candidate speech state.
//   2. Tracks `lastConfirmedCandidateSpeechAt` — refreshed ONLY by genuine
//      candidate audio (not AI echo, background speech, or music).
//   3. Provides `reconcile()` — called every 300ms evaluation tick to expire
//      stale speech state when no new candidate audio has arrived.
//   4. Exposes the authoritative `candidateSpeaking` boolean for TTE.
//
// Frame duration math (for tuning):
//   ScriptProcessor buffer: 4096 samples at 16000 Hz = 256ms per frame
//   speechStartFrames = 2 -> 512ms of continuous speech  -> start (avoids single-click)
//   speechEndFrames   = 3 -> 768ms of continuous silence -> end   (avoids thinking gaps)
//   SPEECH_STATE_MAX_IDLE = 2500ms -> hard expiry if no frames arrive at all

export interface SpeechGuardFrame {
  /** True when ASIE positively identifies candidate speech */
  isCandidateSpeech: boolean;
  /** True when ASIE is still calibrating (use fallback raw VAD) */
  isCalibrating: boolean;
  /** Raw VAD decision (fallback when ASIE uncalibrated) */
  rawVadSpeechActive: boolean;
  /** True if current frame is AI echo (must not update lastConfirmed) */
  isAiEcho: boolean;
  /** True if current frame is background speech (must not update lastConfirmed) */
  isBackgroundSpeech: boolean;
  /** True if current frame is background audio/music (must not update lastConfirmed) */
  isBackgroundAudio: boolean;
  /** True if AI audio is currently playing */
  aiCurrentlySpeaking: boolean;
}

export interface SpeechGuardState {
  /** Authoritative: is candidate currently speaking? */
  candidateSpeaking: boolean;
  /** Timestamp of last CONFIRMED genuine candidate speech frame */
  lastConfirmedCandidateSpeechAt: number;
  /** How long ago (ms) was candidate last confirmed speaking */
  msSinceLastConfirmedSpeech: number;
  /** Whether a hard expiry fired this reconciliation cycle */
  staleSpeechExpired: boolean;
  /** Internal frame counters (for debugging) */
  debug: {
    speechPositiveFrames: number;
    speechNegativeFrames: number;
    totalFrames: number;
  };
}

export class SpeechStateGuard {
  // Configuration

  /**
   * Consecutive speech-positive frames required to enter SPEAKING state.
   * Buffer=4096 at 16kHz -> ~256ms/frame.
   * 1 frame = ~256ms — requires one genuine positive frame to start.
   * Noise spikes are still filtered because ASIE/isGenuineCandidate
   * already excludes echo, background speech, music, and AI audio.
   * Lowered from 2 to 1 to prevent hysteresis from blocking real speech detection.
   */
  private readonly SPEECH_START_FRAMES = 1;

  /**
   * Consecutive speech-negative frames required to exit SPEAKING state.
   * 3 frames ~= 768ms. This acts as the "post-speech grace window" before
   * we mark candidate as silent. Does NOT replace TTE silence thresholds.
   */
  private readonly SPEECH_END_FRAMES = 3;

  /**
   * Hard expiry: if candidateSpeaking=true but no genuine speech frame has
   * confirmed speech for this long, force candidateSpeaking=false.
   * Set to 2500ms - well above any natural thinking pause (which ASIE/VAD
   * would still confirm with some positive frames), but short enough to
   * recover from any stuck-true scenario within 2-3 seconds.
   * TTE's own THINKING_PAUSE threshold starts at 800ms so this is safely
   * above that but won't allow the "stuck listening" bug to persist.
   */
  private readonly SPEECH_STATE_MAX_IDLE_MS = 2500;

  // Mutable state
  private _candidateSpeaking       = false;
  private _lastConfirmedAt         = 0; // epoch ms of last genuine candidate frame
  private _speechPositiveFrames    = 0; // consecutive ASIE+VAD-positive frames
  private _speechNegativeFrames    = 0; // consecutive ASIE+VAD-negative frames
  private _totalFrames             = 0;
  private _staleSpeechExpiredFlag  = false;
  private _debugMode               = process.env.NODE_ENV === 'development';

  /**
   * Called from onaudioprocess - every ~256ms.
   * Returns the updated authoritative `candidateSpeaking` boolean.
   * Only refreshes `lastConfirmedCandidateSpeechAt` for GENUINE candidate frames.
   */
  feedFrame(frame: SpeechGuardFrame): boolean {
    this._totalFrames++;
    this._staleSpeechExpiredFlag = false;

    // Resolve the frame's candidacy:
    // ASIE takes priority when calibrated; raw VAD is the fallback.
    // AI echo, background speech, background audio -> NOT candidate speech.
    const isGenuineCandidate =
      !frame.isAiEcho &&
      !frame.isBackgroundSpeech &&
      !frame.isBackgroundAudio &&
      !frame.aiCurrentlySpeaking &&
      (frame.isCalibrating ? frame.rawVadSpeechActive : frame.isCandidateSpeech);

    if (isGenuineCandidate) {
      // Positive frame - refresh lastConfirmed ONLY here
      this._lastConfirmedAt = Date.now();
      this._speechPositiveFrames++;
      this._speechNegativeFrames = 0;

      if (!this._candidateSpeaking && this._speechPositiveFrames >= this.SPEECH_START_FRAMES) {
        this._candidateSpeaking = true;
        if (this._debugMode) {
          console.log(
            `[SpeechGuard] SPEECH_START after ${this._speechPositiveFrames} positive frames`
          );
        }
      }
    } else {
      // Negative frame
      this._speechNegativeFrames++;
      this._speechPositiveFrames = 0;

      if (this._candidateSpeaking && this._speechNegativeFrames >= this.SPEECH_END_FRAMES) {
        this._candidateSpeaking = false;
        if (this._debugMode) {
          console.log(
            `[SpeechGuard] SPEECH_END after ${this._speechNegativeFrames} negative frames ` +
            `(last confirmed ${Date.now() - this._lastConfirmedAt}ms ago)`
          );
        }
      }
    }

    return this._candidateSpeaking;
  }

  /**
   * Called every 300ms from the TTE evaluation loop.
   * Expires stale candidateSpeaking=true if no positive frames have arrived.
   *
   * This is the HARD SAFETY NET:
   * Even if onaudioprocess stopped running (AudioContext suspended, tab
   * throttled, etc.) candidateSpeaking will expire within SPEECH_STATE_MAX_IDLE_MS.
   */
  reconcile(): SpeechGuardState {
    this._staleSpeechExpiredFlag = false;

    if (this._candidateSpeaking && this._lastConfirmedAt > 0) {
      const idleMs = Date.now() - this._lastConfirmedAt;

      if (idleMs > this.SPEECH_STATE_MAX_IDLE_MS) {
        this._candidateSpeaking    = false;
        this._speechPositiveFrames = 0;
        this._speechNegativeFrames = 0;
        this._staleSpeechExpiredFlag = true;

        console.warn(
          `[SpeechGuard] STALE_SPEECH_EXPIRED — candidateSpeaking was true but ` +
          `no genuine speech frame for ${idleMs}ms (limit=${this.SPEECH_STATE_MAX_IDLE_MS}ms). ` +
          `Forcing false. TTE will now evaluate silence properly.`
        );
      }
    }

    return this._buildState();
  }

  /** Reset state between sessions. */
  reset(): void {
    this._candidateSpeaking    = false;
    this._lastConfirmedAt      = 0;
    this._speechPositiveFrames = 0;
    this._speechNegativeFrames = 0;
    this._totalFrames          = 0;
    this._staleSpeechExpiredFlag = false;
  }

  /** Force-clear speaking state (e.g. when mic is muted, or session ends). */
  forceSilent(reason = 'forced'): void {
    if (this._candidateSpeaking && this._debugMode) {
      console.log(`[SpeechGuard] forceSilent(${reason}) — was candidateSpeaking=true`);
    }
    this._candidateSpeaking    = false;
    this._speechPositiveFrames = 0;
    this._speechNegativeFrames = 0;
    this._staleSpeechExpiredFlag = false;
    // Note: _lastConfirmedAt preserved so TTE can still measure time since last speech
  }

  get candidateSpeaking(): boolean { return this._candidateSpeaking; }
  get lastConfirmedAt(): number { return this._lastConfirmedAt; }
  get msSinceLastConfirmedSpeech(): number {
    if (this._lastConfirmedAt === 0) return Infinity;
    return Date.now() - this._lastConfirmedAt;
  }

  private _buildState(): SpeechGuardState {
    return {
      candidateSpeaking:              this._candidateSpeaking,
      lastConfirmedCandidateSpeechAt: this._lastConfirmedAt,
      msSinceLastConfirmedSpeech:     this.msSinceLastConfirmedSpeech,
      staleSpeechExpired:             this._staleSpeechExpiredFlag,
      debug: {
        speechPositiveFrames: this._speechPositiveFrames,
        speechNegativeFrames: this._speechNegativeFrames,
        totalFrames:          this._totalFrames,
      },
    };
  }

  toJSON() { return this._buildState(); }
}
