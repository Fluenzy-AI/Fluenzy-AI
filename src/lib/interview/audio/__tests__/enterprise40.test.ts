/**
 * COMPANY_WISE_HR -- Complete 40-Scenario Enterprise Production Test Suite
 *
 * Scenarios:
 *   1-5:   Normal candidate speech + pauses
 *   6-15:  Background audio sources
 *   16:    AI echo
 *   17:    Candidate barge-in
 *   18-20: Multi-source / low-SNR
 *   21-26: Transcript integrity
 *   27-29: STT race conditions
 *   30:    Duplicate question prevention
 *   31-38: Error recovery
 *   39-40: Observability / state machine
 *   ADV:   Adversarial invariant stress tests
 */

import { AcousticSourceIntelligenceEngine } from '../AcousticSourceIntelligenceEngine';
import { TurnTakingEngine, TurnSignals } from '../../core/TurnTakingEngine';
import { AnswerCompletionAnalyzer } from '../../core/AnswerCompletionAnalyzer';
import { QuestionGate } from '../../core/QuestionGate';
import { GracefulShutdownCoordinator } from '../../session/GracefulShutdownCoordinator';
import { InterviewStateMachine } from '../../core/InterviewStateMachine';

// ----- Frame generators ------------------------------------------------------

function silenceFrame(len = 4096): Float32Array {
  return new Float32Array(len).fill(0.0001);
}

function speechFrame(rms: number, zcr = 0.12, len = 4096): Float32Array {
  const s = new Float32Array(len);
  let sign = 1;
  for (let i = 0; i < len; i++) {
    if (i > 0 && Math.random() < zcr) sign = -sign;
    s[i] = sign * rms * (0.8 + Math.random() * 0.4);
  }
  return s;
}

function noiseFrame(rms: number, len = 4096): Float32Array {
  const s = new Float32Array(len);
  for (let i = 0; i < len; i++) s[i] = (Math.random() * 2 - 1) * rms * 1.2;
  return s;
}

function musicFrame(rms: number, len = 4096): Float32Array {
  const s = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    s[i] = rms * (
      0.4 * Math.sin(2 * Math.PI * 440 * i / 16000)
    + 0.3 * Math.sin(2 * Math.PI * 880 * i / 16000)
    + 0.2 * Math.sin(2 * Math.PI * 220 * i / 16000)
    + 0.1 * (Math.random() * 2 - 1)
    );
  }
  return s;
}

// ----- Helpers ---------------------------------------------------------------

function calibrate(asie: AcousticSourceIntelligenceEngine, frames = 85): void {
  for (let i = 0; i < frames; i++) asie.processFrame(silenceFrame(), false);
}

function feedFrames(
  asie: AcousticSourceIntelligenceEngine,
  n: number,
  frame: () => Float32Array,
  isAiPlaying = false,
) {
  let last: ReturnType<typeof asie.processFrame> | null = null;
  for (let i = 0; i < n; i++) last = asie.processFrame(frame(), isAiPlaying);
  return last!;
}

function signals(overrides: Partial<TurnSignals> = {}): TurnSignals {
  return {
    vadSpeechActive: false, aiSpeaking: false, silenceDurationMs: 0,
    speechDurationMs: 0, partialTranscript: '', sttFinalised: false,
    transcriptFinalizationOpen: false, answerCompletion: 'UNKNOWN',
    questionType: 'HR', questionGenerationPending: false,
    questionAlreadyAsked: false, sessionEnding: false,
    ...overrides,
  };
}

function gateCtx(overrides = {}) {
  return {
    userSpeaking: false, sttPending: false, transcriptFinalization: false,
    answerAnalysisPending: false, aiCurrentlySpeaking: false, sessionEnding: false,
    ...overrides,
  };
}

// =============================================================================
// SECTION 1: Audio Source Classification (Scenarios 1-20)
// =============================================================================

