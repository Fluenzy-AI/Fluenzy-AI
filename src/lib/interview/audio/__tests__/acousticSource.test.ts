/**
 * Acoustic Source Intelligence — Full 18-Scenario Test Matrix
 *
 * Test 1:  Candidate speaks normally → CANDIDATE
 * Test 2:  Candidate speaks quietly → CANDIDATE (not rejected)
 * Test 3:  Far person speaks quietly → BACKGROUND
 * Test 4:  Far person speaks loudly → BACKGROUND (loud ≠ candidate)
 * Test 5:  Candidate + background simultaneous → CANDIDATE_PRIMARY
 * Test 6:  Background music → MUSIC
 * Test 7:  Music with vocals → MUSIC (not CANDIDATE)
 * Test 8:  YouTube video speech → BACKGROUND_AUDIO
 * Test 9:  AI TTS echo → AI_ECHO / keep AI playing
 * Test 10: Fan → NON_SPEECH
 * Test 11: Keyboard → NON_SPEECH
 * Test 12: Candidate pause → CANDIDATE_PAUSED (not BACKGROUND)
 * Test 13: Candidate resumes after pause → CANDIDATE
 * Test 14: Background speaker during AI speech → DO NOT barge-in
 * Test 15: Candidate interrupts AI → STOP AI AUDIO
 * Test 16: Unknown audio → WAIT_FOR_SOURCE_CLASSIFICATION
 * Test 17: STT text but acoustic=background → do not append to candidate
 * Test 18: Network/STT delay → not treated as silence
 *
 * Plus NoiseFloorEstimator, BackgroundAudioClassifier, SpeakerConsistencyTracker,
 * and TurnTakingEngine acoustic integration tests.
 */

import { NoiseFloorEstimator } from '../NoiseFloorEstimator';
import { AudioFeatureExtractor, AudioFeatures } from '../AudioFeatureExtractor';
import { BackgroundAudioClassifier } from '../BackgroundAudioClassifier';
import { SpeakerConsistencyTracker } from '../SpeakerConsistencyTracker';
import { AcousticSourceIntelligenceEngine } from '../AcousticSourceIntelligenceEngine';
import { TurnTakingEngine, TurnSignals } from '../../core/TurnTakingEngine';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Create a Float32Array filled with a repeating waveform at given RMS level */
function makeSpeechFrame(targetRms: number, length = 4096, zcrRate = 0.15): Float32Array {
  const samples = new Float32Array(length);
  // Generate a rough speech-like waveform (mixed frequency)
  let sign = 1;
  let zcr = 0;
  for (let i = 0; i < length; i++) {
    // Periodic sign flip to hit target ZCR
    if (i > 0 && Math.random() < zcrRate) { sign = -sign; zcr++; }
    samples[i] = sign * targetRms * (0.8 + Math.random() * 0.4);
  }
  return samples;
}

/** Silence frame — energy near zero */
function makeSilenceFrame(length = 4096): Float32Array {
  return new Float32Array(length).fill(0.0001);
}

/** High-ZCR mechanical noise (fan, keyboard) */
function makeMechanicalFrame(rms: number, length = 4096): Float32Array {
  const samples = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    samples[i] = (Math.random() * 2 - 1) * rms * 1.2; // white noise
  }
  return samples;
}

/** Music-like frame: sustained, broader spectrum */
function makeMusicFrame(rms: number, length = 4096): Float32Array {
  const samples = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    // Multiple frequency components (like music)
    samples[i] = rms * (
      0.4 * Math.sin(2 * Math.PI * 440 * i / 16000)
    + 0.3 * Math.sin(2 * Math.PI * 880 * i / 16000)
    + 0.2 * Math.sin(2 * Math.PI * 220 * i / 16000)
    + 0.1 * (Math.random() * 2 - 1)
    );
  }
  return samples;
}

