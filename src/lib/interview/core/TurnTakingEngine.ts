// ─── FluenzyAI — TurnTakingEngine ────────────────────────────────────────────
// Multi-signal deterministic turn-taking decision engine.
//
// Design:
//   • Pure class — no React, no DOM, no side-effects
//   • Accepts signals from VAD, STT, audio playback, AcousticSourceIntelligence
//   • Outputs a typed Decision every time evaluate() is called
//   • Never uses a single timer as the decision engine
//   • All thresholds configurable per question type
//
// Signal priority (highest → lowest):
//   1.  Candidate barge-in (high-confidence acoustic speech during AI playback)
//   1b. Background audio during AI playback → KEEP AI PLAYING
//   2.  Active candidate speech (acoustic or VAD)
//   3.  Background speech/audio detected → ignore, keep waiting
//   4.  Acoustic calibrating → conservative fallback
//   5.  Session ending
//   6.  Generation lock (duplicate prevention)
//   7.  STT finalisation pending
//   8.  Transcript finalization window (600ms)
//   9.  AI still speaking
//   10. Answer confirmed complete
//   11. Hard silence + no transcript → recovery
//   12. Silence classification fallback

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
  | 'WAIT_FOR_USER'                  // User hasn't spoken yet / AI just finished
  | 'USER_IS_SPEAKING'               // Active candidate speech — next question forbidden
  | 'WAIT_FOR_STT'                   // VAD ended but STT not finalised
  | 'WAIT_LONGER'                    // Answer likely incomplete — keep waiting
  | 'ANSWER_COMPLETE'                // Ready to transition — fire next question
  | 'NO_ANSWER_RECOVERY'             // Long silence, no transcript — gentle nudge
  | 'INTERRUPT_AI'                   // High-confidence candidate barge-in
  | 'CANDIDATE_BARGE_IN'             // Alias for INTERRUPT_AI (acoustic layer term)
  | 'BACKGROUND_SPEECH_IGNORED'      // Background/distant speech — ignore, keep waiting
  | 'BACKGROUND_AUDIO_ONLY'          // Music / env noise only — not advancing turn
  | 'WAIT_FOR_SOURCE_CLASSIFICATION' // Acoustic engine still calibrating

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

  // ── Acoustic Source Intelligence signals (from AcousticSourceIntelligenceEngine) ──
  /** Candidate speech confidence 0..1. null = ASIE unavailable → fallback to VAD */
  candidateSpeechConfidence?: number | null;
  /** True when acoustic layer detects background/distant speech */
  backgroundSpeechDetected?: boolean;
  /** True when acoustic layer detects background non-speech audio (music, env noise) */
  backgroundAudioDetected?: boolean;
  /** True while acoustic layer is still calibrating (noise floor not ready) */
  isCalibrating?: boolean;
  /** Raw acoustic source class from BackgroundAudioClassifier */
  acousticSource?: string;
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
   * Pure — same inputs → same output. No side-effects.
   *
   * Priority chain (12 levels):
   *   1.  Candidate barge-in (high-confidence acoustic during AI)
   *   1b. Background audio during AI → KEEP AI PLAYING
   *   2.  Active candidate speech
   *   3.  Background speech/audio (ignore)
   *   4.  ASIE calibrating
   *   5.  Session ending
   *   6.  Generation lock
   *   7.  STT pending
   *   8.  Transcript finalization window
   *   9.  AI speaking
   *   10. Answer complete
   *   11. No-answer recovery
   *   12. Silence classification
   */
  evaluate(signals: TurnSignals): TurnDecisionResult {
    const mult = QUESTION_TYPE_MULTIPLIERS[signals.questionType] ?? 1.0;
    const thresholds = {
      pause:      Math.round(this._config.pauseThresholdMs              * mult),
      completion: Math.round(this._config.candidateCompletionThresholdMs * mult),
      hard:       Math.round(this._config.hardSilenceThresholdMs         * mult),
    };

    const silenceClass = this._classifySilence(signals.silenceDurationMs, thresholds);

    // Resolve effective candidate-speaking flag.
    // ASIE takes priority over raw VAD when available and calibrated.
    const hasAcoustic      = signals.candidateSpeechConfidence != null && !signals.isCalibrating;
    const acousticConf     = signals.candidateSpeechConfidence ?? 0;
    const candidateSpeaking = hasAcoustic
      ? (acousticConf >= 0.55)
      : signals.vadSpeechActive;

    const backgroundSpeech = signals.backgroundSpeechDetected ?? false;
    const backgroundAudio  = signals.backgroundAudioDetected  ?? false;

    // ── Priority 1: Candidate BARGE-IN ────────────────────────────────────
    // ONLY stop AI for HIGH-CONFIDENCE candidate speech.
    // Background noise/speech must NEVER trigger barge-in.
    if (signals.aiSpeaking && candidateSpeaking) {
      const bargeInConf = hasAcoustic ? acousticConf : (signals.vadSpeechActive ? 0.80 : 0);
      if (bargeInConf >= 0.68) {
        return {
          decision: 'INTERRUPT_AI',
          reason:   `Candidate barge-in: confidence=${bargeInConf.toFixed(2)} >= 0.68 — stopping AI`,
          silenceClass,
          thresholds,
        };
      }
    }

    // ── Priority 1b: Background audio while AI plays → KEEP AI PLAYING ───
    if (signals.aiSpeaking && (backgroundSpeech || backgroundAudio)) {
      return {
        decision: 'WAIT_FOR_USER',
        reason:   `AI playing + background audio (${signals.acousticSource ?? 'unknown'}) — keeping AI playing`,
        silenceClass,
        thresholds,
      };
    }

    // ── Priority 2: Active candidate speech — next question FORBIDDEN ──────
    if (candidateSpeaking) {
      return {
        decision: 'USER_IS_SPEAKING',
        reason:   hasAcoustic
          ? `Acoustic: candidateConf=${acousticConf.toFixed(2)} >= 0.55 — next question forbidden`
          : 'VAD reports active speech — next question forbidden',
        silenceClass,
        thresholds,
      };
    }

    // ── Priority 3: Background speech/audio — ignore, DO NOT advance turn ──
    // INVARIANT: background speech must NEVER trigger ANSWER_COMPLETE
    if (backgroundSpeech) {
      return {
        decision: 'BACKGROUND_SPEECH_IGNORED',
        reason:   `Background/distant speech detected (source=${signals.acousticSource ?? 'BACKGROUND_SPEECH'}) — not candidate`,
        silenceClass,
        thresholds,
      };
    }
    if (backgroundAudio) {
      return {
        decision: 'BACKGROUND_AUDIO_ONLY',
        reason:   `Background audio only (source=${signals.acousticSource ?? 'BACKGROUND_AUDIO'}) — not advancing turn`,
        silenceClass,
        thresholds,
      };
    }

    // ── Priority 4: ASIE calibrating ──────────────────────────────────────
    if (signals.isCalibrating) {
      return {
        decision: 'WAIT_FOR_SOURCE_CLASSIFICATION',
        reason:   'Acoustic engine calibrating — conservative VAD-only mode active',
        silenceClass,
        thresholds,
      };
    }

    // ── Priority 5: Session ending ─────────────────────────────────────────
    if (signals.sessionEnding) {
      return {
        decision: 'WAIT_FOR_USER',
        reason:   'Session ending — no new question',
        silenceClass,
        thresholds,
      };
    }

    // ── Priority 6: Question already in flight ─────────────────────────────
    if (signals.questionGenerationPending) {
      return {
        decision: 'WAIT_FOR_USER',
        reason:   'Question generation already in progress — duplicate forbidden',
        silenceClass,
        thresholds,
      };
    }

    // ── Priority 7: STT finalisation pending ──────────────────────────────
    if (!signals.sttFinalised && signals.silenceDurationMs < this._config.sttFinalizationTimeoutMs) {
      return {
        decision: 'WAIT_FOR_STT',
        reason:   `STT not finalised yet — waiting ${this._config.sttFinalizationTimeoutMs}ms. Silence: ${signals.silenceDurationMs}ms`,
        silenceClass,
        thresholds,
      };
    }

    // ── Priority 8: Transcript finalization window ─────────────────────────
    if (signals.transcriptFinalizationOpen) {
      return {
        decision: 'WAIT_FOR_STT',
        reason:   '600ms transcript finalization window open — STT chunks may still arrive',
        silenceClass,
        thresholds,
      };
    }

    // ── Priority 9: AI still speaking (not a barge-in) ────────────────────
    if (signals.aiSpeaking) {
      return {
        decision: 'WAIT_FOR_USER',
        reason:   'AI is speaking — waiting for AI to finish',
        silenceClass,
        thresholds,
      };
    }

    // ── Priority 10: Answer confirmed complete ─────────────────────────────
    if (signals.answerCompletion === 'COMPLETE' && !signals.questionAlreadyAsked) {
      if (signals.silenceDurationMs >= this._config.naturalPauseBeforeNextMs) {
        return {
          decision: 'ANSWER_COMPLETE',
          reason:   `Answer COMPLETE. Silence: ${signals.silenceDurationMs}ms. Natural pause elapsed.`,
          silenceClass,
          thresholds,
        };
      }
    }

    // ── Priority 11: Hard silence with no answer ───────────────────────────
    const hasTranscript = signals.partialTranscript.trim().length >= this._config.minAnswerLength;
    if (silenceClass === 'CONFIRMED_SILENT' && !hasTranscript) {
      return {
        decision: 'NO_ANSWER_RECOVERY',
        reason:   `Hard silence (${signals.silenceDurationMs}ms) with no transcript — gentle recovery`,
        silenceClass,
        thresholds,
      };
    }

    // ── Priority 12: Silence-based completion analysis ────────────────────
    if (silenceClass === 'CONFIRMED_SILENT' && hasTranscript) {
      return {
        decision: 'ANSWER_COMPLETE',
        reason:   `Hard silence (${signals.silenceDurationMs}ms) with transcript — treating as complete`,
        silenceClass,
        thresholds,
      };
    }

    if (silenceClass === 'POSSIBLE_END') {
      if (signals.answerCompletion === 'LIKELY_COMPLETE' && hasTranscript) {
        return {
          decision: 'ANSWER_COMPLETE',
          reason:   `Silence ${signals.silenceDurationMs}ms + LIKELY_COMPLETE + has transcript`,
          silenceClass,
          thresholds,
        };
      }
      return {
        decision: 'WAIT_LONGER',
        reason:   `Silence ${signals.silenceDurationMs}ms — possible end, answer not confirmed (completion=${signals.answerCompletion})`,
        silenceClass,
        thresholds,
      };
    }

    if (silenceClass === 'THINKING_PAUSE') {
      return {
        decision: 'WAIT_LONGER',
        reason:   `Silence ${signals.silenceDurationMs}ms — candidate thinking, threshold=${thresholds.completion}ms`,
        silenceClass,
        thresholds,
      };
    }

    // SHORT_PAUSE
    return {
      decision: 'WAIT_FOR_USER',
      reason:   `Short silence (${signals.silenceDurationMs}ms < ${thresholds.pause}ms) — waiting`,
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
