// ─── FluenzyAI — TurnTakingEngine ────────────────────────────────────────────
// Multi-signal deterministic turn-taking decision engine.
//
// Design:
//   • Pure class — no React, no DOM, no side-effects
//   • Accepts signals from VAD, STT, audio playback
//   • Outputs a typed Decision every time evaluate() is called
//   • Never uses a single timer as the decision engine
//   • All thresholds configurable per question type
//
// Signal priority (highest → lowest):
//   1. User actively speaking (VAD + audio energy)
//   2. STT finalisation pending
//   3. Transcript finalization window open
//   4. Answer completion analysis
//   5. Silence duration
//   6. Next question eligibility

export type QuestionType =
  | 'GREETING'
  | 'YES_NO'
  | 'TECHNICAL'
  | 'BEHAVIORAL'
  | 'PROJECT'
  | 'SYSTEM_DESIGN'
  | 'FOLLOW_UP'
  | 'CLARIFICATION'
  | 'HR'
  | 'UNKNOWN';

export interface TurnTakingConfig {
  /** Ms of VAD silence → mark USER_PAUSED (default 800ms) */
  pauseThresholdMs: number;
  /** Ms of silence after which answer completion analysis fires (default 3000ms) */
  candidateCompletionThresholdMs: number;
  /** Ms of silence → force CONFIRMED_COMPLETE regardless of analysis (default 8000ms) */
  hardSilenceThresholdMs: number;
  /** Ms to wait for STT finalisation after VAD end (default 1200ms) */
  sttFinalizationTimeoutMs: number;
  /** Minimum chars in transcript to be considered "has answered" (default 15) */
  minAnswerLength: number;
  /** Minimum ms the user must have spoken (default 500ms) */
  minSpeechDurationMs: number;
  /** Extra delay (ms) before allowing next question after CONFIRMED_COMPLETE (default 800ms) */
  naturalPauseBeforeNextMs: number;
}

export const DEFAULT_CONFIG: TurnTakingConfig = {
  pauseThresholdMs:               800,
  candidateCompletionThresholdMs: 3000,
  hardSilenceThresholdMs:         8000,
  sttFinalizationTimeoutMs:       1200,
  minAnswerLength:                 15,
  minSpeechDurationMs:             500,
  naturalPauseBeforeNextMs:        800,
};

/** Per-question-type multipliers applied to silence thresholds */
const QUESTION_TYPE_MULTIPLIERS: Record<QuestionType, number> = {
  GREETING:      0.6,
  YES_NO:        0.6,
  HR:            0.9,
  FOLLOW_UP:     0.9,
  CLARIFICATION: 0.8,
  TECHNICAL:     1.2,
  PROJECT:       1.3,
  BEHAVIORAL:    1.4,
  SYSTEM_DESIGN: 1.6,
  UNKNOWN:       1.0,
};

export type SilenceClass =
  | 'SHORT_PAUSE'      // 0–pauseThreshold
  | 'THINKING_PAUSE'   // pauseThreshold–candidateCompletion
  | 'POSSIBLE_END'     // candidateCompletion–hardSilence
  | 'CONFIRMED_SILENT' // > hardSilence

export type TurnDecision =
  | 'WAIT_FOR_USER'         // User hasn't spoken yet / AI just finished
  | 'USER_IS_SPEAKING'      // Active speech — never ask next question
  | 'WAIT_FOR_STT'          // VAD ended but STT not finalised
  | 'WAIT_LONGER'           // Answer likely incomplete — keep waiting
  | 'ANSWER_COMPLETE'       // Ready to transition — fire next question
  | 'NO_ANSWER_RECOVERY'    // Long silence, no transcript — gentle nudge
  | 'INTERRUPT_AI'          // User spoke while AI was speaking