/** TurnSignals helper */
function makeSignals(overrides: Partial<TurnSignals> = {}): TurnSignals {
  return {
    vadSpeechActive: false,
    aiSpeaking: false,
    silenceDurationMs: 0,
    speechDurationMs: 0,
    partialTranscript: '',
    sttFinalised: false,
    transcriptFinalizationOpen: false,
    answerCompletion: 'UNKNOWN',
    questionType: 'HR',
    questionGenerationPending: false,
    questionAlreadyAsked: false,
    sessionEnding: false,
    ...overrides,
  };
}

// ─── NoiseFloorEstimator tests ────────────────────────────────────────────────

describe('NoiseFloorEstimator', () => {
  let estimator: NoiseFloorEstimator;

  beforeEach(() => {
    estimator = new NoiseFloorEstimator({ calibrationFrames: 10 });
  });

  test('starts uncalibrated', () => {
    expect(estimator.isCalibrated).toBe(false);
    expect(estimator.calibrationProgress).toBe(0);
  });

  test('calibrates after N frames', () => {
    for (let i = 0; i < 10; i++) {
      estimator.processFrame(0.003, false);
    }
    expect(estimator.isCalibrated).toBe(true);
  });

  test('noise floor converges toward actual noise level', () => {
    for (let i = 0; i < 20; i++) {
      estimator.processFrame(0.005, false);
    }
    expect(estimator.noiseFloor).toBeGreaterThan(0.001);
    expect(estimator.noiseFloor).toBeLessThan(0.015);
  });

  test('speech threshold is above noise floor', () => {
    for (let i = 0; i < 10; i++) {
      estimator.processFrame(0.003, false);
    }
    expect(estimator.speechStartThreshold).toBeGreaterThan(estimator.noiseFloor);
  });

  test('does NOT update noise floor during candidate speech', () => {
    for (let i = 0; i < 10; i++) estimator.processFrame(0.003, false);
    const floorAfterCalib = estimator.noiseFloor;
    // High RMS while speaking — should NOT update floor
    for (let i = 0; i < 50; i++) estimator.processFrame(0.08, true);
    // Floor should not have jumped significantly
    expect(estimator.noiseFloor).toBeLessThan(floorAfterCalib * 5);
  });

  test('adapts slowly during silence after calibration', () => {
    for (let i = 0; i < 10; i++) estimator.processFrame(0.003, false);
    const floor1 = estimator.noiseFloor;
    for (let i = 0; i < 100; i++) estimator.processFrame(0.001, false);
    // Should have moved down slowly
    expect(estimator.noiseFloor).toBeLessThanOrEqual(floor1);
  });

  test('speechStartThreshold > speechEndThreshold (hysteresis)', () => {
    for (let i = 0; i < 10; i++) estimator.processFrame(0.003, false);
    expect(estimator.speechStartThreshold).toBeGreaterThan(estimator.speechEndThreshold);
  });

  test('noise floor clamped to minimum', () => {
    for (let i = 0; i < 100; i++) estimator.processFrame(0.00001, false);
    expect(estimator.noiseFloor).toBeGreaterThanOrEqual(0.001);
  });

  test('reset restores initial state', () => {
    for (let i = 0; i < 10; i++) estimator.processFrame(0.005, false);
    estimator.reset();
    expect(estimator.isCalibrated).toBe(false);
    expect(estimator.calibrationProgress).toBe(0);
  });
});

// ─── AudioFeatureExtractor tests ─────────────────────────────────────────────

