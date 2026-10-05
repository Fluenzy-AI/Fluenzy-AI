// ─── FluenzyAI — SpeakerConsistencyTracker ───────────────────────────────────
// Tracks the candidate's acoustic voice characteristics across a session
// and outputs a speaker consistency score.
//
// Design:
//   • Pure class — no DOM, no network
//   • Establishes candidate baseline during first N confirmed speech frames
//   • Computes similarity score for each new frame vs baseline
//   • Uses compact spectral energy profile (not raw audio)
//   • Session-scoped: not persisted across sessions
//   • PRIVACY: Stores only derived energy profiles, NOT raw audio samples
//
// Limitations (explicitly documented):
//   • This is NOT true speaker verification (no voiceprint / neural embed)
//   • Cannot distinguish two speakers with similar energy profiles
//   • Best used as ONE input to candidateSpeechConfidence, not sole decider
//   • If baseline cannot be established, outputs UNKNOWN (conservative)

export type SpeakerLabel = 'CANDIDATE' | 'UNKNOWN' | 'BACKGROUND';

export interface SpeakerConsistencyResult {
  label:      SpeakerLabel;
  similarity: number;   // 0.0 – 1.0 (1.0 = identical profile)
  confidence: number;   // 0.0 – 1.0 (how confident we are in label)
  baselineReady: boolean;
}

export interface SpeakerTrackerOptions {
  /** Number of confirmed speech frames to build baseline. Default: 15 */
  baselineFrames?: number;
  /** Similarity score ≥ this → CANDIDATE. Default: 0.60 */
  candidateSimilarityThreshold?: number;
  /** Similarity score < this → BACKGROUND. Default: 0.30 */
  backgroundSimilarityThreshold?: number;
  /** EMA alpha for updating baseline after establishment. Default: 0.02 */
  baselineUpdateAlpha?: number;
  /** Profile vector length (energy bands). Default: 16 */
  profileBands?: number;
}

export class SpeakerConsistencyTracker {
  private _opts:          Required<SpeakerTrackerOptions>;
  private _baseline:      Float32Array | null = null;
  private _baselineCount: number = 0;
  private _accumulator:   Float32Array;

  constructor(opts: SpeakerTrackerOptions = {}) {
    this._opts = {
      baselineFrames:               opts.baselineFrames               ?? 15,
      candidateSimilarityThreshold: opts.candidateSimilarityThreshold ?? 0.60,
      backgroundSimilarityThreshold: opts.backgroundSimilarityThreshold ?? 0.30,
      baselineUpdateAlpha:          opts.baselineUpdateAlpha          ?? 0.02,
      profileBands:                 opts.profileBands                 ?? 16,
    };
    this._accumulator = new Float32Array(this._opts.profileBands);
  }

  // ── Process a confirmed speech frame ─────────────────────────────────────
  /**
   * Feed confirmed candidate speech energy profile.
   * Only call this for frames classified as "likely speech" by the VAD —
   * NOT for every frame.
   *
   * @param spectrum  Magnitude spectrum from AudioFeatureExtractor
   * @param rms       RMS energy of this frame
   */
  processSpeechFrame(spectrum: Float32Array, rms: number): SpeakerConsistencyResult {
    const profile = this._computeEnergyProfile(spectrum, rms);

    // ── Building baseline ──────────────────────────────────────────────────
    if (!this._baseline) {
      // Accumulate frames into average
      for (let i = 0; i < this._accumulator.length; i++) {
        this._accumulator[i] += profile[i];
      }
      this._baselineCount++;

      if (this._baselineCount >= this._opts.baselineFrames) {
        // Finalise baseline
        this._baseline = new Float32Array(this._opts.profileBands);
        for (let i = 0; i < this._baseline.length; i++) {
          this._baseline[i] = this._accumulator[i] / this._baselineCount;
        }
        console.log('[SpeakerTracker] Baseline established after', this._baselineCount, 'frames');
      }

      return {
        label:         'UNKNOWN',
        similarity:    0.5,
        confidence:    0.3,
        baselineReady: false,
      };
    }

    // ── Compare to baseline ────────────────────────────────────────────────
    const similarity = this._cosineSimilarity(profile, this._baseline);

    // Slowly adapt baseline — prevents drift if environment changes slightly
    // but resists rapid change (so background speaker can't take over)
    for (let i = 0; i < this._baseline.length; i++) {
      this._baseline[i] = this._ema(
        this._baseline[i], profile[i], this._opts.baselineUpdateAlpha
      );
    }

    let label: SpeakerLabel;
    let confidence: number;

    if (similarity >= this._opts.candidateSimilarityThreshold) {
      label = 'CANDIDATE';
      confidence = Math.min(0.95, (similarity - this._opts.candidateSimilarityThreshold) * 2 + 0.60);
    } else if (similarity < this._opts.backgroundSimilarityThreshold) {
      label = 'BACKGROUND';
      confidence = Math.min(0.85, (this._opts.backgroundSimilarityThreshold - similarity) * 2 + 0.50);
    } else {
      label = 'UNKNOWN';
      confidence = 0.40;
    }

    return { label, similarity, confidence, baselineReady: true };
  }

  // ── Reset (new session or new speaker turn) ───────────────────────────────
  reset(): void {
    this._baseline      = null;
    this._baselineCount = 0;
    this._accumulator   = new Float32Array(this._opts.profileBands);
  }

  get baselineReady(): boolean { return this._baseline !== null; }
  get baselineFrameCount(): number { return this._baselineCount; }

  // ── Private helpers ───────────────────────────────────────────────────────

  /** Compress full spectrum into N energy bands (log-spaced) */
  private _computeEnergyProfile(spectrum: Float32Array, rms: number): Float32Array {
    const bands  = this._opts.profileBands;
    const n      = spectrum.length;
    const profile = new Float32Array(bands);

    for (let b = 0; b < bands; b++) {
      // Log-spaced band boundaries (speech energy concentrates in low freqs)
      const lo = Math.floor((n / bands) * b);
      const hi = Math.min(n, Math.floor((n / bands) * (b + 1)));
      let sum = 0;
      for (let k = lo; k < hi; k++) sum += spectrum[k];
      profile[b] = sum / Math.max(1, hi - lo);
    }

    // Normalise by overall RMS so speaker identity is amplitude-independent
    const norm = Math.max(0.0001, rms);
    for (let b = 0; b < bands; b++) profile[b] /= norm;

    return profile;
  }

  /** Cosine similarity: 1.0 = identical, 0.0 = orthogonal */
  private _cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot   += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : Math.min(1, Math.max(0, dot / denom));
  }

  private _ema(current: number, next: number, alpha: number): number {
    return alpha * next + (1 - alpha) * current;
  }

  toJSON() {
    return {
      baselineReady:      this.baselineReady,
      baselineFrameCount: this._baselineCount,
      opts:               this._opts,
    };
  }
}