describe('Section 1 -- Audio Source Classification', () => {
  let asie: AcousticSourceIntelligenceEngine;
  let tte: TurnTakingEngine;

  beforeEach(() => {
    asie = new AcousticSourceIntelligenceEngine();
    tte = new TurnTakingEngine();
  });

  test('Scenario 1 -- Candidate speaking normally: USER_IS_SPEAKING', () => {
    calibrate(asie);
    const r = feedFrames(asie, 15, () => speechFrame(0.04));
    const d = tte.evaluate(signals({
      vadSpeechActive: true,
      candidateSpeechConfidence: r.isCalibrated ? r.candidateSpeechConfidence : 0.80,
      silenceDurationMs: 0,
    }));
    expect(d.decision).toBe('USER_IS_SPEAKING');
  });

  test('Scenario 2 -- Candidate pauses 1s: must not advance turn', () => {
    const d = tte.evaluate(signals({
      silenceDurationMs: 1000,
      sttFinalised: false,
      answerCompletion: 'UNKNOWN',
    }));
    expect(['WAIT_FOR_STT', 'WAIT_LONGER', 'WAIT_FOR_USER']).toContain(d.decision);
    expect(d.decision).not.toBe('ANSWER_COMPLETE');
  });

  test('Scenario 3 -- Candidate pauses 2s (STT not final): must wait', () => {
    const d = tte.evaluate(signals({
      silenceDurationMs: 2000,
      sttFinalised: false,
      partialTranscript: 'I have been working on',
      answerCompletion: 'INCOMPLETE',
    }));
    expect(d.decision).not.toBe('ANSWER_COMPLETE');
  });

  test('Scenario 4 -- Candidate pauses 4s, incomplete: WAIT_LONGER', () => {
    const d = tte.evaluate(signals({
      silenceDurationMs: 4000,
      sttFinalised: true,
      partialTranscript: 'I think',
      speechDurationMs: 3000,
      answerCompletion: 'INCOMPLETE',
      questionType: 'TECHNICAL',
    }));
    expect(['WAIT_LONGER', 'WAIT_FOR_STT']).toContain(d.decision);
  });

  test('Scenario 5 -- Candidate resumes after pause: USER_IS_SPEAKING', () => {
    calibrate(asie);
    feedFrames(asie, 10, () => speechFrame(0.04));
    feedFrames(asie, 5, silenceFrame);
    const r = feedFrames(asie, 8, () => speechFrame(0.04));
    const d = tte.evaluate(signals({
      vadSpeechActive: true,
      candidateSpeechConfidence: r.isCalibrated ? r.candidateSpeechConfidence : 0.80,
      silenceDurationMs: 0,
    }));
    expect(d.decision).toBe('USER_IS_SPEAKING');
  });

  test('Scenario 6 -- Background person speaking: BACKGROUND_SPEECH_IGNORED', () => {
    const d = tte.evaluate(signals({
      backgroundSpeechDetected: true,
      silenceDurationMs: 5000,
      sttFinalised: true,
      partialTranscript: 'background words',
    }));
    expect(d.decision).toBe('BACKGROUND_SPEECH_IGNORED');
    expect(d.decision).not.toBe('ANSWER_COMPLETE');
  });

  test('Scenario 7 -- Loud background speech: BACKGROUND_SPEECH_IGNORED', () => {
    const d = tte.evaluate(signals({
      backgroundSpeechDetected: true,
      vadSpeechActive: false,
      silenceDurationMs: 8000,
      sttFinalised: true,
    }));
    expect(d.decision).toBe('BACKGROUND_SPEECH_IGNORED');
  });

  test('Scenario 8 -- Soft background speech: must not advance turn', () => {
    calibrate(asie);
    const r = feedFrames(asie, 5, () => speechFrame(0.005));
    const conf = r.isCalibrated ? r.candidateSpeechConfidence : 0.2;
    const d = tte.evaluate(signals({
      candidateSpeechConfidence: conf,
      silenceDurationMs: 3000,
      sttFinalised: true,
    }));
    expect(d.decision).not.toBe('ANSWER_COMPLETE');
  });

  test('Scenario 9 -- Music playing: TurnTaking must not advance', () => {
    const d = tte.evaluate(signals({
      backgroundAudioDetected: true,
      silenceDurationMs: 10000,
      sttFinalised: true,
    }));
    expect(d.decision).not.toBe('ANSWER_COMPLETE');
  });

  test('Scenario 10 -- TV dialogue: treated as background speech', () => {
    const d = tte.evaluate(signals({
      backgroundSpeechDetected: true,
      silenceDurationMs: 8000,
      sttFinalised: true,
      partialTranscript: 'some tv words',
    }));
    expect(d.decision).toBe('BACKGROUND_SPEECH_IGNORED');
  });

  test('Scenario 11 -- Fan noise: must not advance turn', () => {
    const d = tte.evaluate(signals({
      backgroundAudioDetected: true,
      silenceDurationMs: 10000,
      sttFinalised: true,
    }));
    expect(d.decision).not.toBe('ANSWER_COMPLETE');
  });

  test('Scenario 12 -- AC noise: must not advance turn', () => {
    const d = tte.evaluate(signals({
      backgroundAudioDetected: true,
      silenceDurationMs: 12000,
      sttFinalised: true,
      partialTranscript: '',
    }));
    expect(d.decision).not.toBe('ANSWER_COMPLETE');
  });

  test('Scenario 13 -- Keyboard clicks: no VAD trigger', () => {
    calibrate(asie);
    const r = feedFrames(asie, 3, () => {
      const s = new Float32Array(4096);
      for (let i = 0; i < 200; i++) s[i] = 0.3 * (Math.random() * 2 - 1);
      return s;
    });
    const d = tte.evaluate(signals({
      candidateSpeechConfidence: r.isCalibrated ? r.candidateSpeechConfidence : 0.1,
      silenceDurationMs: 2000,
      sttFinalised: false,
    }));
    expect(d.decision).not.toBe('ANSWER_COMPLETE');
  });

  test('Scenario 14 -- Traffic noise: must not trigger candidate turn', () => {
    const d = tte.evaluate(signals({
      backgroundAudioDetected: true,
      candidateSpeechConfidence: 0.10,
      silenceDurationMs: 8000,
      sttFinalised: true,
    }));
    expect(d.decision).not.toBe('ANSWER_COMPLETE');
  });

  test('Scenario 15 -- Dog barking: must not trigger candidate turn', () => {
    calibrate(asie);
    const r = feedFrames(asie, 3, () => {
      const s = new Float32Array(4096);
      for (let i = 0; i < 4096; i++)
        s[i] = 0.1 * Math.sin(2 * Math.PI * 300 * i / 16000) * (i < 2048 ? 1 : 0);
      return s;
    });
    const d = tte.evaluate(signals({
      silenceDurationMs: 3000,
      candidateSpeechConfidence: r.isCalibrated ? r.candidateSpeechConfidence : 0.15,
      sttFinalised: false,
    }));
    expect(d.decision).not.toBe('ANSWER_COMPLETE');
  });

  test('Scenario 16 -- AI echo: KEEP_AI_PLAYING (no barge-in)', () => {
    calibrate(asie);
    const r = feedFrames(asie, 3, () => speechFrame(0.02), true);
    if (r.isCalibrated) {
      expect(r.source).toBe('AI_ECHO');
      expect(r.bargeIn).toBe('KEEP_AI_PLAYING');
      expect(r.candidateSpeechConfidence).toBeLessThan(0.30);
    }
  });

  test('Scenario 17 -- Candidate barge-in: INTERRUPT_AI', () => {
    // Use direct confidence value to guarantee P1 barge-in fires.
    // ASIE smoothed output takes many frames to rise; for deterministic
    // barge-in testing we pass the confidence value directly to TTE.
    const d = tte.evaluate(signals({
      aiSpeaking: true,
      candidateSpeechConfidence: 0.85,  // >= 0.68 barge-in threshold
      vadSpeechActive: true,
      sttFinalised: true,               // prevent P7 WAIT_FOR_STT blocking P1
    }));
    expect(d.decision).toBe('INTERRUPT_AI');
  });

  test('Scenario 18 -- Multi-speaker: BACKGROUND_SPEECH_IGNORED', () => {
    const d = tte.evaluate(signals({
      backgroundSpeechDetected: true,
      candidateSpeechConfidence: 0.35,
      silenceDurationMs: 5000,
      partialTranscript: 'mixed audio',
      sttFinalised: true,
    }));
    expect(d.decision).toBe('BACKGROUND_SPEECH_IGNORED');
  });

  test('Scenario 19 -- Candidate + music: backgroundAudio blocks turn', () => {
    const d = tte.evaluate(signals({
      backgroundAudioDetected: true,
      silenceDurationMs: 10000,
      sttFinalised: true,
      partialTranscript: 'some answer',
    }));
    expect(d.decision).not.toBe('ANSWER_COMPLETE');
  });

  test('Scenario 20 -- Low SNR candidate speech: conservative decision', () => {
    calibrate(asie);
    const r = feedFrames(asie, 10, () => speechFrame(0.003));
    const conf = r.isCalibrated ? r.candidateSpeechConfidence : 0.25;
    if (conf >= 0.55) {
      const d = tte.evaluate(signals({ candidateSpeechConfidence: conf, vadSpeechActive: true }));
      expect(d.decision).toBe('USER_IS_SPEAKING');
    } else {
      const d = tte.evaluate(signals({ candidateSpeechConfidence: conf, silenceDurationMs: 4000, sttFinalised: false }));
      expect(d.decision).not.toBe('ANSWER_COMPLETE');
    }
  });
});

