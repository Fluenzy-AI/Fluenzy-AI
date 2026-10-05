// ─── FluenzyAI — AnswerCompletionAnalyzer ───────────────────────────────────
// Lightweight semantic answer-completion analysis.
//
// Design:
//   • Pure class — no network calls, no LLM, no side-effects
//   • Runs locally in < 1ms — safe to call on every STT update
//   • Uses heuristic signals: transcript structure, speech duration,
//     silence duration, sentence completeness, question type
//   • LLM-based deep analysis is a SEPARATE optional layer (not here)
//
// This answers: "Has the candidate probably finished answering?"
// It does NOT replace VAD or STT — it is one input to TurnTakingEngine.

import { QuestionType, AnswerCompletionState } from './TurnTakingEngine';

export interface CompletionInput {
  question:        string;
  transcript:      string;
  speechDurationMs: number;
  silenceDurationMs: number;
  questionType:    QuestionType;
  sttFinalised:    boolean;
}

export interface CompletionResult {
  state:      AnswerCompletionState;
  confidence: number;          // 0.0 – 1.0
  reason:     string;
  signals: {
    length:         number;   // transcript char count
    wordCount:      number;
    sentenceEnds:   boolean;  // ends with . ! ?
    hasSubstance:   boolean;  // > minAnswerLength chars
    longEnough:     boolean;  // speechDuration > threshold
    silenctEnough:  boolean;  // silenceDuration > threshold
  };
}

// Sentence-ending punctuation patterns
const SENTENCE_END_RE = /[.!?]\s*$/;

// Patterns that suggest the answer is still being formed
const CONTINUATION_MARKERS_RE = /\b(and|but|also|however|because|since|although|moreover|furthermore|additionally|so|then|like|basically|actually|you know|i mean|well|uh|um|err)\s*$/i;

// Patterns that often mark answer completion
const COMPLETION_MARKERS_RE = /\b(that('s| is) (all|it)|hope that (answers|helps)|to summarize|in conclusion|so yeah|so that('s| is)|thank you|done)\b/i;

// Minimum char counts per question type to be considered "substantive"
const MIN_CHARS_BY_TYPE: Record<QuestionType, number> = {
  GREETING:      10,
  YES_NO:        5,
  FOLLOW_UP:     30,
  CLARIFICATION: 20,
  HR:            50,
  TECHNICAL:     80,
  PROJECT:       80,
  BEHAVIORAL:    100,
  SYSTEM_DESIGN: 120,
  UNKNOWN:       40,
};

// Minimum speech duration per question type (ms)
const MIN_SPEECH_MS_BY_TYPE: Record<QuestionType, number> = {
  GREETING:      500,
  YES_NO:        300,
  FOLLOW_UP:     1500,
  CLARIFICATION: 1000,
  HR:            3000,
  TECHNICAL:     4000,
  PROJECT:       4000,
  BEHAVIORAL:    5000,
  SYSTEM_DESIGN: 6000,
  UNKNOWN:       2000,
};

export class AnswerCompletionAnalyzer {

  analyze(input: CompletionInput): CompletionResult {
    const { transcript, speechDurationMs, silenceDurationMs, questionType, sttFinalised } = input;
    const text  = transcript.trim();
    const chars = text.length;
    const words = text ? text.split(/\s+/).length : 0;

    const minChars     = MIN_CHARS_BY_TYPE[questionType]    ?? 40;
    const minSpeechMs  = MIN_SPEECH_MS_BY_TYPE[questionType] ?? 2000;

    const signals = {
      length:        chars,
      wordCount:     words,
      sentenceEnds:  SENTENCE_END_RE.test(text),
      hasSubstance:  chars >= minChars,
      longEnough:    speechDurationMs >= minSpeechMs,
      silenctEnough: silenceDurationMs >= 1500,
    };

    // ── No answer at all ───────────────────────────────────────────────────
    if (!text) {
      return {
        state: 'NO_ANSWER',
        confidence: 0.9,
        reason: 'Transcript is empty — no speech captured',
        signals,
      };
    }

    // ── Very short answer for simple question types ────────────────────────
    if ((questionType === 'YES_NO' || questionType === 'GREETING') && chars >= 3) {
      return {
        state: 'COMPLETE',
        confidence: 0.85,
        reason: `${questionType} question — short answer acceptable (${chars} chars)`,
        signals,
      };
    }

    // ── Explicit completion markers ────────────────────────────────────────
    if (COMPLETION_MARKERS_RE.test(text) && signals.hasSubstance) {
      return {
        state: 'COMPLETE',
        confidence: 0.92,
        reason: 'Completion marker detected in transcript',
        signals,
      };
    }

    // ── Continuation detected — answer likely still forming ───────────────
    if (CONTINUATION_MARKERS_RE.test(text)) {
      return {
        state: 'INCOMPLETE',
        confidence: 0.80,
        reason: 'Transcript ends with continuation word — candidate still forming answer',
        signals,
      };
    }

    // ── STT finalised + sentence ends + has substance ─────────────────────
    if (sttFinalised && signals.sentenceEnds && signals.hasSubstance && signals.longEnough) {
      return {
        state: 'COMPLETE',
        confidence: 0.88,
        reason: 'STT finalised + sentence ending + substantive length + sufficient speech duration',
        signals,
      };
    }

    // ── STT finalised + has substance + enough silence ────────────────────
    if (sttFinalised && signals.hasSubstance && signals.silenctEnough) {
      return {
        state: 'LIKELY_COMPLETE',
        confidence: 0.72,
        reason: 'STT finalised + substantive answer + enough silence — likely complete',
        signals,
      };
    }

    // ── Has substance + sentence ends (STT not yet final) ─────────────────
    if (signals.hasSubstance && signals.sentenceEnds && signals.longEnough) {
      return {
        state: 'LIKELY_COMPLETE',
        confidence: 0.65,
        reason: 'Substantive answer ends with sentence punctuation',
        signals,
      };
    }

    // ── Has content but not enough yet ────────────────────────────────────
    if (signals.hasSubstance && !signals.longEnough) {
      return {
        state: 'INCOMPLETE',
        confidence: 0.70,
        reason: `Answer has ${chars} chars but speech duration ${speechDurationMs}ms < ${minSpeechMs}ms minimum`,
        signals,
      };
    }

    if (!signals.hasSubstance) {
      return {
        state: 'INCOMPLETE',
        confidence: 0.65,
        reason: `Answer too short: ${chars} chars < ${minChars} minimum for ${questionType}`,
        signals,
      };
    }

    return {
      state: 'UNKNOWN',
      confidence: 0.40,
      reason: 'Insufficient signals to determine completion',
      signals,
    };
  }
}