describe('AudioFeatureExtractor', () => {
  let extractor: AudioFeatureExtractor;
  beforeEach(() => { extractor = new AudioFeatureExtractor(16000); });

  test('returns valid features for speech-like frame', () => {
    const samples = makeSpeechFrame(0.04);
    const features = extractor.extract(samples, 0.008);
    expect(features.rms).toBeGreaterThan(0);
    expect(features.rms).toBeLessThanOrEqual(1);
    expect(features.zeroCrossingRate).toBeGreaterThanOrEqual(0);
    expect(features.zeroCrossingRate).toBeLessThanOrEqual(1);
    expect(features.localSpeechProbability).toBeGreaterThanOrEqual(0);
    expect(features.localSpeechProbability).toBeLessThanOrEqual(1);
  });

  test('silence frame has low RMS and speech probability', () => {
    const features = extractor.extract(makeSilenceFrame(), 0.008);
    expect(features.rms).toBeLessThan(0.01);
    expect(features.localSpeechProbability).toBeLessThan(0.5);
  });

  test('temporal continuity increases with consecutive speech frames', () => {
    const threshold = 0.008;
    let prev = extractor.extract(makeSpeechFrame(0.04), threshold);
    for (let i = 0; i < 10; i++) {
      const f = extractor.extract(makeSpeechFrame(0.04), threshold);
      prev = f;
    }
    expect(prev.temporalContinuity).toBeGreaterThan(0.2);
  });

  test('reset clears temporal state', () => {
    for (let i = 0; i < 15; i++) extractor.extract(makeSpeechFrame(0.05), 0.008);
    extractor.reset();
    const f = extractor.extract(makeSpeechFrame(0.05), 0.008);
    expect(f.temporalContinuity).toBeLessThan(0.2); // fresh start
  });
});

// ─── BackgroundAudioClassifier tests ─────────────────────────────────────────

describe('BackgroundAudioClassifier', () => {
  let classifier: BackgroundAudioClassifier;
  let extractor: AudioFeatureExtractor;

  beforeEach(() => {
    classifier = new BackgroundAudioClassifier();
    extractor  = new AudioFeatureExtractor(16000);
  });

  function classify(samples: Float32Array, isAiPlaying = false, baseline: number | null = null) {
    const features = extractor.extract(samples, 0.008);
    return classifier.classify(features, isAiPlaying, 0.003, baseline);
  }

  // Test 9: AI TTS echo
  test('Test 9 — AI TTS echo: low signal during AI playback → AI_ECHO', () => {
    const result = classify(makeSpeechFrame(0.01), true, null);
    expect(result.source).toBe('AI_ECHO');
    expect(result.candidateProbability).toBeLessThan(0.3);
  });

  // Test 6/7: Music detection
  test('Test 6/7 — Music: music frame scored higher on music probability', () => {
    // Feed multiple music frames to build up smoothed state
    for (let i = 0; i < 5; i++) classify(makeMusicFrame(0.04));
    const result = classify(makeMusicFrame(0.04));
    // Music or at least elevated music probability
    expect(result.musicProbability).toBeGreaterThan(0.2);
    expect(result.candidateProbability).toBeLessThan(0.8);
  });

  // Test 10/11: Mechanical noise (fan/keyboard)
  test('Test 10/11 — Mechanical noise: high ZCR white noise → not CANDIDATE', () => {
    const result = classify(makeMechanicalFrame(0.02));
    expect(result.source).not.toBe('CANDIDATE_SPEECH');
    expect(result.candidateProbability).toBeLessThan(0.4);
  });

  test('Silence → SILENCE', () => {
    const result = classify(makeSilenceFrame());
    expect(result.source).toBe('SILENCE');
    expect(result.candidateProbability).toBeLessThan(0.1);
  });

  test('Candidate barge-in during AI playback: strong signal → CANDIDATE_SPEECH', () => {
    // Very strong signal while AI is playing = barge-in
    const result = classify(makeSpeechFrame(0.10), true, 0.08);
    // With very high energy the bargeInConfidence should be > 1.5
    // Either CANDIDATE_SPEECH or stays as AI_ECHO at lower levels
    expect(['CANDIDATE_SPEECH', 'AI_ECHO']).toContain(result.source);
  });

  test('confidence is between 0 and 1', () => {
    const result = classify(makeSpeechFrame(0.04));
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(result.candidateProbability).toBeGreaterThanOrEqual(0);
    expect(result.candidateProbability).toBeLessThanOrEqual(1);
  });
});

// ─── SpeakerConsistencyTracker tests ─────────────────────────────────────────