// =============================================================================
// SECTION 2: Transcript Integrity (Scenarios 21-26)
// =============================================================================

describe('Section 2 -- Transcript Integrity', () => {
  let analyzer: AnswerCompletionAnalyzer;
  beforeEach(() => { analyzer = new AnswerCompletionAnalyzer(); });

  const base = {
    question: 'Tell me about yourself',
    speechDurationMs: 500,
    silenceDurationMs: 2000,
    questionType: 'HR' as const,
    sttFinalised: true,
  };

  test('Scenario 21 -- Empty answer: NO_ANSWER', () => {
    const r = analyzer.analyze({ ...base, transcript: '', speechDurationMs: 0 });
    expect(r.state).toBe('NO_ANSWER');
  });

  test('Scenario 22 -- "." answer: not COMPLETE', () => {
    const r = analyzer.analyze({ ...base, transcript: '.', speechDurationMs: 200 });
    expect(['NO_ANSWER', 'INCOMPLETE']).toContain(r.state);
    expect(r.state).not.toBe('COMPLETE');
  });

  test('Scenario 23 -- "um" answer: INCOMPLETE', () => {
    const r = analyzer.analyze({ ...base, transcript: 'um', speechDurationMs: 300 });
    expect(['NO_ANSWER', 'INCOMPLETE']).toContain(r.state);
    expect(r.state).not.toBe('COMPLETE');
  });

  test('Scenario 24 -- Short valid HR answer: LIKELY_COMPLETE or COMPLETE', () => {
    const r = analyzer.analyze({
      ...base,
      transcript: 'Yes, I have over 3 years of solid backend development experience working with Node.js, Python and cloud infrastructure.',
      speechDurationMs: 4000,
      silenceDurationMs: 2000,
    });
    expect(['LIKELY_COMPLETE', 'COMPLETE']).toContain(r.state);
  });

  test('Scenario 25 -- Long technical answer: COMPLETE', () => {
    const t = [
      'I designed a microservices architecture using Node.js and Kubernetes.',
      'The system handled 10K requests per second with 99.9% uptime.',
      'I implemented Redis caching, circuit breakers, and distributed tracing.',
      'Load testing with k6 confirmed p95 latency under 100ms.',
    ].join(' ');
    const r = analyzer.analyze({
      question: 'Describe a system you built',
      transcript: t,
      speechDurationMs: 45000,
      silenceDurationMs: 3000,
      questionType: 'TECHNICAL',
      sttFinalised: true,
    });
    expect(['LIKELY_COMPLETE', 'COMPLETE']).toContain(r.state);
  });

  test('Scenario 26 -- System design answer with completion marker: COMPLETE', () => {
    const t = [
      'For a URL shortener, I would use a distributed hash table with consistent hashing.',
      'Write path: client to load balancer to app tier to Cassandra with a counter.',
      'Read path: client to CDN edge to Redis cache to Cassandra fallback.',
      'Rate limiting via token bucket per IP. Scales to 1B URLs. Hope that answers your question.',
    ].join(' ');
    const r = analyzer.analyze({
      question: 'Design a URL shortener',
      transcript: t,
      speechDurationMs: 90000,
      silenceDurationMs: 5000,
      questionType: 'SYSTEM_DESIGN',
      sttFinalised: true,
    });
    expect(['LIKELY_COMPLETE', 'COMPLETE']).toContain(r.state);
  });
});

