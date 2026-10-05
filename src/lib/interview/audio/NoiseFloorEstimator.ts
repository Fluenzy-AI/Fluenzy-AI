// ─── FluenzyAI — NoiseFloorEstimator ─────────────────────────────────────────
// Adaptive noise floor estimation using Exponential Moving Average (EMA).
//
// Design:
//   • Pure class — no DOM, no React, no network
//   • Calibrates during startup silence window (bounded, ~2s)
//   • Continuously updates during confirmed silence (slow adaptation)
//   • NEVER updates aggressively while candidate is speaking
//   • Uses separate start/continue/end thresholds (hysteresis)
//
// Why EMA:
//   - O(1) per frame, no buffer required
//   - Reacts smoothly to environment changes
//   - Alpha controls adaptation speed:
//       high alpha = fast (used for calibration)
//       low alpha  = slow (used during speech gaps)

export interface NoiseFloorOptions {
  /** EMA alpha during initial calibration (fast). Default: 0.15 */
  calibrationAlpha?: number;
  /** EMA alpha during slow background adaptation. Default: 0.005 */
  adaptationAlpha?: number;
  /** Initial assumed noise floor before calibration. Default: 0.003 */
  initialNoiseFloor?: number;
  /** Multiplier above noise floor → speech-start threshold. Default: 3.0 */
  speechStartMultiplier?: number;
  /** Multiplier above noise floor → speech-continue threshold. Default: 2.0 */
  speechContinueMultiplier?: number;
  /** Multiplier above noise floor → speech-end threshold. Default: 1.5 */
  speechEndMultiplier?: number;
  /** Calibration window in frames. Default: 80 (~2s at 4096/16kHz) */
  calibrationFrames?: number;
  /** Absolute minimum noise floor (prevents threshold collapsing). Default: 0.001 */
  minimumNoiseFloor?: number;
  /** Absolute maximum noise floor (noisy room protection). Default: 0.025 */
  maximumNoiseFloor?: number;
}

export interface NoiseFloorState {
  noiseFloor: number;
  noiseVariance: number;
  isCalibrated: boolean;
  calibrationFramesRemaining: number;
  speechStartThreshold: number;
  speechContinueThreshold: number;
  speechEndThreshold: number;
  ambientLevel: number;
}

export class NoiseFloorEstimator {
  private _noiseFloor: number;
  private _ambientLevel: number;
  private _noiseVariance: number;
  private _isCalibrated: boolean;
  private _calibrationFrameCount: number;
  private _opts: Required<NoiseFloorOptions>;
  // M2 aggregator for Welford online variance
  private _m2: number = 0;
  private _meanForVariance: number = 0;
  private _varFrameCount: number = 0;

  constructor(opts: NoiseFloorOptions = {}) {
    this._opts = {
      calibrationAlpha:         opts.calibrationAlpha         ?? 0.15,
      adaptationAlpha:          opts.adaptationAlpha          ?? 0.005,
      initialNoiseFloor:        opts.initialNoiseFloor        ?? 0.003,
      speechStartMultiplier:    opts.speechStartMultiplier    ?? 3.0,
      speechContinueMultiplier: opts.speechContinueMultiplier ?? 2.0,
      speechEndMultiplier:      opts.speechEndMultiplier      ?? 1.5,
      calibrationFrames:        opts.calibrationFrames        ?? 80,
      minimumNoiseFloor:        opts.minimumNoiseFloor        ?? 0.001,
      maximumNoiseFloor:        opts.maximumNoiseFloor        ?? 0.025,
    };
    this._noiseFloor         = this._opts.initialNoiseFloor;
    this._ambientLevel       = this._opts.initialNoiseFloor;
    this._noiseVariance      = 0;
    this._isCalibrated       = false;
    this._calibrationFrameCount = 0;
  }