export interface TurnSignals {
  /** True if VAD reports active speech right now */
  vadSpeechActive: boolean;
  /** True if AI audio is currently playing */
  aiSpeaking: boolean;
  /** Ms since last VAD speech frame */
  silenceDurationMs: number;
  /** Total ms user has spoken in this turn */
  speechDurationMs: number;
  /** Current accumulated STT text (may be partial) */
  partialTranscript: string;
  /** True once Gemini Live has sent a final inputTranscription */
  sttFinalised: boolean;
  /** True while the 600ms post-turn finalization window is open */
  transcriptFinalizationOpen: boolean;
  /** Completion analysis result (from AnswerCompletionAnalyzer) */
  answerCompletion: AnswerCompletionState;
  /** Question type — affects silence tolerance */
  questionType: QuestionType;
  /** True if a question generation is already in progress */
  questionGenerationPending: boolean;
  /** True if the current question has already been asked/delivered */
  questionAlreadyAsked: boolean;
  /** True once session ending has been requested */
  sessionEnding: boolean;
}

export type AnswerCompletionState =
  | 'UNKNOWN'
  | 'INCOMPLETE'
  | 'LIKELY_COMPLETE'
  | 'COMPLETE'
  | 'NO_ANSWER';

export interface TurnDecisionResult {
  decision: TurnDecision;
  reason: string;
  silenceClass: SilenceClass;
  /** Adjusted silence thresholds for this question type */
  thresholds: {
    pause: number;
    completion: number;
    hard: number;
  };
}

export class TurnTakingEngine {
  private _config: TurnTakingConfig;

  constructor(config: Partial<TurnTakingConfig> = {}) {
    this._config = { ...DEFAULT_CONFIG, ...config };
  }

  updateConfig(patch: Partial<TurnTakingConfig>): void {
    this._config = { ...this._config, ...patch };
  }