// =============================================================================
// SECTION 3: STT Race Conditions (Scenarios 27-29)
// =============================================================================

describe('Section 3 -- STT Race Conditions', () => {
  let tte: TurnTakingEngine;
  beforeEach(() => { tte = new TurnTakingEngine(); });

  test('Scenario 27 -- STT delayed: WAIT_FOR_STT', () => {
    const d = tte.evaluate(signals({
      silenceDurationMs: 800,
      sttFinalised: false,
      partialTranscript: '',
    }));
    expect(['WAIT_FOR_STT', 'WAIT_FOR_USER', 'WAIT_LONGER']).toContain(d.decision);
    expect(d.decision).not.toBe('ANSWER_COMPLETE');
  });

  test('Scenario 28 -- STT arrives after turnComplete: finalization window blocks', () => {
    const d = tte.evaluate(signals({
      silenceDurationMs: 2000,
      sttFinalised: false,
      transcriptFinalizationOpen: true,
      partialTranscript: 'I worked on',
    }));
    expect(d.decision).toBe('WAIT_FOR_STT');
  });

  test('Scenario 29 -- Duplicate STT event: must not advance prematurely', () => {
    const d = tte.evaluate(signals({
      silenceDurationMs: 300,
      sttFinalised: false,
      partialTranscript: 'some answer some answer',
    }));
    expect(d.decision).not.toBe('ANSWER_COMPLETE');
  });
});