  // ── Process a single RMS frame ─────────────────────────────────────────────
  /**
   * Feed an RMS energy frame.
   *
   * @param rmsLevel   RMS energy 0..1
   * @param isSpeech   Is the candidate currently classified as speaking?
   *                   When true, noise floor updates are SUPPRESSED.
   */
  processFrame(rmsLevel: number, isSpeech: boolean): void {
    // ── Calibration phase ─────────────────────────────────────────────────
    if (!this._isCalibrated) {
      this._noiseFloor   = this._ema(this._noiseFloor, rmsLevel, this._opts.calibrationAlpha);
      this._ambientLevel = this._noiseFloor;
      this._updateVariance(rmsLevel);
      this._calibrationFrameCount++;
      if (this._calibrationFrameCount >= this._opts.calibrationFrames) {
        this._isCalibrated = true;
        console.log(
          '[NoiseFloor] Calibrated: noiseFloor=%.5f variance=%.7f startThresh=%.5f',
          this._noiseFloor, this._noiseVariance, this.speechStartThreshold
        );
      }
      return;
    }

    // ── Running adaptation ─────────────────────────────────────────────────
    // Only update during confirmed silence — never during candidate speech.
    if (!isSpeech && rmsLevel < this.speechEndThreshold) {
      const newFloor = this._ema(this._noiseFloor, rmsLevel, this._opts.adaptationAlpha);
      // Clamp within [min, max]
      this._noiseFloor = Math.max(
        this._opts.minimumNoiseFloor,
        Math.min(this._opts.maximumNoiseFloor, newFloor),
      );
      this._ambientLevel = this._ema(this._ambientLevel, rmsLevel, this._opts.adaptationAlpha * 2);
    }
  }

  // ── Derived thresholds ────────────────────────────────────────────────────
  get speechStartThreshold(): number {
    return Math.min(
      this._noiseFloor * this._opts.speechStartMultiplier,
      this._opts.maximumNoiseFloor * this._opts.speechStartMultiplier,
    );
  }

  get speechContinueThreshold(): number {
    return this._noiseFloor * this._opts.speechContinueMultiplier;
  }

  get speechEndThreshold(): number {
    return this._noiseFloor * this._opts.speechEndMultiplier;
  }

  // ── Read-only state ───────────────────────────────────────────────────────
  get noiseFloor(): number { return this._noiseFloor; }
  get ambientLevel(): number { return this._ambientLevel; }
  get noiseVariance(): number { return this._noiseVariance; }
  get isCalibrated(): boolean { return this._isCalibrated; }
  get calibrationProgress(): number {
    return Math.min(1, this._calibrationFrameCount / this._opts.calibrationFrames);
  }

  // ── Reset (new session or mic reconnect) ──────────────────────────────────
  reset(): void {
    this._noiseFloor = this._opts.initialNoiseFloor;
    this._ambientLevel = this._opts.initialNoiseFloor;
    this._noiseVariance = 0;
    this._isCalibrated = false;
    this._calibrationFrameCount = 0;
    this._m2 = 0;
    this._meanForVariance = 0;
    this._varFrameCount = 0;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private _ema(current: number, newValue: number, alpha: number): number {
    return alpha * newValue + (1 - alpha) * current;
  }

  /** Welford's online algorithm for variance (numerically stable) */
  private _updateVariance(x: number): void {
    this._varFrameCount++;
    const delta  = x - this._meanForVariance;
    this._meanForVariance += delta / this._varFrameCount;
    const delta2 = x - this._meanForVariance;
    this._m2 += delta * delta2;
    this._noiseVariance = this._varFrameCount > 1
      ? this._m2 / (this._varFrameCount - 1)
      : 0;
  }

  toJSON(): NoiseFloorState {
    return {
      noiseFloor:                  this._noiseFloor,
      noiseVariance:               this._noiseVariance,
      isCalibrated:                this._isCalibrated,
      calibrationFramesRemaining:  Math.max(0, this._opts.calibrationFrames - this._calibrationFrameCount),
      speechStartThreshold:        this.speechStartThreshold,
      speechContinueThreshold:     this.speechContinueThreshold,
      speechEndThreshold:          this.speechEndThreshold,
      ambientLevel:                this._ambientLevel,
    };
  }
}
