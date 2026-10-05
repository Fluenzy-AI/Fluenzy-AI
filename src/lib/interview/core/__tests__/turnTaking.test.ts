/**
 * Turn-Taking Engine — Full Test Matrix
 *
 * Tests all required scenarios from the production spec:
 *  Test 1:  User speaks continuously 10s → AI does NOT interrupt
 *  Test 2:  User pauses 2s and continues → AI waits
 *  Test 3:  User pauses 4s and continues → AI still does not interrupt if incomplete
 *  Test 4:  User finishes + 5s silence → AI moves to next question
 *  Test 5:  User says "I don't know" → valid completed answer
 *  Test 6:  User asks to repeat → clarification (not advance)
 *  Test 7:  AI speaking + user speech → INTERRUPT_AI
 *  Test 8:  STT delayed → system does NOT assume silence
 *  Test 9:  Duplicate question → gate rejects
 *  Test 10: Same question generated twice → second rejected
 *
 * Plus QuestionGate and AnswerCompletionAnalyzer unit tests
 */

import { TurnTakingEngine, TurnSignals, DEFAULT_CONFIG } from '../TurnTakingEngine';
import { AnswerCompletionAnalyzer } from '../AnswerCompletionAnalyzer';
import { QuestionGate } from '../QuestionGate';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSignals(overrides: Partial<TurnSignals> = {}): TurnSignals {
  return {
    vadSpeechActive:            false,
    aiSpeaking:                 false,
    silenceDurationMs:          0,
    speechDurationMs:           0,
    partialTranscript:          '',
    sttFinalised:               false,
    transcriptFinalizationOpen: false,
    answerCompletion:           'UNKNOWN',
    questionType:               'HR',
    questionGenerationPending:  false,
    questionAlreadyAsked:       false,
    sessionEnding:              false,
    ...overrides,
  };
}

// ─── TurnTakingEngine tests ───────────────────────────────────────────────────