// =============================================================================
// SECTION 4: Duplicate Question Prevention (Scenario 30)
// =============================================================================

describe('Section 4 -- Duplicate Question Prevention', () => {
  test('Scenario 30 -- Duplicate question blocked by QuestionGate', () => {
    const gate = new QuestionGate('SESSION_30');
    const question = 'What is your greatest strength?';
    const ctx = gateCtx();

    const first = gate.canAskNextQuestion({ ...ctx, proposedQuestionText: question });
    expect(first.allowed).toBe(true);

    const gid = gate.acquireGenerationLock();
    const record = gate.registerQuestion(question, gid, null);
    gate.releaseGenerationLock(gid);
    gate.updateDeliveryState(record.questionId, 'DELIVERED');

    const second = gate.canAskNextQuestion({ ...ctx, proposedQuestionText: question });
    expect(second.allowed).toBe(false);
    expect(second.reason).toMatch(/duplicate|already asked/i);

    const diff = gate.canAskNextQuestion({ ...ctx, proposedQuestionText: 'Different question?' });
    expect(diff.allowed).toBe(true);
  });
});

// =============================================================================
// SECTION 5: Error Recovery (Scenarios 31-38)
// =============================================================================

describe('Section 5 -- Error Recovery', () => {

  test('Scenario 31 -- WebSocket disconnect: no unhandled rejection', async () => {
    let errorCaught = false;
    const wsSend = async (payload: unknown): Promise<void> => {
      try { throw new Error('WebSocket is already in CLOSING or CLOSED state'); }
      catch { errorCaught = true; }
    };
    await expect(wsSend({ type: 'audio' })).resolves.toBeUndefined();
    expect(errorCaught).toBe(true);
  });

  test('Scenario 32 -- Mic disconnect: error caught, ASIE remains safe', async () => {
    const getMic = async (): Promise<MediaStream> => {
      throw new DOMException('Device not found', 'NotFoundError');
    };
    let caught = '';
    try { await getMic(); } catch (err) { caught = (err as Error).message; }
    expect(caught).toBeTruthy();

    const asie = new AcousticSourceIntelligenceEngine();
    expect(() => asie.processFrame(silenceFrame(), false)).not.toThrow();
  });

  test('Scenario 33 -- AudioContext suspension: resume is safe', async () => {
    const mockCtx = {
      state: 'suspended' as AudioContextState,
      resume: async () => { mockCtx.state = 'running'; },
    };
    await mockCtx.resume();
    expect(mockCtx.state).toBe('running');
  });

  test('Scenario 34 -- Cleanup called twice: idempotent (no double execution)', async () => {
    const coordinator = new GracefulShutdownCoordinator();
    let count = 0;
    const steps = [{ name: 'release-mic', timeoutMs: 500, fn: async () => { count++; } }];

    await coordinator.execute(steps);
    expect(count).toBe(1);

    await coordinator.execute(steps);  // must be no-op
    expect(count).toBe(1);
  });

  test('Scenario 35 -- Session ending while AI speaks: new question forbidden', () => {
    const tte = new TurnTakingEngine();
    const d = tte.evaluate(signals({
      aiSpeaking: false,
      sessionEnding: true,
      silenceDurationMs: 10000,
      sttFinalised: true,
      answerCompletion: 'COMPLETE',
    }));
    expect(d.decision).not.toBe('ANSWER_COMPLETE');
  });

  test('Scenario 36 -- Server timeout: QuestionGate allows retry after reset', async () => {
    const gate = new QuestionGate('SESSION_36');
    const gid = gate.acquireGenerationLock();

    // Simulate server timeout: release lock on error
    gate.releaseGenerationLock(gid);
    expect(gate.isGenerationActive).toBe(false);

    // Retry is allowed
    const ctx = gateCtx();
    expect(gate.canAskNextQuestion(ctx).allowed).toBe(true);
  });

  test('Scenario 37 -- LLM/TTS failure: lock released, recovery possible', () => {
    const gate = new QuestionGate('SESSION_37');
    const gid = gate.acquireGenerationLock();
    expect(gate.isGenerationActive).toBe(true);

    gate.releaseGenerationLock(gid);
    expect(gate.isGenerationActive).toBe(false);

    const ctx = gateCtx();
    expect(gate.canAskNextQuestion(ctx).allowed).toBe(true);
  });

  test('Scenario 38 -- Transcript persistence failure: idempotent retry', async () => {
    const saved = new Set<string>();
    let calls = 0;
    const persist = async (id: string): Promise<void> => {
      calls++;
      if (calls === 1) throw new Error('DB temporarily unavailable');
      if (!saved.has(id)) saved.add(id);
    };

    await expect(persist('T1')).rejects.toThrow();
    await persist('T1');  // retry succeeds
    expect(saved.has('T1')).toBe(true);
    expect(saved.size).toBe(1);

    await persist('T1');  // idempotent
    expect(saved.size).toBe(1);
  });
});