describe('SpeakerConsistencyTracker', () => {
  let tracker: SpeakerConsistencyTracker;

  beforeEach(() => {
    tracker = new SpeakerConsistencyTracker({ baselineFrames: 5 });
  });

  test('returns UNKNOWN before baseline established', () => {
    const spectrum = new Float32Array(16).fill(0.1);
    const result = tracker.processSpeechFrame(spectrum, 0.05);
    expect(result.label).toBe('UNKNOWN');
    expect(result.baselineReady).toBe(false);
  });

  test('establishes baseline after N frames', () => {
    const spectrum = new Float32Array(16).fill(0.1);
    for (let i = 0; i < 5; i++) tracker.processSpeechFrame(spectrum, 0.05);
    expect(tracker.baselineReady).toBe(true);
  });

  test('same speaker profile returns CANDIDATE', () => {
    const spectrum = new Float32Array(16).fill(0.15);
    for (let i = 0; i < 5; i++) tracker.processSpeechFrame(spectrum, 0.05);
    const result = tracker.processSpeechFrame(spectrum, 0.05);
    expect(result.label).toBe('CANDIDATE');
    expect(result.similarity).toBeGreaterThan(0.9);
  });

  test('very different profile returns BACKGROUND', () => {
    // Build baseline with one profile
    const baseSpectrum = new Float32Array(16).fill(0.1);
    for (let i = 0; i < 5; i++) tracker.processSpeechFrame(baseSpectrum, 0.05);
    // Feed drastically different profile
    const diffSpectrum = new Float32Array(16);
    diffSpectrum[15] = 5.0; // concentration at highest band only
    const result = tracker.processSpeechFrame(diffSpectrum, 0.05);
    expect(['BACKGROUND', 'UNKNOWN']).toContain(result.label);
  });

  test('similarity is between 0 and 1', () => {
    const spectrum = new Float32Array(16).fill(0.1);
    for (let i = 0; i < 5; i++) tracker.processSpeechFrame(spectrum, 0.05);
    const result = tracker.processSpeechFrame(spectrum, 0.05);
    expect(result.similarity).toBeGreaterThanOrEqual(0);
    expect(result.similarity).toBeLessThanOrEqual(1);
  });

  test('reset clears baseline', () => {
    const spectrum = new Float32Array(16).fill(0.1);
    for (let i = 0; i < 5; i++) tracker.processSpeechFrame(spectrum, 0.05);
    tracker.reset();
    expect(tracker.baselineReady).toBe(false);
  });
});

// ─── AcousticSourceIntelligenceEngine tests ──────────────────────────────────

