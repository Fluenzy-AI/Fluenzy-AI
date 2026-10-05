// ─── FluenzyAI — BackgroundAudioClassifier ───────────────────────────────────
// Classifies each audio frame as one of several acoustic source types.
//
// Design:
//   • Pure class — no DOM, no network, no LLM
//   • Runs synchronously in < 1ms per frame on audio thread
//   • Uses heuristic rules on AudioFeatures (from AudioFeatureExtractor)
//   • Falls back gracefully — never crashes
//   • Output feeds AcousticSourceIntelligenceEngine
//
// Classification approach:
//   The classifier uses feature thresholds learned from acoustic observations.
//   In production, these weights should be tuned empirically via a labeled
//   audio dataset. Current values are reasonable conservative defaults.
//
// Limitations (explicitly documented):
//   • Cannot distinguish quiet background speech from quiet candidate speech
//     by energy alone — relies on SpeakerConsistencyTracker for that
//   • Music detection is heuristic (ZCR + flux pattern) — not ML-based
//   • AI echo detection requires the caller to pass isAiPlaying = true

import { AudioFeatures } from './AudioFeatureExtractor';

export type AudioSourceClass =
  | 'SILENCE'
  | 'CANDIDATE_SPEECH'
  | 'BACKGROUND_SPEECH'
  | 'MUSIC'
  | 'TV_VIDEO_AUDIO'
  | 'MECHANICAL_NOISE'
  | 'ENVIRONMENTAL_NOISE'
  | 'AI_ECHO'
  | 'UNKNOWN';

export interface ClassificationResult {
  source: AudioSourceClass;
  confidence: number;           // 0.0 – 1.0
  candidateProbability: number; // Direct input to AcousticSourceEngine
  backgroundProbability: number;
  musicProbability: number;
  reason: string;
}

export interface ClassifierOptions {
  /** RMS below this = SILENCE. Default: 0.002 */
  silenceThreshold?: number;
  /** Confidence required to classify CANDIDATE vs BACKGROUND. Default: 0.6 */
  candidateConfidenceMin?: number;
  /** Smoothing EMA alpha for probability outputs. Default: 0.3 */
  smoothingAlpha?: number;
}

export class BackgroundAudioClassifier {
  private _opts: Required<ClassifierOptions>;
  private _smoothedCandidate = 0.5;  // smoothed candidateProbability
  private _smoothedBackground = 0.2;
  private _smoothedMusic = 0.1;
  private _consecutiveSilenceFrames = 0;
  private _consecutiveSpeechFrames = 0;
  private _consecutiveMusicFrames = 0;

  constructor(opts: ClassifierOptions = {}) {
    this._opts = {
      silenceThreshold:        opts.silenceThreshold        ?? 0.002,
      candidateConfidenceMin:  opts.candidateConfidenceMin  ?? 0.6,
      smoothingAlpha:          opts.smoothingAlpha          ?? 0.3,
    };
  }