  /**
   * Primary evaluation method.
   * Call this whenever a signal changes (VAD frame, STT event, timer tick).
   * It is PURE — same inputs → same output. No side-effects.
   */
  evaluate(signals: TurnSignals): TurnDecisionResult {
    const mult = QUESTION_TYPE_MULTIPLIERS[signals.questionType] ?? 1.0;
    const thresholds = {
      pause:      Math.round(this._config.pauseThresholdMs              * mult),
      completion: Math.round(this._config.candidateCompletionThresholdMs * mult),
      hard:       Math.round(this._config.hardSilenceThresholdMs         * mult),
    };

    const silenceClass = this._classifySilence(signals.silenceDurationMs, thresholds);

    // ── Priority 1: User barge-in (highest priority) ───────────────────────
    if (signals.vadSpeechActive && signals.aiSpeaking) {
      return {
        decision: 'INTERRUPT_AI',
        reason: 'User speech detected while AI is speaking — barge-in required',
        silenceClass,
        thresholds,
      };
    }

    // ── Priority 2: Active user speech — never ask next question ───────────
    if (signals.vadSpeechActive) {
      return {
        decision: 'USER_IS_SPEAKING',
        reason: 'VAD reports active speech — next question forbidden',
        silenceClass,
        thresholds,
      };
    }

    // ── Priority 3: Session ending ─────────────────────────────────────────
    if (signals.sessionEnding) {
      return {
        decision: 'WAIT_FOR_USER',
        reason: 'Session ending — no new question',
        silenceClass,
        thresholds,
      };
    }

    // ── Priority 4: Question already in flight ─────────────────────────────
    if (signals.questionGenerationPending) {
      return {
        decision: 'WAIT_FOR_USER',
        reason: 'Question generation already in progress — duplicate forbidden',
        silenceClass,
        thresholds,
      };
    }

    // ── Priority 5: STT finalisation pending ──────────────────────────────
    if (!signals.sttFinalised && signals.silenceDurationMs < this._config.sttFinalizationTimeoutMs) {
      return {
        decision: 'WAIT_FOR_STT',
        reason: `STT not finalised yet — waiting ${this._config.sttFinalizationTimeoutMs}ms. Silence so far: ${signals.silenceDurationMs}ms`,
        silenceClass,
        thresholds,
      };
    }

    // ── Priority 6: Transcript finalization window ─────────────────────────
    if (signals.transcriptFinalizationOpen) {
      return {
        decision: 'WAIT_FOR_STT',
        reason: '600ms transcript finalization window is open — STT chunks may still arrive',
        silenceClass,
        thresholds,
      };
    }

    // ── Priority 7: AI still speaking (not a barge-in) ────────────────────
    if (signals.aiSpeaking) {
      return {
        decision: 'WAIT_FOR_USER',
        reason: 'AI is speaking — waiting for AI to finish',
        silenceClass,
        thresholds,
      };
    }

    // ── Priority 8: Answer already confirmed complete ──────────────────────
    if (signals.answerCompletion === 'COMPLETE' && !signals.questionAlreadyAsked) {
      if (signals.silenceDurationMs >= this._config.naturalPauseBeforeNextMs) {
        return {
          decision: 'ANSWER_COMPLETE',
          reason: `Answer confirmed COMPLETE. Silence: ${signals.silenceDurationMs}ms. Natural pause elapsed.`,
          silenceClass,
          thresholds,
        };
      }
    }

    // ── Priority 9: Hard silence with no answer ────────────────────────────
    const hasTranscript = signals.partialTranscript.trim().length >= this._config.minAnswerLength;
    if (silenceClass === 'CONFIRMED_SILENT' && !hasTranscript) {
      return {
        decision: 'NO_ANSWER_RECOVERY',
        reason: `Hard silence (${signals.silenceDurationMs}ms) with no transcript — gentle recovery`,
        silenceClass,
        thresholds,
      };
    }

    // ── Priority 10: Silence-based completion analysis ────────────────────
    if (silenceClass === 'CONFIRMED_SILENT' && hasTranscript) {
      return {
        decision: 'ANSWER_COMPLETE',
        reason: `Hard silence (${signals.silenceDurationMs}ms) with transcript — treating as complete`,
        silenceClass,
        thresholds,
      };
    }

    if (silenceClass === 'POSSIBLE_END') {
      if (signals.answerCompletion === 'LIKELY_COMPLETE' && hasTranscript) {
        return {
          decision: 'ANSWER_COMPLETE',
          reason: `Silence ${signals.silenceDurationMs}ms + LIKELY_COMPLETE analysis + has transcript`,
          silenceClass,
          thresholds,
        };
      }
      return {
        decision: 'WAIT_LONGER',
        reason: `Silence ${signals.silenceDurationMs}ms — possible end but answer not confirmed (completion=${signals.answerCompletion})`,
        silenceClass,
        thresholds,
      };
    }

    if (silenceClass === 'THINKING_PAUSE') {
      return {
        decision: 'WAIT_LONGER',
        reason: `Silence ${signals.silenceDurationMs}ms — candidate thinking/pausing, threshold=${thresholds.completion}ms`,
        silenceClass,
        thresholds,
      };
    }

    // SHORT_PAUSE or < pauseThreshold
    return {
      decision: 'WAIT_FOR_USER',
      reason: `Short silence (${signals.silenceDurationMs}ms < ${thresholds.pause}ms) — waiting`,
      silenceClass,
      thresholds,
    };
  }

  private _classifySilence(silenceMs: number, thresholds: { pause: number; completion: number; hard: number }): SilenceClass {
    if (silenceMs >= thresholds.hard)       return 'CONFIRMED_SILENT';
    if (silenceMs >= thresholds.completion) return 'POSSIBLE_END';
    if (silenceMs >= thresholds.pause)      return 'THINKING_PAUSE';
    return 'SHORT_PAUSE';
  }

  /** Returns the adjusted thresholds for a given question type */
  thresholdsFor(questionType: QuestionType): TurnTakingConfig {
    const mult = QUESTION_TYPE_MULTIPLIERS[questionType] ?? 1.0;
    return {
      ...this._config,
      pauseThresholdMs:               Math.round(this._config.pauseThresholdMs              * mult),
      candidateCompletionThresholdMs: Math.round(this._config.candidateCompletionThresholdMs * mult),
      hardSilenceThresholdMs:         Math.round(this._config.hardSilenceThresholdMs         * mult),
    };
  }

  toJSON() {
    return { config: this._config };
  }
}