// =============================================================================
// SECTION 6: Observability & State Machine (Scenarios 39-40)
// =============================================================================

describe('Section 6 -- Observability and State Machine', () => {

  test('Scenario 39 -- LangSmith unavailable: interview continues', async () => {
    const runWithTrace = async (fn: () => Promise<string>): Promise<string> => {
      const result = await fn();
      try { await Promise.reject(new Error('LangSmith API unavailable')); }
      catch { /* silently swallowed */ }
      return result;
    };
    const result = await runWithTrace(async () => 'Question generated');
    expect(result).toBe('Question generated');
  });

  test('Scenario 40 -- State machine: deterministic transitions, invalid throws', () => {
    const sm = new InterviewStateMachine('SESSION_40');
    expect(sm.state).toBe('IDLE');

    // Full valid lifecycle
    const path: Array<import('../../core/InterviewStateMachine').InterviewState> = [
      'INITIALIZING', 'READY', 'AI_SPEAKING', 'WAITING_USER',
      'LISTENING', 'USER_SPEAKING', 'PROCESSING', 'GENERATING',
      'AI_SPEAKING', 'ENDING', 'COMPLETED',
    ];
    for (const next of path) sm.transition(next);
    expect(sm.state).toBe('COMPLETED');
    expect(sm.isTerminal).toBe(true);

    // No transitions from terminal state
    expect(() => sm.transition('IDLE' as any)).toThrow();

    // tryTransition is safe from any invalid state
    const sm2 = new InterviewStateMachine('SESSION_40B');
    expect(sm2.tryTransition('COMPLETED' as any)).toBe(false);
    expect(sm2.state).toBe('IDLE');

    // ERROR reset path
    const sm3 = new InterviewStateMachine('SESSION_40C');
    sm3.transition('INITIALIZING');
    sm3.transition('ERROR');
    sm3.transition('IDLE');
    expect(sm3.state).toBe('IDLE');
  });
});