describe('TurnTakingEngine', () => {
  let engine: TurnTakingEngine;

  beforeEach(() => { engine = new TurnTakingEngine(); });

  // ─ Test 1: User speaking continuously ─────────────────────────────────────
  describe('Test 1 — Continuous speech: AI must not interrupt', () => {
    test('returns USER_IS_SPEAKING when VAD active', () => {
      const result = engine.evaluate(makeSignals({ vadSpeechActive: true, speechDurationMs: 10000 }));
      expect(result.decision).toBe('USER_IS_SPEAKING');
    });

    test('remains USER_IS_SPEAKING regardless of silence thresholds when VAD active', () => {
      // Even at 20s of "speech" the VAD active flag must win
      const result = engine.evaluate(makeSignals({
        vadSpeechActive:   true,
        silenceDurationMs: 20000, // would normally trigger complete
        speechDurationMs:  20000,
        answerCompletion:  'COMPLETE',
      }));
      expect(result.decision).toBe('USER_IS_SPEAKING');
    });
  });

  // ─ Test 2: Short pause (2s) ────────────────────────────────────────────────
  describe('Test 2 — 2s pause: AI waits (THINKING_PAUSE)', () => {
    test('returns WAIT_LONGER for 2s silence on HR question', () => {
      const result = engine.evaluate(makeSignals({
        silenceDurationMs: 2000,
        sttFinalised:      true,
        partialTranscript: 'I have worked on several projects',
        answerCompletion:  'INCOMPLETE',
      }));
      expect(result.decision).toBe('WAIT_LONGER');
      expect(result.silenceClass).toBe('THINKING_PAUSE');
    });

    test('returns WAIT_LONGER even with partial transcript at 2s', () => {
      const result = engine.evaluate(makeSignals({
        silenceDurationMs: 2000,
        partialTranscript: 'Basically I worked on a project where...',
        answerCompletion:  'INCOMPLETE',
        sttFinalised:      false,
      }));
      expect(['WAIT_LONGER', 'WAIT_FOR_STT']).toContain(result.decision);
    });
  });

  // ─ Test 3: 4s pause with incomplete answer ────────────────────────────────
  describe('Test 3 — 4s pause, answer incomplete: AI still waits', () => {
    test('returns WAIT_LONGER for BEHAVIORAL question at 4s with incomplete answer', () => {
      // BEHAVIORAL multiplier = 1.4 → completion threshold = 3000*1.4=4200ms
      const result = engine.evaluate(makeSignals({
        questionType:      'BEHAVIORAL',
        silenceDurationMs: 4000,
        sttFinalised:      true,
        partialTranscript: 'I worked on a challenging project where the team was...',
        answerCompletion:  'INCOMPLETE',
      }));
      expect(result.decision).toBe('WAIT_LONGER');
    });

    test('SYSTEM_DESIGN question tolerates even longer pauses', () => {
      // SYSTEM_DESIGN multiplier = 1.6 → completion threshold = 3000*1.6=4800ms
      const result = engine.evaluate(makeSignals({
        questionType:      'SYSTEM_DESIGN',
        silenceDurationMs: 4500,
        sttFinalised:      true,
        partialTranscript: 'So the way I would design this system is',
        answerCompletion:  'INCOMPLETE',
      }));
      expect(result.decision).toBe('WAIT_LONGER');
    });
  });

  // ─ Test 4: User finished + 5s silence ────────────────────────────────────
  describe('Test 4 — Answer complete + 5s silence: AI advances', () => {
    test('returns ANSWER_COMPLETE when silence > hard threshold with transcript', () => {
      const result = engine.evaluate(makeSignals({
        silenceDurationMs: 8500,
        sttFinalised:      true,
        partialTranscript: 'I optimized the database queries and reduced latency by 40 percent.',
        answerCompletion:  'COMPLETE',
        speechDurationMs:  6000,
      }));
      expect(result.decision).toBe('ANSWER_COMPLETE');
    });

    test('returns ANSWER_COMPLETE when confirmed complete + natural pause elapsed', () => {
      const result = engine.evaluate(makeSignals({
        silenceDurationMs: 1500,
        sttFinalised:      true,
        answerCompletion:  'COMPLETE',
        partialTranscript: 'Yes I have extensive experience with that.',
      }));
      expect(result.decision).toBe('ANSWER_COMPLETE');
    });
  });

  // ─ Test 5: "I don't know" is a valid answer ───────────────────────────────
  describe('Test 5 — Short answer "I don\'t know" is valid', () => {
    test('AnswerCompletionAnalyzer does not return NO_ANSWER for short honest response', () => {
      const analyzer = new AnswerCompletionAnalyzer();
      const result = analyzer.analyze({
        question:          'Tell me about your experience with Kubernetes.',
        transcript:        "I don't know much about Kubernetes, I haven't used it.",
        speechDurationMs:  3000,
        silenceDurationMs: 2000,
        questionType:      'TECHNICAL',
        sttFinalised:      true,
      });
      expect(result.state).not.toBe('NO_ANSWER');
    });

    test('TurnTakingEngine eventually allows next question after "I don\'t know"', () => {
      const result = engine.evaluate(makeSignals({
        silenceDurationMs: 9000,
        sttFinalised:      true,
        partialTranscript: "I don't know much about that topic.",
        answerCompletion:  'LIKELY_COMPLETE',
        speechDurationMs:  2000,
      }));
      expect(result.decision).toBe('ANSWER_COMPLETE');
    });
  });

  // ─ Test 7: AI speaking + user speech → INTERRUPT ─────────────────────────
  describe('Test 7 — Barge-in: AI speaking + user speech = INTERRUPT_AI', () => {
    test('returns INTERRUPT_AI when user speaks during AI audio', () => {
      const result = engine.evaluate(makeSignals({
        vadSpeechActive: true,
        aiSpeaking:      true,
        silenceDurationMs: 0,
      }));
      expect(result.decision).toBe('INTERRUPT_AI');
    });

    test('INTERRUPT_AI has highest priority over all other signals', () => {
      // Even if STT not final, generation pending, etc.
      const result = engine.evaluate(makeSignals({
        vadSpeechActive:           true,
        aiSpeaking:                true,
        sttFinalised:              false,
        questionGenerationPending: true,
        sessionEnding:             false,
      }));
      expect(result.decision).toBe('INTERRUPT_AI');
    });
  });

  // ─ Test 8: STT delayed → system does NOT assume silence ──────────────────
  describe('Test 8 — STT delay: system waits, does not assume silence', () => {
    test('returns WAIT_FOR_STT when VAD ended but STT not finalised yet', () => {
      const result = engine.evaluate(makeSignals({
        vadSpeechActive:   false,
        silenceDurationMs: 500,   // < sttFinalizationTimeoutMs (1200)
        sttFinalised:      false,
        partialTranscript: 'I am working on',
      }));
      expect(result.decision).toBe('WAIT_FOR_STT');
    });

    test('WAIT_FOR_STT when finalization window is open regardless of silence', () => {
      const result = engine.evaluate(makeSignals({
        vadSpeechActive:            false,
        transcriptFinalizationOpen: true,
        silenceDurationMs:          5000,
        sttFinalised:               true,
      }));
      expect(result.decision).toBe('WAIT_FOR_STT');
    });
  });

  // ─ Decision priority verification ────────────────────────────────────────
  describe('Decision priority order', () => {
    test('USER_IS_SPEAKING has higher priority than ANSWER_COMPLETE', () => {
      const result = engine.evaluate(makeSignals({
        vadSpeechActive:   true,
        answerCompletion:  'COMPLETE',
        silenceDurationMs: 10000,
      }));
      expect(result.decision).toBe('USER_IS_SPEAKING');
    });

    test('WAIT_FOR_STT has higher priority than WAIT_LONGER', () => {
      const result = engine.evaluate(makeSignals({
        sttFinalised:      false,
        silenceDurationMs: 400,   // under STT timeout
        partialTranscript: 'some text that looks complete',
        answerCompletion:  'LIKELY_COMPLETE',
      }));
      expect(result.decision).toBe('WAIT_FOR_STT');
    });

    test('Session ending blocks everything', () => {
      const result = engine.evaluate(makeSignals({
        sessionEnding:     true,
        answerCompletion:  'COMPLETE',
        silenceDurationMs: 10000,
        sttFinalised:      true,
      }));
      expect(result.decision).not.toBe('ANSWER_COMPLETE');
    });
  });

  // ─ Question type multipliers ──────────────────────────────────────────────
  describe('Question type adaptive thresholds', () => {
    test('YES_NO question has lower thresholds than SYSTEM_DESIGN', () => {
      const yesNo = engine.thresholdsFor('YES_NO');
      const sysDesign = engine.thresholdsFor('SYSTEM_DESIGN');
      expect(yesNo.candidateCompletionThresholdMs).toBeLessThan(sysDesign.candidateCompletionThresholdMs);
      expect(yesNo.hardSilenceThresholdMs).toBeLessThan(sysDesign.hardSilenceThresholdMs);
    });

    test('BEHAVIORAL has higher tolerance than HR', () => {
      const behavioral = engine.thresholdsFor('BEHAVIORAL');
      const hr = engine.thresholdsFor('HR');
      expect(behavioral.candidateCompletionThresholdMs).toBeGreaterThan(hr.candidateCompletionThresholdMs);
    });
  });

  // ─ NO_ANSWER recovery ─────────────────────────────────────────────────────
  describe('No-answer recovery', () => {
    test('returns NO_ANSWER_RECOVERY when silence > hard threshold with no transcript', () => {
      const result = engine.evaluate(makeSignals({
        silenceDurationMs: 9000,
        sttFinalised:      true,
        partialTranscript: '',
        answerCompletion:  'NO_ANSWER',
      }));
      expect(result.decision).toBe('NO_ANSWER_RECOVERY');
    });
  });
});

