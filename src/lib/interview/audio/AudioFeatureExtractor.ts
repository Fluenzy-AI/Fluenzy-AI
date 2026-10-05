// ─── FluenzyAI — AudioFeatureExtractor ───────────────────────────────────────
// Extracts per-frame acoustic features from raw PCM audio samples.
//
// Design:
//   • Pure functions — stateless, testable, deterministic
//   • Called at frame boundary (~4096 samples at 16kHz = ~256ms)
//   • Features used by AcousticSourceIntelligenceEngine for classification
//   • No DOM, no AudioContext — operates on Float32Array
//
// Features:
//   RMS energy              — overall frame loudness
//   Zero Crossing Rate      — voicing indicator (speech vs noise)
//   Spectral Centroid       — brightness (speech: 1–4kHz, music: variable)
//   Spectral Flux           — frame-to-frame spectral change
//   Temporal Continuity     — consecutive frames above threshold
//   Energy Delta            — change in RMS vs previous frame

export interface AudioFeatures {
  /** Root Mean Square energy: 0..1 */
  rms: number;
  /** Peak amplitude: 0..1 */
  peakAmplitude: number;
  /** Zero Crossing Rate: normalized 0..1 (speech ~0.1–0.3, noise higher) */
  zeroCrossingRate: number;
  /** Spectral Centroid normalized: 0..1 (relative to Nyquist) */
  spectralCentroid: number;
  /** Spectral Flux: frame-to-frame spectral change */
  spectralFlux: number;
  /** Temporal continuity: 0..1 score (higher = more speech-like) */
  temporalContinuity: number;
  /** Energy delta relative to previous frame (+ = louder, - = quieter) */
  energyDelta: number;
  /** Estimate of speech probability based purely on local features 0..1 */
  localSpeechProbability: number;
}

export class AudioFeatureExtractor {
  private _prevSpectrum: Float32Array | null = null;
  private _prevRms = 0;
  private _speechFrameCount = 0;   // consecutive frames with speech-like energy
  private _totalFrameCount  = 0;
  private readonly SAMPLE_RATE: number;

  constructor(sampleRate = 16000) {
    this.SAMPLE_RATE = sampleRate;
  }

  // ── Extract all features from a raw PCM frame ─────────────────────────────
  /**
   * @param samples  Float32Array of PCM samples (range approximately -1..1)
   * @param rmsThreshold  Above this RMS the frame is considered "active"
   */
  extract(samples: Float32Array, rmsThreshold: number): AudioFeatures {
    this._totalFrameCount++;

    const n   = samples.length;
    const rms = this._computeRms(samples);
    const peak = this._computePeak(samples);
    const zcr  = this._computeZcr(samples);

    // Magnitude spectrum via naive DFT approximation
    // NOTE: Using a simplified spectrum for browser performance.
    // Full FFT would require a library. We use N/4 frequency bins for speed.
    const spectrum = this._computeApproxSpectrum(samples);

    const centroid = this._computeSpectralCentroid(spectrum);
    const flux     = this._computeSpectralFlux(spectrum);
    const energyDelta = rms - this._prevRms;

    // Speech-like continuity: frames that were above threshold consecutively
    const isActive = rms > rmsThreshold;
    if (isActive) {
      this._speechFrameCount = Math.min(this._speechFrameCount + 1, 30);
    } else {
      this._speechFrameCount = Math.max(this._speechFrameCount - 2, 0);
    }
    const temporalContinuity = this._speechFrameCount / 30;

    // Local speech probability heuristic:
    //   speech: ZCR 0.05–0.25, centroid 0.1–0.4 (1–4kHz), medium RMS
    //   noise:  ZCR high, centroid high or flat
    //   music:  centroid variable, high temporal continuity, rhythmic flux
    const speechZcrScore       = this._gaussianScore(zcr, 0.15, 0.08);
    const speechCentroidScore  = this._gaussianScore(centroid, 0.22, 0.12);
    const energyScore          = Math.min(1, rms / Math.max(rmsThreshold, 0.001));
    const localSpeechProbability = 0.40 * speechZcrScore
                                 + 0.35 * speechCentroidScore
                                 + 0.25 * energyScore;

    // Store for next frame
    this._prevSpectrum = spectrum;
    this._prevRms      = rms;

    return {
      rms,
      peakAmplitude:      peak,
      zeroCrossingRate:   zcr,
      spectralCentroid:   centroid,
      spectralFlux:       flux,
      temporalContinuity,
      energyDelta,
      localSpeechProbability: Math.min(1, Math.max(0, localSpeechProbability)),
    };
  }

  // ── Reset state (new turn or new session) ─────────────────────────────────
  reset(): void {
    this._prevSpectrum    = null;
    this._prevRms         = 0;
    this._speechFrameCount = 0;
    this._totalFrameCount  = 0;
  }

  // ── Private computations ─────────────────────────────────────────────────

  private _computeRms(samples: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
    return Math.sqrt(sum / samples.length);
  }

  private _computePeak(samples: Float32Array): number {
    let peak = 0;
    for (let i = 0; i < samples.length; i++) {
      const abs = Math.abs(samples[i]);
      if (abs > peak) peak = abs;
    }
    return peak;
  }

  private _computeZcr(samples: Float32Array): number {
    let crossings = 0;
    for (let i = 1; i < samples.length; i++) {
      if ((samples[i] >= 0) !== (samples[i - 1] >= 0)) crossings++;
    }
    return crossings / (samples.length - 1);
  }

  /**
   * Approximate magnitude spectrum using N/8 frequency bins.
   * For production, replace with a proper FFT library.
   * This simplified version has O(N²/8) complexity — acceptable for 4096-sample frames.
   */
  private _computeApproxSpectrum(samples: Float32Array): Float32Array {
    const n    = samples.length;
    const bins = Math.max(32, Math.floor(n / 8)); // ~128 bins for 4096 samples
    const spectrum = new Float32Array(bins);

    for (let k = 0; k < bins; k++) {
      let re = 0;
      let im = 0;
      const freq = (2 * Math.PI * k) / n;
      // Subsample for performance: step through every 8th sample
      for (let i = 0; i < n; i += 8) {
        re += samples[i] * Math.cos(freq * i);
        im += samples[i] * Math.sin(freq * i);
      }
      spectrum[k] = Math.sqrt(re * re + im * im);
    }
    return spectrum;
  }

  private _computeSpectralCentroid(spectrum: Float32Array): number {
    let weightedSum = 0;
    let totalMagnitude = 0;
    for (let k = 0; k < spectrum.length; k++) {
      weightedSum    += k * spectrum[k];
      totalMagnitude += spectrum[k];
    }
    if (totalMagnitude === 0) return 0;
    return (weightedSum / totalMagnitude) / spectrum.length;
  }

  private _computeSpectralFlux(spectrum: Float32Array): number {
    if (!this._prevSpectrum || this._prevSpectrum.length !== spectrum.length) return 0;
    let flux = 0;
    for (let k = 0; k < spectrum.length; k++) {
      const diff = spectrum[k] - this._prevSpectrum[k];
      flux += diff * diff;
    }
    return Math.sqrt(flux / spectrum.length);
  }

  /** Gaussian scoring: returns 1.0 at mean, falls off with stdDev */
  private _gaussianScore(x: number, mean: number, stdDev: number): number {
    const z = (x - mean) / stdDev;
    return Math.exp(-0.5 * z * z);
  }
}