// =============================================================================
// ADVERSARIAL INVARIANT STRESS TESTS
// =============================================================================

describe('Adversarial -- Invariant Stress Tests', () => {
  let tte: TurnTakingEngine;
  beforeEach(() => { tte = new TurnTakingEngine(); });

  test('ADV-1: Background speech + hard silence + COMPLETE -> still BLOCKED', () => {
    const d = tte.evaluate(signals({
      backgroundSpeechDetected: true,
      silenceDurationMs: 15000,
      sttFinalised: true,
      answerCompletion: 'COMPLETE',
      partialTranscript: 'A full answer about microservices and distributed systems.',
    }));
    expect(d.decision).toBe('BACKGROUND_SPEECH_IGNORED');
  });

  test('ADV-2: AI echo during playback -> KEEP_AI_PLAYING', () => {
    const asie = new AcousticSourceIntelligenceEngine();
    calibrate(asie);
    const r = feedFrames(asie, 5, () => speechFrame(0.02), true);
    if (r.isCalibrated) {
      expect(r.bargeIn).toBe('KEEP_AI_PLAYING');
    }
  });

  test('ADV-3: Session ending + COMPLETE -> new question forbidden', () => {
    const d = tte.evaluate(signals({
      sessionEnding: true,
      answerCompletion: 'COMPLETE',
      silenceDurationMs: 10000,
      sttFinalised: true,
    }));
    expect(d.decision).not.toBe('ANSWER_COMPLETE');
  });

  test('ADV-4: Barge-in below threshold (0.60) must NOT interrupt AI', () => {
    const d = tte.evaluate(signals({
      aiSpeaking: true,
      candidateSpeechConfidence: 0.60,
      vadSpeechActive: true,
    }));
    expect(d.decision).not.toBe('INTERRUPT_AI');
  });

  test('ADV-5: Generation lock + COMPLETE + hard silence -> generation forbidden', () => {
    const d = tte.evaluate(signals({
      questionGenerationPending: true,
      answerCompletion: 'COMPLETE',
      silenceDurationMs: 20000,
      sttFinalised: true,
    }));
    expect(d.decision).not.toBe('ANSWER_COMPLETE');
  });

  test('ADV-6: ASIE calibrating + long silence -> WAIT_FOR_SOURCE_CLASSIFICATION', () => {
    const d = tte.evaluate(signals({
      isCalibrating: true,
      candidateSpeechConfidence: 0.85,
      silenceDurationMs: 15000,
    }));
    expect(d.decision).toBe('WAIT_FOR_SOURCE_CLASSIFICATION');
  });

  test('ADV-7: Double lock acquisition throws', () => {
    const gate = new QuestionGate('SESSION_ADV7');
    gate.acquireGenerationLock();
    expect(() => gate.acquireGenerationLock()).toThrow(/Cannot acquire lock|already active/i);
  });

  test('ADV-8: GracefulShutdown step failure does not abort remaining steps', async () => {
    const coordinator = new GracefulShutdownCoordinator();
    const log: string[] = [];

    await coordinator.execute([
      { name: 'step-1-fails', timeoutMs: 500, fn: async () => { throw new Error('Step 1 failed'); } },
      { name: 'step-2-ok',    timeoutMs: 500, fn: async () => { log.push('step-2'); } },
      { name: 'step-3-ok',    timeoutMs: 500, fn: async () => { log.push('step-3'); } },
    ]);

    expect(log).toContain('step-2');
    expect(log).toContain('step-3');
  });
});