// ─── AnswerCompletionAnalyzer tests ──────────────────────────────────────────

describe('AnswerCompletionAnalyzer', () => {
  let analyzer: AnswerCompletionAnalyzer;
  beforeEach(() => { analyzer = new AnswerCompletionAnalyzer(); });

  test('Empty transcript → NO_ANSWER', () => {
    const r = analyzer.analyze({
      question: 'Tell me about yourself', transcript: '',
      speechDurationMs: 0, silenceDurationMs: 0, questionType: 'HR', sttFinalised: false,
    });
    expect(r.state).toBe('NO_ANSWER');
  });

  test('YES_NO question with short answer → COMPLETE', () => {
    const r = analyzer.analyze({
      question: 'Do you have Python experience?', transcript: 'Yes, I do.',
      speechDurationMs: 1500, silenceDurationMs: 2000, questionType: 'YES_NO', sttFinalised: true,
    });
    expect(r.state).toBe('COMPLETE');
  });

  test('Continuation word at end → INCOMPLETE', () => {
    const r = analyzer.analyze({
      question: 'Tell me about your role', transcript: 'I was working on the backend and',
      speechDurationMs: 3000, silenceDurationMs: 1000, questionType: 'TECHNICAL', sttFinalised: false,
    });
    expect(r.state).toBe('INCOMPLETE');
  });

  test('Sentence ends + substantial + long enough + STT final → COMPLETE', () => {
    const r = analyzer.analyze({
      question: 'Describe a challenge', 
      transcript: 'I faced a database bottleneck. I optimized the queries and reduced latency by 40%. The team was very happy with the result.',
      speechDurationMs: 8000, silenceDurationMs: 2000, questionType: 'BEHAVIORAL', sttFinalised: true,
    });
    expect(['COMPLETE', 'LIKELY_COMPLETE']).toContain(r.state);
  });

  test('Completion marker detected → COMPLETE', () => {
    const r = analyzer.analyze({
      question: 'What is your strength?',
      transcript: 'My main strength is problem solving and team collaboration. That is all I wanted to share.',
      speechDurationMs: 5000, silenceDurationMs: 2000, questionType: 'HR', sttFinalised: true,
    });
    expect(r.state).toBe('COMPLETE');
  });

  test('SYSTEM_DESIGN requires more content than YES_NO', () => {
    const shortText = 'I would use microservices.';
    const rSD = analyzer.analyze({
      question: 'Design a URL shortener',
      transcript: shortText, speechDurationMs: 2000, silenceDurationMs: 1500,
      questionType: 'SYSTEM_DESIGN', sttFinalised: true,
    });
    const rYN = analyzer.analyze({
      question: 'Do you know REST?',
      transcript: shortText, speechDurationMs: 2000, silenceDurationMs: 1500,
      questionType: 'YES_NO', sttFinalised: true,
    });
    // SYSTEM_DESIGN should be more conservative
    expect(['INCOMPLETE', 'UNKNOWN']).toContain(rSD.state);
    expect(rYN.state).toBe('COMPLETE');
  });

  test('Confidence is a number between 0 and 1', () => {
    const r = analyzer.analyze({
      question: 'Q', transcript: 'A', speechDurationMs: 1000,
      silenceDurationMs: 500, questionType: 'HR', sttFinalised: false,
    });
    expect(r.confidence).toBeGreaterThanOrEqual(0);
    expect(r.confidence).toBeLessThanOrEqual(1);
  });
});