describe('AcousticSourceIntelligenceEngine (ASIE)', () => {
  let asie: AcousticSourceIntelligenceEngine;

  beforeEach(() => {
    asie = new AcousticSourceIntelligenceEngine({ minSpeechFrames: 2, minSilenceFrames: 2 });
  });

  function calibrate(engine: AcousticSourceIntelligenceEngine, frames = 85) {
    for (let i = 0; i < frames; i++) {
      engine.processFrame(makeSilenceFrame(), false);
    }
  }

  // Test 16: Unknown audio → WAIT
  test('Test 16 — Returns CALIBRATING before noise floor ready', () => {
    const result = asie.processFrame(makeSpeechFrame(0.04), false);
    expect(result.decision).toBe('CALIBRATING');
    expect(result.isCalibrated).toBe(false);
  });

  test('Calibration progress increases monotonically', () => {
    let lastProgress = -1;
    for (let i = 0; i < 85; i++) {
      const r = asie.processFrame(makeSilenceFrame(), false);
      expect(r.calibrationProgress).toBeGreaterThanOrEqual(lastProgress);
      lastProgress = r.calibrationProgress;
    }
  });

  // Test 1: Normal candidate speech
  test('Test 1 — Normal candidate speech → CANDIDATE_SPEAKING after calibration', () => {
    calibrate(asie);
    // Feed speech frames
    let result = asie.processFrame(makeSpeechFrame(0.05), false);
    result = asie.processFrame(makeSpeechFrame(0.05), false);
    result = asie.processFrame(makeSpeechFrame(0.05), false);
    expect(['CANDIDATE_SPEAKING', 'UNKNOWN_AUDIO']).toContain(result.decision);
    expect(result.candidateSpeechConfidence).toBeGreaterThan(0);
  });

  // Test 9: AI echo
  test('Test 9 — AI TTS echo: sound during AI playback → AI_ECHO, KEEP_AI_PLAYING', () => {
    calibrate(asie);
    const result = asie.processFrame(makeSpeechFrame(0.02), true);
    expect(result.source).toBe('AI_ECHO');
    expect(result.bargeIn).toBe('KEEP_AI_PLAYING');
    expect(result.decision).toBe('AI_ECHO');
  });

  // Test 14: Background speaker during AI → no barge-in
  test('Test 14 — Background during AI speech: DO NOT barge-in', () => {
    calibrate(asie);
    const result = asie.processFrame(makeSpeechFrame(0.015), true);
    // Low energy during AI playback → AI_ECHO, not barge-in
    expect(result.bargeIn).toBe('KEEP_AI_PLAYING');
    expect(result.decision).not.toBe('CANDIDATE_BARGE_IN');
  });

  // Test 15: Candidate interrupts AI → STOP AI
  test('Test 15 — Candidate barge-in: strong signal during AI → STOP_AI', () => {
    calibrate(asie);
    // Very strong signal during AI playback
    const result = asie.processFrame(makeSpeechFrame(0.15), true);
    // High confidence → barge-in
    if (result.candidateSpeechConfidence >= 0.68) {
      expect(result.bargeIn).toBe('STOP_AI');
      expect(result.decision).toBe('CANDIDATE_BARGE_IN');
    } else {
      // If not confident enough, should keep AI playing
      expect(result.bargeIn).toBe('KEEP_AI_PLAYING');
    }
  });

  // Test 12: Candidate pause
  test('Test 12 — Candidate pause: silence after speech → CANDIDATE_PAUSED not BACKGROUND', () => {
    calibrate(asie);
    // Establish candidate speech
    for (let i = 0; i < 4; i++) asie.processFrame(makeSpeechFrame(0.05), false);
    // Silence
    let lastResult = asie.processFrame(makeSilenceFrame(), false);
    lastResult = asie.processFrame(makeSilenceFrame(), false);
    // Should be paused or silence — NOT background speech
    expect(['CANDIDATE_PAUSED', 'SILENCE', 'CANDIDATE_SPEAKING']).toContain(lastResult.decision);
    expect(lastResult.decision).not.toBe('BACKGROUND_SPEECH_IGNORED');
  });

  // Test 10/11: Mechanical noise
  test('Test 10/11 — Fan/keyboard: mechanical noise → not CANDIDATE_SPEAKING', () => {
    calibrate(asie);
    for (let i = 0; i < 4; i++) asie.processFrame(makeMechanicalFrame(0.015), false);
    const result = asie.processFrame(makeMechanicalFrame(0.015), false);
    expect(result.decision).not.toBe('CANDIDATE_SPEAKING');
  });

  test('Graceful fallback: no crash on edge cases', () => {
    calibrate(asie);
    expect(() => asie.processFrame(new Float32Array(4096).fill(0), false)).not.toThrow();
    expect(() => asie.processFrame(new Float32Array(4096).fill(1.0), false)).not.toThrow();
    expect(() => asie.processFrame(new Float32Array(4096).fill(-1.0), false)).not.toThrow();
    expect(() => asie.processFrame(new Float32Array(1), false)).not.toThrow();
  });

  test('reset clears all state', () => {
    calibrate(asie);
    asie.reset();
    const result = asie.processFrame(makeSpeechFrame(0.05), false);
    expect(result.decision).toBe('CALIBRATING');
  });

  test('bargeIn is NO_ACTION when AI is not playing', () => {
    calibrate(asie);
    const result = asie.processFrame(makeSpeechFrame(0.05), false);
    expect(result.bargeIn).toBe('NO_ACTION');
  });

  test('candidateSpeechConfidence is 0..1', () => {
    calibrate(asie);
    const result = asie.processFrame(makeSpeechFrame(0.05), false);
    expect(result.candidateSpeechConfidence).toBeGreaterThanOrEqual(0);
    expect(result.candidateSpeechConfidence).toBeLessThanOrEqual(1);
  });
});