  // ── Classify a single audio frame ─────────────────────────────────────────
  /**
   * @param features      Extracted audio features for this frame
   * @param isAiPlaying   True when AI TTS is actively playing (echo detection)
   * @param noiseFloor    Current adaptive noise floor estimate
   * @param baselineRms   Candidate voice baseline RMS (from SpeakerConsistencyTracker)
   */
  classify(
    features: AudioFeatures,
    isAiPlaying: boolean,
    noiseFloor: number,
    baselineRms: number | null,
  ): ClassificationResult {
    const { rms, zeroCrossingRate: zcr, spectralCentroid, spectralFlux,
            temporalContinuity, localSpeechProbability } = features;

    // ── SILENCE ─────────────────────────────────────────────────────────────
    if (rms < this._opts.silenceThreshold) {
      this._consecutiveSilenceFrames++;
      this._consecutiveSpeechFrames = 0;
      this._consecutiveMusicFrames  = 0;
      return this._emit('SILENCE', 0.95, 0.02, 0.02, 0.01, 'RMS below silence threshold');
    }
    this._consecutiveSilenceFrames = 0;

    // ── AI ECHO ──────────────────────────────────────────────────────────────
    // If AI is playing, any audio energy is assumed to be AI echo until user
    // speech is confirmed with high confidence.
    if (isAiPlaying && rms > this._opts.silenceThreshold) {
      // High-confidence barge-in: energy significantly above noise floor
      const bargeInConfidence = rms / Math.max(noiseFloor * 3.5, 0.012);
      if (bargeInConfidence > 1.5 && localSpeechProbability > 0.65) {
        // Candidate barge-in: strong signal well above AI playback level
        return this._emit('CANDIDATE_SPEECH', Math.min(0.8, bargeInConfidence * 0.5),
          0.78, 0.05, 0.02,
          `Barge-in: energy=${rms.toFixed(4)} >> noiseFloor*3.5=${(noiseFloor*3.5).toFixed(4)}`);
      }
      return this._emit('AI_ECHO', 0.80, 0.05, 0.10, 0.02,
        'AI is playing — energy attributed to echo/playback');
    }

    // ── MUSIC DETECTION ──────────────────────────────────────────────────────
    // Music characteristics: high ZCR (vocal or instrumental), rhythmic flux,
    // sustained energy, higher spectral centroid, high temporal continuity.
    const musicScore = this._computeMusicScore(zcr, spectralCentroid, spectralFlux, temporalContinuity, rms);
    if (musicScore > 0.72) {
      this._consecutiveMusicFrames++;
      this._consecutiveSpeechFrames = 0;
      const musicConf = Math.min(0.90, musicScore);
      return this._emit('MUSIC', musicConf, 0.04, 0.08, musicScore,
        `Music score=${musicScore.toFixed(3)} zcr=${zcr.toFixed(3)} centroid=${spectralCentroid.toFixed(3)}`);
    }
    this._consecutiveMusicFrames = 0;

    // ── MECHANICAL NOISE (fan/keyboard/AC) ───────────────────────────────────
    // Characteristics: steady energy, high ZCR, flat spectrum, low speech prob
    const isMechanical = zcr > 0.38 && localSpeechProbability < 0.20
      && spectralCentroid > 0.55 && rms < 0.04;
    if (isMechanical) {
      return this._emit('MECHANICAL_NOISE', 0.75, 0.03, 0.05, 0.02,
        `Mech noise: zcr=${zcr.toFixed(3)} speechProb=${localSpeechProbability.toFixed(3)}`);
    }

    // ── ENVIRONMENTAL NOISE (traffic/room) ───────────────────────────────────
    const isEnvironmental = rms > this._opts.silenceThreshold
      && rms < noiseFloor * 4
      && localSpeechProbability < 0.15;
    if (isEnvironmental) {
      return this._emit('ENVIRONMENTAL_NOISE', 0.68, 0.04, 0.08, 0.01,
        `Env noise: rms=${rms.toFixed(4)} noiseFloor=${noiseFloor.toFixed(4)}`);
    }

    // ── SPEECH (candidate vs background) ─────────────────────────────────────
    // Speech-like energy detected. Differentiate candidate from background
    // using baseline comparison (if available) and energy delta from floor.
    const energyAboveFloor = rms / Math.max(noiseFloor, 0.001);

    // Compute candidate vs background probability
    let candidateProb = localSpeechProbability * 0.5;

    if (baselineRms !== null) {
      // Proximity to candidate's established energy baseline
      const relativeToBaseline = rms / Math.max(baselineRms, 0.001);
      // Score peaks at 1.0 (at baseline), falls off for very different energy
      const baselineMatch = this._gaussianScore(relativeToBaseline, 1.0, 0.6);
      candidateProb = 0.40 * localSpeechProbability + 0.40 * baselineMatch + 0.20 * (energyAboveFloor > 1.5 ? 0.8 : 0.3);
    } else {
      // No baseline yet — use energy above floor as proxy
      candidateProb = 0.6 * localSpeechProbability + 0.4 * Math.min(1, energyAboveFloor / 3);
    }

    candidateProb = Math.min(1, Math.max(0, candidateProb));
    const backgroundProb = 1 - candidateProb;

    // Smooth probabilities
    this._smoothedCandidate  = this._ema(this._smoothedCandidate,  candidateProb,   this._opts.smoothingAlpha);
    this._smoothedBackground = this._ema(this._smoothedBackground, backgroundProb,  this._opts.smoothingAlpha);
    this._smoothedMusic      = this._ema(this._smoothedMusic,      0,               this._opts.smoothingAlpha);

    if (this._smoothedCandidate >= this._opts.candidateConfidenceMin) {
      this._consecutiveSpeechFrames++;
      return this._emit('CANDIDATE_SPEECH',
        this._smoothedCandidate, this._smoothedCandidate, backgroundProb, musicScore,
        `CandidateSpeech: smoothed=${this._smoothedCandidate.toFixed(3)} localSpeech=${localSpeechProbability.toFixed(3)}`);
    }

    if (this._smoothedBackground >= this._opts.candidateConfidenceMin) {
      return this._emit('BACKGROUND_SPEECH',
        this._smoothedBackground, candidateProb, this._smoothedBackground, musicScore,
        `BackgroundSpeech: smoothed=${this._smoothedBackground.toFixed(3)}`);
    }

    // Could be TV/video content (speech-like but lower candidate confidence)
    if (temporalContinuity > 0.4 && localSpeechProbability > 0.35) {
      return this._emit('TV_VIDEO_AUDIO', 0.55, 0.15, 0.55, 0.05,
        'Persistent low-candidate speech — likely TV/video content');
    }

    return this._emit('UNKNOWN', 0.40, candidateProb, backgroundProb, musicScore,
      `Unknown: cand=${candidateProb.toFixed(3)} bg=${backgroundProb.toFixed(3)}`);
  }