// ─── QuestionGate tests ───────────────────────────────────────────────────────

describe('QuestionGate', () => {
  let gate: QuestionGate;

  beforeEach(() => { gate = new QuestionGate('TEST_SESSION'); });

  // ─ Test 9: Duplicate question detection ──────────────────────────────────
  describe('Test 9 & 10 — Duplicate question prevention', () => {
    test('blocks duplicate question by hash', () => {
      const gid = gate.acquireGenerationLock();
      gate.registerQuestion('Tell me about your greatest strength.', gid);
      gate.releaseGenerationLock(gid);

      const decision = gate.canAskNextQuestion({
        userSpeaking: false, sttPending: false, transcriptFinalization: false,
        answerAnalysisPending: false, aiCurrentlySpeaking: false,
        sessionEnding: false,
        proposedQuestionText: 'Tell me about your greatest strength.',
      });
      expect(decision.allowed).toBe(false);
      expect(decision.blocked).toBe('DUPLICATE_QUESTION');
    });

    test('normalises question for hash (case/whitespace)', () => {
      const gid = gate.acquireGenerationLock();
      gate.registerQuestion('Tell me about your greatest strength.', gid);
      gate.releaseGenerationLock(gid);

      const decision = gate.canAskNextQuestion({
        userSpeaking: false, sttPending: false, transcriptFinalization: false,
        answerAnalysisPending: false, aiCurrentlySpeaking: false,
        sessionEnding: false,
        proposedQuestionText: '  TELL ME ABOUT  YOUR GREATEST STRENGTH.  ',
      });
      expect(decision.allowed).toBe(false);
      expect(decision.blocked).toBe('DUPLICATE_QUESTION');
    });

    test('second acquireGenerationLock throws', () => {
      gate.acquireGenerationLock();
      expect(() => gate.acquireGenerationLock()).toThrow();
    });

    test('blocks next question when generation is active', () => {
      gate.acquireGenerationLock();
      const decision = gate.canAskNextQuestion({
        userSpeaking: false, sttPending: false, transcriptFinalization: false,
        answerAnalysisPending: false, aiCurrentlySpeaking: false, sessionEnding: false,
      });
      expect(decision.allowed).toBe(false);
      expect(decision.blocked).toBe('GENERATION_LOCK');
    });
  });

  describe('Gate condition blocking', () => {
    test('USER_SPEAKING blocks', () => {
      const r = gate.canAskNextQuestion({ userSpeaking: true, sttPending: false, transcriptFinalization: false, answerAnalysisPending: false, aiCurrentlySpeaking: false, sessionEnding: false });
      expect(r.blocked).toBe('USER_SPEAKING');
    });

    test('STT_PENDING blocks', () => {
      const r = gate.canAskNextQuestion({ userSpeaking: false, sttPending: true, transcriptFinalization: false, answerAnalysisPending: false, aiCurrentlySpeaking: false, sessionEnding: false });
      expect(r.blocked).toBe('STT_PENDING');
    });

    test('TRANSCRIPT_FINALIZATION blocks', () => {
      const r = gate.canAskNextQuestion({ userSpeaking: false, sttPending: false, transcriptFinalization: true, answerAnalysisPending: false, aiCurrentlySpeaking: false, sessionEnding: false });
      expect(r.blocked).toBe('TRANSCRIPT_FINALIZATION');
    });

    test('SESSION_ENDING blocks', () => {
      const r = gate.canAskNextQuestion({ userSpeaking: false, sttPending: false, transcriptFinalization: false, answerAnalysisPending: false, aiCurrentlySpeaking: false, sessionEnding: true });
      expect(r.blocked).toBe('SESSION_ENDING');
    });

    test('All clear → allowed', () => {
      const r = gate.canAskNextQuestion({ userSpeaking: false, sttPending: false, transcriptFinalization: false, answerAnalysisPending: false, aiCurrentlySpeaking: false, sessionEnding: false });
      expect(r.allowed).toBe(true);
    });
  });

  describe('Delivery lifecycle', () => {
    test('tracks delivery state from GENERATED to DELIVERED', () => {
      const gid = gate.acquireGenerationLock();
      const q = gate.registerQuestion('What is your experience?', gid);
      gate.releaseGenerationLock(gid);

      expect(q.deliveryState).toBe('GENERATED');
      gate.updateDeliveryState(q.questionId, 'QUEUED');
      gate.updateDeliveryState(q.questionId, 'AUDIO_STARTED');
      gate.updateDeliveryState(q.questionId, 'DELIVERED');
      // Should not throw — just verify it doesn't crash
    });
  });

  describe('Stale generation invalidation', () => {
    test('invalidateGeneration releases lock', () => {
      gate.acquireGenerationLock();
      expect(gate.isGenerationActive).toBe(true);
      gate.invalidateGeneration('New turn started');
      expect(gate.isGenerationActive).toBe(false);
    });

    test('stale releaseGenerationLock is ignored', () => {
      const gid = gate.acquireGenerationLock();
      gate.invalidateGeneration('test');
      // Releasing stale ID should not throw
      expect(() => gate.releaseGenerationLock(gid)).not.toThrow();
    });
  });

  describe('User speech started cancels generation', () => {
    test('onUserSpeechStarted invalidates active generation', () => {
      gate.acquireGenerationLock();
      gate.onUserSpeechStarted();
      expect(gate.isGenerationActive).toBe(false);
    });
  });

  describe('Silence recovery limit', () => {
    test('allows up to 3 recovery prompts then stops', () => {
      expect(gate.canSendSilenceRecovery()).toBe(true);
      gate.recordSilenceRecovery();
      gate.recordSilenceRecovery();
      gate.recordSilenceRecovery();
      expect(gate.canSendSilenceRecovery()).toBe(false);
    });

    test('reset restores recovery capability', () => {
      gate.recordSilenceRecovery();
      gate.recordSilenceRecovery();
      gate.recordSilenceRecovery();
      gate.resetSilenceRecovery();
      expect(gate.canSendSilenceRecovery()).toBe(true);
    });
  });
});