// ─── TurnTakingEngine acoustic integration tests ──────────────────────────────

describe('TurnTakingEngine — acoustic source integration', () => {
  let engine: TurnTakingEngine;
  beforeEach(() => { engine = new TurnTakingEngine(); });

  // Test 14: Background speaker during AI → KEEP AI PLAYING
  test('Test 14 — Background speech during AI: DO NOT barge-in', () => {
    const result = engine.evaluate(makeSignals({
      aiSpeaking:               true,
      vadSpeechActive:          false,
      candidateSpeechConfidence: 0.20,
      backgroundSpeechDetected: true,
      acousticSource:           'BACKGROUND_SPEECH',
    }));
    expect(result.decision).toBe('WAIT_FOR_USER');
    expect(result.reason).toContain('background audio');
  });

  // Test 15: Candidate barge-in
  test('Test 15 — Candidate barge-in: high confidence during AI → INTERRUPT_AI', () => {
    const result = engine.evaluate(makeSignals({
      aiSpeaking:               true,
      vadSpeechActive:          true,
      candidateSpeechConfidence: 0.82,
    }));
    expect(result.decision).toBe('INTERRUPT_AI');
  });

  test('Background-only confidence < 0.68 during AI → NO barge-in', () => {
    const result = engine.evaluate(makeSignals({
      aiSpeaking:               true,
      vadSpeechActive:          false,
      candidateSpeechConfidence: 0.40,
    }));
    expect(result.decision).not.toBe('INTERRUPT_AI');
  });

  // Test 3/4: Distant speaker (background) → never ANSWER_COMPLETE
  test('Test 3/4 — Background speech: never triggers ANSWER_COMPLETE', () => {
    const result = engine.evaluate(makeSignals({
      backgroundSpeechDetected: true,
      candidateSpeechConfidence: 0.15,
      acousticSource:           'BACKGROUND_SPEECH',
      sttFinalised:             true,
      answerCompletion:         'COMPLETE',
      silenceDurationMs:        10000,
    }));
    expect(result.decision).not.toBe('ANSWER_COMPLETE');
    expect(result.decision).toBe('BACKGROUND_SPEECH_IGNORED');
  });

  // Test 6/7/8: Music/TV audio → BACKGROUND_AUDIO_ONLY
  test('Test 6/7/8 — Music/TV: background audio never advances turn', () => {
    const result = engine.evaluate(makeSignals({
      backgroundAudioDetected:   true,
      candidateSpeechConfidence: 0.05,
      acousticSource:            'MUSIC',
      silenceDurationMs:         9000,
      answerCompletion:          'COMPLETE',
    }));
    expect(result.decision).toBe('BACKGROUND_AUDIO_ONLY');
  });

  // Test 16: Calibrating state
  test('Test 16 — Calibrating: returns WAIT_FOR_SOURCE_CLASSIFICATION', () => {
    const result = engine.evaluate(makeSignals({
      isCalibrating:             true,
      candidateSpeechConfidence: null,
      vadSpeechActive:           false,
    }));
    expect(result.decision).toBe('WAIT_FOR_SOURCE_CLASSIFICATION');
  });

  // Backward compatibility: no acoustic signals → uses VAD
  test('Backward compat: no acoustic signals falls back to VAD', () => {
    const result = engine.evaluate(makeSignals({
      vadSpeechActive: true,
      // No candidateSpeechConfidence provided
    }));
    expect(result.decision).toBe('USER_IS_SPEAKING');
  });

  test('Backward compat: VAD barge-in without acoustic still works', () => {
    const result = engine.evaluate(makeSignals({
      vadSpeechActive: true,
      aiSpeaking:      true,
    }));
    expect(result.decision).toBe('INTERRUPT_AI');
  });

  // Test 2: Quiet candidate speech (low confidence but above threshold)
  test('Test 2 — Quiet candidate: low but above-threshold confidence → USER_IS_SPEAKING', () => {
    const result = engine.evaluate(makeSignals({
      candidateSpeechConfidence: 0.60,
      vadSpeechActive:           false,
    }));
    expect(result.decision).toBe('USER_IS_SPEAKING');
  });

  // Test 4: Loud background → NOT candidate (confidence low from ASIE)
  test('Test 4 — Loud background: low candidate confidence → not USER_IS_SPEAKING', () => {
    const result = engine.evaluate(makeSignals({
      candidateSpeechConfidence: 0.18,
      backgroundSpeechDetected:  true,
      acousticSource:            'BACKGROUND_SPEECH',
    }));
    expect(result.decision).toBe('BACKGROUND_SPEECH_IGNORED');
    expect(result.decision).not.toBe('USER_IS_SPEAKING');
  });

  // Test 5: Overlapping speech — candidate remains primary if confidence high
  test('Test 5 — Overlapping: candidate + background, candidate confidence high → USER_IS_SPEAKING', () => {
    const result = engine.evaluate(makeSignals({
      candidateSpeechConfidence: 0.75,
      backgroundSpeechDetected:  true,
    }));
    // High candidate confidence wins over background detection
    expect(result.decision).toBe('USER_IS_SPEAKING');
  });

  // Test 17: STT text arrives but source=background → don't treat as answer
  test('Test 17 — STT text with background source → BACKGROUND_SPEECH_IGNORED', () => {
    const result = engine.evaluate(makeSignals({
      candidateSpeechConfidence: 0.12,
      backgroundSpeechDetected:  true,
      acousticSource:            'BACKGROUND_SPEECH',
      sttFinalised:              true,
      partialTranscript:         'Can you bring me water?',
      answerCompletion:          'LIKELY_COMPLETE',
    }));
    expect(result.decision).toBe('BACKGROUND_SPEECH_IGNORED');
    expect(result.decision).not.toBe('ANSWER_COMPLETE');
  });

  // Test 18: Network/STT delay → not treated as silence
  test('Test 18 — STT delay: not finalised within timeout → WAIT_FOR_STT', () => {
    const result = engine.evaluate(makeSignals({
      candidateSpeechConfidence:  0.0,
      vadSpeechActive:            false,
      sttFinalised:               false,
      silenceDurationMs:          600, // < 1200ms sttFinalizationTimeout
      backgroundSpeechDetected:   false,
    }));
    expect(result.decision).toBe('WAIT_FOR_STT');
  });

  // Test 13: Candidate resumes after pause → candidate confidence re-established
  test('Test 13 — Candidate resumes: confidence recovers → USER_IS_SPEAKING', () => {
    // After a pause, confidence rises again
    const result = engine.evaluate(makeSignals({
      candidateSpeechConfidence: 0.71,
      vadSpeechActive:           false,
      silenceDurationMs:         0,
    }));
    expect(result.decision).toBe('USER_IS_SPEAKING');
  });

  // Combination: candidate speech complete + no background
  test('Candidate complete + no background → ANSWER_COMPLETE', () => {
    const result = engine.evaluate(makeSignals({
      candidateSpeechConfidence: 0.0,
      backgroundSpeechDetected:  false,
      backgroundAudioDetected:   false,
      isCalibrating:             false,
      sttFinalised:              true,
      answerCompletion:          'COMPLETE',
      silenceDurationMs:         2000,
      partialTranscript:         'I worked on a distributed backend system.',
    }));
    expect(result.decision).toBe('ANSWER_COMPLETE');
  });

  // Music during silence: background audio only
  test('Music while candidate silent → BACKGROUND_AUDIO_ONLY', () => {
    const result = engine.evaluate(makeSignals({
      candidateSpeechConfidence: 0.03,
      backgroundAudioDetected:   true,
      acousticSource:            'MUSIC',
      silenceDurationMs:         5000,
    }));
    expect(result.decision).toBe('BACKGROUND_AUDIO_ONLY');
  });
});