  // ── Music score computation ───────────────────────────────────────────────
  private _computeMusicScore(
    zcr: number, centroid: number, flux: number,
    continuity: number, rms: number
  ): number {
    // Music tends to have:
    //   - Moderate-to-high ZCR (instruments + vocals)
    //   - Wider spectral range (centroid 0.2–0.7)
    //   - Rhythmic flux (not monotonic)
    //   - Sustained continuity
    //   - Consistent RMS
    const zcrInRange      = zcr > 0.08 && zcr < 0.45 ? 0.25 : 0;
    const centroidInRange = centroid > 0.15 && centroid < 0.65 ? 0.20 : 0;
    const continuityScore = continuity > 0.5 ? 0.25 : (continuity > 0.3 ? 0.10 : 0);
    const fluxScore       = flux > 0.01 && flux < 0.5 ? 0.15 : 0;
    const rmsScore        = rms > 0.01 && rms < 0.15 ? 0.15 : 0;

    return zcrInRange + centroidInRange + continuityScore + fluxScore + rmsScore;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private _emit(
    source: AudioSourceClass,
    confidence: number,
    candidateProbability: number,
    backgroundProbability: number,
    musicProbability: number,
    reason: string,
  ): ClassificationResult {
    return { source, confidence, candidateProbability, backgroundProbability, musicProbability, reason };
  }

  private _ema(current: number, next: number, alpha: number): number {
    return alpha * next + (1 - alpha) * current;
  }

  private _gaussianScore(x: number, mean: number, stdDev: number): number {
    const z = (x - mean) / stdDev;
    return Math.exp(-0.5 * z * z);
  }

  reset(): void {
    this._smoothedCandidate  = 0.5;
    this._smoothedBackground = 0.2;
    this._smoothedMusic      = 0.1;
    this._consecutiveSilenceFrames = 0;
    this._consecutiveSpeechFrames  = 0;
    this._consecutiveMusicFrames   = 0;
  }

  toJSON() {
    return {
      smoothedCandidate:  this._smoothedCandidate,
      smoothedBackground: this._smoothedBackground,
      smoothedMusic:      this._smoothedMusic,
    };
  }
}
